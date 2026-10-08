import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';
import { AboutShaderService } from '../services/about-shader.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: '../templates/about.component.html',
  providers: [AboutShaderService],
})
export class AboutComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  public readonly avatarUrls = AVATAR_URLS;
  public i18n = inject(TranslationService);
  private shaderService = inject(AboutShaderService);

  public isCvOpen = false;
  public currentPage = 1;
  public zoomLevel = 1.0;

  ngAfterViewInit(): void {
    this.shaderService.init(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.shaderService.destroy();
    document.body.style.overflow = '';
  }

  public openCvViewer(): void {
    this.isCvOpen = true;
    this.currentPage = 1;
    this.zoomLevel = 1.0;
    document.body.style.overflow = 'hidden';
  }

  public closeCvViewer(): void {
    this.isCvOpen = false;
    this.zoomLevel = 1.0;
    document.body.style.overflow = '';
  }

  public setPage(page: number): void {
    if (page >= 1 && page <= 2) {
      this.currentPage = page;
      this.zoomLevel = 1.0;
    }
  }

  public nextPage(): void {
    if (this.currentPage < 2) {
      this.currentPage++;
      this.zoomLevel = 1.0;
    }
  }

  public prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.zoomLevel = 1.0;
    }
  }

  public toggleZoom(): void {
    this.zoomLevel = this.zoomLevel === 1.0 ? 1.35 : 1.0;
  }

  @HostListener('window:keydown', ['$event'])
  public handleKeyDown(event: KeyboardEvent): void {
    if (!this.isCvOpen) return;

    if (event.key === 'Escape') {
      this.closeCvViewer();
    } else if (event.key === 'ArrowRight') {
      this.nextPage();
    } else if (event.key === 'ArrowLeft') {
      this.prevPage();
    }
  }
}