import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { App } from './app';
import { VisitorService } from '@/shared/services/visitor.service';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { LoadingService } from '@/shared/services/loading.service';

describe('Application visitor startup', () => {
  it('registers the browser once during bootstrap', () => {
    const register = vi.fn(() => of({ registered: true }));
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: VisitorService, useValue: { ensureRegistered: register } },
        { provide: BackendHealthService, useValue: { status: signal('UP') } },
        { provide: LoadingService, useValue: { isLoading: signal(false) } },
      ],
    });
    TestBed.overrideComponent(App, { set: { imports: [], template: '' } });
    TestBed.createComponent(App);
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('keeps public browsing available if registration fails', () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: VisitorService,
          useValue: { ensureRegistered: () => throwError(() => new Error('offline')) },
        },
        { provide: BackendHealthService, useValue: { status: signal('DOWN') } },
        { provide: LoadingService, useValue: { isLoading: signal(false) } },
      ],
    });
    TestBed.overrideComponent(App, { set: { imports: [], template: '' } });
    expect(() => TestBed.createComponent(App)).not.toThrow();
  });
});
