import { DND_CLASSES, isBackgroundId } from '@/lib/dnd-helpers'
import type { ClassId, RaceId } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import type { CharacterBuild, ChoiceDecision, ChoiceKey } from '@/types/choices'
import { isSubclassId } from '@/types/sources'
import { createChoiceKey, parseChoiceKey } from '@/types/choices'
import { AbilityScoresSchema, ChoiceDecisionSchema } from '@/lib/schemas/character-build'
import { CLASS_SOURCES } from '@/lib/sources/classes'

/**
 * A single row from `character_build_levels`.
 *
 * - **sequence === 0**: Creation row — carries `base_abilities`, `ability_method`,
 *   and race/background choices. `class_id` and `class_level` are null.
 * - **sequence > 0**: Level row — carries `class_id`, `class_level`, and class
 *   choices. `base_abilities` and `ability_method` are null.
 */
interface BaseBuildRow {
  readonly character_id?: string
  readonly choices: Record<string, ChoiceDecision> | null
  readonly deleted_at: string | null
}

export interface CreationRow extends BaseBuildRow {
  readonly sequence: 0
  readonly base_abilities: AbilityScores | null
  readonly ability_method: string | null
  readonly asi_allocation?: Record<string, number> | null
  readonly class_id?: string | null
  readonly class_level?: number | null
  readonly subclass_id?: string | null
  readonly hp_roll?: number | null
  readonly feat_id?: string | null
}

export interface LevelRow extends BaseBuildRow {
  readonly sequence: number // > 0
  readonly class_id: string
  readonly class_level: number
  readonly subclass_id: string | null
  readonly asi_allocation: Record<string, number> | null
  readonly hp_roll: number | null
  readonly feat_id: string | null
  readonly base_abilities?: AbilityScores | null
  readonly ability_method?: string | null
}

export type BuildLevelRow = CreationRow | LevelRow

export function isCreationRow(row: BuildLevelRow): row is CreationRow {
  return row.sequence === 0
}

export interface CharacterIdentity {
  readonly race: RaceId | null
  readonly background: string | null
}

const DEFAULT_ABILITIES: AbilityScores = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
}

const VALID_ABILITY_METHODS = ['standard-array', 'point-buy', 'rolling'] as const
type AbilityMethod = (typeof VALID_ABILITY_METHODS)[number]

export function reconstructBuild(
  character: CharacterIdentity,
  rows: readonly BuildLevelRow[],
  equippedItems: readonly string[],
): CharacterBuild {
  if (!character.race) throw new Error('Character is missing required race')

  const creationRow = rows.find((r): r is CreationRow => isCreationRow(r))
  if (!creationRow) {
    throw new Error('Missing creation row (sequence 0)')
  }

  const levelRows = [...rows.filter((r): r is LevelRow => !isCreationRow(r))].sort(
    (a, b) => a.sequence - b.sequence,
  )

  let baseAbilities: AbilityScores
  if (creationRow.base_abilities) {
    const parsed = AbilityScoresSchema.safeParse(creationRow.base_abilities)
    if (!parsed.success) {
      throw new Error(
        `Invalid base_abilities in creation row: ${parsed.error.message}`,
      )
    }
    baseAbilities = parsed.data
  } else {
    baseAbilities = { ...DEFAULT_ABILITIES }
  }

  let abilityMethod: AbilityMethod
  if (creationRow.ability_method === null) {
    abilityMethod = 'standard-array'
  } else if ((VALID_ABILITY_METHODS as readonly string[]).includes(creationRow.ability_method)) {
    abilityMethod = creationRow.ability_method as AbilityMethod
  } else {
    throw new Error(
      `Invalid ability_method "${creationRow.ability_method}": must be one of ${VALID_ABILITY_METHODS.join(', ')}`,
    )
  }

  function validateClassId(classId: string, sequence: number): ClassId {
    if (!DND_CLASSES.some(c => c.id === classId)) {
      throw new Error(`Unknown class ID "${classId}" in build level row sequence ${sequence}`)
    }
    return classId as ClassId
  }

  const levels = levelRows.map((row) => ({
    classId: validateClassId(row.class_id, row.sequence),
    classLevel: row.class_level,
    hpRoll: row.hp_roll ?? null,
  }))

  const feats: string[] = levelRows
    .filter((row): row is LevelRow & { feat_id: string } => row.feat_id !== null)
    .map((row) => row.feat_id)

  // Build choices map
  const choices: Record<ChoiceKey, ChoiceDecision> = {} as Record<ChoiceKey, ChoiceDecision>

  // Helper to validate a JSONB choice key from the DB
  function validateChoiceKey(key: string): ChoiceKey {
    parseChoiceKey(key) // throws on malformed keys
    return key as ChoiceKey
  }

  // Helper to safely parse and merge a choices JSONB entry
  function mergeChoiceEntry(key: ChoiceKey, value: unknown): void {
    const parsed = ChoiceDecisionSchema.safeParse(value)
    if (!parsed.success) {
      throw new Error(`Invalid choice "${key}": ${parsed.error.message}`)
    }
    choices[key] = parsed.data as ChoiceDecision
  }

  // Start with creation row's choices JSONB
  if (creationRow.choices) {
    for (const [key, value] of Object.entries(creationRow.choices)) {
      try {
        mergeChoiceEntry(validateChoiceKey(key), value)
      } catch (err) {
        console.warn(`Skipping malformed choice key "${key}" in creation row:`, err)
      }
    }
  }

  // Process level rows
  for (const row of levelRows) {
    if (row.subclass_id !== null) {
      if (!isSubclassId(row.subclass_id)) {
        console.warn(`Skipping unknown subclass_id "${row.subclass_id}" in build level row sequence ${row.sequence}`)
      } else {
        const key = createChoiceKey('subclass', 'class', row.class_id, 0)
        choices[key] = { type: 'subclass', subclassId: row.subclass_id }
      }
    }

    if (row.asi_allocation !== null) {
      const classSource = CLASS_SOURCES.find((cs) => cs.id === row.class_id)
      let asiGrantIndex = 0
      if (classSource) {
        // Count how many ASI-granting levels come before this one (0-indexed levels array)
        let count = 0
        for (let i = 0; i < classSource.levels.length; i++) {
          if (classSource.levels[i].grants.some((g) => g.type === 'asi')) {
            if (i + 1 === row.class_level) {
              asiGrantIndex = count
              break
            }
            count++
          }
        }
      }
      const key = createChoiceKey('asi', 'class', row.class_id, asiGrantIndex)
      choices[key] = { type: 'asi', allocation: row.asi_allocation }
    }

    if (row.choices) {
      for (const [key, value] of Object.entries(row.choices)) {
        try {
          mergeChoiceEntry(validateChoiceKey(key), value)
        } catch (err) {
          console.warn(`Skipping malformed choice key "${key}" in level row sequence ${row.sequence}:`, err)
        }
      }
    }
  }

  const backgroundId = character.background !== null && isBackgroundId(character.background)
    ? character.background
    : null

  return {
    raceId: character.race as RaceId,
    backgroundId,
    baseAbilities,
    abilityMethod,
    levels,
    choices,
    feats,
    activeItems: equippedItems,
  }
}
