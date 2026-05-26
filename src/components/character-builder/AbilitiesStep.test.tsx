import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AbilitiesStep } from '@/components/character-builder/AbilitiesStep';
import type { ResolvedCharacter } from '@/types/resolved';
import type { BuildLevelRow, CreationRow } from '@/lib/build-reconstruction';
import type { GrantBundle } from '@/types/sources';
import type { ChoiceKey } from '@/types/choices';

// ---------------------------------------------------------------------------
// react-i18next mock
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const segments = key.split('.');
      const base = segments[segments.length - 1];
      if (opts && 'defaultValue' in opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
      if (opts && 'ability' in opts) return `${base}:${String(opts.ability)}`;
      if (opts && 'count' in opts) return `${base}:${String(opts.count)}`;
      return base;
    },
    i18n: { language: 'en' },
    ns,
  }),
}));

// ---------------------------------------------------------------------------
// Mock useCharacterContext
// ---------------------------------------------------------------------------

let contextRows: readonly BuildLevelRow[];
let contextResolved: Partial<ResolvedCharacter> | null;
let contextBundles: readonly GrantBundle[];
let contextBuildChoices: Record<string, unknown>;

const mockMakeChoice = vi.fn();
const mockClearChoice = vi.fn();

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => ({
    character: { species: null, class: null },
    rows: contextRows,
    build: { choices: contextBuildChoices },
    bundles: contextBundles,
    resolved: contextResolved,
    updateCharacter: vi.fn(),
    updateCreation: vi.fn(),
    levelUp: vi.fn(),
    levelDown: vi.fn(),
    undoLevelDown: vi.fn(),
    replaceLevel: vi.fn(),
    makeChoice: mockMakeChoice,
    clearChoice: mockClearChoice,
    markSaved: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCreationRow(): CreationRow {
  return {
    sequence: 0,
    base_abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    ability_method: 'standard-array',
    choices: {},
    deleted_at: null,
  };
}

function makeResolvedWithBackgroundBonus(
  ability: keyof ResolvedCharacter['abilities'],
  bonus: number
): Partial<ResolvedCharacter> {
  const defaultAbility = { base: 10, bonuses: [], total: 10, modifier: 0 };
  return {
    abilities: {
      str: { ...defaultAbility },
      dex: { ...defaultAbility },
      con: { ...defaultAbility },
      int: { ...defaultAbility },
      wis: { ...defaultAbility },
      cha: { ...defaultAbility },
      [ability]: {
        ...defaultAbility,
        total: 10 + bonus,
        bonuses: [{ value: bonus, source: { origin: 'background', id: 'acolyte' } }],
      },
    } as ResolvedCharacter['abilities'],
  };
}

function resetContext() {
  contextRows = [buildCreationRow()];
  contextResolved = null;
  contextBundles = [];
  contextBuildChoices = {};
}

const ACOLYTE_ASI_KEY = 'asi:background:acolyte:0' as ChoiceKey;

function makeAcolyteAsiBundle(): GrantBundle {
  return {
    source: { origin: 'background', id: 'acolyte' },
    grants: [
      {
        type: 'asi',
        key: ACOLYTE_ASI_KEY,
        points: 3,
        from: ['int', 'wis', 'cha'],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AbilitiesStep', () => {
  beforeEach(() => {
    resetContext();
    vi.clearAllMocks();
  });

  it('renders the three method tabs (Standard Array, Point-Buy, Rolling)', () => {
    render(<AbilitiesStep />);

    expect(screen.getByText('standardArray')).toBeTruthy();
    expect(screen.getByText('pointBuy')).toBeTruthy();
    expect(screen.getByText('rolling')).toBeTruthy();
  });

  it('shows background bonus badge on int when resolved.abilities.int has a background bonus', () => {
    contextResolved = makeResolvedWithBackgroundBonus('int', 1);

    render(<AbilitiesStep />);

    // Badge renders "+1 backgroundBonusSuffix" — "backgroundBonusSuffix" is the i18n mock output
    expect(screen.getByText('+1 backgroundBonusSuffix')).toBeTruthy();
  });

  it('does not show background bonus badge when resolved is null', () => {
    contextResolved = null;

    render(<AbilitiesStep />);

    expect(screen.queryByText(/backgroundBonusSuffix/)).toBeNull();
  });

  it('does not render +/- increment/decrement buttons on individual ability rows in Standard Array tab', () => {
    render(<AbilitiesStep />);

    // Standard Array tab is default — ability adjustments use Select, not ChevronUp/Down buttons
    // Point-Buy buttons only appear in the point-buy tab (not rendered when standard-array is active)
    const buttons = screen.queryAllByRole('button');
    // Only "Roll Scores"-type buttons exist; no per-ability +/- buttons in standard-array view
    // Background ASI inc/dec buttons use aria-label, not title — exclude them with the title filter
    const incDecButtons = buttons.filter(
      (b) =>
        b.getAttribute('title')?.toLowerCase().includes('increase') ||
        b.getAttribute('title')?.toLowerCase().includes('decrease')
    );
    expect(incDecButtons).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Background ASI (moved here from OriginStep)
  // ---------------------------------------------------------------------------

  it('renders the Background ASI banner only when a background ASI grant is present', () => {
    contextBundles = [];
    const { rerender } = render(<AbilitiesStep />);
    expect(screen.queryByText('backgroundAsiLabel')).toBeNull();

    contextBundles = [makeAcolyteAsiBundle()];
    rerender(<AbilitiesStep />);
    expect(screen.getByText('backgroundAsiLabel')).toBeTruthy();
  });

  it('shows a +/- pair for each eligible ability (from the ASI grant)', () => {
    contextBundles = [makeAcolyteAsiBundle()];

    render(<AbilitiesStep />);

    // 'int', 'wis', 'cha' — three eligible abilities → three inc and three dec buttons
    ['int', 'wis', 'cha'].forEach((a) => {
      expect(screen.getByRole('button', { name: `increaseAbility:${a}` })).toBeTruthy();
      expect(screen.getByRole('button', { name: `decreaseAbility:${a}` })).toBeTruthy();
    });
    // 'str', 'dex', 'con' — not eligible, no ASI buttons
    ['str', 'dex', 'con'].forEach((a) => {
      expect(screen.queryByRole('button', { name: `increaseAbility:${a}` })).toBeNull();
    });
  });

  it('clicking increment commits a +1 allocation via makeChoice', () => {
    contextBundles = [makeAcolyteAsiBundle()];

    render(<AbilitiesStep />);

    fireEvent.click(screen.getByRole('button', { name: 'increaseAbility:int' }));

    expect(mockMakeChoice).toHaveBeenCalledWith(
      ACOLYTE_ASI_KEY,
      expect.objectContaining({ type: 'asi', allocation: expect.objectContaining({ int: 1 }) })
    );
  });

  it('disables increment once 3 total points are allocated', () => {
    contextBundles = [makeAcolyteAsiBundle()];
    contextBuildChoices = { [ACOLYTE_ASI_KEY]: { type: 'asi', allocation: { int: 2, wis: 1 } } };

    render(<AbilitiesStep />);

    ['int', 'wis', 'cha'].forEach((a) => {
      const btn = screen.getByRole('button', { name: `increaseAbility:${a}` }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  it('disables increment on an ability already at +2 (per-ability cap)', () => {
    contextBundles = [makeAcolyteAsiBundle()];
    contextBuildChoices = { [ACOLYTE_ASI_KEY]: { type: 'asi', allocation: { int: 2 } } };

    render(<AbilitiesStep />);

    const intInc = screen.getByRole('button', { name: 'increaseAbility:int' }) as HTMLButtonElement;
    expect(intInc.disabled).toBe(true);
    // wis still has room (1 point remaining, currently 0)
    const wisInc = screen.getByRole('button', { name: 'increaseAbility:wis' }) as HTMLButtonElement;
    expect(wisInc.disabled).toBe(false);
  });

  it('allows three different abilities at +1 each (no mode toggle required)', () => {
    contextBundles = [makeAcolyteAsiBundle()];
    contextBuildChoices = { [ACOLYTE_ASI_KEY]: { type: 'asi', allocation: { int: 1, wis: 1 } } };

    render(<AbilitiesStep />);

    // Third distinct ability (cha) should be reachable — no +2/+1 mode restricting to 2 distinct
    const chaInc = screen.getByRole('button', { name: 'increaseAbility:cha' }) as HTMLButtonElement;
    expect(chaInc.disabled).toBe(false);
  });
});
