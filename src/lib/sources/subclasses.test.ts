import { describe, it, expect } from 'vitest';
import { getSubclassSource, SUBCLASS_SOURCES } from '@/lib/sources';
import { SUBCLASS_IDS } from '@/types/sources';
import type { SubclassId } from '@/types/sources';

describe('SUBCLASS_IDS completeness', () => {
  it('has exactly 48 entries (4 per class × 12 classes)', () => {
    expect(SUBCLASS_IDS).toHaveLength(48);
  });

  it.each(SUBCLASS_IDS)('SUBCLASS_IDS entry "%s" has a matching SUBCLASS_SOURCES entry', (id) => {
    const source = SUBCLASS_SOURCES.find((s) => s.id === id);
    expect(source).toBeDefined();
  });

  it('SUBCLASS_SOURCES has no duplicate ids', () => {
    const ids = SUBCLASS_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('SUBCLASS_SOURCES stubs', () => {
  const stubIds = SUBCLASS_IDS.filter(
    (id) => !['champion', 'battlemaster', 'eldritchknight', 'thief', 'assassin', 'arcanetrickster'].includes(id)
  );

  const validClassIds = [
    'barbarian',
    'bard',
    'cleric',
    'druid',
    'fighter',
    'monk',
    'paladin',
    'ranger',
    'rogue',
    'sorcerer',
    'warlock',
    'wizard',
  ] as const;

  it.each(stubIds)('stub "%s" has a valid classId and features: []', (id) => {
    const source = SUBCLASS_SOURCES.find((s) => s.id === id);
    expect(source).toBeDefined();
    expect(validClassIds).toContain(source!.classId);
    expect(source!.features).toEqual([]);
  });
});

describe('SUBCLASS_SOURCES class coverage', () => {
  const classIds = [
    'barbarian',
    'bard',
    'cleric',
    'druid',
    'fighter',
    'monk',
    'paladin',
    'ranger',
    'rogue',
    'sorcerer',
    'warlock',
    'wizard',
  ] as const;

  it.each(classIds)('class "%s" has exactly 4 subclasses in SUBCLASS_SOURCES', (classId) => {
    const count = SUBCLASS_SOURCES.filter((s) => s.classId === classId).length;
    expect(count).toBe(4);
  });
});

describe('assassin skill-expertise grant', () => {
  it('assassin level 9 has exactly 2 grants: feature and skill-expertise: deception', () => {
    const source = getSubclassSource('assassin');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9!.grants).toHaveLength(2);
    expect(level9!.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'assassin-infiltration-expertise' }),
        }),
        expect.objectContaining({ type: 'skill-expertise', skill: 'deception' }),
      ])
    );
  });
});

describe('thief skill-expertise grant', () => {
  it('thief level 9 has exactly 2 grants: feature and skill-expertise: stealth', () => {
    const source = getSubclassSource('thief');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9!.grants).toHaveLength(2);
    expect(level9!.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'thief-supreme-sneak' }) }),
        expect.objectContaining({ type: 'skill-expertise', skill: 'stealth' }),
      ])
    );
  });
});

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
