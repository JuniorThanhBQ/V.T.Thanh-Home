# Angular API connection

## WHAT

Angular uses same-origin `/api/v1/...` URLs for visitor registration, chat, blogs, contacts, and admin operations. Projects render the six static entries with their existing i18n labels; no project API request is made.

## WHY

Browser JavaScript cannot read backend deployment environment variables. A shared-origin proxy provides consistent routing and cookie/XSRF behavior in development and production.

## HOW

- Local: start Spring Boot through the root Compose configuration, then run `npm start` inside `V.T.Thanh-Home-Angular`. `proxy.conf.json` forwards API and Actuator traffic to local port 8080. Restart `ng serve` after changing proxy configuration.
- Vercel: use `frontend/V.T.Thanh-Home-Angular` as the project root, build with `npm run build`, and publish `dist/V.T.Thanh-Home-Angular/browser`. The supplied `vercel.json` rewrites API requests to `https://vtthanh-backend-latest.onrender.com/api/v1/...`, preserving the prefix and avoiding a global trailing-slash redirect.
- If the Render hostname changes, update the Vercel rewrite destinations together. SPA paths still resolve to `index.html`; API paths do not.
- Groq, database, Gmail, and Turnstile secrets belong on Render, never in Angular bundles or Vercel frontend variables. The public Turnstile site key is obtained from backend public configuration.
- Visitor startup fetches CSRF and submits browser language/time zone once. Failed registration does not block static browsing. Chat/contact retry registration after a session expiry.
- Blog requests have finite deadlines, explicit change-detection notification, and error/retry/empty states. Empty databases show an empty journal. Only published records are public.
- Administrator authentication is checked with the backend session before rendering the dashboard. No login credentials or authentication flags are written to application browser storage. Both form fields clear immediately on submission, after all outcomes, on page hide and on component destruction. Temporary credential object properties clear when the request completes or is cancelled. The backend HttpOnly session cookie still identifies the signed-in session.
- The form requests `autocomplete="off"`. Browsers and password-manager extensions can ignore this request; a web application cannot guarantee that they never offer to save or autofill credentials. Existing password-manager entries are outside the application's control. See [MDN autocomplete guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete#off). JavaScript strings and browser network-inspection records cannot be securely erased by application code.
- Blogs support all chapters, chapter reordering, draft/publication status, slug and metadata editing. Projects support backend CRUD, technology stacks, ordering and publication status. These admin project records remain independent of the public page's six static translated entries. Editors load full records and send their version; failed saves remain open with edits intact.
- Contacts provide the real inbox, delivery status, message details and confirmed deletion. Visitors provide the existing minimal API records, 50 per page, with confirmed blocking/unblocking. No visitor credentials or fabricated user statistics are shown.
- Overview fetches health, database component status and JVM metrics on demand. Missing measurements display Unavailable. Local and Vercel routes forward `/actuator/**` to the backend; Spring Security still restricts metrics to administrators. API/Actuator responses have no-store caching on Vercel. Administrative chat history has no backend API and is omitted.
- Logout only clears the signed-in view after backend confirmation; failures remain visible. Expired authorization clears cached private records and cancels pending requests. There are no automatic write retries or continuous administrator polling.

## WHEN

Run `npm run lint` and `npm run build` before deployment. Frontend `.spec.ts` tests were removed at the developer's request. Test-runner configuration remains available, and CI runs frontend tests only when `.spec.ts` files exist. Without test files, `npm test` reports that no tests were found; it does not verify the application. Publish the matching Spring Boot release first or together with the frontend. Configure Render using the [backend guide](../backend/README.md), then verify requests from the deployed Vercel hostname. Production was not deployed by this local hotfix.
