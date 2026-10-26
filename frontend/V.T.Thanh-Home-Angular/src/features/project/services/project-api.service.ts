import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS, buildApiUrl } from '@/configs/apis';

export interface BackendProject {
  id: number;
  slug: string;
  label?: string;
  title: string;
  subtitle?: string;
  description: string;
  techStack: string[];
  githubLink?: string;
  websiteLink?: string;
  displayOrder: number;
  published: boolean;
  version: number;
  createdDate: string;
  updatedDate: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private http = inject(HttpClient);

  public getProjects(): Observable<BackendProject[]> {
    return this.http.get<BackendProject[]>(buildApiUrl(API_ENDPOINTS.projects));
  }

  public getProjectBySlug(slug: string): Observable<BackendProject> {
    return this.http.get<BackendProject>(
      buildApiUrl(`${API_ENDPOINTS.projects}/${encodeURIComponent(slug)}`),
    );
  }
}
