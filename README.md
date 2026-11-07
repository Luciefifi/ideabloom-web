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
- Because the browser only talks to one origin, login cookies (Milestone 1) work without CORS.

## Project structure

```
src/
├── app/                      Routes (folders = URLs)
│   ├── layout.tsx            Root layout: font, metadata, providers
│   ├── page.tsx              "/" → redirects to /dashboard
│   ├── not-found.tsx         Friendly 404 page
│   ├── icon.svg              Browser tab icon
│   ├── globals.css           Design tokens (lavender theme) + Tailwind
│   └── (app)/                Route group: pages with the sidebar layout
│       ├── layout.tsx        Sidebar + top bar shell
│       └── dashboard/ ideas/ projects/ tasks/ calendar/ notes/ resources/ search/ settings/
├── components/
│   ├── ui/                   shadcn/ui components (generated; prefer not to edit heavily)
│   ├── layout/               App shell: sidebar, top bar, navigation config
│   ├── shared/               Reusable building blocks: PageHeader, EmptyState
│   └── brand/                Logo
├── features/<feature>/       Feature code: API hooks, components, schemas (e.g. features/system)
├── hooks/                    Generic React hooks
├── lib/                      api-client, utils
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
