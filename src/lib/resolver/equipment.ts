import type { AbilityKey } from '@/lib/dnd-helpers'
import type { GrantBundle } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type {
  ResolvedEquipmentItem,
  ResolvedAttack,
  AttackBonusComponent,
  DamageBonusComponent,
  PendingChoice,
  Sourced,
} from '@/types/resolved'
import type { ResolvedAbility } from '@/types/resolved'
import { collectGrantsByType } from '@/lib/resolver/helpers'
import { getItemDef, requireItemDef } from '@/lib/sources/items'
import type { WeaponProficiencyId } from '@/lib/dnd-helpers'

export function resolveEquipment(
  bundles: readonly GrantBundle[],
  choices: Readonly<Record<ChoiceKey, ChoiceDecision>>,
  equippedItemIds: readonly string[],
): { readonly items: readonly ResolvedEquipmentItem[]; readonly pendingChoices: readonly PendingChoice[] } {
  const items: ResolvedEquipmentItem[] = []
  const pendingChoices: PendingChoice[] = []

  // Direct equipment grants — use requireItemDef for fail-fast on trusted source data
  for (const { grant, source } of collectGrantsByType(bundles, 'equipment')) {
    items.push({
      itemId: grant.itemId,
      itemDef: requireItemDef(grant.itemId),
      quantity: grant.quantity,
      source,
      equipped: equippedItemIds.includes(grant.itemId),
    })
  }

  // Equipment choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'equipment-choice')) {
    const decision = choices[grant.key]
    if (decision?.type === 'equipment-choice') {
      const chosenOption = grant.options[decision.optionIndex]
      // Re-prompt if the stored optionIndex is out of range (stale persisted data)
      if (!chosenOption || decision.optionIndex >= grant.options.length) {
        pendingChoices.push({
          type: 'equipment-choice',
          choiceKey: grant.key,
          source,
          options: grant.options,
        })
        continue
      }
      for (const { itemId, quantity } of chosenOption) {
        items.push({
          itemId,
          itemDef: requireItemDef(itemId),
          quantity,
          source,
          equipped: equippedItemIds.includes(itemId),
        })
      }
    } else {
      pendingChoices.push({
        type: 'equipment-choice',
        choiceKey: grant.key,
        source,
        options: grant.options,
      })
    }
  }

  return { items, pendingChoices }
}

export function resolveAttacks(
  equippedItems: readonly ResolvedEquipmentItem[],
  abilities: Readonly<Record<AbilityKey, ResolvedAbility>>,
  proficiencyBonus: number,
  weaponProficiencies: readonly Sourced<WeaponProficiencyId>[],
  fightingStyleIds: readonly string[],
): readonly ResolvedAttack[] {
  const equippedWeapons = equippedItems.filter(
    (item) => item.equipped && item.itemDef.type === 'weapon',
  )

  const hasArchery = fightingStyleIds.includes('archery')
  const hasDueling = fightingStyleIds.includes('dueling')

  // Count equipped one-handed melee weapons (no two-handed) for Dueling check
  const oneHandedMeleeCount = equippedWeapons.filter((item) => {
    if (item.itemDef.type !== 'weapon') return false
    return item.itemDef.range === 'melee' && !item.itemDef.properties.includes('two-handed')
  }).length

  const attacks: ResolvedAttack[] = []

  for (const equippedItem of equippedWeapons) {
    const weapon = equippedItem.itemDef
    if (weapon.type !== 'weapon') continue

    // Determine attack ability: ranged → DEX, melee → STR, finesse → max(STR, DEX)
    let attackAbility: AbilityKey
    if (weapon.properties.includes('finesse')) {
      attackAbility = abilities.str.modifier >= abilities.dex.modifier ? 'str' : 'dex'
    } else if (weapon.range === 'ranged') {
      attackAbility = 'dex'
    } else {
      attackAbility = 'str'
    }

    const abilityMod = abilities[attackAbility].modifier

    // Check proficiency using the explicit weaponProficiencyId field
    const proficient = weaponProficiencies.some(
      (p) => p.value === weapon.weaponProficiencyId || p.value === weapon.category,
    )

    // Build attack breakdown
    const attackBreakdown: AttackBonusComponent[] = [
      { type: 'ability', value: abilityMod, label: attackAbility },
    ]
    if (proficient) {
      attackBreakdown.push({ type: 'proficiency', value: proficiencyBonus, label: 'proficiency' })
    }
    if (hasArchery && weapon.range === 'ranged') {
      attackBreakdown.push({ type: 'fighting-style', value: 2, label: 'archery' })
    }

    // Build damage breakdown
    const damageBreakdown: DamageBonusComponent[] = [
      { type: 'ability', value: abilityMod, label: attackAbility },
    ]

    // Dueling: +2 damage on one-handed melee with no other weapon equipped
    const isOneHandedMelee = weapon.range === 'melee' && !weapon.properties.includes('two-handed')
    if (hasDueling && isOneHandedMelee && oneHandedMeleeCount === 1) {
      damageBreakdown.push({ type: 'fighting-style', value: 2, label: 'dueling' })
    }

    const attackBonus = attackBreakdown.reduce((sum, c) => sum + c.value, 0)
    const damageBonus = damageBreakdown.reduce((sum, c) => sum + c.value, 0)

    attacks.push({
      weaponId: weapon.id,
      attackBonus,
      attackBreakdown,
      damageDice: weapon.damageDice,
      damageBonus,
      damageBreakdown,
      damageType: weapon.damageType,
      properties: weapon.properties,
      range: weapon.range,
      ...(weapon.normalRange !== undefined ? { normalRange: weapon.normalRange } : {}),
      ...(weapon.longRange !== undefined ? { longRange: weapon.longRange } : {}),
    })
  }

  return attacks
}

/**
 * Returns the AC contribution from equipped armor items.
 * - `totalBase`: the armor's base AC plus clamped DEX contribution (null when no body armor is equipped)
 * - `shieldBonus`: 2 when a shield is equipped, 0 otherwise
 * Returns null only when nothing armor-related is equipped at all.
 */
export function resolveEquippedArmorAc(
  equippedItems: readonly ResolvedEquipmentItem[],
  dexModifier: number,
): { readonly totalBase: number | null; readonly shieldBonus: number } | null {
  const equippedShield = equippedItems.find(
    (item) => item.equipped && item.itemDef.type === 'armor' && item.itemDef.category === 'shield',
  )
  const shieldBonus = equippedShield ? 2 : 0

  const equippedBodyArmor = equippedItems.find(
    (item) => item.equipped && item.itemDef.type === 'armor' && item.itemDef.category !== 'shield',
  )

  if (!equippedBodyArmor && !equippedShield) return null

  if (!equippedBodyArmor) {
    // Shield only — caller uses its own base calculation but adds shieldBonus
    return { totalBase: null, shieldBonus }
  }

  const armor = equippedBodyArmor.itemDef
  if (armor.type !== 'armor') return { totalBase: null, shieldBonus }

  const dexContribution =
    armor.maxDexBonus === null
      ? dexModifier
      : Math.min(dexModifier, armor.maxDexBonus)

  return { totalBase: armor.baseAc + dexContribution, shieldBonus }
}

/**
 * Looks up an item definition without throwing — safe for UI-side optional lookups.
 * Re-exported here so callers can import from a single location.
 */
export { getItemDef }
