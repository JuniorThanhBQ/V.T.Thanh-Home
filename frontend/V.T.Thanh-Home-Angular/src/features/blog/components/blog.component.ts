import { Component, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { CommingSoonComponent } from '@/shared/components/comming-soon/comming-soon.component';
import { BlogShaderService } from '../services/blog-shader.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, CommingSoonComponent],
  providers: [BlogShaderService],
  template: `
    <section class="relative min-h-[75vh] flex items-center justify-center py-12 overflow-hidden">
      <canvas #bgCanvas class="fixed inset-0 w-full h-full pointer-events-none z-0"></canvas>
      <div class="relative z-10 w-full max-w-4xl mx-auto">
        <app-comming-soon [title]="i18n.t('blog.title')" [subtitle]="i18n.t('blog.subtitle')" />
      </div>
    </section>
  `,
})
export class BlogComponent implements AfterViewInit, OnDestroy {
  public i18n = inject(TranslationService);
  private shaderService = inject(BlogShaderService);

  @ViewChild('bgCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    if (this.canvasRef?.nativeElement) {
      this.shaderService.init(this.canvasRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.shaderService.destroy();
  }
}
