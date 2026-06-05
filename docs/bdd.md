# BDD / Cucumber Specs

The Cucumber BDD suite lives under `features/` and is part of the project on `main`. It is
**spec-first**: scenarios are written as work orders that drive app development, including for
functionality the app does not have yet.

## Commands

- `npm run test:bdd` — run the default profile (implemented, passing scenarios). Stays green.
- `npm run test:bdd:future` — run the `future` profile (spec-ahead scenarios, expected to fail
  with meaningful assertions).
- `npm run uat:checklist` — export the specs to a manual UAT checklist (`docs/uat-checklist.csv`,
  or `-- --format md` for a printable Markdown version). One row per scenario, labeled with its
  tag-derived status (Ready / Future / Draft). See `scripts/gen-uat-checklist.ts`.

Always run via the npm scripts, not raw `npx tsx`. The scripts set
`TSX_TSCONFIG_PATH=tsconfig.app.json` so JSX uses the automatic runtime — the root
`tsconfig.json` has no `jsx` setting, which otherwise causes `React is not defined`.

## Spec-first philosophy

The value of the suite is the spec **driving** development:

1. Write features as if from scratch.
2. Write features for functionality the app does **not** have yet.
3. Use the red scenarios as work orders for building the app.

**Never edit `src/` or `supabase/migrations/` to force a scenario green.** A red scenario blocked
by genuinely-missing app functionality _is_ the to-do item — implementing the feature (or adding a
DB constraint) just to pass it destroys the signal. When implementing BDD **steps**, only edit
files under `features/`. A scenario blocked by missing functionality should get a meaningful
assertion that FAILS and be tagged `@future`.

## Tag taxonomy

Defined in `cucumber.js`:

- **untagged** — implemented and passing; runs by default.
- **`@future`** — steps ARE implemented but assert behavior the app does not have yet (spec-ahead
  work orders). Excluded from the default run; view via `npm run test:bdd:future`. Expected to FAIL
  with real assertions.
- **`@draft`** — legacy "no steps yet"; being retired. A feature-level `@draft` (line 1) applies to
  the whole file and should be pushed DOWN to the specific scenarios that remain `@future`.

The default profile tags are `not @future and not @draft` (stays green). Cucumber **ANDs** a
profile's `tags` with any CLI `--tags`, so you cannot view `@future` via `--tags @future` against
the default profile — use the `future` profile. Once `@draft` is fully retired this simplifies to
`not @future`.

## Two binding seams

Pick the seam by where the behavior actually lives:

### Resolver seam (character creation)

Steps build a `CharacterBuild` and call the real `collectBundles()` + `resolveCharacter()` — no UI,
no Supabase.

- Helpers: `features/steps/support/character-builder.ts` — `makeBuild()`, `resolveBuild()`,
  `STANDARD_ARRAY`.
- Shared vocabulary: `features/characters/steps/` (sets `this.resolved`).

### Render-app + stateful-mock seam (campaigns, finalize, anything UI/DB)

Seed data, then render the real page into jsdom.

- `this.db.seed(table, rows)` — a query-aware in-memory Supabase mock in
  `features/steps/support/stateful-supabase.ts`.
- `this.renderRoute(route, element)` — renders the REAL page (MemoryRouter + QueryClientProvider).
- Inject Supabase via nested **shallow** `this.esmockWithSupabase(modulePath, extraDefs)`. Deep or
  global esmock breaks under the tsx loader, so re-esmock each hook module that imports Supabase and
  pass it as an extraDef; also stub `@/hooks/usePageTitle`.

## Run-time gotchas

Most are already wired into `world.ts` / `cucumber.js` / `package.json`:

- `world.ts` must expose DOM constructor globals (`HTMLElement`, etc.) or `@base-ui/react` /
  `@floating-ui` throw.
- Assert on the DOM via `textContent.includes` or `getByText(name, { exact: false })`, not exact
  `queryByText` — names render nested with sibling text.
- Positional feature paths are IGNORED (config `paths` wins) — scope a run with `--name`.
