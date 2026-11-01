import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { JSDOM } from 'jsdom';

const hosting = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const policy = hosting.headers
  .flatMap((rule) => rule.headers)
  .find((header) => header.key.toLowerCase() === 'content-security-policy').value;
const scriptPolicy = policy
  .split(';')
  .find((directive) => directive.trim().startsWith('script-src '));
assert.ok(!scriptPolicy.includes("'unsafe-inline'"));
const backendRequests = [];
let finishStream;
let streamClosed;
const backend = createServer((request, response) => {
  if (request.url === '/api/v1/chat/message/stream') {
    assert.equal(request.headers.cookie, 'session=fixture');
    assert.equal(request.headers['x-xsrf-token'], 'fixture-token');
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Set-Cookie': 'session=fixture; HttpOnly; Path=/',
      'X-Accel-Buffering': 'no',
    });
    response.write('event: delta\ndata: {"text":"first"}\n\n');
    finishStream = () => response.end('event: done\ndata: {"reply":"complete"}\n\n');
    response.once('close', () => streamClosed?.());
    return;
  }
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
  const streamOptions = {
    method: 'POST',
    headers: { cookie: 'session=fixture', 'x-xsrf-token': 'fixture-token' },
    body: '{}',
    signal: AbortSignal.timeout(5000),
  };
  const streamed = await fetch(origin + '/api/v1/chat/message/stream', streamOptions);
  assert.equal(streamed.status, 200);
  assert.equal(streamed.headers.get('x-accel-buffering'), 'no');
  assert.ok(streamed.headers.get('set-cookie').includes('HttpOnly'));
  assert.ok(streamed.headers.get('cache-control').includes('no-transform'));
  const reader = streamed.body.getReader();
  const first = await reader.read();
  assert.ok(new TextDecoder().decode(first.value).includes('first'));
  assert.equal(first.done, false);
  finishStream();
  let remaining = '';
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    remaining += new TextDecoder().decode(chunk.value);
  }
  assert.ok(remaining.includes('event: done'));
  const aborted = new AbortController();
  const pending = await fetch(origin + '/api/v1/chat/message/stream', {
    ...streamOptions,
    signal: AbortSignal.any([aborted.signal, AbortSignal.timeout(5000)]),
  });
  await pending.body.getReader().read();
  await new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error('Upstream was not cancelled')), 3000);
    streamClosed = () => {
      clearTimeout(deadline);
      resolve();
    };
    aborted.abort();
  });
  console.log('SSR proxy streamed before completion and cancelled upstream on disconnect.');
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
      const dom = new JSDOM(html);
      for (const script of dom.window.document.querySelectorAll('script')) {
        const type = (script.getAttribute('type') || '').trim().toLowerCase();
        if (script.hasAttribute('src') || type === 'application/json' || type === 'application/ld+json')
          continue;
        const hash = createHash('sha256').update(script.textContent ?? '').digest('base64');
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
