import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpertiseChoicePicker } from '@/components/character-sheet/ExpertiseChoicePicker';
import type { ResolvedSkill } from '@/types/resolved';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import { DND_SKILLS, type SkillId, type ToolProficiencyId } from '@/lib/dnd-helpers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const last = key.split('.').pop() ?? key;
      if (opts && 'count' in opts) return `${last}:${String(opts.count)}`;
      if (opts && 'source' in opts) return `${last}:${String(opts.source)}`;
      if (opts && 'defaultValue' in opts) return String(opts.defaultValue);
      return last;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/lib/character-builder/choice-source-name', () => ({
  getChoiceSourceName: (key: string) => key,
}));

const mockOnDecide = vi.fn();
const mockOnClear = vi.fn();

const L1_KEY = 'expertise-choice:class:rogue:0' as ChoiceKey;
const L6_KEY = 'expertise-choice:class:rogue:1' as ChoiceKey;

function skillsWithProficient(proficientIds: readonly SkillId[]): Record<SkillId, ResolvedSkill> {
  const result = {} as Record<SkillId, ResolvedSkill>;
  for (const skill of DND_SKILLS) {
    result[skill.id] = {
      ability: skill.ability,
      proficient: proficientIds.includes(skill.id),
      expertise: false,
      bonus: 0,
      breakdown: [],
      sources: [],
    };
  }
  return result;
}

type ExpertiseChoice = Extract<import('@/types/resolved').PendingChoice, { type: 'expertise-choice' }>;

function makeChoice(
  choiceKey: ChoiceKey,
  overrides: Partial<{
    count: number;
    from: readonly SkillId[] | null;
    fromTools: readonly ToolProficiencyId[];
  }> = {}
): ExpertiseChoice {
  return {
    type: 'expertise-choice',
    choiceKey,
    source: { origin: 'class', id: 'rogue', level: 1 },
    count: 2,
    from: null,
    fromTools: ['thievestools'],
    ...overrides,
  };
}

describe('ExpertiseChoicePicker', () => {
  beforeEach(() => {
    mockOnDecide.mockReset();
    mockOnClear.mockReset();
  });

  it('renders skill checkboxes for proficient skills when from is null', () => {
    const resolvedSkills = skillsWithProficient(['stealth', 'sleightofhand']);
    const { container } = render(
      <ExpertiseChoicePicker
        choice={makeChoice(L1_KEY)}
        currentDecision={undefined}
        allDecisions={{}}
        allExpertiseChoiceKeys={[L1_KEY]}
        resolvedSkills={resolvedSkills}
        onDecide={mockOnDecide}
        onClear={mockOnClear}
      />
    );
    expect(container.querySelector(`[id="expertise-${L1_KEY}-skill-stealth"]`)).toBeInTheDocument();
    expect(container.querySelector(`[id="expertise-${L1_KEY}-skill-sleightofhand"]`)).toBeInTheDocument();
    expect(container.querySelector(`[id="expertise-${L1_KEY}-tool-thievestools"]`)).toBeInTheDocument();
  });

  it('calls onDecide with expertise-choice payload when a skill is selected', () => {
    const resolvedSkills = skillsWithProficient(['stealth', 'sleightofhand']);
    const { container } = render(
      <ExpertiseChoicePicker
        choice={makeChoice(L1_KEY)}
        currentDecision={undefined}
        allDecisions={{}}
        allExpertiseChoiceKeys={[L1_KEY]}
        resolvedSkills={resolvedSkills}
        onDecide={mockOnDecide}
        onClear={mockOnClear}
      />
    );
    const checkbox = container.querySelector(`[id="expertise-${L1_KEY}-skill-stealth"]`);
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);
    expect(mockOnDecide).toHaveBeenCalledWith(L1_KEY, {
      type: 'expertise-choice',
      skills: ['stealth'],
      tools: [],
    });
  });

  it('calls onDecide with expertise-choice payload when a tool is selected', () => {
    const resolvedSkills = skillsWithProficient(['stealth']);
    const { container } = render(
      <ExpertiseChoicePicker
        choice={makeChoice(L1_KEY)}
        currentDecision={undefined}
        allDecisions={{}}
        allExpertiseChoiceKeys={[L1_KEY]}
        resolvedSkills={resolvedSkills}
        onDecide={mockOnDecide}
        onClear={mockOnClear}
      />
    );
    const checkbox = container.querySelector(`[id="expertise-${L1_KEY}-tool-thievestools"]`);
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);
    expect(mockOnDecide).toHaveBeenCalledWith(L1_KEY, {
      type: 'expertise-choice',
      skills: [],
      tools: ['thievestools'],
    });
  });

  it('calls onClear when the last selection is removed', () => {
    const resolvedSkills = skillsWithProficient(['stealth']);
    const currentDecision: ChoiceDecision = { type: 'expertise-choice', skills: ['stealth'], tools: [] };
    const { container } = render(
      <ExpertiseChoicePicker
        choice={makeChoice(L1_KEY)}
        currentDecision={currentDecision}
        allDecisions={{ [L1_KEY]: currentDecision } as Record<ChoiceKey, ChoiceDecision>}
        allExpertiseChoiceKeys={[L1_KEY]}
        resolvedSkills={resolvedSkills}
        onDecide={mockOnDecide}
        onClear={mockOnClear}
      />
    );
    const checkbox = container.querySelector(`[id="expertise-${L1_KEY}-skill-stealth"]`);
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);
    expect(mockOnClear).toHaveBeenCalledWith(L1_KEY);
  });

  it('shows empty-pool hint when no proficient skills and no tools', () => {
    const resolvedSkills = skillsWithProficient([]);
    render(
      <ExpertiseChoicePicker
        choice={makeChoice(L1_KEY, { fromTools: [] })}
        currentDecision={undefined}
        allDecisions={{}}
        allExpertiseChoiceKeys={[L1_KEY]}
        resolvedSkills={resolvedSkills}
        onDecide={mockOnDecide}
        onClear={mockOnClear}
      />
    );
    expect(screen.getByText(/expertiseEmptyPool/)).toBeInTheDocument();
  });

  it('cross-choice dedupe at L6: skill chosen in L1 picker is disabled in L6 picker', () => {
    const resolvedSkills = skillsWithProficient(['stealth', 'sleightofhand', 'perception']);
    const l1Decision: ChoiceDecision = { type: 'expertise-choice', skills: ['stealth', 'sleightofhand'], tools: [] };
    const allDecisions = { [L1_KEY]: l1Decision } as Record<ChoiceKey, ChoiceDecision>;

    const { container } = render(
      <ExpertiseChoicePicker
        choice={makeChoice(L6_KEY, { from: null, fromTools: [] })}
        currentDecision={undefined}
        allDecisions={allDecisions}
        allExpertiseChoiceKeys={[L1_KEY, L6_KEY]}
        resolvedSkills={resolvedSkills}
        onDecide={mockOnDecide}
        onClear={mockOnClear}
      />
    );

    // stealth and sleightofhand are claimed by L1 — should be disabled in L6 picker
    const stealthCheckbox = container.querySelector(
      `[id="expertise-${L6_KEY}-skill-stealth"]`
    ) as HTMLInputElement | null;
    expect(stealthCheckbox).toBeInTheDocument();
    expect(stealthCheckbox?.disabled).toBe(true);

    const sleightCheckbox = container.querySelector(
      `[id="expertise-${L6_KEY}-skill-sleightofhand"]`
    ) as HTMLInputElement | null;
    expect(sleightCheckbox).toBeInTheDocument();
    expect(sleightCheckbox?.disabled).toBe(true);

    // perception is free — should be enabled in L6 picker
    const perceptionCheckbox = container.querySelector(
      `[id="expertise-${L6_KEY}-skill-perception"]`
    ) as HTMLInputElement | null;
    expect(perceptionCheckbox).toBeInTheDocument();
    expect(perceptionCheckbox?.disabled).toBe(false);
  });

  it('cross-choice dedupe: L1 picker is unaffected by L6 decisions', () => {
    const resolvedSkills = skillsWithProficient(['stealth', 'sleightofhand', 'perception']);
    const l6Decision: ChoiceDecision = { type: 'expertise-choice', skills: ['perception'], tools: [] };
    const allDecisions = { [L6_KEY]: l6Decision } as Record<ChoiceKey, ChoiceDecision>;

    const { container } = render(
      <ExpertiseChoicePicker
        choice={makeChoice(L1_KEY, { from: null, fromTools: [] })}
        currentDecision={undefined}
        allDecisions={allDecisions}
        allExpertiseChoiceKeys={[L1_KEY, L6_KEY]}
        resolvedSkills={resolvedSkills}
        onDecide={mockOnDecide}
        onClear={mockOnClear}
      />
    );

    // perception is claimed by L6 — disabled in L1 picker
    const perceptionCheckbox = container.querySelector(
      `[id="expertise-${L1_KEY}-skill-perception"]`
    ) as HTMLInputElement | null;
    expect(perceptionCheckbox?.disabled).toBe(true);

    // stealth is free
    const stealthCheckbox = container.querySelector(
      `[id="expertise-${L1_KEY}-skill-stealth"]`
    ) as HTMLInputElement | null;
    expect(stealthCheckbox?.disabled).toBe(false);
  });
});
