import type { CharacterBuild, BuildLevel, ChoiceKey, ChoiceDecision } from '@/types/choices';
import type { ClassId, SpeciesId, BackgroundId } from '@/lib/dnd-helpers';
import type { AbilityScores } from '@/types/database';
import { collectBundles } from '@/lib/sources';
import { resolveCharacter } from '@/lib/resolver';
import type { ResolvedCharacter } from '@/types/resolved';

/**
 * Shared character-build factory for the resolver seam. Character feature steps
 * construct a CharacterBuild here and resolve it via the real
 * collectBundles() + resolveCharacter() pipeline — the same seam level-up.steps.ts
 * uses. No UI, no supabase: character-creation behavior lives in the resolver.
 */

export interface BuildOpts {
  readonly classId?: ClassId;
  readonly level?: number;
  readonly speciesId?: SpeciesId;
  readonly backgroundId?: BackgroundId | null;
  readonly baseAbilities?: AbilityScores;
  readonly abilityMethod?: CharacterBuild['abilityMethod'];
  readonly choices?: Readonly<Record<ChoiceKey, ChoiceDecision>>;
}

/** 2024 PHB standard array, arbitrarily assigned — saving-throw/skill/feature
 * resolution does not depend on which scores sit where. */
export const STANDARD_ARRAY: AbilityScores = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };

export function makeBuild(opts: BuildOpts = {}): CharacterBuild {
  const level = opts.level ?? 1;
  const classId: ClassId = opts.classId ?? 'fighter';
  const levels: BuildLevel[] = Array.from({ length: level }, (_, i) => ({
    classId,
    classLevel: i + 1,
    hpRoll: null,
  }));

  return {
    speciesId: opts.speciesId ?? 'human',
    backgroundId: opts.backgroundId === undefined ? 'soldier' : opts.backgroundId,
    baseAbilities: opts.baseAbilities ?? STANDARD_ARRAY,
    abilityMethod: opts.abilityMethod ?? 'standard-array',
    choices: opts.choices ?? {},
    levels,
    feats: [],
    activeItems: [],
  };
}

export function resolveBuild(build: CharacterBuild, level?: number): ResolvedCharacter {
  const { bundles, expandedFeats } = collectBundles(build);
  const lvl = level ?? build.levels.length;
  return resolveCharacter({
    baseAbilities: build.baseAbilities,
    level: lvl,
    bundles,
    choices: build.choices,
    hpRolls: Array(lvl).fill(null) as (number | null)[],
    expandedFeats,
  });
}
