# Security Review — dnd-maintainer

**Date:** 2026-06-01
**Scope:** Entire codebase (288 tracked files), reviewed as a prerequisite for implementing authentication & authorization.
**Reviewer:** Claude Code security review.

## Threat model (read this first)

This is a **client-only React SPA talking directly to Supabase/PostgREST with a public anon key**. The anon key ships inside the JavaScript bundle — it is _meant_ to be public. The **only** server-side authorization boundary is Postgres Row Level Security (RLS). Today that boundary is wide open.

**Consequence:** Any hook-layer "scoping" (`.eq('campaign_id', …)`, slug filters, the export page selecting specific IDs) is **convention, not security**. Anyone who opens devtools, reads the anon key, and hits the PostgREST REST endpoint directly can read, modify, and delete **every row in every table** — campaigns, characters, sessions, notes — regardless of what the React code does. There is no auth and no per-row ownership, so there is currently nothing to enforce.

This is **known and intentional for local dev** (the migration says so), but it is the entire problem the upcoming auth work must close. The findings below are framed around that goal.

---

## Findings by severity

### CRITICAL

#### C1 — No authorization model exists; RLS is fully permissive

- **Where:** `supabase/migrations/00001_initial_schema.sql:378-405`
- **What:** Every table has RLS _enabled_ but with `CREATE POLICY … FOR ALL USING (true) WITH CHECK (true)`, plus `GRANT SELECT, INSERT, UPDATE, DELETE … TO anon, authenticated` on all seven tables. There is **no `owner_id` / `user_id` / membership column** on any table. The DB has no concept of who owns a campaign or character.
- **Impact:** Unrestricted public DML on all data via the anon key. This is the headline issue.
- **Fix (part of the auth work):**
  1. Add `owner_id uuid NOT NULL REFERENCES auth.users(id)` to `campaigns` (the tenancy root).
  2. Replace the `USING (true)` policies with policies keyed on `auth.uid()` and campaign membership (see C2 for the collaboration shape).
  3. **Revoke the blanket `anon` grants** — decide deliberately whether unauthenticated access is allowed at all (`config.toml` already has `enable_anonymous_sign_ins = false`, but the Postgres `anon` _role_ still holds table grants, which is what actually matters).
  4. Child tables (characters, sessions, encounters, notes, character_build_levels, character_items) should enforce ownership transitively via their `campaign_id` / `character_id` FK in the RLS policy (e.g. `EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid())`).

#### C2 — Schema does not support the collaboration/role model the specs already describe

- **Where:** BDD specs in `features/admin/*` (manage-accounts, manage-roles, initiate-password-reset), `features/auth/*`, `features/collaboration/*` (invite-players, assign-characters, manage-own-characters, accept-invite, **data-ownership-isolation**).
- **What:** These specs describe accounts, roles (admin/DM/player), invitations, per-player character ownership, and cross-tenant data isolation. The schema supports **none** of it: no users, no roles, no campaign membership, and `characters.player_name` is **free text**, not a FK to a user.
- **Impact:** "Manage own characters", "assign characters", and "data ownership isolation" cannot be enforced with the current schema. If auth is bolted on without modeling this, RLS will only express "DM owns everything" and the player-facing features will have no enforcement layer.
- **Fix:** Design the membership model up front:
  - `profiles` (1:1 with `auth.users`) for app-level role/display data.
  - `campaign_members(campaign_id, user_id, role)` where role ∈ {dm, player} for multi-user campaigns.
  - Add `owning_user_id uuid REFERENCES auth.users` to `characters` (distinct from the campaign owner) so "players manage their own characters" is expressible in RLS.
  - Write RLS policies per table that read from `campaign_members` so DM-vs-player visibility is enforced server-side, not in React.

---

### HIGH

#### H1 — Global slug lookups are IDOR today; must be covered by RLS

- **Where:** `src/hooks/useCampaigns.ts:32`, `src/hooks/useCharacters.ts:34`, `src/hooks/useSessions.ts:32` — each does `.or(\`slug.eq.${safe},previous_slugs.cs.{"${safe}"}\`)` with **no campaign/owner scoping**.
- **What:** A slug resolves a row across the _entire_ table. Slugs are short and name-derived (`name-slice` + 8 hex chars, max 24), so they are guessable/enumerable. With RLS open, knowing or guessing a slug returns another tenant's data.
- **Impact:** Cross-tenant read today; will be a real IDOR after auth **if** the RLS policies from C1 don't cover SELECT on these tables.
- **Fix:** No code change needed in the hooks — but the C1 RLS policies **must** apply to SELECT (not just writes), so these global lookups silently return only rows the caller may see. Verify with a test that an authenticated non-owner gets zero rows for another user's slug.
- **Note (positive):** The PostgREST `.or()` injection vector here **is** properly defended — `validateSlug()` (`src/lib/slug-utils.ts`) enforces `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$` (max 128) and throws on anything that could inject PostgREST operators, before interpolation. This is correct and should be kept.

#### H2 — plpgsql functions have a mutable `search_path` (latent privilege-escalation vector)

- **Where:** `supabase/migrations/00001_initial_schema.sql` — `update_updated_at_column()` (l.14), `generate_slug()` (l.27), `trigger_manage_slug()` (l.99). None set `search_path`; all are default `SECURITY INVOKER`.
- **What:** Today the risk is **latent** (invoker functions run with the caller's privileges). But the auth work will almost certainly introduce a `SECURITY DEFINER` helper — e.g. a membership check, or an `owner_id = auth.uid()` enforcement trigger. A `SECURITY DEFINER` function with a mutable `search_path` is the classic Postgres privilege-escalation hole (an attacker shadows a referenced table/function in a schema they control).
- **Impact:** Invisible in a frontend sweep; directly on-point for "prerequisite to auth."
- **Fix:** Add `SET search_path = ''` (and schema-qualify all object references, e.g. `public.campaigns`) to the existing functions now, and make it a hard rule for every auth helper/trigger you add. Supabase's own linter flags this as `function_search_path_mutable`.

---

### MEDIUM

#### M1 — Auth config defaults need hardening before launch

- **Where:** `supabase/config.toml`
- **Findings:**
  - `[auth] enabled = false` (l.151) — currently off; flip on when ready.
  - `minimum_password_length = 6` (l.175) and `password_requirements = ""` — raise to ≥ 8 and set complexity requirements.
  - `[auth.email] enable_confirmations = false` (l.209) — **enable email confirmation** before launch, otherwise users can sign up with email addresses they don't own (account squatting / spam).
  - `secure_password_change = false` (l.211) — consider enabling so password changes require recent re-auth.
  - Good already: `jwt_expiry = 3600`, `enable_refresh_token_rotation = true`, `enable_anonymous_sign_ins = false`, OTP expiry/length sane, email send rate-limited.

#### M2 — Session tokens live in `localStorage` (XSS → token theft)

- **What:** `supabase-js` stores the session/refresh token in `localStorage` by default. Any XSS becomes full account takeover (token exfiltration), and refresh-token rotation doesn't save you if the attacker grabs the live token.
- **Current state (positive):** No XSS sinks exist today — **no** `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, or dynamic `javascript:` URLs anywhere in `src/`. React's default escaping is intact.
- **Fix / discipline for the auth build:**
  - Keep the no-`dangerouslySetInnerHTML` invariant (consider an ESLint rule to enforce it).
  - Add a **Content-Security-Policy** at the host (see M4) — for a localStorage-token SPA this is the single most effective XSS-to-takeover mitigation.
  - When `portrait_url` / `image_url` (currently stored but **not rendered** anywhere) start being displayed, restrict to `http(s)` schemes and reject `javascript:`/`data:` — render via `<img src>` only, never as a link `href` without scheme validation.

#### M3 — Dependency: `ws` moderate advisory (bundled but unused)

- **Where:** `ws@8.19.0` pulled transitively by `@supabase/supabase-js` → `realtime-js` and by `@tanstack/devtools-vite`. Advisory GHSA-58qx-3vcg-4xpx (uninitialized memory disclosure, affects 8.0.0–8.20.0).
- **Impact:** Low in practice — confirmed **no Realtime usage** in the app (`grep` for `.channel(`/`.subscribe(`/`realtime` is empty), so this code path isn't exercised client-side, and devtools is stripped from prod builds (`removeDevtoolsOnBuild: true`).
- **Fix:** `npm audit fix` (non-breaking bump to ≥ 8.20.1). Full `npm audit` also shows a `fast-uri` high advisory, but it's a **dev-only** transitive dep (tooling); not shipped.

#### M4 — No security headers / CSP (no hosting config in repo)

- **What:** There's no `netlify.toml` / `vercel.json` / `_headers` defining response headers. For an SPA that holds auth tokens in `localStorage`, a CSP is a meaningful defense-in-depth layer.
- **Fix:** When you pick a host, add a CSP (`default-src 'self'`, allow the Supabase URL for `connect-src`, `frame-ancestors 'none'`), plus `X-Content-Type-Options: nosniff` and `Referrer-Policy`. Don't over-invest beyond this — the RLS/anon-key story (C1) is the real exposure, not header hygiene.

---

### LOW / INFORMATIONAL

#### L1 — Error messages leak raw DB/PostgREST strings to the UI

- **Where:** `src/pages/ExportData.tsx:104-107` (and the banner at l.187 renders the raw message), `src/pages/CharacterList.tsx`, `src/pages/SessionDetail.tsx`.
- **What:** Raw Supabase error `.message` values are surfaced to the user. Fine pre-auth; post-auth these can leak schema/RLS-policy details on permission-denied errors.
- **Fix:** Catch, log internally via the existing `logger`, and show a generic translated message for permission/DB errors.

#### L2 — SQL export: escaping is sound; relies on RLS for tenant scoping

- **Where:** `src/lib/export-sql.ts`, `src/pages/ExportData.tsx:56-62`.
- **Assessment (positive):** Injection-safe — `standard_conforming_strings = ON`, single quotes doubled, null bytes stripped, integers `Math.trunc`'d, booleans coerced, identifiers come from a **hardcoded allowlist** (`TABLE_COLUMNS`), never user input. The output is a `.sql` file the user runs against their own DB.
- **Note for auth:** The export fetches by `.in('id', ids)` / `.in('campaign_id', ids)` with **no ownership check** — it relies entirely on RLS (C1) to ensure a user can only export campaigns they own. Once C1's SELECT policies exist, this is automatically correct; verify it.

#### L3 — CodeQL `security-extended` queries are commented out

- **Where:** `.github/workflows/codeql.yml` (the `queries:` line is commented).
- **Fix:** Uncomment `queries: security-extended,security-and-quality` for deeper static analysis coverage.

#### L4 — Secrets / storage hygiene: clean

- `.env.local` is **gitignored** (not tracked) and contains only the local demo anon key + `127.0.0.1` URL — no real secrets. No hardcoded credentials/tokens anywhere in `src/`. `localStorage` is used only for theme/color-mode (`src/lib/theme.ts`) — non-sensitive. Character-builder drafts persist in the **DB** (`status='draft'`), not client storage, so they'll be covered by RLS automatically.

---

## Confirmed-clean surfaces (verified, not assumed)

- **XSS sinks:** none (no `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function`/`document.write`).
- **Open redirects:** none (no `window.location`/`location.href` assignment from user input; navigation via React Router with validated slugs).
- **PostgREST injection:** all `.or()` filters guarded by `validateSlug()` allowlist.
- **Supabase Storage:** not used (no `.storage`/`.upload(`).
- **Supabase Realtime:** not used (no `.channel(`/`.subscribe(`).
- **RPC:** no `.rpc(` calls.
- **Regex injection:** only static patterns; no user-built regex.

---

## Recommended sequence for the auth implementation

1. **Model tenancy first (C1 + C2):** add `auth.users`-backed `owner_id` on campaigns, a `campaign_members(campaign_id, user_id, role)` table, and `owning_user_id` on characters. Write a migration for this _before_ writing any RLS.
2. **Replace permissive policies with `auth.uid()`-based RLS** on all seven tables (SELECT included — H1), and **revoke the blanket `anon` grants**.
3. **Harden the DB functions (H2):** `SET search_path = ''` + schema-qualified refs on existing functions; same rule for every new auth trigger/helper, especially `SECURITY DEFINER` ones.
4. **Harden auth config (M1):** enable email confirmation, raise password length/requirements, flip `[auth] enabled = true`.
5. **Keep the XSS invariant + add a CSP (M2/M4)** since tokens live in `localStorage`.
6. **Run the platform linter as a gate (post-RLS):** Supabase's `get_advisors` (security) / `supabase db lint` natively flags `rls_policy_allows_public_access` and `function_search_path_mutable` — run it after the RLS migration lands and treat findings as blocking. (Couldn't run it here — this is a local-only stack with no linked cloud project_id.)
7. **`npm audit fix` (M3)** to clear the `ws` advisory.
8. **Scrub UI error messages (L1)** once permission-denied paths exist.

## Bottom line

The application code is **clean on the usual SPA vulnerability classes** — no XSS, no injection, no leaked secrets, sound SQL-export escaping, and a genuinely good PostgREST-injection guard. The risk is **entirely** in the authorization layer: there is no auth and no per-row ownership, RLS is `USING(true)`, and the public anon key grants full DML to anyone. That, plus the collaboration/role model the specs assume but the schema lacks (C2) and the latent `search_path` issue (H2), is exactly the work the auth project needs to do. Build the tenancy model and RLS first; everything else is secondary.
