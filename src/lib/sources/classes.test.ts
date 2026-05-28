import { describe, it, expect } from 'vitest';
import { getClassSource } from '@/lib/sources';
import { createChoiceKey } from '@/types/choices';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses';
import type { ClassId } from '@/lib/dnd-helpers';
import type { Grant, FeatureChoiceGrant } from '@/types/grants';
import gamedata from '@/locales/en/gamedata.json';

describe('Fighter class levels 2–10 grant structures', () => {
  const source = getClassSource('fighter' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('level 2 grants fighter-action-surge feature', () => {
    const level2 = source?.levels[1];
    expect(level2?.grants).toHaveLength(1);
    const grant = level2?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('fighter-action-surge');
    }
  });

  it('level 3 grants a subclass choice for fighter', () => {
    const level3 = source?.levels[2];
    expect(level3?.grants).toHaveLength(1);
    const grant = level3?.grants[0];
    expect(grant?.type).toBe('subclass');
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('fighter');
      expect(grant.key).toBe(createChoiceKey('subclass', 'class', 'fighter', 0));
    }
  });

  it('level 4 grants an ASI with 2 points and a weapon mastery choice', () => {
    const level4 = source?.levels[3];
    expect(level4?.grants).toHaveLength(2);
    const asiGrant = level4?.grants.find((g) => g.type === 'asi');
    expect(asiGrant?.type).toBe('asi');
    if (asiGrant?.type === 'asi') {
      expect(asiGrant.points).toBe(2);
      expect(asiGrant.key).toBe(createChoiceKey('asi', 'class', 'fighter', 0));
    }
    const masteryGrant = level4?.grants.find((g) => g.type === 'weapon-mastery-choice');
    expect(masteryGrant?.type).toBe('weapon-mastery-choice');
    if (masteryGrant?.type === 'weapon-mastery-choice') {
      expect(masteryGrant.count).toBe(1);
    }
  });

  it('level 5 grants fighter-extra-attack feature', () => {
    const level5 = source?.levels[4];
    expect(level5?.grants).toHaveLength(1);
    const grant = level5?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('fighter-extra-attack');
    }
  });

  it('level 6 grants an ASI with 2 points (index 1)', () => {
    const level6 = source?.levels[5];
    expect(level6?.grants).toHaveLength(1);
    const grant = level6?.grants[0];
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.points).toBe(2);
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'fighter', 1));
    }
  });

  it('level 7 has no class-level grants (subclass features injected separately)', () => {
    const level7 = source?.levels[6];
    expect(level7?.grants).toHaveLength(0);
  });

  it('level 8 grants an ASI with 2 points (index 2)', () => {
    const level8 = source?.levels[7];
    expect(level8?.grants).toHaveLength(1);
    const grant = level8?.grants[0];
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.points).toBe(2);
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'fighter', 2));
    }
  });

  it('level 9 grants fighter-indomitable feature', () => {
    const level9 = source?.levels[8];
    expect(level9?.grants).toHaveLength(1);
    const grant = level9?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('fighter-indomitable');
    }
  });

  it('level 10 grants a weapon mastery choice', () => {
    const level10 = source?.levels[9];
    expect(level10?.grants).toHaveLength(1);
    const grant = level10?.grants[0];
    expect(grant?.type).toBe('weapon-mastery-choice');
    if (grant?.type === 'weapon-mastery-choice') {
      expect(grant.count).toBe(1);
    }
  });

  it('level 11 and beyond have no grants (empty stubs)', () => {
    const level11 = source?.levels[10];
    expect(level11?.grants).toHaveLength(0);
  });

  it('level 16 grants a weapon mastery choice (index 3)', () => {
    const level16 = source?.levels[15];
    expect(level16?.grants).toHaveLength(1);
    const grant = level16?.grants[0];
    expect(grant?.type).toBe('weapon-mastery-choice');
    if (grant?.type === 'weapon-mastery-choice') {
      expect(grant.count).toBe(1);
      expect(grant.key).toBe(createChoiceKey('weapon-mastery-choice', 'class', 'fighter', 3));
    }
  });

  it('still has 20 levels total', () => {
    expect(source?.levels).toHaveLength(20);
  });
});

describe('Rogue class grant structures', () => {
  const source = getClassSource('rogue' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels defined', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 8', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(8);
    }
  });

  it('level 1 has skill-choice grant for 4 skills', () => {
    const grant = source?.levels[0].grants.find((g) => g.type === 'proficiency-choice' && g.category === 'skill');
    expect(grant?.type).toBe('proficiency-choice');
    if (grant?.type === 'proficiency-choice' && grant.category === 'skill') {
      expect(grant.count).toBe(4);
      expect(grant.key).toBe(createChoiceKey('skill-choice', 'class', 'rogue', 0));
    }
  });

  it('level 1 has one expertise-choice grant with count 2', () => {
    const expertiseGrants = source?.levels[0].grants.filter((g) => g.type === 'expertise-choice');
    expect(expertiseGrants).toHaveLength(1);
    if (expertiseGrants?.[0]?.type === 'expertise-choice') {
      expect(expertiseGrants[0].count).toBe(2);
      expect(expertiseGrants[0].key).toBe(createChoiceKey('expertise-choice', 'class', 'rogue', 0));
      expect(expertiseGrants[0].from).toBeNull();
      expect(expertiseGrants[0].fromTools).toContain('thievestools');
    }
  });

  it('level 1 has sneak attack and thieves cant features', () => {
    const features = source?.levels[0].grants.filter((g) => g.type === 'feature');
    const featureIds = features?.map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('rogue-sneak-attack');
    expect(featureIds).toContain('rogue-thieves-cant');
  });

  it('level 1 has a weapon-mastery-choice grant with count 2', () => {
    const grant = source?.levels[0].grants.find((g) => g.type === 'weapon-mastery-choice');
    expect(grant?.type).toBe('weapon-mastery-choice');
    if (grant?.type === 'weapon-mastery-choice') {
      expect(grant.count).toBe(2);
      expect(grant.key).toBe(createChoiceKey('weapon-mastery-choice', 'class', 'rogue', 0));
    }
  });

  it('level 2 grants cunning action feature', () => {
    const grant = source?.levels[1].grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('rogue-cunning-action');
    }
  });

  it('level 3 grants a subclass choice for rogue', () => {
    const grant = source?.levels[2].grants[0];
    expect(grant?.type).toBe('subclass');
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('rogue');
      expect(grant.key).toBe(createChoiceKey('subclass', 'class', 'rogue', 0));
    }
  });

  it('level 4 grants an ASI with index 0', () => {
    const grant = source?.levels[3].grants[0];
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'rogue', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 5 grants uncanny dodge', () => {
    const grant = source?.levels[4].grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('rogue-uncanny-dodge');
    }
  });

  it('level 6 grants second expertise-choice (index 1)', () => {
    const grant = source?.levels[5].grants[0];
    expect(grant?.type).toBe('expertise-choice');
    if (grant?.type === 'expertise-choice') {
      expect(grant.count).toBe(2);
      expect(grant.key).toBe(createChoiceKey('expertise-choice', 'class', 'rogue', 1));
    }
  });

  it('level 7 grants evasion', () => {
    const grant = source?.levels[6].grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('rogue-evasion');
    }
  });

  it('level 8 grants an ASI with index 1', () => {
    const grant = source?.levels[7].grants[0];
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'rogue', 1));
    }
  });

  it('level 9 is EMPTY_LEVEL', () => {
    expect(source?.levels[8].grants).toHaveLength(0);
  });

  it('level 10 grants an ASI with index 2', () => {
    const grant = source?.levels[9].grants[0];
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'rogue', 2));
    }
  });

  it('levels 11–20 are EMPTY_LEVEL', () => {
    for (let i = 10; i < 20; i++) {
      expect(source?.levels[i].grants).toHaveLength(0);
    }
  });

  it('level 1 has 4 bundle-choice grants', () => {
    const bundleChoices = source?.levels[0].grants.filter((g) => g.type === 'bundle-choice');
    expect(bundleChoices).toHaveLength(4);
  });

  it('level 1 bundle-choice 0 is loadout with rogue-loadout', () => {
    const grant = source?.levels[0].grants.find(
      (g) => g.type === 'bundle-choice' && g.key === createChoiceKey('bundle-choice', 'class', 'rogue', 0)
    );
    expect(grant?.type).toBe('bundle-choice');
    if (grant?.type === 'bundle-choice') {
      expect(grant.category).toBe('loadout');
      expect(grant.bundleIds).toEqual(['rogue-loadout']);
    }
  });

  it('level 1 bundle-choice 1 is melee-weapon with rapier and shortsword options', () => {
    const grant = source?.levels[0].grants.find(
      (g) => g.type === 'bundle-choice' && g.key === createChoiceKey('bundle-choice', 'class', 'rogue', 1)
    );
    expect(grant?.type).toBe('bundle-choice');
    if (grant?.type === 'bundle-choice') {
      expect(grant.category).toBe('melee-weapon');
      expect(grant.bundleIds).toEqual(['rogue-rapier', 'rogue-shortsword-melee']);
    }
  });

  it('level 1 bundle-choice 2 is ranged-weapon with shortbow-kit and shortsword options', () => {
    const grant = source?.levels[0].grants.find(
      (g) => g.type === 'bundle-choice' && g.key === createChoiceKey('bundle-choice', 'class', 'rogue', 2)
    );
    expect(grant?.type).toBe('bundle-choice');
    if (grant?.type === 'bundle-choice') {
      expect(grant.category).toBe('ranged-weapon');
      expect(grant.bundleIds).toEqual(['rogue-shortbow-kit', 'rogue-shortsword-ranged']);
    }
  });

  it('level 1 bundle-choice 3 is pack with burglar, dungeoneer, and explorer options', () => {
    const grant = source?.levels[0].grants.find(
      (g) => g.type === 'bundle-choice' && g.key === createChoiceKey('bundle-choice', 'class', 'rogue', 3)
    );
    expect(grant?.type).toBe('bundle-choice');
    if (grant?.type === 'bundle-choice') {
      expect(grant.category).toBe('pack');
      expect(grant.bundleIds).toEqual(['burglars-pack', 'dungeoneers-pack', 'explorers-pack']);
    }
  });
});

describe('CLASS_SOURCES contains all 12 classes', () => {
  it('has exactly 12 class sources', () => {
    expect(CLASS_SOURCES).toHaveLength(12);
  });

  it('contains all expected class IDs', () => {
    const ids = CLASS_SOURCES.map((c) => c.id);
    expect(ids).toContain('barbarian');
    expect(ids).toContain('bard');
    expect(ids).toContain('cleric');
    expect(ids).toContain('druid');
    expect(ids).toContain('fighter');
    expect(ids).toContain('monk');
    expect(ids).toContain('paladin');
    expect(ids).toContain('ranger');
    expect(ids).toContain('rogue');
    expect(ids).toContain('sorcerer');
    expect(ids).toContain('warlock');
    expect(ids).toContain('wizard');
  });

  it('every class has exactly 20 levels', () => {
    for (const classSource of CLASS_SOURCES) {
      expect(classSource.levels, `${classSource.id} should have 20 levels`).toHaveLength(20);
    }
  });

  it('every class has a subclass grant at level 3 (index 2)', () => {
    for (const classSource of CLASS_SOURCES) {
      const level3Grants = classSource.levels[2].grants;
      const subclassGrant = level3Grants.find((g) => g.type === 'subclass');
      expect(subclassGrant, `${classSource.id} should have a subclass grant at level 3`).toBeDefined();
      if (subclassGrant?.type === 'subclass') {
        expect(subclassGrant.classId).toBe(classSource.id);
      }
    }
  });
});

describe('Barbarian class grant structures', () => {
  const source = getClassSource('barbarian' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 12', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(12);
    }
  });

  it('level 1 has barbarian unarmored AC formula', () => {
    const acGrant = source?.levels[0].grants.find((g) => g.type === 'armor-class');
    expect(acGrant?.type).toBe('armor-class');
    if (acGrant?.type === 'armor-class') {
      expect(acGrant.calculation.mode).toBe('unarmored');
      if (acGrant.calculation.mode === 'unarmored') {
        expect(acGrant.calculation.formula).toBe('barbarian');
      }
    }
  });

  it('level 1 has rage and unarmored-defense features', () => {
    const features = source?.levels[0].grants.filter((g) => g.type === 'feature');
    const featureIds = features?.map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('barbarian-rage');
    expect(featureIds).toContain('barbarian-unarmored-defense');
  });

  it('level 3 has a subclass grant for barbarian', () => {
    const grant = source?.levels[2].grants.find((g) => g.type === 'subclass');
    expect(grant?.type).toBe('subclass');
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('barbarian');
      expect(grant.key).toBe(createChoiceKey('subclass', 'class', 'barbarian', 0));
    }
  });

  it('level 4 has an ASI (index 0)', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'asi');
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'barbarian', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 4 has a weapon-mastery-choice grant with count 1', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'weapon-mastery-choice');
    expect(grant?.type).toBe('weapon-mastery-choice');
    if (grant?.type === 'weapon-mastery-choice') {
      expect(grant.count).toBe(1);
      expect(grant.key).toBe(createChoiceKey('weapon-mastery-choice', 'class', 'barbarian', 1));
    }
  });

  it('level 5 has extra-attack and fast-movement features', () => {
    const featureIds = source?.levels[4].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('barbarian-extra-attack');
    expect(featureIds).toContain('barbarian-fast-movement');
  });

  it('level 10 has a weapon-mastery-choice grant with count 1', () => {
    const grant = source?.levels[9].grants.find((g) => g.type === 'weapon-mastery-choice');
    expect(grant?.type).toBe('weapon-mastery-choice');
    if (grant?.type === 'weapon-mastery-choice') {
      expect(grant.count).toBe(1);
      expect(grant.key).toBe(createChoiceKey('weapon-mastery-choice', 'class', 'barbarian', 2));
    }
  });

  it('level 20 has primal-champion feature', () => {
    const grant = source?.levels[19].grants.find((g) => g.type === 'feature');
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('barbarian-primal-champion');
    }
  });
});

describe('Bard class grant structures', () => {
  const source = getClassSource('bard' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 8', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(8);
    }
  });

  it('level 1 has spellcasting grant with cha', () => {
    const grant = source?.levels[0].grants.find((g) => g.type === 'spellcasting');
    expect(grant?.type).toBe('spellcasting');
    if (grant?.type === 'spellcasting') {
      expect(grant.ability).toBe('cha');
    }
  });

  it('level 1 has bardic-inspiration feature', () => {
    const featureIds = source?.levels[0].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('bard-bardic-inspiration');
  });

  it('level 3 has subclass and expertise-choice grants', () => {
    const grants = source?.levels[2].grants ?? [];
    expect(grants.find((g) => g.type === 'subclass')).toBeDefined();
    const expertiseGrant = grants.find((g) => g.type === 'expertise-choice');
    expect(expertiseGrant?.type).toBe('expertise-choice');
    if (expertiseGrant?.type === 'expertise-choice') {
      expect(expertiseGrant.key).toBe(createChoiceKey('expertise-choice', 'class', 'bard', 0));
      expect(expertiseGrant.count).toBe(2);
    }
  });

  it('level 4 has ASI (index 0)', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'asi');
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'bard', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 10 has magical-secrets feature and second expertise-choice', () => {
    const grants = source?.levels[9].grants ?? [];
    const featureIds = grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('bard-magical-secrets');
    const expertiseGrant = grants.find((g) => g.type === 'expertise-choice');
    expect(expertiseGrant?.type).toBe('expertise-choice');
    if (expertiseGrant?.type === 'expertise-choice') {
      expect(expertiseGrant.key).toBe(createChoiceKey('expertise-choice', 'class', 'bard', 1));
    }
  });
});

describe('Cleric class grant structures', () => {
  const source = getClassSource('cleric' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 8 and spellcasting with wis', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(8);
    }
    const spellcasting = source?.levels[0].grants.find((g) => g.type === 'spellcasting');
    expect(spellcasting?.type).toBe('spellcasting');
    if (spellcasting?.type === 'spellcasting') {
      expect(spellcasting.ability).toBe('wis');
    }
  });

  it('level 1 has a divine-order feature-choice between Protector and Thaumaturge', () => {
    const grant = source?.levels[0].grants.find((g) => g.type === 'feature-choice');
    expect(grant?.type).toBe('feature-choice');
    if (grant?.type === 'feature-choice') {
      expect(grant.key).toBe(createChoiceKey('feature-choice', 'class', 'cleric', 0));
      const optionIds = grant.options.map((o) => o.optionId);
      expect(optionIds).toEqual(['protector', 'thaumaturge']);
      const protector = grant.options.find((o) => o.optionId === 'protector');
      expect(protector?.featureId).toBe('cleric-divine-order-protector');
      const protectorProfs = protector?.grants.filter((g) => g.type === 'proficiency') ?? [];
      expect(protectorProfs).toHaveLength(2);
    }
  });

  it('level 7 has a blessed-strikes feature-choice between Divine Strike and Potent Spellcasting', () => {
    const grant = source?.levels[6].grants.find((g) => g.type === 'feature-choice');
    expect(grant?.type).toBe('feature-choice');
    if (grant?.type === 'feature-choice') {
      expect(grant.key).toBe(createChoiceKey('feature-choice', 'class', 'cleric', 1));
      const optionIds = grant.options.map((o) => o.optionId);
      expect(optionIds).toEqual(['divine-strike', 'potent-spellcasting']);
    }
  });

  it('level 3 has subclass grant for cleric', () => {
    const grant = source?.levels[2].grants.find((g) => g.type === 'subclass');
    expect(grant?.type).toBe('subclass');
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('cleric');
    }
  });

  it('level 4 has ASI (index 0)', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'asi');
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'cleric', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 20 has greater-divine-intervention feature', () => {
    const featureIds = source?.levels[19].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('cleric-greater-divine-intervention');
  });
});

describe('Druid class grant structures', () => {
  const source = getClassSource('druid' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 8 and spellcasting with wis', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(8);
    }
    const spellcasting = source?.levels[0].grants.find((g) => g.type === 'spellcasting');
    expect(spellcasting?.type).toBe('spellcasting');
    if (spellcasting?.type === 'spellcasting') {
      expect(spellcasting.ability).toBe('wis');
    }
  });

  it('level 1 has nonmetal armor proficiencies', () => {
    const armorIds = source?.levels[0].grants
      .filter((g) => g.type === 'proficiency' && g.category === 'armor')
      .map((g) => (g.type === 'proficiency' ? g.id : ''));
    expect(armorIds).toContain('medium-nonmetal');
    expect(armorIds).toContain('shields-nonmetal');
  });

  it('level 2 has wild-shape and wild-companion features', () => {
    const featureIds = source?.levels[1].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('druid-wild-shape');
    expect(featureIds).toContain('druid-wild-companion');
  });

  it('level 3 has subclass grant for druid', () => {
    const grant = source?.levels[2].grants.find((g) => g.type === 'subclass');
    expect(grant?.type).toBe('subclass');
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('druid');
    }
  });

  it('level 4 has ASI (index 0) and wild-shape-improvement-1', () => {
    const grants = source?.levels[3].grants ?? [];
    const asiGrant = grants.find((g) => g.type === 'asi');
    expect(asiGrant?.type).toBe('asi');
    if (asiGrant?.type === 'asi') {
      expect(asiGrant.points).toBe(2);
    }
    const featureIds = grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('druid-wild-shape-improvement-1');
  });

  it('level 20 has archdruid feature', () => {
    const featureIds = source?.levels[19].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('druid-archdruid');
  });
});

describe('Monk class grant structures', () => {
  const source = getClassSource('monk' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 8 and monk unarmored AC formula', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(8);
    }
    const acGrant = source?.levels[0].grants.find((g) => g.type === 'armor-class');
    if (acGrant?.type === 'armor-class' && acGrant.calculation.mode === 'unarmored') {
      expect(acGrant.calculation.formula).toBe('monk');
    }
  });

  it('level 2 has focus-points feature (not ki)', () => {
    const featureIds = source?.levels[1].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('monk-focus-points');
  });

  it('level 2 has resource-pool grant for focus-points', () => {
    const grant = source?.levels[1].grants.find((g) => g.type === 'resource-pool');
    expect(grant).toBeDefined();
    if (grant?.type === 'resource-pool') {
      expect(grant.poolId).toBe('focus-points');
      expect(grant.max.mode).toBe('class-level');
      if (grant.max.mode === 'class-level') {
        expect(grant.max.classId).toBe('monk');
      }
      expect(grant.regen).toBe('short-rest');
    }
  });

  it('level 3 has subclass grant and deflect-attacks feature', () => {
    const grants = source?.levels[2].grants ?? [];
    expect(grants.find((g) => g.type === 'subclass')).toBeDefined();
    const featureIds = grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('monk-deflect-attacks');
  });

  it('level 4 has ASI (index 0) and slow-fall feature', () => {
    const grants = source?.levels[3].grants ?? [];
    const asiGrant = grants.find((g) => g.type === 'asi');
    expect(asiGrant?.type).toBe('asi');
    if (asiGrant?.type === 'asi') {
      expect(asiGrant.points).toBe(2);
    }
    const featureIds = grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('monk-slow-fall');
  });

  it('level 20 has epic-boon feature', () => {
    const featureIds = source?.levels[19].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('monk-epic-boon');
  });
});

describe('Paladin class grant structures', () => {
  const source = getClassSource('paladin' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 10 and spellcasting with cha', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(10);
    }
    const spellcasting = source?.levels[0].grants.find((g) => g.type === 'spellcasting');
    expect(spellcasting?.type).toBe('spellcasting');
    if (spellcasting?.type === 'spellcasting') {
      expect(spellcasting.ability).toBe('cha');
    }
  });

  it('level 1 has lay-on-hands and divine-sense features', () => {
    const featureIds = source?.levels[0].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('paladin-lay-on-hands');
    expect(featureIds).toContain('paladin-divine-sense');
  });

  it('level 1 has a weapon-mastery-choice grant with count 2', () => {
    const grant = source?.levels[0].grants.find((g) => g.type === 'weapon-mastery-choice');
    expect(grant?.type).toBe('weapon-mastery-choice');
    if (grant?.type === 'weapon-mastery-choice') {
      expect(grant.count).toBe(2);
      expect(grant.key).toBe(createChoiceKey('weapon-mastery-choice', 'class', 'paladin', 0));
    }
  });

  it('level 3 has subclass grant for paladin', () => {
    const grant = source?.levels[2].grants.find((g) => g.type === 'subclass');
    expect(grant?.type).toBe('subclass');
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('paladin');
    }
  });

  it('level 4 has ASI (index 0)', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'asi');
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'paladin', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 6 has aura-of-protection feature', () => {
    const featureIds = source?.levels[5].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('paladin-aura-of-protection');
  });

  it('level 20 has epic-boon feature', () => {
    const featureIds = source?.levels[19].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('paladin-epic-boon');
  });
});

describe('Ranger class grant structures', () => {
  const source = getClassSource('ranger' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 10 but no spellcasting', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(10);
    }
    const spellcasting = source?.levels[0].grants.find((g) => g.type === 'spellcasting');
    expect(spellcasting).toBeUndefined();
  });

  it('level 1 has a weapon-mastery-choice grant with count 2', () => {
    const grant = source?.levels[0].grants.find((g) => g.type === 'weapon-mastery-choice');
    expect(grant?.type).toBe('weapon-mastery-choice');
    if (grant?.type === 'weapon-mastery-choice') {
      expect(grant.count).toBe(2);
      expect(grant.key).toBe(createChoiceKey('weapon-mastery-choice', 'class', 'ranger', 0));
    }
  });

  it('level 2 has spellcasting with wis and fighting-style-choice', () => {
    const grants = source?.levels[1].grants ?? [];
    const spellcasting = grants.find((g) => g.type === 'spellcasting');
    expect(spellcasting?.type).toBe('spellcasting');
    if (spellcasting?.type === 'spellcasting') {
      expect(spellcasting.ability).toBe('wis');
    }
    const fightingStyle = grants.find((g) => g.type === 'fighting-style-choice');
    expect(fightingStyle?.type).toBe('fighting-style-choice');
    if (fightingStyle?.type === 'fighting-style-choice') {
      expect(fightingStyle.key).toBe(createChoiceKey('fighting-style-choice', 'class', 'ranger', 0));
    }
  });

  it('level 3 has subclass grant', () => {
    const grants = source?.levels[2].grants ?? [];
    expect(grants.find((g) => g.type === 'subclass')).toBeDefined();
  });

  it('level 3 does not contain ranger-roving (2024 PHB places Roving at L6)', () => {
    const featureIds = (source?.levels[2].grants ?? [])
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).not.toContain('ranger-roving');
  });

  it('level 4 has ASI (index 0)', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'asi');
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'ranger', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 6 has expertise-choice (index 0)', () => {
    const grant = source?.levels[5].grants.find((g) => g.type === 'expertise-choice');
    expect(grant?.type).toBe('expertise-choice');
    if (grant?.type === 'expertise-choice') {
      expect(grant.key).toBe(createChoiceKey('expertise-choice', 'class', 'ranger', 0));
    }
  });

  it('level 6 has ranger-roving feature + walk-equivalent climb + swim grants', () => {
    const grants = source?.levels[5].grants ?? [];
    const featureIds = grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('ranger-roving');
    expect(grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'speed', mode: 'climb', value: 'walk-equivalent' }),
        expect.objectContaining({ type: 'speed', mode: 'swim', value: 'walk-equivalent' }),
      ])
    );
  });
});

describe('Sorcerer class grant structures', () => {
  const source = getClassSource('sorcerer' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 6 and spellcasting with cha', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(6);
    }
    const spellcasting = source?.levels[0].grants.find((g) => g.type === 'spellcasting');
    expect(spellcasting?.type).toBe('spellcasting');
    if (spellcasting?.type === 'spellcasting') {
      expect(spellcasting.ability).toBe('cha');
    }
  });

  it('level 1 has innate-sorcery feature', () => {
    const featureIds = source?.levels[0].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('sorcerer-innate-sorcery');
  });

  it('level 3 has subclass grant for sorcerer', () => {
    const grant = source?.levels[2].grants.find((g) => g.type === 'subclass');
    expect(grant?.type).toBe('subclass');
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('sorcerer');
    }
  });

  it('level 4 has ASI (index 0)', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'asi');
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'sorcerer', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 20 has sorcerous-restoration feature', () => {
    const featureIds = source?.levels[19].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('sorcerer-sorcerous-restoration');
  });
});

describe('Warlock class grant structures', () => {
  const source = getClassSource('warlock' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 8 and spellcasting with cha', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(8);
    }
    const spellcasting = source?.levels[0].grants.find((g) => g.type === 'spellcasting');
    expect(spellcasting?.type).toBe('spellcasting');
    if (spellcasting?.type === 'spellcasting') {
      expect(spellcasting.ability).toBe('cha');
    }
  });

  it('level 1 has eldritch-invocations and magical-cunning features', () => {
    const featureIds = source?.levels[0].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('warlock-eldritch-invocations');
    expect(featureIds).toContain('warlock-magical-cunning');
  });

  it('level 3 has subclass grant and pact-boon feature', () => {
    const grants = source?.levels[2].grants ?? [];
    expect(grants.find((g) => g.type === 'subclass')).toBeDefined();
    const featureIds = grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('warlock-pact-boon');
  });

  it('level 4 has ASI (index 0)', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'asi');
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'warlock', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 11 has mystic-arcanum-6 feature', () => {
    const featureIds = source?.levels[10].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('warlock-mystic-arcanum-6');
  });

  it('level 20 has eldritch-master feature', () => {
    const featureIds = source?.levels[19].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('warlock-eldritch-master');
  });
});

describe('Wizard class grant structures', () => {
  const source = getClassSource('wizard' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 has hit-die 6 and spellcasting with int', () => {
    const hitDie = source?.levels[0].grants.find((g) => g.type === 'hit-die');
    expect(hitDie?.type).toBe('hit-die');
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(6);
    }
    const spellcasting = source?.levels[0].grants.find((g) => g.type === 'spellcasting');
    expect(spellcasting?.type).toBe('spellcasting');
    if (spellcasting?.type === 'spellcasting') {
      expect(spellcasting.ability).toBe('int');
    }
  });

  it('level 1 has arcane-recovery feature', () => {
    const featureIds = source?.levels[0].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('wizard-arcane-recovery');
  });

  it('level 3 has subclass grant for wizard', () => {
    const grant = source?.levels[2].grants.find((g) => g.type === 'subclass');
    expect(grant?.type).toBe('subclass');
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('wizard');
    }
  });

  it('level 4 has ASI (index 0)', () => {
    const grant = source?.levels[3].grants.find((g) => g.type === 'asi');
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'wizard', 0));
      expect(grant.points).toBe(2);
    }
  });

  it('level 18 has spell-mastery feature', () => {
    const featureIds = source?.levels[17].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('wizard-spell-mastery');
  });

  it('level 20 has signature-spells feature', () => {
    const featureIds = source?.levels[19].grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).toContain('wizard-signature-spells');
  });
});

describe('FeatureChoiceGrant i18n coverage', () => {
  function collectFeatureChoices(grants: readonly Grant[]): FeatureChoiceGrant[] {
    return grants.filter((g): g is FeatureChoiceGrant => g.type === 'feature-choice');
  }

  it('every FeatureChoiceOption.featureId has a non-empty name and description in gamedata.json', () => {
    const featureIds = new Set<string>();
    for (const classSource of CLASS_SOURCES) {
      for (const level of classSource.levels) {
        for (const choice of collectFeatureChoices(level.grants)) {
          for (const option of choice.options) featureIds.add(option.featureId);
        }
      }
    }
    for (const subclassSource of Object.values(SUBCLASS_SOURCES)) {
      for (const feature of subclassSource.features) {
        for (const choice of collectFeatureChoices(feature.grants)) {
          for (const option of choice.options) featureIds.add(option.featureId);
        }
      }
    }

    const missing: string[] = [];
    const features = gamedata.features as Record<string, { name?: string; description?: string }>;
    for (const featureId of featureIds) {
      const entry = features[featureId];
      if (!entry?.name || entry.name.length === 0) missing.push(`${featureId}.name`);
      if (!entry?.description || entry.description.length === 0) missing.push(`${featureId}.description`);
    }
    expect(missing).toEqual([]);
  });
});
