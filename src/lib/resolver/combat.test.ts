import { describe, it, expect } from 'vitest';
import { resolveHp, resolveSpeed, resolveAc } from '@/lib/resolver/combat';
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

  it('hp-bonus grant adds perLevel * level on top of base HP', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'barbarian', level: 1 },
        grants: [{ type: 'hit-die', die: 12 }],
      },
      {
        source: { origin: 'race', id: 'dwarf-hill' },
        grants: [{ type: 'hp-bonus', perLevel: 1 }],
      },
    ];
    // Level 1: die 12 + CON 0 = 12, plus 1×1 = 13
    expect(resolveHp(bundles, [], 0, 1).max).toBe(13);
    // Level 5 with null rolls: 12 + 4×(avg 7 + 0) = 12 + 28 = 40, plus 1×5 = 45
    expect(resolveHp(bundles, [null, null, null, null, null], 0, 5).max).toBe(45);
  });

  it('hp-bonus stacks when multiple grants present', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
      {
        source: { origin: 'race', id: 'dwarf-hill' },
        grants: [{ type: 'hp-bonus', perLevel: 1 }],
      },
      {
        source: { origin: 'feat', id: 'tough' },
        grants: [{ type: 'hp-bonus', perLevel: 2 }],
      },
    ];
    // Level 3 with rolled 6, 6: 10 + 6 + 6 = 22, plus (1+2)×3 = 9 → 31
    expect(resolveHp(bundles, [null, 6, 6], 0, 3).max).toBe(31);
  });

  it('hp-bonus does not apply when level is 0', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'dwarf-hill' },
        grants: [{ type: 'hp-bonus', perLevel: 1 }],
      },
    ];
    expect(resolveHp(bundles, [], 0, 0).max).toBe(0);
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
        source: { origin: 'race', id: 'human' },
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
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'speed', mode: 'walk', value: 30 }],
      },
      {
        source: { origin: 'feat', id: 'mobile' },
        grants: [{ type: 'speed', mode: 'walk', value: 40 }],
      },
    ];
    const result = resolveSpeed(bundles);
    expect(result.walk!.value).toBe(40);
  });

  it('handles multiple speed modes independently', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
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
    const result = resolveAc(NO_BUNDLES, 2, 0, 0);
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
    const result = resolveAc(bundles, 2, 0, 0);
    expect(result.calculations).toHaveLength(1);
    expect(result.calculations[0].mode).toBe('armored');
    expect(result.calculations[0].baseValue).toBe(12);
    expect(result.effective).toBe(12);
  });

  it('natural armor mode uses baseAc', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'armor-class', calculation: { mode: 'natural', baseAc: 14 } }],
      },
    ];
    const result = resolveAc(bundles, 0, 0, 0);
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
    const result = resolveAc(bundles, 0, 0, 0);
    expect(result.effective).toBe(12);
    expect(result.bonuses).toHaveLength(1);
  });

  it('unarmored barbarian formula: 10 + DEX + CON modifier', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'barbarian', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'unarmored', formula: 'barbarian' } }],
      },
    ];
    // DEX 16 → mod +3, CON 14 → mod +2, unarmored AC = 10 + 3 + 2 = 15
    const result = resolveAc(bundles, 3, 2, 0);
    expect(result.calculations).toHaveLength(1);
    expect(result.calculations[0].mode).toBe('unarmored');
    expect(result.calculations[0].baseValue).toBe(15);
    expect(result.effective).toBe(15);
  });

  it('unarmored barbarian formula with zero CON: 10 + DEX only', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'barbarian', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'unarmored', formula: 'barbarian' } }],
      },
    ];
    // DEX 16 → mod +3, CON 10 → mod 0, AC = 13
    const result = resolveAc(bundles, 3, 0, 0);
    expect(result.calculations[0].baseValue).toBe(13);
    expect(result.effective).toBe(13);
  });

  it('unarmored monk formula: 10 + DEX + WIS modifier', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'monk', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'unarmored', formula: 'monk' } }],
      },
    ];
    // DEX 14 → mod +2, WIS 16 → mod +3, unarmored AC = 10 + 2 + 3 = 15
    const result = resolveAc(bundles, 2, 0, 3);
    expect(result.calculations).toHaveLength(1);
    expect(result.calculations[0].mode).toBe('unarmored');
    expect(result.calculations[0].baseValue).toBe(15);
    expect(result.effective).toBe(15);
  });

  it('equipped chain mail returns effective AC 16 (ignores DEX)', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
      },
    ];
    // DEX 16 → mod +3, but chain mail ignores DEX (maxDexBonus 0, baseAc 16)
    const result = resolveAc(bundles, 3, 0, 0, { totalBase: 16, shieldBonus: 0 });
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
    const result = resolveAc(bundles, 3, 0, 0, { totalBase: 16, shieldBonus: 0 });
    expect(result.effective).toBe(17);
  });

  it('chain mail + shield returns AC 18', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
      },
    ];
    const result = resolveAc(bundles, 3, 0, 0, { totalBase: 16, shieldBonus: 2 });
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
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'armor-class', calculation: { mode: 'natural', baseAc: 15 } }],
      },
    ];
    const result = resolveAc(bundles, 2, 0, 0);
    expect(result.calculations).toHaveLength(2);
    expect(result.effective).toBe(15);
  });
});
