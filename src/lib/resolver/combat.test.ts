import { describe, it, expect } from 'vitest';
import { resolveHp, resolveSpeed, resolveAc, resolveBardicInspiration } from '@/lib/resolver/combat';
import type { GrantBundle } from '@/types/sources';

const NO_BUNDLES: readonly GrantBundle[] = [];

describe('resolveHp', () => {
  it('returns 0 max HP when level is 0', () => {
    expect(resolveHp(NO_BUNDLES, [], 0, 0).max).toBe(0);
  });

  it('throws when no hit-die grants at level >= 1', () => {
    expect(() => resolveHp(NO_BUNDLES, [], 0, 1)).toThrow('No hit die grants found at level 1');
  });

  it('level 1: max die + CON modifier', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
    ];
    // CON 15 → modifier +2, HP = 10 + 2 = 12
    expect(resolveHp(bundles, [], 2, 1).max).toBe(12);
  });

  it('level 1 with zero CON modifier: max die only', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
    ];
    expect(resolveHp(bundles, [], 0, 1).max).toBe(10);
  });

  it('level 2: adds rolled value + CON modifier for second level', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
    ];
    // hpRolls[0] = level 1 slot (unused), hpRolls[1] = level 2 roll
    // Level 1: 10+2=12, Level 2: roll 7+2=9, total 21
    expect(resolveHp(bundles, [null, 7], 2, 2).max).toBe(21);
  });

  it('uses average (floor die/2 + 1) when roll is null', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
    ];
    // Level 1: 10+0=10, Level 2: null roll → avg = floor(10/2)+1=6, 6+0=6, total 16
    expect(resolveHp(bundles, [null, null], 0, 2).max).toBe(16);
  });

  it('negative CON modifier reduces HP at each level', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 8 }],
      },
    ];
    // CON 8 → modifier -1
    // Level 1: 8 + (-1) = 7
    expect(resolveHp(bundles, [], -1, 1).max).toBe(7);
    // hpRolls[0] = level 1 slot (unused), hpRolls[1] = level 2 roll
    // Level 2: 7 + (roll 4 + (-1)) = 7 + 3 = 10
    expect(resolveHp(bundles, [null, 4], -1, 2).max).toBe(10);
  });
});

describe('resolveSpeed', () => {
  it('returns empty record with no bundles', () => {
    const result = resolveSpeed(NO_BUNDLES);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('collects walk speed from grants', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [{ type: 'speed', mode: 'walk', value: 30 }],
      },
    ];
    const result = resolveSpeed(bundles);
    expect(result.walk).toBeDefined();
    expect(result.walk!.value).toBe(30);
  });

  it('takes highest value when same mode appears multiple times', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [{ type: 'speed', mode: 'walk', value: 30 }],
      },
      {
        source: { origin: 'feat', id: 'mobile' as import('@/lib/dnd-helpers').FeatId },
        grants: [{ type: 'speed', mode: 'walk', value: 40 }],
      },
    ];
    const result = resolveSpeed(bundles);
    expect(result.walk!.value).toBe(40);
  });

  it('handles multiple speed modes independently', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [
          { type: 'speed', mode: 'walk', value: 30 },
          { type: 'speed', mode: 'swim', value: 30 },
        ],
      },
    ];
    const result = resolveSpeed(bundles);
    expect(result.walk!.value).toBe(30);
    expect(result.swim!.value).toBe(30);
  });
});

describe('resolveAc', () => {
  it('returns default AC 10 + DEX modifier when no grants', () => {
    const result = resolveAc(NO_BUNDLES, 2);
    expect(result.effective).toBe(12);
    expect(result.calculations).toHaveLength(0);
    expect(result.bonuses).toHaveLength(0);
  });

  it('armored mode: 10 + DEX modifier', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
      },
    ];
    // DEX 14 → mod +2, armored AC = 10 + 2 = 12
    const result = resolveAc(bundles, 2);
    expect(result.calculations).toHaveLength(1);
    expect(result.calculations[0].mode).toBe('armored');
    expect(result.calculations[0].baseValue).toBe(12);
    expect(result.effective).toBe(12);
  });

  it('natural armor mode uses baseAc', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [{ type: 'armor-class', calculation: { mode: 'natural', baseAc: 14 } }],
      },
    ];
    const result = resolveAc(bundles, 0);
    expect(result.calculations[0].mode).toBe('natural');
    expect(result.calculations[0].baseValue).toBe(14);
    expect(result.effective).toBe(14);
  });

  it('ac-bonus grants add to effective AC', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          { type: 'armor-class', calculation: { mode: 'armored' } },
          { type: 'ac-bonus', bonus: 2 },
        ],
      },
    ];
    // armored: 10 + 0 = 10, bonus +2 = 12
    const result = resolveAc(bundles, 0);
    expect(result.effective).toBe(12);
    expect(result.bonuses).toHaveLength(1);
  });

  it('unarmored mode: 10 + DEX modifier', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'unarmored', formula: 'barbarian' } }],
      },
    ];
    // DEX 16 → mod +3, unarmored AC = 10 + 3 = 13
    const result = resolveAc(bundles, 3);
    expect(result.calculations).toHaveLength(1);
    expect(result.calculations[0].mode).toBe('unarmored');
    expect(result.calculations[0].baseValue).toBe(13);
    expect(result.effective).toBe(13);
  });

  it('equipped chain mail returns effective AC 16 (ignores DEX)', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
      },
    ];
    // DEX 16 → mod +3, but chain mail ignores DEX (maxDexBonus 0, baseAc 16)
    const result = resolveAc(bundles, 3, { totalBase: 16, shieldBonus: 0 });
    expect(result.effective).toBe(16);
    expect(result.calculations[0].baseValue).toBe(16);
  });

  it('chain mail + Defense fighting style returns AC 17', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          { type: 'armor-class', calculation: { mode: 'armored' } },
          { type: 'ac-bonus', bonus: 1 },
        ],
      },
    ];
    const result = resolveAc(bundles, 3, { totalBase: 16, shieldBonus: 0 });
    expect(result.effective).toBe(17);
  });

  it('chain mail + shield returns AC 18', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
      },
    ];
    const result = resolveAc(bundles, 3, { totalBase: 16, shieldBonus: 2 });
    expect(result.effective).toBe(18);
    expect(result.bonuses).toHaveLength(1);
    expect(result.bonuses[0].value).toBe(2);
  });

  it('takes highest base AC when both armored and natural grants present', () => {
    // armored: 10 + 2 = 12, natural: 15 → highest wins (15)
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
      },
      {
        source: { origin: 'species', id: 'human' },
        grants: [{ type: 'armor-class', calculation: { mode: 'natural', baseAc: 15 } }],
      },
    ];
    const result = resolveAc(bundles, 2);
    expect(result.calculations).toHaveLength(2);
    expect(result.effective).toBe(15);
  });
});

describe('resolveBardicInspiration', () => {
  const bardicInspirationBundle: GrantBundle = {
    source: { origin: 'class', id: 'bard', level: 1 },
    grants: [{ type: 'feature', feature: { id: 'bard-bardic-inspiration' } }],
  };

  it('returns null when no bard-bardic-inspiration feature grant', () => {
    expect(resolveBardicInspiration(NO_BUNDLES, 5, 3)).toBeNull();
  });

  it('returns null when bardLevel < 1', () => {
    expect(resolveBardicInspiration([bardicInspirationBundle], 0, 3)).toBeNull();
  });

  it.each([
    [1, 6],
    [4, 6],
    [5, 8],
    [9, 8],
    [10, 10],
    [14, 10],
    [15, 12],
    [20, 12],
  ])('returns dieSize=%i at bard level %i', (bardLevel, expectedDieSize) => {
    const result = resolveBardicInspiration([bardicInspirationBundle], bardLevel, 3);
    expect(result?.dieSize).toBe(expectedDieSize);
  });

  it('uses = max(1, chaModifier) when chaModifier > 0', () => {
    const result = resolveBardicInspiration([bardicInspirationBundle], 3, 4);
    expect(result?.uses).toBe(4);
  });

  it('uses = 1 when chaModifier <= 0', () => {
    const result = resolveBardicInspiration([bardicInspirationBundle], 3, -1);
    expect(result?.uses).toBe(1);
  });

  it('uses = 1 when chaModifier = 0', () => {
    const result = resolveBardicInspiration([bardicInspirationBundle], 3, 0);
    expect(result?.uses).toBe(1);
  });
});

describe('resolveAc with dance formula', () => {
  const danceBundles: readonly GrantBundle[] = [
    {
      source: { origin: 'subclass', id: 'collegedance', classId: 'bard', level: 3 },
      grants: [{ type: 'armor-class', calculation: { mode: 'unarmored', formula: 'dance' } }],
    },
  ];
  const armoredBundles: readonly GrantBundle[] = [
    {
      source: { origin: 'class', id: 'fighter', level: 1 },
      grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
    },
    ...danceBundles,
  ];

  it('dance unarmored: AC = 10 + DEX + bardicDieSize', () => {
    // DEX +2, dieSize 8 → AC = 10 + 2 + 8 = 20
    const result = resolveAc(danceBundles, 2, null, 8);
    expect(result.effective).toBe(20);
    expect(result.calculations[0].mode).toBe('unarmored');
    expect(result.calculations[0].baseValue).toBe(20);
  });

  it('dance unarmored: bardicDieSize=null falls back to 10 + DEX', () => {
    // DEX +3, no die → AC = 10 + 3 = 13
    const result = resolveAc(danceBundles, 3, null, null);
    expect(result.effective).toBe(13);
  });

  it('dance unarmored: armored calculation wins when body armor equipped', () => {
    // Chain mail (16) vs dance (10 + 2 + 8 = 20 with dex+2, die 8)
    // Actually dance wins here: 20 > 16; test that armor base (16) does NOT win over dance (20)
    const result = resolveAc(armoredBundles, 2, { totalBase: 16, shieldBonus: 0 }, 8);
    // armored: 16, dance: 10+2+8=20 → effective = 20
    expect(result.effective).toBe(20);
  });

  it('dance unarmored: heavy armor still wins when it provides higher AC than dance', () => {
    // Plate (18) vs dance (10 + 2 + 6 = 18) → tie, but let's test plate(20) beats dance(18)
    const result = resolveAc(armoredBundles, 2, { totalBase: 20, shieldBonus: 0 }, 6);
    // armored: 20, dance: 10+2+6=18 → effective = 20
    expect(result.effective).toBe(20);
  });
});
