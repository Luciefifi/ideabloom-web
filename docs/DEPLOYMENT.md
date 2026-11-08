# Deployment (web)

IdeaBloom runs on free plans: this web app and the API on **Vercel** (Hobby), the database on **Neon**, emails
through **Brevo**. Deploy the API first: follow `ideabloom-api/docs/DEPLOYMENT.md` (Parts 1–4), then come back here.

The owner creates the projects and types every setting. Secrets never go in Git or in this file (this app has
no secrets: only the API's address).

## How it fits together

```
Browser ──HTTPS──▶ ideabloom-web (Vercel) ──/api/* forwarded──▶ ideabloom-api (Vercel) ──▶ Neon PostgreSQL
```

The browser only ever talks to the web app's address. Requests to `/api/*` are forwarded to the API (the rewrite
in `next.config.ts`), so the login cookies belong to the web address and are never shared with another site.

## Steps

1. In Vercel: **Add New → Project**, import `Luciefifi/ideabloom-web`. Vercel recognises Next.js; leave the
   build settings as they are.
2. Before the first deploy, open **Environment Variables** and add one variable for **Production**:
   `API_URL` = the API's address, e.g. `https://ideabloom-api.vercel.app` (no `/api` at the end, no trailing
   `/`). It is read **when the app is built**: after changing it, redeploy (**Deployments → … → Redeploy**). On
   Vercel the build stops with a clear error if `API_URL` is missing or isn't `https://`.
3. **Settings → Git**: the production branch is `main`. Preview deployments of other branches have no `API_URL`
   and stop at build time, which is expected.
4. Deploy. Note the address (e.g. `https://ideabloom-web.vercel.app`), put it in the **API** project's
   `WEB_APP_URL`, and redeploy the API (reset emails link to it).

## Checks after deploying

- [ ] The home page loads over `https://`; the browser console shows no errors
- [ ] Register (or log in), then log out and in again; the theme switch works
- [ ] Browser dev tools → Application → Cookies: the login cookies are on the web address, `HttpOnly`, `Secure`
- [ ] Forgot password: the email arrives and its link opens this site
- [ ] Response headers (dev tools → Network → the page): `Content-Security-Policy`, `X-Frame-Options: DENY`,
      `Strict-Transport-Security` (added by Vercel)

## Before every release

- [ ] `npm ci && npm run typecheck && npm run lint && npm test && npm run build` pass on the release commit
- [ ] `npm run e2e` passes (needs the API repo next to this one and its Docker test database)
- [ ] `npm audit --omit=dev` shows no high/critical issues
- [ ] API migrations for the release have been run on Neon **before** merging to `main` (Vercel deploys `main`
      automatically)

## Notes

- HTTPS and HSTS come from Vercel. The app sends its own Content-Security-Policy and security headers
  (`next.config.ts`); it doesn't send `upgrade-insecure-requests` (that breaks running a production build over
  plain HTTP locally).
- Elsewhere than Vercel: set `API_URL` before `npm run build`, run `npm start` (Node 22), and add HTTPS + HSTS in
  front.
- Node 22 is pinned in `package.json` (`engines`); `vercel.json` runs the server code in Frankfurt (`fra1`),
  next to the API and database.
