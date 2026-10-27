import { test as base, expect, Page } from '@playwright/test';
import { cvResource, startPwaServer } from './fixtures/pwa-server';
import { readFile } from 'node:fs/promises';

const test = base.extend<{
  standalone: boolean;
  pwaServer: Awaited<ReturnType<typeof startPwaServer>>;
}>({
  standalone: [true, { option: true }],
  pwaServer: async ({}, use) => {
    const server = await startPwaServer();
    try {
      await use(server);
    } finally {
      await server.stop();
    }
  },
});
let browserErrors: string[] = [];

async function settled(page: Page) {
  await page.waitForFunction(
    () => (document.querySelector('app-loading > div')?.getBoundingClientRect().bottom ?? 1) <= 1,
  );
}

async function connection(page: Page, text: string) {
  const states: Record<string, string> = {
    'Online services available': 'online',
    'Online services unavailable': 'unavailable',
    'You are offline': 'offline',
  };
  await expect(page.locator('app-footer > footer')).toHaveAttribute(
    'data-connection-state',
    states[text],
  );
}

test.beforeEach(async ({ context, page, pwaServer, standalone }) => {
  browserErrors = [];
  const listen = (target: Page) =>
    target.on('pageerror', (error) => browserErrors.push(error.message));
  listen(page);
  context.on('page', listen);
  if (standalone) {
    await context.addInitScript(() => {
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        const media = matchMedia(query);
        if (query === '(display-mode: standalone)')
          Object.defineProperty(media, 'matches', { value: true });
        return media;
      };
    });
  }
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === pwaServer.origin ? route.continue() : route.abort(),
  );
});

test.afterEach(() => expect(browserErrors).toEqual([]));

test('prepares every resource before readiness and opens portfolio routes offline', async ({
  page,
  context,
  pwaServer,
}, testInfo) => {
  pwaServer.state.holdAsset = true;
  await page.goto(pwaServer.origin + '/en');
  await expect.poll(() => pwaServer.state.heldAssets).toBeGreaterThan(0);
  await expect(page.locator('app-footer > footer')).not.toHaveAttribute(
    'data-pwa-readiness',
    'ready',
  );
  await pwaServer.releaseAsset();
  await expect(page.locator('app-footer > footer')).toHaveAttribute('data-pwa-readiness', 'ready', {
    timeout: 60000,
  });
  await connection(page, 'Online services unavailable');
  await expect(page.locator('app-pwa-status')).toHaveCount(0);
  await pwaServer.disconnect();
  await context.setOffline(true);
  await expect(page.getByTestId('connection-status')).toHaveText('Online services unavailable');
  const routes = [
    ['/', 'app-home'],
    ['/en', 'app-home'],
    ['/about', 'app-about'],
    ['/projects', 'app-project'],
    ['/en/about', 'app-about'],
    ['/ja/projects', 'app-project'],
    ['/de/about', 'app-about'],
    ['/fr/projects', 'app-project'],
    ['/zh/about', 'app-about'],
    ['/ru/projects', 'app-project'],
    ['/kr/about', 'app-about'],
    ['/es/projects', 'app-project'],
  ];
  for (const [path, component] of routes) {
    await page.goto(pwaServer.origin + path, { waitUntil: 'domcontentloaded' });
    await page.locator(component).waitFor();
    await settled(page);
    const prefix = new URL(page.url()).pathname.split('/')[1];
    const language = ['en', 'ja', 'de', 'fr', 'zh', 'ru', 'kr', 'es'].includes(prefix)
      ? prefix
      : 'vi';
    const dictionary = JSON.parse(await readFile(`public/i18n/${language}.json`, 'utf8'));
    await expect(page.locator('html')).toHaveAttribute('lang', language === 'kr' ? 'ko' : language);
    if (await page.evaluate(() => navigator.onLine)) {
      await expect(page.locator('app-pwa-status')).toHaveCount(0);
    } else {
      await expect(page.getByTestId('connection-status')).toHaveText(dictionary.pwa.unavailable);
      await expect(page.getByTestId('offline-readiness')).toBeVisible();
    }
    expect((await page.locator('main').innerText()).length).toBeGreaterThan(100);
  }
  const result = await page.evaluate(async () => {
    const response = await fetch('/pwa-resources.json');
    const receipt: { resources: { url: string }[] } = await response.json();
    const images = receipt.resources.filter((entry) => /\.(png|jpg|webp|svg|ico)$/.test(entry.url));
    await Promise.all(
      images.map(
        (entry) =>
          new Promise<void>((accept, reject) => {
            const image = new Image();
            image.onload = () => (image.naturalWidth > 0 ? accept() : reject(new Error(entry.url)));
            image.onerror = () => reject(new Error(entry.url));
            image.src = entry.url;
          }),
      ),
    );
    for (const language of ['vi', 'en', 'ja', 'de', 'fr', 'zh', 'ru', 'kr', 'es']) {
      const dictionary = await fetch(`/i18n/${language}.json`);
      if (!dictionary.ok || !Object.keys(await dictionary.json()).length) throw new Error(language);
    }
    return images.length;
  });
  expect(result).toBeGreaterThanOrEqual(40);
  await page.screenshot({ path: testInfo.outputPath('offline-portfolio.png'), fullPage: true });
  const reopened = await context.newPage();
  await page.close();
  await reopened.goto(pwaServer.origin + '/en/projects', { waitUntil: 'domcontentloaded' });
  await reopened.locator('app-project').waitFor();
  const cachedApi = await reopened.evaluate(async () => {
    try {
      return (await fetch('/api/v1/blogs')).ok;
    } catch {
      return false;
    }
  });
  expect(cachedApi).toBe(false);
});

test('retains drafts and delivery identifiers without automatically replaying interrupted writes', async ({
  page,
  context,
  pwaServer,
}) => {
  pwaServer.state.healthy = true;
  pwaServer.state.holdContact = true;
  pwaServer.state.holdChat = true;
  await page.goto(pwaServer.origin + '/en/contact');
  await connection(page, 'Online services available');
  await expect(page.locator('app-footer > footer')).toHaveAttribute('data-pwa-readiness', 'ready', {
    timeout: 60000,
  });
  await settled(page);
  await expect(page.locator('app-pwa-status')).toHaveCount(0);
  await expect(page.getByTestId('offline-readiness')).toHaveCount(0);
  await context.setOffline(true);
  await expect(page.locator('app-pwa-status')).toBeVisible();
  await page.locator('[formControlName="firstName"]').fill('Thanh');
  await page.locator('[formControlName="email"]').fill('thanh@example.com');
  await page
    .locator('[formControlName="message"]')
    .fill('A draft that must survive a lost connection.');
  const submit = page.locator('form button[type="submit"]');
  await expect(submit).toBeDisabled();
  await context.setOffline(false);
  await connection(page, 'Online services available');
  expect(pwaServer.state.contacts).toHaveLength(0);
  await submit.click();
  await expect.poll(() => pwaServer.state.contacts.length).toBe(1);
  await context.setOffline(true);
  await expect(page.getByRole('alert')).toContainText('Delivery is unconfirmed');
  await expect(page.locator('[formControlName="firstName"]')).toHaveValue('Thanh');
  await context.setOffline(false);
  await connection(page, 'Online services available');
  expect(pwaServer.state.contacts).toHaveLength(1);
  pwaServer.state.holdContact = false;
  pwaServer.releaseOperations();
  await submit.click();
  await expect.poll(() => pwaServer.state.contacts.length).toBe(2);
  expect(pwaServer.state.contacts[1].idempotencyKey).toBe(
    pwaServer.state.contacts[0].idempotencyKey,
  );
  await expect(page.locator('[formControlName="firstName"]')).toHaveValue('');
  await page.locator('app-chatbot > div button').first().click();
  await page.locator('#chat-message').fill('Preserve this chat message');
  await page
    .locator('app-chatbot')
    .getByRole('button', { name: 'Send Message', exact: true })
    .click();
  await expect.poll(() => pwaServer.state.chats.length).toBe(1);
  await context.setOffline(true);
  await expect(page.locator('#chat-message')).toHaveValue('Preserve this chat message');
  await expect(page.locator('#chat-message')).toBeDisabled();
  await context.setOffline(false);
  await connection(page, 'Online services available');
  expect(pwaServer.state.chats).toHaveLength(1);
  pwaServer.state.holdChat = false;
  pwaServer.releaseOperations();
  await page
    .locator('app-chatbot')
    .getByRole('button', { name: 'Send Message', exact: true })
    .click();
  await expect.poll(() => pwaServer.state.chats.length).toBe(2);
  expect(pwaServer.state.chats[1].requestId).toBe(pwaServer.state.chats[0].requestId);
  await expect(page.locator('#chat-message')).toHaveValue('');
});

test('hides journal content offline and refreshes it on reconnection', async ({
  page,
  context,
  pwaServer,
}) => {
  pwaServer.state.healthy = true;
  await page.goto(pwaServer.origin + '/en/blog');
  await connection(page, 'Online services available');
  await settled(page);
  await expect(page.getByText('Fixture journal entry', { exact: true }).first()).toBeVisible();
  const reads = pwaServer.state.blogRequests;
  await context.setOffline(true);
  await expect(page.getByTestId('blog-offline-notice')).toBeVisible();
  await expect(page.getByText('Fixture journal entry', { exact: true })).toHaveCount(0);
  await context.setOffline(false);
  await connection(page, 'Online services available');
  await expect(page.getByText('Fixture journal entry', { exact: true }).first()).toBeVisible();
  expect(pwaServer.state.blogRequests).toBeGreaterThan(reads);
});

test('applies a real worker update only after the draft is cleared and Reload is clicked', async ({
  page,
  pwaServer,
}) => {
  pwaServer.state.healthy = true;
  await page.goto(pwaServer.origin + '/en/contact');
  await connection(page, 'Online services available');
  await expect(page.locator('app-footer > footer')).toHaveAttribute('data-pwa-readiness', 'ready', {
    timeout: 60000,
  });
  await settled(page);
  const draft = page.locator('[formControlName="firstName"]');
  await draft.fill('Protected draft');
  await pwaServer.publishTestUpdate();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(
    page.getByText('An update is ready. Reload when you are finished.', { exact: true }),
  ).toBeVisible({ timeout: 60000 });
  const reload = page.getByRole('button', { name: 'Reload app', exact: true });
  await expect(reload).toBeDisabled();
  await expect(draft).toHaveValue('Protected draft');
  await expect(page.locator('html')).not.toHaveAttribute('data-pwa-test-version');
  await draft.fill('');
  await expect(reload).toBeEnabled();
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), reload.click()]);
  await expect(page.locator('html')).toHaveAttribute('data-pwa-test-version', 'updated');
  await expect(page.locator('app-footer > footer')).toHaveAttribute('data-pwa-readiness', 'ready', {
    timeout: 60000,
  });
});

test('revokes readiness when a required cached resource is removed', async ({
  page,
  context,
  pwaServer,
}) => {
  await page.goto(pwaServer.origin + '/en');
  await expect(page.locator('app-footer > footer')).toHaveAttribute('data-pwa-readiness', 'ready', {
    timeout: 60000,
  });
  await context.setOffline(true);
  await page.evaluate(async (resource) => {
    for (const name of await caches.keys())
      await (await caches.open(name)).delete(new URL(resource, location.origin).href);
    document.dispatchEvent(new Event('visibilitychange'));
  }, cvResource);
  await expect(page.getByTestId('offline-readiness')).toHaveText('Offline preparation incomplete');
});

test.describe('ordinary browser UI', () => {
  test.use({ standalone: false });

  test('keeps PWA notices hidden online, offline, after installation and after an update', async ({
    page,
    context,
    pwaServer,
  }) => {
    pwaServer.state.healthy = true;
    await page.goto(pwaServer.origin + '/en/contact');
    await connection(page, 'Online services available');
    await expect(page.locator('app-footer > footer')).toHaveAttribute(
      'data-pwa-readiness',
      'ready',
      {
        timeout: 60000,
      },
    );
    await expect(page.locator('app-pwa-status')).toHaveCount(0);
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
    await context.setOffline(true);
    await expect(page.locator('app-footer > footer')).toHaveAttribute(
      'data-connection-state',
      'offline',
    );
    await expect(page.locator('app-pwa-status')).toHaveCount(0);
    await expect(page.getByTestId('contact-offline-notice')).toHaveCount(0);
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await context.setOffline(false);
    await connection(page, 'Online services available');
    await page.goto(pwaServer.origin + '/en/blog');
    await context.setOffline(true);
    await expect(page.locator('app-footer > footer')).toHaveAttribute(
      'data-connection-state',
      'offline',
    );
    await expect(page.getByTestId('blog-offline-notice')).toHaveCount(0);
    await expect(page.getByText('No Articles', { exact: true })).toBeVisible();
    await expect(page.locator('app-pwa-status')).toHaveCount(0);
    await context.setOffline(false);
    await connection(page, 'Online services available');
    await pwaServer.publishTestUpdate();
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            for (const name of await caches.keys()) {
              const cache = await caches.open(name);
              const response = await cache.match(new URL('/index.html', location.origin).href);
              if (response && (await response.text()).includes('data-pwa-test-version="updated"'))
                return true;
            }
            return false;
          }),
        { timeout: 60000 },
      )
      .toBe(true);
    await expect(page.locator('app-pwa-status')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reload app', exact: true })).toHaveCount(0);
  });
});

test('only shows the offline notice for network loss, not backend downtime', async ({
  page,
  context,
  pwaServer,
}) => {
  await page.goto(pwaServer.origin + '/en/contact');
  await connection(page, 'Online services unavailable');
  await expect(page.locator('app-pwa-status')).toHaveCount(0);
  await expect(page.getByTestId('contact-offline-notice')).toHaveCount(0);
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await page.goto(pwaServer.origin + '/en/blog');
  await connection(page, 'Online services unavailable');
  await expect(page.locator('app-pwa-status')).toHaveCount(0);
  await expect(page.getByTestId('blog-offline-notice')).toHaveCount(0);
  await expect(page.getByText('No Articles', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByTestId('connection-status')).toHaveText('Online services unavailable');
  await expect(page.getByTestId('blog-offline-notice')).toBeVisible();
  await context.setOffline(false);
  await connection(page, 'Online services unavailable');
  await expect(page.locator('app-pwa-status')).toHaveCount(0);
  await expect(page.getByTestId('blog-offline-notice')).toHaveCount(0);
});
