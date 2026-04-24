import { describe, it, expect } from 'vitest';
import { getSubclassSource } from '@/lib/sources';
import type { SubclassId } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';

describe('getSubclassSource — Champion', () => {
  it('returns defined for champion', () => {
    expect(getSubclassSource('champion')).toBeDefined();
  });

  it('champion has classId fighter', () => {
    const source = getSubclassSource('champion');
    expect(source?.classId).toBe('fighter');
  });

  it('champion has 5 features', () => {
    const source = getSubclassSource('champion');
    expect(source?.features).toHaveLength(5);
  });

  it('champion level 3 feature grants champion-improved-critical', () => {
    const source = getSubclassSource('champion');
    const level3Feature = source?.features.find((f) => f.classLevel === 3);
    expect(level3Feature).toBeDefined();
    expect(level3Feature?.grants).toHaveLength(1);
    const grant = level3Feature?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('champion-improved-critical');
    }
  });

  it('champion level 7 feature grants remarkable athlete with ability-check-bonus', () => {
    const source = getSubclassSource('champion');
    const level7Feature = source?.features.find((f) => f.classLevel === 7);
    expect(level7Feature).toBeDefined();
    expect(level7Feature?.grants).toHaveLength(2);
    expect(level7Feature?.grants[0]).toMatchObject({ type: 'feature', feature: { id: 'champion-remarkable-athlete' } });
    expect(level7Feature?.grants[1]).toMatchObject({
      type: 'ability-check-bonus',
      abilities: ['str', 'dex', 'con'],
      value: 'half-proficiency',
      onlyWhenNotProficient: true,
      featureId: 'champion-remarkable-athlete',
    });
  });

  it('champion level 10 grants a fighting-style-choice', () => {
    const source = getSubclassSource('champion');
    const level10Feature = source?.features.find((f) => f.classLevel === 10);
    expect(level10Feature).toBeDefined();
    expect(level10Feature?.grants).toHaveLength(1);
    const grant = level10Feature?.grants[0];
    expect(grant?.type).toBe('fighting-style-choice');
  });

  it('champion feature classLevels are 3, 7, 10, 15, 18', () => {
    const source = getSubclassSource('champion');
    const levels = source?.features.map((f) => f.classLevel);
    expect(levels).toEqual([3, 7, 10, 15, 18]);
  });
});

describe('getSubclassSource — unknown', () => {
  it('returns undefined for unknown subclass', () => {
    expect(getSubclassSource('unknown-subclass' as SubclassId)).toBeUndefined();
  });
});

describe('getSubclassSource — Berserker', () => {
  it('returns defined for berserker', () => {
    expect(getSubclassSource('berserker')).toBeDefined();
  });

  it('berserker has classId barbarian', () => {
    expect(getSubclassSource('berserker')?.classId).toBe('barbarian');
  });

  it('berserker has 3 features at levels 3, 6, 10', () => {
    const source = getSubclassSource('berserker');
    expect(source?.features).toHaveLength(3);
    const levels = source?.features.map((f) => f.classLevel);
    expect(levels).toEqual([3, 6, 10]);
  });

  it('berserker level 3 grants berserker-frenzy', () => {
    const level3 = getSubclassSource('berserker')?.features.find((f) => f.classLevel === 3);
    expect(level3?.grants).toHaveLength(1);
    const grant = level3?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('berserker-frenzy');
    }
  });

  it('berserker level 6 grants berserker-mindless-rage', () => {
    const level6 = getSubclassSource('berserker')?.features.find((f) => f.classLevel === 6);
    const grant = level6?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('berserker-mindless-rage');
    }
  });

  it('berserker level 10 grants berserker-intimidating-presence', () => {
    const level10 = getSubclassSource('berserker')?.features.find((f) => f.classLevel === 10);
    const grant = level10?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('berserker-intimidating-presence');
    }
  });
});

describe('getSubclassSource — Totem Warrior', () => {
  it('returns defined for totemwarrior', () => {
    expect(getSubclassSource('totemwarrior')).toBeDefined();
  });

  it('totemwarrior has classId barbarian', () => {
    expect(getSubclassSource('totemwarrior')?.classId).toBe('barbarian');
  });

  it('totemwarrior has 3 features at levels 3, 6, 10', () => {
    const source = getSubclassSource('totemwarrior');
    expect(source?.features).toHaveLength(3);
    const levels = source?.features.map((f) => f.classLevel);
    expect(levels).toEqual([3, 6, 10]);
  });

  it('totemwarrior level 3 includes spirit-seeker feature AND totem-animal-choice at index 0', () => {
    const level3 = getSubclassSource('totemwarrior')?.features.find((f) => f.classLevel === 3);
    expect(level3?.grants).toHaveLength(2);

    const featureGrant = level3?.grants.find((g) => g.type === 'feature');
    expect(featureGrant?.type).toBe('feature');
    if (featureGrant?.type === 'feature') {
      expect(featureGrant.feature.id).toBe('totemwarrior-spirit-seeker');
    }

    const totemGrant = level3?.grants.find((g) => g.type === 'totem-animal-choice');
    expect(totemGrant?.type).toBe('totem-animal-choice');
    if (totemGrant?.type === 'totem-animal-choice') {
      expect(totemGrant.featureIdPrefix).toBe('totemwarrior-totem-spirit');
      expect(totemGrant.key).toBe(createChoiceKey('totem-animal-choice', 'class', 'barbarian', 0));
    }
  });

  it('totemwarrior level 6 has totem-animal-choice at index 1 with distinct prefix', () => {
    const level6 = getSubclassSource('totemwarrior')?.features.find((f) => f.classLevel === 6);
    expect(level6?.grants).toHaveLength(1);

    const totemGrant = level6?.grants[0];
    expect(totemGrant?.type).toBe('totem-animal-choice');
    if (totemGrant?.type === 'totem-animal-choice') {
      expect(totemGrant.featureIdPrefix).toBe('totemwarrior-aspect-of-the-beast');
      expect(totemGrant.key).toBe(createChoiceKey('totem-animal-choice', 'class', 'barbarian', 1));
    }
  });

  it('totemwarrior level 6 choice key index (1) is distinct from level 3 index (0)', () => {
    const level3Grant = getSubclassSource('totemwarrior')
      ?.features.find((f) => f.classLevel === 3)
      ?.grants.find((g) => g.type === 'totem-animal-choice');
    const level6Grant = getSubclassSource('totemwarrior')
      ?.features.find((f) => f.classLevel === 6)
      ?.grants.find((g) => g.type === 'totem-animal-choice');

    expect(level3Grant?.type === 'totem-animal-choice' && level3Grant.key).not.toBe(
      level6Grant?.type === 'totem-animal-choice' && level6Grant.key
    );
  });

  it('totemwarrior level 10 grants totemwarrior-spirit-walker', () => {
    const level10 = getSubclassSource('totemwarrior')?.features.find((f) => f.classLevel === 10);
    expect(level10?.grants).toHaveLength(1);
    const grant = level10?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('totemwarrior-spirit-walker');
    }
  });
});
