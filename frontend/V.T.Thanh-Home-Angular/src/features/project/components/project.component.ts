import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { CommingSoonComponent } from '@/shared/components/comming-soon/comming-soon.component';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, CommingSoonComponent],
  template: `
    <section class="min-h-[75vh] flex items-center justify-center py-12">
      <app-comming-soon
        title="Project Showcase"
        subtitle="Production repositories, microservice blueprints built with Spring Boot 4.11 & JDK 25, and interactive WebGL frontend demos will be launched here."
      />
    </section>
  `,
})
export class ProjectComponent {
  public i18n = inject(TranslationService);
}