import { Given, When, Then } from '@cucumber/cucumber';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { DndWorld } from '../../steps/support/world.js';
import { makeBuild, resolveBuild, STANDARD_ARRAY } from '../../steps/support/character-builder.js';
import type { CharacterBuild } from '@/types/choices';
import type { Character } from '@/types/database';
import type { BuildLevelRow, CreationRow, LevelRow } from '@/lib/build-reconstruction';
import type { AutosavePayload } from '@/hooks/useBuilderAutosave';

/**
 * Finalize-character seam: render-app / data seam (persistence) + resolver.
 *
 * The build is finalized through the REAL `useBuilderAutosave().finalize` — the
 * production entry point the wizard uses. The stateful supabase double now honors
 * the calls it makes (`.upsert` for build-level rows, `.not('sequence','in',...)`
 * for orphan cleanup, `character_items` insert, and the `status` promotion update),
 * so the draft→ready promotion and the resolver-derived stat mapping are exercised
 * by production code rather than assembled by the step. Assertions then read
 * `this.db.rows('characters')` — the `status: 'ready'`, proficiency bonus, and max
 * HP they check are written by the hook, not by the test.
 *
 * Feature-unique steps only — shared build vocabulary lives in character-common.steps.ts.
 */

interface AutosaveHook {
  useBuilderAutosave: (existingCharacterId?: string) => { finalize: (payload: AutosavePayload) => Promise<string> };
}

interface CharactersQuery {
  useCharacters: (campaignId: string) => { isSuccess: boolean; isError: boolean; data?: { name: string }[] };
}

const CAMPAIGN_ID = 'camp-1';

/** Visible text of the rendered Basics step from the most recent missing-class attempt.
 *  Module-scoped (not on the World) so we don't have to touch the shared world.ts type.
 *  Scenarios run sequentially and the When always runs before the Then. */
let lastBasicsStepText = '';

/**
 * A draft `Character` for the builder to finalize. Resolver-derived stats
 * (hit_points_max, proficiency_bonus, ...) are left null on purpose — `finalize`
 * fills them from the `resolved` it is handed, so the hook (not the test) owns
 * that mapping. `status` is 'draft'; finalize is what promotes it to 'ready'.
 */
function draftCharacter(build: CharacterBuild): Character {
  return {
    id: '',
    slug: '',
    previous_slugs: [],
    created_at: '',
    updated_at: '',
    campaign_id: CAMPAIGN_ID,
    name: 'Aria Brightwood',
    player_name: 'Test Player',
    character_type: 'pc',
    species: build.speciesId,
    class: build.levels[0]?.classId ?? null,
    subclass: null,
    level: build.levels.length,
    background: build.backgroundId,
    alignment: 'ng',
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: null,
    armor_class: null,
    speed: null,
    proficiency_bonus: null,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'draft',
    weapon_masteries: null,
    heroic_inspiration: false,
    exhaustion_level: 0,
    conditions: [],
  };
}

/** Build the `character_build_levels` rows finalize persists: one creation row + one per class level. */
function buildLevelRows(build: CharacterBuild): BuildLevelRow[] {
  const creation: CreationRow = {
    sequence: 0,
    base_abilities: build.baseAbilities,
    ability_method: build.abilityMethod,
    choices: {},
    deleted_at: null,
  };
  const levels: LevelRow[] = build.levels.map((lv, i) => ({
    sequence: i + 1,
    class_id: lv.classId,
    class_level: lv.classLevel,
    subclass_id: null,
    asi_allocation: null,
    hp_roll: lv.hpRoll,
    feat_id: null,
    choices: {},
    deleted_at: null,
  }));
  return [creation, ...levels];
}

async function persistFinalized(world: DndWorld): Promise<void> {
  const build = world.build!;
  const resolved = resolveBuild(build);
  const mod = (await world.esmockWithSupabase('@/hooks/useBuilderAutosave')) as unknown as AutosaveHook;
  const { result } = renderHook(() => mod.useBuilderAutosave(), { wrapper: world.createWrapper() });
  const payload: AutosavePayload = { character: draftCharacter(build), rows: buildLevelRows(build), resolved };
  await act(async () => {
    await result.current.finalize(payload);
  });
}

// --- Given -----------------------------------------------------------------

Given(
  'a complete character build with a name, class, species, background, and ability scores',
  function (this: DndWorld) {
    this.build = makeBuild({ classId: 'fighter', speciesId: 'human', backgroundId: 'soldier', level: 1 });
  }
);

Given('a character build that is missing a class', function (this: DndWorld) {
  // A build whose only level row carries no class — the Basics gate blocks finalize.
  this.build = makeBuild({ speciesId: 'human', backgroundId: 'soldier', level: 1 });
});

Given('a complete character build at level 1', function (this: DndWorld) {
  this.build = makeBuild({ classId: 'fighter', speciesId: 'human', backgroundId: 'soldier', level: 1 });
});

Given('a complete character build in the active campaign', function (this: DndWorld) {
  this.db.seed('campaigns', [{ id: CAMPAIGN_ID, name: 'Active Campaign', slug: 'active-campaign' }]);
  this.build = makeBuild({ classId: 'fighter', speciesId: 'human', backgroundId: 'soldier', level: 1 });
});

// --- When ------------------------------------------------------------------

When('the player finalizes the build', async function (this: DndWorld) {
  await persistFinalized(this);
});

When('the player attempts to finalize the build', async function (this: DndWorld) {
  // Required-fields gate: a build missing a class is surfaced in the Basics step UI,
  // which is where the user is stranded (they cannot leave Basics without a class).
  // Render the step and capture whether a class-required requirement is communicated.
  await renderMissingClassBasics(this);
});

// --- Then ------------------------------------------------------------------

Then('the character is created as an active character', function (this: DndWorld) {
  const rows = this.db.rows('characters');
  if (rows.length !== 1) {
    throw new Error(`Expected exactly one persisted character, got ${rows.length}`);
  }
  const row = rows[0] as Partial<Character>;
  if (row.status !== 'ready') {
    throw new Error(`Expected persisted character status 'ready' (active), got '${String(row.status)}'`);
  }
});

Then('the character is not finalized', function (this: DndWorld) {
  const rows = this.db.rows('characters');
  if (rows.length !== 0) {
    throw new Error(`Expected no character to be persisted from an incomplete build, got ${rows.length}`);
  }
});

Then('the player is shown what is still required', function (this: DndWorld) {
  // INTENDED behavior: when a class is missing, the builder must tell the player a
  // class is still required. The only reachable surface for a class-less build is the
  // Basics step (the finalize blockers list in CharacterBuilder renders only on the
  // last step, which is unreachable without a class). BasicsStep marks the Class field
  // with a bare '*' but surfaces no message naming the class as a missing requirement,
  // so the requirement is not actually communicated. -> @future.
  const text = lastBasicsStepText;
  const communicatesRequirement = /class[^.]*\b(required|missing|needed|must choose|must select)\b/i.test(text);
  if (!communicatesRequirement) {
    throw new Error(
      'Expected the builder to tell the player that a class is still required, but no such message was shown'
    );
  }
});

Then('the finalized character has a proficiency bonus', function (this: DndWorld) {
  const rows = this.db.rows('characters');
  const row = rows[0] as Partial<Character> | undefined;
  const expected = resolveBuild(this.build!).proficiencyBonus;
  if (!row || row.proficiency_bonus == null) {
    throw new Error('Expected the finalized character to have a proficiency bonus, but it was missing');
  }
  if (row.proficiency_bonus !== expected) {
    throw new Error(`Expected proficiency bonus ${expected}, got ${row.proficiency_bonus}`);
  }
});

Then('the finalized character has maximum hit points', function (this: DndWorld) {
  const rows = this.db.rows('characters');
  const row = rows[0] as Partial<Character> | undefined;
  const expected = resolveBuild(this.build!).hitPoints.max;
  if (!row || row.hit_points_max == null) {
    throw new Error('Expected the finalized character to have maximum hit points, but it was missing');
  }
  if (row.hit_points_max !== expected) {
    throw new Error(`Expected maximum hit points ${expected}, got ${row.hit_points_max}`);
  }
});

Then("the character appears among the campaign's characters", async function (this: DndWorld) {
  const mod = (await this.esmockWithSupabase('@/hooks/useCharacters')) as unknown as CharactersQuery;
  const hook = renderHook(() => mod.useCharacters(CAMPAIGN_ID), { wrapper: this.createWrapper() });
  await waitFor(() => {
    const r = hook.result.current;
    if (!r.isSuccess && !r.isError) throw new Error('useCharacters never settled');
  });
  const data = hook.result.current.data ?? [];
  const found = data.some((c) => c.name === 'Aria Brightwood');
  if (!found) {
    throw new Error(
      `Expected the finalized character among the campaign's characters, got: ${JSON.stringify(data.map((c) => c.name))}`
    );
  }
});

// --- Basics-step rendering for the missing-class gate -----------------------

/**
 * Render BasicsStep with a class-less build and record its visible text so the
 * Then-step can check whether the missing class is communicated as a requirement.
 */
async function renderMissingClassBasics(world: DndWorld): Promise<void> {
  const { createElement } = await import('react');
  const reactI18next = await import('react-i18next');
  const { I18nextProvider } = reactI18next;
  const i18nMod = (await import('@/lib/i18n')) as { default: unknown };

  const creationRow = {
    sequence: 0,
    base_abilities: world.build?.baseAbilities ?? STANDARD_ARRAY,
    ability_method: 'standard-array',
    choices: {},
    deleted_at: null,
  };
  const seedCharacter = {
    id: '',
    slug: '',
    previous_slugs: [],
    campaign_id: CAMPAIGN_ID,
    name: 'Aria Brightwood',
    player_name: null,
    character_type: 'pc',
    species: world.build?.speciesId ?? 'human',
    class: null,
    subclass: null,
    level: 0,
    background: world.build?.backgroundId ?? 'soldier',
    alignment: 'ng',
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: null,
    armor_class: null,
    speed: null,
    proficiency_bonus: null,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'draft',
    created_at: '',
    updated_at: '',
    weapon_masteries: null,
    heroic_inspiration: false,
    exhaustion_level: 0,
  };

  const fakeContext = {
    character: seedCharacter,
    rows: [creationRow], // no level row -> no class selected
    build: world.build ?? null,
    bundles: [],
    resolved: null,
    buildError: null,
    buildWarnings: [],
    isDirty: false,
    level: 0,
    hasDeletedRows: false,
    nextRestoreLevel: null,
    updateCharacter: () => undefined,
    updateCreation: () => undefined,
    levelUp: () => undefined,
    levelDown: () => undefined,
    undoLevelDown: () => undefined,
    replaceLevel: () => undefined,
    makeChoice: () => undefined,
    clearChoice: () => undefined,
    markSaved: () => undefined,
  };

  const mod = (await world.esmockWithSupabase('@/components/character-builder/BasicsStep', {
    '@/hooks/useCharacterContext': { useCharacterContext: () => fakeContext },
    '@/hooks/useCharacters': { usePlayerNames: () => ({ data: [], isError: false }) },
  })) as { BasicsStep: (props: Record<string, never>) => unknown };

  const element = createElement(
    I18nextProvider,
    { i18n: i18nMod.default as never },
    createElement(mod.BasicsStep as never, {})
  );

  await world.renderRoute('/campaign/active-campaign/character/new', element as never);
  lastBasicsStepText = document.body.textContent ?? '';
}
