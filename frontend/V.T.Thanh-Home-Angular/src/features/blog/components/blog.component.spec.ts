import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BlogComponent } from './blog.component';
import { BlogShaderService } from '../services/blog-shader.service';
import { TranslationService } from '@/shared/services/translation.service';

describe('Blog request lifecycle', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BlogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslationService, useValue: { t: (key: string) => key } },
      ],
    });
    TestBed.overrideComponent(BlogComponent, {
      set: {
        providers: [
          {
            provide: BlogShaderService,
            useValue: { init: () => undefined, destroy: () => undefined },
          },
        ],
      },
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('leaves the loader after an empty response in zoneless mode', async () => {
    const fixture = TestBed.createComponent(BlogComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-blog-load')).not.toBeNull();
    http.expectOne('/api/v1/blogs').flush([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-blog-load')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('blog.empty.title');
  });

  it('exits the loader if a request never responds', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(BlogComponent);
    fixture.detectChanges();
    const pending = http.expectOne('/api/v1/blogs');
    vi.advanceTimersByTime(60001);
    fixture.detectChanges();
    expect(pending.cancelled).toBe(true);
    expect(fixture.nativeElement.querySelector('app-blog-load')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.destroy();
  });

  it('shows an error and supports retry after a failed request', async () => {
    const fixture = TestBed.createComponent(BlogComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/blogs').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.componentInstance.reloadBlog();
    http.expectOne('/api/v1/blogs').flush([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
});
