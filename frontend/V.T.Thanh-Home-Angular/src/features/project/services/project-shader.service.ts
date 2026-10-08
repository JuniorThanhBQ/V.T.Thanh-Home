import { Injectable, NgZone, inject } from '@angular/core';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

@Injectable()
export class ProjectShaderService {
  private ngZone = inject(NgZone);
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private nodes: Node[] = [];
  private mouse = { x: -1000, y: -1000 };

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();

    const nodeCount = Math.min(Math.floor(window.innerWidth / 18), 75);
    this.nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 1.5 + 1.2,
    }));

    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);

    this.ngZone.runOutsideAngular(() => this.animate());
  }

  destroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
  }

  private onResize = () => this.resize();
  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  };

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private animate = () => {
    const isDark = document.documentElement.classList.contains('dark');
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const maxDist = 130;
    const nodeColor = isDark ? 'rgba(41, 87, 112, 0.7)' : 'rgba(100, 149, 237, 0.6)';
    const lineColor = isDark ? '41, 87, 112' : '100, 149, 237';

    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      a.x += a.vx;
      a.y += a.vy;

      if (a.x < 0 || a.x > this.canvas.width) a.vx *= -1;
      if (a.y < 0 || a.y > this.canvas.height) a.vy *= -1;

      // Mouse repulsion
      const dx = a.x - this.mouse.x;
      const dy = a.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        a.x += (dx / dist) * 1.2;
        a.y += (dy / dist) * 1.2;
      }

      this.ctx.fillStyle = nodeColor;
      this.ctx.beginPath();
      this.ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      this.ctx.fill();

      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxDist) {
          const alpha = (1 - d / maxDist) * (isDark ? 0.35 : 0.25);
          this.ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.stroke();
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
