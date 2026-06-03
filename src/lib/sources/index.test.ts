import { describe, it, expect, vi } from 'vitest';
import type { FeatSource } from '@/types/sources';

const mockFeatSources = vi.hoisted<{ value: readonly FeatSource[] | null }>(() => ({ value: null }));

vi.mock('@/lib/sources/feats', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/sources/feats')>();
  return {
    get FEAT_SOURCES() {
      return mockFeatSources.value ?? actual.FEAT_SOURCES;
    },
  };
});

import {
  getSpeciesSource,
  getClassSource,
  getSubclassSource,
  getBackgroundSource,
  getFeatSource,
  getItemSource,
  collectBundles,
} from '@/lib/sources';
import { resolveCharacter } from '@/lib/resolver';
import type { CharacterBuild } from '@/types/choices';
import { createChoiceKey } from '@/types/choices';
import type { SpeciesId, BackgroundId, ClassId, FeatId } from '@/lib/dnd-helpers';
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
    // 1 hit-die + 4 armor + 2 weapon + 2 saving-throw + 1 skill-choice + 1 armor-class + 1 fighting-style-choice + 1 weapon-mastery-choice + 1 feature + 4 bundle-choice = 18
    expect(source?.levels[0].grants).toHaveLength(18);
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
  it('returns a FeatSource for alert with origin category', () => {
    const source = getFeatSource('alert');
    expect(source).toBeDefined();
    expect(source?.id).toBe('alert');
    expect(source?.category).toBe('origin');
    expect(source?.prerequisites).toHaveLength(0);
    expect(source?.grants).toHaveLength(1);
  });

  it('returns undefined for unknown feat', () => {
    expect(getFeatSource('nonexistent-feat' as FeatId)).toBeUndefined();
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

  it.each(EXPECTED_BACKGROUNDS)('$id has exactly 1 origin grant (feat or direct feature)', ({ id }) => {
    const source = getBackgroundSource(id as BackgroundId);
    // acolyte/guide/sage grant Magic Initiate as a direct feature (not a feat grant)
    const directMagicInitiateIds = new Set([
      'feat-magic-initiate-cleric',
      'feat-magic-initiate-druid',
      'feat-magic-initiate-wizard',
    ]);
    const hasFeatGrant = source?.grants.some((g) => g.type === 'feat') ?? false;
    const hasDirectMagicInitiateFeature =
      source?.grants.some((g) => g.type === 'feature' && directMagicInitiateIds.has(g.feature.id)) ?? false;
    expect(hasFeatGrant || hasDirectMagicInitiateFeature).toBe(true);
  });
});

describe('collectBundles', () => {
  it('returns 4 bundles for Human Fighter L1 build', () => {
    const { bundles } = collectBundles(humanFighterL1Build);
    // race bundle + class L1 bundle + background bundle + background origin feat bundle = 4
    expect(bundles).toHaveLength(4);
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
      feats: ['nonexistent-feat' as FeatId],
    };
    const { warnings } = collectBundles(unknownFeatBuild);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('nonexistent-feat');
  });

  it('includes a feat bundle when a valid feat is in build.feats', () => {
    const build: CharacterBuild = { ...humanFighterL1Build, feats: ['alert' as FeatId] };
    const { bundles, warnings } = collectBundles(build);
    expect(warnings).toHaveLength(0);
    const featBundle = bundles.find((b) => b.source.origin === 'feat' && b.source.id === 'alert');
    expect(featBundle).toBeDefined();
    expect(featBundle?.grants).toHaveLength(1);
  });

  it('returns 6 bundles for Fighter L3 without subclass decision', () => {
    const l3Build: CharacterBuild = {
      ...humanFighterL1Build,
      levels: [
        { classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 2, hpRoll: 8 },
        { classId: 'fighter' as ClassId, classLevel: 3, hpRoll: 7 },
      ],
    };
    const { bundles } = collectBundles(l3Build);
    // race bundle + class L1 + class L2 + class L3 + background + background origin feat = 6
    // (no subclass bundle since no decision)
    expect(bundles).toHaveLength(6);
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
    // race + class L1 + class L2 + class L3 + background + background origin feat + champion L3 subclass bundle = 7
    expect(bundles).toHaveLength(7);
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
    // only L3 feature, not L7, L10, L15, L18
    expect(subclassBundles).toHaveLength(1);
  });

  it('soldier background origin feat: expandedFeats contains savage-attacker', () => {
    const { bundles, expandedFeats } = collectBundles(humanFighterL1Build);
    expect(expandedFeats.has('savage-attacker')).toBe(true);
    const featBundle = bundles.find((b) => b.source.origin === 'feat' && b.source.id === 'savage-attacker');
    expect(featBundle).toBeDefined();
  });

  it('nested feat grant: outer feat is in expandedFeats, inner nested feat is not', () => {
    mockFeatSources.value = [
      {
        id: 'savage-attacker',
        category: 'origin',
        prerequisites: [],
        grants: [
          { type: 'feature', feature: { id: 'feat-savage-attacker' } },
          { type: 'feat', featId: 'nested-inner-feat' as FeatId },
        ],
      },
    ];
    try {
      const { expandedFeats } = collectBundles(humanFighterL1Build);
      expect(expandedFeats.has('savage-attacker')).toBe(true);
      expect(expandedFeats.has('nested-inner-feat' as FeatId)).toBe(false);
    } finally {
      mockFeatSources.value = null;
    }
  });

  it('missing feat source: not added to expandedFeats', () => {
    mockFeatSources.value = [];
    try {
      const { expandedFeats, warnings } = collectBundles(humanFighterL1Build);
      expect(expandedFeats.size).toBe(0);
      expect(warnings.some((w) => w.includes('savage-attacker'))).toBe(true);
    } finally {
      mockFeatSources.value = null;
    }
  });

  it('damage-choice: expands chosen damage type into a feature grant with id `${prefix}-${type}`', () => {
    const subclassKey = createChoiceKey('subclass', 'class', 'barbarian', 0);
    const damageKey = createChoiceKey('damage-choice', 'class', 'barbarian', 0);
    const zealotL3Build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'soldier' as BackgroundId,
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      abilityMethod: 'standard-array',
      levels: [
        { classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'barbarian' as ClassId, classLevel: 2, hpRoll: 7 },
        { classId: 'barbarian' as ClassId, classLevel: 3, hpRoll: 7 },
      ],
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'zealot' as SubclassId },
        [damageKey]: { type: 'damage-choice' as const, damageTypes: ['radiant'] as const },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(zealotL3Build);
    const expandedFeature = bundles
      .flatMap((b) => b.grants)
      .find((g) => g.type === 'feature' && g.feature.id === 'zealot-divine-fury-radiant');
    expect(expandedFeature).toBeDefined();
  });

  it('damage-choice: emits no expansion when the decision is missing', () => {
    const subclassKey = createChoiceKey('subclass', 'class', 'barbarian', 0);
    const zealotL3BuildNoDecision: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'soldier' as BackgroundId,
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      abilityMethod: 'standard-array',
      levels: [
        { classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'barbarian' as ClassId, classLevel: 2, hpRoll: 7 },
        { classId: 'barbarian' as ClassId, classLevel: 3, hpRoll: 7 },
      ],
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'zealot' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(zealotL3BuildNoDecision);
    const radiantFeature = bundles
      .flatMap((b) => b.grants)
      .find((g) => g.type === 'feature' && g.feature.id === 'zealot-divine-fury-radiant');
    const necroticFeature = bundles
      .flatMap((b) => b.grants)
      .find((g) => g.type === 'feature' && g.feature.id === 'zealot-divine-fury-necrotic');
    expect(radiantFeature).toBeUndefined();
    expect(necroticFeature).toBeUndefined();
  });

  it('feature-choice: cleric L1 Protector inlines the option grants (martial weapons + heavy armor)', () => {
    const featureKey = createChoiceKey('feature-choice', 'class', 'cleric', 0);
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
      abilityMethod: 'standard-array',
      levels: [{ classId: 'cleric' as ClassId, classLevel: 1, hpRoll: null }],
      choices: {
        [featureKey]: { type: 'feature-choice' as const, optionId: 'protector' },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(build);
    const allGrants = bundles.flatMap((b) => b.grants);
    const protectorFeature = allGrants.find(
      (g) => g.type === 'feature' && g.feature.id === 'cleric-divine-order-protector'
    );
    expect(protectorFeature).toBeDefined();
    const martialWeapon = allGrants.find(
      (g) => g.type === 'proficiency' && g.category === 'weapon' && g.id === 'martial'
    );
    expect(martialWeapon).toBeDefined();
    const heavyArmor = allGrants.find((g) => g.type === 'proficiency' && g.category === 'armor' && g.id === 'heavy');
    expect(heavyArmor).toBeDefined();
  });

  it('feature-choice: cleric L1 Thaumaturge inlines only the variant feature (no extra grants today)', () => {
    const featureKey = createChoiceKey('feature-choice', 'class', 'cleric', 0);
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
      abilityMethod: 'standard-array',
      levels: [{ classId: 'cleric' as ClassId, classLevel: 1, hpRoll: null }],
      choices: {
        [featureKey]: { type: 'feature-choice' as const, optionId: 'thaumaturge' },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(build);
    const allGrants = bundles.flatMap((b) => b.grants);
    const thaumaturgeFeature = allGrants.find(
      (g) => g.type === 'feature' && g.feature.id === 'cleric-divine-order-thaumaturge'
    );
    expect(thaumaturgeFeature).toBeDefined();
    const protectorFeature = allGrants.find(
      (g) => g.type === 'feature' && g.feature.id === 'cleric-divine-order-protector'
    );
    expect(protectorFeature).toBeUndefined();
  });

  it('feature-choice: emits no expansion when the decision is missing', () => {
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
      abilityMethod: 'standard-array',
      levels: [{ classId: 'cleric' as ClassId, classLevel: 1, hpRoll: null }],
      choices: {},
      feats: [],
      activeItems: [],
    };
    const { bundles, warnings } = collectBundles(build);
    const allGrants = bundles.flatMap((b) => b.grants);
    expect(
      allGrants.find((g) => g.type === 'feature' && g.feature.id === 'cleric-divine-order-protector')
    ).toBeUndefined();
    expect(
      allGrants.find((g) => g.type === 'feature' && g.feature.id === 'cleric-divine-order-thaumaturge')
    ).toBeUndefined();
    expect(warnings).toHaveLength(0);
  });

  it('feature-choice: warns when the decision references an unknown option id', () => {
    const featureKey = createChoiceKey('feature-choice', 'class', 'cleric', 0);
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
      abilityMethod: 'standard-array',
      levels: [{ classId: 'cleric' as ClassId, classLevel: 1, hpRoll: null }],
      choices: {
        [featureKey]: { type: 'feature-choice' as const, optionId: 'unknown-option' },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles, warnings } = collectBundles(build);
    const allGrants = bundles.flatMap((b) => b.grants);
    expect(
      allGrants.find((g) => g.type === 'feature' && g.feature.id === 'cleric-divine-order-protector')
    ).toBeUndefined();
    expect(warnings.some((w) => w.includes('unknown-option'))).toBe(true);
  });

  it('damage-choice: ignores decisions for damage types outside the grant.from list', () => {
    const subclassKey = createChoiceKey('subclass', 'class', 'barbarian', 0);
    const damageKey = createChoiceKey('damage-choice', 'class', 'barbarian', 0);
    const zealotL3BuildInvalid: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'soldier' as BackgroundId,
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      abilityMethod: 'standard-array',
      levels: [
        { classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'barbarian' as ClassId, classLevel: 2, hpRoll: 7 },
        { classId: 'barbarian' as ClassId, classLevel: 3, hpRoll: 7 },
      ],
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'zealot' as SubclassId },
        [damageKey]: { type: 'damage-choice' as const, damageTypes: ['fire'] as const },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(zealotL3BuildInvalid);
    const fireFeature = bundles
      .flatMap((b) => b.grants)
      .find((g) => g.type === 'feature' && g.feature.id === 'zealot-divine-fury-fire');
    expect(fireFeature).toBeUndefined();
  });

  it('feature-choice: druid L1 Warden inlines the option grants (martial weapons + medium armor)', () => {
    const druidL1Key = createChoiceKey('feature-choice', 'class', 'druid', 0);
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
      abilityMethod: 'standard-array',
      levels: [{ classId: 'druid' as ClassId, classLevel: 1, hpRoll: null }],
      choices: {
        [druidL1Key]: { type: 'feature-choice' as const, optionId: 'warden' },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(build);
    const allGrants = bundles.flatMap((b) => b.grants);
    const wardenFeature = allGrants.find((g) => g.type === 'feature' && g.feature.id === 'druid-primal-order-warden');
    expect(wardenFeature).toBeDefined();
    const martialWeapon = allGrants.find(
      (g) => g.type === 'proficiency' && g.category === 'weapon' && g.id === 'martial'
    );
    expect(martialWeapon).toBeDefined();
    const mediumArmor = allGrants.find((g) => g.type === 'proficiency' && g.category === 'armor' && g.id === 'medium');
    expect(mediumArmor).toBeDefined();
  });

  it('feature-choice: druid L1 Magician inlines only the variant feature (no extra grants today)', () => {
    const druidL1Key = createChoiceKey('feature-choice', 'class', 'druid', 0);
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
      abilityMethod: 'standard-array',
      levels: [{ classId: 'druid' as ClassId, classLevel: 1, hpRoll: null }],
      choices: {
        [druidL1Key]: { type: 'feature-choice' as const, optionId: 'magician' },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(build);
    const allGrants = bundles.flatMap((b) => b.grants);
    const magicianFeature = allGrants.find(
      (g) => g.type === 'feature' && g.feature.id === 'druid-primal-order-magician'
    );
    expect(magicianFeature).toBeDefined();
    const martialWeapon = allGrants.find(
      (g) => g.type === 'proficiency' && g.category === 'weapon' && g.id === 'martial'
    );
    expect(martialWeapon).toBeUndefined();
    const mediumArmor = allGrants.find((g) => g.type === 'proficiency' && g.category === 'armor' && g.id === 'medium');
    expect(mediumArmor).toBeUndefined();
    const wardenFeature = allGrants.find((g) => g.type === 'feature' && g.feature.id === 'druid-primal-order-warden');
    expect(wardenFeature).toBeUndefined();
  });
});

describe('Magic Initiate pipeline integration (acolyte → cleric spells)', () => {
  const acolyte1Build: CharacterBuild = {
    speciesId: 'human' as SpeciesId,
    backgroundId: 'acolyte' as BackgroundId,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 15, cha: 12 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'cleric' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {},
    feats: [],
    activeItems: [],
  };

  it('collectBundles → resolveCharacter: feat-magic-initiate-cleric resolves exactly once in features', () => {
    const { bundles, warnings, expandedFeats } = collectBundles(acolyte1Build);
    const result = resolveCharacter({
      baseAbilities: acolyte1Build.baseAbilities,
      level: acolyte1Build.levels.length,
      bundles,
      choices: acolyte1Build.choices,
      levels: acolyte1Build.levels,
      expandedFeats,
    });
    const clericInitiateFeatures = result.features.filter((f) => f.feature.id === 'feat-magic-initiate-cleric');
    expect(
      clericInitiateFeatures,
      'feat-magic-initiate-cleric should resolve exactly once (no double-grant)'
    ).toHaveLength(1);
    // No pending choice for magic-initiate (direct feature, no user selection needed)
    const magicInitiateChoice = result.pendingChoices.find(
      (c) => 'key' in c && String(c.key).includes('magic-initiate')
    );
    expect(magicInitiateChoice, 'no pending magic-initiate choice should exist').toBeUndefined();
    // No warnings about background feat expansion
    expect(warnings.some((w) => w.includes('magic-initiate'))).toBe(false);
  });
});
