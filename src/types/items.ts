import type { DamageTypeId } from '@/types/grants'
import type { WeaponProficiencyId } from '@/lib/dnd-helpers'

export const BUNDLE_CATEGORIES = [
  'loadout',
  'armor',
  'melee-weapon',
  'ranged-weapon',
  'pack',
  'gear',
] as const
export type BundleCategory = (typeof BUNDLE_CATEGORIES)[number]

export type SlotFilter =
  | {
      readonly kind: 'weapon'
      readonly category?: WeaponCategory
      readonly range?: WeaponRange
    }
  | {
      readonly kind: 'armor'
      readonly category: ArmorCategory
    }

export interface BundleSlot {
  /** Stable key within the bundle, e.g. 'weapon', 'weapon-1', 'weapon-2' */
  readonly slotKey: string
  readonly quantity: number
  readonly filter: SlotFilter
}

export interface BundleDef {
  readonly id: string
  readonly category: BundleCategory
  readonly contents: readonly { readonly itemId: string; readonly quantity: number }[]
  /** Required (empty array when bundle has no pickable slots). */
  readonly slots: readonly BundleSlot[]
}

export const WEAPON_PROPERTIES = [
  'ammunition',
  'finesse',
  'heavy',
  'light',
  'loading',
  'reach',
  'special',
  'thrown',
  'two-handed',
  'versatile',
] as const
export type WeaponProperty = (typeof WEAPON_PROPERTIES)[number]

export type WeaponCategory = 'simple' | 'martial'
export type WeaponRange = 'melee' | 'ranged'
export type PhysicalDamageType = Extract<DamageTypeId, 'bludgeoning' | 'piercing' | 'slashing'>
export type ArmorCategory = 'light' | 'medium' | 'heavy' | 'shield'
export type DamageDice = `${number}d${number}`

export interface WeaponDef {
  readonly id: string
  readonly category: WeaponCategory
  readonly range: WeaponRange
  readonly damageDice: DamageDice
  readonly damageType: PhysicalDamageType
  readonly properties: readonly WeaponProperty[]
  readonly weight: number
  readonly costGp: number
  readonly normalRange?: number
  readonly longRange?: number
  readonly versatileDice?: DamageDice
  /** Explicit proficiency ID for use in proficiency checks — may differ from id when id uses hyphens */
  readonly weaponProficiencyId: WeaponProficiencyId
}

export interface ArmorDef {
  readonly id: string
  readonly category: ArmorCategory
  readonly baseAc: number
  readonly maxDexBonus: number | null
  readonly stealthDisadvantage: boolean
  readonly strengthRequirement: number
  readonly weight: number
  readonly costGp: number
}

export interface GearDef {
  readonly id: string
  readonly weight: number
  readonly costGp: number
}

export interface PackDef {
  readonly id: string
  readonly contents: readonly { readonly itemId: string; readonly quantity: number }[]
  readonly costGp: number
}

export type ItemDef =
  | ({ readonly type: 'weapon' } & WeaponDef)
  | ({ readonly type: 'armor' } & ArmorDef)
  | ({ readonly type: 'gear' } & GearDef)
  | ({ readonly type: 'pack' } & PackDef)
