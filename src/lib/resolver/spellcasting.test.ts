import { describe, it, expect } from 'vitest';
import { resolveSpellcasting } from '@/lib/resolver/spellcasting';
import type { GrantBundle } from '@/types/sources';
import type { AbilityKey } from '@/lib/dnd-helpers';
import type { ResolvedAbility } from '@/types/resolved';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAbility(total: number): ResolvedAbility {
  const modifier = Math.floor((total - 10) / 2);
  return { base: total, bonuses: [], total, modifier };
}

function makeAbilities(
  overrides: Partial<Record<AbilityKey, number>> = {}
): Readonly<Record<AbilityKey, ResolvedAbility>> {
  const defaults: Record<AbilityKey, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const merged = { ...defaults, ...overrides };
  return {
    str: makeAbility(merged.str),
    dex: makeAbility(merged.dex),
    con: makeAbility(merged.con),
    int: makeAbility(merged.int),
    wis: makeAbility(merged.wis),
    cha: makeAbility(merged.cha),
  };
}

function makeClericBundles(level: number): GrantBundle[] {
  return [
    {
      source: { origin: 'class', id: 'cleric', level },
      grants: [{ type: 'spellcasting', ability: 'wis', source: 'class' }],
    },
  ];
}

function makePaladinBundles(level: number): GrantBundle[] {
  return [
    {
      source: { origin: 'class', id: 'paladin', level },
      grants: [{ type: 'spellcasting', ability: 'cha', source: 'class' }],
    },
  ];
}

function makeRangerBundles(level: number): GrantBundle[] {
  return [
    {
      source: { origin: 'class', id: 'ranger', level },
      grants: [{ type: 'spellcasting', ability: 'wis', source: 'class' }],
    },
  ];
}

function makeWarlockBundles(level: number): GrantBundle[] {
  return [
    {
      source: { origin: 'class', id: 'warlock', level },
      grants: [{ type: 'spellcasting', ability: 'cha', source: 'class' }],
    },
  ];
}

function makeBardBundles(level: number): GrantBundle[] {
  return [
    {
      source: { origin: 'class', id: 'bard', level },
      grants: [{ type: 'spellcasting', ability: 'cha', source: 'class' }],
    },
  ];
}

const NO_BUNDLES: readonly GrantBundle[] = [];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveSpellcasting', () => {
  const defaultAbilities = makeAbilities();

  it('returns null when no spellcasting grants', () => {
    expect(resolveSpellcasting(NO_BUNDLES, defaultAbilities, 2, 1)).toBeNull();
  });

  it('computes spellSaveDC = 8 + proficiencyBonus + abilityMod', () => {
    // WIS 16 → mod +3, PB 2 → DC = 8 + 2 + 3 = 13
    const abilities = makeAbilities({ wis: 16 });
    const result = resolveSpellcasting(makeClericBundles(1), abilities, 2, 1);
    expect(result).not.toBeNull();
    expect(result!.spellSaveDC).toBe(13);
  });

  it('computes spellAttackBonus = proficiencyBonus + abilityMod', () => {
    // WIS 16 → mod +3, PB 3 → bonus = 3 + 3 = 6
    const abilities = makeAbilities({ wis: 16 });
    const result = resolveSpellcasting(makeClericBundles(5), abilities, 3, 5);
    expect(result).not.toBeNull();
    expect(result!.spellAttackBonus).toBe(6);
  });

  describe('full caster (cleric) spell slots', () => {
    const abilities = makeAbilities({ wis: 14 });

    it('level 1: [2]', () => {
      const result = resolveSpellcasting(makeClericBundles(1), abilities, 2, 1);
      expect(result!.slots).toEqual([2]);
      expect(result!.pactMagic).toBeNull();
    });

    it('level 5: [4, 3, 2]', () => {
      const result = resolveSpellcasting(makeClericBundles(5), abilities, 3, 5);
      expect(result!.slots).toEqual([4, 3, 2]);
    });

    it('level 11: [4, 3, 3, 3, 2, 1]', () => {
      const result = resolveSpellcasting(makeClericBundles(11), abilities, 4, 11);
      expect(result!.slots).toEqual([4, 3, 3, 3, 2, 1]);
    });

    it('level 20: [4, 3, 3, 3, 3, 2, 2, 1, 1]', () => {
      const result = resolveSpellcasting(makeClericBundles(20), abilities, 6, 20);
      expect(result!.slots).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
    });
  });

  describe('half caster (paladin) spell slots', () => {
    const abilities = makeAbilities({ cha: 12 });

    it('level 1: empty slots (not yet a caster)', () => {
      const result = resolveSpellcasting(makePaladinBundles(1), abilities, 2, 1);
      expect(result!.slots).toEqual([]);
    });

    it('level 5: [4, 2]', () => {
      const result = resolveSpellcasting(makePaladinBundles(5), abilities, 3, 5);
      expect(result!.slots).toEqual([4, 2]);
    });
  });

  describe('warlock pact magic', () => {
    const abilities = makeAbilities({ cha: 16 });

    it('level 1: pactMagic { count: 1, slotLevel: 1 }, slots is empty array', () => {
      const result = resolveSpellcasting(makeWarlockBundles(1), abilities, 2, 1);
      expect(result!.slots).toEqual([]);
      expect(result!.pactMagic).toEqual({ count: 1, slotLevel: 1 });
    });

    it('level 5: pactMagic { count: 2, slotLevel: 3 }', () => {
      const result = resolveSpellcasting(makeWarlockBundles(5), abilities, 3, 5);
      expect(result!.slots).toEqual([]);
      expect(result!.pactMagic).toEqual({ count: 2, slotLevel: 3 });
    });

    it('level 11: pactMagic { count: 3, slotLevel: 5 }', () => {
      const result = resolveSpellcasting(makeWarlockBundles(11), abilities, 4, 11);
      expect(result!.slots).toEqual([]);
      expect(result!.pactMagic).toEqual({ count: 3, slotLevel: 5 });
    });

    it('level 17: pactMagic { count: 4, slotLevel: 5 }', () => {
      const result = resolveSpellcasting(makeWarlockBundles(17), abilities, 6, 17);
      expect(result!.slots).toEqual([]);
      expect(result!.pactMagic).toEqual({ count: 4, slotLevel: 5 });
    });
  });

  describe('preparedCount', () => {
    it('cleric L5 wis+3 → 8', () => {
      const abilities = makeAbilities({ wis: 16 });
      const result = resolveSpellcasting(makeClericBundles(5), abilities, 3, 5);
      expect(result!.preparedCount).toBe(8);
    });

    it('paladin L4 cha+1 → 5', () => {
      const abilities = makeAbilities({ cha: 12 });
      const result = resolveSpellcasting(makePaladinBundles(4), abilities, 2, 4);
      expect(result!.preparedCount).toBe(5);
    });

    it('ranger L8 wis+2 → 10', () => {
      const abilities = makeAbilities({ wis: 14 });
      const result = resolveSpellcasting(makeRangerBundles(8), abilities, 3, 8);
      expect(result!.preparedCount).toBe(10);
    });

    it('bard L5 → preparedCount 0 (known-spell caster)', () => {
      const abilities = makeAbilities({ cha: 16 });
      const result = resolveSpellcasting(makeBardBundles(5), abilities, 3, 5);
      expect(result!.preparedCount).toBe(0);
    });

    it('warlock L5 → preparedCount 0 (known-spell caster)', () => {
      const abilities = makeAbilities({ cha: 16 });
      const result = resolveSpellcasting(makeWarlockBundles(5), abilities, 3, 5);
      expect(result!.preparedCount).toBe(0);
    });

    it('floors preparedCount at 1 when level + mod would be 0 or negative (cleric L1 wis-2)', () => {
      const abilities = makeAbilities({ wis: 6 });
      const result = resolveSpellcasting(makeClericBundles(1), abilities, 2, 1);
      expect(result!.preparedCount).toBe(1);
    });
  });

  describe('spell grant routing', () => {
    it('alwaysPrepared=true goes to alwaysPreparedSpells', () => {
      const bundles: GrantBundle[] = [
        ...makeClericBundles(1),
        {
          source: { origin: 'class', id: 'cleric', level: 1 },
          grants: [{ type: 'spell', spellId: 'bless', alwaysPrepared: true }],
        },
      ];
      const result = resolveSpellcasting(bundles, defaultAbilities, 2, 1);
      expect(result!.alwaysPreparedSpells).toContain('bless');
      expect(result!.knownSpells).not.toContain('bless');
    });

    it('alwaysPrepared=false goes to knownSpells', () => {
      const bundles: GrantBundle[] = [
        ...makeClericBundles(1),
        {
          source: { origin: 'class', id: 'cleric', level: 1 },
          grants: [{ type: 'spell', spellId: 'guiding-bolt', alwaysPrepared: false }],
        },
      ];
      const result = resolveSpellcasting(bundles, defaultAbilities, 2, 1);
      expect(result!.knownSpells).toContain('guiding-bolt');
      expect(result!.alwaysPreparedSpells).not.toContain('guiding-bolt');
    });
  });

  it('non-class spellcasting source (feat) returns empty slots, null pactMagic, 0 preparedCount', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'feat', id: 'magic-initiate-wizard' },
        grants: [{ type: 'spellcasting', ability: 'int', source: 'feat' }],
      },
    ];
    const abilities = makeAbilities({ int: 14 });
    const result = resolveSpellcasting(bundles, abilities, 2, 1);
    expect(result).not.toBeNull();
    expect(result!.slots).toEqual([]);
    expect(result!.pactMagic).toBeNull();
    expect(result!.preparedCount).toBe(0);
  });
});
