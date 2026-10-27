import { createServer, ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(process.cwd());
const original = resolve(projectRoot, 'dist/V.T.Thanh-Home-Angular/browser');
export const cvResource = '/canva/1788869795561_zviovw.png';
const types: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function json(response: ServerResponse, data: unknown, status = 200): void {
  if (response.destroyed) return;
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}

export async function startPwaServer() {
  await readFile(join(original, 'ngsw.json'));
  let current = original;
  let workerPolicy: string | undefined;
  const copies: string[] = [];
  const heldAssets: ServerResponse[] = [];
  const heldOperations: ServerResponse[] = [];
  const state = {
    healthy: false,
    holdAsset: false,
    holdContact: false,
    holdChat: false,
    contacts: [] as { idempotencyKey: string }[],
    chats: [] as { requestId: string }[],
    healthRequests: 0,
    blogRequests: 0,
    heldAssets: 0,
  };
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname === '/pwa-policy-media') {
        response.writeHead(200, {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        });
        response.end('worker-policy-media');
        return;
      }
      if (url.pathname === '/actuator/health') {
        state.healthRequests++;
        json(response, { status: state.healthy ? 'UP' : 'DOWN' }, state.healthy ? 200 : 503);
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        if (!state.healthy) {
          json(response, {}, 503);
          return;
        }
        let raw = '';
        for await (const chunk of request) raw += chunk;
        const body = raw ? JSON.parse(raw) : {};
        if (url.pathname === '/api/viewers') json(response, { viewers: 1 });
        else if (url.pathname === '/api/v1/security/csrf')
          json(response, { token: 'local-test-token' });
        else if (url.pathname === '/api/v1/visitors') json(response, { registered: true });
        else if (url.pathname === '/api/v1/security/config')
          json(response, { turnstileSiteKey: '' });
        else if (url.pathname === '/api/v1/contacts') {
          state.contacts.push(body);
          if (state.holdContact) heldOperations.push(response);
          else
            json(response, {
              id: 1,
              status: 'ACCEPTED',
              message: 'Accepted',
              submittedAt: new Date().toISOString(),
            });
        } else if (url.pathname === '/api/v1/chat/message') {
          state.chats.push(body);
          if (state.holdChat) heldOperations.push(response);
          else
            json(response, {
              messageId: 1,
              reply: 'Fixture reply',
              timestamp: new Date().toISOString(),
            });
        } else if (url.pathname === '/api/v1/blogs') {
          state.blogRequests++;
          json(response, [
            {
              id: 1,
              slug: 'fixture',
              title: 'Fixture journal entry',
              description: 'Local journal connectivity fixture',
              category: 'Test',
              bannerUrl: '/canva/AIJ-modified_1_xzw6dh.png',
              status: 'PUBLISHED',
            },
          ]);
        } else json(response, {});
        return;
      }
      if (url.pathname === cvResource && state.holdAsset) {
        heldAssets.push(response);
        state.heldAssets++;
        return;
      }
      const pathname = decodeURIComponent(url.pathname);
      let target = resolve(current, '.' + pathname);
      if (target !== current && !target.startsWith(current + sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      if (pathname.endsWith('/')) target = join(target, 'index.html');
      let bytes: Buffer;
      try {
        bytes = await readFile(target);
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR', 'EISDIR'].includes((error as NodeJS.ErrnoException).code ?? ''))
          throw error;
        if (!extname(pathname) && request.headers.accept?.includes('text/html')) {
          target = join(current, 'index.html');
          bytes = await readFile(target);
        } else {
          response.writeHead(404);
          response.end();
          return;
        }
      }
      response.writeHead(200, {
        'Content-Type': types[extname(target)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
        ...(pathname === '/ngsw-worker.js' && workerPolicy
          ? { 'Content-Security-Policy': workerPolicy }
          : {}),
      });
      response.end(bytes);
    } catch (error) {
      if (!response.headersSent) response.writeHead(500);
      response.end();
      console.error(error);
    }
  });
  await new Promise<void>((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => accept());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing fixture server address');
  const disconnect = async () => {
    if (!server.listening) return;
    const closed = new Promise<void>((accept) => server.close(() => accept()));
    server.closeAllConnections();
    await closed;
  };
  return {
    origin: `http://127.0.0.1:${address.port}`,
    mediaOrigin: `http://localhost:${address.port}`,
    state,
    disconnect,
    async releaseAsset() {
      state.holdAsset = false;
      const bytes = await readFile(join(original, cvResource.slice(1)));
      for (const response of heldAssets.splice(0)) {
        if (!response.destroyed) {
          response.writeHead(200, { 'Content-Type': 'image/png' });
          response.end(bytes);
        }
      }
    },
    releaseOperations() {
      for (const response of heldOperations.splice(0)) json(response, {}, 503);
    },
    async publishWorkerPolicy(policy: string, stamp: boolean | 'legacy' = true) {
      await mkdir(join(projectRoot, '.angular'), { recursive: true });
      const copy = await mkdtemp(join(projectRoot, '.angular/pwa-e2e-'));
      copies.push(copy);
      await cp(current, copy, { recursive: true });
      const hosting = JSON.parse(await readFile(join(projectRoot, 'vercel.json'), 'utf8'));
      for (const rule of hosting.headers)
        for (const header of rule.headers)
          if (header.key.toLowerCase() === 'content-security-policy') header.value = policy;
      const hostingPath = join(copy, 'test-worker-policy.json');
      await writeFile(hostingPath, JSON.stringify(hosting));
      if (stamp === 'legacy') {
        await writeFile(
          join(copy, 'ngsw-worker.js'),
          await readFile(join(projectRoot, 'node_modules/@angular/service-worker/ngsw-worker.js')),
        );
      } else if (stamp) {
        const generated = spawnSync(
          process.execPath,
          [join(projectRoot, 'scripts/stamp-pwa-worker.mjs'), copy, hostingPath],
          { cwd: projectRoot, encoding: 'utf8', windowsHide: true },
        );
        if (generated.status !== 0)
          throw new Error(generated.stderr || 'Could not stamp worker policy update');
      }
      current = copy;
      workerPolicy = policy;
      return createHash('sha256')
        .update(await readFile(join(copy, 'ngsw-worker.js')))
        .digest('hex');
    },
    async publishTestUpdate() {
      await mkdir(join(projectRoot, '.angular'), { recursive: true });
      const copy = await mkdtemp(join(projectRoot, '.angular/pwa-e2e-'));
      copies.push(copy);
      await cp(original, copy, { recursive: true });
      const html = (await readFile(join(copy, 'index.html'), 'utf8')).replace(
        '<html ',
        '<html data-pwa-test-version="updated" ',
      );
      await writeFile(join(copy, 'index.html'), html);
      const receipt = JSON.parse(await readFile(join(copy, 'pwa-resources.json'), 'utf8'));
      for (const resource of receipt.resources)
        resource.sha256 = createHash('sha256')
          .update(await readFile(join(copy, resource.url.slice(1))))
          .digest('hex');
      await writeFile(join(copy, 'pwa-resources.json'), JSON.stringify(receipt) + '\n');
      const generated = spawnSync(
        process.execPath,
        [
          join(projectRoot, 'node_modules/@angular/service-worker/ngsw-config.js'),
          relative(projectRoot, copy).split(sep).join('/'),
          'ngsw-config.json',
          '/',
        ],
        { cwd: projectRoot, encoding: 'utf8', windowsHide: true },
      );
      if (generated.status !== 0)
        throw new Error(generated.stderr || 'Could not generate test update');
      const stamped = spawnSync(
        process.execPath,
        [join(projectRoot, 'scripts/stamp-pwa-worker.mjs'), copy],
        { cwd: projectRoot, encoding: 'utf8', windowsHide: true },
      );
      if (stamped.status !== 0) throw new Error(stamped.stderr || 'Could not stamp test update');
      current = copy;
    },
    async stop() {
      await disconnect();
      for (const copy of copies) {
        const checked = resolve(copy);
        if (!checked.startsWith(resolve(projectRoot, '.angular') + sep + 'pwa-e2e-'))
          throw new Error('Unsafe test-copy cleanup path');
        await rm(checked, { recursive: true, force: true });
      }
    },
  };
}
