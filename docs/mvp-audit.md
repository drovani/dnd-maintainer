# MVP Completeness Audit — Character Lifecycle

The MVP goal is a single, end-to-end loop: **create a character → level it up across levels 1–20 → output a COMPLETE 2024-PHB character sheet (on-screen and PDF).** The machinery for this loop already exists and works — the Source → Grant → Resolver pipeline, the character builder, the LevelUpDialog leveling flow, the on-screen CharacterSheet panels, and the PDF field map are all wired and functional for a low-level martial character. This is therefore a **gap audit**: it finds the specific places where the loop produces an incomplete or incorrect sheet, where source data is missing, and where a render/output surface silently drops resolved data. The single largest gap by far is **caster spellcasting** — across selection, resolution, and rendering — which makes a complete sheet unachievable today for roughly 7–8 of the 12 classes.

## Scope & Method

**In scope:** the create → level 1–20 → complete-sheet path, including static/derived sheet content (ability scores, proficiencies, features, spells known/prepared, spell slots per level, save DCs, passive Perception, speeds, attacks) on both the on-screen sheet and the exported PDF.

**Out of scope (noted, never actioned as gaps):** anything mutated during play — current/remaining HP, spell-slot or spell-cast expenditure, heroic-inspiration tracking, exhaustion tracking, spent hit dice — and anything under campaign sessions or DM notes. Multiclassing is treated as out of scope for the single-class MVP (the data model and source/bundle layer are partially multiclass-aware, but neither the builder nor the LevelUpDialog exposes it).

**Method:** findings were produced by 7 parallel subsystem finders (character-builder, level-up flow, resolver, spellcasting, on-screen sheet, PDF export, source-data) and then put through adversarial verification, which corrected tiers, demoted/promoted severities, and debunked several over-stated claims. Where a verifier note contradicts the original finding description, **the verifier note governs** this report (e.g. Ranger Fey Wanderer / Gloom Stalker spell tiers at 5/9/13/17 are canonical, not "misaligned"; Cleric domain-spell levels 5/7/9 are canonical; the 2024 Healer feat uses a **Utilize** action, not a Bonus Action; Fighter is **also** missing its L14 ASI; Berserker/Barbarian features appear to be at shifted levels and need re-mapping, not just an appended L14).

**RAW caveat (machine-verification limit):** the repository keeps `GOLDEN_VERIFIED` empty **by design** (`docs/coverage-matrix.md:5` — "Structurally complete: 56/86. Golden-verified (matches the PHB): 0/86"). A `complete` status proves only that an entry is present and correctly *shaped*, never that its feature ids, counts, spell lists, or numeric values match the book. Accordingly, every content-correctness claim derived from PHB rules is marked **⚠ needs human PHB confirmation** and is **not** asserted as machine-verified.

## Tiered Summary

Counts below are over the **58 raw verified findings** (before report-level dedupe). After merging overlapping findings across subsystems, the actionable set collapses to ~15 issues (see Roadmap and issue drafts).

| Tier | blocker | major | minor | Total |
|---|---:|---:|---:|---:|
| **mvp-blocker** | 4 | 10 | 4 | **18** |
| **data-coverage-debt** | 1 | 6 | 23 | **30** |
| **out-of-scope** | 0 | 0 | 10 | **10** |
| **Total** | **5** | **16** | **37** | **58** |

**Takeaway:** What stands between today and a shippable MVP is almost entirely **caster spellcasting** plus a handful of **render/output omissions**. The render omissions (passive Perception, the spellcasting stat header, extra speed modes, PDF spell slots / pact magic) are cheap fixes where the data is already resolved — the value is being dropped at the last mile. The deep work is the caster vertical: there is no grant that lets a caster pick leveled spells or sets a cantrips-known count, `resolveSpellcasting` never consumes user choices, and neither the on-screen panel nor the PDF renders the known/prepared spell list. A complete **martial** sheet is buildable today across 1–20 (modulo Fighter/Rogue missing ASIs and subclass milestones past ~L10); a complete **caster** sheet is not.

## MVP Blockers

> The 18 raw mvp-blocker findings dedupe into the items below. Merges are stated inline.

### Caster spellcasting (the critical vertical)

- **Caster spell & cantrip selection is unmodeled end-to-end** — mvp-blocker / blocker. *(Merges `spell-selection-no-leveled-spell-grant`, `spellcasting-base-class-spell-selection-missing`, `spellcasting-no-cantrip-count-grant`, and `levelup-spell-selection-not-surfaced`. The verifier tie-break promotes the merged item to mvp-blocker: this is not merely unfilled data — `resolveSpellcasting` never receives `choices`, so even the one existing Druid spell-choice decision never flows into resolved spells.)*
  - `src/lib/sources/classes.ts:372` — `type: 'spell-choice', ... count: 2, spellList: 'druid', spellLevel: 0` (the **only** spell-choice grant in all source data; Druid cantrips).
  - `src/types/grants.ts:362` — `SpellChoiceGrant` carries `spellLevel`, so the type supports leveled selection; no grant uses it for level ≥ 1.
  - `src/lib/sources/classes.ts:282` / `:386` — Cleric Thaumaturge & Druid Magician carry `grants: []` with "inert pending a cantrip-grant system".
  - `src/lib/resolver/spellcasting.ts:40` / `:11` — builds `cantrips`/`knownSpells` only from fixed `spell` grants; never consumes user `choices`.
  - **Description:** Eight classes emit a `spellcasting` grant but no grant lets a caster pick leveled (1st–9th) spells, and no grant expresses a per-level cantrips-known count (or feature-granted bonus cantrips). The single hard-coded Druid `count: 2` cantrip choice never even resolves into `cantrips`/`knownSpells` because the resolver ignores choices. Result: every full/half caster resolves to an empty (or, for Druid, mis-counted) spell list — the core MVP output is wrong for ~7–8 of 12 classes. ⚠ needs human PHB confirmation (per-class Cantrips Known / spells-prepared progressions).
  - **Fix:** Add per-level `spell-choice` (leveled) and cantrip-count grants to each caster's `ClassSource` following the 2024 class tables; wire the two "inert" feature options to emit a +1 cantrip; **change `resolveSpellcasting` to consume `choices`** so selected spells populate `cantrips`/`knownSpells`. The grant type and spell catalog already exist.

- **Known/prepared leveled spell list renders nowhere (on-screen + PDF)** — mvp-blocker / blocker. *(Merges `sheet-known-prepared-spell-list-not-displayed`, `sheet-no-leveled-spell-list-render`, and `pdf-spell-list-missing`. Inert until the selection vertical above is fixed; they are two halves of one feature.)*
  - `src/components/character-sheet/SpellcastingPanel.tsx:16` / `:28` — renders only `cantrips` and `alwaysPreparedSpells`; never reads `knownSpells`.
  - `src/lib/pdf-field-map.ts:423` — PDF spellcasting block writes only ability / save-DC / attack-bonus; no spell-list rows; the page-2 spell array fields (`Text105.*`, `Text106.*` …) are entirely unbound.
  - `src/types/resolved.ts:135` — `readonly knownSpells: readonly string[]` is populated by the resolver but consumed by no render path.
  - **Description:** Even once selection grants exist, the sheet cannot show which spells the character knows/prepared, on screen or in print — a printed caster sheet's page-2 spell area is blank. ⚠ needs human PHB confirmation (page-2 per-level spell-list layout).
  - **Fix:** Render `spellcasting.knownSpells` grouped by spell level (with prepared-vs-known / always-prepared labeling) in `SpellcastingPanel`, and bind per-level spell rows to the PDF template's page-2 spell fields (spell-level lookup via `spell-display.ts`).

- **Spell slots per level (1–9) and Warlock Pact Magic never written to the PDF** — mvp-blocker / major. *(Merges `pdf-spell-slots-missing` and `pdf-pact-magic-missing`.)*
  - `src/lib/pdf-field-map.ts:429` — writes only save-DC/attack; never reads `sc.slots` or `sc.pactMagic`.
  - `src/types/resolved.ts:130` / `:112` — `slots`, `preparedCount`, and `ResolvedPactMagic{count, slotLevel}` are populated by the resolver.
  - **Description:** A caster PDF leaves all slot-total cells blank; a Warlock prints zero slot data. The template has dedicated per-level slot-total fields (`Text112`–`Text120`) and these are unbound. **Implementation caveat:** `Text112`–`Text120` are **not** in linear level order (the middle column descends), so each field must be bound to its physical level position, not a naïve `slots[i] → Text(112+i)`. Warlock slots live in `pactMagic`, not `slots`, and need a separate single-row binding. ⚠ needs human PHB confirmation (slot/pact totals per level). *(On-screen max-slot pips already render — `sheet-spell-slots-show-current-vs-max-only` is out-of-scope/present.)*
  - **Fix:** Emit one semantic key per slot level from `resolved.spellcasting.slots`, bind each to its physical field; when `pactMagic` is non-null, emit a Pact Magic key instead of the standard slot keys.

### On-screen / PDF render omissions (data resolved, value dropped)

- **Spellcasting stat header is never shown on-screen** — mvp-blocker (major for the block; ability sub-finding minor). *(Merges `sheet-spell-save-dc-not-displayed`, `sheet-spell-attack-bonus-not-displayed`, `sheet-spellcasting-ability-not-displayed`, and the gate bug `sheet-prepared-caster-spell-block-hidden`.)*
  - `src/types/resolved.ts:131`–`133` — `ability`, `spellSaveDC`, `spellAttackBonus` all populated.
  - `src/lib/resolver/spellcasting.ts:30`/`:32`/`:33` — computed (`8 + PB + mod`, `PB + mod`).
  - `src/components/character-sheet/SpellcastingPanel.tsx:14` — header renders neither.
  - `src/pages/CharacterSheet.tsx:228`–`230` — `hasSpells` gate keys only off `cantrips.length || alwaysPreparedSpells.length`, so a prepared caster with no cantrips/always-prepared spells renders **no** spellcasting block at all.
  - **Description:** The full spellcasting stat header (ability, save DC, attack bonus) appears nowhere on-screen; the gate can hide the entire block for a low-level wizard/cleric. The same values **are** in the PDF, so this is on-screen-only. ⚠ needs human PHB confirmation (the formulas, though standard).
  - **Fix:** Render ability/save-DC/attack-bonus in the `SpellcastingPanel` header; broaden `hasSpells` (or move gating into the panel) so any spellcaster's block renders when `ability`/`spellSaveDC` is set or `knownSpells`/`preparedCount` is non-empty.

- **Passive Perception is never displayed on the on-screen sheet** — mvp-blocker / major. *(`sheet-passive-perception-not-displayed`.)*
  - `src/lib/pdf-field-map.ts:323` — `passivePerception = 10 + perception.bonus` (PDF only).
  - `src/components/character-sheet/CombatPanel.tsx:61` — renders AC/initiative/HP/PB/speed, no passive-Perception row.
  - **Description:** Required 2024-PHB sheet field; computed in the PDF map but never rendered on-screen. Data (`resolved.skills.perception.bonus`) is available. ⚠ needs human PHB confirmation (`10 + Perception bonus`, standard).
  - **Fix:** Add a Passive Perception row to `CombatPanel` mirroring the PDF computation.

- **Extra speed modes (fly/climb/swim/burrow) dropped on-screen and in PDF** — mvp-blocker / major. *(Merges `sheet-extra-speed-modes-not-displayed` and `pdf-speed-walk-only`.)*
  - `src/types/resolved.ts:265` — `speed: Readonly<Partial<Record<SpeedMode, ResolvedSpeed>>>`.
  - `src/pages/CharacterSheet.tsx:219` — reads only `resolved.speed.walk?.value`.
  - `src/lib/pdf-field-map.ts:312` — writes only `resolved.speed.walk`.
  - **Description:** The resolver populates non-walk modes (e.g. Circle of the Sea Stormborn fly 30 ft, conditional), but both output surfaces render only walk speed. ⚠ needs human PHB confirmation (sheet records granted extra speeds).
  - **Fix:** Pass the full `resolved.speed` record to `CombatPanel` and render each present mode (with any `condition`); compose the PDF speed string from all modes (template has a single speed field `Text27`).

### Level-up flow correctness

- **At ASI levels you cannot take a feat instead of an ASI** — mvp-blocker / major. *(`levelup-no-feat-instead-of-asi`.)*
  - `src/components/character-sheet/AsiAllocator.tsx:11` — `choice: Extract<PendingChoice, { type: 'asi' }>` (ability points only, no feat option).
  - `src/lib/sources/classes.ts:103` — ASI levels emit a pure `asi` grant; zero class levels emit `feat-choice`.
  - `src/components/character-sheet/LevelUpDialog.tsx:343` — renders only `AsiAllocator`; dialog has no `feat-choice` branch.
  - **Description:** The 2024 PHB allows a feat in place of an ASI at ASI levels (4/8/12/16/19 for most classes); the app supports only ability-point allocation. Structural (dialog + allocator lack any feat affordance), not just missing data. ⚠ needs human PHB confirmation (feat-instead-of-ASI is well-established).
  - **Fix:** Model the ASI level as an asi-or-feat choice (emit a `feat-choice` alongside `asi`, or a combined picker) and add the affordance to the dialog/allocator. Depends on surfacing `feat-choice` in the panel.

- **LevelUpDialog surfaces only 5 of ~13 choice-producing grant types, and Confirm enables before required choices are made** — mvp-blocker / minor (the Confirm-gate half) coupled with data-coverage-debt (the missing-pickers half). *(Merges `levelup-confirm-gate-ignores-unsurfaced-required-choices` with `levelup-dialog-missing-grant-types`; couples to `pending-choices-panel-missing-spell-feat-save`.)*
  - `src/components/character-sheet/LevelUpDialog.tsx:83`/`:96`/`:101` — categorizes only feature/asi/subclass/fighting-style-choice/damage-choice.
  - `src/components/character-sheet/LevelUpDialog.tsx:105` / `:127` — `allChoicesMade` validates only those four; `canConfirm = hpSelection !== null && allChoicesMade`.
  - `src/lib/sources/classes.ts:70` / `:198` — `weapon-mastery-choice` / `expertise-choice` occur at genuine level-up levels and are silently ignored by the dialog.
  - **Description:** Weapon-mastery, expertise, proficiency, ability, bundle, and feature choices at a level-up are neither rendered nor gated, so Confirm enables once HP is picked, committing the level with those choices pending. They are recoverable via the always-rendered amber `PendingChoicesPanel`, so a complete sheet is still reachable — this is a misleading-affordance / UX-gating defect, not data loss.
  - **Fix:** Drive the dialog's pickers from the same grant-collection logic as `PendingChoicesPanel.useAllChoiceGrants` (share a helper) so every choice-producing grant at the level is surfaced; extend `allChoicesMade` to validate each surfaced grant before enabling Confirm.

### Builder consistency

- **Finalize readiness vs blocker list diverge on alignment** — mvp-blocker / minor. *(`builder-finalize-blockers-omit-alignment`.)*
  - `src/pages/CharacterBuilder.tsx:164` — `hasRequiredFields` includes `!!character.alignment`.
  - `src/pages/CharacterBuilder.tsx:189` / `:202` — `isReadyToFinalize` and `finalizeBlockers` omit alignment.
  - **Description:** Benign today (`canLeaveBasics === hasRequiredFields` forces alignment before finalize is reachable, and `handleFinalize` re-guards on `hasRequiredFields`), but the two definitions of "required at creation" diverge — a future loosening of the Basics gate would let a character finalize with no alignment and no blocker message. Internal-consistency wart.
  - **Fix:** Derive `isReadyToFinalize` and `finalizeBlockers` from the same single source of required-field truth as `hasRequiredFields` (include alignment).

## Data-Coverage Debt (Full RAW 1-20)

> Pipeline-handled; the gap is unfilled RAW data or unwired latent seams. None breaks the low-level create/level/sheet path; several break the **level-20 completeness** target. All RAW claims ⚠ need human PHB confirmation.

### Source-data backfill (high value for 1–20 completeness)

- **Fighter & Rogue miss ASIs at L12/16/19 (Fighter also L14) + Epic Boon@19** — data-coverage-debt / major. *(`classes-fighter-rogue-missing-asi-12-16-19`.)*
  - `docs/coverage-matrix.md:26` — "fighter | partial | missing ASI at level(s) 12, 16; missing ASI or Epic Boon at level 19".
  - `docs/coverage-matrix.md:30` — same for rogue.
  - `src/lib/sources/classes.ts:561,575,578,942,946,949` — `EMPTY_LEVEL` markers.
  - **Description:** A leveled Fighter/Rogue sheet is short three (Fighter four) ASI/feat opportunities by L20 → wrong ability scores and missing feats. The other 10 classes already carry ASIs at 12/16/19, proving the pipeline handles the shape once filled. **Verifier correction:** Fighter is **also** missing the L14 ASI — include it. ⚠ needs human PHB confirmation (exact Fighter/Rogue ASI levels).
  - **Fix:** Replace the `EMPTY_LEVEL` entries with `asi` grants at Fighter 12/14/16, Rogue 12/16, and an Epic Boon (feat) grant at L19 for both.

- **Subclass milestone backfills (per family)** — data-coverage-debt / major (Cleric & Ranger demoted to minor). *(Merges the five subclass findings.)*
  - Barbarian/Druid/Bard miss L14 — `src/lib/sources/coverage-matrix.ts:64`–`66`; `docs/coverage-matrix.md:41,45,53`. **Verifier correction:** existing features appear shifted to wrong levels (e.g. Berserker), so the fix must **re-map features to correct levels**, not merely append L14.
  - Cleric misses L17 — `src/lib/sources/coverage-matrix.ts:66` (`cleric: [3, 6, 17]`); `docs/coverage-matrix.md:49`. **Verifier correction:** the L5/7/9 entries are **canonical** always-prepared domain spells, not non-canonical placements — do **not** "correct" them; only add the L17 capstone.
  - Monk misses L11 & L17 — `src/lib/sources/coverage-matrix.ts:68` (`monk: [3, 6, 11, 17]`); `docs/coverage-matrix.md:61`.
  - Ranger misses L11 & L15 — `src/lib/sources/coverage-matrix.ts:70` (`ranger: [3, 7, 11, 15]`); `docs/coverage-matrix.md:69`. **Verifier correction:** Fey Wanderer / Gloom Stalker entries at 5/9/13/17 are **canonical always-prepared spell tiers**, not misaligned — only add the missing 11/15 milestones; do **not** re-map the spell tiers.
  - Rogue misses L13 & L17 — `src/lib/sources/coverage-matrix.ts:72` (`rogue: [3, 9, 13, 17]`); `docs/coverage-matrix.md:73`.
  - **Description:** Across 5 class families a character built past the missing milestone level renders a sheet missing subclass features; adding `{ classLevel: N, grants: [...] }` entries is purely additive. ⚠ needs human PHB confirmation (exact features and levels). Track via `npm run coverage:matrix`.
  - **Fix:** Per family, add the missing milestone feature grants (re-verifying feature-to-level mapping for Barbarian, per the shift caveat).

- **0 of 86 source entries are golden-verified** — data-coverage-debt / minor. *(`coverage-zero-golden-verified-structure-not-raw`.)*
  - `docs/coverage-matrix.md:5` — "Golden-verified (matches the PHB): 0/86".
  - `src/lib/sources/coverage-matrix.ts:99` — `GOLDEN_VERIFIED = new Set<string>()`.
  - **Description:** Intentional (never overstate confidence), but no entry can be asserted RAW-correct without manual PHB transcription. ⚠ needs human PHB confirmation (by definition).
  - **Fix:** Populate `GOLDEN_VERIFIED` per-entry as expected grants are transcribed from the PHB and asserted in tests, starting with the highest-traffic MVP combos.

### Spellcasting RAW (downstream of the selection vertical)

- **No resolver-exposed cantrips-known / spells-known target** — data-coverage-debt / minor (`spellcasting-cantrip-and-known-counts-unvalidated`): `src/lib/resolver/spellcasting.ts:37`, `src/types/resolved.ts:134`. Add `cantripsKnown`/`spellsKnown` to `ResolvedSpellcasting`. ⚠ PHB.
- **Prepared/known counts hard-coded, not grant-driven; Bard/Sorcerer return 0; Paladin/Ranger use the full-caster formula** — data-coverage-debt / minor. *(Merges `spellcasting-prepared-known-count-hardcoded-not-grant`, `spellcasting-bard-sorcerer-preparedcount-zero`, `spellcasting-paladin-ranger-prepared-formula-fullcaster`.)* `src/lib/dnd-helpers.ts:224`/`:226`; `src/lib/resolver/spellcasting.ts:60` (TODO #93). Currently `preparedCount` is **rendered nowhere** (no on-screen field, no PDF field), so the wrong value is latent — hence minor. Add `bard`/`sorcerer` to prepared casters, supply correct 2024 per-level prepared-count tables (incl. half-caster table for paladin/ranger), update the stale doc-comment. ⚠ PHB.

### Resolver / builder latent seams

- **armor/weapon `proficiency-choice` grants silently dropped** — data-coverage-debt / minor. *(Merges `proficiencies-armor-weapon-choice-silently-dropped` and `builder-armor-weapon-proficiency-choice-dropped` — same TODO.)* `src/lib/resolver/proficiencies.ts:305`–`307` (`case 'armor': case 'weapon': // TODO ... break;`). Type-reachable (`src/types/grants.ts:82`–`96`) but no source emits one today. Implement the branches (apply picks + push a pending choice) mirroring tool/language, or make the default fail loudly.
- **No catch-all renderer for arbitrary pending choices; ChoicePicker lacks an exhaustive never-check** — data-coverage-debt / minor (`builder-no-catchall-pending-choice-renderer`): `src/pages/CharacterBuilder.tsx:194`, `src/components/character-builder/ChoicePicker.tsx:644`. No orphan (type, origin) is emitted at L1 today; structurally fragile. Add a catch-all section + exhaustive never-check.
- **PendingChoicesPanel omits spell-choice/feat-choice/saving-throw-choice** — data-coverage-debt / minor (`pending-choices-panel-missing-spell-feat-save`): `src/components/character-sheet/PendingChoicesPanel.tsx:146`/`:301`; resolver emits all three (`src/lib/resolver/index.ts:354,337,158`). `ChoicePicker` already renders all three; only the panel's grant collection omits them. Latent (no source emits these past creation today). Wire the three into `useAllChoiceGrants`.
- **Buy-with-gold equipment not persisted in drafts** — data-coverage-debt / minor (`builder-buy-with-gold-not-persisted-in-draft`): `src/pages/CharacterBuilder.tsx:139`/`:309`, `src/hooks/useBuilderAutosave.ts:17`. Selections reset to defaults on draft resume; recoverable same-sitting. Persist `equipmentMode`/`startingGoldTotal`/`purchasedItems` into the draft and rehydrate on resume.
- **Repeatable feats not enforced (ChoiceKey collision)** — data-coverage-debt / minor (`feat-repeatable-not-enforced-178`): `src/lib/sources/feats.ts:47`/`:270`. Same feat taken twice collides on index-0 ChoiceKey. Index repeatable-feat ChoiceKeys per acquisition (issue #178).

### Inert feats / missing mechanical grant types

- **Magic Initiate options have `grants: []`** — data-coverage-debt / major (`feat-magic-initiate-empty-grants`): `src/lib/sources/feats.ts:55` (TODO #82), `:47`. Grants the label but no cantrips/spell. Depends on the caster spell-selection vertical + spell catalog. Populate each option's grants with two cantrip + one 1st-level spell-choice. ⚠ PHB.
- **Inert feat/feature riders — no grant type for: initiative bonus (Alert), Utilize-action heal + `healerskit` tool id (Healer), damage reroll (Savage Attacker), unarmed-die/grapple (Tavern Brawler), on-hit damage rider + cantrip-damage modifier (Cleric Blessed Strikes)** — data-coverage-debt / minor. *(Merges `grant-initiative-bonus-missing-alert`, `grant-bonus-action-heal-missing-healer`, `grant-damage-reroll-missing-savage-attacker`, `grant-unarmed-grapple-missing-tavern-brawler`, `grant-on-hit-damage-rider-and-cantrip-damage-modifier-missing`.)* `src/lib/sources/feats.ts:11,33,112,133`; `src/lib/sources/classes.ts:306,312`; `src/types/grants.ts:370` (Grant union has none of these). All render as descriptive feature labels; only the mechanical rider is missing. **Verifier correction:** the 2024 Healer feat is a **Utilize** action (the repo's own gamedata text confirms), not a Bonus Action. The in-scope residue is `healerskit` as a structured `ToolProficiencyId` (`src/lib/dnd-helpers.ts:366`–`405`) and the Alert initiative bonus (`src/lib/resolver/index.ts:416` hardcodes `initiative = dexModifier`). Add the corresponding grant types incrementally as an attacks/damage subsystem and the tool-id list are built. ⚠ PHB.

### PDF fidelity / capacity

- **Tool proficiencies printed without expertise distinction** — data-coverage-debt / minor (`pdf-tool-expertise-not-distinguished`): `src/lib/pdf-field-map.ts:387`. `resolved.toolExpertise` is **already** a sibling array on the consumed object — the map just needs to read it and annotate matching tools (e.g. "Thieves' Tools (Expertise)"). ⚠ PHB.
- **Darkvision/senses only surfaced as a Species-Traits line** — data-coverage-debt / minor (`pdf-no-senses-beyond-passive-perception`): `src/lib/pdf-field-map.ts:322`. Range already prints in the i18n feature name (e.g. "Darkvision (60 ft.)"); the official sheet has no separate Senses box, so impact is near-zero. ⚠ PHB.
- **Class Features overflow beyond two columns silently clips** — data-coverage-debt / minor (`pdf-class-features-two-column-clip`): `src/lib/pdf-field-map.ts:150`/`:152`. Overflow content is written to `PdfFieldValues` but clipped by the fixed box; worsens at L20. Detect overflow and spill/abbreviate/warn (mirroring `missingFields`). ⚠ PHB.
- **Attacks capped at the sheet's six weapon rows** — data-coverage-debt / minor (`pdf-attacks-capped-six-rows`): `src/lib/pdf-field-map.ts:62`/`:326`. Hard template limit (six fields exist); prioritize equipped weapons if needed. Confirmed from field arrays — not a build-data gap.

## Out of Scope (noted, not actioned)

These are recorded for completeness and are **not** turned into issues.

- **Builder is creation-only (no in-builder 2–20 leveling)** — `builder-no-leveling-1-20` (out-of-scope/minor). Leveling lives in the CharacterSheet subsystem, which is functional. `src/pages/CharacterBuilder.tsx:34`.
- **No multiclass UI in the builder** — `builder-no-multiclass-ui` (out-of-scope/minor). A L1 2024 character is always single-class. `src/components/character-builder/BasicsStep.tsx:89`. *(Caveat: multiclassing across 2–20 is a real product gap in the LevelUpDialog subsystem, but outside this single-class MVP.)*
- **Level-up assumes single-class (targetLevel consumed as class level)** — `levelup-multiclass-not-supported` (out-of-scope/minor). Correct for single-class. `src/components/character-sheet/LevelControls.tsx:33`.
- **Restore-via-levelUp correctly clears prior choices** — `levelup-restore-clears-prior-choices-correctly` (out-of-scope/minor). Verified sound, no defect. `src/hooks/useCharacterContext.tsx:549`.
- **Spell slots / prepared count key off character level (multiclass)** — `spellcasting-multiclass-uses-character-level-as-class-level` (out-of-scope/minor). Correct for single-class. `src/lib/resolver/spellcasting.ts:59`.
- **`resolveHp` uses the first hit-die only** — `combat-hp-single-hit-die-assumption` (out-of-scope/minor). Correct for single-class. `src/lib/resolver/combat.ts:19`.
- **On-screen spell slots show max pips (used-pip state is play-mutable)** — `sheet-spell-slots-show-current-vs-max-only` (out-of-scope/minor). In-scope max-slot display is present. `src/components/character-sheet/SpellSlotsPanel.tsx:36`.
- **PDF Current HP defaults to max** — `pdf-currenthp-defaults-to-max` (out-of-scope/minor). Correct for a fresh sheet; play-mutable. `src/lib/pdf-field-map.ts:314`.
- **Player name / PC-vs-NPC not in-sheet** — `pdf-player-name-absent` (out-of-scope/minor). App metadata, not a 2024-PHB field. `src/lib/pdf-field-map.ts:263`.
- **SQL export is a raw DB backup, not a rendered sheet** — `sql-export-is-raw-dump-not-resolved-sheet` (out-of-scope/minor). Correct backup artifact. `src/lib/export-sql.ts:118`.

## Sequenced MVP Roadmap

Milestones are ordered by dependency. Each names its "done" state.

### Milestone 1 — Last-mile render fixes (no dependencies)
Cheap wins where data is already resolved and only the render/output drops it.
- Passive Perception on-screen (`CombatPanel`).
- Spellcasting stat header on-screen (ability / save DC / attack bonus) + broaden the `hasSpells` gate.
- Extra speed modes (fly/climb/swim/burrow) on-screen and in PDF.
- PDF spell slots per level + Warlock Pact Magic (mind the non-linear `Text112`–`Text120` field order and the separate pact-magic binding).
- **Done when:** a martial/partial caster's on-screen sheet and PDF show passive Perception, all granted speed modes, the spellcasting stat header (for casters), and per-level slot totals — with no resolved value silently dropped.

### Milestone 2 — Caster spell selection end-to-end (the critical path)
The deepest vertical; the spell catalog is the foundation everything else hangs off.
1. Add per-level leveled `spell-choice` grants and cantrip-count grants to caster `ClassSource` levels (and wire the two inert Cleric/Druid bonus-cantrip options).
2. Make `resolveSpellcasting` consume `choices` so selections populate `cantrips`/`knownSpells`; add `cantripsKnown`/`spellsKnown` targets to `ResolvedSpellcasting`.
3. Surface `spell-choice` in the LevelUpDialog (and wire spell-choice/feat-choice into `PendingChoicesPanel`).
4. Render the known/prepared spell list (grouped by level, prepared-vs-known labels) on-screen and bind page-2 PDF spell rows.
- **Depends on:** M1 only loosely (independent surfaces). Magic Initiate spell grants (M4) depend on the catalog + `spell-choice` machinery built here.
- **Done when:** a wizard/cleric/druid/bard/sorcerer/warlock/paladin/ranger can select cantrips and leveled spells during create and level-up, and those spells appear on-screen and in the PDF with the correct cantrips-known/prepared targets. **This is the gate for calling any caster sheet "complete."**

### Milestone 3 — Level-up flow completeness
- Feat-instead-of-ASI at ASI levels (asi-or-feat picker; depends on `feat-choice` surfacing from M2 step 3).
- Drive LevelUpDialog pickers from the shared `useAllChoiceGrants` helper so every choice-producing grant type is surfaced; extend `allChoicesMade` to gate Confirm on all of them.
- **Done when:** confirming a level-up is impossible until every required choice (ASI/feat, weapon-mastery, expertise, subclass, etc.) at that level is made in the dialog.

### Milestone 4 — Source-data backfill (full RAW 1–20)
- Fighter/Rogue ASIs at 12/14(Fighter)/16/19 + Epic Boon@19.
- Subclass milestone backfills per family (Barbarian/Druid/Bard L14 with Barbarian re-mapping; Cleric L17 only; Monk L11/L17; Ranger L11/L15 only; Rogue L13/L17).
- Prepared/known-count tables for all 8 casters (add Bard/Sorcerer; half-caster table for Paladin/Ranger).
- Magic Initiate spell grants (depends on M2 catalog + `spell-choice`).
- **Done when:** `npm run coverage:matrix` shows no missing ASI/milestone levels for the targeted classes, and a L20 single-class character of any class renders a sheet with all ASIs/feats and subclass features. (RAW correctness still pending golden verification — M6.)

### Milestone 5 — Latent-seam hardening
- armor/weapon `proficiency-choice` branch (implement or fail-loud) — **before** any class/subclass that grants such a choice is added.
- Catch-all pending-choice renderer + `ChoicePicker` exhaustive never-check.
- Buy-with-gold draft persistence; repeatable-feat per-instance ChoiceKey indexing.
- Inert feat/feature riders (Alert initiative, `healerskit` tool id, and the attacks/damage-subsystem riders) as that subsystem is built.
- PDF fidelity: tool-expertise annotation, class-features overflow warning.
- **Done when:** no resolver branch silently swallows a typed grant, drafts round-trip all build-time equipment, and the finalize gate can never deadlock on an unsurfaced choice.

### Milestone 6 — RAW golden verification
- Populate `GOLDEN_VERIFIED` per entry, starting with the highest-traffic MVP combos, asserting transcribed PHB expectations in tests.
- **Done when:** the common MVP class/subclass/species/background picks are provably RAW-correct (not merely structurally complete), discharging the ⚠ markers for those entries.
## Tracked Issues

The actionable findings above were filed as GitHub issues under milestone **Character Builder MVP**; the 9 `mvp-blocker` issues carry the **Next Up** label.

### Milestone 2 — Caster spell selection end-to-end (the critical path)

- [#263](https://github.com/drovani/dnd-maintainer/issues/263) — `P1` **[blocker]** feat(spellcasting): model caster cantrip/leveled-spell selection end-to-end
- [#264](https://github.com/drovani/dnd-maintainer/issues/264) — `P1` **[blocker]** feat(sheet): render known/prepared leveled spell list on-screen and in PDF
- [#265](https://github.com/drovani/dnd-maintainer/issues/265) — `P2` **[blocker]** feat(levelup): surface spell-choice and feat-choice in LevelUpDialog and PendingChoicesPanel

### Milestone 1 — Last-mile render fixes (no dependencies)

- [#266](https://github.com/drovani/dnd-maintainer/issues/266) — `P2` **[blocker]** feat(pdf): export per-level spell slots and Warlock Pact Magic to the character sheet
- [#267](https://github.com/drovani/dnd-maintainer/issues/267) — `P2` **[blocker]** feat(sheet): display the spellcasting stat header on-screen and fix the hasSpells gate
- [#268](https://github.com/drovani/dnd-maintainer/issues/268) — `P2` **[blocker]** feat(sheet): show Passive Perception on the on-screen character sheet
- [#269](https://github.com/drovani/dnd-maintainer/issues/269) — `P2` **[blocker]** feat(sheet): render granted fly/climb/swim/burrow speeds on-screen and in PDF

### Milestone 3 — Level-up flow completeness

- [#270](https://github.com/drovani/dnd-maintainer/issues/270) — `P2` **[blocker]** feat(levelup): allow taking a feat instead of an Ability Score Improvement
- [#271](https://github.com/drovani/dnd-maintainer/issues/271) — `P3` **[blocker]** fix(levelup): surface and gate all choice-producing grant types in LevelUpDialog

### Milestone 4 — Source-data backfill (full RAW 1-20)

- [#272](https://github.com/drovani/dnd-maintainer/issues/272) — `P3` feat(classes): add missing Fighter/Rogue ASIs (12/14/16/19) and Epic Boon at 19
- [#273](https://github.com/drovani/dnd-maintainer/issues/273) — `P3` feat(subclasses): backfill missing higher-level subclass milestone features (per family)
- [#275](https://github.com/drovani/dnd-maintainer/issues/275) — `P4` feat(spellcasting): grant-driven prepared/known spell counts for all 8 casters
- [#276](https://github.com/drovani/dnd-maintainer/issues/276) — `P4` feat(feats): wire Magic Initiate spell grants once the spell-choice machinery exists

### Milestone 5 — Latent-seam hardening

- [#274](https://github.com/drovani/dnd-maintainer/issues/274) — `P4` **[blocker]** fix(builder): derive finalize readiness and blockers from a single required-field source
- [#277](https://github.com/drovani/dnd-maintainer/issues/277) — `P4` feat(resolver): implement armor/weapon proficiency-choice handling (or fail loud)
- [#278](https://github.com/drovani/dnd-maintainer/issues/278) — `P5` fix(builder): persist buy-with-gold equipment in drafts and add a catch-all pending-choice renderer
- [#279](https://github.com/drovani/dnd-maintainer/issues/279) — `P5` feat(grants): add mechanical grant types for inert feats and feature riders
- [#280](https://github.com/drovani/dnd-maintainer/issues/280) — `P6` feat(pdf): annotate tool expertise and warn on Class Features overflow

### Milestone 6 — RAW golden verification

- [#281](https://github.com/drovani/dnd-maintainer/issues/281) — `P7` chore(sources): populate GOLDEN_VERIFIED for high-traffic MVP picks
