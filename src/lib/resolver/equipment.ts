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
import { getBundleDef, getItemsForSlot, resolveBundleRef } from '@/lib/sources/bundles'
import type { WeaponProficiencyId } from '@/lib/dnd-helpers'
import type { BundleSlot, SlotFilter } from '@/types/items'

/**
 * Confirms that a slot pick is an item in the catalog that satisfies the slot's filter.
 * Guards against stale persisted decisions after catalog changes.
 */
function isValidSlotPick(filter: SlotFilter, itemId: string): boolean {
  return getItemsForSlot(filter).some((item) => item.id === itemId)
}

/**
 * Returns the itemIds materialized from a bundle's slots given the user's slot picks.
 * Returns null if any slot is unfilled or has an invalid pick — in that case the
 * bundle-choice should remain pending.
 */
function resolveSlotPicks(
  slots: readonly BundleSlot[],
  slotPicks: Readonly<Record<string, string>>,
): readonly { readonly itemId: string; readonly quantity: number }[] | null {
  const resolved: { readonly itemId: string; readonly quantity: number }[] = []
  for (const slot of slots) {
    const picked = slotPicks[slot.slotKey]
    if (picked === undefined || !isValidSlotPick(slot.filter, picked)) return null
    resolved.push({ itemId: picked, quantity: slot.quantity })
  }
  return resolved
}

export function resolveEquipment(
  bundles: readonly GrantBundle[],
  choices: Readonly<Record<ChoiceKey, ChoiceDecision>>,
  equippedItemIds: readonly string[],
): { readonly items: readonly ResolvedEquipmentItem[]; readonly pendingChoices: readonly PendingChoice[] } {
  const items: ResolvedEquipmentItem[] = []
  const pendingChoices: PendingChoice[] = []

  for (const { grant, source } of collectGrantsByType(bundles, 'equipment')) {
    items.push({
      itemId: grant.itemId,
      itemDef: requireItemDef(grant.itemId),
      quantity: grant.quantity,
      source,
      equipped: equippedItemIds.includes(grant.itemId),
    })
  }

  for (const { grant, source } of collectGrantsByType(bundles, 'bundle-choice')) {
    const decision = choices[grant.key]
    const pendingForGrant: PendingChoice = {
      type: 'bundle-choice',
      choiceKey: grant.key,
      source,
      category: grant.category,
      bundleIds: grant.bundleIds,
    }

    if (decision?.type !== 'bundle-choice') {
      pendingChoices.push(pendingForGrant)
      continue
    }

    let ref: ReturnType<typeof resolveBundleRef> | undefined
    try {
      ref = resolveBundleRef(decision.bundleId)
    } catch (err) {
      console.warn(
        `resolveEquipment: unknown bundleId "${decision.bundleId}" for choice "${grant.key}" — re-prompting`,
        err,
      )
      pendingChoices.push(pendingForGrant)
      continue
    }

    // Packs never have slots — materialize contents directly.
    if (ref.kind === 'pack') {
      const itemSource: import('@/types/sources').SourceTag = { origin: 'pack', id: decision.bundleId }
      for (const { itemId, quantity } of ref.contents) {
        items.push({
          itemId,
          itemDef: requireItemDef(itemId),
          quantity,
          source: itemSource,
          equipped: equippedItemIds.includes(itemId),
        })
      }
      continue
    }

    // Bundle — may have slots. Resolve them against the user's slotPicks.
    // resolveBundleRef above returned kind: 'bundle', so getBundleDef must succeed.
    // If it doesn't, the bundle registry is inconsistent — log and re-prompt defensively.
    const bundle = getBundleDef(decision.bundleId)
    if (bundle === undefined) {
      console.error(
        `resolveEquipment: bundle registry inconsistent — resolveBundleRef("${decision.bundleId}") succeeded but getBundleDef returned undefined`,
      )
      pendingChoices.push(pendingForGrant)
      continue
    }

    const slotItems = resolveSlotPicks(bundle.slots, decision.slotPicks)
    if (slotItems === null) {
      // Partial or invalid slot selection — keep the choice pending so the UI re-prompts.
      pendingChoices.push(pendingForGrant)
      continue
    }

    const itemSource: import('@/types/sources').SourceTag = { origin: 'bundle', id: decision.bundleId }
    for (const { itemId, quantity } of bundle.contents) {
      items.push({
        itemId,
        itemDef: requireItemDef(itemId),
        quantity,
        source: itemSource,
        equipped: equippedItemIds.includes(itemId),
      })
    }
    for (const { itemId, quantity } of slotItems) {
      items.push({
        itemId,
        itemDef: requireItemDef(itemId),
        quantity,
        source: itemSource,
        equipped: equippedItemIds.includes(itemId),
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

  // Dueling requires exactly one weapon equipped total, and it must be one-handed melee
  const totalEquippedWeapons = equippedWeapons.length

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

    const proficient = weaponProficiencies.some(
      (p) => p.value === weapon.weaponProficiencyId || p.value === weapon.category,
    )

    const attackBreakdown: AttackBonusComponent[] = [
      { type: 'ability', value: abilityMod, label: attackAbility },
    ]
    if (proficient) {
      attackBreakdown.push({ type: 'proficiency', value: proficiencyBonus, label: 'proficiency' })
    }
    if (hasArchery && weapon.range === 'ranged') {
      attackBreakdown.push({ type: 'fighting-style', value: 2, label: 'archery' })
    }

    const damageBreakdown: DamageBonusComponent[] = [
      { type: 'ability', value: abilityMod, label: attackAbility },
    ]

    const isOneHandedMelee = weapon.range === 'melee' && !weapon.properties.includes('two-handed')
    if (hasDueling && isOneHandedMelee && totalEquippedWeapons === 1) {
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
      : Math.max(0, Math.min(dexModifier, armor.maxDexBonus))

  return { totalBase: armor.baseAc + dexContribution, shieldBonus }
}

/** Re-exported from items.ts for convenience. */
export { getItemDef }
