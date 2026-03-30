import type { AbilityKey, SkillId, ToolProficiencyId, LanguageId, ClassId, RaceId } from '@/lib/dnd-helpers'
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

export interface ParsedChoiceKey {
  readonly category: string
  readonly origin: ChoiceOrigin
  readonly id: string
  readonly index: number
}

export function parseChoiceKey(key: ChoiceKey | string): ParsedChoiceKey {
  const parts = key.split(':')
  if (parts.length !== 4) {
    throw new Error(`Malformed choice key "${key}": expected 4 colon-separated segments, got ${parts.length}`)
  }
  const origin = parts[1]
  if (origin !== 'race' && origin !== 'background' && origin !== 'class') {
    throw new Error(`Invalid choice key origin "${origin}" in key "${key}"`)
  }
  return {
    category: parts[0],
    origin,
    id: parts[2],
    index: Number(parts[3]),
  }
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
  readonly backgroundId: string | null
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
