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
export type DamageType = 'bludgeoning' | 'piercing' | 'slashing'
export type ArmorCategory = 'light' | 'medium' | 'heavy' | 'shield'

export interface WeaponDef {
  readonly id: string
  readonly category: WeaponCategory
  readonly range: WeaponRange
  readonly damageDice: string
  readonly damageType: DamageType
  readonly properties: readonly WeaponProperty[]
  readonly weight: number
  readonly costGp: number
  readonly normalRange?: number
  readonly longRange?: number
  readonly versatileDice?: string
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
