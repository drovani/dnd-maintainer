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

  it('resolves equipment-choice when decision exists', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          {
            type: 'equipment-choice',
            key: 'equipment-choice:class:fighter:0',
            options: [
              [{ itemId: 'chain-mail', quantity: 1 }],
              [{ itemId: 'leather', quantity: 1 }],
            ],
          },
        ],
      },
    ]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'equipment-choice:class:fighter:0': { type: 'equipment-choice', optionIndex: 0 },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].itemId).toBe('chain-mail')
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('produces pending choice for unresolved equipment-choice', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          {
            type: 'equipment-choice',
            key: 'equipment-choice:class:fighter:0',
            options: [
              [{ itemId: 'chain-mail', quantity: 1 }],
              [{ itemId: 'leather', quantity: 1 }],
            ],
          },
        ],
      },
    ]
    const result = resolveEquipment(bundles, NO_CHOICES, NO_EQUIPPED)
    expect(result.items).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(1)
    expect(result.pendingChoices[0].type).toBe('equipment-choice')
  })

  it('re-prompts when stored optionIndex is out of range (stale persisted data)', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          {
            type: 'equipment-choice',
            key: 'equipment-choice:class:fighter:0',
            options: [
              [{ itemId: 'chain-mail', quantity: 1 }],
              [{ itemId: 'leather', quantity: 1 }],
            ],
          },
        ],
      },
    ]
    // optionIndex 5 is out of range — should fall through to pending
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'equipment-choice:class:fighter:0': { type: 'equipment-choice', optionIndex: 5 },
    }
    const result = resolveEquipment(bundles, choices, NO_EQUIPPED)
    expect(result.items).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(1)
    expect(result.pendingChoices[0].type).toBe('equipment-choice')
    expect(result.pendingChoices[0].choiceKey).toBe('equipment-choice:class:fighter:0')
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
