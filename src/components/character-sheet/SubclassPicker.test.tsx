import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubclassPicker } from '@/components/character-sheet/SubclassPicker';
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses';
import type { PendingChoice } from '@/types/resolved';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';

// Mirror the mock pattern used in the rest of the character-sheet test suite.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const FIGHTER_SOURCE = { origin: 'class' as const, id: 'fighter' as const, level: 3 };

const SUBCLASS_CHOICE: Extract<PendingChoice, { type: 'subclass' }> = {
  type: 'subclass',
  choiceKey: 'subclass:class:fighter:0' as ChoiceKey,
  source: FIGHTER_SOURCE,
  classId: 'fighter',
};

// ---------------------------------------------------------------------------
// SubclassPicker — no-data-loss: kept subclass with disabled book
// ---------------------------------------------------------------------------

describe('SubclassPicker — disabled-book kept subclass (no-data-loss)', () => {
  it('renders the current subclass even when its book is excluded from allowedSubclasses', () => {
    // champion is current; allowedSubclasses only contains battlemaster (champion excluded)
    const allowedSubclasses = { battlemaster: SUBCLASS_SOURCES.battlemaster };
    const currentDecision: ChoiceDecision = { type: 'subclass', subclassId: 'champion' };

    render(
      <SubclassPicker
        choice={SUBCLASS_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        allowedSubclasses={allowedSubclasses}
      />
    );

    // champion should render — the t() mock returns the full key, so look for the key
    expect(screen.getByText('subclasses.champion.name')).toBeTruthy();
  });

  it('does not crash when the kept subclass is selected (features.flatMap path executes)', () => {
    // This is the exact crash path: existingSubclassId === 'champion', selected === 'champion',
    // allowedSubclasses excludes champion → old code did sourceMap['champion'] = undefined →
    // { id, ...undefined } = { id } → sc.features.flatMap throws.
    const allowedSubclasses = { battlemaster: SUBCLASS_SOURCES.battlemaster };
    const currentDecision: ChoiceDecision = { type: 'subclass', subclassId: 'champion' };

    // Should NOT throw; champion's features must render (features list has content)
    expect(() =>
      render(
        <SubclassPicker
          choice={SUBCLASS_CHOICE}
          currentDecision={currentDecision}
          onDecide={vi.fn()}
          allowedSubclasses={allowedSubclasses}
        />
      )
    ).not.toThrow();

    // The selected button expands features — verify at least one feature <li> renders
    const featureItems = document.querySelectorAll('ul li');
    expect(featureItems.length).toBeGreaterThan(0);
  });

  it('shows the disabled-book badge next to the kept-but-excluded subclass', () => {
    const allowedSubclasses = { battlemaster: SUBCLASS_SOURCES.battlemaster };
    const currentDecision: ChoiceDecision = { type: 'subclass', subclassId: 'champion' };

    render(
      <SubclassPicker
        choice={SUBCLASS_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        allowedSubclasses={allowedSubclasses}
      />
    );

    // The badge text is the last segment of characterBuilder.hints.disabledSourceBook
    // which the mock returns as the full key
    expect(screen.getByText('characterBuilder.hints.disabledSourceBook')).toBeTruthy();
  });

  it('does NOT show the disabled-book badge for allowed subclasses', () => {
    const allowedSubclasses = { battlemaster: SUBCLASS_SOURCES.battlemaster };
    const currentDecision: ChoiceDecision = { type: 'subclass', subclassId: 'battlemaster' };

    render(
      <SubclassPicker
        choice={SUBCLASS_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        allowedSubclasses={allowedSubclasses}
      />
    );

    expect(screen.queryByText('characterBuilder.hints.disabledSourceBook')).toBeNull();
  });

  it('does NOT render a subclass that is excluded AND not the current selection', () => {
    // eldritchknight is excluded and not selected; it should be absent
    const allowedSubclasses = { battlemaster: SUBCLASS_SOURCES.battlemaster };
    const currentDecision: ChoiceDecision = { type: 'subclass', subclassId: 'champion' };

    render(
      <SubclassPicker
        choice={SUBCLASS_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        allowedSubclasses={allowedSubclasses}
      />
    );

    expect(screen.queryByText('subclasses.eldritchknight.name')).toBeNull();
    expect(screen.queryByText('subclasses.psiwarrior.name')).toBeNull();
  });
});
