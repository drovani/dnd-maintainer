/* eslint-disable i18next/no-literal-string */
import { AsiOrFeatPicker } from '@/components/character-sheet/AsiOrFeatPicker';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved';
import type { AbilityKey } from '@/lib/dnd-helpers';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const segments = key.split('.');
      return opts?.defaultValue ?? segments[segments.length - 1];
    },
  }),
}));

// Mock sub-components to avoid deep rendering
vi.mock('@/components/character-sheet/AsiAllocator', () => ({
  AsiAllocator: ({
    onDecide,
    choice,
  }: {
    onDecide: (key: ChoiceKey, alloc: Partial<Record<AbilityKey, number>>) => void;
    choice: { choiceKey: ChoiceKey };
  }) => (
    <div data-testid="asi-allocator">
      <button onClick={() => onDecide(choice.choiceKey, { str: 2 })}>Allocate ASI</button>
    </div>
  ),
}));

vi.mock('@/components/character-builder/ChoicePicker', () => ({
  ChoicePicker: ({
    onDecide,
    choice,
  }: {
    onDecide: (key: ChoiceKey, decision: ChoiceDecision) => void;
    choice: { choiceKey: ChoiceKey };
  }) => (
    <div data-testid="choice-picker">
      <button onClick={() => onDecide(choice.choiceKey, { type: 'feat-choice', featId: 'alert' as const })}>
        Choose Feat
      </button>
    </div>
  ),
}));

const ASI_CHOICE: Extract<PendingChoice, { type: 'asi' }> = {
  type: 'asi',
  choiceKey: 'asi:class:fighter:3' as ChoiceKey,
  source: { origin: 'class', id: 'fighter' as const, level: 4 },
  points: 2,
  from: null,
};

const FEAT_CHOICE: Extract<PendingChoice, { type: 'feat-choice' }> = {
  type: 'feat-choice',
  choiceKey: 'feat-choice:class:fighter:3' as ChoiceKey,
  source: { origin: 'class', id: 'fighter' as const, level: 4 },
  from: null,
  category: 'general' as const,
};

const ABILITIES = {} as ResolvedCharacter['abilities'];

describe('AsiOrFeatPicker', () => {
  it('renders both toggle options', () => {
    render(
      <AsiOrFeatPicker
        asiChoice={ASI_CHOICE}
        featChoice={FEAT_CHOICE}
        abilities={ABILITIES}
        asiDecision={undefined}
        featDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText('chooseAsi')).toBeInTheDocument();
    expect(screen.getByText('chooseFeat')).toBeInTheDocument();
  });

  it('defaults to ASI mode when no decision is set', () => {
    render(
      <AsiOrFeatPicker
        asiChoice={ASI_CHOICE}
        featChoice={FEAT_CHOICE}
        abilities={ABILITIES}
        asiDecision={undefined}
        featDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByTestId('asi-allocator')).toBeInTheDocument();
    expect(screen.queryByTestId('choice-picker')).not.toBeInTheDocument();
  });

  it('shows feat mode when a feat decision is set', () => {
    const featDecision: ChoiceDecision = { type: 'feat-choice', featId: 'alert' as const };
    render(
      <AsiOrFeatPicker
        asiChoice={ASI_CHOICE}
        featChoice={FEAT_CHOICE}
        abilities={ABILITIES}
        asiDecision={undefined}
        featDecision={featDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByTestId('choice-picker')).toBeInTheDocument();
    expect(screen.queryByTestId('asi-allocator')).not.toBeInTheDocument();
  });

  it('switching from ASI to feat calls onClear for the ASI key', () => {
    const onClear = vi.fn();
    render(
      <AsiOrFeatPicker
        asiChoice={ASI_CHOICE}
        featChoice={FEAT_CHOICE}
        abilities={ABILITIES}
        asiDecision={{ type: 'asi', allocation: { str: 2 } }}
        featDecision={undefined}
        onDecide={vi.fn()}
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByText('chooseFeat'));
    expect(onClear).toHaveBeenCalledWith(ASI_CHOICE.choiceKey);
  });

  it('switching from feat to ASI calls onClear for the feat key', () => {
    const onClear = vi.fn();
    const featDecision: ChoiceDecision = { type: 'feat-choice', featId: 'alert' as const };
    render(
      <AsiOrFeatPicker
        asiChoice={ASI_CHOICE}
        featChoice={FEAT_CHOICE}
        abilities={ABILITIES}
        asiDecision={undefined}
        featDecision={featDecision}
        onDecide={vi.fn()}
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByText('chooseAsi'));
    expect(onClear).toHaveBeenCalledWith(FEAT_CHOICE.choiceKey);
  });

  it('onDecide fires with ASI type when allocating in ASI mode', () => {
    const onDecide = vi.fn();
    render(
      <AsiOrFeatPicker
        asiChoice={ASI_CHOICE}
        featChoice={FEAT_CHOICE}
        abilities={ABILITIES}
        asiDecision={undefined}
        featDecision={undefined}
        onDecide={onDecide}
        onClear={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Allocate ASI'));
    expect(onDecide).toHaveBeenCalledWith(ASI_CHOICE.choiceKey, { type: 'asi', allocation: { str: 2 } });
  });
});
