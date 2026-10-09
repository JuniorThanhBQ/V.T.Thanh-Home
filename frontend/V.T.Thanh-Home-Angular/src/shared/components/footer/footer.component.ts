import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent implements OnInit {
  public i18n = inject(TranslationService);
  public currentYear = new Date().getFullYear();
  private destroyRef = inject(DestroyRef);
  public currentTime = signal(new Date());
  public viewersCount: number | null = null;

  constructor() {
    const timerId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.destroyRef.onDestroy(() => {
      clearInterval(timerId);
    });
  }

  ngOnInit(): void {
    fetch('/api/viewers')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.viewers === 'number') {
          this.viewersCount = data.viewers;
        }
      })
      .catch(() => {
        this.viewersCount = null;
      });
  }
}
