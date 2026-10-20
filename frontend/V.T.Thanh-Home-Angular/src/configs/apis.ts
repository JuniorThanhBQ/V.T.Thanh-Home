export const API_ENDPOINTS = {
  actuator: {
    health: '/actuator/health',
    info: '/actuator/info',
    metrics: '/actuator/metrics',
  },
  visitors: '/api/v1/visitors',
  projects: '/api/v1/projects',
  blogs: '/api/v1/blogs',
  contacts: '/api/v1/contacts',
  chat: {
    session: '/api/v1/chat/session',
    message: '/api/v1/chat/message',
    history: '/api/v1/chat/history',
  },
  admin: {
    login: '/api/v1/admin/login',
    logout: '/api/v1/admin/logout',
    session: '/api/v1/admin/session',
    projects: '/api/v1/admin/projects',
    blogs: '/api/v1/admin/blogs',
    contacts: '/api/v1/admin/contacts',
  },
} as const;

export function buildApiUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return path;
}
