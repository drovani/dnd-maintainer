import type { AbilityKey, FightingStyleId, SkillId, ToolProficiencyId, LanguageId, ClassId, RaceId } from '@/lib/dnd-helpers'
import type { SubclassId } from '@/types/sources'
import type { AbilityScores } from '@/types/database'

/**
 * Choice key format: `category:origin:id:index`
 * - origin: 'race' | 'background' | 'class'
 * - Determines which build row (sequence) stores the decision
 * - e.g. "skill-choice:class:fighter:0", "language-choice:race:human:0"
 */
export type ChoiceOrigin = 'race' | 'background' | 'class'

export type ChoiceCategory =
  | 'skill-choice'
  | 'tool-choice'
  | 'language-choice'
  | 'ability-choice'
  | 'expertise-choice'
  | 'asi'
  | 'subclass'
  | 'fighting-style-choice'
  | 'equipment-choice'

export type ChoiceKey = `${ChoiceCategory}:${ChoiceOrigin}:${string}:${number}`

export function createChoiceKey(category: ChoiceCategory, origin: ChoiceOrigin, id: string, index: number): ChoiceKey {
  return `${category}:${origin}:${id}:${index}`
}

export interface ParsedChoiceKey {
  readonly category: ChoiceCategory
  readonly origin: ChoiceOrigin
  readonly id: string
  readonly index: number
}

const VALID_CATEGORIES = new Set<string>([
  'skill-choice', 'tool-choice', 'language-choice', 'ability-choice',
  'expertise-choice', 'asi', 'subclass', 'fighting-style-choice', 'equipment-choice',
])

export function parseChoiceKey(key: ChoiceKey | string): ParsedChoiceKey {
  const parts = key.split(':')
  if (parts.length !== 4) {
    throw new Error(`Malformed choice key "${key}": expected 4 colon-separated segments, got ${parts.length}`)
  }
  const category = parts[0]
  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(`Invalid choice key category "${category}" in key "${key}"`)
  }
  const origin = parts[1]
  if (origin !== 'race' && origin !== 'background' && origin !== 'class') {
    throw new Error(`Invalid choice key origin "${origin}" in key "${key}"`)
  }
  const index = Number(parts[3])
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`Invalid choice key index "${parts[3]}" in key "${key}": must be a non-negative integer`)
  }
  return {
    category: category as ChoiceCategory,
    origin,
    id: parts[2],
    index,
  }
}

export type ChoiceDecision =
  | { readonly type: 'ability-choice'; readonly abilities: readonly AbilityKey[] }
  | { readonly type: 'skill-choice'; readonly skills: readonly SkillId[] }
  | { readonly type: 'tool-choice'; readonly tools: readonly ToolProficiencyId[] }
  | { readonly type: 'language-choice'; readonly languages: readonly LanguageId[] }
  | { readonly type: 'expertise-choice'; readonly skills: readonly SkillId[] }
  | { readonly type: 'asi'; readonly allocation: Partial<Record<AbilityKey, number>> }
  | { readonly type: 'subclass'; readonly subclassId: SubclassId }
  | { readonly type: 'fighting-style-choice'; readonly styles: readonly FightingStyleId[] }
  | { readonly type: 'equipment-choice'; readonly optionIndex: number }

export interface BuildLevel {
  readonly classId: ClassId
  readonly classLevel: number
  readonly hpRoll: number | null
}

export interface CharacterBuild {
  readonly raceId: RaceId
  readonly backgroundId: string | null
  readonly baseAbilities: AbilityScores
  readonly abilityMethod: 'standard-array' | 'point-buy' | 'rolling'
  readonly levels: readonly BuildLevel[]
  readonly choices: Readonly<Record<ChoiceKey, ChoiceDecision>>
  readonly feats: readonly string[]
  readonly activeItems: readonly string[]
}
