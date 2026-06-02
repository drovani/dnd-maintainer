import { describe, it, expect } from 'vitest';
import type { GrantBundle } from '@/types/sources';
import { resolveResourcePools } from '@/lib/resolver/resource-pools';

function classBundles(
  classId: 'monk' | 'sorcerer',
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
