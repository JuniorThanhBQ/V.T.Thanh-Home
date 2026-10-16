import { Component, inject, signal, computed, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, SupportedLang } from '../../services/translation.service';

const LOCALE_TIME_FORMATS: Record<SupportedLang, string> = {
  vi: 'dd/MM/yyyy HH:mm:ss',
  en: 'yyyy-MM-dd HH:mm:ss',
  ja: 'yyyy/MM/dd HH:mm:ss',
  zh: 'yyyy-MM-dd HH:mm:ss',
  fr: 'dd/MM/yyyy HH:mm:ss',
  de: 'dd.MM.yyyy HH:mm:ss',
};

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

  public timeFormat = computed(() => {
    const lang = this.i18n.currentLang();
    return LOCALE_TIME_FORMATS[lang] ?? 'yyyy-MM-dd HH:mm:ss';
  });

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
