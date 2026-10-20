# Angular API connection

## WHAT

Angular uses same-origin `/api/v1/...` URLs for visitor registration, chat, blogs, contacts, and admin operations. Projects render the six static entries with their existing i18n labels; no project API request is made.

## WHY

Browser JavaScript cannot read backend deployment environment variables. A shared-origin proxy provides consistent routing and cookie/XSRF behavior in development and production.

## HOW

- Local: start Spring Boot through the root Compose configuration, then run `npm start` inside `V.T.Thanh-Home-Angular`. `proxy.conf.json` forwards API/health traffic to local port 8080. Restart `ng serve` after changing proxy configuration.
- Vercel: use `frontend/V.T.Thanh-Home-Angular` as the project root, build with `npm run build`, and publish `dist/V.T.Thanh-Home-Angular/browser`. The supplied `vercel.json` rewrites API requests to `https://vtthanh-backend-latest.onrender.com/api/v1/...`, preserving the prefix and avoiding a global trailing-slash redirect.
- If the Render hostname changes, update the Vercel rewrite destinations together. SPA paths still resolve to `index.html`; API paths do not.
- Groq, database, Gmail, and Turnstile secrets belong on Render, never in Angular bundles or Vercel frontend variables. The public Turnstile site key is obtained from backend public configuration.
- Visitor startup fetches CSRF and submits browser language/time zone once. Failed registration does not block static browsing. Chat/contact retry registration after a session expiry.
- Blog requests have finite deadlines, explicit change-detection notification, and error/retry/empty states. Empty databases show an empty journal. Only published records are public.
- Administrator authentication uses the backend session. Demo credential fallbacks are removed. Blog create/update/delete operations now call the backend; the simple editor edits the first chapter and preserves other existing chapters.
- Unimplemented operational metrics display unavailable/zero values rather than random samples. Administrative chat history remains unimplemented and displays no invented conversations.

## WHEN

Run `npm run lint`, `npm test -- --watch=false`, and `npm run build` before deployment. Publish the matching Spring Boot release first or together with the frontend. Configure Render using the [backend guide](../backend/README.md), then verify requests from the deployed Vercel hostname. Production was not deployed by this local hotfix.
