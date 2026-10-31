import { test as base, expect } from '@playwright/test';
import { startSsrServer } from './fixtures/ssr-server';

const test = base.extend<{ ssr: Awaited<ReturnType<typeof startSsrServer>> }>({
  ssr: async (_, use) => {
    const server = await startSsrServer();
    try {
      await use(server);
    } finally {
      await server.stop();
    }
  },
});

test('hydrates server content, keeps language URLs, and supports public navigation', async ({
  page,
  context,
  ssr,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/NG05\d+/.test(message.text())) errors.push(message.text());
  });
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === ssr.origin ? route.continue() : route.abort(),
  );
  await context.addInitScript(() => {
    localStorage.setItem('app_language', 'fr');
    localStorage.setItem('app_theme', 'dark');
  });
  const response = await page.goto(ssr.origin + '/en/about');
  const html = await response!.text();
  expect(html).toContain('<app-about');
  expect(html).toContain('dictionary-en');
  await expect(page.locator('h1')).toContainText('About Me');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.waitForFunction(
    () => (document.querySelector('app-loading > div')?.getBoundingClientRect().bottom ?? 1) <= 1,
  );
  const projectLinks = page.locator('app-header a[href^="/en/projects"]:visible');
  if (!(await projectLinks.count()))
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await page.locator('app-header a[href^="/en/projects"]:visible').first().click();
  await expect(page.locator('app-project')).toBeVisible();
  await page.reload();
  await expect(page.locator('app-project')).toBeVisible();
  expect(errors).toEqual([]);
});

test('renders the journal on the server and hydrates its transferred content', async ({
  page,
  context,
  ssr,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/NG05\d+/.test(message.text())) errors.push(message.text());
  });
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === ssr.origin ? route.continue() : route.abort(),
  );
  const response = await page.goto(ssr.origin + '/en/blog');
  expect(await response!.text()).toContain('Server rendered journal');
  await expect(page.locator('app-blog')).toContainText('Server rendered journal');
  await expect(page.locator('app-footer footer')).toHaveAttribute(
    'data-connection-state',
    'online',
  );
  expect(errors).toEqual([]);
});

test('keeps public SSR content usable when the backend is unavailable', async ({ page, ssr }) => {
  ssr.setHealthy(false);
  const response = await page.goto(ssr.origin + '/en/contact');
  expect(await response!.text()).toContain('<app-contact');
  await expect(page.locator('app-contact')).toBeVisible();
  await expect(page.locator('app-footer footer')).toHaveAttribute(
    'data-connection-state',
    'unavailable',
  );
});
