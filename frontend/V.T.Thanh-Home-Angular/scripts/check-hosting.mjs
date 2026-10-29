import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getTransformedRoutes, sourceToRegex } from '@vercel/routing-utils';
import middleware, { config as middlewareConfig } from '../middleware.ts';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('vercel.json', root), 'utf8'));
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const inventory = JSON.parse(await readFile(new URL('offline-assets.json', root), 'utf8'));
const transformed = getTransformedRoutes(config);
assert.equal(transformed.error, null, JSON.stringify(transformed.error));
assert.equal(config.buildCommand, 'npm run build');
assert.equal(config.outputDirectory, 'dist/V.T.Thanh-Home-Angular/browser');
assert.equal(config.installCommand, undefined);
assert.equal(pkg.engines.node, '24.x');
const matches = (rule, pathname) => new RegExp(sourceToRegex(rule.source).src).test(pathname); // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
const headersFor = (pathname) => {
  const headers = new Map();
  for (const rule of config.headers) {
    if (rule.has || rule.missing || !matches(rule, pathname)) continue;
    for (const header of rule.headers) headers.set(header.key.toLowerCase(), header.value);
  }
  return headers;
};
const spa = config.rewrites.filter((rule) => rule.destination === '/index.html');
assert.equal(spa.length, 1, 'Expected a single SPA fallback');
const metadata = [
  '/ngsw-worker.js',
  '/ngsw.json',
  '/pwa-resources.json',
  '/safety-worker.js',
  '/worker-basic.min.js',
  '/manifest.webmanifest',
];
for (const pathname of metadata) {
  const headers = headersFor(pathname);
  assert.match(headers.get('cache-control'), /max-age=0/);
  assert.match(headers.get('cache-control'), /must-revalidate/);
  assert.doesNotMatch(headers.get('cache-control'), /immutable/);
  assert.equal(headers.get('cdn-cache-control'), 'no-store');
}
assert.equal(headersFor('/ngsw-worker.js').get('service-worker-allowed'), '/');
assert.match(
  headersFor('/manifest.webmanifest').get('content-type'),
  /^application\/manifest\+json/,
);
assert.match(headersFor('/').get('content-security-policy'), /worker-src 'self';/);
const workerCsp = headersFor('/ngsw-worker.js').get('content-security-policy');
for (const directive of ['connect-src', 'img-src']) {
  const sources = workerCsp
    .split(';')
    .map((part) => part.trim().split(/\s+/))
    .find((part) => part[0] === directive);
  assert.ok(sources?.includes('https://res.cloudinary.com'), `${directive} must allow Blog images`);
}
for (const pathname of [
  ...metadata,
  ...inventory.required,
  '/index.html',
  '/main-ABCDEFGH.js',
  '/missing.png',
  '/canva/missing',
  '/icons/missing',
  '/api',
  '/api/viewers',
  '/api/v1/blogs',
  '/actuator',
  '/actuator/health',
  '/robots.txt',
  '/llms.txt',
  '/sitemap.xml',
]) {
  assert.equal(
    matches(spa[0], pathname),
    false,
    `SPA fallback intercepts a file or backend path: ${pathname}`,
  );
}
let navigations = 0;
for (const prefix of ['', '/en', '/de', '/fr', '/ja', '/zh', '/es', '/ru', '/kr']) {
  for (const page of ['', '/about', '/projects', '/blog', '/contact', '/admin']) {
    const pathname = prefix + page || '/';
    assert.equal(matches(spa[0], pathname), true, `Frontend route missing fallback: ${pathname}`);
    assert.match(headersFor(pathname).get('cache-control'), /max-age=0/);
    navigations++;
  }
}
assert.match(headersFor('/main-ABCDEFGH.js').get('cache-control'), /immutable/);
for (const pathname of ['/api/viewers', '/api/v1/contacts', '/actuator/health'])
  assert.match(headersFor(pathname).get('cache-control'), /no-store/);
assert.ok(
  config.rewrites.some(
    (rule) =>
      rule.source === '/api/v1/:path*' &&
      rule.destination === 'https://vtthanh-backend-latest.onrender.com/api/v1/:path*',
  ),
);
assert.ok(
  config.rewrites.some(
    (rule) =>
      rule.source === '/actuator/:path*' &&
      rule.destination === 'https://vtthanh-backend-latest.onrender.com/actuator/:path*',
  ),
);
assert.equal(middlewareConfig.matcher, '/');
assert.equal(headersFor('/').get('content-type'), undefined);
assert.match(headersFor('/llms.txt').get('content-type'), /^text\/markdown/);
const markdown = await readFile(new URL('public/llms.txt', root), 'utf8');
assert.match(markdown, /^# /);
assert.doesNotMatch(markdown, /^\s*(?:<!doctype|<html)/i);
for (const [accept, expected] of [
  ['text/markdown', true],
  ['text/markdown, text/html;q=0.9', true],
  ['text/html;q=0.5, text/markdown;q=0.9', true],
  ['TEXT/MARKDOWN; q=1.0', true],
  ['text/markdown;q=0.1, */*;q=0.01', true],
  ['text/html', false],
  ['text/markdown;q=0', false],
  ['text/markdown;q=0, */*', false],
  ['text/markdown;q=0.5, text/html', false],
  ['text/markdown;q=invalid', false],
  ['*/*', false],
  ['', false],
]) {
  for (const method of ['GET', 'HEAD']) {
    const response = middleware(
      new Request('https://example.test/', {
        method,
        headers: { Accept: accept },
      }),
    );
    assert.equal(response.headers.get('vary'), 'Accept');
    assert.equal(response.headers.has('content-type'), false);
    assert.equal(
      response.headers.get('x-middleware-rewrite'),
      expected ? 'https://example.test/llms.txt' : null,
      `${method} ${accept}: incorrect content negotiation`,
    );
  }
}
const writeResponse = middleware(
  new Request('https://example.test/', {
    method: 'POST',
    headers: { Accept: 'text/markdown' },
  }),
);
assert.equal(writeResponse.headers.has('x-middleware-rewrite'), false);
console.log(
  `Vercel routing compiler accepted the configuration; ${navigations} frontend routes, metadata headers, cache policies, API proxies, and asset exclusions verified.`,
);
