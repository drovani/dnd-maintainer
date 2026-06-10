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

    it('resolves to just the offset (no crash) when the named class is absent (level 0)', () => {
      const otherClassBundles = classBundles('monk', 3); // no warlock bundles
      const pools = resolveResourcePools([
        ...otherClassBundles,
        { source: { origin: 'class', id: 'monk', level: 1 }, grants: [HEAL_GRANT] },
      ]);
      expect(pools).toHaveLength(1);
      // warlock level 0 + offset 1 = 1 (clamp at 0 does not fire for a positive offset)
      expect(pools[0].max).toBe(1);
    });

    it('clamps a negative offset that underflows below 0 to 0', () => {
      const NEG_GRANT: GrantBundle['grants'][number] = {
        type: 'resource-pool',
        poolId: 'underflow',
        max: { mode: 'class-level-plus', classId: 'warlock', offset: -5 },
        regen: 'long-rest',
      };
      const bundles: GrantBundle[] = [
        { source: { origin: 'class', id: 'warlock', level: 1 }, grants: [NEG_GRANT] },
        { source: { origin: 'class', id: 'warlock', level: 2 }, grants: [] },
      ];
      // warlock level 2 + (-5) = -3 → clamped to 0
      const pools = resolveResourcePools(bundles);
      expect(pools[0].max).toBe(0);
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
      // Die size scales d6 (L3) → d8 (L5) → d10 (L11) → d12 (L17) — distinct thresholds from the count steps.
      dieSizeSteps: [
        { minLevel: 3, dieSize: 6 },
        { minLevel: 5, dieSize: 8 },
        { minLevel: 11, dieSize: 10 },
        { minLevel: 17, dieSize: 12 },
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

    // [fighter level, expected max (2×PB), expected die size]. Die transitions at 5/11/17; count at 5/9/13/17.
    it.each([
      [3, 4, 6],
      [4, 4, 6],
      [5, 6, 8],
      [9, 8, 8], // count steps to 8, die still d8 (d10 not until L11)
      [10, 8, 8],
      [11, 8, 10], // die steps to d10 here, count unchanged at 8
      [13, 10, 10], // count steps to 10, die still d10
      [16, 10, 10],
      [17, 12, 12],
      [20, 12, 12],
    ])('at fighter level %i: max=%i dice of size d%i', (level, expectedMax, expectedDie) => {
      const pools = resolveResourcePools(psiwarriorAtLevel(level));
      expect(pools).toHaveLength(1);
      expect(pools[0].max).toBe(expectedMax);
      expect(pools[0].dieSize).toBe(expectedDie);
      expect(pools[0].regen).toEqual({ mode: 'compound', shortRestAmount: 1 });
    });

    it('drops dieSize (and does not throw) when dieSizeSteps is declared on a fixed-max pool', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'feat', id: 'magic-initiate' },
          grants: [
            {
              type: 'resource-pool',
              poolId: 'misconfigured',
              max: { mode: 'fixed', value: 3 },
              regen: 'long-rest',
              dieSizeSteps: [{ minLevel: 1, dieSize: 6 }],
            },
          ],
        },
      ];
      const pools = resolveResourcePools(bundles);
      expect(pools).toHaveLength(1);
      expect(pools[0].max).toBe(3);
      expect(pools[0].dieSize).toBeUndefined();
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
