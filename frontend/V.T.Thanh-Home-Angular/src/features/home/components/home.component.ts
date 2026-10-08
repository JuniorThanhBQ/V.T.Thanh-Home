import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeShaderService } from '@/features/home/services/home-shader.service';
import { TranslationService } from '@/shared/services/translation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: '../templates/home.component.html',
  providers: [HomeShaderService],
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;
  private shaderService = inject(HomeShaderService);
  public i18n = inject(TranslationService);

  ngAfterViewInit(): void {
    this.shaderService.init(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.shaderService.destroy();
  }
}
