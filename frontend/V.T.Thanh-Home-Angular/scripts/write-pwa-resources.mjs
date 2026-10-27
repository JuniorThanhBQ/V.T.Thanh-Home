import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const output = new URL('../dist/V.T.Thanh-Home-Angular/browser/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('ngsw.json', output), 'utf8'));
const resources = [];
for (const path of Object.keys(manifest.hashTable).sort()) {
  if (path === '/pwa-resources.json') continue;
  const bytes = await readFile(new URL(path.slice(1), output));
  resources.push({ url: path, sha256: createHash('sha256').update(bytes).digest('hex') });
}
if (!resources.length) throw new Error('Cannot create an empty PWA resource receipt');
const html = await readFile(new URL('index.html', output), 'utf8');
const entryScripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(
  (match) => new URL(match[1], 'https://pwa.invalid/').pathname,
);
if (
  !entryScripts.length ||
  entryScripts.some((path) => !resources.some((resource) => resource.url === path))
)
  throw new Error('Application entry scripts are not covered by the offline receipt');
await writeFile(
  new URL('pwa-resources.json', output),
  JSON.stringify({ entryScripts, resources }) + '\n',
);
console.log(`Offline readiness receipt written for ${resources.length} resources.`);
