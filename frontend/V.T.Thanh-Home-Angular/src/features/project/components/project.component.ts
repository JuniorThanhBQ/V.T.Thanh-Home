import { Component, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';
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

  public readonly defaultProjects: ProjectItem[] = [
    {
      id: 'aijmc',
      imageUrl:
        'https://res.cloudinary.com/dfolk8pz2/image/upload/v1786036926/AIJ-modified_1_xzw6dh.png',
      techStack: [
        'FastAPI 0.139+',
        'Next.js 16.2+',
        'PostgreSQL 18+',
        'LangChain 1.3+',
        'Celery 5.4+',
        'RabbitMQ 3.13+',
        'Nginx 3.24+',
        'Ngrok 3+',
      ],
      sourceUrl: 'https://github.com/JuniorThanhBQ/AI-IT-Job-Market-Consultant',
      websiteUrl: 'https://ai-it-job-market-consultant.vercel.app/',
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
      websiteUrl: 'https://aijmc-jpra.streamlit.app/',
    },
    {
      id: 'mbms',
      imageUrl: AVATAR_URLS.mbms_project_banner,
      techStack: [
        'JavaScript',
        'PostgreSQL',
        'Docker',
        'Docker Compose',
        'PWA',
        'RabbitMQ',
        'Redis',
      ],
      sourceUrl: 'https://github.com/JuniorThanhBQ/Medical-Booking-Management-System',
    },
    {
      id: 'ai_writing_indicator',
      imageUrl: AVATAR_URLS.ai_indicator_project_banner,
      techStack: [
        'Python',
        'Jupyter Notebook',
        'Machine Learning',
        'NLP',
        'Deep Learning',
        'Vietnamese Text',
        'AI Checker',
      ],
      sourceUrl: 'https://github.com/JuniorThanhBQ/AIWritingIndicator-13',
      websiteUrl: 'https://aiwritingindicator-13-ou.streamlit.app/',
    },
    {
      id: 'elearning_lcms',
      imageUrl: AVATAR_URLS.erm_project_banner,
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
      imageUrl: AVATAR_URLS.sport_field_project_banner,
      techStack: ['Python', 'Flask', 'MySQL', 'Selenium 3', 'CI/CD', 'Postman', 'Test Case'],
      sourceUrl: 'https://github.com/JuniorThanhBQ/sports-field-booking-app',
    },
  ];

  public projects: ProjectItem[] = [...this.defaultProjects];

  public get flagshipProject(): ProjectItem {
    return this.projects[0] || this.defaultProjects[0];
  }

  public get trioProjects(): ProjectItem[] {
    return this.projects.slice(1, 4);
  }

  public get wideProjects(): ProjectItem[] {
    return this.projects.slice(4, 6);
  }

  ngAfterViewInit(): void {
    if (this.canvasRef?.nativeElement) {
      this.shaderService.init(this.canvasRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.shaderService.destroy();
  }
}
