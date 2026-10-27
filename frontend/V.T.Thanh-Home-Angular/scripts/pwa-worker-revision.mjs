import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export async function workerRevisionSuffix(output, hostingPath = join(projectRoot, 'vercel.json')) {
  const hosting = JSON.parse(await readFile(hostingPath, 'utf8'));
  const manifest = JSON.parse(await readFile(join(output, 'ngsw.json'), 'utf8'));
  const revision = createHash('sha256').update(JSON.stringify({ hosting, manifest })).digest('hex');
  return Buffer.from(`\n;void "pwa-deployment:${revision}";\n`);
}
