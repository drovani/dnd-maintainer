import { describe, it, expect } from 'vitest';
import {
  getRaceSource,
  getClassSource,
  getSubclassSource,
  getBackgroundSource,
  getFeatSource,
  getItemSource,
  collectBundles,
} from '@/lib/sources';
import type { CharacterBuild } from '@/types/choices';
import { createChoiceKey } from '@/types/choices';
import type { RaceId, BackgroundId, ClassId } from '@/lib/dnd-helpers';
import type { SubclassId } from '@/types/sources';

const humanFighterL1Build: CharacterBuild = {
  raceId: 'human' as RaceId,
  backgroundId: 'soldier' as BackgroundId,
  baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
  abilityMethod: 'standard-array',
  levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
  choices: {},
  feats: [],
  activeItems: [],
};

describe('getRaceSource', () => {
  it('returns a RaceSource for human with correct fields', () => {
    const source = getRaceSource('human' as RaceId);
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
    // 2 skill + 1 tool + 1 tool-choice + 1 language-choice + 3 equipment = 8
    expect(source?.grants).toHaveLength(8);
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

describe('collectBundles', () => {
  it('returns 3 bundles for Human Fighter L1 build', () => {
    const { bundles } = collectBundles(humanFighterL1Build);
    // race bundle + class L1 bundle + background bundle = 3
    expect(bundles).toHaveLength(3);
  });

  it('does not throw for unknown IDs', () => {
    const unknownBuild: CharacterBuild = {
      ...humanFighterL1Build,
      raceId: 'gnome-forest' as RaceId,
      backgroundId: 'hermit' as BackgroundId,
      levels: [],
    };
    expect(() => collectBundles(unknownBuild)).not.toThrow();
  });

  it('populates warnings array for unknown race ID', () => {
    const unknownBuild: CharacterBuild = {
      ...humanFighterL1Build,
      raceId: 'gnome-forest' as RaceId,
      levels: [],
    };
    const { warnings } = collectBundles(unknownBuild);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('gnome-forest');
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

describe('Land terrain synthesis in collectBundles', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'druid', 0);
  const terrainKey = createChoiceKey('land-terrain-choice', 'subclass', 'landcircle', 0);

  const baseDruidBuild: CharacterBuild = {
    raceId: 'human' as RaceId,
    backgroundId: null,
    baseAbilities: { str: 8, dex: 12, con: 14, int: 10, wis: 16, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [],
    choices: {},
    feats: [],
    activeItems: [],
  };

  function buildLandDruid(druidLevel: number, terrainId: 'forest'): CharacterBuild {
    const levels = Array.from({ length: druidLevel }, (_, i) => ({
      classId: 'druid' as ClassId,
      classLevel: i + 1,
      hpRoll: i === 0 ? null : 5,
    }));
    return {
      ...baseDruidBuild,
      levels,
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'landcircle' as SubclassId },
        [terrainKey]: { type: 'land-terrain-choice' as const, terrainId },
      },
    };
  }

  it('Forest at druid L3: emits barkskin + spider-climb (tier 3 only)', () => {
    const { bundles } = collectBundles(buildLandDruid(3, 'forest'));
    const spellGrants = bundles
      .flatMap((b) => b.grants)
      .filter((g) => g.type === 'spell' && g.alwaysPrepared)
      .map((g) => (g.type === 'spell' ? g.spellId : null));
    expect(spellGrants).toContain('barkskin');
    expect(spellGrants).toContain('spider-climb');
    expect(spellGrants).not.toContain('call-lightning');
    expect(spellGrants).not.toContain('plant-growth');
    expect(spellGrants).toHaveLength(2);
  });

  it('Forest at druid L5: emits tiers 3+5 (barkskin, spider-climb, call-lightning, plant-growth)', () => {
    const { bundles } = collectBundles(buildLandDruid(5, 'forest'));
    const spellGrants = bundles
      .flatMap((b) => b.grants)
      .filter((g) => g.type === 'spell' && g.alwaysPrepared)
      .map((g) => (g.type === 'spell' ? g.spellId : null));
    expect(spellGrants).toContain('barkskin');
    expect(spellGrants).toContain('spider-climb');
    expect(spellGrants).toContain('call-lightning');
    expect(spellGrants).toContain('plant-growth');
    expect(spellGrants).toHaveLength(4);
  });

  it('Forest at druid L7: emits tiers 3+5+7 (6 spells)', () => {
    const { bundles } = collectBundles(buildLandDruid(7, 'forest'));
    const spellGrants = bundles
      .flatMap((b) => b.grants)
      .filter((g) => g.type === 'spell' && g.alwaysPrepared)
      .map((g) => (g.type === 'spell' ? g.spellId : null));
    expect(spellGrants).toHaveLength(6);
    expect(spellGrants).toContain('divination');
    expect(spellGrants).toContain('freedom-of-movement');
  });

  it('Forest at druid L9: emits all 4 tiers (8 spells)', () => {
    const { bundles } = collectBundles(buildLandDruid(9, 'forest'));
    const spellGrants = bundles
      .flatMap((b) => b.grants)
      .filter((g) => g.type === 'spell' && g.alwaysPrepared)
      .map((g) => (g.type === 'spell' ? g.spellId : null));
    expect(spellGrants).toHaveLength(8);
    expect(spellGrants).toContain('commune-with-nature');
    expect(spellGrants).toContain('tree-stride');
  });

  it('emits no spell grants when no land-terrain-choice decision is present', () => {
    const noTerrainBuild: CharacterBuild = {
      ...baseDruidBuild,
      levels: [
        { classId: 'druid' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'druid' as ClassId, classLevel: 2, hpRoll: 5 },
        { classId: 'druid' as ClassId, classLevel: 3, hpRoll: 4 },
      ],
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'landcircle' as SubclassId },
        // No terrain decision — land-terrain-choice grant becomes pending
      },
    };
    const { bundles } = collectBundles(noTerrainBuild);
    const alwaysPreparedSpells = bundles.flatMap((b) => b.grants).filter((g) => g.type === 'spell' && g.alwaysPrepared);
    expect(alwaysPreparedSpells).toHaveLength(0);
  });

  it('emits no spell grants for non-Land druid (mooncircle)', () => {
    const moonSubclassKey = createChoiceKey('subclass', 'class', 'druid', 0);
    const moonBuild: CharacterBuild = {
      ...baseDruidBuild,
      levels: [
        { classId: 'druid' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'druid' as ClassId, classLevel: 2, hpRoll: 5 },
        { classId: 'druid' as ClassId, classLevel: 5, hpRoll: 4 },
      ],
      choices: {
        [moonSubclassKey]: { type: 'subclass' as const, subclassId: 'mooncircle' as SubclassId },
      },
    };
    const { bundles } = collectBundles(moonBuild);
    const alwaysPreparedSpells = bundles.flatMap((b) => b.grants).filter((g) => g.type === 'spell' && g.alwaysPrepared);
    expect(alwaysPreparedSpells).toHaveLength(0);
  });

  it('synthesized spell bundles have subclass source tagged as landcircle', () => {
    const { bundles } = collectBundles(buildLandDruid(3, 'forest'));
    const spellBundles = bundles.filter(
      (b) =>
        b.source.origin === 'subclass' &&
        b.source.id === 'landcircle' &&
        b.grants.some((g) => g.type === 'spell' && g.alwaysPrepared)
    );
    expect(spellBundles.length).toBeGreaterThan(0);
    const source = spellBundles[0].source;
    expect(source.origin).toBe('subclass');
    if (source.origin === 'subclass') {
      expect(source.id).toBe('landcircle');
      expect(source.classId).toBe('druid');
    }
  });
});
