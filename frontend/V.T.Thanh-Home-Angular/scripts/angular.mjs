import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url));
const args = process.argv.slice(2);

if (args[0] === 'build' || args[0] === 'serve') {
  let dsn = process.env.SENTRY_DSN;
  if (dsn === undefined) {
    try {
      dsn = parseEnv(readFileSync(new URL('../.env', import.meta.url), 'utf8')).SENTRY_DSN;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (!dsn?.trim()) {
    console.error('Unset variable SENTRY_DSN. Set it in the environment or the Angular project .env file.');
    process.exit(1);
  }
  try {
    const url = new URL(dsn);
    if (!['https:', 'http:'].includes(url.protocol) || !url.username || !/^\/\d+$/.test(url.pathname)) {
      throw new Error('Invalid DSN');
    }
  } catch {
    console.error('SENTRY_DSN must be a valid Sentry project DSN.');
    process.exit(1);
  }
  args.push('--define', `process.env.SENTRY_DSN=${JSON.stringify(dsn)}`);
}

const result = spawnSync(process.execPath, [cli, ...args], {
  cwd: projectRoot,
  stdio: 'inherit',
});
if (result.error) {
  console.error(result.error.message);
}
process.exit(result.status ?? 1);
