import type { AbilityKey, SkillId, ToolProficiencyId, LanguageId, ClassId, RaceId, BackgroundId } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'

/**
 * Choice key format: `category:origin:id:index`
 * - origin: 'race' | 'background' | 'class'
 * - Determines which build row (sequence) stores the decision
 * - e.g. "skill-choice:class:fighter:0", "language-choice:race:human:0"
 */
export type ChoiceKey = string

export type ChoiceDecision =
  | { readonly type: 'ability-choice'; readonly abilities: readonly AbilityKey[] }
  | { readonly type: 'skill-choice'; readonly skills: readonly SkillId[] }
  | { readonly type: 'tool-choice'; readonly tools: readonly ToolProficiencyId[] }
  | { readonly type: 'language-choice'; readonly languages: readonly LanguageId[] }
  | { readonly type: 'expertise-choice'; readonly skills: readonly SkillId[] }
  | { readonly type: 'asi'; readonly allocation: Partial<Record<AbilityKey, number>> }
  | { readonly type: 'subclass'; readonly subclassId: string }
  | { readonly type: 'equipment-choice'; readonly optionIndex: number }

export interface AppliedLevel {
  readonly classId: ClassId
  readonly classLevel: number
}

export interface CharacterBuild {
  readonly raceId: RaceId
  readonly backgroundId: BackgroundId | null
  readonly baseAbilities: AbilityScores
  readonly abilityMethod: 'standard-array' | 'point-buy' | 'rolling'
  readonly appliedLevels: readonly AppliedLevel[]
  readonly choices: Readonly<Record<ChoiceKey, ChoiceDecision>>
  readonly feats: readonly string[]
  readonly activeItems: readonly string[]
  readonly hpRolls: readonly (number | null)[]
}
