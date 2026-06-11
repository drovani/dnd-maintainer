/* eslint-disable i18next/no-literal-string */
import { LevelUpDialog } from '@/components/character-sheet/LevelUpDialog';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { LevelGrantPreview } from '@/lib/sources/level-grants';
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; [k: string]: unknown }) => {
      const segments = key.split('.');
      return opts?.defaultValue ?? segments[segments.length - 1];
    },
  }),
}));

vi.mock('@/lib/sources/level-grants', () => ({
  getGrantsForLevel: vi.fn(),
}));

vi.mock('@/lib/use-all-choice-grants', () => ({
  collectChoiceGrantsFromGrants: vi.fn(),
}));

vi.mock('@/components/character-sheet/AsiOrFeatPicker', () => ({
  AsiOrFeatPicker: ({
    onDecide,
    asiChoice,
  }: {
    asiChoice: { choiceKey: ChoiceKey };
    featChoice: { choiceKey: ChoiceKey };
    onDecide: (key: ChoiceKey, d: ChoiceDecision) => void;
    onClear: (key: ChoiceKey) => void;
  }) => (
    <div data-testid="asi-or-feat-picker">
      <button onClick={() => onDecide(asiChoice.choiceKey, { type: 'asi', allocation: { str: 2 } })}>
        Allocate ASI
      </button>
    </div>
  ),
}));

vi.mock('@/components/character-builder/ChoicePicker', () => ({
  ChoicePicker: ({
    choice,
    onDecide,
  }: {
    choice: { choiceKey: ChoiceKey; type: string; count?: number };
    onDecide: (key: ChoiceKey, d: ChoiceDecision) => void;
  }) => (
    <div data-testid={`choice-picker-${choice.type}`}>
      <button
        onClick={() => {
          if (choice.type === 'spell-choice') {
            onDecide(choice.choiceKey, {
              type: 'spell-choice',
              spellIds: ['fireball' as const],
            });
          } else if (choice.type === 'weapon-mastery-choice') {
            onDecide(choice.choiceKey, {
              type: 'weapon-mastery-choice',
              weaponIds: ['longsword'],
            });
          }
        }}
      >
        Satisfy {choice.type}
      </button>
    </div>
  ),
}));

import { getGrantsForLevel } from '@/lib/sources/level-grants';
import { collectChoiceGrantsFromGrants } from '@/lib/use-all-choice-grants';

const mockGetGrantsForLevel = vi.mocked(getGrantsForLevel);
const mockCollectChoiceGrants = vi.mocked(collectChoiceGrantsFromGrants);

const EMPTY_PREVIEW: LevelGrantPreview = { classGrants: [], subclassGrants: [] };
const MOCK_ABILITIES = {} as ResolvedCharacter['abilities'];

const BASE_PROPS = {
  open: true,
  onOpenChange: vi.fn(),
  onConfirm: vi.fn(),
  hitDie: 10,
  className: 'Fighter',
  targetLevel: 4,
  classId: 'fighter' as const,
  currentSubclassId: null,
  currentAbilities: MOCK_ABILITIES,
  alreadyChosenStyles: [] as const,
  resolvedWeaponProficiencies: [] as const,
  resolvedSkills: null,
  allDecisions: {} as Readonly<Record<ChoiceKey, ChoiceDecision>>,
};

describe('LevelUpDialog', () => {
  beforeEach(() => {
    mockGetGrantsForLevel.mockReturnValue(EMPTY_PREVIEW);
    mockCollectChoiceGrants.mockReturnValue([]);
  });

  it('renders with no choices and Confirm enabled when HP defaults to average', () => {
    render(<LevelUpDialog {...BASE_PROPS} />);
    const confirmBtn = screen.getByText('confirmLevelUp');
    // HP defaults to average, no choices to make — confirm should be enabled
    expect(confirmBtn).not.toBeDisabled();
  });

  it('Confirm is DISABLED when a weapon-mastery choice is unsatisfied', () => {
    const weaponMasteryChoice: PendingChoice = {
      type: 'weapon-mastery-choice',
      choiceKey: 'weapon-mastery-choice:class:fighter:0' as ChoiceKey,
      source: { origin: 'class', id: 'fighter' as const, level: 4 },
      count: 1,
      from: ['longsword', 'shortsword'],
      alreadyChosen: [],
    };
    mockCollectChoiceGrants.mockReturnValue([weaponMasteryChoice]);
    render(<LevelUpDialog {...BASE_PROPS} />);
    const confirmBtn = screen.getByText('confirmLevelUp');
    expect(confirmBtn).toBeDisabled();
  });

  it('Confirm is ENABLED once weapon-mastery choice is satisfied and HP is chosen', () => {
    const weaponMasteryChoice: PendingChoice = {
      type: 'weapon-mastery-choice',
      choiceKey: 'weapon-mastery-choice:class:fighter:0' as ChoiceKey,
      source: { origin: 'class', id: 'fighter' as const, level: 4 },
      count: 1,
      from: ['longsword', 'shortsword'],
      alreadyChosen: [],
    };
    mockCollectChoiceGrants.mockReturnValue([weaponMasteryChoice]);
    render(<LevelUpDialog {...BASE_PROPS} />);

    fireEvent.click(screen.getByText('Satisfy weapon-mastery-choice'));
    const confirmBtn = screen.getByText('confirmLevelUp');
    expect(confirmBtn).not.toBeDisabled();
  });

  it('Confirm is DISABLED at ASI level until either ASI allocation or feat is chosen', () => {
    const asiChoice: PendingChoice = {
      type: 'asi',
      choiceKey: 'asi:class:fighter:3' as ChoiceKey,
      source: { origin: 'class', id: 'fighter' as const, level: 4 },
      points: 2,
      from: null,
    };
    const featChoice: PendingChoice = {
      type: 'feat-choice',
      choiceKey: 'feat-choice:class:fighter:3' as ChoiceKey,
      source: { origin: 'class', id: 'fighter' as const, level: 4 },
      from: null,
      category: 'general' as const,
    };
    mockCollectChoiceGrants.mockReturnValue([asiChoice, featChoice]);
    render(<LevelUpDialog {...BASE_PROPS} />);
    const confirmBtn = screen.getByText('confirmLevelUp');
    expect(confirmBtn).toBeDisabled();
  });

  it('Confirm is ENABLED once ASI is allocated at ASI level', () => {
    const asiChoice: PendingChoice = {
      type: 'asi',
      choiceKey: 'asi:class:fighter:3' as ChoiceKey,
      source: { origin: 'class', id: 'fighter' as const, level: 4 },
      points: 2,
      from: null,
    };
    const featChoice: PendingChoice = {
      type: 'feat-choice',
      choiceKey: 'feat-choice:class:fighter:3' as ChoiceKey,
      source: { origin: 'class', id: 'fighter' as const, level: 4 },
      from: null,
      category: 'general' as const,
    };
    mockCollectChoiceGrants.mockReturnValue([asiChoice, featChoice]);
    render(<LevelUpDialog {...BASE_PROPS} />);

    fireEvent.click(screen.getByText('Allocate ASI'));
    const confirmBtn = screen.getByText('confirmLevelUp');
    // Mock allocates str:2, points=2, so sum===points — gate should pass
    expect(confirmBtn).not.toBeDisabled();
  });

  it('renders a spell picker when a spell-choice is present at this level', () => {
    const spellChoice: PendingChoice = {
      type: 'spell-choice',
      choiceKey: 'spell-choice:class:wizard:0' as ChoiceKey,
      source: { origin: 'class', id: 'wizard' as const, level: 2 },
      count: 2,
      spellList: 'wizard' as const,
      spellLevel: 1,
    };
    mockCollectChoiceGrants.mockReturnValue([spellChoice]);
    render(<LevelUpDialog {...BASE_PROPS} />);
    expect(screen.getByTestId('choice-picker-spell-choice')).toBeInTheDocument();
  });
});
