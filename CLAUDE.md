# IdeaBloom Web: Claude Code Guide

This repo is the **web frontend** of IdeaBloom (Next.js App Router + TypeScript + Tailwind + shadcn/ui).
It is UI only. All data and business logic come from the `ideabloom-api` REST backend.

**Full project context:** the shared guide at `../CLAUDE.md` (decisions, milestones, progress log) and
the brief at `../docs/PROJECT_BRIEF.md`. Claude Code loads `../CLAUDE.md` automatically when started
inside this folder. At the start of a session, check its progress log to see where we are.

@AGENTS.md

## Rules (repeated here in case this repo is used on its own)

- **Never** `git commit`, `git push`, force-push or pull with rebase. **Never** add Claude attribution or
  Co-authored-by lines. The owner commits and pushes everything.
- Never work on `main`. Use `feature/*` or `fix/*` branches from `develop`.
- Plan first and wait for approval before major changes. Explain decisions in simple English.
- Don't duplicate backend business logic here. The frontend validates for user experience only.
- The browser calls `/api/*` on this app's own origin; Next.js rewrites forward it to the API.
- When you need API details, read `../ideabloom-api` docs (use `/add-dir ../ideabloom-api` if needed).
- After each step, add an entry to the progress log in `../CLAUDE.md` (repo + branch + what's next).

## Commands

- `npm run dev`: http://localhost:3000 (the API should run on :4000 for live data)
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`
- Add UI components: `npx shadcn@4.23.0 add <name>`, then `npm run format` (shadcn writes its own style)

## Conventions

- Next.js 16 differs from older versions: check `node_modules/next/dist/docs/` before using an API.
- shadcn/ui here is built on **Base UI**: compose with the `render` prop (e.g.
  `<SidebarMenuButton render={<Link href="/x" />}>`), not `asChild`.
- Colours: use semantic Tailwind classes (`bg-primary`, `text-muted-foreground`, `bg-lavender-soft`).
  Never put white text on `#9B7EDE` (fails contrast). See `docs/ARCHITECTURE.md`.
- API calls only through `src/lib/api-client.ts`; data fetching with TanStack Query hooks in
  `src/features/<feature>/`.
- Navigation lives in `src/components/layout/nav-items.ts`.
- Use `PageHeader` and `EmptyState` from `src/components/shared/` for consistent pages.
- Forms: react-hook-form + zod, `TextField`/`PasswordField`/`SubmitButton`/`FormErrorAlert` from
  `src/components/forms/`. Components using `useSearchParams` must be inside `<Suspense>`.
- Auth: never store tokens in JS; rely on cookies. Use `useCurrentUser()`. Route rules live in
  `src/lib/auth-routes.ts` (tested). Follow `?next=` only via `getSafeRedirect`.
- Tests mock `next/navigation` (useRouter/useSearchParams), fake the API with `mockApi({ 'GET /users/me': … })`
  and use `testUser`/`renderWithProviders` from `src/test/render.tsx`. Mock `@/lib/navigation` for logout flows.
- Don't use shadcn's `SidebarMenuSkeleton` (Math.random breaks prerendering); use `useWatch`, not `watch()`.
- Query keys live with their feature (e.g. `ideaKeys` in `features/ideas/use-ideas.ts`); invalidate by prefix
  (`ideaKeys.all`). Optimistic updates: cancel → snapshot → setQueriesData → restore on error → invalidate.
- Effects that call a callback with the latest props/state: use `useEffectEvent` (React 19.2+), not extra deps.
- Selects whose options load asynchronously must be controlled (`Controller`), not `register`ed.
- Any client component calling `usePathname`/`useSearchParams`/`useParams` must render inside `<Suspense>`
  (otherwise dynamic routes fail the build).
  Run `npm run typecheck` too: Vitest doesn't type-check, and the build does.
- Don't install `@vitejs/plugin-react` or use `--legacy-peer-deps` (see the decisions log).
- Note content is Tiptap JSON: render it with `NoteEditor` only, never with `dangerouslySetInnerHTML`. Keep the Tiptap
  packages on one exact version. Link rules (`SAFE_LINK`) must match the API's.
- Autosave goes through `useAutosave` (`src/hooks`). Don't re-key the editor on `updatedAt` (it would reset while typing).
- Queries that return a plain page must not live under a key that another hook rewrites as infinite data
  (e.g. `ideaKeys.lists()`); use a separate key such as `['ideas', 'options']`.
- Don't call `new Date()` / `Date.now()` while rendering a page that can be pre-rendered; read the clock only in
  branches that run after client data has loaded (or in effects/handlers). The build fails otherwise.
- Summary queries (dashboard, activity feed) use `summaryKeys` (`src/lib/summary-keys.ts`); they are invalidated
  automatically after every successful mutation.
- Screen-reader-only text: never start or end an `sr-only` span with a space; put `{' '}` between elements instead.
- shadcn components here import `cn` from the `cn` package (shadcn's official one, since M0); keep generated files as they are.
  When `shadcn add` asks to overwrite an existing component, answer **no** (`yes n | npx shadcn@4.23.0 add …`).
- Search text from the API contains highlight markers: render it with `Highlighted`, and use `plainText()` for URLs/labels.
