# VTThanh-Home-Angular

## Sentry environment configuration

### What

The frontend reads `SENTRY_DSN` through `scripts/angular.mjs`. Angular replaces `process.env.SENTRY_DSN` with its value during compilation. The DSN remains visible in the compiled JavaScript and network requests because the browser must use it to send events.

### Why

The frontend and backend use separate Sentry projects. The repository-root `.env` belongs to the backend and Docker Compose. Its DSN is not loaded by the Angular build.

### How

For local development, copy this directory's `.env.example` to `.env` and set `SENTRY_DSN` to the `vtthanh-home-angular` project's DSN. The `.env` file is ignored by Git. An existing process environment variable takes priority over the local file. Missing, empty, or malformed values fail the build.

In Vercel, set `SENTRY_DSN` to the Angular project's DSN and keep `SENTRY_AUTH_TOKEN` in protected build settings for source-map uploads. Only the DSN is passed to browser code; the auth token is read by the source-map script. Use `npm start`, `npm run build`, or `npm run watch` so the environment wrapper runs. `npm run ng -- build` and `npm run ng -- serve` also use the wrapper. Calling `ng build` or `ng serve` directly bypasses environment injection.

GitHub Actions needs its own repository variable named `SENTRY_DSN` with the same Angular project DSN. Set it under **Repository Settings → Secrets and variables → Actions → Variables**. A variable configured in Vercel is not available to GitHub runners. The CI build checks for this variable, then passes it to the Angular build. The security scan downloads that build's browser artifact rather than building it again.

### When

Restart the development server or rebuild and redeploy after changing `SENTRY_DSN`. Vercel environment changes apply to subsequent deployments.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.1.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
