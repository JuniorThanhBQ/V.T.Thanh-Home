import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdminService } from '@/features/admin/services/admin.service';
import { VisitorService } from '@/shared/services/visitor.service';
import { API_ENDPOINTS } from '@/configs/apis';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;
  let mockVisitor: {
    csrf: ReturnType<typeof vi.fn>;
    invalidate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockVisitor = {
      csrf: vi.fn().mockReturnValue(of({ token: 'mock-csrf-token' })),
      invalidate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AdminService,
        {
          provide: VisitorService,
          useValue: mockVisitor,
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Initial session verification', () => {
    it('clears session when session check returns 401', () => {
      service = TestBed.inject(AdminService);
      const req = httpMock.expectOne(API_ENDPOINTS.admin.session);
      expect(req.request.method).toBe('GET');

      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.isAuthenticated()).toBe(false);
      expect(service.checkingSession()).toBe(false);
      expect(service.posts()).toEqual([]);
      expect(service.projects()).toEqual([]);
      expect(service.contacts()).toEqual([]);
      expect(service.visitors()).toEqual([]);
      expect(service.metrics()).toBeNull();
    });

    it('sets authenticated state when session check succeeds', () => {
      service = TestBed.inject(AdminService);
      const req = httpMock.expectOne(API_ENDPOINTS.admin.session);

      req.flush({ authenticated: true });

      expect(service.isAuthenticated()).toBe(true);
      expect(service.checkingSession()).toBe(false);
      expect(service.sessionError()).toBe('');
    });
  });

  describe('Session expiry on 401 and 403 during administrative operations', () => {
    beforeEach(() => {
      service = TestBed.inject(AdminService);
      const initialReq = httpMock.expectOne(API_ENDPOINTS.admin.session);
      initialReq.flush({ authenticated: true });
      expect(service.isAuthenticated()).toBe(true);
    });

    it('clears session and sets session error on 401 when loading posts', () => {
      service.loadPosts();
      const req = httpMock.expectOne(API_ENDPOINTS.admin.blogs);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.isAuthenticated()).toBe(false);
      expect(service.sessionError()).toBe(
        'Your administrator session is no longer available. Sign in again.',
      );
      expect(service.posts()).toEqual([]);
      expect(service.loading()['blogs']).toBe(false);
    });

    it('clears session and sets session error on 403 when loading projects', () => {
      service.loadProjects();
      const req = httpMock.expectOne(API_ENDPOINTS.admin.projects);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      expect(service.isAuthenticated()).toBe(false);
      expect(service.sessionError()).toBe(
        'Your administrator session is no longer available. Sign in again.',
      );
      expect(service.projects()).toEqual([]);
      expect(service.loading()['projects']).toBe(false);
    });

    it('clears session and sets session error on 401 when loading contacts', () => {
      service.loadContacts();
      const req = httpMock.expectOne(API_ENDPOINTS.admin.contacts);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.isAuthenticated()).toBe(false);
      expect(service.sessionError()).toBe(
        'Your administrator session is no longer available. Sign in again.',
      );
      expect(service.contacts()).toEqual([]);
      expect(service.loading()['contacts']).toBe(false);
    });
  });

  describe('Authentication lifecycle and credential cleanup', () => {
    it('wipes credentials in finalize callback upon login', () => {
      service = TestBed.inject(AdminService);
      const initialReq = httpMock.expectOne(API_ENDPOINTS.admin.session);
      initialReq.flush({ authenticated: false });

      const credentials = { username: 'admin', password: 'securePassword123' };
      service.login(credentials).subscribe();

      const loginReq = httpMock.expectOne(API_ENDPOINTS.admin.login);
      loginReq.flush({ authenticated: true });

      expect(credentials.username).toBe('');
      expect(credentials.password).toBe('');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('wipes credentials even when login fails with 401', () => {
      service = TestBed.inject(AdminService);
      const initialReq = httpMock.expectOne(API_ENDPOINTS.admin.session);
      initialReq.flush({ authenticated: false });

      const credentials = { username: 'admin', password: 'wrongPassword' };
      service.login(credentials).subscribe({
        error: () => {},
      });

      const loginReq = httpMock.expectOne(API_ENDPOINTS.admin.login);
      loginReq.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      expect(credentials.username).toBe('');
      expect(credentials.password).toBe('');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('clears session and invalidates visitor on logout', () => {
      service = TestBed.inject(AdminService);
      const initialReq = httpMock.expectOne(API_ENDPOINTS.admin.session);
      initialReq.flush({ authenticated: true });
      expect(service.isAuthenticated()).toBe(true);

      service.logout().subscribe();

      const logoutReq = httpMock.expectOne(API_ENDPOINTS.admin.logout);
      expect(logoutReq.request.method).toBe('POST');
      logoutReq.flush(null);

      expect(service.isAuthenticated()).toBe(false);
      expect(mockVisitor.invalidate).toHaveBeenCalled();
    });
  });
});
