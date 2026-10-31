import {
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  OnDestroy,
  HostListener,
  inject,
  PLATFORM_ID,
  Injector,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
export class AboutComponent implements OnDestroy {
  @ViewChild('bgCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('badgeDialog', { static: true })
  private badgeDialogRef!: ElementRef<HTMLDialogElement>;

  @ViewChild('cvDialog', { static: true })
  private cvDialogRef!: ElementRef<HTMLDialogElement>;

  public readonly avatarUrls = AVATAR_URLS;
  public i18n = inject(TranslationService);
  private platformId = inject(PLATFORM_ID);
  private shaderService = inject(AboutShaderService);

  public isCvOpen = false;
  public isBadgeOpen = false;
  public currentPage = 1;
  public zoomLevel = 1.0;
  private badgePreviousOverflow = '';
  private cvPreviousOverflow = '';
  private readonly injector = inject(Injector);

  constructor() {
    afterNextRender(() => this.shaderService.init(this.canvasRef.nativeElement));
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.badgeDialogRef.nativeElement.open) {
      this.closeBadgeViewer();
    }
    if (this.isCvOpen) this.closeCvViewer();
    this.shaderService.destroy();
    document.body.style.overflow = '';
  }

  public openBadgeViewer(): void {
    const dialog = this.badgeDialogRef.nativeElement;
    if (dialog.open) return;
    this.isBadgeOpen = true;
    this.badgePreviousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }

  public closeBadgeViewer(): void {
    this.badgeDialogRef.nativeElement.close();
  }

  public onBadgeViewerClosed(): void {
    this.isBadgeOpen = false;
    document.body.style.overflow = this.badgePreviousOverflow;
  }

  @HostListener('document:click', ['$event'])
  public onBadgeDialogClick(event: MouseEvent): void {
    if (
      this.badgeDialogRef.nativeElement.open &&
      event.target === this.badgeDialogRef.nativeElement
    ) {
      this.closeBadgeViewer();
    }
  }

  public openCvViewer(): void {
    if (this.isCvOpen) return;
    this.cvPreviousOverflow = document.body.style.overflow;
    this.isCvOpen = true;
    this.currentPage = 1;
    this.zoomLevel = 1.0;
    document.body.style.overflow = 'hidden';
    afterNextRender(
      () => {
        if (this.isCvOpen) this.cvDialogRef.nativeElement.showModal();
      },
      { injector: this.injector },
    );
  }

  public closeCvViewer(): void {
    this.cvDialogRef.nativeElement.close();
    this.onCvViewerClosed();
  }

  public onCvViewerClosed(): void {
    if (this.cvDialogRef.nativeElement.open || !this.isCvOpen) return;
    this.isCvOpen = false;
    this.zoomLevel = 1.0;
    document.body.style.overflow = this.cvPreviousOverflow;
  }

  @HostListener('document:click', ['$event'])
  public onCvDialogClick(event: MouseEvent): void {
    if (event.target === this.cvDialogRef.nativeElement) this.closeCvViewer();
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
    this.zoomLevel = this.zoomLevel === 1.0 ? 1.6 : 1.0;
  }

  @HostListener('window:keydown', ['$event'])
  public handleKeyDown(event: KeyboardEvent): void {
    if (!this.isCvOpen) return;

    if (event.key === 'ArrowRight') {
      this.nextPage();
    } else if (event.key === 'ArrowLeft') {
      this.prevPage();
    }
  }
}
