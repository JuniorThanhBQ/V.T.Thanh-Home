export type AdminSection = 'overview' | 'blogs' | 'projects' | 'contacts' | 'visitors';

export interface AdminCredentials {
  username: string;
  password: string;
}
export interface BlogChapter {
  title: string;
  content: string;
  chapterOrder: number;
}
export interface AdminBlog {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  category: 'TECHNICAL' | 'SLICE_OF_LIFE' | 'PERSONAL_STORY';
  bannerUrl: string | null;
  status: 'PUBLISHED' | 'DRAFT';
  publishedAt: string | null;
  version: number;
  chapters?: BlogChapter[];
}
export type BlogWrite = Omit<AdminBlog, 'id' | 'publishedAt' | 'version'> & {
  version?: number;
  chapters: BlogChapter[];
};
export interface AdminProject {
  id: number;
  slug: string;
  label: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  techStack: string[];
  githubLink: string | null;
  websiteLink: string | null;
  displayOrder: number;
  published: boolean;
  version: number;
}
export type ProjectWrite = Omit<AdminProject, 'id' | 'version'> & { version?: number };
export interface AdminContact {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  deliveryAttempts: number;
  lastDeliveryAttempt: string | null;
  lastDeliveryError: string | null;
  createdDate: string;
}
export interface AdminVisitor {
  id: number;
  blocked: boolean;
  lastSeenAt: string | null;
}
export interface RuntimeMetrics {
  health: string | null;
  database: string | null;
  uptimeSeconds: number | null;
  heapUsedBytes: number | null;
  heapMaxBytes: number | null;
  liveThreads: number | null;
  checkedAt: string;
}
