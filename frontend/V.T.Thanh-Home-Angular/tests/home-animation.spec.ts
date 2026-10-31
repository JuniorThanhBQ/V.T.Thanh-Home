import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HomeComponent } from '@/features/home/components/home.component';
import { HomeShaderService } from '@/features/home/services/home-shader.service';
import { TranslationService } from '@/shared/services/translation.service';

describe('Home animation rendering lifecycle', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  function createHome() {
    const shader = { init: vi.fn(), destroy: vi.fn() };
    TestBed.configureTestingModule({ imports: [HomeComponent] });
    TestBed.overrideComponent(HomeComponent, {
      set: {
        template: '<canvas #bgCanvas></canvas>',
        providers: [
          { provide: HomeShaderService, useValue: shader },
          { provide: TranslationService, useValue: {} },
        ],
      },
    });
    return { fixture: TestBed.createComponent(HomeComponent), shader };
  }

  it('starts the shader after browser rendering and cleans up on destruction', () => {
    const { fixture, shader } = createHome();
    expect(shader.init).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(shader.init).toHaveBeenCalledExactlyOnceWith(
      fixture.nativeElement.querySelector('canvas'),
    );
    fixture.destroy();
    expect(shader.destroy).toHaveBeenCalledOnce();
  });

  it('does not start the shader when destroyed before the first render', () => {
    const { fixture, shader } = createHome();
    fixture.destroy();
    TestBed.tick();
    expect(shader.init).not.toHaveBeenCalled();
    expect(shader.destroy).toHaveBeenCalledOnce();
  });

  it('allows shader initialization and cleanup on the server without browser globals', () => {
    TestBed.configureTestingModule({
      providers: [HomeShaderService, { provide: PLATFORM_ID, useValue: 'server' }],
    });
    const shader = TestBed.inject(HomeShaderService);
    const canvas = document.createElement('canvas');
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    expect(() => shader.init(canvas)).not.toThrow();
    expect(() => shader.destroy()).not.toThrow();
    vi.unstubAllGlobals();
  });
});
