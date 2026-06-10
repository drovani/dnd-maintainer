import { describe, it, expect } from 'vitest';
import type { GrantBundle } from '@/types/sources';
import { resolveResourcePools } from '@/lib/resolver/resource-pools';

function classBundles(
  classId: 'monk' | 'sorcerer' | 'barbarian',
  count: number,
  extraGrants: GrantBundle['grants'] = []
): GrantBundle[] {
  const bundles: GrantBundle[] = [];
  for (let level = 1; level <= count; level++) {
    bundles.push({
      source: { origin: 'class', id: classId, level },
      grants: level === 2 ? extraGrants : [],
    });
  }
  return bundles;
}

describe('resolveResourcePools', () => {
  it('returns empty when no resource-pool grants exist', () => {
    expect(resolveResourcePools(classBundles('monk', 5))).toEqual([]);
  });

  it('computes class-level pool max equal to the count of class bundles', () => {
    const bundles = classBundles('monk', 5, [
      {
        type: 'resource-pool',
        poolId: 'focus-points',
        max: { mode: 'class-level', classId: 'monk' },
        regen: 'short-rest',
      },
    ]);
    const pools = resolveResourcePools(bundles);
    expect(pools).toHaveLength(1);
    expect(pools[0]).toMatchObject({ poolId: 'focus-points', max: 5, regen: 'short-rest' });
  });

  it('uses fixed value when max mode is fixed', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'feat', id: 'magic-initiate' },
        grants: [{ type: 'resource-pool', poolId: 'example', max: { mode: 'fixed', value: 3 }, regen: 'long-rest' }],
      },
    ];
    const pools = resolveResourcePools(bundles);
    expect(pools).toHaveLength(1);
    expect(pools[0].max).toBe(3);
    expect(pools[0].regen).toBe('long-rest');
  });

  it('counts only bundles for the named class when computing class-level max', () => {
    const monkBundles = classBundles('monk', 3, [
      {
        type: 'resource-pool',
        poolId: 'focus-points',
        max: { mode: 'class-level', classId: 'monk' },
        regen: 'short-rest',
      },
    ]);
    const sorcererBundles = classBundles('sorcerer', 2);
    const pools = resolveResourcePools([...monkBundles, ...sorcererBundles]);
    expect(pools[0].max).toBe(3);
  });

  it('preserves compound regen on the resolved pool unchanged', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'subclass', id: 'psiwarrior', classId: 'fighter', level: 3 },
        grants: [
          {
            type: 'resource-pool',
            poolId: 'psionic-energy',
            max: { mode: 'fixed', value: 4 },
            regen: { mode: 'compound', shortRestAmount: 1 },
          },
        ],
      },
    ];
    const pools = resolveResourcePools(bundles);
    expect(pools).toHaveLength(1);
    expect(pools[0].max).toBe(4);
    expect(pools[0].regen).toEqual({ mode: 'compound', shortRestAmount: 1 });
  });

  it('omits dieSize when the pool declares no dieSizeSteps', () => {
    const bundles = classBundles('monk', 5, [
      {
        type: 'resource-pool',
        poolId: 'focus-points',
        max: { mode: 'class-level', classId: 'monk' },
        regen: 'short-rest',
      },
    ]);
    const pools = resolveResourcePools(bundles);
    expect(pools[0].dieSize).toBeUndefined();
  });

  describe('class-level-plus max (Celestial Patron Healing Light)', () => {
    const HEAL_GRANT: GrantBundle['grants'][number] = {
      type: 'resource-pool',
      poolId: 'healing-light',
      max: { mode: 'class-level-plus', classId: 'warlock', offset: 1 },
      regen: 'long-rest',
    };

    function warlockAtLevel(level: number): GrantBundle[] {
      const bundles: GrantBundle[] = [];
      for (let l = 1; l <= level; l++) {
        bundles.push({
          source: { origin: 'class', id: 'warlock', level: l },
          grants: l === 1 ? [HEAL_GRANT] : [],
        });
      }
      return bundles;
    }

    // max = warlock level + 1
    it.each([
      [1, 2],
      [5, 6],
      [10, 11],
      [20, 21],
    ])('resolves healing-light max to level+1 at warlock level %i', (level, expectedMax) => {
      const pools = resolveResourcePools(warlockAtLevel(level));
      expect(pools).toHaveLength(1);
      expect(pools[0]).toMatchObject({ poolId: 'healing-light', max: expectedMax, regen: 'long-rest' });
    });
  });

  describe('dieSizeSteps (Psionic Energy die scaling)', () => {
    const PSIONIC_GRANT: GrantBundle['grants'][number] = {
      type: 'resource-pool',
      poolId: 'psionic-energy',
      max: {
        mode: 'level-steps',
        classId: 'fighter',
        steps: [
          { minLevel: 3, value: 4 },
          { minLevel: 5, value: 6 },
          { minLevel: 9, value: 8 },
          { minLevel: 13, value: 10 },
          { minLevel: 17, value: 12 },
        ],
      },
      regen: { mode: 'compound', shortRestAmount: 1 },
      dieSizeSteps: [
        { minLevel: 3, dieSize: 6 },
        { minLevel: 5, dieSize: 8 },
        { minLevel: 9, dieSize: 10 },
        { minLevel: 13, dieSize: 12 },
      ],
    };

    function psiwarriorAtLevel(level: number): GrantBundle[] {
      const bundles: GrantBundle[] = [];
      for (let l = 1; l <= level; l++) {
        bundles.push({
          source: { origin: 'class', id: 'fighter', level: l },
          grants: l === 3 ? [PSIONIC_GRANT] : [],
        });
      }
      return bundles;
    }

    it.each([
      [3, 4, 6],
      [4, 4, 6],
      [5, 6, 8],
      [8, 6, 8],
      [9, 8, 10],
      [12, 8, 10],
      [13, 10, 12],
      [17, 12, 12],
      [20, 12, 12],
    ])('at fighter level %i: max=%i dice of size d%i', (level, expectedMax, expectedDie) => {
      const pools = resolveResourcePools(psiwarriorAtLevel(level));
      expect(pools).toHaveLength(1);
      expect(pools[0].max).toBe(expectedMax);
      expect(pools[0].dieSize).toBe(expectedDie);
      expect(pools[0].regen).toEqual({ mode: 'compound', shortRestAmount: 1 });
    });
  });

  describe('level-steps max (Barbarian Rage table)', () => {
    const RAGE_GRANT: GrantBundle['grants'][number] = {
      type: 'resource-pool',
      poolId: 'rage',
      max: {
        mode: 'level-steps',
        classId: 'barbarian',
        steps: [
          { minLevel: 1, value: 2 },
          { minLevel: 3, value: 3 },
          { minLevel: 6, value: 4 },
          { minLevel: 12, value: 5 },
          { minLevel: 17, value: 6 },
        ],
      },
      regen: 'long-rest',
    };

    function barbarianAtLevel(level: number): GrantBundle[] {
      const bundles: GrantBundle[] = [];
      for (let l = 1; l <= level; l++) {
        bundles.push({
          source: { origin: 'class', id: 'barbarian', level: l },
          grants: l === 1 ? [RAGE_GRANT] : [],
        });
      }
      return bundles;
    }

    it.each([
      [1, 2],
      [2, 2],
      [3, 3],
      [5, 3],
      [6, 4],
      [11, 4],
      [12, 5],
      [16, 5],
      [17, 6],
      [20, 6],
    ])('resolves rage max to %i uses at barbarian level %i', (level, expectedMax) => {
      const pools = resolveResourcePools(barbarianAtLevel(level));
      expect(pools).toHaveLength(1);
      expect(pools[0]).toMatchObject({ poolId: 'rage', max: expectedMax, regen: 'long-rest' });
    });
  });

  describe('proficiency-bonus max (Paladin Channel Divinity)', () => {
    const CD_GRANT: GrantBundle['grants'][number] = {
      type: 'resource-pool',
      poolId: 'channel-divinity',
      max: { mode: 'proficiency-bonus', classId: 'paladin' },
      regen: 'short-rest',
    };

    function paladinAtLevel(level: number): GrantBundle[] {
      const bundles: GrantBundle[] = [];
      for (let l = 1; l <= level; l++) {
        bundles.push({
          source: { origin: 'class', id: 'paladin', level: l },
          grants: l === 2 ? [CD_GRANT] : [],
        });
      }
      return bundles;
    }

    // Levels chosen to discriminate PB from a raw-level fallthrough: at L5 PB=3≠5, at L9 PB=4≠9, etc.
    it.each([
      [2, 2],
      [4, 2],
      [5, 3],
      [8, 3],
      [9, 4],
      [12, 4],
      [13, 5],
      [16, 5],
      [17, 6],
      [20, 6],
    ])('resolves channel-divinity max to PB at paladin level %i', (level, expectedMax) => {
      const pools = resolveResourcePools(paladinAtLevel(level));
      expect(pools).toHaveLength(1);
      expect(pools[0]).toMatchObject({ poolId: 'channel-divinity', max: expectedMax, regen: 'short-rest' });
    });
  });

  it('tags pool with its source bundle', () => {
    const bundles = classBundles('monk', 4, [
      {
        type: 'resource-pool',
        poolId: 'focus-points',
        max: { mode: 'class-level', classId: 'monk' },
        regen: 'short-rest',
      },
    ]);
    const pools = resolveResourcePools(bundles);
    expect(pools[0].source).toEqual({ origin: 'class', id: 'monk', level: 2 });
  });
});
