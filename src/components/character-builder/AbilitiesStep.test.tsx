import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AbilitiesStep } from '@/components/character-builder/AbilitiesStep';
import type { ResolvedCharacter } from '@/types/resolved';
import type { BuildLevelRow, CreationRow } from '@/lib/build-reconstruction';

// ---------------------------------------------------------------------------
// react-i18next mock
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const segments = key.split('.');
      const base = segments[segments.length - 1];
      if (opts && 'defaultValue' in opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
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

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => ({
    character: { species: null, class: null },
    rows: contextRows,
    build: null,
    bundles: [],
    resolved: contextResolved,
    updateCharacter: vi.fn(),
    updateCreation: vi.fn(),
    levelUp: vi.fn(),
    levelDown: vi.fn(),
    undoLevelDown: vi.fn(),
    replaceLevel: vi.fn(),
    makeChoice: vi.fn(),
    clearChoice: vi.fn(),
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
    const incDecButtons = buttons.filter(
      (b) =>
        b.getAttribute('title')?.toLowerCase().includes('increase') ||
        b.getAttribute('title')?.toLowerCase().includes('decrease')
    );
    expect(incDecButtons).toHaveLength(0);
  });
});
