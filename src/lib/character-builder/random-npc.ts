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
import type { ClassSource } from '@/types/sources'

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const
const ABILITY_KEYS: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export type RandomNpcFailure = 'unknown-class' | 'name-generation' | 'empty-data-source'

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

export type RandomNpcResult =
  | { readonly ok: true; readonly basics: RandomNpcBasics }
  | { readonly ok: false; readonly failure: RandomNpcFailure }

type Rng = () => number

function pick<T>(arr: readonly T[], rng: Rng): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(rng() * arr.length)]
}

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
  if (highest === secondary) {
    throw new Error(
      `assignStandardArray: highest and secondary must differ (got "${highest}" for both)`,
    )
  }
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

/**
 * Generate randomized NPC basics for the given class. Returns `{ basics, failure }`
 * so callers can surface a specific reason for null results. All randomness flows
 * through the injected `rng` for deterministic testing.
 */
export function generateRandomNpcBasicsDetailed(
  classId: ClassId,
  rng: Rng = Math.random,
  classSources: readonly ClassSource[] = CLASS_SOURCES,
): RandomNpcResult {
  const classSource = classSources.find((c) => c.id === classId)
  if (!classSource) {
    console.error('[random-npc] Unknown classId for Quick NPC', { classId })
    return { ok: false, failure: 'unknown-class' }
  }

  const gender = pick(['male', 'female'] as const, rng)
  const raceSource = pick(RACE_SOURCES, rng)
  const alignmentSource = pick(DND_ALIGNMENTS, rng)
  if (!gender || !raceSource || !alignmentSource) {
    console.error('[random-npc] Empty data source for Quick NPC', {
      classId,
      raceSources: RACE_SOURCES.length,
      alignments: DND_ALIGNMENTS.length,
    })
    return { ok: false, failure: 'empty-data-source' }
  }
  const race = raceSource.id
  const alignment = alignmentSource.id
  const name = generateCharacterName(race, gender, rng)
  if (!name) {
    console.error('[random-npc] Name generation returned null', { classId, race, gender })
    return { ok: false, failure: 'name-generation' }
  }

  const qb = classSource.quickBuild
  if (!qb) {
    return {
      ok: true,
      basics: { gender, race, alignment, name, classId, targetStep: 'abilities' },
    }
  }

  const highest = pick(qb.highestAbility, rng)
  if (!highest) {
    console.error('[random-npc] quickBuild.highestAbility is empty', { classId })
    return { ok: false, failure: 'empty-data-source' }
  }
  const baseAbilities = assignStandardArray(highest, qb.secondaryAbility, rng)

  return {
    ok: true,
    basics: {
      gender,
      race,
      alignment,
      name,
      classId,
      baseAbilities,
      suggestedBackground: qb.suggestedBackground,
      targetStep: 'skills',
    },
  }
}

export function generateRandomNpcBasics(
  classId: ClassId,
  rng: Rng = Math.random,
  classSources: readonly ClassSource[] = CLASS_SOURCES,
): RandomNpcBasics | null {
  const result = generateRandomNpcBasicsDetailed(classId, rng, classSources)
  return result.ok ? result.basics : null
}
