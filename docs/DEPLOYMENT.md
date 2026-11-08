# Deployment checklist (web)

IdeaBloom isn't deployed yet: the hosting choice will be made together. This list is what any host needs. Read it
together with `ideabloom-api/docs/DEPLOYMENT.md`.

## 1. Build

- Set **`API_URL`** (where the API runs, e.g. `http://ideabloom-api:4000`) **before** `npm run build`: the
  `/api/*` forwarding rules are fixed at build time.
- `npm ci && npm run build && npm start` (Node 22).

## 2. HTTPS and headers

- Serve the site over **HTTPS only**: redirect HTTP to HTTPS and send **HSTS**
  (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) from the host or proxy. The app doesn't send
  `upgrade-insecure-requests` itself (it breaks running the production build over plain HTTP).
- The app already sends a Content-Security-Policy and other security headers (`next.config.ts`). If the host adds
  its own CSP, make sure it isn't stricter in a way that blocks Next.js's inline scripts.
- The browser must reach the API **through this app** (`/api/*`), so login cookies stay first-party.

## 3. Before going live

- [ ] `npm ci && npm run typecheck && npm run lint && npm test && npm run build` pass on the release commit
- [ ] `npm run e2e` passes (needs the API repo next to this one and its Docker test database)
- [ ] `npm audit --omit=dev` shows no high/critical issues
- [ ] Open the site: no errors in the browser console, the theme switch works, login cookies are `Secure`
