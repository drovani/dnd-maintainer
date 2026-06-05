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

  it('psiwarrior psionic-energy pool resolves to max 4, regen long-rest', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'subclass', id: 'psiwarrior', classId: 'fighter', level: 3 },
        grants: [
          {
            type: 'resource-pool',
            poolId: 'psionic-energy',
            max: { mode: 'fixed', value: 4 },
            regen: 'long-rest',
          },
        ],
      },
    ];
    const pools = resolveResourcePools(bundles);
    expect(pools).toHaveLength(1);
    expect(pools[0]).toMatchObject({ poolId: 'psionic-energy', max: 4, regen: 'long-rest' });
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
