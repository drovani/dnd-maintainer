import type { ClassId, RaceId, BackgroundId } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import type { CharacterBuild, ChoiceDecision } from '@/types/choices'
import { AbilityScoresSchema, ChoiceDecisionSchema } from '@/lib/schemas/character-build'

export interface BuildLevelRow {
  readonly sequence: number
  readonly base_abilities: Record<string, number> | null
  readonly ability_method: string | null
  readonly class_id: string | null
  readonly class_level: number | null
  readonly subclass_id: string | null
  readonly asi_allocation: Record<string, number> | null
  readonly feat_id: string | null
  readonly hp_roll: number | null
  readonly choices: Record<string, unknown> | null
}

export interface CharacterIdentity {
  readonly race: string | null
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
  if (!character.background) throw new Error('Character is missing required background')

  const creationRow = rows.find((r) => r.sequence === 0)
  if (!creationRow) {
    throw new Error('Missing creation row (sequence 0)')
  }

  const levelRows = [...rows.filter((r) => r.sequence !== 0)].sort(
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

  const appliedLevels = levelRows.map((row) => {
    if (!row.class_id) throw new Error(`Level row sequence ${row.sequence} is missing class_id`)
    if (row.class_level === null || row.class_level === undefined)
      throw new Error(`Level row sequence ${row.sequence} is missing class_level`)
    return {
      classId: row.class_id as ClassId,
      classLevel: row.class_level,
    }
  })

  const hpRolls: (number | null)[] = levelRows.map((row) => row.hp_roll ?? null)

  const feats: string[] = levelRows
    .filter((row) => row.feat_id !== null)
    .map((row) => row.feat_id as string)

  // Build choices map
  const choices: Record<string, ChoiceDecision> = {}

  // Helper to safely parse and merge a choices JSONB entry
  function mergeChoiceEntry(key: string, value: unknown): void {
    const parsed = ChoiceDecisionSchema.safeParse(value)
    if (!parsed.success) {
      throw new Error(`Invalid choice "${key}": ${parsed.error.message}`)
    }
    choices[key] = parsed.data as ChoiceDecision
  }

  // Start with creation row's choices JSONB
  if (creationRow.choices) {
    for (const [key, value] of Object.entries(creationRow.choices)) {
      mergeChoiceEntry(key, value)
    }
  }

  // Process level rows
  for (const row of levelRows) {
    if (!row.class_id) throw new Error(`Level row sequence ${row.sequence} is missing class_id`)
    if (row.class_level === null || row.class_level === undefined)
      throw new Error(`Level row sequence ${row.sequence} is missing class_level`)

    if (row.subclass_id !== null) {
      // Use subclass:${classId} format to match sources/index.ts lookup
      const key = `subclass:${row.class_id}`
      choices[key] = { type: 'subclass', subclassId: row.subclass_id }
    }

    if (row.asi_allocation !== null) {
      const key = `${row.class_id}-${row.class_level}-asi`
      choices[key] = { type: 'asi', allocation: row.asi_allocation }
    }

    if (row.choices) {
      for (const [key, value] of Object.entries(row.choices)) {
        mergeChoiceEntry(key, value)
      }
    }
  }

  return {
    raceId: character.race as RaceId,
    backgroundId: character.background as BackgroundId,
    baseAbilities,
    abilityMethod,
    appliedLevels,
    choices,
    feats,
    activeItems: equippedItems,
    hpRolls,
  }
}
