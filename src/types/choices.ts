import type { AbilityKey, SkillId, ToolProficiencyId, LanguageId, ClassId, RaceId, BackgroundId } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'

/**
 * Choice key format: `category:origin:id:index`
 * - origin: 'race' | 'background' | 'class'
 * - Determines which build row (sequence) stores the decision
 * - e.g. "skill-choice:class:fighter:0", "language-choice:race:human:0"
 */
export type ChoiceOrigin = 'race' | 'background' | 'class'
export type ChoiceKey = `${string}:${ChoiceOrigin}:${string}:${number}`

export function createChoiceKey(category: string, origin: ChoiceOrigin, id: string, index: number): ChoiceKey {
  return `${category}:${origin}:${id}:${index}`
}

export type ChoiceDecision =
  | { readonly type: 'ability-choice'; readonly abilities: readonly AbilityKey[] }
  | { readonly type: 'skill-choice'; readonly skills: readonly SkillId[] }
  | { readonly type: 'tool-choice'; readonly tools: readonly ToolProficiencyId[] }
  | { readonly type: 'language-choice'; readonly languages: readonly LanguageId[] }
  | { readonly type: 'expertise-choice'; readonly skills: readonly SkillId[] }
  | { readonly type: 'asi'; readonly allocation: Partial<Record<AbilityKey, number>> }
  | { readonly type: 'subclass'; readonly subclassId: string }
  | { readonly type: 'equipment-choice'; readonly optionIndex: number }

export interface BuildLevel {
  readonly classId: ClassId
  readonly classLevel: number
  readonly hpRoll: number | null
}

/** @deprecated Use BuildLevel instead */
export interface AppliedLevel {
  readonly classId: ClassId
  readonly classLevel: number
}

export interface CharacterBuild {
  readonly raceId: RaceId
  readonly backgroundId: BackgroundId | null
  readonly baseAbilities: AbilityScores
  readonly abilityMethod: 'standard-array' | 'point-buy' | 'rolling'
  readonly levels: readonly BuildLevel[]
  /** @deprecated Use levels instead */
  readonly appliedLevels: readonly BuildLevel[]
  readonly choices: Readonly<Record<string, ChoiceDecision>>
  readonly feats: readonly string[]
  readonly activeItems: readonly string[]
  /** @deprecated Use levels[i].hpRoll instead */
  readonly hpRolls: readonly (number | null)[]
}
