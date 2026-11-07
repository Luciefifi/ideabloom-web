# IdeaBloom Web: Claude Code Guide

This repo is the **web frontend** of IdeaBloom (Next.js App Router + TypeScript + Tailwind + shadcn/ui).
It is UI only. All data and business logic come from the `ideabloom-api` REST backend.

**Full project context:** the shared guide at `../CLAUDE.md` (decisions, milestones, progress log) and
the brief at `../docs/PROJECT_BRIEF.md`. Claude Code loads `../CLAUDE.md` automatically when started
inside this folder. At the start of a session, check its progress log to see where we are.

## Rules (repeated here in case this repo is used on its own)
- **Never** `git commit`, `git push`, force-push or pull with rebase. **Never** add Claude attribution or
  Co-authored-by lines. The owner commits and pushes everything.
- Never work on `main`. Use `feature/*` or `fix/*` branches from `develop`.
- Plan first and wait for approval before major changes. Explain decisions in simple English.
- Don't duplicate backend business logic here. The frontend validates for user experience only.
- The browser calls `/api/*` on this app's own origin; Next.js rewrites forward it to the API.
- Lavender design system: primary `#9B7EDE`, soft `#EAE2FA`, background `#F7F4FC`, deep `#6F55AE`,
  text `#242033`. Lavender is an accent; cards are white.
- When you need API details, read `../ideabloom-api` docs (use `/add-dir ../ideabloom-api` if needed).
- After each step, add an entry to the progress log in `../CLAUDE.md` (repo + branch + what's next).

## Commands
To be added in M0 Step 3 (install, run, test).
