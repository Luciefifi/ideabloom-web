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

## Ideas feature (`features/ideas`)

- `filters.ts`: pure functions between URL params and an `IdeaFilters` object (unknown values ignored,
  defaults left out of the URL). `use-idea-filters.ts` reads `useSearchParams` and writes with `router.replace`.
- `use-ideas.ts`: query keys (`['ideas','list',filters]`, `['categories']`, `['tags']`), `useInfiniteQuery` for
  "Load more" (with `keepPreviousData` so the list doesn't flash while filters change), `useCreateIdea`
  (invalidates ideas, tags, categories), and an **optimistic** `useToggleFavorite` (snapshot → update cache →
  roll back on error → refetch).
- Search box: local state + `useDebouncedValue` (300 ms) + `useEffectEvent`, so clearing filters can't re-apply
  stale text.
- `idea-styles.ts`: labels and colours for statuses, priorities and the 8 category palette names
  (dark-on-light pairs, well above 4.5:1).
- Card: a single real link stretched over the card with `::after`; the ⭐ button sits above it (`z-10`).
- `IdeaForm` (shared by "New idea" and the idea page): react-hook-form + zod (`idea-form-schema.ts`),
  `useFieldArray` for links, `TagInput` via `Controller`. The **category select is controlled** (`Controller`) so it
  shows the saved category even if the category list loads later (see decisions).
- Idea page (`/ideas/[id]`): `useParams` inside Suspense; the form is keyed by `updatedAt` so it resets to the saved
  values after each save.
- Organize page: `CategoryManager` (inline editor + `ColorPicker` = radio inputs styled as swatches) and
  `TagManager`; deletions go through `ConfirmDelete` (AlertDialog).

## Projects feature (`features/projects`)

- Same layering as ideas: `types.ts`, `filters.ts` (URL ⇄ filters; "all" → `scope=all` for the API), `api.ts`,
  `use-projects.ts` (`projectKeys`, infinite list, `useCreateProject`, `useConvertIdea` which refreshes ideas too).
- `hooks/use-url-filters.ts`: generic URL-filters hook now shared by Ideas and Projects.
- `components/shared/progress-bar.tsx`: accessible `role="progressbar"` with `aria-valuenow`.
- `ProjectForm` + `project-form-schema.ts` (zod refine: target ≥ start) shared by "New project" and editing (part 2);
  native `<input type="date">`.
- `ConvertIdeaDialog` (shadcn Dialog) on the idea page.
- Overdue and progress are **calculated by the API**; the web app only displays them.
- Project page (`ProjectDetailView`): every milestone / link / status mutation returns the full project, stored with
  `setQueryData` (instant update) while lists, activity and ideas are invalidated (`useProjectChanged`).
- `activity-text.ts` turns activity entries into sentences (pure function, unit-tested).

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

| Date       | Decision                                                                                                                    | Why                                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-07 | Next.js 16.4 with `cacheComponents` + `partialPrefetching` on                                                               | Scaffold default; becomes mandatory in the next major version, so adopting it now avoids a migration.                                                                  |
| 2026-11-07 | shadcn/ui with **Base UI** (default `base-nova` style)                                                                      | shadcn's current default; accessible primitives. Composition uses the `render` prop (not `asChild`).                                                                   |
| 2026-11-07 | Buttons use deep lavender `#6F55AE`, not `#9B7EDE`                                                                          | Accessibility contrast (see Design system).                                                                                                                            |
| 2026-11-07 | `shadcn` package moved to devDependencies                                                                                   | It's a CLI and build-time CSS source, not needed at runtime. This keeps the production audit clean.                                                                    |
| 2026-11-07 | No `@vitejs/plugin-react`                                                                                                   | Its optional Babel 8 peer conflicts with Babel 7 used by shadcn/ESLint. Vitest compiles JSX natively. Never "fix" with `--legacy-peer-deps`.                           |
| 2026-11-07 | `@types/node` ^22                                                                                                           | Matches the Node version we run (scaffold had ^20; Vitest requires ≥ 22 types).                                                                                        |
| 2026-11-07 | `use-mobile.ts` rewritten with `useSyncExternalStore`                                                                       | The shadcn version set state inside an effect (flagged by React's lint rules; causes an extra render).                                                                 |
| 2026-11-07 | `typecheck` runs `next typegen` first                                                                                       | Route types like `LayoutProps` are generated by Next.js and are missing on a fresh checkout.                                                                           |
| 2026-11-07 | Known dev-only audit warnings (`deepmerge`, `minimatch` via shadcn CLI / ESLint)                                            | Build tools only; 0 production vulnerabilities.                                                                                                                        |
| 2026-11-07 | Full page reload (`window.location.assign`) on logout / session expiry                                                      | Guarantees no user data stays in memory. The Next.js lint warning is disabled on those 2 lines only, with the reason.                                                  |
| 2026-11-07 | Retry after a failed refresh before giving up                                                                               | Two tabs refreshing at once: the loser's refresh fails, but the shared cookies are already new.                                                                        |
| 2026-11-07 | **Known limitation**: Next.js rewrites don't add the client IP to `X-Forwarded-For`                                         | Verified with a header-echo server. Production must run behind a proxy that sets it; see the README deployment note.                                                   |
| 2026-11-07 | `hardNavigate()` wrapper for full page loads                                                                                | One place for the intentional `window.location.assign`, easy to mock in tests (jsdom can't spy on location).                                                           |
| 2026-11-07 | No `SidebarMenuSkeleton` (fixed-size skeleton instead)                                                                      | It uses `Math.random()`, which Cache Components forbids during prerendering (build error).                                                                             |
| 2026-11-07 | `useWatch` instead of `watch()` (react-hook-form)                                                                           | `watch()` is flagged as incompatible with React Compiler memoization.                                                                                                  |
| 2026-11-07 | Native `<select>` for time zones                                                                                            | ~400 options; a native select is accessible, fast and keyboard-searchable on every device. "UTC" is added manually (not in `Intl.supportedValuesOf`).                  |
| 2026-11-07 | Ideas filters in the URL; infinite query with "Load more"                                                                   | Shareable/bookmarkable views; simpler than numbered pages on mobile.                                                                                                   |
| 2026-11-07 | Native `<select>`s for filters                                                                                              | Accessible and fast on every device; little code.                                                                                                                      |
| 2026-11-07 | Single responsive button label (`sr-only sm:not-sr-only`)                                                                   | Two separate labels produced a doubled accessible name ("Add idea Add idea").                                                                                          |
| 2026-11-07 | Category select is controlled (`Controller`), with the saved category as a fallback option                                  | An uncontrolled select fell back to "No category" while the list loaded, and saving would silently clear the category (caught by a test; a regression test was added). |
| 2026-11-07 | `usePathname` users (nav highlight, top bar title) wrapped in Suspense with non-highlighted fallbacks                       | Required on dynamic routes (`/ideas/[id]`) under Cache Components; the shell stays prerendered.                                                                        |
| 2026-11-07 | Tag chip list labelled "Added tags"                                                                                         | It shared the name "Tags" with the input (ambiguous for screen readers).                                                                                               |
| 2026-11-07 | Native `<datalist>` for tag suggestions                                                                                     | Accessible autocomplete with no extra library.                                                                                                                         |
| 2026-11-08 | Native date inputs + `'YYYY-MM-DD'` strings end to end; display via `parseISO` + `format`                                   | No date library pickers needed; no time-zone shifting.                                                                                                                 |
| 2026-11-08 | Generic `useUrlFilters` extracted from the ideas code                                                                       | Second use (projects) justified the abstraction.                                                                                                                       |
| 2026-11-08 | Milestones: native checkboxes + up/down buttons (no drag and drop)                                                          | Accessible by keyboard and screen reader with no extra library.                                                                                                        |
| 2026-11-08 | Timestamps (`completedAt`) formatted from `new Date(...)`, never `.slice(0, 10)`                                            | Slicing gives the UTC day, which can be off by one in the user's time zone.                                                                                            |
| 2026-11-08 | Task views as a button group with `aria-pressed` (no tabs component)                                                        | Each view is just a filter in the URL; no extra shadcn component needed.                                                                                               |
| 2026-11-08 | Task details in a side panel (`Sheet`), not a separate page                                                                 | Approved in the M4 plan: you stay in your list while editing.                                                                                                          |
| 2026-11-08 | Task mutations invalidate project queries                                                                                   | Project progress is calculated from tasks by the API.                                                                                                                  |
| 2026-11-08 | Tiptap 3 (MIT core: react, pm, starter-kit, extension-list, extensions), pinned to one exact version                        | Reliable editor that stores JSON; exact pins keep its packages in step. No paid Tiptap add-ons.                                                                        |
| 2026-11-08 | Editor uses `immediatelyRender: false` and is keyed by note id only                                                         | No server/client mismatch; saving never resets the editor while you type.                                                                                              |
| 2026-11-08 | Generic `useAutosave` hook (debounce, no overlapping saves, keep changes on failure, save on unmount, beforeunload warning) | One tested place for the tricky timing logic.                                                                                                                          |
| 2026-11-08 | Autosave refreshes only note lists; organising also refreshes tags, categories and projects                                 | Avoids refetching everything once a second while typing.                                                                                                               |
| 2026-11-08 | Idea "options" query uses its own key (`['ideas','options']`)                                                               | The ideas list's optimistic favourite rewrites every `['ideas','list']` cache entry.                                                                                   |
| 2026-11-08 | Shared `AttachSelect` + `describeUsage`                                                                                     | Notes and resources attach the same way; tags/categories describe usage the same way.                                                                                  |
| 2026-11-08 | Note text styled with a small `.note-content` CSS block (no typography plugin)                                              | Uses the theme colours; no extra dependency.                                                                                                                           |
| 2026-11-08 | Recharts 3 for the two dashboard charts, each with a text/table alternative                                                 | Approved (decision 13/26); the chart itself is `aria-hidden`, the numbers stay accessible.                                                                             |
| 2026-11-08 | Global `MutationCache.onSuccess` marks `summaryKeys` (dashboard, activity) stale                                            | Every change keeps the summaries correct without each feature remembering to refresh them; inactive queries are only marked stale.                                     |
| 2026-11-08 | Greeting reads the clock only after client data loads                                                                       | Cache Components pre-render the page; reading `new Date()` during render fails the build (and would freeze the time).                                                  |
| 2026-11-08 | Own month grid with date-fns (a `<table>` with a caption) + agenda list on phones                                           | Approved; no calendar library; a table gives screen readers rows/columns for free.                                                                                     |
| 2026-11-08 | shadcn Command (cmdk, MIT) inside our own Dialog for quick search                                                           | shadcn's `CommandDialog` puts the title outside the Base UI popup (unlabelled dialog); results come from the API, so `shouldFilter={false}`.                           |
| 2026-11-08 | Search highlights built from marker characters into React elements                                                          | No `dangerouslySetInnerHTML` anywhere; HTML in user text is shown, never run.                                                                                          |
| 2026-11-08 | Spaces between screen-reader-only pieces go between elements (`{' '}`), not inside them                                     | Accessible-name rules drop edge spaces ("Task:Renew passport"); found by tests and fixed in 4 places.                                                                  |
