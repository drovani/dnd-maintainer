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
  SPECIES_SOURCES,
  CLASS_SOURCES,
  SUBCLASS_SOURCES,
  BACKGROUND_SOURCES,
  FEAT_SOURCES,
} from '@/lib/sources';
import { resolveCharacter } from '@/lib/resolver';
import type { CharacterBuild, ChoiceDecision, ChoiceKey } from '@/types/choices';
import { createChoiceKey } from '@/types/choices';
import type { SpeciesId, BackgroundId, ClassId, FeatId } from '@/lib/dnd-helpers';
import type { SubclassId } from '@/types/sources';
import type { SpellId } from '@/types/spells';

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

describe('feat-origin feature-choice pipeline (build.feats: magic-initiate)', () => {
  // Use soldier background (grants savage-attacker feat) — no magic-initiate collision.
  // Acolyte/guide/sage grant feat-magic-initiate-cleric/druid/wizard as a *direct feature* (PR #177),
  // so using them here would create a second feat-magic-initiate-cleric from two sources.
  const magicInitiateKey = createChoiceKey('feature-choice', 'feat', 'magic-initiate', 0);

  const buildWithDecision: CharacterBuild = {
    speciesId: 'human' as SpeciesId,
    backgroundId: 'soldier' as BackgroundId,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {
      [magicInitiateKey]: { type: 'feature-choice' as const, optionId: 'cleric' },
    },
    feats: ['magic-initiate' as FeatId],
    activeItems: [],
  };

  const buildWithoutDecision: CharacterBuild = {
    ...buildWithDecision,
    choices: {},
  };

  it('with decision: feat-magic-initiate-cleric appears exactly once in resolved features', () => {
    const { bundles, expandedFeats } = collectBundles(buildWithDecision);
    const result = resolveCharacter({
      baseAbilities: buildWithDecision.baseAbilities,
      level: buildWithDecision.levels.length,
      bundles,
      choices: buildWithDecision.choices,
      levels: buildWithDecision.levels,
      expandedFeats,
    });
    const clericFeatures = result.features.filter((f) => f.feature.id === 'feat-magic-initiate-cleric');
    expect(clericFeatures, 'feat-magic-initiate-cleric should appear exactly once').toHaveLength(1);
    const pendingMagicInitiate = result.pendingChoices.find(
      (c) => 'choiceKey' in c && String(c.choiceKey).includes('magic-initiate')
    );
    expect(pendingMagicInitiate, 'no pending magic-initiate choice after resolution').toBeUndefined();
  });

  it('without decision: a pending feature-choice for magic-initiate is emitted', () => {
    const { bundles, expandedFeats } = collectBundles(buildWithoutDecision);
    const result = resolveCharacter({
      baseAbilities: buildWithoutDecision.baseAbilities,
      level: buildWithoutDecision.levels.length,
      bundles,
      choices: buildWithoutDecision.choices,
      levels: buildWithoutDecision.levels,
      expandedFeats,
    });
    const pendingMagicInitiate = result.pendingChoices.find(
      (c) => c.type === 'feature-choice' && String(c.choiceKey).includes('magic-initiate')
    );
    expect(pendingMagicInitiate, 'pending feature-choice for magic-initiate should be emitted').toBeDefined();
    expect(pendingMagicInitiate?.type).toBe('feature-choice');
  });

  it('with decision: no origin-mismatch warning fires for a resolved feat-origin choice', () => {
    const { warnings } = collectBundles(buildWithDecision);
    const originMismatch = warnings.find((w) => w.includes('non-class origin') && w.includes('feat'));
    expect(originMismatch, 'no origin-mismatch warning for resolved feat-origin feature-choice').toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Human feat-choice (Versatile) pipeline
// ---------------------------------------------------------------------------

describe('Human feat-choice (Versatile) pipeline', () => {
  const featChoiceKey = createChoiceKey('feat-choice', 'species', 'human', 0);

  const humanBaseL1: CharacterBuild = {
    speciesId: 'human' as SpeciesId,
    backgroundId: null,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {},
    feats: [],
    activeItems: [],
  };

  it('(a) Human with no decision emits a feat-choice pending (category origin, source.origin species)', () => {
    const { bundles, expandedFeats } = collectBundles(humanBaseL1);
    const result = resolveCharacter({
      baseAbilities: humanBaseL1.baseAbilities,
      level: 1,
      bundles,
      choices: humanBaseL1.choices,
      levels: humanBaseL1.levels,
      expandedFeats,
    });
    const pending = result.pendingChoices.filter((c) => c.type === 'feat-choice' && c.source.origin === 'species');
    expect(pending).toHaveLength(1);
    expect(pending[0].type).toBe('feat-choice');
    if (pending[0].type === 'feat-choice') {
      expect(pending[0].category).toBe('origin');
      expect(pending[0].source.origin).toBe('species');
    }
  });

  it('(b) Human + Skilled decided: no feat-choice pending; a skill-choice pending with source.origin feat is emitted (count 3)', () => {
    const buildWithSkilled: CharacterBuild = {
      ...humanBaseL1,
      choices: {
        [featChoiceKey]: { type: 'feat-choice' as const, featId: 'skilled' as FeatId },
      },
    };
    const { bundles, expandedFeats } = collectBundles(buildWithSkilled);
    const result = resolveCharacter({
      baseAbilities: buildWithSkilled.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithSkilled.choices,
      levels: buildWithSkilled.levels,
      expandedFeats,
    });
    // No pending feat-choice
    expect(result.pendingChoices.filter((c) => c.type === 'feat-choice')).toHaveLength(0);
    // A skill-choice pending with source.origin feat is emitted
    const skillPending = result.pendingChoices.filter((c) => c.type === 'skill-choice' && c.source.origin === 'feat');
    expect(skillPending).toHaveLength(1);
    if (skillPending[0].type === 'skill-choice') {
      expect(skillPending[0].count).toBe(3);
    }
  });

  it('(c) Human + Tough decided: resolved hitPoints.max includes +2 per level', () => {
    const buildWithTough: CharacterBuild = {
      ...humanBaseL1,
      choices: {
        [featChoiceKey]: { type: 'feat-choice' as const, featId: 'tough' as FeatId },
      },
    };
    const { bundles, expandedFeats } = collectBundles(buildWithTough);
    const result = resolveCharacter({
      baseAbilities: buildWithTough.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithTough.choices,
      levels: buildWithTough.levels,
      expandedFeats,
    });
    // CON is 10 → modifier 0, Fighter hit die 10, L1 HP = 10 + 0 con + 2 tough = 12
    // Without Tough: 10 + 0 = 10
    expect(result.hitPoints.max).toBe(12);
  });

  it('(c2) HP dedupe regression: Human + Farmer background (grants tough) + Versatile=tough → hp-bonus applied once, not twice', () => {
    // Farmer background expands tough via the embedded-feat pass.
    // Versatile feat-choice also picks tough — should be skipped (already expanded).
    // CON 10 → mod 0, Fighter d10 L1 → base 10 + 2 tough = 12 (not 14).
    const buildWithFarmerAndTough: CharacterBuild = {
      ...humanBaseL1,
      backgroundId: 'farmer' as BackgroundId,
      choices: {
        [featChoiceKey]: { type: 'feat-choice' as const, featId: 'tough' as FeatId },
      },
    };
    const { bundles, expandedFeats } = collectBundles(buildWithFarmerAndTough);
    const result = resolveCharacter({
      baseAbilities: buildWithFarmerAndTough.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithFarmerAndTough.choices,
      levels: buildWithFarmerAndTough.levels,
      expandedFeats,
    });
    expect(result.hitPoints.max).toBe(12);
  });

  it('(d) Human + Crafter decided: a tool-choice pending with source.origin feat is emitted', () => {
    const buildWithCrafter: CharacterBuild = {
      ...humanBaseL1,
      choices: {
        [featChoiceKey]: { type: 'feat-choice' as const, featId: 'crafter' as FeatId },
      },
    };
    const { bundles, expandedFeats } = collectBundles(buildWithCrafter);
    const result = resolveCharacter({
      baseAbilities: buildWithCrafter.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithCrafter.choices,
      levels: buildWithCrafter.levels,
      expandedFeats,
    });
    const toolPending = result.pendingChoices.filter((c) => c.type === 'tool-choice' && c.source.origin === 'feat');
    expect(toolPending).toHaveLength(1);
    if (toolPending[0].type === 'tool-choice') {
      expect(toolPending[0].count).toBe(3);
    }
  });

  it('(e) Human + Magic Initiate decided: a feature-choice pending with source.origin feat is emitted', () => {
    const buildWithMagicInitiate: CharacterBuild = {
      ...humanBaseL1,
      choices: {
        [featChoiceKey]: { type: 'feat-choice' as const, featId: 'magic-initiate' as FeatId },
      },
    };
    const { bundles, expandedFeats } = collectBundles(buildWithMagicInitiate);
    const result = resolveCharacter({
      baseAbilities: buildWithMagicInitiate.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithMagicInitiate.choices,
      levels: buildWithMagicInitiate.levels,
      expandedFeats,
    });
    const featureChoicePending = result.pendingChoices.filter(
      (c) => c.type === 'feature-choice' && c.source.origin === 'feat'
    );
    expect(featureChoicePending).toHaveLength(1);
  });

  it('(f) feat-choice→skill END-TO-END: Human + Versatile=skilled + 3 skills decided → skill proficiencies with source.origin feat', () => {
    const skillChoiceKey = createChoiceKey('skill-choice', 'feat', 'skilled', 0);
    const buildWithSkilledDecided: CharacterBuild = {
      ...humanBaseL1,
      choices: {
        [featChoiceKey]: { type: 'feat-choice' as const, featId: 'skilled' as FeatId },
        [skillChoiceKey]: { type: 'skill-choice' as const, skills: ['arcana', 'history', 'nature'] as const },
      },
    };
    const { bundles, expandedFeats } = collectBundles(buildWithSkilledDecided);
    const result = resolveCharacter({
      baseAbilities: buildWithSkilledDecided.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithSkilledDecided.choices,
      levels: buildWithSkilledDecided.levels,
      expandedFeats,
    });
    // All 3 picked skills must be proficient with at least one source from feat origin
    for (const skillId of ['arcana', 'history', 'nature'] as const) {
      const skill = result.skills[skillId];
      expect(skill.proficient, `${skillId} should be proficient`).toBe(true);
      expect(
        skill.sources.some((s) => s.origin === 'feat'),
        `${skillId} source should include feat origin`
      ).toBe(true);
    }
    // No pending feat-choice or skill-choice from feat
    expect(result.pendingChoices.filter((c) => c.type === 'feat-choice')).toHaveLength(0);
    expect(result.pendingChoices.filter((c) => c.type === 'skill-choice' && c.source.origin === 'feat')).toHaveLength(
      0
    );
  });

  it('(g) Magic Initiate finalize-ready: Human + Versatile=magic-initiate + class decision cleric → no feature-choice or feat-choice pending', () => {
    const magicInitiateFeatureChoiceKey = createChoiceKey('feature-choice', 'feat', 'magic-initiate', 0);
    const buildWithMagicInitiateDecided: CharacterBuild = {
      ...humanBaseL1,
      choices: {
        [featChoiceKey]: { type: 'feat-choice' as const, featId: 'magic-initiate' as FeatId },
        [magicInitiateFeatureChoiceKey]: { type: 'feature-choice' as const, optionId: 'cleric' },
      },
    };
    const { bundles, expandedFeats } = collectBundles(buildWithMagicInitiateDecided);
    const result = resolveCharacter({
      baseAbilities: buildWithMagicInitiateDecided.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithMagicInitiateDecided.choices,
      levels: buildWithMagicInitiateDecided.levels,
      expandedFeats,
    });
    const remainingFeatOrFeatureChoices = result.pendingChoices.filter(
      (c) => c.type === 'feat-choice' || c.type === 'feature-choice'
    );
    expect(
      remainingFeatOrFeatureChoices,
      'build with magic-initiate fully decided should have no pending feat-choice or feature-choice'
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// feat-choice invalid decision (Fix 6)
// ---------------------------------------------------------------------------

describe('feat-choice decision with unknown featId', () => {
  it('collectBundles emits a warning and does not throw when decision.featId is unresolvable', () => {
    const featChoiceKey = createChoiceKey('feat-choice', 'species', 'human', 0);
    const buildWithBadFeat: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: null,
      baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      abilityMethod: 'standard-array',
      levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
      choices: {
        [featChoiceKey]: { type: 'feat-choice' as const, featId: 'nonexistent-feat' as FeatId },
      },
      feats: [],
      activeItems: [],
    };
    let result: ReturnType<typeof collectBundles>;
    expect(() => {
      result = collectBundles(buildWithBadFeat);
    }).not.toThrow();
    expect(result!.warnings.some((w) => w.includes('nonexistent-feat'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Single-pass safety invariant
// ---------------------------------------------------------------------------
// collectBundles expands feature-choice options in a single pass (not a fixpoint).
// This means any option grant of type 'feat', 'lineage-choice', or 'feature-choice'
// would be silently dropped. The invariant test below iterates every feature-choice
// grant across ALL sources and asserts no option contains such a grant.
// If this test goes red, promote the expansion to a fixpoint loop before merging.

describe('feature-choice single-pass safety invariant', () => {
  it('no feature-choice option grant has type feat, lineage-choice, or feature-choice across all sources', () => {
    const FORBIDDEN_GRANT_TYPES = new Set(['feat', 'lineage-choice', 'feature-choice']);

    // Collect all feature-choice grants from every source collection.
    // Classes: levels[].grants; Subclasses: features[].grants; others: .grants
    const violations: string[] = [];

    function checkGrants(sourceLabel: string, grants: readonly { type: string }[]) {
      for (const grant of grants) {
        if (grant.type === 'feature-choice') {
          const fcGrant = grant as {
            type: 'feature-choice';
            options: readonly { optionId: string; grants: readonly { type: string }[] }[];
            key: string;
          };
          for (const option of fcGrant.options) {
            for (const optionGrant of option.grants) {
              if (FORBIDDEN_GRANT_TYPES.has(optionGrant.type)) {
                violations.push(
                  `${sourceLabel} feature-choice key="${String(fcGrant.key)}" option="${option.optionId}" has forbidden grant type "${optionGrant.type}"`
                );
              }
            }
          }
        }
      }
    }

    for (const source of SPECIES_SOURCES) {
      checkGrants(`species:${source.id}`, source.grants);
    }

    for (const source of CLASS_SOURCES) {
      for (const [i, level] of source.levels.entries()) {
        checkGrants(`class:${source.id}:level${i + 1}`, level.grants);
      }
    }

    for (const [subclassId, source] of Object.entries(SUBCLASS_SOURCES)) {
      for (const feature of source.features) {
        checkGrants(`subclass:${subclassId}:classLevel${feature.classLevel}`, feature.grants);
      }
    }

    for (const source of BACKGROUND_SOURCES) {
      checkGrants(`background:${source.id}`, source.grants);
    }

    for (const source of FEAT_SOURCES) {
      checkGrants(`feat:${source.id}`, source.grants);
    }

    expect(
      violations,
      'feature-choice option grants must not contain feat, lineage-choice, or feature-choice — ' +
        'collectBundles expands options in a single pass and would silently drop these. ' +
        'Promote to a fixpoint loop before adding such an option.'
    ).toHaveLength(0);
  });
});

describe('spell-choice validation in collectBundles', () => {
  const druidL1Build: CharacterBuild = {
    speciesId: 'human' as SpeciesId,
    backgroundId: null,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'druid' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {},
    feats: [],
    activeItems: [],
  };

  it('invalid spellId emits a warning and is absent from resolved cantrips', () => {
    const choiceKey = createChoiceKey('spell-choice', 'class', 'druid', 0);
    const buildWithInvalid: CharacterBuild = {
      ...druidL1Build,
      choices: {
        [choiceKey]: {
          type: 'spell-choice',
          spellIds: ['druidcraft', 'fireball'] as readonly SpellId[],
        },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };

    const { bundles, warnings, expandedFeats } = collectBundles(buildWithInvalid);
    expect(warnings.some((w) => w.includes('fireball'))).toBe(true);

    const resolved = resolveCharacter({
      baseAbilities: buildWithInvalid.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithInvalid.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting?.cantrips).toContain('druidcraft');
    expect(resolved.spellcasting?.cantrips).not.toContain('fireball');
  });

  it('valid spellIds still resolve normally when mixed with an invalid id', () => {
    const choiceKey = createChoiceKey('spell-choice', 'class', 'druid', 0);
    const buildWithMixed: CharacterBuild = {
      ...druidL1Build,
      choices: {
        [choiceKey]: {
          type: 'spell-choice',
          spellIds: ['guidance', 'fireball'] as readonly SpellId[],
        },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };

    const { bundles, warnings, expandedFeats } = collectBundles(buildWithMixed);
    expect(warnings.some((w) => w.includes('fireball'))).toBe(true);

    const resolved = resolveCharacter({
      baseAbilities: buildWithMixed.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithMixed.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting?.cantrips).toContain('guidance');
    expect(resolved.spellcasting?.cantrips).not.toContain('fireball');
  });
});

describe('spell-choice duplicate-id gate (resolver)', () => {
  const druidL1Build: CharacterBuild = {
    speciesId: 'human' as SpeciesId,
    backgroundId: null,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'druid' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {},
    feats: [],
    activeItems: [],
  };

  it('two duplicate spellIds with count=2 still emits spell-choice pending', () => {
    const choiceKey = createChoiceKey('spell-choice', 'class', 'druid', 0);
    const buildWithDupes: CharacterBuild = {
      ...druidL1Build,
      choices: {
        [choiceKey]: {
          type: 'spell-choice',
          spellIds: ['guidance', 'guidance'] as readonly SpellId[],
        },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };

    const { bundles, expandedFeats } = collectBundles(buildWithDupes);
    const resolved = resolveCharacter({
      baseAbilities: buildWithDupes.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithDupes.choices,
      expandedFeats,
    });

    const spellChoicePending = resolved.pendingChoices.filter((c) => c.type === 'spell-choice');
    expect(spellChoicePending.length).toBe(1);
  });
});

describe('Druid L1 cantrip spell-choice (end-to-end)', () => {
  const druidL1Build: CharacterBuild = {
    speciesId: 'human' as SpeciesId,
    backgroundId: null,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'druid' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {},
    feats: [],
    activeItems: [],
  };

  it('no decision → pendingChoices includes a spell-choice with count=2, spellList=druid, spellLevel=0', () => {
    const { bundles, expandedFeats } = collectBundles(druidL1Build);
    const resolved = resolveCharacter({
      baseAbilities: druidL1Build.baseAbilities,
      level: 1,
      bundles,
      choices: {},
      expandedFeats,
    });
    const spellChoicePending = resolved.pendingChoices.filter((c) => c.type === 'spell-choice');
    expect(spellChoicePending.length).toBe(1);
    const pending = spellChoicePending[0];
    if (pending.type === 'spell-choice') {
      expect(pending.count).toBe(2);
      expect(pending.spellList).toBe('druid');
      expect(pending.spellLevel).toBe(0);
    }
  });

  it('with 2 cantrip decisions → resolved.spellcasting.cantrips contains those 2, no spell-choice pending', () => {
    const choiceKey = createChoiceKey('spell-choice', 'class', 'druid', 0);
    const spellDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['druidcraft', 'thorn-whip'] as readonly SpellId[],
    };
    const buildWithDecision: CharacterBuild = {
      ...druidL1Build,
      choices: { [choiceKey]: spellDecision } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };

    const { bundles, expandedFeats } = collectBundles(buildWithDecision);
    const resolved = resolveCharacter({
      baseAbilities: buildWithDecision.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithDecision.choices,
      expandedFeats,
    });

    expect(resolved.spellcasting).not.toBeNull();
    expect(resolved.spellcasting!.cantrips).toContain('druidcraft');
    expect(resolved.spellcasting!.cantrips).toContain('thorn-whip');

    const spellChoicePending = resolved.pendingChoices.filter((c) => c.type === 'spell-choice');
    expect(spellChoicePending.length).toBe(0);
  });

  it('with only 1 cantrip decision → still has spell-choice pending (underfilled)', () => {
    const choiceKey = createChoiceKey('spell-choice', 'class', 'druid', 0);
    const partialDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['guidance'] as readonly SpellId[],
    };
    const buildWithPartialDecision: CharacterBuild = {
      ...druidL1Build,
      choices: { [choiceKey]: partialDecision } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };

    const { bundles, expandedFeats } = collectBundles(buildWithPartialDecision);
    const resolved = resolveCharacter({
      baseAbilities: buildWithPartialDecision.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithPartialDecision.choices,
      expandedFeats,
    });

    const spellChoicePending = resolved.pendingChoices.filter((c) => c.type === 'spell-choice');
    expect(spellChoicePending.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Wildheart Barbarian — innate always-prepared spells e2e
// ---------------------------------------------------------------------------

describe('Wildheart Barbarian innate spells e2e', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'barbarian', 0);

  function makeWildheart(classLevel: number): CharacterBuild {
    const levels = Array.from({ length: classLevel }, (_, i) => ({
      classId: 'barbarian' as ClassId,
      classLevel: i + 1,
      hpRoll: i === 0 ? (null as null) : 7,
    }));
    return {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'soldier' as BackgroundId,
      baseAbilities: { str: 16, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      abilityMethod: 'standard-array',
      levels,
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'wildheart' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
  }

  it('Wildheart L3: resolved.spellcasting is non-null', () => {
    const build = makeWildheart(3);
    const { bundles, expandedFeats } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
      levels: build.levels,
      expandedFeats,
    });
    expect(result.spellcasting).not.toBeNull();
  });

  it('Wildheart L3: alwaysPreparedSpells contains speak-with-animals', () => {
    const build = makeWildheart(3);
    const { bundles, expandedFeats } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
      levels: build.levels,
      expandedFeats,
    });
    expect(result.spellcasting?.alwaysPreparedSpells).toContain('speak-with-animals');
  });

  it('Wildheart L3: ability/spellSaveDC/spellAttackBonus are null (no spellcasting grant)', () => {
    const build = makeWildheart(3);
    const { bundles, expandedFeats } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
      levels: build.levels,
      expandedFeats,
    });
    expect(result.spellcasting?.ability).toBeNull();
    expect(result.spellcasting?.spellSaveDC).toBeNull();
    expect(result.spellcasting?.spellAttackBonus).toBeNull();
  });

  it('Wildheart L10: alwaysPreparedSpells contains both speak-with-animals and commune-with-nature', () => {
    const build = makeWildheart(10);
    const { bundles, expandedFeats } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 10,
      bundles,
      choices: build.choices,
      levels: build.levels,
      expandedFeats,
    });
    expect(result.spellcasting?.alwaysPreparedSpells).toContain('speak-with-animals');
    expect(result.spellcasting?.alwaysPreparedSpells).toContain('commune-with-nature');
  });
});
