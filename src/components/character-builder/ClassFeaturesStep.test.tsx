import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassFeaturesStep } from '@/components/character-builder/ClassFeaturesStep';
import type { ResolvedCharacter, ResolvedSpellcasting, ResolvedFeature, PendingChoice } from '@/types/resolved';
import type { CharacterBuild, ChoiceKey } from '@/types/choices';
import type { GrantBundle } from '@/types/sources';

// ---------------------------------------------------------------------------
// i18n mock — returns the last segment of the key so we can assert on it
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const segments = key.split('.');
      // fightingStyles.<id>.name / .description -> "<id>:name" / "<id>:description"
      if (segments[0] === 'fightingStyles' && segments.length === 3) {
        return `${segments[1]}:${segments[2]}`;
      }
      const last = segments[segments.length - 1];
      if (opts && 'count' in opts) return `${last}:${String(opts.count)}`;
      if (opts && 'source' in opts) return `${last}:${String(opts.source)}`;
      return last;
    },
    i18n: { language: 'en' },
  }),
}));

// ---------------------------------------------------------------------------
// Context mock
// ---------------------------------------------------------------------------

const mockMakeChoice = vi.fn();
const mockClearChoice = vi.fn();

let mockContextValue: {
  bundles: readonly GrantBundle[];
  resolved: Partial<ResolvedCharacter> | null;
  build: Pick<CharacterBuild, 'choices'> | null;
  makeChoice: typeof mockMakeChoice;
  clearChoice: typeof mockClearChoice;
};

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => mockContextValue,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIGHTER_CHOICE_KEY = 'fighting-style-choice:class:fighter:0' as ChoiceKey;

function fighterFightingStyleBundle(): GrantBundle {
  return {
    source: { origin: 'class', id: 'fighter', level: 1 },
    grants: [
      {
        type: 'fighting-style-choice',
        key: FIGHTER_CHOICE_KEY,
        count: 1,
        from: ['archery', 'defense', 'dueling'] as const,
      },
    ],
  };
}

function wizardSpellcasting(): ResolvedSpellcasting {
  return {
    ability: 'int',
    spellSaveDC: 13,
    spellAttackBonus: 5,
    cantrips: ['Fire Bolt', 'Mage Hand', 'Prestidigitation'],
    knownSpells: [],
    alwaysPreparedSpells: [],
    slots: [2],
  };
}

// ---------------------------------------------------------------------------
// Additional fixtures
// ---------------------------------------------------------------------------

const ROGUE_SUBCLASS_CHOICE_KEY = 'subclass:class:rogue:0' as ChoiceKey;

function rogueL1Features(): readonly ResolvedFeature[] {
  return [
    {
      feature: { id: 'rogue-sneak-attack' },
      source: { origin: 'class', id: 'rogue', level: 1 },
    },
    {
      feature: { id: 'rogue-thieves-cant' },
      source: { origin: 'class', id: 'rogue', level: 1 },
    },
  ];
}

function rogueSubclassChoice(): Extract<PendingChoice, { type: 'subclass' }> {
  return {
    type: 'subclass',
    choiceKey: ROGUE_SUBCLASS_CHOICE_KEY,
    classId: 'rogue',
    source: { origin: 'class', id: 'rogue', level: 3 },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClassFeaturesStep', () => {
  beforeEach(() => {
    mockContextValue = {
      bundles: [],
      resolved: { spellcasting: null } as Partial<ResolvedCharacter>,
      build: { choices: {} },
      makeChoice: mockMakeChoice,
      clearChoice: mockClearChoice,
    };
  });

  it('renders fighting-style radios from the bundle grant for a Fighter', () => {
    mockContextValue.bundles = [fighterFightingStyleBundle()];

    render(<ClassFeaturesStep />);

    expect(screen.getByText('fightingStyles')).toBeTruthy();
    expect(screen.getByText('archery:name')).toBeTruthy();
    expect(screen.getByText('defense:name')).toBeTruthy();
    expect(screen.getByText('dueling:name')).toBeTruthy();
  });

  it('calls makeChoice with fighting-style-choice decision when a style is selected', () => {
    mockContextValue.bundles = [fighterFightingStyleBundle()];

    render(<ClassFeaturesStep />);

    const defenseRadio = document.getElementById(`fighting-style-${FIGHTER_CHOICE_KEY}-defense`) as HTMLInputElement;
    expect(defenseRadio).toBeTruthy();

    fireEvent.click(defenseRadio);

    expect(mockMakeChoice).toHaveBeenCalledWith(FIGHTER_CHOICE_KEY, {
      type: 'fighting-style-choice',
      styles: ['defense'],
    });
  });

  it('renders cantrips when the resolved character has spellcasting', () => {
    mockContextValue.resolved = {
      spellcasting: wizardSpellcasting(),
    } as Partial<ResolvedCharacter>;

    render(<ClassFeaturesStep />);

    expect(screen.getByText('spellcasting')).toBeTruthy();
    expect(screen.getByText(/Fire Bolt, Mage Hand, Prestidigitation/)).toBeTruthy();
  });

  it('renders fallback when class has no fighting styles and no spellcasting', () => {
    // default context: no bundles, no spellcasting
    render(<ClassFeaturesStep />);

    expect(screen.getByText('noClassChoices')).toBeTruthy();
    expect(screen.queryByText('fightingStyles')).toBeNull();
    expect(screen.queryByText('spellcasting')).toBeNull();
  });

  it('renders both sections when class has fighting styles and spellcasting', () => {
    mockContextValue.bundles = [fighterFightingStyleBundle()];
    mockContextValue.resolved = {
      spellcasting: wizardSpellcasting(),
    } as Partial<ResolvedCharacter>;

    render(<ClassFeaturesStep />);

    expect(screen.getByText('fightingStyles')).toBeTruthy();
    expect(screen.getByText('spellcasting')).toBeTruthy();
    expect(screen.queryByText('noClassChoices')).toBeNull();
  });

  it('renders level-1 class features with name and description', () => {
    mockContextValue.resolved = {
      spellcasting: null,
      features: rogueL1Features(),
      pendingChoices: [],
    } as Partial<ResolvedCharacter>;

    render(<ClassFeaturesStep />);

    // The i18n mock returns the last segment: features.<id>.name -> "name"
    // Both features share the same last segment, so we use getAllByText
    expect(screen.getAllByText('name')).toHaveLength(2);
    // Section heading: last segment of characterBuilder.classFeatures.features -> "features"
    expect(screen.getByText('features')).toBeTruthy();
  });

  it('filters out features not from class L1', () => {
    mockContextValue.resolved = {
      spellcasting: null,
      features: [
        // L1 class feature — should render
        {
          feature: { id: 'rogue-sneak-attack' },
          source: { origin: 'class', id: 'rogue', level: 1 },
        },
        // race feature — should NOT render
        {
          feature: { id: 'darkvision' },
          source: { origin: 'race', id: 'elf-high', level: 0 },
        },
        // class L3 feature — should NOT render
        {
          feature: { id: 'rogue-uncanny-dodge' },
          source: { origin: 'class', id: 'rogue', level: 3 },
        },
      ] as ResolvedFeature[],
      pendingChoices: [],
    } as Partial<ResolvedCharacter>;

    render(<ClassFeaturesStep />);

    // Only one feature list item should appear
    const listItems = document.querySelectorAll('li');
    expect(listItems).toHaveLength(1);
  });

  it('renders SubclassPicker for each pending subclass choice', () => {
    mockContextValue.resolved = {
      spellcasting: null,
      features: [],
      pendingChoices: [rogueSubclassChoice()],
    } as Partial<ResolvedCharacter>;

    render(<ClassFeaturesStep />);

    // The SubclassPicker heading: last segment of characterSheet.subclassPicker.chooseSubclass -> "chooseSubclass"
    expect(screen.getByText('chooseSubclass')).toBeTruthy();
  });

  it('invokes makeChoice with correct payload when a subclass is auto-committed', () => {
    mockContextValue.resolved = {
      spellcasting: null,
      features: [],
      pendingChoices: [rogueSubclassChoice()],
    } as Partial<ResolvedCharacter>;

    render(<ClassFeaturesStep />);

    // SUBCLASS_SOURCES contains thief, assassin, arcanetrickster for rogue.
    // The SubclassPicker renders them as <button> elements. Click the first one.
    const subclassButtons = screen.getAllByRole('button');
    expect(subclassButtons.length).toBeGreaterThan(0);
    fireEvent.click(subclassButtons[0]);

    expect(mockMakeChoice).toHaveBeenCalledWith(
      ROGUE_SUBCLASS_CHOICE_KEY,
      expect.objectContaining({ type: 'subclass', subclassId: expect.any(String) })
    );
  });

  it('hides empty-state when only L1 class features are present', () => {
    mockContextValue.resolved = {
      spellcasting: null,
      features: rogueL1Features(),
      pendingChoices: [],
    } as Partial<ResolvedCharacter>;

    render(<ClassFeaturesStep />);

    expect(screen.queryByText('noClassChoices')).toBeNull();
  });
});
