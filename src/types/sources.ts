import type { SpeciesId, ClassId, BackgroundId, SizeId, AbilityKey, FeatId } from '@/lib/dnd-helpers';
import type { Grant } from '@/types/grants';
import type { SubclassId } from '@/lib/sources/subclasses';
import type { SourceBookId } from '@/lib/source-books';

export type { SubclassId } from '@/lib/sources/subclasses';
export { isSubclassId } from '@/lib/sources/subclasses';

export type SourceTag =
  | { readonly origin: 'species'; readonly id: SpeciesId }
  | { readonly origin: 'class'; readonly id: ClassId; readonly level: number }
  | { readonly origin: 'subclass'; readonly id: SubclassId; readonly classId: ClassId; readonly level: number }
  | { readonly origin: 'background'; readonly id: BackgroundId }
  | { readonly origin: 'feat'; readonly id: FeatId }
  | { readonly origin: 'item'; readonly id: string }
  | { readonly origin: 'bundle'; readonly id: string }
  | { readonly origin: 'pack'; readonly id: string }
  | { readonly origin: 'loot'; readonly description: string };

export interface GrantBundle {
  readonly source: SourceTag;
  readonly grants: readonly Grant[];
}

export interface SpeciesSource {
  readonly id: SpeciesId;
  readonly defaultSize: SizeId;
  readonly defaultSpeed: number;
  readonly grants: readonly Grant[];
  readonly sourceBook?: SourceBookId;
}

export interface LevelUp {
  readonly grants: readonly Grant[];
}

export interface ClassQuickBuildSpec {
  /** Abilities eligible to receive 15 from the Standard Array. Must not include `secondaryAbility`. */
  readonly highestAbility: readonly [AbilityKey, ...AbilityKey[]];
  readonly secondaryAbility: AbilityKey;
  readonly suggestedBackground: BackgroundId;
}

declare const quickBuildBrand: unique symbol;
export type ClassQuickBuild = ClassQuickBuildSpec & { readonly [quickBuildBrand]: true };

/**
 * Only path that produces a `ClassQuickBuild`. Brand prevents raw object literals
 * from satisfying `ClassSource.quickBuild`, so invalid specs cannot slip in at
 * call sites. Throws if `secondaryAbility` overlaps `highestAbility`, if
 * `highestAbility` has duplicates, or if `highestAbility` is empty.
 */
export function makeQuickBuild(qb: ClassQuickBuildSpec): ClassQuickBuild {
  const highs = qb.highestAbility;
  if (highs.length === 0) {
    throw new Error('makeQuickBuild: highestAbility must not be empty');
  }
  const uniqueHighs = new Set(highs);
  if (uniqueHighs.size !== highs.length) {
    throw new Error(`makeQuickBuild: highestAbility contains duplicates: [${highs.join(', ')}]`);
  }
  if (uniqueHighs.has(qb.secondaryAbility)) {
    throw new Error(
      `makeQuickBuild: secondaryAbility "${qb.secondaryAbility}" must not appear in highestAbility [${highs.join(', ')}]`
    );
  }
  return qb as ClassQuickBuild;
}

export interface ClassSource {
  readonly id: ClassId;
  readonly primaryAbility: AbilityKey;
  readonly levels: readonly LevelUp[];
  readonly quickBuild?: ClassQuickBuild;
  readonly sourceBook?: SourceBookId;
}

export interface SubclassFeature {
  readonly classLevel: number;
  readonly grants: readonly Grant[];
}

export interface SubclassSource {
  readonly features: readonly SubclassFeature[];
  readonly sourceBook?: SourceBookId;
}

export interface BackgroundSource {
  readonly id: BackgroundId;
  readonly grants: readonly Grant[];
  readonly sourceBook?: SourceBookId;
}

export const FEAT_CATEGORIES = ['origin', 'general', 'fightingStyle', 'epicBoon'] as const;
export type FeatCategory = (typeof FEAT_CATEGORIES)[number];

export type FeatPrerequisite =
  | { readonly type: 'ability-minimum'; readonly ability: AbilityKey; readonly minimum: number }
  | { readonly type: 'proficiency'; readonly category: 'armor' | 'weapon'; readonly id: string }
  | { readonly type: 'spellcasting' }
  | { readonly type: 'class-feature'; readonly featureId: string }
  | { readonly type: 'level-minimum'; readonly level: number };

export interface FeatSource {
  readonly id: FeatId;
  readonly category: FeatCategory;
  readonly prerequisites: readonly FeatPrerequisite[];
  readonly grants: readonly Grant[];
  /**
   * When true, this feat may be taken more than once (e.g. magic-initiate, elemental-adept).
   * NOT YET ENFORCED: CharacterBuild.feats is a set-like FeatId[]; the feature-choice ChoiceKey
   * hardcodes index 0, so a second instance would collide with the first. Full support requires
   * per-instance indexing. Tracked in #178.
   */
  readonly repeatable?: boolean;
  readonly sourceBook?: SourceBookId;
}

export interface ItemSource {
  readonly id: string;
  readonly grants: readonly Grant[];
  readonly requiresAttunement: boolean;
  readonly sourceBook?: SourceBookId;
}
