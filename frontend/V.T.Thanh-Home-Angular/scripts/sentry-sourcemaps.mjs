import { SentryCli } from '@sentry/cli';
import { readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const output = fileURLToPath(new URL('../dist/V.T.Thanh-Home-Angular/browser/', import.meta.url));
const ignoredFiles = ['ngsw-worker.js', 'safety-worker.js', 'worker-basic.min.js', 'theme-init.js'];

async function findMaps(directory) {
  const maps = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      maps.push(...(await findMaps(path)));
    } else if (entry.name.endsWith('.map')) {
      maps.push(path);
    }
  }
  return maps;
}

const maps = await findMaps(output);
if (maps.length > 0) {
  const cli = new SentryCli(null, {
    org: 'vtthanh-group',
    project: 'vtthanh-home-angular',
  });
  await cli.sourceMaps.inject({ paths: [output], ignore: ignoredFiles });
  if (process.env.SENTRY_AUTH_TOKEN) {
    await cli.execute(
      [
        'sourcemaps',
        'upload',
        '--validate',
        ...ignoredFiles.flatMap((file) => ['--ignore', file]),
        output,
      ],
      true,
    );
  } else {
    console.warn('SENTRY_AUTH_TOKEN is unset; source maps were not uploaded to Sentry.');
  }
  await Promise.all(maps.map((path) => unlink(path)));
}
