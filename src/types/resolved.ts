import type { AbilityKey, SkillId, ArmorProficiencyId, WeaponProficiencyId, ToolProficiencyId, LanguageId, ClassId } from '@/lib/dnd-helpers'
import type { FeatureDef, DamageTypeId, HitDie, SpeedMode } from '@/types/grants'
import type { SourceTag } from '@/types/sources'
import type { ChoiceKey } from '@/types/choices'

export interface Sourced<T> {
  readonly value: T
  readonly sources: readonly SourceTag[]
}

export interface ResolvedAbility {
  readonly base: number
  readonly bonuses: readonly { readonly value: number; readonly source: SourceTag }[]
  readonly total: number
  readonly modifier: number
}

export interface ResolvedSkill {
  readonly ability: AbilityKey
  readonly proficient: boolean
  readonly expertise: boolean
  readonly bonus: number
  readonly sources: readonly SourceTag[]
}

export interface ResolvedFeature {
  readonly feature: FeatureDef
  readonly source: SourceTag
}

export interface ResolvedArmorClass {
  readonly calculations: readonly { readonly mode: 'armored' | 'unarmored' | 'natural'; readonly baseValue: number; readonly source: SourceTag }[]
  readonly bonuses: readonly { readonly value: number; readonly source: SourceTag }[]
  readonly effective: number
}

export interface ResolvedSpellcasting {
  readonly ability: AbilityKey
  readonly spellSaveDC: number
  readonly spellAttackBonus: number
  readonly cantrips: readonly string[]
  readonly knownSpells: readonly string[]
  readonly alwaysPreparedSpells: readonly string[]
  readonly slots: readonly number[]
}

export type PendingChoice =
  | { readonly type: 'ability-choice'; readonly choiceKey: ChoiceKey; readonly source: SourceTag; readonly count: number; readonly bonus: number; readonly from: readonly AbilityKey[] | null }
  | { readonly type: 'skill-choice'; readonly choiceKey: ChoiceKey; readonly source: SourceTag; readonly category: 'skill'; readonly count: number; readonly from: readonly SkillId[] | null }
  | { readonly type: 'tool-choice'; readonly choiceKey: ChoiceKey; readonly source: SourceTag; readonly category: 'tool'; readonly count: number; readonly from: readonly ToolProficiencyId[] | null }
  | { readonly type: 'language-choice'; readonly choiceKey: ChoiceKey; readonly source: SourceTag; readonly count: number; readonly from: readonly LanguageId[] | null }
  | { readonly type: 'expertise-choice'; readonly choiceKey: ChoiceKey; readonly source: SourceTag; readonly count: number; readonly from: readonly SkillId[] | null }
  | { readonly type: 'asi'; readonly choiceKey: ChoiceKey; readonly source: SourceTag }
  | { readonly type: 'subclass'; readonly choiceKey: ChoiceKey; readonly source: SourceTag; readonly classId: ClassId }
  | { readonly type: 'equipment-choice'; readonly choiceKey: ChoiceKey; readonly source: SourceTag; readonly options: readonly (readonly { readonly itemId: string; readonly quantity: number }[])[] }

export interface ResolvedCharacter {
  readonly abilities: Readonly<Record<AbilityKey, ResolvedAbility>>
  readonly hitDie: readonly { readonly die: HitDie; readonly count: number }[]
  readonly hitPoints: { readonly max: number }
  readonly speed: Readonly<Partial<Record<SpeedMode, Sourced<number>>>>
  readonly initiative: number
  readonly proficiencyBonus: number
  readonly armorClass: ResolvedArmorClass
  readonly savingThrows: Readonly<Record<AbilityKey, { readonly proficient: boolean; readonly bonus: number; readonly sources: readonly SourceTag[] }>>
  readonly skills: Readonly<Record<SkillId, ResolvedSkill>>
  readonly armorProficiencies: readonly Sourced<ArmorProficiencyId>[]
  readonly weaponProficiencies: readonly Sourced<WeaponProficiencyId>[]
  readonly toolProficiencies: readonly Sourced<ToolProficiencyId>[]
  readonly languages: readonly Sourced<LanguageId>[]
  readonly features: readonly ResolvedFeature[]
  readonly resistances: readonly Sourced<DamageTypeId>[]
  readonly immunities: readonly Sourced<DamageTypeId>[]
  readonly spellcasting: ResolvedSpellcasting | null
  readonly pendingChoices: readonly PendingChoice[]
}
