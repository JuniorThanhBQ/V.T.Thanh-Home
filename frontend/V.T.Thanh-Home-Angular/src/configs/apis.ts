export interface ServerConfig {
  serverUrl: string;
  serverPort: string;
}

const runtimeEnv =
  typeof globalThis !== 'undefined'
    ? (globalThis as unknown as {
        process?: { env?: Record<string, string | undefined> };
        __env?: Record<string, string | undefined>;
      })
    : {};

export const SERVER_CONFIG: ServerConfig = {
  serverUrl: runtimeEnv.process?.env?.['SERVER_URL'] || runtimeEnv.__env?.['SERVER_URL'] || '',
  serverPort: runtimeEnv.process?.env?.['SERVER_PORT'] || runtimeEnv.__env?.['SERVER_PORT'] || '',
};

export function getBackendBaseUrl(): string {
  if (!SERVER_CONFIG.serverUrl) {
    return '/api';
  }

  const url = SERVER_CONFIG.serverUrl.replace(/\/+$/, '');
  const port = SERVER_CONFIG.serverPort ? `:${SERVER_CONFIG.serverPort}` : '';

  if (url.includes('://') && url.split(':').length > 2) {
    return url;
  }
  return `${url}${port}`;
}

export const API_ENDPOINTS = {
  actuator: {
    health: '/actuator/health',
    info: '/actuator/info',
    metrics: '/actuator/metrics',
  },
} as const;

export function buildApiUrl(endpoint: string): string {
  const base = getBackendBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
