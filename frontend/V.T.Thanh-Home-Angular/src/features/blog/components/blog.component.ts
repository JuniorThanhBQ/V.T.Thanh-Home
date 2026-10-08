import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { CommingSoonComponent } from '@/shared/components/comming-soon/comming-soon.component';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, CommingSoonComponent],
  template: `
    <section class="min-h-[75vh] flex items-center justify-center py-12">
      <app-comming-soon
        title="Engineering Journal"
        subtitle="Deep-dive articles exploring modern enterprise architectures, JDK 25 concurrency models, and GPU-accelerated web experiences will be published here."
      />
    </section>
  `,
})
export class BlogComponent {
  public i18n = inject(TranslationService);
}