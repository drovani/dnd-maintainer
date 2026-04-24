import { describe, it, expect } from 'vitest';
import { resolveSpellcasting } from '@/lib/resolver/spellcasting';
import { getProficiencyBonus } from '@/lib/dnd-helpers';
import type { GrantBundle } from '@/types/sources';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';
import type { ResolvedAbility } from '@/types/resolved';
import type { AbilityKey } from '@/lib/dnd-helpers';
import { createChoiceKey } from '@/types/choices';
import type { SpellLevel } from '@/types/spells';

function makeAbilities(wis: number): Readonly<Record<AbilityKey, ResolvedAbility>> {
  const make = (score: number): ResolvedAbility => ({
    base: score,
    bonuses: [],
    total: score,
    modifier: Math.floor((score - 10) / 2),
  });
  return {
    str: make(10),
    dex: make(10),
    con: make(10),
    int: make(10),
    wis: make(wis),
    cha: make(10),
  };
}

/** Build a minimal spellcasting bundle for a given class */
function spellcastingBundle(classId: 'druid' | 'fighter'): GrantBundle {
  if (classId === 'fighter') {
    return {
      source: { origin: 'class', id: 'fighter', level: 1 },
      grants: [{ type: 'hit-die', die: 10 }],
    };
  }
  return {
    source: { origin: 'class', id: 'druid', level: 1 },
    grants: [{ type: 'spellcasting', ability: 'wis', source: 'class' }],
  };
}

/** Build a spell-choice grant bundle for cantrips */
function cantripChoiceBundle(
  keyIndex: number,
  spellIds: readonly string[],
  origin: 'class' | 'subclass' = 'class',
  originId = 'druid'
): { bundle: GrantBundle; key: ChoiceKey; decision: ChoiceDecision } {
  const category = origin === 'class' ? 'class' : 'subclass';
  const key = createChoiceKey('spell-choice', category as 'class' | 'subclass', originId, keyIndex);
  const bundle: GrantBundle = {
    source:
      origin === 'class'
        ? { origin: 'class', id: 'druid', level: 1 }
        : { origin: 'subclass', id: 'landcircle', classId: 'druid', level: 2 },
    grants: [
      {
        type: 'spell-choice',
        key,
        count: spellIds.length,
        fromList: 'druid',
        maxLevel: 0 as SpellLevel,
      },
    ],
  };
  const decision: ChoiceDecision = { type: 'spell-choice', spellIds };
  return { bundle, key, decision };
}

describe('resolveSpellcasting', () => {
  it('returns null for Fighter bundles (no spellcasting grant)', () => {
    const bundles: readonly GrantBundle[] = [spellcastingBundle('fighter')];
    const abilities = makeAbilities(10);
    const result = resolveSpellcasting(bundles, {
      classId: 'fighter',
      level: 1,
      abilities,
      proficiencyBonus: getProficiencyBonus(1),
      choices: {},
    });
    expect(result).toBeNull();
  });

  it('Druid L1 WIS 16: DC=13, attackBonus=+5, slots=[2], 2 cantrips from decision', () => {
    const { bundle: cantripBundle, key, decision } = cantripChoiceBundle(0, ['druidcraft', 'shillelagh']);
    const bundles: readonly GrantBundle[] = [spellcastingBundle('druid'), cantripBundle];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = { [key]: decision };
    const abilities = makeAbilities(16); // modifier +3
    const proficiencyBonus = getProficiencyBonus(1); // 2

    const result = resolveSpellcasting(bundles, {
      classId: 'druid',
      level: 1,
      abilities,
      proficiencyBonus,
      choices,
    });

    expect(result).not.toBeNull();
    expect(result!.spellSaveDC).toBe(13); // 8 + 2 + 3
    expect(result!.spellAttackBonus).toBe(5); // 2 + 3
    expect(result!.slots).toEqual([2]);
    expect(result!.cantrips).toHaveLength(2);
    expect(result!.cantrips).toContain('druidcraft');
    expect(result!.cantrips).toContain('shillelagh');
  });

  it('Druid L5 WIS 18: DC=15, attackBonus=+7, slots=[4,3,2]', () => {
    const { bundle: cantripBundle, key, decision } = cantripChoiceBundle(0, ['druidcraft', 'guidance']);
    const bundles: readonly GrantBundle[] = [spellcastingBundle('druid'), cantripBundle];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = { [key]: decision };
    const abilities = makeAbilities(18); // modifier +4
    const proficiencyBonus = getProficiencyBonus(5); // 3

    const result = resolveSpellcasting(bundles, {
      classId: 'druid',
      level: 5,
      abilities,
      proficiencyBonus,
      choices,
    });

    expect(result).not.toBeNull();
    expect(result!.spellSaveDC).toBe(15); // 8 + 3 + 4
    expect(result!.spellAttackBonus).toBe(7); // 3 + 4
    expect(result!.slots).toEqual([4, 3, 2]);
  });

  it('Druid L10 WIS 20: DC=17, attackBonus=+9, slots=[4,3,3,3,2], 4 cantrips from 3 grants', () => {
    // L1 grants 2 cantrips, L4 grants 1, L10 grants 1 → total 4
    const { bundle: cb0, key: k0, decision: d0 } = cantripChoiceBundle(0, ['druidcraft', 'shillelagh']);
    const { bundle: cb1, key: k1, decision: d1 } = cantripChoiceBundle(1, ['guidance']);
    const { bundle: cb2, key: k2, decision: d2 } = cantripChoiceBundle(2, ['thorn-whip']);
    const bundles: readonly GrantBundle[] = [spellcastingBundle('druid'), cb0, cb1, cb2];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      [k0]: d0,
      [k1]: d1,
      [k2]: d2,
    };
    const abilities = makeAbilities(20); // modifier +5
    const proficiencyBonus = getProficiencyBonus(10); // 4

    const result = resolveSpellcasting(bundles, {
      classId: 'druid',
      level: 10,
      abilities,
      proficiencyBonus,
      choices,
    });

    expect(result).not.toBeNull();
    expect(result!.spellSaveDC).toBe(17); // 8 + 4 + 5
    expect(result!.spellAttackBonus).toBe(9); // 4 + 5
    expect(result!.slots).toEqual([4, 3, 3, 3, 2]);
    expect(result!.cantrips).toHaveLength(4);
    expect(result!.cantrips).toContain('druidcraft');
    expect(result!.cantrips).toContain('shillelagh');
    expect(result!.cantrips).toContain('guidance');
    expect(result!.cantrips).toContain('thorn-whip');
  });

  it('Land Druid Forest L5: alwaysPreparedSpells contains barkskin, spider-climb, call-lightning, plant-growth', () => {
    // Simulate terrain synthesis result: Forest L3 grants barkskin+spider-climb, L5 grants call-lightning+plant-growth
    const forestL3Bundle: GrantBundle = {
      source: { origin: 'subclass', id: 'landcircle', classId: 'druid', level: 3 },
      grants: [
        { type: 'spell', spellId: 'barkskin', alwaysPrepared: true },
        { type: 'spell', spellId: 'spider-climb', alwaysPrepared: true },
      ],
    };
    const forestL5Bundle: GrantBundle = {
      source: { origin: 'subclass', id: 'landcircle', classId: 'druid', level: 5 },
      grants: [
        { type: 'spell', spellId: 'call-lightning', alwaysPrepared: true },
        { type: 'spell', spellId: 'plant-growth', alwaysPrepared: true },
      ],
    };

    const { bundle: cantripBundle, key, decision } = cantripChoiceBundle(0, ['druidcraft', 'shillelagh']);
    const bundles: readonly GrantBundle[] = [
      spellcastingBundle('druid'),
      cantripBundle,
      forestL3Bundle,
      forestL5Bundle,
    ];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = { [key]: decision };
    const abilities = makeAbilities(16);
    const proficiencyBonus = getProficiencyBonus(5);

    const result = resolveSpellcasting(bundles, {
      classId: 'druid',
      level: 5,
      abilities,
      proficiencyBonus,
      choices,
    });

    expect(result).not.toBeNull();
    expect(result!.alwaysPreparedSpells).toContain('barkskin');
    expect(result!.alwaysPreparedSpells).toContain('spider-climb');
    expect(result!.alwaysPreparedSpells).toContain('call-lightning');
    expect(result!.alwaysPreparedSpells).toContain('plant-growth');
    expect(result!.alwaysPreparedSpells).toHaveLength(4);
  });

  it('deduplicates cantrips when same spellId appears in multiple spell-choice decisions', () => {
    const { bundle: cb0, key: k0, decision: d0 } = cantripChoiceBundle(0, ['druidcraft', 'guidance']);
    // A second grant that includes the same cantrip
    const { bundle: cb1, key: k1, decision: d1 } = cantripChoiceBundle(1, ['druidcraft']);
    const bundles: readonly GrantBundle[] = [spellcastingBundle('druid'), cb0, cb1];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = { [k0]: d0, [k1]: d1 };
    const abilities = makeAbilities(14);

    const result = resolveSpellcasting(bundles, {
      classId: 'druid',
      level: 5,
      abilities,
      proficiencyBonus: getProficiencyBonus(5),
      choices,
    });

    expect(result).not.toBeNull();
    // druidcraft should appear only once despite two grants
    expect(result!.cantrips.filter((c) => c === 'druidcraft')).toHaveLength(1);
    expect(result!.cantrips).toHaveLength(2);
  });

  it('non-cantrip spell-choice grants are not included in cantrips', () => {
    // A spell-choice with maxLevel 1 (i.e., non-cantrip) should not feed cantrips
    const key = createChoiceKey('spell-choice', 'class', 'druid', 0);
    const nonCantripBundle: GrantBundle = {
      source: { origin: 'class', id: 'druid', level: 1 },
      grants: [
        {
          type: 'spell-choice',
          key,
          count: 2,
          fromList: 'druid',
          maxLevel: 1 as SpellLevel,
        },
      ],
    };
    const decision: ChoiceDecision = { type: 'spell-choice', spellIds: ['cure-wounds', 'entangle'] };
    const bundles: readonly GrantBundle[] = [spellcastingBundle('druid'), nonCantripBundle];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = { [key]: decision };

    const result = resolveSpellcasting(bundles, {
      classId: 'druid',
      level: 1,
      abilities: makeAbilities(14),
      proficiencyBonus: getProficiencyBonus(1),
      choices,
    });

    expect(result).not.toBeNull();
    expect(result!.cantrips).toHaveLength(0);
  });

  it('returns empty slots when classId is null', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'feat', id: 'magic-initiate' },
        grants: [{ type: 'spellcasting', ability: 'wis', source: 'feat' }],
      },
    ];
    const result = resolveSpellcasting(bundles, {
      classId: null,
      level: 1,
      abilities: makeAbilities(14),
      proficiencyBonus: 2,
      choices: {},
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toEqual([]);
  });
});
