import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpellcastingPanel } from '@/components/character-sheet/SpellcastingPanel';
import type { Character } from '@/types/database';
import type { ResolvedCharacter } from '@/types/resolved';
import type { ResolvedSpellcasting } from '@/types/resolved';

// Interpolates {{key}} placeholders; returns the last key segment as the base string
function mockT(key: string, opts?: Record<string, unknown>): string {
  const base = key.split('.').pop() ?? key;
  if (!opts) return base;
  return Object.entries(opts).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    base
  );
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const mockMutate = vi.fn();

vi.mock('@/hooks/useCharacters', () => ({
  useCharacterMutations: () => ({
    create: { mutate: vi.fn() },
    update: { mutate: vi.fn() },
    remove: { mutate: vi.fn() },
    updatePreparedSpells: { mutate: mockMutate },
  }),
}));

let mockRows: readonly { class_id: string; deleted_at?: string | null }[] = [];

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => ({ rows: mockRows }),
}));

function makeAbilityScore(total: number) {
  const modifier = Math.floor((total - 10) / 2);
  return { base: total, bonuses: [], total, modifier };
}

function makeResolvedCharacter(wisScore: number): ResolvedCharacter {
  return {
    abilities: {
      str: makeAbilityScore(10),
      dex: makeAbilityScore(10),
      con: makeAbilityScore(10),
      int: makeAbilityScore(10),
      wis: makeAbilityScore(wisScore),
      cha: makeAbilityScore(10),
    },
    hitDie: [],
    hitPoints: { max: 8 },
    speed: {},
    initiative: 0,
    proficiencyBonus: 2,
    armorClass: { calculations: [], bonuses: [], effective: 10 },
    savingThrows: {
      str: { bonus: 0, proficient: false, breakdown: [], sources: [] },
      dex: { bonus: 0, proficient: false, breakdown: [], sources: [] },
      con: { bonus: 0, proficient: false, breakdown: [], sources: [] },
      int: { bonus: 0, proficient: false, breakdown: [], sources: [] },
      wis: { bonus: 0, proficient: true, breakdown: [], sources: [] },
      cha: { bonus: 0, proficient: false, breakdown: [], sources: [] },
    },
    skills: {} as ResolvedCharacter['skills'],
    armorProficiencies: [],
    weaponProficiencies: [],
    toolProficiencies: [],
    languages: [],
    features: [],
    resistances: [],
    immunities: [],
    spellcasting: null,
    equipment: [],
    attacks: [],
    pendingChoices: [],
  };
}

function makeSpellcasting(overrides: Partial<ResolvedSpellcasting> = {}): ResolvedSpellcasting {
  return {
    ability: 'wis',
    spellSaveDC: 12,
    spellAttackBonus: 4,
    cantrips: [],
    knownSpells: [],
    alwaysPreparedSpells: [],
    slots: [2, 3], // level 1 and level 2 slots
    ...overrides,
  };
}

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    slug: 'test-druid',
    previous_slugs: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    campaign_id: 'camp-1',
    name: 'Test Druid',
    player_name: 'Alice',
    character_type: 'pc',
    race: 'human',
    class: 'druid',
    subclass: null,
    level: 1,
    background: null,
    alignment: null,
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: 8,
    armor_class: 11,
    speed: 30,
    proficiency_bonus: 2,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'ready',
    prepared_spells: [],
    ...overrides,
  };
}

describe('SpellcastingPanel prepared-spell cap', () => {
  it('clamps cap to 1 when WIS 6 at druid level 1 (add button visible since 0 < 1)', () => {
    // WIS 6 → modifier -2; level 1 druid → max(1, -2+1) = max(1, -1) = 1
    // 0 prepared spells < cap 1 → add button should be visible
    mockRows = [{ class_id: 'druid', deleted_at: null }];
    const character = makeCharacter({ prepared_spells: [] });
    const resolved = makeResolvedCharacter(6);
    const spellcasting = makeSpellcasting();

    render(<SpellcastingPanel character={character} resolved={resolved} spellcasting={spellcasting} />);

    // Add button shows because 0 prepared < cap (1)
    expect(screen.getByText(/addSpell/)).toBeDefined();
  });

  it('shows add button when 0 of 15 spells prepared (WIS 20, druid level 10)', () => {
    // WIS 20 → modifier +5; level 10 druid → max(1, 5+10) = 15
    // 0 prepared < 15 → add button should be visible
    mockRows = Array.from({ length: 10 }, () => ({ class_id: 'druid', deleted_at: null }));
    const character = makeCharacter({ prepared_spells: [] });
    const resolved = makeResolvedCharacter(20);
    const spellcasting = makeSpellcasting({ slots: [4, 3, 3, 3, 2] });

    render(<SpellcastingPanel character={character} resolved={resolved} spellcasting={spellcasting} />);

    expect(screen.getByText(/addSpell/)).toBeDefined();
  });

  it('hides add button when WIS 10 druid level 1 has 1 prepared spell (at cap)', () => {
    // WIS 10 → modifier 0; level 1 → cap = max(1, 0+1) = 1
    // One spell already prepared → at cap → add button hidden
    mockRows = [{ class_id: 'druid', deleted_at: null }];
    const character = makeCharacter({ prepared_spells: ['entangle'] });
    const resolved = makeResolvedCharacter(10);
    const spellcasting = makeSpellcasting();

    render(<SpellcastingPanel character={character} resolved={resolved} spellcasting={spellcasting} />);

    expect(screen.queryByText(/addSpell/)).toBeNull();
  });

  it('shows add button when WIS 14 druid level 1 has 0 prepared spells (below cap of 3)', () => {
    // WIS 14 → modifier +2; level 1 → cap = max(1, 2+1) = 3
    // No spells prepared → below cap
    mockRows = [{ class_id: 'druid', deleted_at: null }];
    const character = makeCharacter({ prepared_spells: [] });
    const resolved = makeResolvedCharacter(14);
    const spellcasting = makeSpellcasting();

    render(<SpellcastingPanel character={character} resolved={resolved} spellcasting={spellcasting} />);

    expect(screen.getByText(/addSpell/)).toBeDefined();
  });

  it('renders always-prepared section when alwaysPreparedSpells is non-empty', () => {
    mockRows = [{ class_id: 'druid', deleted_at: null }];
    const character = makeCharacter({ prepared_spells: [] });
    const resolved = makeResolvedCharacter(14);
    const spellcasting = makeSpellcasting({ alwaysPreparedSpells: ['entangle'] });

    render(<SpellcastingPanel character={character} resolved={resolved} spellcasting={spellcasting} />);

    expect(screen.getByText('alwaysPreparedHeader')).toBeDefined();
  });

  it('renders cantrips section when cantrips are present', () => {
    mockRows = Array.from({ length: 3 }, () => ({ class_id: 'druid', deleted_at: null }));
    const character = makeCharacter({ prepared_spells: [] });
    const resolved = makeResolvedCharacter(14);
    const spellcasting = makeSpellcasting({ cantrips: ['druidcraft'], slots: [4, 3, 2] });

    render(<SpellcastingPanel character={character} resolved={resolved} spellcasting={spellcasting} />);

    expect(screen.getByText('cantripsHeader')).toBeDefined();
  });
});
