import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { join } from 'node:path';
import { constants } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.disable('x-powered-by');
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: true,
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    'www.juniorthanh.id.vn',
    'juniorthanh.id.vn',
    ...[process.env['VERCEL_URL'], process.env['VERCEL_PROJECT_PRODUCTION_URL']].filter(
      (host): host is string => !!host,
    ),
  ],
});

app.use(
  ['/api/v1', '/actuator'],
  express.raw({ type: () => true, limit: '1mb' }),
  async (req, res, next) => {
    const controller = new AbortController();
    const disconnect = () => {
      if (!res.writableFinished) controller.abort();
    };
    res.once('close', disconnect);
    try {
      const origin =
        process.env['SSR_BACKEND_ORIGIN'] || 'https://vtthanh-backend-latest.onrender.com';
      let parsed: URL;
      try {
        parsed = new URL(req.originalUrl, 'http://localhost');
        const segments = req.originalUrl
          .split(/[?#]/, 1)[0]
          .replaceAll('\\', '/')
          .split('/')
          .map((segment) => decodeURIComponent(segment));
        const traversing = segments.some(
          (segment) => segment === '.' || segment === '..' || /[\\/]/.test(segment),
        );
        const allowed = ['/api/v1', '/actuator'].some(
          (prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`),
        );
        if (traversing || !allowed) {
          res.status(400).send('Invalid request path');
          return;
        }
      } catch {
        res.status(400).send('Invalid request path');
        return;
      }
      const targetUrl = new URL(origin);
      targetUrl.pathname = parsed.pathname;
      targetUrl.search = parsed.search;
      targetUrl.hash = '';
      const headers = new Headers();
      for (const name of ['accept', 'content-type', 'cookie', 'x-xsrf-token', 'x-csrf-token']) {
        const value = req.get(name);
        if (value) headers.set(name, value);
      }
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(65000)]),
        redirect: 'manual',
      });
      res.status(response.status);
      res.setHeader('Cache-Control', 'private, no-store, no-transform');
      const type = response.headers.get('content-type');
      if (type) res.setHeader('Content-Type', type);
      const cookies = response.headers.getSetCookie();
      if (cookies.length) res.setHeader('Set-Cookie', cookies);
      for (const name of ['x-accel-buffering', 'retry-after', 'allow', 'content-disposition']) {
        const value = response.headers.get(name);
        if (value) res.setHeader(name, value);
      }
      if (!response.body) {
        res.end();
        return;
      }
      res.flushHeaders();
      const reader = response.body.getReader();
      await pipeline(async function* () {
        try {
          for (;;) {
            const chunk = await reader.read();
            if (chunk.done) return;
            yield chunk.value;
          }
        } finally {
          await reader.cancel();
          reader.releaseLock();
        }
      }, res);
    } catch (error) {
      if (res.destroyed) return;
      if (res.headersSent) res.destroy(error instanceof Error ? error : undefined);
      else next(error);
    } finally {
      res.off('close', disconnect);
      controller.abort();
    }
  },
);

app.use(
  compression({
    brotli: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } },
  }),
);

app.get('/api/viewers', (_req, res) => res.json({ viewers: null }));

app.use(
  express.static(browserDistFolder, {
    maxAge: 0,
    index: false,
    redirect: false,
    dotfiles: 'allow',
  }),
);

app.use((req, res, next) => {
  const pathname = new URL(req.originalUrl, 'http://localhost').pathname;
  if (/\.[^/]+$/.test(pathname) || pathname.startsWith('/.well-known/')) {
    res.sendStatus(404);
    return;
  }
  next();
});

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
