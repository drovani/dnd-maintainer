import { describe, it, expect } from 'vitest';
import {
  getSpeciesSource,
  getClassSource,
  getSubclassSource,
  getBackgroundSource,
  getFeatSource,
  getItemSource,
  collectBundles,
} from '@/lib/sources';
import type { CharacterBuild } from '@/types/choices';
import { createChoiceKey } from '@/types/choices';
import type { SpeciesId, BackgroundId, ClassId } from '@/lib/dnd-helpers';
import type { SubclassId } from '@/types/sources';

const humanFighterL1Build: CharacterBuild = {
  speciesId: 'human' as SpeciesId,
  backgroundId: 'soldier' as BackgroundId,
  baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
  abilityMethod: 'standard-array',
  levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
  choices: {},
  feats: [],
  activeItems: [],
};

describe('getSpeciesSource', () => {
  it('returns a SpeciesSource for human with correct fields', () => {
    const source = getSpeciesSource('human' as SpeciesId);
    expect(source).toBeDefined();
    expect(source?.id).toBe('human');
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
    expect(source?.grants).toBeDefined();
    expect(source?.grants.length).toBeGreaterThan(0);
  });
});

describe('getClassSource', () => {
  it('returns a ClassSource for fighter with 20 levels', () => {
    const source = getClassSource('fighter' as Parameters<typeof getClassSource>[0]);
    expect(source).toBeDefined();
    expect(source?.id).toBe('fighter');
    expect(source?.levels).toHaveLength(20);
  });

  it('fighter level 1 has correct grant count', () => {
    const source = getClassSource('fighter' as Parameters<typeof getClassSource>[0]);
    // 1 hit-die + 4 armor + 2 weapon + 2 saving-throw + 1 skill-choice + 1 armor-class + 1 fighting-style-choice + 1 feature + 4 bundle-choice = 17
    expect(source?.levels[0].grants).toHaveLength(17);
  });
});

describe('getSubclassSource', () => {
  it('returns defined for champion', () => {
    expect(getSubclassSource('champion')).toBeDefined();
  });

  it('returns undefined for unknown subclass', () => {
    expect(getSubclassSource('unknown-subclass' as SubclassId)).toBeUndefined();
  });
});

describe('getBackgroundSource', () => {
  it('returns a BackgroundSource for soldier with correct grants', () => {
    const source = getBackgroundSource('soldier' as BackgroundId);
    expect(source).toBeDefined();
    expect(source?.id).toBe('soldier');
    // 1 asi + 2 skill + 1 tool-choice + 1 language-choice + 1 feat = 6
    expect(source?.grants).toHaveLength(6);
  });
});

describe('getFeatSource', () => {
  it('returns undefined', () => {
    expect(getFeatSource('alert')).toBeUndefined();
  });
});

describe('getItemSource', () => {
  it('returns undefined', () => {
    expect(getItemSource('longsword')).toBeUndefined();
  });
});

describe('all 2024 backgrounds have correct structure', () => {
  const EXPECTED_BACKGROUNDS = [
    { id: 'acolyte', fromPool: ['int', 'wis', 'cha'] },
    { id: 'artisan', fromPool: ['str', 'dex', 'int'] },
    { id: 'charlatan', fromPool: ['dex', 'con', 'cha'] },
    { id: 'criminal', fromPool: ['dex', 'con', 'int'] },
    { id: 'entertainer', fromPool: ['str', 'dex', 'cha'] },
    { id: 'farmer', fromPool: ['str', 'con', 'wis'] },
    { id: 'guard', fromPool: ['str', 'int', 'wis'] },
    { id: 'guide', fromPool: ['dex', 'con', 'wis'] },
    { id: 'hermit', fromPool: ['con', 'wis', 'cha'] },
    { id: 'merchant', fromPool: ['con', 'int', 'cha'] },
    { id: 'noble', fromPool: ['str', 'int', 'cha'] },
    { id: 'sage', fromPool: ['con', 'int', 'wis'] },
    { id: 'sailor', fromPool: ['str', 'dex', 'con'] },
    { id: 'scribe', fromPool: ['dex', 'int', 'wis'] },
    { id: 'soldier', fromPool: ['str', 'dex', 'con'] },
    { id: 'wayfarer', fromPool: ['dex', 'wis', 'cha'] },
  ] as const;

  it.each(EXPECTED_BACKGROUNDS)('$id has ASI grant with 3 points and correct from pool', ({ id, fromPool }) => {
    const source = getBackgroundSource(id as BackgroundId);
    expect(source).toBeDefined();
    const asiGrant = source?.grants.find((g) => g.type === 'asi');
    expect(asiGrant).toBeDefined();
    if (asiGrant?.type === 'asi') {
      expect(asiGrant.points).toBe(3);
      expect(asiGrant.from).toEqual(fromPool);
    }
  });

  it.each(EXPECTED_BACKGROUNDS)('$id has exactly 2 skill proficiency grants', ({ id }) => {
    const source = getBackgroundSource(id as BackgroundId);
    const skillGrants = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'skill');
    expect(skillGrants).toHaveLength(2);
  });

  it.each(EXPECTED_BACKGROUNDS)('$id has exactly 1 feat grant', ({ id }) => {
    const source = getBackgroundSource(id as BackgroundId);
    const featGrants = source?.grants.filter((g) => g.type === 'feat');
    expect(featGrants).toHaveLength(1);
  });
});

describe('collectBundles', () => {
  it('returns 3 bundles for Human Fighter L1 build', () => {
    const { bundles } = collectBundles(humanFighterL1Build);
    // race bundle + class L1 bundle + background bundle = 3
    expect(bundles).toHaveLength(3);
  });

  it('does not throw for unknown IDs', () => {
    const unknownBuild: CharacterBuild = {
      ...humanFighterL1Build,
      speciesId: 'unknown-species' as SpeciesId,
      backgroundId: 'hermit' as BackgroundId,
      levels: [],
    };
    expect(() => collectBundles(unknownBuild)).not.toThrow();
  });

  it('populates warnings array for unknown species ID', () => {
    const unknownBuild: CharacterBuild = {
      ...humanFighterL1Build,
      speciesId: 'unknown-species' as SpeciesId,
      levels: [],
    };
    const { warnings } = collectBundles(unknownBuild);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('unknown-species');
  });

  it('populates warnings array for unknown feat ID', () => {
    const unknownFeatBuild: CharacterBuild = {
      ...humanFighterL1Build,
      feats: ['nonexistent-feat'],
    };
    const { warnings } = collectBundles(unknownFeatBuild);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('nonexistent-feat');
  });

  it('returns 5 bundles for Fighter L3 without subclass decision', () => {
    const l3Build: CharacterBuild = {
      ...humanFighterL1Build,
      levels: [
        { classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 2, hpRoll: 8 },
        { classId: 'fighter' as ClassId, classLevel: 3, hpRoll: 7 },
      ],
    };
    const { bundles } = collectBundles(l3Build);
    // race bundle + class L1 + class L2 + class L3 + background = 5 (no subclass bundle since no decision)
    expect(bundles).toHaveLength(5);
  });

  it('includes champion subclass bundle at L3 when champion is chosen', () => {
    const subclassKey = createChoiceKey('subclass', 'class', 'fighter', 0);
    const l3BuildWithChampion: CharacterBuild = {
      ...humanFighterL1Build,
      levels: [
        { classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 2, hpRoll: 8 },
        { classId: 'fighter' as ClassId, classLevel: 3, hpRoll: 7 },
      ],
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'champion' as SubclassId },
      },
    };
    const { bundles } = collectBundles(l3BuildWithChampion);
    // race + class L1 + class L2 + class L3 + background + champion L3 subclass bundle = 6
    expect(bundles).toHaveLength(6);
    const subclassBundles = bundles.filter((b) => b.source.origin === 'subclass');
    expect(subclassBundles).toHaveLength(1);
    const subclassBundle = subclassBundles[0];
    expect(subclassBundle.source.origin === 'subclass' && subclassBundle.source.id).toBe('champion');
    expect(subclassBundle.grants).toHaveLength(1);
    const grant = subclassBundle.grants[0];
    expect(grant.type).toBe('feature');
    if (grant.type === 'feature') {
      expect(grant.feature.id).toBe('champion-improved-critical');
    }
  });

  it('excludes subclass features above character level', () => {
    // Champion has features at classLevel 3, 7, 10, 15, 18
    // A L3 fighter should only get the L3 feature, not L7+
    const subclassKey = createChoiceKey('subclass', 'class', 'fighter', 0);
    const l3BuildWithChampion: CharacterBuild = {
      ...humanFighterL1Build,
      levels: [
        { classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 2, hpRoll: 8 },
        { classId: 'fighter' as ClassId, classLevel: 3, hpRoll: 7 },
      ],
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'champion' as SubclassId },
      },
    };
    const { bundles } = collectBundles(l3BuildWithChampion);
    const subclassBundles = bundles.filter((b) => b.source.origin === 'subclass');
    expect(subclassBundles).toHaveLength(1); // only L3 feature, not L7, L10, L15, L18
  });
});
