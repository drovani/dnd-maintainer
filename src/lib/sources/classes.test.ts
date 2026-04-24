import { describe, it, expect } from 'vitest';
import { getClassSource } from '@/lib/sources';
import { createChoiceKey } from '@/types/choices';
import type { ClassId } from '@/lib/dnd-helpers';

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

  it('level 4 grants an ASI with 2 points', () => {
    const level4 = source?.levels[3];
    expect(level4?.grants).toHaveLength(1);
    const grant = level4?.grants[0];
    expect(grant?.type).toBe('asi');
    if (grant?.type === 'asi') {
      expect(grant.points).toBe(2);
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'fighter', 0));
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

  it('level 10 has no class-level grants (subclass features injected separately)', () => {
    const level10 = source?.levels[9];
    expect(level10?.grants).toHaveLength(0);
  });

  it('level 11 and beyond have no grants (empty stubs)', () => {
    const level11 = source?.levels[10];
    expect(level11?.grants).toHaveLength(0);
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
