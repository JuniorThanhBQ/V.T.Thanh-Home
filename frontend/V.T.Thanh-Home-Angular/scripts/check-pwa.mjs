import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist/V.T.Thanh-Home-Angular/browser');
const inventory = JSON.parse(await readFile(join(root, 'offline-assets.json'), 'utf8'));
const workerManifest = JSON.parse(await readFile(join(output, 'ngsw.json'), 'utf8'));
const appManifest = JSON.parse(await readFile(join(output, 'manifest.webmanifest'), 'utf8'));
const failures = [];
const workerFiles = ['ngsw-worker.js', 'safety-worker.js', 'worker-basic.min.js'];
const prefetched = new Set(
  workerManifest.assetGroups
    .filter((group) => group.installMode === 'prefetch')
    .flatMap((group) => group.urls),
);

if (workerManifest.index !== '/index.html') failures.push('Incorrect navigation shell');
if (workerManifest.dataGroups.length) failures.push('Online API data must not be cached');
if (workerManifest.assetGroups.some((group) => group.patterns.length))
  failures.push('Unexpected runtime asset caching pattern');
for (const path of ['/index.html', '/pwa-resources.json', ...inventory.required]) {
  if (!prefetched.has(path) || !workerManifest.hashTable[path])
    failures.push(`Resource is not integrity-protected and prefetched: ${path}`);
}

async function outputFiles(directory, prefix = '') {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory())
      paths.push(...(await outputFiles(join(directory, entry.name), path + '/')));
    else paths.push(path);
  }
  return paths;
}

for (const path of await outputFiles(output)) {
  if (/\.(?:js|css)$/.test(path) && !workerFiles.includes(path) && !prefetched.has('/' + path)) {
    failures.push(`Application bundle is not prefetched: ${path}`);
  }
}
let cacheBytes = 0;
const receipt = JSON.parse(await readFile(join(output, 'pwa-resources.json'), 'utf8'));
const receiptHashes = new Map(receipt.resources.map((resource) => [resource.url, resource.sha256]));
if (!receipt.entryScripts?.length || receipt.entryScripts.some((path) => !prefetched.has(path)))
  failures.push('Readiness entry scripts are not prefetched');
if (receiptHashes.size !== Object.keys(workerManifest.hashTable).length - 1)
  failures.push('Readiness receipt has incorrect coverage');
for (const [path, hash] of Object.entries(workerManifest.hashTable)) {
  if (!path.startsWith('/') || path.split('/').includes('..') || path.includes('\\'))
    throw new Error(`Invalid cached resource path: ${path}`);
  const bytes = await readFile(join(output, path.slice(1)));
  if (
    path !== '/pwa-resources.json' &&
    receiptHashes.get(path) !== createHash('sha256').update(bytes).digest('hex')
  ) {
    failures.push(`Readiness receipt mismatch: ${path}`);
  }
  cacheBytes += bytes.length;
  if (createHash('sha1').update(bytes).digest('hex') !== hash)
    failures.push(`Final cache hash mismatch: ${path}`);
  if (/^\/(?:api|actuator)(?:\/|$)/.test(path) || path.endsWith('.map'))
    failures.push(`Forbidden cached resource: ${path}`);
}

for (const file of workerFiles) {
  const emitted = await readFile(join(output, file));
  const packageFile = file === 'worker-basic.min.js' ? 'safety-worker.js' : file;
  const packaged = await readFile(
    new URL(import.meta.resolve(`@angular/service-worker/${packageFile}`)),
  );
  if (!emitted.equals(packaged))
    failures.push(`Worker differs from the installed Angular package: ${file}`);
  if (workerManifest.hashTable['/' + file])
    failures.push(`Worker should not cache itself: ${file}`);
}

const isNavigation = (path) =>
  workerManifest.navigationUrls.some(
    (rule) => rule.positive && new RegExp(rule.regex).test(path), // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
  ) &&
  !workerManifest.navigationUrls.some(
    (rule) => !rule.positive && new RegExp(rule.regex).test(path), // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
  );
for (const path of ['/', '/about', '/projects', '/en/about', '/ja/projects', '/blog', '/contact']) {
  if (!isNavigation(path)) failures.push(`Frontend navigation is excluded: ${path}`);
}
for (const path of [
  '/api',
  '/api/viewers',
  '/api/v1/blogs',
  '/actuator',
  '/actuator/health',
  '/missing.js',
  '/canva/missing.png',
]) {
  if (isNavigation(path))
    failures.push(`API or file request would receive the navigation shell: ${path}`);
}

if (
  appManifest.id !== '/' ||
  appManifest.start_url !== '/' ||
  appManifest.scope !== '/' ||
  appManifest.display !== 'standalone'
) {
  failures.push('Incorrect application identity, scope, launch URL, or display mode');
}
for (const size of [192, 512]) {
  if (!appManifest.icons.some((icon) => icon.sizes === `${size}x${size}` && icon.purpose === 'any'))
    failures.push(`Missing standard ${size}px icon`);
}
if (!appManifest.icons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '512x512'))
  failures.push('Missing maskable icon');
for (const icon of appManifest.icons) {
  if (!inventory.required.includes(icon.src))
    failures.push(`Icon missing from inventory: ${icon.src}`);
  const bytes = await readFile(join(output, icon.src.slice(1)));
  if (
    bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}` !== icon.sizes
  ) {
    failures.push(`Incorrect PNG dimensions: ${icon.src}`);
  }
}

console.log(
  `Integrity-checked cache: ${Object.keys(workerManifest.hashTable).length} files, ${(cacheBytes / 1048576).toFixed(2)} MiB`,
);
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(
    'PWA manifest, icon dimensions, prefetch coverage, navigation rules, worker files, and final cache hashes verified.',
  );
}
