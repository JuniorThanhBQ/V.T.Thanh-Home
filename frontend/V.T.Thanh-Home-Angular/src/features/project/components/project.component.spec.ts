import { TestBed } from '@angular/core/testing';
import { ProjectComponent } from './project.component';
import { ProjectShaderService } from '../services/project-shader.service';
import { TranslationService } from '@/shared/services/translation.service';

describe('Static portfolio projects', () => {
  it('renders all six defaults without requiring HttpClient or an API', () => {
    TestBed.configureTestingModule({
      imports: [ProjectComponent],
      providers: [{ provide: TranslationService, useValue: { t: (key: string) => key } }],
    });
    TestBed.overrideComponent(ProjectComponent, {
      set: {
        providers: [
          {
            provide: ProjectShaderService,
            useValue: { init: () => undefined, destroy: () => undefined },
          },
        ],
      },
    });
    const fixture = TestBed.createComponent(ProjectComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.projects.length).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('aijmc');
  });
});
