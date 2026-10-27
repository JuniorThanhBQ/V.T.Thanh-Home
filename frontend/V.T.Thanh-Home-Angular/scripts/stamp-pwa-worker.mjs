import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { projectRoot, workerRevisionSuffix } from './pwa-worker-revision.mjs';

const output = resolve(process.argv[2] ?? join(projectRoot, 'dist/V.T.Thanh-Home-Angular/browser'));
if (!output.startsWith(resolve(projectRoot) + sep))
  throw new Error('Worker output must be inside the frontend project');
const hostingPath = process.argv[3] ? resolve(process.argv[3]) : undefined;
const packaged = await readFile(
  new URL(import.meta.resolve('@angular/service-worker/ngsw-worker.js')),
);
const suffix = await workerRevisionSuffix(output, hostingPath);
await writeFile(join(output, 'ngsw-worker.js'), Buffer.concat([packaged, suffix]));
console.log(`Service worker deployment revision: ${suffix.toString().match(/[a-f0-9]{64}/)[0]}`);
