# D&D Campaign Manager

A free, open-source campaign management tool for D&D 5th Edition. Run it locally as a private, self-hosted app to organize your campaigns, characters, sessions, and DM notes.

## Features

- **Campaign Management** — Create and manage multiple campaigns with setting info, status tracking, and a dashboard overview
- **Character Builder** — 7-step wizard (Basics → Abilities → Skills → Proficiencies → Equipment → Spells → Backstory) with autosave
- **Character Sheets** — Build and track PCs and NPCs with full 5e stats: ability scores, skills, equipment, spells, and backstory
- **Session Log** — Record session summaries, XP awards, loot tracking, and link encounters to sessions
- **Encounter Tracker** — Plan encounters with combatant lists and status tracking
- **DM Notes** — Organize notes by category (plot, NPC, location, loot, rules) with tagging and pinning
- **Theme System** — Three color themes (Default/gold, Sylvan/green, Arcane/purple) with light and dark mode; per-campaign overrides
- **Data Export** — Select campaigns and download all associated data as a restorable SQL backup
- **Internationalization** — All UI text externalized via react-i18next, ready for localization

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local database)
- [Docker](https://www.docker.com/) (required by Supabase CLI)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/drovani/dnd-maintainer dnd-maintainer
cd dnd-maintainer
npm install
```

### 2. Start the local Supabase database

```bash
npx supabase start
```

This spins up a local Postgres instance with the Supabase stack via Docker. On first run it will pull the required images.

Once started, note the `API URL` and `anon key` from the output.

### 3. Apply database migrations

```bash
npx supabase migration up
```

This creates the campaigns, characters, sessions, encounters, and notes tables.

### 4. Configure environment variables

Create `.env.local` with:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command                 | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `npm run start`         | Start Supabase, regenerate types, and launch Vite    |
| `npm run stop`          | Stop the local Supabase instance                     |
| `npm run dev`           | Start Vite dev server                                |
| `npm run build`         | Typecheck and build for production                   |
| `npm run preview`       | Preview the production build                         |
| `npm run typecheck`     | Run TypeScript type checking                         |
| `npm run lint`          | Lint with ESLint (`--max-warnings 0`)                |
| `npm run test`          | Run unit tests                                       |
| `npm run test:watch`    | Run tests in watch mode                              |
| `npm run test:coverage` | Run tests with coverage report                       |

## Tech Stack

- **React 19** + TypeScript (strict mode)
- **Vite 7** for dev server and builds
- **Supabase** (local Postgres) for data storage
- **TanStack React Query v5** for server state
- **React Router v7** for client-side routing
- **Tailwind CSS v4** with CSS-first config
- **Sonner** for toast notifications
- **react-i18next** for internationalization
- **ESLint 9** flat config with `eslint-plugin-i18next`
- **Vitest 4** with jsdom and `@testing-library/react` for unit and hook tests
- **Lucide React** for icons

## Project Structure

```
src/
  @types/         # Module augmentations (i18next typed resources)
  components/     # Layout and reusable UI components
  hooks/          # React Query hooks for each entity
  lib/            # Supabase client, query client, i18n config, D&D 5e helpers
  locales/en/     # Translation files (common.json, gamedata.json)
  pages/          # Route-level page components
  test/           # Test setup, mocks, wrapper, and shared hook-test helpers
  types/          # TypeScript interfaces for all domain models
supabase/
  migrations/     # SQL migration files for the database schema
```

## Data Privacy

All data stays on your machine. The local Supabase instance runs entirely in Docker on your host — nothing is sent to external servers.

## Backup & Restore

The **Export Data** page (accessible from the sidebar) lets you select one or more campaigns and download all associated data (characters, sessions, encounters, and notes) as a `seed.sql` file. The downloaded filename includes a timestamp (e.g., `seed-2026-03-13T12-00-00.sql`). The file uses `INSERT ... ON CONFLICT DO NOTHING` statements wrapped in a transaction, so it is safe to run against an existing database.

To restore a backup into your local Supabase instance:

```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f seed.sql
```

## License

This project is not yet licensed. If you'd like to use or contribute, please open an issue.
