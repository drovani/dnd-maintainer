import { describe, it, expect } from 'vitest';
import { getClassSource } from '@/lib/sources';
import { createChoiceKey } from '@/types/choices';
import type { ClassId } from '@/lib/dnd-helpers';

describe('Barbarian class source', () => {
  const source = getClassSource('barbarian' as ClassId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has exactly 20 levels', () => {
    expect(source?.levels).toHaveLength(20);
  });

  it('level 1 grants hit-die d12', () => {
    const level1 = source?.levels[0];
    const hitDie = level1?.grants.find((g) => g.type === 'hit-die');
    expect(hitDie).toBeDefined();
    if (hitDie?.type === 'hit-die') {
      expect(hitDie.die).toBe(12);
    }
  });

  it('level 1 grants unarmored AC with barbarian formula', () => {
    const level1 = source?.levels[0];
    const acGrant = level1?.grants.find((g) => g.type === 'armor-class');
    expect(acGrant).toBeDefined();
    if (acGrant?.type === 'armor-class') {
      expect(acGrant.calculation.mode).toBe('unarmored');
      if (acGrant.calculation.mode === 'unarmored') {
        expect(acGrant.calculation.formula).toBe('barbarian');
      }
    }
  });

  it('level 1 rage has usesCount 2', () => {
    const level1 = source?.levels[0];
    const rageGrant = level1?.grants.find((g) => g.type === 'feature' && g.feature.id === 'barbarian-rage');
    expect(rageGrant).toBeDefined();
    if (rageGrant?.type === 'feature') {
      expect(rageGrant.feature.usesCount).toBe(2);
    }
  });

  it('level 3 grants a subclass choice for barbarian', () => {
    const level3 = source?.levels[2];
    const subclassGrant = level3?.grants.find((g) => g.type === 'subclass');
    expect(subclassGrant).toBeDefined();
    if (subclassGrant?.type === 'subclass') {
      expect(subclassGrant.classId).toBe('barbarian');
      expect(subclassGrant.key).toBe(createChoiceKey('subclass', 'class', 'barbarian', 0));
    }
  });

  it('level 3 rage re-emit has usesCount 3', () => {
    const level3 = source?.levels[2];
    const rageGrant = level3?.grants.find((g) => g.type === 'feature' && g.feature.id === 'barbarian-rage');
    expect(rageGrant).toBeDefined();
    if (rageGrant?.type === 'feature') {
      expect(rageGrant.feature.usesCount).toBe(3);
    }
  });

  it('level 5 grants barbarian-fast-movement and walk speed 40', () => {
    const level5 = source?.levels[4];
    const fastMovement = level5?.grants.find((g) => g.type === 'feature' && g.feature.id === 'barbarian-fast-movement');
    expect(fastMovement).toBeDefined();
    const speedGrant = level5?.grants.find((g) => g.type === 'speed');
    expect(speedGrant).toBeDefined();
    if (speedGrant?.type === 'speed') {
      expect(speedGrant.mode).toBe('walk');
      expect(speedGrant.value).toBe(40);
    }
  });

  it('levels 11-20 are all empty', () => {
    for (let i = 10; i < 20; i++) {
      expect(source?.levels[i]?.grants).toHaveLength(0);
    }
  });
});

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
