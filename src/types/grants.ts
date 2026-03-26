import type { AbilityKey, ClassId, SkillId, ArmorProficiencyId, WeaponProficiencyId, ToolProficiencyId } from '@/lib/dnd-helpers'

// Supporting types

export type UnarmoredFormula = 'barbarian' | 'monk'

export type AcCalculation =
  | { readonly mode: 'armored' }
  | { readonly mode: 'unarmored'; readonly formula: UnarmoredFormula }
  | { readonly mode: 'natural'; readonly baseAc: number }

export const DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'poison',
  'psychic',
  'radiant',
  'thunder',
] as const

export type DamageTypeId = (typeof DAMAGE_TYPES)[number]

export interface FeatureDef {
  readonly id: string
  readonly name?: string
  readonly description?: string
  readonly usesPerRest?: 'short' | 'long'
  readonly usesCount?: number
}

// Grant variants

export interface AbilityBonusGrant {
  readonly type: 'ability-bonus'
  readonly ability: AbilityKey
  readonly bonus: number
}

export interface AbilityChoiceGrant {
  readonly type: 'ability-choice'
  readonly count: number
  readonly bonus: number
  readonly from: readonly AbilityKey[] | null
}

export type ProficiencyGrant =
  | { readonly type: 'proficiency'; readonly category: 'armor'; readonly id: ArmorProficiencyId }
  | { readonly type: 'proficiency'; readonly category: 'weapon'; readonly id: WeaponProficiencyId }
  | { readonly type: 'proficiency'; readonly category: 'tool'; readonly id: ToolProficiencyId }
  | { readonly type: 'proficiency'; readonly category: 'skill'; readonly id: SkillId }

export interface ProficiencyChoiceGrant {
  readonly type: 'proficiency-choice'
  readonly category: 'armor' | 'weapon' | 'tool' | 'skill'
  readonly count: number
  readonly from: readonly string[] | null
}

export interface SkillExpertiseGrant {
  readonly type: 'skill-expertise'
  readonly skill: SkillId
}

export interface FeatureGrant {
  readonly type: 'feature'
  readonly feature: FeatureDef
}

export interface SpeedGrant {
  readonly type: 'speed'
  readonly mode: 'walk' | 'fly' | 'swim' | 'climb' | 'burrow'
  readonly value: number
}

export type HitDie = 4 | 6 | 8 | 10 | 12

export interface HitDieGrant {
  readonly type: 'hit-die'
  readonly die: HitDie
}

export interface HpBonusGrant {
  readonly type: 'hp-bonus'
  readonly perLevel: number
}

export interface ResistanceGrant {
  readonly type: 'resistance'
  readonly damageType: DamageTypeId
}

export interface ArmorClassGrant {
  readonly type: 'armor-class'
  readonly calculation: AcCalculation
}

export interface AcBonusGrant {
  readonly type: 'ac-bonus'
  readonly bonus: number
}

export interface SpellcastingGrant {
  readonly type: 'spellcasting'
  readonly ability: AbilityKey
  readonly source: 'class' | 'race' | 'feat'
}

export interface SpellGrant {
  readonly type: 'spell'
  readonly spellId: string
  readonly alwaysPrepared: boolean
}

export interface AsiGrant {
  readonly type: 'asi'
}

export interface SubclassGrant {
  readonly type: 'subclass'
  readonly classId: ClassId
}

export interface EquipmentGrant {
  readonly type: 'equipment'
  readonly itemId: string
  readonly quantity: number
}

export interface EquipmentChoiceGrant {
  readonly type: 'equipment-choice'
  readonly options: readonly (readonly { readonly itemId: string; readonly quantity: number }[])[]
}

export type Grant =
  | AbilityBonusGrant
  | AbilityChoiceGrant
  | ProficiencyGrant
  | ProficiencyChoiceGrant
  | SkillExpertiseGrant
  | FeatureGrant
  | SpeedGrant
  | HitDieGrant
  | HpBonusGrant
  | ResistanceGrant
  | ArmorClassGrant
  | AcBonusGrant
  | SpellcastingGrant
  | SpellGrant
  | AsiGrant
  | SubclassGrant
  | EquipmentGrant
  | EquipmentChoiceGrant
