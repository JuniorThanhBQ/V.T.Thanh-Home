import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';

const argument = process.argv[2];
if (!argument) throw new Error('Usage: npm run probe:pwa -- https://your-deployment.example');
let base;
try {
  base = new URL(argument);
} catch {
  throw new Error('Supply a valid public deployment origin');
}
assert.ok(
  base.protocol === 'https:' ||
    (base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)),
  'Use HTTPS or a loopback test origin',
);
if (base.username || base.password || base.search || base.hash)
  throw new Error('Use a public origin without credentials or query parameters');
assert.equal(base.pathname, '/', 'This app is deployed at the origin root');
async function get(pathname, accept = '*/*') {
  const target = new URL(pathname, base);
  assert.equal(target.origin, base.origin, 'Resources must belong to the deployment origin');
  const response = await fetch(target, {
    headers: { Accept: accept },
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(response.ok, `${pathname}: HTTP ${response.status}`);
  assert.equal(
    new URL(response.url).origin,
    base.origin,
    `${pathname}: unexpected cross-origin redirect`,
  );
  return { response, bytes: Buffer.from(await response.arrayBuffer()) };
}
const names = [
  '/ngsw.json',
  '/manifest.webmanifest',
  '/pwa-resources.json',
  '/ngsw-worker.js',
  '/safety-worker.js',
  '/worker-basic.min.js',
];
const resources = new Map(
  await Promise.all(
    names.map(async (pathname) => {
      const resource = await get(pathname);
      const cache = resource.response.headers.get('cache-control') ?? '';
      assert.ok(
        /no-store/.test(cache) ||
          (/max-age=0/.test(cache) && /must-revalidate|no-cache/.test(cache)),
        `${pathname}: metadata can become stale`,
      );
      assert.doesNotMatch(cache, /immutable/, `${pathname}: metadata must not be immutable`);
      const type = resource.response.headers.get('content-type') ?? '';
      if (pathname.endsWith('.js'))
        assert.match(type, /javascript|ecmascript/, `${pathname}: incorrect worker MIME type`);
      else if (pathname.endsWith('.webmanifest'))
        assert.match(type, /application\/manifest\+json/, 'Incorrect manifest MIME type');
      else assert.match(type, /application\/json/, `${pathname}: incorrect JSON MIME type`);
      assert.doesNotMatch(
        resource.bytes.toString('utf8', 0, 80),
        /^\s*(?:<!doctype|<html)/i,
        `${pathname}: received HTML`,
      );
      return [pathname, resource];
    }),
  ),
);
const workerManifest = JSON.parse(resources.get('/ngsw.json').bytes.toString('utf8'));
const manifest = JSON.parse(resources.get('/manifest.webmanifest').bytes.toString('utf8'));
const receipt = JSON.parse(resources.get('/pwa-resources.json').bytes.toString('utf8'));
assert.equal(workerManifest.index, '/index.html');
assert.equal(workerManifest.dataGroups.length, 0);
assert.equal(manifest.id, '/');
assert.equal(manifest.scope, '/');
assert.equal(manifest.start_url, '/');
assert.equal(manifest.display, 'standalone');
for (const size of ['192x192', '512x512'])
  assert.ok(
    manifest.icons.some((icon) => icon.sizes === size && icon.purpose === 'any'),
    `Missing ${size} standard icon`,
  );
assert.ok(
  manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'),
  'Missing maskable icon',
);
assert.equal(receipt.resources.length, Object.keys(workerManifest.hashTable).length - 1);
for (const pathname of ['/manifest.webmanifest', '/pwa-resources.json'])
  assert.equal(
    createHash('sha1').update(resources.get(pathname).bytes).digest('hex'),
    workerManifest.hashTable[pathname],
    `${pathname}: deployed metadata versions disagree`,
  );
for (const icon of manifest.icons) {
  assert.ok(icon.src.startsWith('/') && !icon.src.startsWith('//'), 'Icons must be local');
  const { bytes } = await get(icon.src);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes);
  assert.equal(createHash('sha1').update(bytes).digest('hex'), workerManifest.hashTable[icon.src]);
}
for (const pathname of ['/index.html', '/about', '/en/projects']) {
  const { bytes, response } = await get(pathname, 'text/html');
  assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  assert.equal(
    createHash('sha1').update(bytes).digest('hex'),
    workerManifest.hashTable['/index.html'],
    `${pathname}: incorrect or stale navigation HTML`,
  );
}
const missing = await fetch(
  new URL(`/pwa-probe-missing-${randomBytes(6).toString('hex')}.js`, base),
  { signal: AbortSignal.timeout(15000) },
);
assert.equal(missing.status, 404, 'A missing JavaScript asset must not receive the SPA shell');
console.log(
  `PWA endpoint probe passed for ${base.origin}: metadata/cache headers, worker MIME types, coherent hashes, icons, deep links, and missing-file handling.`,
);
