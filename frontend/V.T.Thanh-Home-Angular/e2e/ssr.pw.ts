import { test as base, expect } from '@playwright/test';
import { startSsrServer } from './fixtures/ssr-server';

const test = base.extend<{ ssr: Awaited<ReturnType<typeof startSsrServer>> }>({
  ssr: async ({}, use) => {
    const server = await startSsrServer();
    try {
      await use(server);
    } finally {
      await server.stop();
    }
  },
});

test.describe('initial rendering on refresh', () => {
  test.use({ serviceWorkers: 'block' });

  for (const scenario of [
    { saved: 'dark', system: 'light', expected: 'dark' },
    { saved: 'light', system: 'dark', expected: 'light' },
    { saved: null, system: 'dark', expected: 'dark' },
    { saved: 'blocked', system: 'dark', expected: 'dark' },
  ] as const) {
    test(`paints the ${scenario.expected} loader before Angular with ${scenario.saved ?? 'system'} preference`, async ({
      page,
      context,
      ssr,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (/NG05\d+/.test(message.text())) errors.push(message.text());
      });
      await page.emulateMedia({ colorScheme: scenario.system });
      await page.addInitScript((saved) => {
        if (saved === 'blocked') {
          Object.defineProperty(window, 'localStorage', {
            get() {
              throw new DOMException('Storage unavailable', 'SecurityError');
            },
          });
        } else if (saved) {
          localStorage.setItem('app_theme', saved);
        }
      }, scenario.saved);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      for (const reload of [false, true]) {
        let releaseMain!: () => void;
        const gate = new Promise<void>((resolve) => {
          releaseMain = resolve;
        });
        await page.route('**/main-*.js', async (route) => {
          await gate;
          await route.continue();
        });
        try {
          const response = reload
            ? await page.reload({ waitUntil: 'commit' })
            : await page.goto(ssr.origin + '/en/about', { waitUntil: 'commit' });
          expect(await response!.text()).toContain('<app-about');
          await page.waitForFunction(() => performance.getEntriesByType('paint').length > 0);
          await expect(page.locator('html')).toHaveClass(/theme-initializing/);
          await expect(page.locator('html')).toHaveCSS('color-scheme', scenario.expected);
          const loader = page.locator('app-loading > div');
          await expect(loader).toHaveCSS(
            'background-color',
            scenario.expected === 'dark' ? 'rgb(25, 45, 72)' : 'rgb(219, 237, 255)',
          );
          await expect(loader).toHaveCSS('transition-duration', '0s');
          expect(
            await loader.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              const viewport = window.visualViewport;
              const top = viewport?.offsetTop ?? 0;
              const bottom = top + (viewport?.height ?? innerHeight);
              return rect.top <= top + 1 && rect.bottom >= bottom - 1;
            }),
          ).toBe(true);
        } finally {
          releaseMain();
        }
        await page.waitForFunction(
          () =>
            (document.querySelector('app-loading > div')?.getBoundingClientRect().bottom ?? 1) <= 1,
        );
        await expect(page.locator('html')).not.toHaveClass(/theme-initializing/);
        await expect(page.locator('html')).toHaveCSS('color-scheme', scenario.expected);
        await expect(page.locator('body')).toHaveCSS('transition-duration', '0.3s, 0.3s');
        await page.unroute('**/main-*.js');
      }
      expect(errors).toEqual([]);
      await page
        .getByRole('button', {
          name: `Switch to ${scenario.expected === 'dark' ? 'light' : 'dark'} mode`,
        })
        .click();
      await expect(page.locator('html')).toHaveCSS(
        'color-scheme',
        scenario.expected === 'dark' ? 'light' : 'dark',
      );
    });
  }

  test('keeps server content accessible without JavaScript', async ({ browser, ssr }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(ssr.origin + '/en/about');
      await expect(page.getByRole('heading', { name: 'About Me', exact: true })).toBeVisible();
      await expect(page.locator('app-loading')).not.toBeVisible();
    } finally {
      await context.close();
    }
  });
});

test('keeps the closed assistant out of keyboard navigation and restores launcher focus', async ({
  page,
  ssr,
}) => {
  await page.goto(ssr.origin + '/en/about');
  const panel = page.locator('app-chatbot aside');
  const launcher = page.getByRole('button', { name: 'Open Virtual Assistant', exact: true });
  const close = panel.getByRole('button', { name: 'Close Virtual Assistant', exact: true });
  await expect(panel).toHaveJSProperty('inert', true);
  await close.evaluate((element: HTMLElement) => element.focus());
  await expect(close).not.toBeFocused();
  await launcher.click();
  await expect(panel).toHaveJSProperty('inert', false);
  await expect(close).toBeFocused();
  await close.click();
  await expect(launcher).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(false);
  await launcher.click();
  await page.keyboard.press('Escape');
  await expect(launcher).toBeFocused();
  await expect(panel).toHaveJSProperty('inert', true);
});

test('contains CV focus, restores the trigger, and reserves badge image dimensions', async ({
  page,
  ssr,
}) => {
  await page.goto(ssr.origin + '/en/about');
  const trigger = page.getByRole('button', { name: 'View Curriculum Vitae', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Curriculum Vitae', exact: true });
  await trigger.click();
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page
    .getByRole('button', { name: 'Badges', exact: true })
    .evaluate((element: HTMLElement) => element.focus());
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  expect(
    await page
      .locator('app-about')
      .evaluate(
        (element) =>
          document.activeElement === document.body ||
          !!element.querySelector('dialog:modal')?.contains(document.activeElement),
      ),
  ).toBe(true);
  await dialog.getByRole('button', { name: 'Next Page', exact: true }).click();
  await expect(dialog).toContainText('Page 2 / 2');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toContainText('Page 1 / 2');
  await dialog.getByRole('button', { name: 'Return to Portfolio' }).click();
  await expect(trigger).toBeFocused();
  await expect(page.locator('img[src*="tweenframe"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Badges', exact: true }).click();
  const badge = page.getByRole('dialog', { name: 'Badges', exact: true }).getByRole('img');
  await expect(badge).toHaveAttribute('width', '1050');
  await expect(badge).toHaveAttribute('height', '590');
  await expect(badge).toHaveCSS('aspect-ratio', '1050 / 590');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.locator('link[rel="preload"][href*="/i18n/"]')).toHaveCount(0);
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

test('allows Angular replay scripts while blocking unapproved inline scripts', async ({
  page,
  ssr,
}) => {
  await page.addInitScript(() => {
    const scope = window as unknown as Window & { cspViolations: string[] };
    scope.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      if (event.effectiveDirective.startsWith('script-src'))
        scope.cspViolations.push(event.blockedURI);
    });
  });
  for (const route of ['/de', '/de/about', '/de/contact']) {
    await page.goto(ssr.origin + route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect
      .poll(() =>
        page.evaluate(
          () => typeof (window as Window & { __jsaction_bootstrap?: unknown }).__jsaction_bootstrap,
        ),
      )
      .toBe('function');
    expect(
      await page.evaluate(
        () => (window as unknown as Window & { cspViolations: string[] }).cspViolations,
      ),
    ).toEqual([]);
  }
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.unapprovedInlineExecuted = true';
    document.body.appendChild(script);
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as Window & { cspViolations: string[] }).cspViolations,
      ),
    )
    .toContain('inline');
  expect(
    await page.evaluate(
      () => (window as Window & { unapprovedInlineExecuted?: boolean }).unapprovedInlineExecuted,
    ),
  ).toBeUndefined();
});
