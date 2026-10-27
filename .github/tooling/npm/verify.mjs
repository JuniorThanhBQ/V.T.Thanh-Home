import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const frontend = JSON.parse(
  await readFile(new URL('../../../frontend/V.T.Thanh-Home-Angular/package.json', import.meta.url)),
);
const installed = JSON.parse(
  await readFile(new URL('./node_modules/npm/package.json', import.meta.url)),
);

assert.equal(`npm@${installed.version}`, frontend.packageManager, 'CI npm must match packageManager');
console.log(`Verified CI package manager: npm@${installed.version}`);
