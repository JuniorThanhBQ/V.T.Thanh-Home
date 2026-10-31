import { copyFile } from 'node:fs/promises';

const output = new URL('../dist/V.T.Thanh-Home-Angular/browser/', import.meta.url);
await copyFile(new URL('index.csr.html', output), new URL('index.html', output));
console.log('Offline CSR navigation shell prepared alongside SSR output.');
