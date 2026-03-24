# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

D&D 5th Edition Campaign Manager — a React SPA for managing campaigns, characters, sessions, encounters, and DM notes. No auth is implemented yet (RLS is enabled but no policies are defined).

## Commands

- `npm run dev` — start Vite dev server on port 5173
- `npm run build` — typecheck with `tsc -b` then build with Vite
- `npm run lint` — ESLint with `--max-warnings 0`
- `npm run preview` — preview production build
- `npx supabase <command>` — always run Supabase CLI via `npx` (not bare `supabase`)
- `npm run supabase:reset` — reset the local Supabase database (runs migrations fresh)
- `npm run start` — start local Supabase, regenerate types, and launch Vite dev server
- `npm run stop` — stop the local Supabase instance
- `npm run supabase:types` — regenerate `src/types/supabase.ts` from current schema. Always run after migration changes and before `typecheck`.
- `npm run test` — run Vitest unit tests
- `npm run test:watch` — run tests in watch mode
- `npm run test:coverage` — run tests with v8 coverage report

## Tech Stack

- **React 19** with TypeScript (strict mode), Vite 7, React Router v7
- **Supabase** for backend (Postgres DB, client in `src/lib/supabase.ts`)
- **TanStack React Query v5** for server state (client in `src/lib/query-client.ts`)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no tailwind.config — uses CSS-first config in `src/index.css`)
- **Lucide React** for icons
- **Sonner** for toast notifications
- **react-i18next** for internationalization (config in `src/lib/i18n.ts`)
- **ESLint 9** flat config with `eslint-plugin-i18next` to catch untranslated literal strings
- **Vitest** with jsdom and `@testing-library/react` for unit and hook tests

## Architecture

### Path Alias

`@/*` maps to `src/*` (configured in both `tsconfig.json` and `vite.config.ts`). Always use `@/` imports.

### Data Flow

1. **Types**: `src/types/database.ts` — TypeScript interfaces for all domain models (Campaign, Character, Session, Encounter, Note, etc.). These are frontend types; the DB schema lives in `supabase/migrations/`.
2. **Hooks**: `src/hooks/use*.ts` — CQRS-inspired separation: query hooks for reads (`useCampaigns()`, `useCampaign(id)`), mutation hooks for writes. Campaigns and Characters use grouped mutations (`useCampaignMutations()` → `{ create, update, archive }`, `useCharacterMutations()` → `{ create, update, remove }`). Sessions, Encounters, and Notes use individual mutation hooks (`useCreateSession()`, `useUpdateSession()`, `useDeleteSession()`, etc.). `useBuilderAutosave()` handles character builder draft/finalize.
3. **Pages**: `src/pages/` — route-level components. All routes are campaign-scoped (`/campaign/:id/...`).
4. **Components**: `src/components/ui/` — shadcn/ui primitives (Badge, Button, Card, Checkbox, Dialog, Input, Label, Select, Skeleton, Sonner, Switch, Tabs, Textarea, Toggle, ToggleGroup) plus custom AutocompleteInput, GenderToggle, and ValidationError. `src/components/` — layout components (Layout, Sidebar).

### Routing

All routes are defined in `src/App.tsx`. Layout wraps all routes and provides a sidebar with campaign selection. Routes follow `/campaign/:id/<section>` pattern. Global routes (`/settings/theme`, `/export`) exist outside the campaign scope. The character builder lives at `/campaign/:id/character/new` with a 7-step wizard (Basics → Abilities → Skills → Proficiencies → Equipment → Spells → Backstory), autosave via `useBuilderAutosave()`, and dedicated step components in `src/components/character-builder/`.

### Internationalization (i18n)

All user-facing strings must use `react-i18next` translation keys — never hardcode English text in components. `eslint-plugin-i18next` enforces this.

- **Config**: `src/lib/i18n.ts` initializes i18next with bundled JSON resources (no async loading).
- **Namespaces**: `common` (UI strings — buttons, labels, errors) and `gamedata` (D&D reference data — race names, class names, skills, etc.).
- **Translation files**: `src/locales/en/common.json` and `src/locales/en/gamedata.json`.
- **Type safety**: `src/@types/i18next.d.ts` maps `resources` to the JSON files, giving compile-time key checking. Invalid `t('nonexistent.key')` calls fail typecheck.
- **Usage pattern**: `const { t } = useTranslation('common')` for UI strings, `const { t } = useTranslation('gamedata')` for game data. When both are needed in one component, alias one: `const { t: tc } = useTranslation('common')`.
- **Dynamic keys**: Domain ID types (`RaceId`, `ClassId`, `AlignmentId`) are narrow enough that template literals like `` t(`races.${raceId}`) `` typecheck without casts. If a variable is wider than the key union (e.g., `string` from `Object.entries()`), narrow it first rather than using `as never`.
- **ID-based data model**: Race, class, background, alignment, and skill values are stored as lowercase IDs in the database (e.g., `dwarf-hill`, `wizard`, `folkhero`). Always translate IDs to display names via `t()` from the `gamedata` namespace — never display raw IDs to users.

### D&D Game Data

`src/lib/dnd-helpers.ts` contains D&D 5e reference data (races, classes, skills, backgrounds, alignments) and utility functions (ability modifier calculation, proficiency bonus, spell slot tables). Race/class/background data uses ID-based keys that correspond to translation keys in `gamedata.json`.

### Database Schema

`supabase/migrations/` defines tables: campaigns, characters, sessions, encounters, notes. Complex data (abilities, equipment, spells, combatants, loot) stored as JSONB columns. All tables cascade-delete from campaigns. Campaigns support soft-delete via `archived_at`. The DB has both `character_type` (source column) and `is_npc` (generated/computed column). Sessions store loot items as JSONB with add/delete/upsert support in `SessionDetail`.

### Styling

Three color themes (Default/gold, Sylvan/green, Arcane/purple) with light and dark mode. Theme is set via `data-theme` attribute on `<html>`, dark mode via `.dark` class. Theme state managed by `ThemeProvider` in `src/components/ThemeProvider.tsx`. CSS variables for each theme defined in `src/index.css`. Per-campaign theme overrides stored in the `campaigns.theme` DB column. Reusable Tailwind component classes: `.page-container`, `.page-title`, `.hover-lift`, `.grid-2`/`.grid-3`/`.grid-4`.

- Prefer `size-*` over `w-* h-*` for square elements (icons, avatars, etc.) to signal intent that width and height should stay equal.

### Testing

- **Framework**: Vitest with jsdom, globals enabled, `restoreMocks: true`
- **Test location**: Co-located with source files (`src/lib/foo.test.ts`, `src/hooks/useHook.test.ts`)
- **Test infrastructure**: `src/test/` — `setup.ts` (global setup), `wrapper.tsx` (`createWrapper()` for QueryClient), `mocks/supabase.ts` (Supabase mock), `hook-test-helpers.ts` (shared CRUD helpers)
- **Supabase mock**: `vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))` — chainable builder; configure response via `mockQueryResult.data` / `mockQueryResult.error`
- **Hook tests**: Use `createWrapper()` from `src/test/wrapper.tsx` as the `renderHook` wrapper. Call `setupMockReset()` at the top of each describe block to reset mock state between tests.
- **Shared CRUD helpers** (`src/test/hook-test-helpers.ts`): `describeListQuery`, `describeSingleQuery`, `describeCreateMutation`, `describeUpdateMutation`, `describeDeleteMutation` — cover standard success/error/disabled cases. Write inline tests for behavior unique to a hook.
- **Lib function tests**: Co-locate test file; use `it.each` for pure input/output functions; mock `Math.random` via `vi.spyOn` for random-dependent functions.
- **Coverage**: v8 provider; includes `src/lib/**` and `src/hooks/**`; excludes `query-client.ts`, `i18n.ts`.

## Environment Variables

Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.
