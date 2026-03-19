# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

D&D 5th Edition Campaign Manager — a React SPA for managing campaigns, characters, sessions, encounters, and DM notes. No auth is implemented yet (RLS is enabled but no policies are defined).

## Commands

- `npm run dev` — start Vite dev server on port 5173
- `npm run build` — typecheck with `tsc -b` then build with Vite
- `npm run lint` — ESLint for ts/tsx files
- `npm run preview` — preview production build
- `npx supabase <command>` — always run Supabase CLI via `npx` (not bare `supabase`)
- `npm run supabase:reset` — reset the local Supabase database (runs migrations fresh)
- `npm run supabase:types` — regenerate `supabase/database.types.ts` from current schema. Always run after migration changes and before `typecheck`.
- No test framework is configured yet

## Tech Stack

- **React 19** with TypeScript (strict mode), Vite 7, React Router v7
- **Supabase** for backend (Postgres DB, client in `src/lib/supabase.ts`)
- **TanStack React Query v5** for server state (client in `src/lib/query-client.ts`)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no tailwind.config — uses CSS-first config in `src/index.css`)
- **Lucide React** for icons

## Architecture

### Path Alias

`@/*` maps to `src/*` (configured in both `tsconfig.json` and `vite.config.ts`). Always use `@/` imports.

### Data Flow

1. **Types**: `src/types/database.ts` — TypeScript interfaces for all domain models (Campaign, Character, Session, Encounter, Note, etc.). These are frontend types; the DB schema lives in `supabase/migrations/`.
2. **Hooks**: `src/hooks/use*.ts` — CQRS-inspired separation: query hooks for reads (`useCampaigns()`, `useCampaign(id)`), mutation hooks for writes (`useCampaignMutations()` → `{ create, update, archive }`, `useCharacterMutations()` → `{ create, update, remove }`).
3. **Pages**: `src/pages/` — route-level components. All routes are campaign-scoped (`/campaign/:id/...`).
4. **Components**: `src/components/ui/` — shadcn/ui primitives (Badge, Button, Card, Checkbox, Dialog, Input, Label, Select, Skeleton, Switch, Tabs, Textarea) plus custom AutocompleteInput. `src/components/` — layout components (Layout, Sidebar).

### Routing

All routes are defined in `src/App.tsx`. Layout wraps all routes and provides a sidebar with campaign selection. Routes follow `/campaign/:id/<section>` pattern.

### D&D Game Data

`src/lib/dnd-helpers.ts` contains D&D 5e reference data (races, classes, skills, backgrounds, alignments) and utility functions (ability modifier calculation, proficiency bonus, spell slot tables).

### Database Schema

`supabase/migrations/` defines tables: campaigns, characters, sessions, encounters, notes. Complex data (abilities, equipment, spells, combatants) stored as JSONB columns. All tables cascade-delete from campaigns. Campaigns support soft-delete via `archived_at`. The DB has both `character_type` (source column) and `is_npc` (generated/computed column).

### Styling

Light theme only. Custom CSS variables for theme colors defined in `src/index.css`. Reusable Tailwind component classes: `.page-container`, `.page-title`, `.hover-lift`, `.grid-2`/`.grid-3`/`.grid-4`.

- Prefer `size-*` over `w-* h-*` for square elements (icons, avatars, etc.) to signal intent that width and height should stay equal.

## Environment Variables

Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.
