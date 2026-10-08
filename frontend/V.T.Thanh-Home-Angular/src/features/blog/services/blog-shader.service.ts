const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_dark_mode;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  vec3 lightBase = vec3(0.985, 0.982, 0.975);
  vec3 darkBase = vec3(0.045, 0.07, 0.115);
  vec3 baseColor = mix(lightBase, darkBase, u_dark_mode);

  float grain = (hash(gl_FragCoord.xy + fract(u_time * 0.05)) - 0.5) * 0.035;

  vec2 centerOffset = uv - 0.5;
  float vignette = smoothstep(0.85, 0.2, length(centerOffset));
  float vigStrength = mix(0.10, 0.22, u_dark_mode);

  vec2 mouseGl = vec2(u_mouse.x, u_resolution.y - u_mouse.y);
  float mouseDist = length((gl_FragCoord.xy - mouseGl) / u_resolution.y);
  float spotlight = smoothstep(0.48, 0.0, mouseDist);
  vec3 spotColor = mix(vec3(1.0, 0.99, 0.97) * 0.04, vec3(0.22, 0.55, 0.95) * 0.07, u_dark_mode);

  float marginDist = abs(uv.x - 0.5);
  float marginGuide = smoothstep(0.001, 0.0, abs(marginDist - 0.38));
  float marginAlpha = mix(0.02, 0.035, u_dark_mode);

  vec3 color = baseColor + grain;
  color = mix(color * (1.0 - vigStrength), color, vignette);
  color += spotColor * spotlight;
  color = mix(color, mix(vec3(0.7), vec3(0.3), u_dark_mode), marginGuide * marginAlpha);

  gl_FragColor = vec4(color, 1.0);
}
`;

import { Injectable, NgZone, inject } from '@angular/core';

@Injectable()
export class BlogShaderService {
  private ngZone = inject(NgZone);

  private canvas!: HTMLCanvasElement;
  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;

  private timeUniformLocation!: WebGLUniformLocation;
  private resolutionUniformLocation!: WebGLUniformLocation;
  private mouseUniformLocation!: WebGLUniformLocation;
  private darkModeUniformLocation!: WebGLUniformLocation;

  private animationFrameId: number | null = null;
  private startTime = Date.now();

  private targetMouse = { x: 0, y: 0 };
  private currentMouse = { x: 0, y: 0 };

  private targetDarkMode = 0;
  private currentDarkMode = 0;

  private themeObserver!: MutationObserver;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const glContext = this.canvas.getContext('webgl');
    if (!glContext) return;
    this.gl = glContext;

    this.initShaders();
    this.initBuffers();
    this.updateTheme();
    this.setupThemeObserver();

    this.currentMouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    this.targetMouse = { ...this.currentMouse };

    this.resize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);

    this.ngZone.runOutsideAngular(() => this.render());
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  private onResize = (): void => this.resize();

  private onMouseMove = (event: MouseEvent): void => {
    this.targetMouse.x = event.clientX;
    this.targetMouse.y = event.clientY;
  };

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private updateTheme(): void {
    this.targetDarkMode = document.documentElement.classList.contains('dark') ? 1.0 : 0.0;
  }

  private setupThemeObserver(): void {
    this.themeObserver = new MutationObserver(() => this.updateTheme());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private initShaders(): void {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)!;
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)!;

    this.program = this.gl.createProgram()!;
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    this.gl.useProgram(this.program);

    this.timeUniformLocation = this.gl.getUniformLocation(this.program, 'u_time')!;
    this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, 'u_resolution')!;
    this.mouseUniformLocation = this.gl.getUniformLocation(this.program, 'u_mouse')!;
    this.darkModeUniformLocation = this.gl.getUniformLocation(this.program, 'u_dark_mode')!;
  }

  private initBuffers(): void {
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  }

  private render = (): void => {
    this.currentMouse.x += (this.targetMouse.x - this.currentMouse.x) * 0.05;
    this.currentMouse.y += (this.targetMouse.y - this.currentMouse.y) * 0.05;
    this.currentDarkMode += (this.targetDarkMode - this.currentDarkMode) * 0.05;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;

    this.gl.uniform1f(this.timeUniformLocation, elapsedSeconds);
    this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(
      this.mouseUniformLocation,
      this.currentMouse.x * dpr,
      this.currentMouse.y * dpr,
    );
    this.gl.uniform1f(this.darkModeUniformLocation, this.currentDarkMode);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.animationFrameId = requestAnimationFrame(this.render);
  };
}
