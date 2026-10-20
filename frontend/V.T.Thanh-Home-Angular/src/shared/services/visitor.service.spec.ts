import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VisitorService } from './visitor.service';

describe('Visitor registration', () => {
  let service: VisitorService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VisitorService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('fetches CSRF before posting minimal metadata and shares registration', () => {
    service.ensureRegistered().subscribe();
    service.ensureRegistered().subscribe();
    http.expectOne('/api/v1/security/csrf').flush({ token: 'test-csrf' });
    const request = http.expectOne('/api/v1/visitors');
    expect(request.request.method).toBe('POST');
    expect(Object.keys(request.request.body).sort()).toEqual(['language', 'timeZone']);
    request.flush({ registered: true });
    expect(service.registered()).toBe(true);
    service.ensureRegistered().subscribe();
    http.expectNone('/api/v1/visitors');
  });

  it('can retry registration after a backend startup failure', () => {
    service.ensureRegistered().subscribe({ error: () => undefined });
    http.expectOne('/api/v1/security/csrf').flush({}, { status: 503, statusText: 'Unavailable' });
    service.ensureRegistered().subscribe();
    http.expectOne('/api/v1/security/csrf').flush({ token: 'test-csrf' });
    http.expectOne('/api/v1/visitors').flush({ registered: true });
    expect(service.registered()).toBe(true);
  });
});
