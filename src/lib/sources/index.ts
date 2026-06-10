import { isBackgroundId, type SpeciesId, type ClassId, type BackgroundId, type FeatId } from '@/lib/dnd-helpers';
import { getLogger } from '@/lib/logger';

const logger = getLogger('sources');
import type {
  SpeciesSource,
  ClassSource,
  SubclassSource,
  BackgroundSource,
  FeatSource,
  ItemSource,
  GrantBundle,
  SourceTag,
} from '@/types/sources';
import type { SubclassId } from '@/lib/sources/subclasses';
import type {
  SubclassGrant,
  FightingStyleChoiceGrant,
  LineageChoiceGrant,
  DamageTypeChoiceGrant,
  FeatureChoiceGrant,
  FeatChoiceGrant,
  SpellChoiceGrant,
} from '@/types/grants';
import type { CharacterBuild } from '@/types/choices';
import { SPECIES_SOURCES, LINEAGE_GRANTS_REGISTRY } from '@/lib/sources/species';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { SUBCLASS_SOURCES, SUBCLASS_IDS, SUBCLASS_IDS_BY_CLASS, isSubclassId } from '@/lib/sources/subclasses';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';
import { FEAT_SOURCES } from '@/lib/sources/feats';
import { ITEM_SOURCES } from '@/lib/sources/items';
import { FIGHTING_STYLE_SOURCES, getFightingStyleSource } from '@/lib/sources/fighting-styles';
import { getSpellsForList } from '@/lib/sources/spells';
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
  SUBCLASS_IDS,
  SUBCLASS_IDS_BY_CLASS,
  isSubclassId,
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
  return SUBCLASS_SOURCES[id];
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
  readonly expandedFeats: ReadonlySet<FeatId>;
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

  // Spell-choice decisions — expand chosen spellIds into individual spell grants so the
  // resolver's collectGrantsByType('spell') loop picks them up.
  const allSpellChoiceGrants: { grant: SpellChoiceGrant; source: SourceTag }[] = [];
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === 'spell-choice') {
        allSpellChoiceGrants.push({ grant: grant as SpellChoiceGrant, source: bundle.source });
      }
    }
  }

  for (const { grant, source } of allSpellChoiceGrants) {
    const decision = build.choices[grant.key];
    if (decision?.type === 'spell-choice') {
      const pool = getSpellsForList(grant.spellList, grant.spellLevel);
      for (const spellId of decision.spellIds) {
        if (!pool.some((s) => s.id === spellId)) {
          const msg = `spell-choice "${grant.key}" decision references spell "${spellId}" not in ${grant.spellList} list at level ${grant.spellLevel}`;
          warnings.push(msg);
          logger.warn(msg);
          continue;
        }
        bundles.push({
          source,
          grants: [{ type: 'spell', spellId, alwaysPrepared: false }],
        });
      }
    }
  }

  // Damage-type choices — expand chosen damage type into a feature grant whose id
  // is `${featureIdPrefix}-${chosenDamageType}` (e.g. zealot-divine-fury-radiant).
  const allDamageChoiceGrants: { grant: DamageTypeChoiceGrant; source: SourceTag }[] = [];
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === 'damage-choice') {
        allDamageChoiceGrants.push({ grant: grant as DamageTypeChoiceGrant, source: bundle.source });
      }
    }
  }

  for (const { grant, source } of allDamageChoiceGrants) {
    const decision = build.choices[grant.key];
    if (decision?.type === 'damage-choice') {
      for (const damageType of decision.damageTypes) {
        if (!grant.from.includes(damageType)) continue;
        bundles.push({
          source,
          grants: [{ type: 'feature', feature: { id: `${grant.featureIdPrefix}-${damageType}` } }],
        });
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
  const expandedFeats = new Set<FeatId>();
  const preFeatExpansionLength = bundles.length;
  for (let i = 0; i < preFeatExpansionLength; i++) {
    const bundle = bundles[i];
    for (const grant of bundle.grants) {
      if (grant.type === 'feat') {
        const featSource = getFeatSource(grant.featId);
        if (featSource) {
          const tag: SourceTag = { origin: 'feat', id: grant.featId };
          bundles.push({ source: tag, grants: featSource.grants });
          expandedFeats.add(grant.featId);
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
    if (expandedFeats.has(featId)) continue; // already expanded by background or a prior pass
    const featSource = getFeatSource(featId);
    if (featSource) {
      const tag: SourceTag = { origin: 'feat', id: featId };
      bundles.push({ source: tag, grants: featSource.grants });
      expandedFeats.add(featId);
    } else {
      const msg = `No source data found for feat "${featId}" — feat grants will be empty`;
      warnings.push(msg);
      logger.warn(msg);
    }
  }

  // Feat-choice expansion — runs AFTER build.feats so that a chosen feat's own sub-grants
  // (feature-choice, proficiency-choice, etc.) are visible to the feature-choice pass below.
  // Snapshot bundles at the start of the pass to avoid iterating bundles added in this pass.
  const allFeatChoiceGrants: { grant: FeatChoiceGrant; source: SourceTag }[] = [];
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === 'feat-choice') {
        allFeatChoiceGrants.push({ grant: grant as FeatChoiceGrant, source: bundle.source });
      }
    }
  }

  for (const { grant } of allFeatChoiceGrants) {
    const decision = build.choices[grant.key];
    if (decision?.type === 'feat-choice') {
      if (expandedFeats.has(decision.featId)) continue; // already expanded by background or build.feats pass
      const featSource = getFeatSource(decision.featId);
      if (featSource) {
        const tag: SourceTag = { origin: 'feat', id: decision.featId };
        bundles.push({ source: tag, grants: featSource.grants });
        expandedFeats.add(decision.featId);
      } else {
        const msg = `No source data found for feat-choice decision "${decision.featId}" — feat grants will be empty`;
        warnings.push(msg);
        logger.warn(msg);
      }
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

  // Feature-choice expansion — runs AFTER all sources (species, class, subclass, background, feat, item)
  // are pushed into bundles so feat-origin feature-choices (e.g. magic-initiate, elemental-adept,
  // resilient) are visible here.
  //
  // SINGLE-PASS SAFETY ASSUMPTION: expansion runs exactly once (not to a fixpoint) AND runs after
  // the feat and lineage expansion passes, so a chosen option whose own grants contain a grant of
  // type 'feat', 'lineage-choice', or 'feature-choice' would be silently dropped. This is safe ONLY
  // because all current feature-choice options expand to terminal grants (proficiency, feature, etc.)
  // — none nests another feat, lineage-choice, or feature-choice. The invariant is enforced by a
  // companion test in index.test.ts; if that test goes red, promote this to a fixpoint loop before
  // adding the new option.
  const allFeatureChoiceGrants: { grant: FeatureChoiceGrant; source: SourceTag }[] = [];
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === 'feature-choice') {
        allFeatureChoiceGrants.push({ grant: grant as FeatureChoiceGrant, source: bundle.source });
      }
    }
  }

  for (const { grant, source } of allFeatureChoiceGrants) {
    // ClassStep handles 'class' and 'subclass' origins; OriginStep handles 'feat'.
    // Any other origin (e.g. 'item') would produce an invisible pending choice;
    // surface as a warning so the CharacterBuilder amber banner shows it instead of failing silently.
    if (source.origin !== 'class' && source.origin !== 'feat' && source.origin !== 'subclass') {
      const msg = `feature-choice "${grant.key}" has non-class origin "${source.origin}" — no builder UI exists for this origin, choice will be invisible`;
      warnings.push(msg);
      logger.warn(msg);
    }

    const decision = build.choices[grant.key];
    if (decision?.type === 'feature-choice') {
      const option = grant.options.find((o) => o.optionId === decision.optionId);
      if (option) {
        bundles.push({
          source,
          grants: [{ type: 'feature', feature: { id: option.featureId } }, ...option.grants],
        });
      } else {
        const msg = `feature-choice "${grant.key}" decision references unknown option "${decision.optionId}"`;
        warnings.push(msg);
        logger.warn(msg);
      }
    }
  }

  // Level-gate grants by `minClassLevel` (issue #189). This mirrors the feature-level gate above
  // (`feature.classLevel <= levelCount`) but at grant granularity: a grant whose `minClassLevel`
  // exceeds the granting class's current level is suppressed. Circle of the Land uses this to unlock
  // its higher circle spells at druid L5/L7/L9 instead of all at once at L3. Runs after feature-choice
  // expansion so expanded option grants are gated too. Gating is on the *granting class's* level
  // (e.g. druid level), which is multiclass-correct — a druid 5 / wizard 3 unlocks the druid-5 tier.
  const sourceClassLevel = (source: SourceTag): number | undefined => {
    if (source.origin === 'subclass') return classCounts.get(source.classId);
    if (source.origin === 'class') return classCounts.get(source.id);
    return undefined;
  };
  const gatedBundles: GrantBundle[] = bundles.map((bundle) => {
    const classLevel = sourceClassLevel(bundle.source);
    const gated = bundle.grants.filter((g) => {
      const min = (g as { readonly minClassLevel?: number }).minClassLevel;
      if (min == null) return true;
      return classLevel != null && classLevel >= min;
    });
    return gated.length === bundle.grants.length ? bundle : { source: bundle.source, grants: gated };
  });

  return { bundles: gatedBundles, warnings, expandedFeats };
}
