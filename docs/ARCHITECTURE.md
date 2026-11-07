# IdeaBloom Web: Architecture

## Role of this app

The web app is the **user interface**. It never talks to the database and holds no business rules. It
shows data from the API and sends the user's actions to the API.

```
 Browser ──► ideabloom-web (Next.js) ──/api/* rewrite──►  ideabloom-api (NestJS) ──► PostgreSQL
```

## Rendering approach

- Pages and layouts are **Server Components** by default. They render the static structure (layout,
  headings, empty states) and are prerendered at build time, so they load instantly.
- Anything interactive or that loads user data is a **Client Component** (`'use client'`), which fetches
  through **TanStack Query** after the page loads.
- Why client-side data fetching? Everything is behind login, so search engines don't matter, and the
  same pattern will be used by the mobile app. TanStack Query gives caching, loading/error states,
  retries and background refresh for free.
- `cacheComponents` and `partialPrefetching` are enabled (Next.js 16's rendering model; both become
  defaults in the next major version).

## API communication

- `next.config.ts` rewrites `/api/:path*` to `${API_URL}/api/:path*`.
- `src/lib/api-client.ts` is the only place that calls `fetch` for API data:
  - non-2xx responses → `ApiError` (`status`, `message`, `messages`, `body`)
  - no response at all → `NetworkError`
- Query defaults (`src/providers/app-providers.tsx`): 30s `staleTime`; retry once for network/5xx errors,
  never for 4xx.
- Feature folders own their API hooks, e.g. `features/system/use-api-health.ts`.
- **401 handling**: any 401 (except on auth endpoints) triggers one shared `POST /auth/refresh`, then the
  request is retried once, even if the refresh failed, because another tab may have refreshed the shared
  cookies. A second 401 calls the session-expired handler: `POST /auth/logout` (clears cookies so the
  proxy doesn't bounce back), then a full reload to `/login?next=…`.

## Authentication

- Forms: react-hook-form + zod (`features/auth/schemas.ts`, mirroring the API rules); the API re-validates.
- `features/auth/use-auth.ts`: `useCurrentUser` (query `['auth','me']`), `useLogin`, `useRegister`,
  `useLogout`, `useForgotPassword`, `useResetPassword`.
- `src/proxy.ts` + `lib/auth-routes.ts`: redirects based on the `ib_session` marker cookie (no secret).
  UX only; the API is the security boundary.
- `getSafeRedirect` only follows `?next=` values that are paths on this site (open-redirect protection).
- Forms that read the URL (`useSearchParams`) are wrapped in `<Suspense>` (required for prerendered pages).
- `UserMenu` (sidebar footer) calls `useCurrentUser()`; on app pages this is the first API call, so an
  invalid session is detected right away (401 → refresh → logout → `/login`).
- Settings (`features/settings`): `ProfileForm` (PATCH /users/me, updates the cached user), `ChangePasswordForm`
  (wrong current password = 400, shown on the field), `SessionsCard` (confirmation dialog → logout-all).

## Routing and layout

- `src/app/(app)/` is a **route group**: it shares the sidebar layout without adding to the URL.
- `src/app/(auth)/` holds login/registration/password pages with a centred card layout (no sidebar).
- Navigation is defined once in `src/components/layout/nav-items.ts`; the sidebar and top bar read from it.
- The sidebar (shadcn `Sidebar`) collapses to icons on desktop (Ctrl/Cmd+B, or the rail) and becomes a
  slide-out panel on screens under 768px.

## Design system

Defined in `src/app/globals.css` as CSS variables, exposed to Tailwind with `@theme inline`.

| Token                           | Value     | Used for                                              |
| ------------------------------- | --------- | ----------------------------------------------------- |
| `--lavender`                    | `#9B7EDE` | Accents: focus ring, logo, charts, progress           |
| `--lavender-soft`               | `#EAE2FA` | Active nav item, secondary buttons, icon backgrounds  |
| `--lavender-deep` / `--primary` | `#6F55AE` | Buttons and links (white text passes WCAG AA, 5.86:1) |
| `--background`                  | `#F7F4FC` | Page background                                       |
| `--card`                        | `#FFFFFF` | Cards, sidebar, popovers                              |
| `--foreground`                  | `#242033` | Main text                                             |
| `--muted-foreground`            | `#6B6880` | Secondary text (≥ 4.9:1 contrast)                     |

Rules:

- Components use **semantic** classes (`bg-primary`, `text-muted-foreground`), never raw hex values.
- `#9B7EDE` is **not** used behind white text: its contrast is only 3.26:1 (below WCAG AA's 4.5:1).
- A `.dark` block exists as a draft; the theme switch and tuning come in Milestone 8.
- Font: Inter via `next/font` (self-hosted at build time).

## Testing

| What                     | Where                                                         |
| ------------------------ | ------------------------------------------------------------- |
| Unit and component tests | `src/**/*.test.ts(x)`, run with Vitest in jsdom               |
| Test helpers             | `src/test/render.tsx` (`renderWithProviders`, `jsonResponse`) |
| Browser API stand-ins    | `vitest.setup.ts` (`matchMedia`, `IntersectionObserver`)      |

API calls are faked by mocking `fetch`, so tests don't need the API running. End-to-end tests with a real
browser (Playwright) are planned for Milestone 8.

## Decisions log

| Date       | Decision                                                                            | Why                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-07 | Next.js 16.4 with `cacheComponents` + `partialPrefetching` on                       | Scaffold default; becomes mandatory in the next major version, so adopting it now avoids a migration.                                                 |
| 2026-11-07 | shadcn/ui with **Base UI** (default `base-nova` style)                              | shadcn's current default; accessible primitives. Composition uses the `render` prop (not `asChild`).                                                  |
| 2026-11-07 | Buttons use deep lavender `#6F55AE`, not `#9B7EDE`                                  | Accessibility contrast (see Design system).                                                                                                           |
| 2026-11-07 | `shadcn` package moved to devDependencies                                           | It's a CLI and build-time CSS source, not needed at runtime. This keeps the production audit clean.                                                   |
| 2026-11-07 | No `@vitejs/plugin-react`                                                           | Its optional Babel 8 peer conflicts with Babel 7 used by shadcn/ESLint. Vitest compiles JSX natively. Never "fix" with `--legacy-peer-deps`.          |
| 2026-11-07 | `@types/node` ^22                                                                   | Matches the Node version we run (scaffold had ^20; Vitest requires ≥ 22 types).                                                                       |
| 2026-11-07 | `use-mobile.ts` rewritten with `useSyncExternalStore`                               | The shadcn version set state inside an effect (flagged by React's lint rules; causes an extra render).                                                |
| 2026-11-07 | `typecheck` runs `next typegen` first                                               | Route types like `LayoutProps` are generated by Next.js and are missing on a fresh checkout.                                                          |
| 2026-11-07 | Known dev-only audit warnings (`deepmerge`, `minimatch` via shadcn CLI / ESLint)    | Build tools only; 0 production vulnerabilities.                                                                                                       |
| 2026-11-07 | Full page reload (`window.location.assign`) on logout / session expiry              | Guarantees no user data stays in memory. The Next.js lint warning is disabled on those 2 lines only, with the reason.                                 |
| 2026-11-07 | Retry after a failed refresh before giving up                                       | Two tabs refreshing at once: the loser's refresh fails, but the shared cookies are already new.                                                       |
| 2026-11-07 | **Known limitation**: Next.js rewrites don't add the client IP to `X-Forwarded-For` | Verified with a header-echo server. Production must run behind a proxy that sets it; see the README deployment note.                                  |
| 2026-11-07 | `hardNavigate()` wrapper for full page loads                                        | One place for the intentional `window.location.assign`, easy to mock in tests (jsdom can't spy on location).                                          |
| 2026-11-07 | No `SidebarMenuSkeleton` (fixed-size skeleton instead)                              | It uses `Math.random()`, which Cache Components forbids during prerendering (build error).                                                            |
| 2026-11-07 | `useWatch` instead of `watch()` (react-hook-form)                                   | `watch()` is flagged as incompatible with React Compiler memoization.                                                                                 |
| 2026-11-07 | Native `<select>` for time zones                                                    | ~400 options; a native select is accessible, fast and keyboard-searchable on every device. "UTC" is added manually (not in `Intl.supportedValuesOf`). |
