import { defineConfig, devices } from '@playwright/test';

const channel = process.env['PWA_TEST_CHANNEL'];
if (channel && !['chrome', 'msedge'].includes(channel))
  throw new Error('Unsupported PWA_TEST_CHANNEL');

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env['CI'],
  timeout: 90000,
  globalTimeout: 300000,
  expect: { timeout: 15000 },
  outputDir: './test-results',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    serviceWorkers: 'allow',
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(channel ? { channel } : {}),
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
