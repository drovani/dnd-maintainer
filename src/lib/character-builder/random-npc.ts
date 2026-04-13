import { CLASS_SOURCES } from '@/lib/sources/classes'
import { RACE_SOURCES } from '@/lib/sources/races'
import {
  DND_ALIGNMENTS,
  generateCharacterName,
  type AbilityKey,
  type AlignmentId,
  type BackgroundId,
  type ClassId,
  type DndGender,
  type RaceId,
} from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const
const ABILITY_KEYS: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

interface RandomNpcBasicsBase {
  readonly gender: DndGender
  readonly race: RaceId
  readonly alignment: AlignmentId
  readonly name: string
  readonly classId: ClassId
}

export type RandomNpcBasics =
  | (RandomNpcBasicsBase & {
      readonly targetStep: 'skills'
      readonly baseAbilities: AbilityScores
      readonly suggestedBackground: BackgroundId
    })
  | (RandomNpcBasicsBase & {
      readonly targetStep: 'abilities'
    })

type Rng = () => number

function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Fisher–Yates shuffle producing a new array. */
function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function getQuickNpcClassIds(): readonly ClassId[] {
  return CLASS_SOURCES.map((c) => c.id)
}

/**
 * Assigns the Standard Array per PHB Quick Build: 15 to highest, 14 to secondary,
 * and [13, 12, 10, 8] shuffled among the remaining four abilities.
 */
export function assignStandardArray(
  highest: AbilityKey,
  secondary: AbilityKey,
  rng: Rng = Math.random,
): AbilityScores {
  const remaining = ABILITY_KEYS.filter((k) => k !== highest && k !== secondary)
  const shuffledRemainder = shuffle([13, 12, 10, 8] as const, rng)
  const scores: AbilityScores = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  scores[highest] = 15
  scores[secondary] = 14
  remaining.forEach((key, idx) => {
    scores[key] = shuffledRemainder[idx]
  })
  return scores
}

export function generateRandomNpcBasics(
  classId: ClassId,
  rng: Rng = Math.random,
): RandomNpcBasics | null {
  const classSource = CLASS_SOURCES.find((c) => c.id === classId)
  if (!classSource) {
    console.error('[random-npc] Unknown classId for Quick NPC', { classId })
    return null
  }

  const gender: DndGender = pick(['male', 'female'] as const, rng)
  const race = pick(RACE_SOURCES, rng).id
  const alignment = pick(DND_ALIGNMENTS, rng).id
  const name = generateCharacterName(race, gender)
  if (!name) {
    console.error('[random-npc] Name generation returned null', { classId, race, gender })
    return null
  }

  const qb = classSource.quickBuild
  if (!qb) {
    return { gender, race, alignment, name, classId, targetStep: 'abilities' }
  }

  const highest: AbilityKey = Array.isArray(qb.highestAbility)
    ? pick(qb.highestAbility as readonly AbilityKey[], rng)
    : (qb.highestAbility as AbilityKey)
  const baseAbilities = assignStandardArray(highest, qb.secondaryAbility, rng)

  return {
    gender,
    race,
    alignment,
    name,
    classId,
    baseAbilities,
    suggestedBackground: qb.suggestedBackground,
    targetStep: 'skills',
  }
}
