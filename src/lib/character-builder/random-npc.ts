import { CLASS_SOURCES } from '@/lib/sources/classes';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';
import { getLogger } from '@/lib/logger';

const logger = getLogger('random-npc');
import { LINEAGE_GRANTS_REGISTRY, SPECIES_SOURCES } from '@/lib/sources/species';
import {
  DND_ALIGNMENTS,
  DND_SPECIES_NAMES,
  generateCharacterName,
  type AbilityKey,
  type AlignmentId,
  type BackgroundId,
  type ClassId,
  type DndGender,
  type SpeciesId,
} from '@/lib/dnd-helpers';
import type { AbilityScores } from '@/types/database';
import type { ClassSource } from '@/types/sources';
import { createChoiceKey, type ChoiceKey } from '@/types/choices';

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
const ABILITY_KEYS: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export type RandomNpcFailure = 'unknown-class' | 'name-generation' | 'empty-data-source';

interface RandomNpcBasicsBase {
  readonly gender: DndGender;
  readonly species: SpeciesId;
  readonly alignment: AlignmentId;
  readonly name: string;
  readonly classId: ClassId;
  readonly lineageDecision?: {
    readonly key: ChoiceKey;
    readonly lineageId: string;
  };
}

export type RandomNpcBasics =
  | (RandomNpcBasicsBase & {
      readonly targetStep: 'class';
      readonly baseAbilities: AbilityScores;
      readonly suggestedBackground: BackgroundId;
      readonly backgroundAsiDecision?: {
        readonly key: ChoiceKey;
        readonly allocation: Partial<Record<AbilityKey, number>>;
      };
    })
  | (RandomNpcBasicsBase & {
      readonly targetStep: 'abilities';
    });

export type RandomNpcResult =
  | { readonly ok: true; readonly basics: RandomNpcBasics }
  | { readonly ok: false; readonly failure: RandomNpcFailure };

type Rng = () => number;

function pick<T>(arr: readonly T[], rng: Rng): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getQuickNpcClassIds(): readonly ClassId[] {
  return CLASS_SOURCES.map((c) => c.id);
}

/**
 * If the species has lineage options (e.g. dragonborn, elf, gnome, goliath, tiefling),
 * pick a random lineage and return a ready-to-store choice decision. Returns null
 * for species without lineage choices (dwarf, halfling, human, orc, aasimar).
 */
export function pickRandomLineage(
  speciesId: SpeciesId,
  rng: Rng = Math.random
): { readonly key: ChoiceKey; readonly lineageId: string } | null {
  const lineageMap = (LINEAGE_GRANTS_REGISTRY as Partial<Record<SpeciesId, Readonly<Record<string, unknown>>>>)[
    speciesId
  ];
  if (!lineageMap) return null;
  const lineageIds = Object.keys(lineageMap);
  const lineageId = pick(lineageIds, rng);
  if (!lineageId) return null;
  return {
    key: createChoiceKey('lineage-choice', 'species', speciesId, 0),
    lineageId,
  };
}

/**
 * Assigns the Standard Array per PHB Quick Build: 15 to highest, 14 to secondary,
 * and [13, 12, 10, 8] shuffled among the remaining four abilities.
 */
export function assignStandardArray(highest: AbilityKey, secondary: AbilityKey, rng: Rng = Math.random): AbilityScores {
  if (highest === secondary) {
    throw new Error(`assignStandardArray: highest and secondary must differ (got "${highest}" for both)`);
  }
  const remaining = ABILITY_KEYS.filter((k) => k !== highest && k !== secondary);
  const shuffledRemainder = shuffle([13, 12, 10, 8] as const, rng);
  const scores: AbilityScores = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  scores[highest] = 15;
  scores[secondary] = 14;
  remaining.forEach((key, idx) => {
    scores[key] = shuffledRemainder[idx];
  });
  return scores;
}

/**
 * Distribute `points` ASI points across a shuffled `from` pool.
 * Gives min(2, remaining) to each ability in order until points are exhausted.
 * e.g. points=3, shuffled=['str','con','dex'] → { str: 2, con: 1 }
 */
export function randomAsiAllocation(
  points: number,
  from: readonly AbilityKey[],
  rng: Rng
): Partial<Record<AbilityKey, number>> {
  const shuffled = shuffle(from, rng);
  const allocation: Partial<Record<AbilityKey, number>> = {};
  let remaining = points;
  for (const ability of shuffled) {
    if (remaining <= 0) break;
    const give = Math.min(2, remaining);
    allocation[ability] = give;
    remaining -= give;
  }
  return allocation;
}

/**
 * Generate randomized NPC basics for the given class. Returns `{ basics, failure }`
 * so callers can surface a specific reason for null results. All randomness flows
 * through the injected `rng` for deterministic testing.
 */
export function generateRandomNpcBasicsDetailed(
  classId: ClassId,
  rng: Rng = Math.random,
  classSources: readonly ClassSource[] = CLASS_SOURCES
): RandomNpcResult {
  const classSource = classSources.find((c) => c.id === classId);
  if (!classSource) {
    logger.error('Unknown classId for Quick NPC', { classId });
    return { ok: false, failure: 'unknown-class' };
  }

  const gender = pick(['male', 'female'] as const, rng);
  const eligibleSpecies = SPECIES_SOURCES.filter((s) => {
    const nameData = DND_SPECIES_NAMES[s.id];
    return nameData && nameData.male.length > 0 && nameData.female.length > 0;
  });
  const raceSource = pick(eligibleSpecies, rng);
  const alignmentSource = pick(DND_ALIGNMENTS, rng);
  if (!gender || !raceSource || !alignmentSource) {
    logger.error('Empty data source for Quick NPC', {
      classId,
      eligibleSpecies: eligibleSpecies.length,
      alignments: DND_ALIGNMENTS.length,
    });
    return { ok: false, failure: 'empty-data-source' };
  }
  const species = raceSource.id;
  const alignment = alignmentSource.id;
  const name = generateCharacterName(species, gender, rng);
  if (!name) {
    logger.error('Name generation returned null', { classId, species, gender });
    return { ok: false, failure: 'name-generation' };
  }

  const lineageDecision = pickRandomLineage(species, rng) ?? undefined;

  const qb = classSource.quickBuild;
  if (!qb) {
    return {
      ok: true,
      basics: {
        gender,
        species,
        alignment,
        name,
        classId,
        targetStep: 'abilities',
        ...(lineageDecision !== undefined ? { lineageDecision } : {}),
      },
    };
  }

  const highest = pick(qb.highestAbility, rng);
  if (!highest) {
    logger.error('quickBuild.highestAbility is empty', { classId });
    return { ok: false, failure: 'empty-data-source' };
  }
  const baseAbilities = assignStandardArray(highest, qb.secondaryAbility, rng);

  const bgSource = BACKGROUND_SOURCES.find((b) => b.id === qb.suggestedBackground);
  const asiGrant = bgSource?.grants.find((g) => g.type === 'asi');
  const backgroundAsiDecision =
    asiGrant && asiGrant.from !== null
      ? {
          key: asiGrant.key,
          allocation: randomAsiAllocation(asiGrant.points, asiGrant.from, rng),
        }
      : undefined;

  return {
    ok: true,
    basics: {
      gender,
      species,
      alignment,
      name,
      classId,
      baseAbilities,
      suggestedBackground: qb.suggestedBackground,
      targetStep: 'class',
      ...(backgroundAsiDecision !== undefined ? { backgroundAsiDecision } : {}),
      ...(lineageDecision !== undefined ? { lineageDecision } : {}),
    },
  };
}

export function generateRandomNpcBasics(
  classId: ClassId,
  rng: Rng = Math.random,
  classSources: readonly ClassSource[] = CLASS_SOURCES
): RandomNpcBasics | null {
  const result = generateRandomNpcBasicsDetailed(classId, rng, classSources);
  return result.ok ? result.basics : null;
}
