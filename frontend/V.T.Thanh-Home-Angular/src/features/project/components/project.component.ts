import {
  Component,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { CommingSoonComponent } from '@/shared/components/comming-soon/comming-soon.component';
import { ProjectShaderService } from '../services/project-shader.service';

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  imageUrl: string;
  techStack: string[];
  sourceUrl: string;
  websiteUrl?: string;
}

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, CommingSoonComponent],
  providers: [ProjectShaderService],
  templateUrl: "../templates/project.component.html"
})
export class ProjectComponent implements AfterViewInit, OnDestroy {
  public i18n = inject(TranslationService);
  private shaderService = inject(ProjectShaderService);

  @ViewChild('bgCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  public projects: ProjectItem[] = [
    {
      id: 'vtthanh-home',
      title: 'V.T.Thanh-Home Architecture',
      category: 'Fullstack Platform',
      summary: 'Reactive portfolio engine powered by Spring Boot 4.11 and Angular 18/19.',
      description: 'Distributed microservice architecture with JDK 25 virtual concurrency, real-time WebGL fluid shaders, and bilingual internationalization.',
      imageUrl: 'https://res.cloudinary.com/dwyx97d6i/image/upload/v1728283592/portfolio_sample1.png',
      techStack: ['Spring Boot 4.11', 'JDK 25', 'Angular', 'WebGL', 'TailwindCSS'],
      sourceUrl: 'https://github.com/JuniorThanhBQ/V.T.Thanh-Home',
      websiteUrl: 'https://vtthanh.com',
    },
    {
      id: 'high-throughput-core',
      title: 'High-Throughput Concurrency Core',
      category: 'Backend Engine',
      summary: 'Benchmarked asynchronous execution runtime using Loom virtual threads.',
      description: 'High-volume asynchronous dispatch engine benchmarked against reactive Netty, demonstrating low memory footprint under high connection concurrency.',
      imageUrl: 'https://res.cloudinary.com/dwyx97d6i/image/upload/v1728283592/portfolio_sample2.png',
      techStack: ['Java 25', 'Virtual Threads', 'PostgreSQL', 'Docker'],
      sourceUrl: 'https://github.com/JuniorThanhBQ/concurrency-benchmarks',
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