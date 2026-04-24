import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillsStep } from '@/components/character-builder/SkillsStep';
import type { ResolvedCharacter, ResolvedSkill } from '@/types/resolved';
import type { CharacterBuild, ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { GrantBundle } from '@/types/sources';
import { DND_SKILLS, type SkillId } from '@/lib/dnd-helpers';

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

const EXPERTISE_KEY = 'expertise-choice:class:rogue:0' as ChoiceKey;
const EXPERTISE_KEY_L6 = 'expertise-choice:class:rogue:1' as ChoiceKey;

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

function rogueExpertiseBundle(): GrantBundle {
  return {
    source: { origin: 'class', id: 'rogue', level: 1 },
    grants: [
      {
        type: 'expertise-choice',
        key: EXPERTISE_KEY,
        count: 2,
        from: null,
        fromTools: ['thievestools'],
      },
    ],
  };
}

describe('SkillsStep expertise-choice', () => {
  beforeEach(() => {
    mockMakeChoice.mockReset();
    mockClearChoice.mockReset();
    mockContextValue = {
      bundles: [rogueExpertiseBundle()],
      resolved: {
        skills: skillsWithProficient(['stealth', 'sleightofhand']),
      } as Partial<ResolvedCharacter>,
      build: { choices: {} },
      makeChoice: mockMakeChoice,
      clearChoice: mockClearChoice,
    };
  });

  it('renders eligible proficient skills and fromTools as checkboxes', () => {
    const { container } = render(<SkillsStep />);
    expect(container.querySelector(`[id="expertise-${EXPERTISE_KEY}-skill-stealth"]`)).toBeInTheDocument();
    expect(container.querySelector(`[id="expertise-${EXPERTISE_KEY}-skill-sleightofhand"]`)).toBeInTheDocument();
    expect(container.querySelector(`[id="expertise-${EXPERTISE_KEY}-tool-thievestools"]`)).toBeInTheDocument();
  });

  it('commits expertise-choice decision with selected skill on toggle', () => {
    const { container } = render(<SkillsStep />);
    const checkbox = container.querySelector(`[id="expertise-${EXPERTISE_KEY}-skill-stealth"]`);
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);
    expect(mockMakeChoice).toHaveBeenCalledWith(EXPERTISE_KEY, {
      type: 'expertise-choice',
      skills: ['stealth'],
      tools: [],
    });
  });

  it('includes tools field when a tool is selected', () => {
    const { container } = render(<SkillsStep />);
    const checkbox = container.querySelector(`[id="expertise-${EXPERTISE_KEY}-tool-thievestools"]`);
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);
    expect(mockMakeChoice).toHaveBeenCalledWith(EXPERTISE_KEY, {
      type: 'expertise-choice',
      skills: [],
      tools: ['thievestools'],
    });
  });

  it('shows empty-pool hint when no proficient skills and no tools', () => {
    mockContextValue.resolved = {
      skills: skillsWithProficient([]),
    } as Partial<ResolvedCharacter>;
    mockContextValue.bundles = [
      {
        source: { origin: 'class', id: 'rogue', level: 1 },
        grants: [
          {
            type: 'expertise-choice',
            key: EXPERTISE_KEY,
            count: 2,
            from: null,
            fromTools: [],
          },
        ],
      },
    ];
    render(<SkillsStep />);
    expect(screen.getByText(/expertiseEmptyPool/)).toBeInTheDocument();
  });

  it('clears the choice when the last selection is removed', () => {
    const decision: ChoiceDecision = { type: 'expertise-choice', skills: ['stealth'], tools: [] };
    mockContextValue.build = {
      choices: { [EXPERTISE_KEY]: decision } as Record<ChoiceKey, ChoiceDecision>,
    };
    const { container } = render(<SkillsStep />);
    const checkbox = container.querySelector(`[id="expertise-${EXPERTISE_KEY}-skill-stealth"]`);
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);
    expect(mockClearChoice).toHaveBeenCalledWith(EXPERTISE_KEY);
  });

  it('cross-choice dedupe: skills chosen in L1 grant are disabled in L6 grant picker', () => {
    // Add a second expertise-choice bundle (simulating rogue L6)
    const l6Bundle: GrantBundle = {
      source: { origin: 'class', id: 'rogue', level: 6 },
      grants: [
        {
          type: 'expertise-choice',
          key: EXPERTISE_KEY_L6,
          count: 2,
          from: null,
          fromTools: [],
        },
      ],
    };
    mockContextValue.bundles = [rogueExpertiseBundle(), l6Bundle];
    mockContextValue.resolved = {
      skills: skillsWithProficient(['stealth', 'sleightofhand', 'perception']),
    } as Partial<ResolvedCharacter>;
    // L1 already resolved with stealth + sleightofhand
    const l1Decision: ChoiceDecision = { type: 'expertise-choice', skills: ['stealth', 'sleightofhand'], tools: [] };
    mockContextValue.build = {
      choices: { [EXPERTISE_KEY]: l1Decision } as Record<ChoiceKey, ChoiceDecision>,
    };

    const { container } = render(<SkillsStep />);

    // stealth and sleightofhand should be disabled in L6 picker
    const stealthL6 = container.querySelector(
      `[id="expertise-${EXPERTISE_KEY_L6}-skill-stealth"]`
    ) as HTMLInputElement | null;
    expect(stealthL6).toBeInTheDocument();
    expect(stealthL6?.disabled).toBe(true);

    const sleightL6 = container.querySelector(
      `[id="expertise-${EXPERTISE_KEY_L6}-skill-sleightofhand"]`
    ) as HTMLInputElement | null;
    expect(sleightL6).toBeInTheDocument();
    expect(sleightL6?.disabled).toBe(true);

    // perception is free in L6 picker
    const perceptionL6 = container.querySelector(
      `[id="expertise-${EXPERTISE_KEY_L6}-skill-perception"]`
    ) as HTMLInputElement | null;
    expect(perceptionL6).toBeInTheDocument();
    expect(perceptionL6?.disabled).toBe(false);
  });
});
