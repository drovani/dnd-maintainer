import { describe, it, expect } from 'vitest'
import { resolveEquipment, resolveAttacks, resolveEquippedArmorAc } from '@/lib/resolver/equipment'
import { requireItemDef } from '@/lib/sources/items'
import type { GrantBundle } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { ResolvedAbility, ResolvedEquipmentItem } from '@/types/resolved'
import type { Sourced } from '@/types/resolved'
import type { WeaponProficiencyId } from '@/lib/dnd-helpers'

const NO_BUNDLES: readonly GrantBundle[] = []
const NO_CHOICES: Readonly<Record<ChoiceKey, ChoiceDecision>> = {}
const NO_EQUIPPED: readonly string[] = []

// Ability helpers
function makeAbility(score: number): ResolvedAbility {
  const modifier = Math.floor((score - 10) / 2)
  return { base: score, bonuses: [], total: score, modifier }
}

function makeAbilities(scores: { str: number; dex: number; con: number; int: number; wis: number; cha: number }) {
  return {
    str: makeAbility(scores.str),
    dex: makeAbility(scores.dex),
    con: makeAbility(scores.con),
    int: makeAbility(scores.int),
    wis: makeAbility(scores.wis),
    cha: makeAbility(scores.cha),
  }
}

const PROFICIENT_SIMPLE_MARTIAL: readonly Sourced<WeaponProficiencyId>[] = [
  { value: 'simple', sources: [{ origin: 'class', id: 'fighter', level: 1 }] },
  { value: 'martial', sources: [{ origin: 'class', id: 'fighter', level: 1 }] },
]
const NO_WEAPON_PROFS: readonly Sourced<WeaponProficiencyId>[] = []
const NO_FIGHTING_STYLES: readonly string[] = []

function makeEquippedWeapon(weaponId: string): ResolvedEquipmentItem {
  return {
    itemId: weaponId,
    itemDef: requireItemDef(weaponId),
    quantity: 1,
    source: { origin: 'class', id: 'fighter', level: 1 },
    equipped: true,
  }
}

function makeEquippedArmor(armorId: string): ResolvedEquipmentItem {
  return {
    itemId: armorId,
    itemDef: requireItemDef(armorId),
    quantity: 1,
    source: { origin: 'class', id: 'fighter', level: 1 },
    equipped: true,
  }
}

// ---------------------------------------------------------------------------
// resolveEquipment
// ---------------------------------------------------------------------------

describe('resolveEquipment', () => {
  it('returns empty with no bundles', () => {
    const result = resolveEquipment(NO_BUNDLES, NO_CHOICES, NO_EQUIPPED)
    expect(result.items).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('resolves direct equipment grants', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'equipment', itemId: 'insignia-of-rank', quantity: 1 }],
      },
    ]
    const result = resolveEquipment(bundles, NO_CHOICES, NO_EQUIPPED)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].itemId).toBe('insignia-of-rank')
    expect(result.items[0].quantity).toBe(1)
    expect(result.items[0].equipped).toBe(false)
  })

  it('marks item as equipped when id is in equippedItemIds', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'equipment', itemId: 'longsword', quantity: 1 }],
      },
    ]
    const result = resolveEquipment(bundles, NO_CHOICES, ['longsword'])
    expect(result.items[0].equipped).toBe(true)
  })

})

// ---------------------------------------------------------------------------
// resolveEquipment — bundle-choice branch
// ---------------------------------------------------------------------------

describe('resolveEquipment bundle-choice', () => {
  const FIGHTER_SOURCE: GrantBundle['source'] = { origin: 'class', id: 'fighter', level: 1 }

  const makeBundleChoiceBundle = (bundleIds: string[]): GrantBundle => ({
    source: FIGHTER_SOURCE,
    grants: [
      {
        type: 'bundle-choice',
        key: 'bundle-choice:class:fighter:0' as ChoiceKey,
        category: 'loadout',
        bundleIds,
      },
    ],
  })

  it('expands bundle decision contents with source.origin "bundle"', () => {
    const bundles = [makeBundleChoiceBundle(['fighter-chainmail', 'fighter-archer-kit'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-chainmail', slotPicks: {} },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].itemId).toBe('chain-mail')
    expect(result.items[0].source).toEqual({ origin: 'bundle', id: 'fighter-chainmail' })
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('multi-item bundle expands all contents', () => {
    const bundles = [makeBundleChoiceBundle(['fighter-chainmail', 'fighter-archer-kit'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-archer-kit', slotPicks: {} },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(3)
    const ids = result.items.map((i) => i.itemId)
    expect(ids).toContain('leather')
    expect(ids).toContain('longbow')
    expect(ids).toContain('arrows-20')
    for (const item of result.items) {
      expect(item.source).toEqual({ origin: 'bundle', id: 'fighter-archer-kit' })
    }
  })

  it('pack-type id expands pack contents with source.origin "pack"', () => {
    const bundles = [makeBundleChoiceBundle(['dungeoneers-pack', 'explorers-pack'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'dungeoneers-pack', slotPicks: {} },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items.length).toBeGreaterThan(0)
    const ids = result.items.map((i) => i.itemId)
    expect(ids).toContain('backpack')
    for (const item of result.items) {
      expect(item.source).toEqual({ origin: 'pack', id: 'dungeoneers-pack' })
    }
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('missing decision produces pending choice with correct category and bundleIds', () => {
    const bundleIds = ['fighter-chainmail', 'fighter-archer-kit']
    const bundles = [makeBundleChoiceBundle(bundleIds)]
    const result = resolveEquipment(bundles, NO_CHOICES, NO_EQUIPPED)
    expect(result.items).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(1)
    const pending = result.pendingChoices[0]
    expect(pending.type).toBe('bundle-choice')
    if (pending.type === 'bundle-choice') {
      expect(pending.category).toBe('loadout')
      expect(pending.bundleIds).toEqual(bundleIds)
      expect(pending.choiceKey).toBe('bundle-choice:class:fighter:0')
    }
  })

  it('invalid bundleId (unknown) falls through to pending, not a crash', () => {
    const bundles = [makeBundleChoiceBundle(['fighter-chainmail', 'fighter-archer-kit'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'nonexistent-bundle', slotPicks: {} },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(1)
    expect(result.pendingChoices[0].type).toBe('bundle-choice')
  })

  // -------------------------------------------------------------------------
  // Slotted bundle scenarios
  // -------------------------------------------------------------------------

  it('slotted bundle with all slots filled materializes every slot item', () => {
    const bundles = [makeBundleChoiceBundle(['martial-weapon-and-shield', 'two-martial-weapons'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword', shield: 'shield' },
      },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    const ids = result.items.map((i) => i.itemId).sort()
    expect(ids).toEqual(['longsword', 'shield'])
    for (const item of result.items) {
      expect(item.source).toEqual({ origin: 'bundle', id: 'martial-weapon-and-shield' })
    }
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('slotted bundle with partially filled slots (only weapon, missing shield) stays pending', () => {
    const bundles = [makeBundleChoiceBundle(['martial-weapon-and-shield', 'two-martial-weapons'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword' },
      },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(1)
    expect(result.pendingChoices[0].type).toBe('bundle-choice')
  })

  it('slotted bundle with no slot picks stays pending', () => {
    const bundles = [makeBundleChoiceBundle(['martial-weapon-and-shield', 'two-martial-weapons'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: {},
      },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(1)
  })

  it('slotted bundle with invalid slot pick (wrong category) stays pending', () => {
    const bundles = [makeBundleChoiceBundle(['martial-weapon-and-shield', 'two-martial-weapons'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        // 'club' is a simple weapon — fails the martial filter
        slotPicks: { weapon: 'club', shield: 'shield' },
      },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(1)
  })

  it('two-martial-weapons with duplicate slot picks materializes both copies', () => {
    const bundles = [makeBundleChoiceBundle(['martial-weapon-and-shield', 'two-martial-weapons'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': {
        type: 'bundle-choice',
        bundleId: 'two-martial-weapons',
        slotPicks: { 'weapon-1': 'longsword', 'weapon-2': 'longsword' },
      },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(2)
    expect(result.items.every((i) => i.itemId === 'longsword')).toBe(true)
    for (const item of result.items) {
      expect(item.source).toEqual({ origin: 'bundle', id: 'two-martial-weapons' })
    }
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('two-martial-weapons with distinct slot picks materializes both weapons', () => {
    const bundles = [makeBundleChoiceBundle(['martial-weapon-and-shield', 'two-martial-weapons'])]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'bundle-choice:class:fighter:0': {
        type: 'bundle-choice',
        bundleId: 'two-martial-weapons',
        slotPicks: { 'weapon-1': 'longsword', 'weapon-2': 'rapier' },
      },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(2)
    const ids = result.items.map((i) => i.itemId).sort()
    expect(ids).toEqual(['longsword', 'rapier'])
  })

})

// ---------------------------------------------------------------------------
// resolveCharacter — useDBInventory path
// ---------------------------------------------------------------------------

describe('resolveEquipment via useDBInventory', () => {
  it('builds items from persistedItems and produces no pending choices', async () => {
    const { resolveCharacter } = await import('@/lib/resolver')
    const { requireItemDef: rItemDef } = await import('@/lib/sources/items')
    const input = {
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
      level: 0,
      bundles: [] as GrantBundle[],
      choices: {} as Readonly<Record<ChoiceKey, ChoiceDecision>>,
      useDBInventory: true,
      persistedItems: [
        { itemId: 'chain-mail', quantity: 1, equipped: true, source: { origin: 'bundle' as const, id: 'fighter-chainmail' } },
        { itemId: 'longsword', quantity: 1, equipped: true, source: { origin: 'bundle' as const, id: 'longsword-and-shield' } },
      ],
    }
    const result = resolveCharacter(input)
    expect(result.equipment).toHaveLength(2)
    expect(result.equipment[0].itemId).toBe('chain-mail')
    expect(result.equipment[0].source).toEqual({ origin: 'bundle', id: 'fighter-chainmail' })
    expect(result.equipment[0].equipped).toBe(true)
    // No pending choices from grants since we bypassed grant processing
    expect(result.pendingChoices.filter((p) => p.type === 'bundle-choice')).toHaveLength(0)
    // item defs are populated
    expect(result.equipment[0].itemDef).toEqual(rItemDef('chain-mail'))
  })

  it('ignores bundle-choice grants when useDBInventory is true', async () => {
    const { resolveCharacter } = await import('@/lib/resolver')
    const { collectBundles } = await import('@/lib/sources')
    const build = {
      raceId: 'human' as import('@/lib/dnd-helpers').RaceId,
      backgroundId: null,
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
      abilityMethod: 'standard-array' as const,
      levels: [{ classId: 'fighter' as import('@/lib/dnd-helpers').ClassId, classLevel: 1, hpRoll: null }],
      choices: {} as Readonly<Record<import('@/types/choices').ChoiceKey, import('@/types/choices').ChoiceDecision>>,
      feats: [],
      activeItems: [],
    }
    const { bundles } = collectBundles(build)
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
      useDBInventory: true,
      persistedItems: [
        { itemId: 'longsword', quantity: 1, equipped: false, source: { origin: 'bundle' as const, id: 'longsword-and-shield' } },
      ],
    })
    // Only the one persisted item — the 4 bundle-choice grants are ignored
    expect(result.equipment).toHaveLength(1)
    expect(result.equipment[0].itemId).toBe('longsword')
  })
})

// ---------------------------------------------------------------------------
// resolveAttacks
// ---------------------------------------------------------------------------

describe('resolveAttacks', () => {
  it('returns empty with no equipped weapons', () => {
    const attacks = resolveAttacks([], makeAbilities({ str: 16, dex: 14, con: 15, int: 10, wis: 10, cha: 10 }), 2, PROFICIENT_SIMPLE_MARTIAL, NO_FIGHTING_STYLES)
    expect(attacks).toHaveLength(0)
  })

  it('Fighter STR 16 proficient with longsword: attackBonus 5, damageBonus 3', () => {
    const abilities = makeAbilities({ str: 16, dex: 10, con: 15, int: 10, wis: 10, cha: 10 })
    const attacks = resolveAttacks(
      [makeEquippedWeapon('longsword')],
      abilities,
      2,
      PROFICIENT_SIMPLE_MARTIAL,
      NO_FIGHTING_STYLES,
    )
    expect(attacks).toHaveLength(1)
    expect(attacks[0].attackBonus).toBe(5) // STR +3 + prof +2
    expect(attacks[0].damageBonus).toBe(3) // STR +3
    expect(attacks[0].attackBreakdown).toContainEqual({ type: 'ability', value: 3, label: 'str' })
    expect(attacks[0].attackBreakdown).toContainEqual({ type: 'proficiency', value: 2, label: 'proficiency' })
  })

  it('Fighter with longbow + Archery style (DEX 14, proficient): attackBonus 6', () => {
    const abilities = makeAbilities({ str: 10, dex: 14, con: 15, int: 10, wis: 10, cha: 10 })
    const attacks = resolveAttacks(
      [makeEquippedWeapon('longbow')],
      abilities,
      2,
      PROFICIENT_SIMPLE_MARTIAL,
      ['archery'],
    )
    expect(attacks).toHaveLength(1)
    expect(attacks[0].attackBonus).toBe(6) // DEX +2 + prof +2 + archery +2
    expect(attacks[0].attackBreakdown).toContainEqual({ type: 'ability', value: 2, label: 'dex' })
    expect(attacks[0].attackBreakdown).toContainEqual({ type: 'proficiency', value: 2, label: 'proficiency' })
    expect(attacks[0].attackBreakdown).toContainEqual({ type: 'fighting-style', value: 2, label: 'archery' })
  })

  it('finesse weapon (rapier): STR 12, DEX 16 → uses DEX (+3)', () => {
    const abilities = makeAbilities({ str: 12, dex: 16, con: 10, int: 10, wis: 10, cha: 10 })
    const attacks = resolveAttacks(
      [makeEquippedWeapon('rapier')],
      abilities,
      2,
      PROFICIENT_SIMPLE_MARTIAL,
      NO_FIGHTING_STYLES,
    )
    expect(attacks).toHaveLength(1)
    expect(attacks[0].attackBreakdown[0]).toEqual({ type: 'ability', value: 3, label: 'dex' })
    expect(attacks[0].damageBreakdown[0]).toEqual({ type: 'ability', value: 3, label: 'dex' })
  })

  it('finesse weapon: STR 16, DEX 12 → uses STR (+3)', () => {
    const abilities = makeAbilities({ str: 16, dex: 12, con: 10, int: 10, wis: 10, cha: 10 })
    const attacks = resolveAttacks(
      [makeEquippedWeapon('rapier')],
      abilities,
      2,
      PROFICIENT_SIMPLE_MARTIAL,
      NO_FIGHTING_STYLES,
    )
    expect(attacks).toHaveLength(1)
    expect(attacks[0].attackBreakdown[0]).toEqual({ type: 'ability', value: 3, label: 'str' })
  })

  it('non-proficient weapon omits proficiency bonus from breakdown', () => {
    const abilities = makeAbilities({ str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 })
    const attacks = resolveAttacks(
      [makeEquippedWeapon('longsword')],
      abilities,
      2,
      NO_WEAPON_PROFS,
      NO_FIGHTING_STYLES,
    )
    expect(attacks).toHaveLength(1)
    expect(attacks[0].attackBonus).toBe(3) // STR +3, no proficiency
    expect(attacks[0].attackBreakdown.some((c) => c.type === 'proficiency')).toBe(false)
  })

  it('Dueling style: +2 damage for one-handed melee with no other weapon equipped', () => {
    const abilities = makeAbilities({ str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 })
    const attacks = resolveAttacks(
      [makeEquippedWeapon('longsword')],
      abilities,
      2,
      PROFICIENT_SIMPLE_MARTIAL,
      ['dueling'],
    )
    expect(attacks).toHaveLength(1)
    expect(attacks[0].damageBonus).toBe(5) // STR +3 + dueling +2
    expect(attacks[0].damageBreakdown).toContainEqual({ type: 'fighting-style', value: 2, label: 'dueling' })
  })

  it('Dueling style: no +2 damage when two weapons equipped', () => {
    const abilities = makeAbilities({ str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 })
    const attacks = resolveAttacks(
      [makeEquippedWeapon('longsword'), makeEquippedWeapon('shortsword')],
      abilities,
      2,
      PROFICIENT_SIMPLE_MARTIAL,
      ['dueling'],
    )
    expect(attacks).toHaveLength(2)
    for (const attack of attacks) {
      expect(attack.damageBreakdown.some((c) => c.label === 'dueling')).toBe(false)
    }
  })

  it('Archery does not apply to melee weapons', () => {
    const abilities = makeAbilities({ str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 })
    const attacks = resolveAttacks(
      [makeEquippedWeapon('longsword')],
      abilities,
      2,
      PROFICIENT_SIMPLE_MARTIAL,
      ['archery'],
    )
    expect(attacks[0].attackBreakdown.some((c) => c.label === 'archery')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resolveEquippedArmorAc
// ---------------------------------------------------------------------------

describe('resolveEquippedArmorAc', () => {
  it('returns null when no armor equipped', () => {
    const result = resolveEquippedArmorAc([], 2)
    expect(result).toBeNull()
  })

  it('chain mail (baseAc 16, maxDex 0) + DEX 16 → totalBase 16 (DEX ignored)', () => {
    const result = resolveEquippedArmorAc([makeEquippedArmor('chain-mail')], 3)
    expect(result).not.toBeNull()
    expect(result!.totalBase).toBe(16)
    expect(result!.shieldBonus).toBe(0)
  })

  it('chain shirt (baseAc 13, maxDex 2) + DEX 16 (mod +3) → totalBase 15 (capped at 2)', () => {
    const result = resolveEquippedArmorAc([makeEquippedArmor('chain-shirt')], 3)
    expect(result).not.toBeNull()
    expect(result!.totalBase).toBe(15)
  })

  it('leather (baseAc 11, maxDex null) + DEX 16 (mod +3) → totalBase 14 (uncapped)', () => {
    const result = resolveEquippedArmorAc([makeEquippedArmor('leather')], 3)
    expect(result).not.toBeNull()
    expect(result!.totalBase).toBe(14)
  })

  it('shield adds shieldBonus 2', () => {
    const result = resolveEquippedArmorAc(
      [makeEquippedArmor('chain-mail'), makeEquippedArmor('shield')],
      0,
    )
    expect(result).not.toBeNull()
    expect(result!.shieldBonus).toBe(2)
    expect(result!.totalBase).toBe(16)
  })

  it('shield alone (without body armor) returns shieldBonus 2 with totalBase null', () => {
    const result = resolveEquippedArmorAc([makeEquippedArmor('shield')], 2)
    expect(result).not.toBeNull()
    expect(result!.shieldBonus).toBe(2)
    expect(result!.totalBase).toBeNull()
  })

  it('non-equipped item is not counted as armor', () => {
    const notEquipped: ResolvedEquipmentItem = {
      itemId: 'chain-mail',
      itemDef: requireItemDef('chain-mail'),
      quantity: 1,
      source: { origin: 'class', id: 'fighter', level: 1 },
      equipped: false,
    }
    const result = resolveEquippedArmorAc([notEquipped], 3)
    expect(result).toBeNull()
  })
})
