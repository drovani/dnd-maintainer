import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OriginStep } from '@/components/character-builder/OriginStep';
import type { Character } from '@/types/database';
import type { GrantBundle } from '@/types/sources';
import type { ChoiceKey } from '@/types/choices';
import type { ResolvedCharacter } from '@/types/resolved';

// ---------------------------------------------------------------------------
// react-i18next mock
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const segments = key.split('.');
      const base = segments[segments.length - 1];
      if (opts && 'defaultValue' in opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
      if (opts && 'background' in opts) return `${base}:${String(opts.background)}`;
      if (opts && 'count' in opts) return `${base}:${String(opts.count)}`;
      if (opts && 'ability' in opts) return `${base}:${String(opts.ability)}`;
      return base;
    },
    i18n: { language: 'en' },
    ns,
  }),
}));

// ---------------------------------------------------------------------------
// Mock useCharacterContext
// ---------------------------------------------------------------------------

const mockUpdateCharacter = vi.fn();
const mockMakeChoice = vi.fn();
const mockClearChoice = vi.fn();

let mockCharacter: Character;
let mockBundles: readonly GrantBundle[];
let mockBuildChoices: Record<string, unknown>;
let mockResolved: Partial<ResolvedCharacter> | null;

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => ({
    character: mockCharacter,
    bundles: mockBundles,
    build: { choices: mockBuildChoices },
    resolved: mockResolved,
    updateCharacter: mockUpdateCharacter,
    makeChoice: mockMakeChoice,
    clearChoice: mockClearChoice,
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildSeedCharacter(overrides?: Partial<Character>): Character {
  return {
    id: '',
    slug: '',
    previous_slugs: [],
    campaign_id: 'c1',
    name: 'Test',
    player_name: null,
    character_type: 'pc',
    species: 'human',
    class: 'fighter',
    subclass: null,
    level: 1,
    background: null,
    alignment: 'lg',
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
    exhaustion_level: 0 as const,
    ...overrides,
  };
}

const ACOLYTE_SOURCE = { origin: 'background' as const, id: 'acolyte' as const };

function makeAcolyteAsiBundle(): GrantBundle {
  return {
    source: ACOLYTE_SOURCE,
    grants: [
      {
        type: 'asi',
        key: 'asi:background:acolyte:0' as ChoiceKey,
        points: 3,
        from: ['int', 'wis', 'cha'],
      },
    ],
  };
}

function makeAcolyteFeatBundle(): GrantBundle {
  return {
    source: ACOLYTE_SOURCE,
    grants: [
      {
        type: 'feat',
        featId: 'alert',
      },
    ],
  };
}

function makeAcolyteToolChoiceBundle(): GrantBundle {
  return {
    source: ACOLYTE_SOURCE,
    grants: [
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: 'tool-choice:background:acolyte:0' as ChoiceKey,
        count: 1,
        from: ['calligrapherstools', 'painterstools'],
      },
    ],
  };
}

function makeAcolyteLanguageChoiceBundle(): GrantBundle {
  return {
    source: ACOLYTE_SOURCE,
    grants: [
      {
        type: 'proficiency-choice',
        category: 'language',
        key: 'language-choice:background:acolyte:0' as ChoiceKey,
        count: 1,
        from: null,
      },
    ],
  };
}

function makeDefaultResolved(): Partial<ResolvedCharacter> {
  return {
    abilities: {
      str: { total: 10, base: 10, bonuses: [] },
      dex: { total: 10, base: 10, bonuses: [] },
      con: { total: 10, base: 10, bonuses: [] },
      int: { total: 10, base: 10, bonuses: [] },
      wis: { total: 10, base: 10, bonuses: [] },
      cha: { total: 10, base: 10, bonuses: [] },
    } as unknown as ResolvedCharacter['abilities'],
  };
}

function resetContext() {
  mockCharacter = buildSeedCharacter();
  mockBundles = [];
  mockBuildChoices = {};
  mockResolved = makeDefaultResolved();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OriginStep', () => {
  beforeEach(() => {
    resetContext();
    vi.clearAllMocks();
  });

  it('does not render a background selector (moved to BasicsStep)', () => {
    render(<OriginStep />);

    expect(screen.queryByText('chooseBackground')).toBeNull();
  });

  it('shows selectBackgroundInBasics hint when no background is selected', () => {
    render(<OriginStep />);

    expect(screen.getByText('selectBackgroundInBasics')).toBeTruthy();
  });

  it('does not render the ASI mode selector (moved to AbilitiesStep)', () => {
    mockCharacter = buildSeedCharacter({ background: 'acolyte' });
    mockBundles = [makeAcolyteAsiBundle()];

    render(<OriginStep />);

    const radios = screen.queryAllByRole('radio') as HTMLInputElement[];
    const modeRadios = radios.filter((r) => r.name === 'asi-mode');
    expect(modeRadios).toHaveLength(0);
  });

  it('shows the Origin Feat badge when background grants a feat', () => {
    mockCharacter = buildSeedCharacter({ background: 'acolyte' });
    mockBundles = [makeAcolyteAsiBundle(), makeAcolyteFeatBundle()];

    render(<OriginStep />);

    expect(screen.getByText('originFeatTitle')).toBeTruthy();
    // The feat name: t('feats.alert.name', { defaultValue: 'alert' }) → 'alert' via mock (defaultValue wins)
    expect(screen.getByText('alert')).toBeTruthy();
  });

  it('does not show Origin Feat section when background grants no feat', () => {
    mockCharacter = buildSeedCharacter({ background: 'acolyte' });
    mockBundles = [makeAcolyteAsiBundle()]; // no feat grant

    render(<OriginStep />);

    expect(screen.queryByText('originFeatTitle')).toBeNull();
  });

  it('renders ChoicePicker for tool-choice when background grants a tool proficiency choice', () => {
    mockCharacter = buildSeedCharacter({ background: 'acolyte' });
    mockBundles = [makeAcolyteAsiBundle(), makeAcolyteToolChoiceBundle()];

    render(<OriginStep />);

    expect(screen.getByText('toolProficiencyTitle')).toBeTruthy();
    // ChoicePicker renders checkboxes for each tool
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('does not render a language-choice picker (language picks are unified in DetailsStep)', () => {
    mockCharacter = buildSeedCharacter({ background: 'acolyte' });
    mockBundles = [makeAcolyteAsiBundle(), makeAcolyteLanguageChoiceBundle()];

    render(<OriginStep />);

    expect(screen.queryByText('languageTitle')).toBeNull();
  });

  it('shows only the missing-background hint when no background is selected', () => {
    render(<OriginStep />);

    expect(screen.getByText('selectBackgroundInBasics')).toBeTruthy();
    expect(screen.queryByText('originFeatTitle')).toBeNull();
    expect(screen.queryByText('toolProficiencyTitle')).toBeNull();
    expect(screen.queryByText('languageTitle')).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Lineage picker (moved here from BasicsStep)
  // ---------------------------------------------------------------------------

  it('shows lineage picker when species has lineages and bundles have caught up', () => {
    mockCharacter = buildSeedCharacter({ species: 'elf' });
    mockBundles = [
      {
        source: { origin: 'species', id: 'elf' },
        grants: [
          {
            type: 'lineage-choice',
            key: 'lineage-choice:species:elf:0' as ChoiceKey,
            speciesId: 'elf',
            from: ['drow', 'high-elf', 'wood-elf'],
          },
        ],
      },
    ] as readonly GrantBundle[];

    render(<OriginStep />);

    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    const lineageRadios = radios.filter((r) => r.name?.startsWith('choice-lineage'));
    expect(lineageRadios.length).toBeGreaterThan(0);
  });

  it('shows loading hint when species has lineages but bundles have not caught up', () => {
    mockCharacter = buildSeedCharacter({ species: 'elf' });
    mockBundles = [];

    render(<OriginStep />);

    expect(screen.getByText('loadingLineage')).toBeTruthy();
  });

  it('hides lineage picker for a species without lineages (e.g. dwarf)', () => {
    mockCharacter = buildSeedCharacter({ species: 'dwarf' });
    mockBundles = [
      {
        source: { origin: 'species', id: 'dwarf' },
        grants: [],
      },
    ] as readonly GrantBundle[];

    render(<OriginStep />);

    expect(screen.queryByText('loadingLineage')).toBeNull();
  });
});
