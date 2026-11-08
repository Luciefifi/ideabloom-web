# Changelog: IdeaBloom web

All notable changes, newest first. Versions follow [semantic versioning](https://semver.org):
`MAJOR.MINOR.PATCH`. Each release is an annotated Git tag on `main`.

## [1.0.0] - 2026-11-08

### Added

- **Settings**: Light / Dark / System theme (saved to the account, applied before the first paint), start page,
  signed-in devices with "Sign out" per device, "Download my data", "Delete my account".
- **Dark theme**, contrast-checked (WCAG AA) for every colour pair and badge.
- Friendly error pages (`error.tsx`, `global-error.tsx`) and a "Skip to content" link.
- **Security headers**: Content-Security-Policy, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`; the `X-Powered-By` header is removed.
- **End-to-end tests** with Playwright (real browser + real API + test database), including automatic
  accessibility scans (axe) of the main pages in both themes.
- User guide (`docs/USER_GUIDE.md`) and deployment checklist (`docs/DEPLOYMENT.md`).

### Changed

- The note editor (Tiptap) and the dashboard charts (Recharts) load only on the pages that use them.
- The account menu's spoken name now includes the visible name and email.

### Fixed

- Colour contrast of red (error/overdue/delete) text in both themes.
- Dashboard charts were hidden from screen readers but still reachable with the keyboard.
- Settings could show a hydration mismatch when the profile was already loaded by another part of the page.

## [0.8.0] - 2026-11-08

### Added

- Calendar (month grid, agenda on phones), Ctrl + K quick search, and the search page with safe highlighting.

## [0.7.0] - 2026-11-08

### Added

- Dashboard: quick capture, at-a-glance numbers, deadlines, active projects, charts, recent activity.

## [0.6.0] - 2026-11-08

### Added

- Notes with a rich-text editor and autosave; resources (saved links); notes and resources on idea and project pages.

## [0.5.0] - 2026-11-08

### Added

- Tasks page (pending/overdue/completed/all), subtasks, task side panel, tasks on project pages.

## [0.4.0] - 2026-11-08

### Added

- Projects and milestones, converting ideas into projects, progress, related ideas, project activity.

## [0.3.0] - 2026-11-08

### Added

- Ideas (quick capture, filters in the URL, detail page), categories and tags.

## [0.2.0] - 2026-11-07

### Added

- Login, registration, password reset, protected pages, account menu and settings (profile, password, sessions).

## [0.1.0] - 2026-11-07

### Added

- Project foundation: Next.js 16, Tailwind, shadcn/ui, lavender design tokens, app shell, API connection.
