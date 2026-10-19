import { Injectable, signal, computed } from '@angular/core';

export interface SystemMetrics {
  springBootVersion: string;
  javaVersion: string;
  uptime: string;
  heapUsedMb: number;
  heapMaxMb: number;
  activeThreads: number;
  activeProfile: string;
  databaseStatus: 'UP' | 'DOWN';
  databaseName: string;
  databasePool: string;
}

export interface BlogPostItem {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  status: 'PUBLISHED' | 'DRAFT';
  publishedAt: string;
  heroImage: string;
}

export interface ChatHistoryItem {
  id: string;
  userQuery: string;
  botResponse: string;
  model: string;
  timestamp: string;
  tokens: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly storageKey = 'vtthanh_admin_session';

  public readonly isAuthenticated = signal<boolean>(
    typeof window !== 'undefined' ? sessionStorage.getItem(this.storageKey) === 'true' : false,
  );

  public readonly adminUser = signal<string | null>(
    typeof window !== 'undefined' && sessionStorage.getItem(this.storageKey) === 'true'
      ? 'admin'
      : null,
  );

  public readonly metrics = signal<SystemMetrics>({
    springBootVersion: '4.1.1',
    javaVersion: '25',
    uptime: '14h 32m',
    heapUsedMb: 312,
    heapMaxMb: 1024,
    activeThreads: 38,
    activeProfile: 'production',
    databaseStatus: 'UP',
    databaseName: 'PostgreSQL 18 (Supabase)',
    databasePool: 'HikariPool-1 (10/10 active)',
  });

  public readonly heapUsagePercentage = computed(() => {
    const m = this.metrics();
    return Math.round((m.heapUsedMb / m.heapMaxMb) * 100);
  });

  public readonly posts = signal<BlogPostItem[]>([
    {
      id: '1',
      title: 'Building Modern Portfolio with Spring Boot 4 and Angular 22',
      category: 'Architecture',
      readTime: '6 min read',
      summary:
        'Exploring fullstack decoupling, native image preparation, and edge deployment on Vercel.',
      status: 'PUBLISHED',
      publishedAt: '2026-10-15',
      heroImage: 'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792385538/J_17_crrpsy.png',
    },
    {
      id: '2',
      title: 'PostgreSQL 18 Vector Search and pgvector Integration',
      category: 'Database',
      readTime: '8 min read',
      summary: 'Setting up high-performance vector embeddings for hybrid RAG search architectures.',
      status: 'PUBLISHED',
      publishedAt: '2026-10-10',
      heroImage: 'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792385538/J_17_crrpsy.png',
    },
    {
      id: '3',
      title: 'Automated CI/CD Pipeline Hardening with GitHub Actions and Zizmor',
      category: 'DevOps',
      readTime: '5 min read',
      summary:
        'Securing workflow permissions, pinning action SHAs, and auditing secrets inheritance.',
      status: 'DRAFT',
      publishedAt: '2026-10-18',
      heroImage: 'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792385538/J_17_crrpsy.png',
    },
  ]);

  public readonly chatHistory = signal<ChatHistoryItem[]>([
    {
      id: 'c-1',
      userQuery: 'Can you summarize Van Trung Thanh’s background and skills?',
      botResponse:
        'Van Trung Thanh is an IT student specializing in Software Engineering, GenAI Engineering, and DevOps architectures with Spring Boot and Angular.',
      model: 'gemini-1.5-flash',
      timestamp: '2026-10-19 12:45',
      tokens: 142,
    },
    {
      id: 'c-2',
      userQuery: 'What backend architecture is used for this portfolio?',
      botResponse:
        'The backend uses Spring Boot 4.1.1 on Eclipse Temurin JDK 25 with Spring Data JPA, PostgreSQL 18 with pgvector, and Spring Actuator monitoring.',
      model: 'gemini-1.5-flash',
      timestamp: '2026-10-19 13:10',
      tokens: 98,
    },
    {
      id: 'c-3',
      userQuery: 'How do I contact Thanh for internship opportunities?',
      botResponse:
        'You can submit an inquiry via the Contact form or email directly at thanh.vantrung2005@gmail.com.',
      model: 'qwen2.5:3b',
      timestamp: '2026-10-19 13:30',
      tokens: 65,
    },
  ]);

  public login(user: string, pass: string): boolean {
    if (user === 'admin' && pass === 'admin123') {
      /* WARNING: THIS IS A MOCK LOGIN ONLY! THIS WILL BE DELETED AFTER THE BACKEND IS RELEASED IN V.T.Thanh-Home V2.0.0 */
      this.isAuthenticated.set(true);
      this.adminUser.set(user);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.storageKey, 'true');
      }
      return true;
    }
    return false;
  }

  public logout(): void {
    this.isAuthenticated.set(false);
    this.adminUser.set(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  public createPost(post: Omit<BlogPostItem, 'id' | 'publishedAt'>): void {
    const newPost: BlogPostItem = {
      ...post,
      id: Date.now().toString(),
      publishedAt: new Date().toISOString().split('T')[0],
    };
    this.posts.update((list) => [newPost, ...list]);
  }

  public updatePost(id: string, updated: Partial<BlogPostItem>): void {
    this.posts.update((list) => list.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  }

  public deletePost(id: string): void {
    this.posts.update((list) => list.filter((p) => p.id !== id));
  }

  public refreshMetrics(): void {
    const current = this.metrics();
    const randomizedHeap = Math.floor(280 + Math.random() * 80);
    const randomizedThreads = Math.floor(32 + Math.random() * 14);
    this.metrics.set({
      ...current,
      heapUsedMb: randomizedHeap,
      activeThreads: randomizedThreads,
    });
  }
}
