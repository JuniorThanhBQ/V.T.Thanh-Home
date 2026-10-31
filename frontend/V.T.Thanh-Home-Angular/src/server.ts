import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
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
    try {
      const origin =
        process.env['SSR_BACKEND_ORIGIN'] || 'https://vtthanh-backend-latest.onrender.com';
      const headers = new Headers();
      for (const name of ['accept', 'content-type', 'cookie', 'x-xsrf-token', 'x-csrf-token']) {
        const value = req.get(name);
        if (value) headers.set(name, value);
      }
      const response = await fetch(new URL(req.originalUrl, origin), {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
        signal: AbortSignal.timeout(65000),
        redirect: 'manual',
      });
      res.status(response.status);
      res.setHeader('Cache-Control', 'private, no-store');
      const type = response.headers.get('content-type');
      if (type) res.setHeader('Content-Type', type);
      const cookies = response.headers.getSetCookie();
      if (cookies.length) res.setHeader('Set-Cookie', cookies);
      // nosemgrep: javascript.express.security.audit.xss.direct-response-write.direct-response-write
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  },
);

app.get('/api/viewers', (_req, res) => res.json({ viewers: null }));

app.use(
  express.static(browserDistFolder, {
    maxAge: 0,
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  if (/\.[^/]+$/.test(new URL(req.originalUrl, 'http://localhost').pathname)) {
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
