import { describe, it, expect } from 'vitest';
import { getSubclassSource } from '@/lib/sources';
import type { SubclassId } from '@/types/sources';

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

describe('getSubclassSource — landcircle', () => {
  it('returns defined for landcircle', () => {
    expect(getSubclassSource('landcircle')).toBeDefined();
  });

  it('landcircle has classId druid', () => {
    expect(getSubclassSource('landcircle')?.classId).toBe('druid');
  });

  it('landcircle has 4 features', () => {
    expect(getSubclassSource('landcircle')?.features).toHaveLength(4);
  });

  it('landcircle level 2 grants landcircle-bonus-cantrip and landcircle-natural-recovery features', () => {
    const source = getSubclassSource('landcircle');
    const level2 = source?.features.find((f) => f.classLevel === 2);
    expect(level2).toBeDefined();
    const featureIds = level2?.grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : null));
    expect(featureIds).toContain('landcircle-bonus-cantrip');
    expect(featureIds).toContain('landcircle-natural-recovery');
  });

  it('landcircle level 2 grants a spell-choice with count 1', () => {
    const source = getSubclassSource('landcircle');
    const level2 = source?.features.find((f) => f.classLevel === 2);
    const grant = level2?.grants.find((g) => g.type === 'spell-choice');
    expect(grant).toBeDefined();
    if (grant?.type === 'spell-choice') {
      expect(grant.count).toBe(1);
      expect(grant.maxLevel).toBe(0);
    }
  });

  it('landcircle level 3 grants a land-terrain-choice', () => {
    const source = getSubclassSource('landcircle');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    const grant = level3?.grants.find((g) => g.type === 'land-terrain-choice');
    expect(grant).toBeDefined();
  });

  it('landcircle level 3 grants landcircle-circle-spells feature', () => {
    const source = getSubclassSource('landcircle');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const grant = level3?.grants.find((g) => g.type === 'feature' && g.feature.id === 'landcircle-circle-spells');
    expect(grant).toBeDefined();
  });

  it('landcircle level 6 grants landcircle-lands-stride feature', () => {
    const source = getSubclassSource('landcircle');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    const grant = level6?.grants.find((g) => g.type === 'feature' && g.feature.id === 'landcircle-lands-stride');
    expect(grant).toBeDefined();
  });

  it('landcircle level 10 grants landcircle-natures-ward feature', () => {
    const source = getSubclassSource('landcircle');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    const grant = level10?.grants.find((g) => g.type === 'feature' && g.feature.id === 'landcircle-natures-ward');
    expect(grant).toBeDefined();
  });

  it('landcircle feature classLevels are 2, 3, 6, 10', () => {
    const source = getSubclassSource('landcircle');
    const levels = source?.features.map((f) => f.classLevel);
    expect(levels).toEqual([2, 3, 6, 10]);
  });
});

describe('getSubclassSource — mooncircle', () => {
  it('returns defined for mooncircle', () => {
    expect(getSubclassSource('mooncircle')).toBeDefined();
  });

  it('mooncircle has classId druid', () => {
    expect(getSubclassSource('mooncircle')?.classId).toBe('druid');
  });

  it('mooncircle has 3 features', () => {
    expect(getSubclassSource('mooncircle')?.features).toHaveLength(3);
  });

  it('mooncircle level 2 grants mooncircle-combat-wild-shape and mooncircle-circle-forms features', () => {
    const source = getSubclassSource('mooncircle');
    const level2 = source?.features.find((f) => f.classLevel === 2);
    expect(level2).toBeDefined();
    const featureIds = level2?.grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : null));
    expect(featureIds).toContain('mooncircle-combat-wild-shape');
    expect(featureIds).toContain('mooncircle-circle-forms');
  });

  it('mooncircle level 6 grants mooncircle-primal-strike feature', () => {
    const source = getSubclassSource('mooncircle');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    const grant = level6?.grants.find((g) => g.type === 'feature' && g.feature.id === 'mooncircle-primal-strike');
    expect(grant).toBeDefined();
  });

  it('mooncircle level 10 grants mooncircle-elemental-wild-shape feature', () => {
    const source = getSubclassSource('mooncircle');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    const grant = level10?.grants.find(
      (g) => g.type === 'feature' && g.feature.id === 'mooncircle-elemental-wild-shape'
    );
    expect(grant).toBeDefined();
  });

  it('mooncircle feature classLevels are 2, 6, 10', () => {
    const source = getSubclassSource('mooncircle');
    const levels = source?.features.map((f) => f.classLevel);
    expect(levels).toEqual([2, 6, 10]);
  });
});
