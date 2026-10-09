import { Component, OnInit, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blog-load',
  standalone: true,
  imports: [CommonModule],
  templateUrl: '../templates/blog.load.component.html',
})
export class BlogLoadComponent implements OnInit, OnDestroy {
  public retry = output<void>();

  public secondsElapsed = 0;
  public currentStageIndex = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  public readonly stages = [
    'Connecting to backend cluster...',
    'Waking server instance from sleep (Render cold start ~45s)...',
    'Initializing Spring Boot and Supabase connection pool...',
    'Fetching cinematic chapters...',
  ];

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.secondsElapsed++;

      if (this.secondsElapsed > 35) {
        this.currentStageIndex = 3;
      } else if (this.secondsElapsed > 20) {
        this.currentStageIndex = 2;
      } else if (this.secondsElapsed > 5) {
        this.currentStageIndex = 1;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  public onRetryClick(): void {
    this.secondsElapsed = 0;
    this.currentStageIndex = 0;
    this.retry.emit();
  }
}
