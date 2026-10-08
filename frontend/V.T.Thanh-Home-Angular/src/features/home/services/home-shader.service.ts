import { Injectable, NgZone, inject } from '@angular/core';
import * as THREE from 'three';

@Injectable()
export class HomeShaderService {
  private ngZone = inject(NgZone);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private material!: THREE.ShaderMaterial;
  private mesh!: THREE.Mesh;
  private animationFrameId: number | null = null;

  private mouseTarget = { x: 0, y: 0 };
  private mouseCurrent = { x: 0, y: 0 };
  private clock = new THREE.Clock();

  private themeObserver!: MutationObserver;

  init(canvas: HTMLCanvasElement): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;

    float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 center = vec2(0.5) + u_mouse * 0.08;
    float vignette = smoothstep(1.2, 0.2, length(uv - center));

    vec3 base = mix(u_colorB, u_colorA, vignette);

    vec2 offset = vec2(0.002, 0.0) * (1.0 + length(u_mouse));
    float noiseR = random(uv + offset + fract(u_time * 0.05));
    float noiseG = random(uv + fract(u_time * 0.05));
    float noiseB = random(uv - offset + fract(u_time * 0.05));

    vec3 grain = vec3(noiseR, noiseG, noiseB) * 0.055;
    gl_FragColor = vec4(base + grain, 1.0);
    }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(width, height) },
        u_mouse: { value: new THREE.Vector2(0, 0) },
        u_colorA: { value: new THREE.Vector3(0.09, 0.18, 0.26) },
        u_colorB: { value: new THREE.Vector3(0.04, 0.08, 0.14) },
        u_colorC: { value: new THREE.Vector3(0.16, 0.34, 0.44) },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.setupListeners();
    this.setupThemeObserver();
    this.updateThemeColors();

    this.ngZone.runOutsideAngular(() => {
      this.animate();
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

    if (this.mesh) {
      this.mesh.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private setupListeners(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  private onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.material.uniforms['u_resolution'].value.set(width, height);
  };

  private onMouseMove = (event: MouseEvent): void => {
    this.mouseTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseTarget.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  private setupThemeObserver(): void {
    this.themeObserver = new MutationObserver(() => {
      this.updateThemeColors();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private updateThemeColors(): void {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      this.material.uniforms['u_colorA'].value.set(0.09, 0.18, 0.26);
      this.material.uniforms['u_colorB'].value.set(0.03, 0.06, 0.09);
      this.material.uniforms['u_colorC'].value.set(0.16, 0.34, 0.44);
    } else {
      this.material.uniforms['u_colorA'].value.set(0.91, 0.95, 1.0);
      this.material.uniforms['u_colorB'].value.set(0.72, 0.84, 1.0);
      this.material.uniforms['u_colorC'].value.set(0.85, 0.92, 0.98);
    }
  }

  private animate = (): void => {
    this.mouseCurrent.x += (this.mouseTarget.x - this.mouseCurrent.x) * 0.05;
    this.mouseCurrent.y += (this.mouseTarget.y - this.mouseCurrent.y) * 0.05;

    this.material.uniforms['u_time'].value = this.clock.getElapsedTime();
    this.material.uniforms['u_mouse'].value.set(this.mouseCurrent.x, this.mouseCurrent.y);

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
