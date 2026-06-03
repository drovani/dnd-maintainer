import { Given, When, Then } from '@cucumber/cucumber';
import { createElement } from 'react';
import type { DndWorld } from '../../steps/support/world.js';
import type { Campaign } from '../../../src/types/database.js';
import type { Row } from '../../steps/support/stateful-supabase.js';

// ---------------------------------------------------------------------------
// View character sheet — render-app seam.
//
// Seeds a characters row + character_build_levels rows (shapes copied from
// src/lib/build-reconstruction.test.ts) + optional character_items, then renders
// the real CharacterSheet. CharacterProvider/useCharacterContext is pure (no
// supabase); only useCharacters / useCharacterBuild / useBuilderAutosave are
// re-esmocked with the stateful store.
// ---------------------------------------------------------------------------

const BASE_ABILITIES = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };

function creationRow(characterId: string): Row {
  return {
    character_id: characterId,
    sequence: 0,
    base_abilities: BASE_ABILITIES,
    ability_method: 'standard-array',
    class_id: null,
    class_level: null,
    subclass_id: null,
    asi_allocation: null,
    feat_id: null,
    hp_roll: null,
    choices: null,
    deleted_at: null,
  };
}

function levelRow(characterId: string, classLevel: number): Row {
  return {
    character_id: characterId,
    sequence: classLevel,
    base_abilities: null,
    ability_method: null,
    class_id: 'fighter',
    class_level: classLevel,
    subclass_id: null,
    asi_allocation: null,
    feat_id: null,
    hp_roll: 6,
    choices: null,
    deleted_at: null,
  };
}

function seedCampaign(world: DndWorld): Campaign {
  const campaign: Campaign = {
    id: 'cs-camp',
    slug: 'sheet-camp',
    previous_slugs: [],
    name: 'Sheet Campaign',
    description: null,
    setting: null,
    status: 'active',
    theme: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    archived_at: null,
    allowed_source_books: ['phb-2024'],
  };
  world.db.seed('campaigns', [campaign as unknown as Row]);
  world.createdCampaign = campaign;
  return campaign;
}

interface SheetSeed {
  readonly level: number;
  readonly status: 'draft' | 'ready';
  readonly items?: readonly { item_id: string; quantity: number; equipped: boolean }[];
  readonly backstory?: string;
  readonly personalityTraits?: string;
}

function seedCharacter(world: DndWorld, campaign: Campaign, seed: SheetSeed): Row {
  const id = 'cs-char';
  const character: Row = {
    id,
    slug: 'aldara',
    previous_slugs: [],
    campaign_id: campaign.id,
    name: 'Aldara',
    status: seed.status,
    character_type: 'pc',
    is_active: true,
    level: seed.level,
    species: 'human',
    class: 'fighter',
    background: 'soldier',
    alignment: null,
    gender: null,
    player_name: null,
    armor_class: 10,
    hit_points_max: 10,
    speed: 30,
    proficiency_bonus: 2,
    personality_traits: seed.personalityTraits ?? null,
    ideals: null,
    bonds: null,
    flaws: null,
    backstory: seed.backstory ?? null,
    appearance: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
  world.db.seed('characters', [character]);

  const rows: Row[] = [creationRow(id)];
  for (let lvl = 1; lvl <= seed.level; lvl += 1) rows.push(levelRow(id, lvl));
  world.db.seed('character_build_levels', rows);

  world.db.seed(
    'character_items',
    (seed.items ?? []).map((it, i) => ({
      id: `cs-item-${i}`,
      character_id: id,
      item_id: it.item_id,
      quantity: it.quantity,
      equipped: it.equipped,
      attuned: false,
      source: null,
    }))
  );
  return character;
}

async function renderCharacterSheet(world: DndWorld, campaign: Campaign, character: Row) {
  const useCharactersMod = await world.esmockWithSupabase('@/hooks/useCharacters');
  const useCharacterBuildMod = await world.esmockWithSupabase('@/hooks/useCharacterBuild');
  const useBuilderAutosaveMod = await world.esmockWithSupabase('@/hooks/useBuilderAutosave');
  const mod = await world.esmockWithSupabase('@/pages/CharacterSheet', {
    '@/hooks/useCharacters': useCharactersMod,
    '@/hooks/useCharacterBuild': useCharacterBuildMod,
    '@/hooks/useBuilderAutosave': useBuilderAutosaveMod,
    '@/hooks/usePageTitle': { usePageTitle: () => undefined },
  });
  const CharacterSheet = (mod.default ??
    (mod as { CharacterSheet: unknown }).CharacterSheet) as () => React.ReactElement;
  const router = (await import('react-router-dom')) as typeof import('react-router-dom');
  const tree = createElement(
    router.Routes,
    null,
    createElement(router.Route, {
      path: '/campaign/:campaignSlug/character/:characterSlug',
      element: createElement(CharacterSheet),
    })
  );
  const r = await world.renderRoute(`/campaign/${campaign.slug}/character/${character.slug}`, tree);
  await r.rtl.waitFor(() => {
    if (!document.body.textContent?.includes(character.name as string)) throw new Error('character sheet not ready');
  });
  return r;
}

async function setupSheet(world: DndWorld, seed: SheetSeed) {
  const campaign = seedCampaign(world);
  const character = seedCharacter(world, campaign, seed);
  await renderCharacterSheet(world, campaign, character);
}

// --- Givens -----------------------------------------------------------------

Given('a level {int} Fighter character sheet', async function (this: DndWorld, level: number) {
  await setupSheet(this, { level, status: 'draft' });
});

Given('a finalized Fighter character sheet holding a longsword', async function (this: DndWorld) {
  await setupSheet(this, {
    level: 1,
    status: 'ready',
    items: [{ item_id: 'longsword', quantity: 1, equipped: true }],
  });
});

// --- Assertions -------------------------------------------------------------

function statRowValue(label: string): string | null {
  const labelSpan = (Array.from(document.querySelectorAll('span')) as HTMLSpanElement[]).find(
    (s) => s.textContent?.trim() === label
  );
  const valueSpan = labelSpan?.parentElement?.querySelector('span.font-mono');
  return valueSpan?.textContent?.trim() ?? null;
}

Then('the sheet shows a proficiency bonus of {int}', function (this: DndWorld, expected: number) {
  const value = statRowValue('Proficiency Bonus');
  if (value !== `+${expected}`) {
    throw new Error(`Expected proficiency bonus "+${expected}", got "${value ?? '(not found)'}"`);
  }
});

Then('the sheet shows the {word} {word} section', function (this: DndWorld, w1: string, w2: string) {
  const heading = `${w1} ${w2}`;
  if (!document.body.textContent?.includes(heading)) {
    throw new Error(`Expected the "${heading}" section heading on the sheet`);
  }
});

Then('the sheet shows the {word} section', function (this: DndWorld, heading: string) {
  if (!document.body.textContent?.includes(heading)) {
    throw new Error(`Expected the "${heading}" section heading on the sheet`);
  }
});

Then('the sheet prompts the player to resolve pending choices', function (this: DndWorld) {
  if (!document.body.textContent?.includes('Choices Required')) {
    throw new Error('Expected a "Choices Required" pending-choices panel, but it was not shown');
  }
});

Then('the equipment list shows the longsword', function (this: DndWorld) {
  const txt = document.body.textContent ?? '';
  if (!/longsword/i.test(txt)) {
    throw new Error(`Expected the equipment list to show the longsword. Body: ${txt.slice(0, 400)}`);
  }
});

// --- US-012: edit backstory / personality -----------------------------------

function characterRow(world: DndWorld): Row {
  const row = (world.db.rows('characters') as Row[]).find((c) => c.id === 'cs-char');
  if (!row) throw new Error('Setup error: seeded character not found in the store');
  return row;
}

// React 19 controlled inputs need user-event to fire onChange.
async function typeInto(el: HTMLTextAreaElement, value: string): Promise<void> {
  const userEvent = (await import('@testing-library/user-event')).default;
  const user = userEvent.setup({ document });
  await user.clear(el);
  await user.type(el, value);
}

async function openSectionEditor(world: DndWorld, heading: string) {
  const r = world.renderRouteResult!;
  await r.rtl.act(async () => {
    const h2 = (Array.from(document.querySelectorAll('h2')) as HTMLHeadingElement[]).find(
      (h) => h.textContent?.trim() === heading
    );
    const btn = h2?.parentElement?.querySelector('button') as HTMLButtonElement | null;
    if (!btn) throw new Error(`Could not find the edit control for the "${heading}" section`);
    r.rtl.fireEvent.click(btn);
  });
  await r.rtl.waitFor(() => {
    if (!document.querySelector('textarea')) throw new Error('edit dialog did not open');
  });
  return r;
}

async function saveDialog(world: DndWorld, predicate: () => boolean) {
  const r = world.renderRouteResult!;
  await r.rtl.act(async () => {
    const save = (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).find((b) =>
      /^Save$/i.test((b.textContent ?? '').trim())
    );
    if (!save) throw new Error('Could not find the Save button in the edit dialog');
    r.rtl.fireEvent.click(save);
  });
  await r.rtl.waitFor(() => {
    if (!predicate()) throw new Error('edit not persisted yet');
  });
}

Given('a Fighter character sheet with an existing backstory and personality', async function (this: DndWorld) {
  await setupSheet(this, {
    level: 1,
    status: 'draft',
    backstory: 'A wandering sellsword.',
    personalityTraits: 'Stoic and watchful.',
  });
});

When('the Dungeon Master edits the backstory to {string}', async function (this: DndWorld, text: string) {
  await openSectionEditor(this, 'Backstory');
  await typeInto(document.querySelector('textarea') as HTMLTextAreaElement, text);
  await saveDialog(this, () => characterRow(this).backstory === text);
});

When('the Dungeon Master edits the personality traits to {string}', async function (this: DndWorld, text: string) {
  await openSectionEditor(this, 'Personality');
  await typeInto(document.querySelector('#personality-traits') as HTMLTextAreaElement, text);
  await saveDialog(this, () => characterRow(this).personality_traits === text);
});

Then("the character's backstory reads {string}", function (this: DndWorld, text: string) {
  const actual = characterRow(this).backstory;
  if (actual !== text) throw new Error(`Expected backstory "${text}", got "${actual}"`);
});

Then("the character's personality traits read {string}", function (this: DndWorld, text: string) {
  const actual = characterRow(this).personality_traits;
  if (actual !== text) throw new Error(`Expected personality traits "${text}", got "${actual}"`);
});
