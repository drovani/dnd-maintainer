import { describe, it, expect } from 'vitest';
import { CharacterBuildSchema, CharacterBuildSchemaStrict, ChoiceDecisionSchema } from '@/lib/schemas/character-build';

const validBuild = {
  raceId: 'human',
  backgroundId: 'soldier',
  baseAbilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  abilityMethod: 'standard-array' as const,
  levels: [{ classId: 'fighter', classLevel: 1, hpRoll: null }],
  choices: {},
  feats: [],
  activeItems: [],
};

describe('CharacterBuildSchema', () => {
  it('accepts a valid build', () => {
    const result = CharacterBuildSchema.safeParse(validBuild);
    expect(result.success).toBe(true);
  });

  it('rejects abilities outside 1-30', () => {
    const tooLow = CharacterBuildSchema.safeParse({
      ...validBuild,
      baseAbilities: { ...validBuild.baseAbilities, str: 0 },
    });
    expect(tooLow.success).toBe(false);

    const tooHigh = CharacterBuildSchema.safeParse({
      ...validBuild,
      baseAbilities: { ...validBuild.baseAbilities, str: 31 },
    });
    expect(tooHigh.success).toBe(false);
  });

  it('rejects empty raceId', () => {
    const result = CharacterBuildSchema.safeParse({
      ...validBuild,
      raceId: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid abilityMethod', () => {
    const result = CharacterBuildSchema.safeParse({
      ...validBuild,
      abilityMethod: 'invalid-method',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty build (fresh character with empty arrays)', () => {
    const emptyBuild = {
      raceId: 'human',
      backgroundId: 'soldier',
      baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      abilityMethod: 'standard-array' as const,
      levels: [],
      choices: {},
      feats: [],
      activeItems: [],
    };
    const result = CharacterBuildSchema.safeParse(emptyBuild);
    expect(result.success).toBe(true);
  });
});

describe('ChoiceDecisionSchema', () => {
  describe('expertise-choice', () => {
    it('accepts valid expertise-choice with skill and empty tools', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'expertise-choice',
        skills: ['stealth'],
        tools: [],
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid skill ID', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'expertise-choice',
        skills: ['not-a-skill'],
        tools: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid tool ID', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'expertise-choice',
        skills: [],
        tools: ['not-a-tool'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing tools field', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'expertise-choice',
        skills: [],
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid tool ID', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'expertise-choice',
        skills: [],
        tools: ['thievestools'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('skill-choice', () => {
    it('accepts valid skill-choice', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'skill-choice',
        skills: ['perception', 'stealth'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing skills field', () => {
      const result = ChoiceDecisionSchema.safeParse({ type: 'skill-choice' });
      expect(result.success).toBe(false);
    });
  });

  describe('tool-choice', () => {
    it('accepts valid tool-choice', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'tool-choice',
        tools: ['thievestools'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing tools field', () => {
      const result = ChoiceDecisionSchema.safeParse({ type: 'tool-choice' });
      expect(result.success).toBe(false);
    });
  });

  describe('language-choice', () => {
    it('accepts valid language-choice', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'language-choice',
        languages: ['elvish', 'dwarvish'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing languages field', () => {
      const result = ChoiceDecisionSchema.safeParse({ type: 'language-choice' });
      expect(result.success).toBe(false);
    });
  });

  describe('ability-choice', () => {
    it('accepts valid ability-choice', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'ability-choice',
        abilities: ['str', 'dex'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing abilities field', () => {
      const result = ChoiceDecisionSchema.safeParse({ type: 'ability-choice' });
      expect(result.success).toBe(false);
    });
  });

  describe('fighting-style-choice', () => {
    it('accepts valid fighting-style-choice', () => {
      const result = ChoiceDecisionSchema.safeParse({
        type: 'fighting-style-choice',
        styles: ['defense'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing styles field', () => {
      const result = ChoiceDecisionSchema.safeParse({ type: 'fighting-style-choice' });
      expect(result.success).toBe(false);
    });
  });
});

describe('CharacterBuildSchemaStrict', () => {
  it('rejects non-null hpRoll on first level', () => {
    const result = CharacterBuildSchemaStrict.safeParse({
      ...validBuild,
      levels: [{ classId: 'fighter', classLevel: 1, hpRoll: 10 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('levels[0].hpRoll must be null (level 1 uses max die)');
    }
  });

  it('rejects non-sequential classLevels', () => {
    const result = CharacterBuildSchemaStrict.safeParse({
      ...validBuild,
      levels: [
        { classId: 'fighter', classLevel: 1, hpRoll: null },
        { classId: 'fighter', classLevel: 3, hpRoll: 8 },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('classLevels must be sequential per classId');
    }
  });

  it('accepts valid multi-class build', () => {
    const result = CharacterBuildSchemaStrict.safeParse({
      ...validBuild,
      levels: [
        { classId: 'fighter', classLevel: 1, hpRoll: null },
        { classId: 'fighter', classLevel: 2, hpRoll: 8 },
        { classId: 'rogue', classLevel: 1, hpRoll: 6 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
