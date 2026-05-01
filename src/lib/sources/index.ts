import { isBackgroundId, type SpeciesId, type ClassId, type BackgroundId, type FeatId } from '@/lib/dnd-helpers';
import { getLogger } from '@/lib/logger';

const logger = getLogger('sources');
import type {
  SpeciesSource,
  ClassSource,
  SubclassSource,
  SubclassId,
  BackgroundSource,
  FeatSource,
  ItemSource,
  GrantBundle,
  SourceTag,
} from '@/types/sources';
import type { SubclassGrant, FightingStyleChoiceGrant, LineageChoiceGrant } from '@/types/grants';
import type { CharacterBuild } from '@/types/choices';
import { SPECIES_SOURCES, LINEAGE_GRANTS_REGISTRY } from '@/lib/sources/species';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';
import { FEAT_SOURCES } from '@/lib/sources/feats';
import { ITEM_SOURCES } from '@/lib/sources/items';
import { FIGHTING_STYLE_SOURCES, getFightingStyleSource } from '@/lib/sources/fighting-styles';
import type { FightingStyleId } from '@/lib/dnd-helpers';

export type {
  SpeciesSource,
  ClassSource,
  SubclassSource,
  SubclassId,
  BackgroundSource,
  FeatSource,
  ItemSource,
  GrantBundle,
  SourceTag,
};

export {
  SPECIES_SOURCES,
  CLASS_SOURCES,
  SUBCLASS_SOURCES,
  BACKGROUND_SOURCES,
  FEAT_SOURCES,
  ITEM_SOURCES,
  FIGHTING_STYLE_SOURCES,
};
export { getFightingStyleSource };

export function getSpeciesSource(id: SpeciesId): SpeciesSource | undefined {
  return SPECIES_SOURCES.find((r) => r.id === id);
}

export function getClassSource(id: ClassId): ClassSource | undefined {
  return CLASS_SOURCES.find((c) => c.id === id);
}

export function getSubclassSource(id: SubclassId): SubclassSource | undefined {
  return SUBCLASS_SOURCES.find((s) => s.id === id);
}

export function getBackgroundSource(id: BackgroundId): BackgroundSource | undefined {
  return BACKGROUND_SOURCES.find((b) => b.id === id);
}

export function getFeatSource(id: FeatId): FeatSource | undefined {
  return FEAT_SOURCES.find((f) => f.id === id);
}

export { FEAT_CATEGORIES } from '@/types/sources';
export type { FeatCategory } from '@/types/sources';

export function getItemSource(id: string): ItemSource | undefined {
  return ITEM_SOURCES.find((i) => i.id === id);
}

export interface CollectBundlesResult {
  readonly bundles: readonly GrantBundle[];
  readonly warnings: readonly string[];
}

export function collectBundles(build: CharacterBuild): CollectBundlesResult {
  const bundles: GrantBundle[] = [];
  const warnings: string[] = [];

  // Species
  const speciesSource = getSpeciesSource(build.speciesId);
  if (speciesSource) {
    const tag: SourceTag = { origin: 'species', id: build.speciesId };
    bundles.push({ source: tag, grants: speciesSource.grants });
  } else {
    const msg = `No source data found for species "${build.speciesId}" — species grants will be empty`;
    warnings.push(msg);
    logger.warn(msg);
  }

  // Class levels — count levels per class in order
  const classCounts = new Map<ClassId, number>();
  for (const level of build.levels) {
    const prev = classCounts.get(level.classId) ?? 0;
    classCounts.set(level.classId, prev + 1);
  }

  for (const [classId, levelCount] of classCounts) {
    const classSource = getClassSource(classId);
    if (!classSource) {
      const msg = `No source data found for class "${classId}" — class grants will be empty`;
      warnings.push(msg);
      logger.warn(msg);
      continue;
    }
    for (let i = 0; i < levelCount && i < classSource.levels.length; i++) {
      const level = i + 1;
      const tag: SourceTag = { origin: 'class', id: classId, level };
      bundles.push({ source: tag, grants: classSource.levels[i].grants });
    }
  }

  // Subclass features
  for (const [classId, levelCount] of classCounts) {
    const classSource = getClassSource(classId);
    if (!classSource) continue;

    // Collect subclass grants from class levels up to levelCount
    const subclassGrants: SubclassGrant[] = [];
    for (let i = 0; i < levelCount && i < classSource.levels.length; i++) {
      for (const grant of classSource.levels[i].grants) {
        if (grant.type === 'subclass') {
          subclassGrants.push(grant as SubclassGrant);
        }
      }
    }

    for (const subclassGrant of subclassGrants) {
      const subclassDecision = build.choices[subclassGrant.key];
      if (subclassDecision?.type === 'subclass') {
        const subclassSource = getSubclassSource(subclassDecision.subclassId);
        if (subclassSource) {
          for (const feature of subclassSource.features) {
            if (feature.classLevel <= levelCount) {
              const tag: SourceTag = {
                origin: 'subclass',
                id: subclassDecision.subclassId,
                classId,
                level: feature.classLevel,
              };
              bundles.push({ source: tag, grants: feature.grants });
            }
          }
        } else {
          const msg = `No source data found for subclass "${subclassDecision.subclassId}" — subclass features will be empty`;
          warnings.push(msg);
          logger.warn(msg);
        }
      }
    }
  }

  // Fighting style choices — expand chosen styles into grant bundles
  const allFightingStyleGrants: { grant: FightingStyleChoiceGrant; source: SourceTag }[] = [];
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === 'fighting-style-choice') {
        allFightingStyleGrants.push({ grant: grant as FightingStyleChoiceGrant, source: bundle.source });
      }
    }
  }

  for (const { grant, source } of allFightingStyleGrants) {
    const decision = build.choices[grant.key];
    if (decision?.type === 'fighting-style-choice') {
      for (const styleId of decision.styles) {
        const styleSource = getFightingStyleSource(styleId as FightingStyleId);
        if (styleSource) {
          bundles.push({ source, grants: styleSource.grants });
        } else {
          const msg = `No source data found for fighting style "${styleId}"`;
          warnings.push(msg);
          logger.warn(msg);
        }
      }
    }
  }

  // Lineage choices — expand chosen lineage into grant bundles
  const allLineageChoiceGrants: { grant: LineageChoiceGrant; source: SourceTag }[] = [];
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === 'lineage-choice') {
        allLineageChoiceGrants.push({ grant: grant as LineageChoiceGrant, source: bundle.source });
      }
    }
  }

  for (const { grant, source } of allLineageChoiceGrants) {
    const decision = build.choices[grant.key];
    if (decision?.type === 'lineage-choice') {
      const speciesId = grant.speciesId as keyof typeof LINEAGE_GRANTS_REGISTRY;
      const speciesRegistry = LINEAGE_GRANTS_REGISTRY[speciesId];
      const lineageGrants = speciesRegistry?.[decision.lineageId];
      if (lineageGrants) {
        bundles.push({ source, grants: lineageGrants });
      } else {
        const msg = `No grants for lineage "${decision.lineageId}" of species "${grant.speciesId}"`;
        warnings.push(msg);
        logger.warn(msg);
      }
    }
  }

  // Background (only predefined backgrounds have grant sources)
  if (build.backgroundId && isBackgroundId(build.backgroundId)) {
    const backgroundSource = getBackgroundSource(build.backgroundId);
    if (backgroundSource) {
      const tag: SourceTag = { origin: 'background', id: build.backgroundId };
      bundles.push({ source: tag, grants: backgroundSource.grants });
    }
  }

  // Expand FeatGrant grants embedded in already-collected bundles (e.g. background origin feats).
  // Snapshot current length to avoid iterating bundles we add in this pass.
  const preFeatExpansionLength = bundles.length;
  for (let i = 0; i < preFeatExpansionLength; i++) {
    const bundle = bundles[i];
    for (const grant of bundle.grants) {
      if (grant.type === 'feat') {
        const featSource = getFeatSource(grant.featId);
        if (featSource) {
          const tag: SourceTag = { origin: 'feat', id: grant.featId };
          bundles.push({ source: tag, grants: featSource.grants });
        } else {
          const msg = `No source data found for feat "${grant.featId}" — feat grants will be empty`;
          warnings.push(msg);
          logger.warn(msg);
        }
      }
    }
  }

  // Feats explicitly listed in the build (manually chosen at level-up)
  for (const featId of build.feats) {
    const featSource = getFeatSource(featId as FeatId);
    if (featSource) {
      const tag: SourceTag = { origin: 'feat', id: featId as FeatId };
      bundles.push({ source: tag, grants: featSource.grants });
    } else {
      const msg = `No source data found for feat "${featId}" — feat grants will be empty`;
      warnings.push(msg);
      logger.warn(msg);
    }
  }

  // Items
  for (const itemId of build.activeItems) {
    const itemSource = getItemSource(itemId);
    if (itemSource) {
      const tag: SourceTag = { origin: 'item', id: itemId };
      bundles.push({ source: tag, grants: itemSource.grants });
    } else {
      const msg = `No source data found for item "${itemId}" — item grants will be empty`;
      warnings.push(msg);
      logger.warn(msg);
    }
  }

  return { bundles, warnings };
}
