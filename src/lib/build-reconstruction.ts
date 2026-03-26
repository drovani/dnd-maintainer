import type { ClassId, RaceId, BackgroundId } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import type { CharacterBuild, ChoiceDecision } from '@/types/choices'

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

export function reconstructBuild(
  character: CharacterIdentity,
  rows: readonly BuildLevelRow[],
  equippedItems: readonly string[],
): CharacterBuild {
  const creationRow = rows.find((r) => r.sequence === 0)
  if (!creationRow) {
    throw new Error('Missing creation row (sequence 0)')
  }

  const levelRows = [...rows.filter((r) => r.sequence !== 0)].sort(
    (a, b) => a.sequence - b.sequence,
  )

  const baseAbilities: AbilityScores = creationRow.base_abilities
    ? (creationRow.base_abilities as AbilityScores)
    : { ...DEFAULT_ABILITIES }

  const abilityMethod = (creationRow.ability_method ?? 'standard-array') as
    | 'standard-array'
    | 'point-buy'
    | 'rolling'

  const appliedLevels = levelRows.map((row) => ({
    classId: row.class_id as ClassId,
    classLevel: row.class_level as number,
  }))

  const hpRolls: (number | null)[] = levelRows.map((row) => row.hp_roll ?? null)

  const feats: string[] = levelRows
    .filter((row) => row.feat_id !== null)
    .map((row) => row.feat_id as string)

  // Build choices map
  const choices: Record<string, ChoiceDecision> = {}

  // Start with creation row's choices JSONB
  if (creationRow.choices) {
    for (const [key, value] of Object.entries(creationRow.choices)) {
      choices[key] = value as ChoiceDecision
    }
  }

  // Process level rows
  for (const row of levelRows) {
    if (row.subclass_id !== null) {
      const key = `${row.class_id}-${row.class_level}-subclass`
      choices[key] = { type: 'subclass', subclassId: row.subclass_id }
    }

    if (row.asi_allocation !== null) {
      const key = `${row.class_id}-${row.class_level}-asi`
      choices[key] = { type: 'asi', allocation: row.asi_allocation }
    }

    if (row.choices) {
      for (const [key, value] of Object.entries(row.choices)) {
        choices[key] = value as ChoiceDecision
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
