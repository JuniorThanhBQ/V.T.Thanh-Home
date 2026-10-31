import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';

export async function startSsrServer() {
  let healthy = true;
  const backend = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url?.startsWith('/api/v1/blogs')) {
      response.end(
        JSON.stringify([
          {
            slug: 'ssr-fixture',
            title: 'Server rendered journal',
            description: 'SSR fixture content',
            category: 'Engineering',
          },
        ]),
      );
    } else if (request.url === '/actuator/health') {
      response.statusCode = healthy ? 200 : 503;
      response.end(JSON.stringify({ status: healthy ? 'UP' : 'DOWN' }));
    } else if (request.url === '/api/v1/security/csrf') {
      response.end(JSON.stringify({ token: 'ssr-test-token' }));
    } else {
      response.end(JSON.stringify({ registered: true }));
    }
  });
  backend.listen(0, '127.0.0.1');
  await once(backend, 'listening');
  const backendAddress = backend.address();
  if (!backendAddress || typeof backendAddress === 'string')
    throw new Error('Missing backend address');
  process.env['SSR_BACKEND_ORIGIN'] = `http://127.0.0.1:${backendAddress.port}`;
  const { reqHandler } = await import(
    pathToFileURL(resolve('dist/V.T.Thanh-Home-Angular/server/server.mjs')).href
  );
  const hosting = JSON.parse(await readFile(resolve('vercel.json'), 'utf8'));
  const policy = hosting.headers
    .flatMap((rule: { headers: { key: string; value: string }[] }) => rule.headers)
    .find(
      (header: { key: string }) => header.key.toLowerCase() === 'content-security-policy',
    ).value;
  const server = createServer((request, response) => {
    response.setHeader('Content-Security-Policy', policy);
    reqHandler(request, response);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing SSR address');
  return {
    origin: `http://127.0.0.1:${address.port}`,
    setHealthy(value: boolean) {
      healthy = value;
    },
    async stop() {
      server.closeAllConnections();
      backend.closeAllConnections();
      await Promise.all([
        new Promise<void>((resolve) => server.close(() => resolve())),
        new Promise<void>((resolve) => backend.close(() => resolve())),
      ]);
    },
  };
}
