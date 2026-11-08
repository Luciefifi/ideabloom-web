# IdeaBloom Web

> Your ideas, in full bloom.

The web application for **IdeaBloom**, a personal workspace for capturing ideas and growing them into
projects, tasks, milestones, notes and resources.

This app is the user interface only. All data and business logic live in the
[ideabloom-api](https://github.com/Luciefifi/ideabloom-api) backend, which this app calls over REST.

## Tech stack

| Concern       | Technology                                                                               |
| ------------- | ---------------------------------------------------------------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org/) (App Router, Cache Components) + React 19 + TypeScript |
| Styling       | Tailwind CSS 4 with lavender design tokens (CSS variables)                               |
| Components    | [shadcn/ui](https://ui.shadcn.com/) on Base UI, with lucide icons                        |
| Server data   | TanStack Query (fetching, caching, loading and error states)                             |
| Notifications | sonner (toasts)                                                                          |
| Tests         | Vitest + React Testing Library + jsdom                                                   |
| Code style    | ESLint + Prettier (with Tailwind class sorting)                                          |

## Prerequisites

- **Node.js 22.13 or newer** (see `.nvmrc`)
- The **API running** for live data: see the
  [ideabloom-api README](https://github.com/Luciefifi/ideabloom-api#getting-started). The UI still loads
  without it and shows "API unreachable".

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You are redirected to the dashboard. The dot at the bottom of the sidebar
shows whether the web app can reach the API:

| Indicator               | Meaning                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| 🟢 API connected        | Web app → API → database all working                                |
| 🟠 Database unavailable | The API is running but cannot reach PostgreSQL (is Docker running?) |
| 🔴 API unreachable      | The API is not running, or `API_URL` is wrong                       |

## Environment variables

Copy `.env.example` to `.env.local` only if you need to change something. The defaults work for local
development.

| Variable  | Default                 | Description                                                          |
| --------- | ----------------------- | -------------------------------------------------------------------- |
| `API_URL` | `http://localhost:4000` | Where the NestJS API runs. Server-side only. **Read at build time.** |

## Scripts

| Command                           | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Development server with hot reload at <http://localhost:3000> |
| `npm run build`                   | Production build                                              |
| `npm run start`                   | Serve the production build                                    |
| `npm test`                        | Run all tests once                                            |
| `npm run test:watch`              | Re-run tests when files change                                |
| `npm run typecheck`               | Generate Next.js route types, then type-check with TypeScript |
| `npm run lint`                    | ESLint                                                        |
| `npm run format` / `format:check` | Prettier (write / check only)                                 |

Before committing, a good habit: `npm run typecheck && npm run lint && npm test`.

## How the web app talks to the API

```
Browser ──fetch('/api/v1/health')──► Next.js (localhost:3000)
                                       │  rewrite in next.config.ts
                                       ▼
                                     NestJS API (API_URL, e.g. localhost:4000)
```

- All requests go through [`src/lib/api-client.ts`](src/lib/api-client.ts): `api.get`, `api.post`,
  `api.patch`, `api.delete`.
- API errors become an `ApiError` (with `status`, `message`, `messages`); connection failures become a
  `NetworkError`.
- Because the browser only talks to one origin, login cookies work without CORS.

## Authentication

| Page                      | Purpose                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `/login`                  | Log in. Supports `?next=/some/page` to return after login (only paths on this site are followed) |
| `/register`               | Create an account (password: at least 12 characters)                                             |
| `/forgot-password`        | Request a reset email (same message whether or not the account exists)                           |
| `/reset-password?token=…` | Choose a new password from the emailed link                                                      |
| `/settings`               | Profile (name, bio, time zone), change password, log out of all devices                          |

The **user menu** at the bottom of the sidebar shows who is logged in and has **Settings** and **Log out**.
Loading it also checks the session as soon as any app page opens.

How it works:

- The API sets **httpOnly cookies**. The web app never sees or stores tokens in JavaScript.
- **Staying logged in**: when a request returns `401`, `api-client.ts` calls `POST /auth/refresh` once
  (shared by all requests failing at the same moment) and retries. If that fails, it logs out and
  sends you to `/login?next=…`.
- **Route protection** (`src/proxy.ts`, rules in `src/lib/auth-routes.ts`): without the `ib_session`
  cookie, app pages redirect to `/login`; with it, login/register pages redirect to `/dashboard`.
  This is a convenience only. **The API is what actually protects data.**
- Logging out (and "log out of all devices") does a full page reload via `hardNavigate()` so no personal
  data stays in memory.
- Changing your password keeps you logged in here and logs out your other devices.

### Trying it locally

1. Start the API (`npm run start:dev` in ideabloom-api, with `npm run db:up`) and this app (`npm run dev`).
2. Open <http://localhost:3000>. You're sent to `/login`. Create an account on `/register`.
3. Forgot password: request a link, open Mailpit at <http://localhost:8025> and click the link.

### Deployment note: rate limiting needs a trusted front proxy

The API limits login attempts per visitor IP. Next.js rewrites **do not add** the visitor's IP to
`X-Forwarded-For`, and they pass through a value sent by the browser unchanged. In production, put
the app behind something that sets `X-Forwarded-For` reliably (the hosting platform's load balancer,
or nginx/Caddy), and set the API's `TRUST_PROXY` to match. Otherwise all visitors share one limit,
or the limit can be bypassed with a fake header.

## Ideas page (`/ideas`)

- **Quick capture**: type a title, press Enter, and the idea is saved to the Inbox (focus stays for the next one).
- **Search** waits until typing pauses (300 ms), then searches titles and descriptions.
- **Filters**: status, priority, category, tag, active/archived, sort and favourites. All of them are in the URL
  (`/ideas?status=exploring&favorite=true`), so the back button works and views can be bookmarked.
- **Cards** show status, category colour, priority, tags, link count and "Updated 2 hours ago".
  The ⭐ updates instantly (optimistic) and is undone with a message if saving fails.
- **Load more** fetches the next 20.
- Separate empty states for "No ideas yet" and "No ideas match these filters".
- **New idea** (header button): every field in a side panel.

### Idea page (`/ideas/<id>`)

- Edit title, description, status, priority, category, **tags** (type + Enter/comma; suggestions from existing
  tags; Backspace removes the last) and **links** (add/remove rows; `http(s)://` only).
- ⭐ favourite, **Archive** (with Undo) / **Restore**, **Delete** (asks for confirmation; permanent).
- "Idea not found" for deleted, mistyped or other people's ideas.

- **Convert to project** (idea page): dialog with title and dates; opens the new project. Converted ideas show
  **Open project** instead.

### Organize (`/ideas/organize`)

- Categories: add, rename, recolour (8-colour palette), delete. Deleting warns how many ideas will become
  uncategorized; the ideas are kept.
- Tags: rename or delete (removed from ideas; the ideas are kept), with idea counts.

## Projects page (`/projects`)

- Active projects by default (status filter: _All projects_ or one status), plus priority, category, search and sort
  (recently updated, target date, most progress, title, newest). Filters live in the URL.
- Cards: status, category, priority, **progress bar** with "3 of 5 milestones", target date (red **Overdue** when the API
  says so), milestone count.
- **New project** side panel (title, goals, description, status, priority, category, start/target dates).
- Dates are plain `YYYY-MM-DD` and displayed with `formatDay()` (no time-zone shift).

### Project page (`/projects/<id>`)

- Header: status badge, category, priority; **quick status select**; **Edit** (side panel with the project form);
  **Delete** (explains: tasks and milestones deleted, ideas kept, the source idea goes back to Planned).
- **Progress**: big percentage + bar + "2 of 4 tasks" (or "1 of 3 milestones" when the project has no tasks), what
  it's based on, start/target/completed dates.
- **Tasks**: quick add, tick off, open in the side panel, "Show completed tasks".
- When every task (or milestone) is done: "Mark the project as completed?" (a suggestion; nothing is automatic).
- **Milestones**: tick off/reopen (checkboxes), edit, delete (confirm), move up/down, add (title + optional due date);
  overdue milestones in red.
- **Related ideas**: links to each idea with its status; "Started from this idea" for the source; link another idea,
  unlink (not the source).
- **Activity**: the project's history as a timeline ("Completed milestone "Beta"", "Changed status from Planning to
  In progress"…).

## Tasks page (`/tasks`)

- **Views** (buttons): Pending (default), Overdue, Completed, All. Filters: project (or "No project"), priority,
  search, sort. Everything lives in the URL; "Clear filters" keeps the chosen view.
- **Quick add**: title + optional due date + optional project, press Enter.
- **Rows**: checkbox (complete/reopen), priority, due date ("Today", "Tomorrow", "12 Nov"; red when overdue),
  project link, "1/3 subtasks" (click to expand, tick subtasks off, add one).
- **Side panel** (click a title): edit title, notes, status, priority, start/due dates (due ≥ start), project
  (disabled for subtasks: they follow their parent), delete (says how many subtasks go with it).
- "Overdue" comes from the API (your time zone); the web never decides it. Completing or editing a task refreshes
  the projects too, because project progress is based on tasks.

## Project structure

```
src/
├── app/                      Routes (folders = URLs)
│   ├── layout.tsx            Root layout: font, metadata, providers
│   ├── page.tsx              "/" → redirects to /dashboard
│   ├── (auth)/               login, register, forgot-password, reset-password (centred card layout)
│   ├── not-found.tsx         Friendly 404 page
│   ├── icon.svg              Browser tab icon
│   ├── globals.css           Design tokens (lavender theme) + Tailwind
│   └── (app)/                Route group: pages with the sidebar layout (settings is a real page)
│       ├── layout.tsx        Sidebar + top bar shell
│       └── dashboard/ ideas/ projects/ tasks/ calendar/ notes/ resources/ search/ settings/
├── components/
│   ├── ui/                   shadcn/ui components (generated; prefer not to edit heavily)
│   ├── layout/               App shell: sidebar, top bar, navigation config
│   ├── shared/               Reusable building blocks: PageHeader, EmptyState
│   └── brand/                Logo
├── components/forms/         TextField, PasswordField, SubmitButton, FormErrorAlert
├── features/<feature>/       Feature code: API hooks, components, schemas (auth, settings, system)
├── hooks/                    Generic React hooks
├── lib/                      api-client (incl. session refresh), auth-routes, navigation, time-zones, utils
├── proxy.ts                  Redirects between login and app pages
├── providers/                Client-side providers (TanStack Query, tooltips, toasts)
└── test/                     Test helpers (renderWithProviders, jsonResponse)
```

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Branches

| Branch              | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `main`              | Stable, tested code                        |
| `develop`           | Integration branch                         |
| `feature/<name>`    | New functionality, branched from `develop` |
| `fix/<name>`        | Bug fixes                                  |
| `release/<version>` | Release preparation                        |
