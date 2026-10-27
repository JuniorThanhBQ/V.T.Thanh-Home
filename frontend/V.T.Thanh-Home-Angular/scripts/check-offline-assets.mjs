import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, join, resolve, sep } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = resolve(root, 'public');
const buildRoot = resolve(root, 'dist/V.T.Thanh-Home-Angular/browser');
const inventory = JSON.parse(await readFile(join(root, 'offline-assets.json'), 'utf8'));
const checkBuild = process.argv.includes('--build');
const failures = [];
const required = new Set(inventory.required);
const sourceRoots = [
  'src/assets',
  'src/features/home',
  'src/features/about',
  'src/features/project',
  'src/shared/components',
  'src/styles.css',
];

async function filesIn(path) {
  if (!(await stat(path)).isDirectory()) return [path];
  const entries = await readdir(path, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => filesIn(join(path, entry.name))));
  return groups.flat();
}

function resourcePath(directory, resource) {
  if (
    typeof resource !== 'string' ||
    !resource.startsWith('/') ||
    resource.includes('?') ||
    resource.includes('#')
  ) {
    throw new Error(`Invalid inventory path: ${resource}`);
  }
  const path = resolve(directory, resource.slice(1));
  if (!path.startsWith(directory + sep)) throw new Error(`Resource escapes directory: ${resource}`);
  return path;
}

function validateResource(resource, bytes) {
  if (!bytes.length) throw new Error('Empty resource');
  const extension = extname(resource);
  if (extension === '.png' && bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
    throw new Error('Invalid PNG signature');
  if (extension === '.jpg' && bytes.subarray(0, 3).toString('hex') !== 'ffd8ff')
    throw new Error('Invalid JPEG signature');
  if (
    extension === '.webp' &&
    (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP')
  )
    throw new Error('Invalid WebP signature');
  if (extension === '.woff2' && bytes.toString('ascii', 0, 4) !== 'wOF2')
    throw new Error('Invalid WOFF2 signature');
  if (extension === '.ico' && bytes.subarray(0, 4).toString('hex') !== '00000100')
    throw new Error('Invalid ICO signature');
  if (extension === '.json' || extension === '.webmanifest') JSON.parse(bytes.toString('utf8'));
  if (extension === '.svg') {
    const svg = bytes.toString('utf8');
    if (
      !/<svg[\s>]/i.test(svg) ||
      /<script\b|<foreignObject\b|\b(?:href|src)\s*=\s*["'](?:https?:|\/\/)|url\(\s*["']?(?:https?:|\/\/)/i.test(
        svg,
      )
    ) {
      throw new Error('SVG is invalid or depends on external content');
    }
  }
}

if (!required.size || required.size !== inventory.required.length)
  failures.push('Inventory is empty or contains duplicate paths');

for (const sourceRoot of sourceRoots) {
  for (const file of await filesIn(join(root, sourceRoot))) {
    if (!['.ts', '.html', '.css', '.js'].includes(extname(file))) continue;
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/\/(?:canva|flags|badges|fonts|icons)\/[^\s'"`<>),;]+/g)) {
      if (!required.has(match[0])) failures.push(`Unlisted resource in ${file}: ${match[0]}`);
    }
    if (
      /https?:\/\/[^\s'"`<>)]*\.(?:png|jpe?g|webp|gif|svg|woff2?)(?:[?'"`\s<>)]|$)/i.test(source)
    ) {
      failures.push(`Remote media reference in offline source: ${file}`);
    }
  }
}

const languageDirectory = join(publicRoot, 'i18n');
for (const file of await readdir(languageDirectory)) {
  if (file.endsWith('.json') && !required.has(`/i18n/${file}`))
    failures.push(`Unlisted translation: ${file}`);
}

let requiredBytes = 0;
for (const resource of required) {
  try {
    const bytes = await readFile(resourcePath(publicRoot, resource));
    validateResource(resource, bytes);
    requiredBytes += bytes.length;
    if (checkBuild) {
      const built = await readFile(resourcePath(buildRoot, resource));
      if (
        createHash('sha256').update(bytes).digest('hex') !==
        createHash('sha256').update(built).digest('hex')
      ) {
        failures.push(`Built resource differs from public resource: ${resource}`);
      }
    }
  } catch (error) {
    failures.push(`${resource}: ${error.message}`);
  }
}

function checkBudget(label, bytes, budget) {
  if (!Number.isSafeInteger(budget) || budget <= 0) failures.push(`${label}: invalid budget`);
  else {
    console.log(
      `${label}: ${(bytes / 1048576).toFixed(2)} MiB / ${(budget / 1048576).toFixed(2)} MiB`,
    );
    if (bytes > budget) failures.push(`${label} exceeds budget by ${bytes - budget} bytes`);
  }
}

console.log(`Required resources: ${required.size}`);
checkBudget('Required static assets', requiredBytes, inventory.budgets.requiredAssetsBytes);
if (checkBuild) {
  const files = await filesIn(buildRoot);
  let outputBytes = 0;
  for (const file of files) {
    outputBytes += (await stat(file)).size;
    if (file.endsWith('.map')) failures.push(`Source map remains in production output: ${file}`);
  }
  checkBudget('Complete production output', outputBytes, inventory.budgets.productionOutputBytes);
}

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(
    checkBuild
      ? 'Offline assets and production copies verified.'
      : 'Offline asset inventory verified.',
  );
}
