import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(
  fileURLToPath(new URL('../dist/V.T.Thanh-Home-Angular/browser/', import.meta.url)),
);
await stat(resolve(root, 'ngsw.json'));
const port = Number(process.env.PWA_PREVIEW_PORT ?? 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Invalid PWA_PREVIEW_PORT');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (/^\/(?:api|actuator)(?:\/|$)/.test(pathname)) {
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(
        JSON.stringify({ error: 'Online services are unavailable in the local PWA preview' }),
      );
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    let target = resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    if (pathname.endsWith('/')) target = resolve(target, 'index.html');
    let bytes;
    try {
      bytes = await readFile(target);
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) throw error;
      if (!extname(pathname) && request.headers.accept?.includes('text/html')) {
        target = resolve(root, 'index.html');
        bytes = await readFile(target);
      } else {
        response.writeHead(404);
        response.end();
        return;
      }
    }
    response.writeHead(200, {
      'Content-Type': types[extname(target)] ?? 'application/octet-stream',
      'Content-Length': bytes.length,
    });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 500);
    response.end();
    console.error(error.message);
  }
});
server.listen(port, '127.0.0.1', () => console.log(`PWA preview: http://127.0.0.1:${port}`));
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
