import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const inventory = JSON.parse(await readFile(new URL('offline-assets.json', root), 'utf8'));
const config = {
  $schema: './node_modules/@angular/service-worker/config/schema.json',
  index: '/index.html',
  assetGroups: [
    {
      name: 'app-shell',
      installMode: 'prefetch',
      updateMode: 'prefetch',
      resources: {
        files: [
          '/index.html',
          '/manifest.webmanifest',
          '/pwa-resources.json',
          '/**/*.css$',
          '/**/*.js$',
          '!/ngsw-worker.js$',
          '!/safety-worker.js$',
          '!/worker-basic.min.js$',
        ],
      },
    },
    {
      name: 'portfolio',
      installMode: 'prefetch',
      updateMode: 'prefetch',
      resources: {
        files: inventory.required.filter((path) => path !== '/manifest.webmanifest'),
      },
    },
  ],
  dataGroups: [],
  navigationUrls: [
    '/**',
    '!/**/*.*',
    '!/**/*__*',
    '!/**/*__*/**',
    '!/api$',
    '!/api/**',
    '!/actuator$',
    '!/actuator/**',
  ],
  navigationRequestStrategy: 'freshness',
};
const target = new URL('ngsw-config.json', root);
const contents = JSON.stringify(config, null, 2) + '\n';
const existing = await readFile(target, 'utf8').catch((error) => {
  if (error.code !== 'ENOENT') throw error;
  return '';
});
if (existing.replaceAll('\r\n', '\n') !== contents) await writeFile(target, contents);
console.log(`Service worker configuration prepared from ${inventory.required.length} resources.`);
