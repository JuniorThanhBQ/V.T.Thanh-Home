import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';

const hosting = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const policy = hosting.headers
  .flatMap((rule) => rule.headers)
  .find((header) => header.key.toLowerCase() === 'content-security-policy').value;
const scriptPolicy = policy
  .split(';')
  .find((directive) => directive.trim().startsWith('script-src '));
assert.ok(!scriptPolicy.includes("'unsafe-inline'"));
const backendRequests = [];
const backend = createServer((request, response) => {
  backendRequests.push({ method: request.method, url: request.url });
  response.setHeader('Content-Type', 'application/json');
  response.end(
    JSON.stringify([
      {
        slug: 'ssr-contract',
        title: 'SSR contract article',
        description: 'Public server content',
        category: 'Engineering',
      },
    ]),
  );
});
backend.listen(0, '127.0.0.1');
await once(backend, 'listening');
process.env['SSR_BACKEND_ORIGIN'] = `http://127.0.0.1:${backend.address().port}`;
const { default: handler } = await import('../api/ssr.mjs');
const server = createServer(handler);
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  let routes = 0;
  for (const lang of ['', 'en', 'de', 'fr', 'ja', 'zh', 'es', 'ru', 'kr']) {
    const prefix = lang ? `/${lang}` : '';
    for (const [page, component] of [
      ['', 'app-home'],
      ['/about', 'app-about'],
      ['/projects', 'app-project'],
      ['/blog', 'app-blog'],
      ['/contact', 'app-contact'],
    ]) {
      const path = prefix + page || '/';
      const response = await fetch(origin + path, { signal: AbortSignal.timeout(15000) });
      const html = await response.text();
      assert.equal(response.status, 200, path);
      for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        if (/\bsrc=/.test(match[1]) || /type="application\/(?:ld\+)?json"/.test(match[1])) continue;
        const hash = createHash('sha256').update(match[2]).digest('base64');
        assert.ok(
          scriptPolicy.includes(`'sha256-${hash}'`),
          `${path}: CSP blocks generated inline script ${hash}`,
        );
      }
      assert.ok(html.includes(`<${component}`), `${path}: missing public content`);
      assert.ok(html.includes('ngh='), `${path}: missing hydration state`);
      assert.ok(
        html.includes(`dictionary-${lang || 'vi'}`),
        `${path}: missing transferred dictionary`,
      );
      assert.ok(
        html.includes(`lang="${lang === 'kr' ? 'ko' : lang || 'vi'}"`),
        `${path}: wrong language`,
      );
      if (page === '/blog')
        assert.ok(html.includes('SSR contract article'), `${path}: blog not rendered`);
      routes++;
    }
    const response = await fetch(origin + prefix + '/admin');
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(!html.includes('ngh='), 'Admin must remain CSR');
    routes++;
  }
  assert.ok(
    backendRequests.every(
      (request) => request.method === 'GET' && request.url.startsWith('/api/v1/blogs'),
    ),
    'SSR must not poll health or register visitors',
  );
  const asset = await fetch(origin + '/missing-ssr-contract.js');
  assert.equal(asset.status, 404);
  const missingWellKnown = await fetch(origin + '/.well-known/missing-contract');
  assert.equal(missingWellKnown.status, 404);
  const trafficAdvice = await fetch(origin + '/.well-known/traffic-advice');
  assert.equal(trafficAdvice.status, 200);
  assert.ok((await trafficAdvice.text()).includes('prefetch-proxy'));
  const securityTxt = await fetch(origin + '/.well-known/security.txt');
  assert.equal(securityTxt.status, 200);
  assert.ok((await securityTxt.text()).includes('mailto:'));
  const shell = await fetch(origin + '/index.html');
  assert.equal(shell.status, 200);
  assert.ok(!(await shell.text()).includes('ngh='), 'Offline shell must bootstrap as CSR');
  console.log(
    `SSR contract passed: ${routes} routes, public blog data, dictionary transfer, CSR admin, offline shell, and missing assets.`,
  );
} finally {
  server.closeAllConnections();
  backend.closeAllConnections();
  await Promise.all([
    new Promise((resolve) => server.close(resolve)),
    new Promise((resolve) => backend.close(resolve)),
  ]);
}
