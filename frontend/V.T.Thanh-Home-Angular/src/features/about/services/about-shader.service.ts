import { Injectable, NgZone, inject } from '@angular/core';

@Injectable()
export class AboutShaderService {
  private ngZone = inject(NgZone);

  private canvas!: HTMLCanvasElement;
  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private positionBuffer!: WebGLBuffer;
  private vertexShader!: WebGLShader;
  private fragmentShader!: WebGLShader;

  private positionAttributeLocation!: number;
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

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_dark_mode;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = -1.0 + 2.0 * uv;
        p.x *= u_resolution.x / u_resolution.y;

        for(float i = 1.0; i < 4.0; i++) {
          p.x += 0.3 / i * sin(i * 3.0 * p.y + u_time * 0.4 + u_mouse.x * 0.8);
          p.y += 0.3 / i * cos(i * 3.0 * p.x + u_time * 0.3 + u_mouse.y * 0.8);
        }

        float intensity = 0.5 + 0.5 * sin(p.x + p.y + u_time * 0.5);

        vec3 color1 = mix(vec3(0.91, 0.95, 1.00), vec3(0.03, 0.06, 0.09), u_dark_mode);
        vec3 color2 = mix(vec3(0.72, 0.84, 1.00), vec3(0.09, 0.18, 0.26), u_dark_mode);
        vec3 color3 = mix(vec3(0.85, 0.92, 0.98), vec3(0.16, 0.34, 0.44), u_dark_mode);

        vec3 color = mix(color1, color2, intensity);
        float mix3_strength = mix(0.40, 0.25, u_dark_mode);
        color = mix(color, color3, mix3_strength * cos(p.x - p.y + u_time * 0.4));

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const vShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vShader || !fShader) return;
    this.vertexShader = vShader;
    this.fragmentShader = fShader;

    const prog = this.gl.createProgram();
    if (!prog) return;
    this.program = prog;

    this.gl.attachShader(this.program, this.vertexShader);
    this.gl.attachShader(this.program, this.fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      this.gl.deleteProgram(this.program);
      return;
    }

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'position');
    this.timeUniformLocation = this.gl.getUniformLocation(this.program, 'u_time')!;
    this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, 'u_resolution')!;
    this.mouseUniformLocation = this.gl.getUniformLocation(this.program, 'u_mouse')!;
    this.darkModeUniformLocation = this.gl.getUniformLocation(this.program, 'u_dark_mode')!;

    const buf = this.gl.createBuffer();
    if (!buf) return;
    this.positionBuffer = buf;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    this.targetDarkMode = document.documentElement.classList.contains('dark') ? 1.0 : 0.0;
    this.currentDarkMode = this.targetDarkMode;

    this.resizeCanvas();
    this.setupListeners();
    this.setupThemeObserver();

    this.ngZone.runOutsideAngular(() => {
      this.render();
    });
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);

    if (this.gl) {
      if (this.positionBuffer) {
        this.gl.deleteBuffer(this.positionBuffer);
      }
      if (this.vertexShader) {
        this.gl.deleteShader(this.vertexShader);
      }
      if (this.fragmentShader) {
        this.gl.deleteShader(this.fragmentShader);
      }
      if (this.program) {
        this.gl.deleteProgram(this.program);
      }
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private resizeCanvas = (): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };

  private onResize = (): void => {
    this.resizeCanvas();
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.targetMouse.x = (e.clientX - rect.left) / rect.width;
    this.targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
  };

  private setupListeners(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  private setupThemeObserver(): void {
    this.themeObserver = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      this.targetDarkMode = isDark ? 1.0 : 0.0;
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private render = (): void => {
    const elapsed = (Date.now() - this.startTime) / 1000.0;

    this.currentMouse.x += (this.targetMouse.x - this.currentMouse.x) * 0.08;
    this.currentMouse.y += (this.targetMouse.y - this.currentMouse.y) * 0.08;

    this.currentDarkMode += (this.targetDarkMode - this.currentDarkMode) * 0.08;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);

    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.uniform1f(this.timeUniformLocation, elapsed);
    this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.mouseUniformLocation, this.currentMouse.x, this.currentMouse.y);
    this.gl.uniform1f(this.darkModeUniformLocation, this.currentDarkMode);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.animationFrameId = requestAnimationFrame(this.render);
  };
}
