import { Component, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { ProjectShaderService } from '../services/project-shader.service';

export interface ProjectItem {
  id: string;
  imageUrl: string;
  techStack: string[];
  sourceUrl: string;
  websiteUrl?: string;
}

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule],
  providers: [ProjectShaderService],
  templateUrl: '../templates/project.component.html',
})
export class ProjectComponent implements AfterViewInit, OnDestroy {
  public i18n = inject(TranslationService);
  private shaderService = inject(ProjectShaderService);

  @ViewChild('bgCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  public readonly projects: ProjectItem[] = [
    {
      id: 'aijmc',
      imageUrl:
        'https://res.cloudinary.com/dfolk8pz2/image/upload/v1786036926/AIJ-modified_1_xzw6dh.png',
      techStack: [
        'FastAPI',
        'Next.js 16',
        'PostgreSQL',
        'pgvector',
        'LangChain',
        'Celery',
        'Gemini',
      ],
      sourceUrl: 'https://github.com/JuniorThanhBQ/AI-IT-Job-Market-Consultant',
    },
    {
      id: 'aijmc_jpra',
      imageUrl:
        'https://res.cloudinary.com/dfolk8pz2/image/upload/v1790424345/AIJ_1_-modified_1_afzibo.png',
      techStack: [
        'Python',
        'Streamlit',
        'PydanticAI',
        'Playwright',
        'Google GenAI',
        'Groq',
        'Supabase',
      ],
      sourceUrl: 'https://github.com/JuniorThanhBQ/AIJMC-JPRA',
    },
    {
      id: 'mbms',
      imageUrl:
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
      techStack: ['JavaScript', 'PostgreSQL', 'Docker', 'Docker Compose', 'PWA'],
      sourceUrl: 'https://github.com/JuniorThanhBQ/Medical-Booking-Management-System',
    },
    {
      id: 'ai_writing_indicator',
      imageUrl:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      techStack: ['Python', 'Jupyter Notebook', 'Machine Learning', 'NLP', 'Vietnamese Text'],
      sourceUrl: 'https://github.com/JuniorThanhBQ/AIWritingIndicator-13',
    },
    {
      id: 'elearning_lcms',
      imageUrl:
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1200&q=80',
      techStack: [
        'Python 3.13',
        'Django',
        'Django Rest Framework',
        'MySQL',
        'OAuth2',
        'Google GenAI',
      ],
      sourceUrl: 'https://github.com/JuniorThanhBQ/elearning-resources-managerment',
    },
    {
      id: 'sports_field_booking',
      imageUrl:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      techStack: ['Python', 'Flask', 'MySQL', 'Selenium 3', 'CI/CD'],
      sourceUrl: 'https://github.com/JuniorThanhBQ/sports-field-booking-app',
    },
  ];

  ngAfterViewInit(): void {
    if (this.canvasRef?.nativeElement) {
      this.shaderService.init(this.canvasRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.shaderService.destroy();
  }
}
