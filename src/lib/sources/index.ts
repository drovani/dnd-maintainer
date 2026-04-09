import { isBackgroundId, type RaceId, type ClassId, type BackgroundId } from '@/lib/dnd-helpers'
import type {
  RaceSource,
  ClassSource,
  SubclassSource,
  SubclassId,
  BackgroundSource,
  FeatSource,
  ItemSource,
  GrantBundle,
  SourceTag,
} from '@/types/sources'
import type { SubclassGrant, FightingStyleChoiceGrant } from '@/types/grants'
import type { CharacterBuild } from '@/types/choices'
import { RACE_SOURCES } from '@/lib/sources/races'
import { CLASS_SOURCES } from '@/lib/sources/classes'
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses'
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds'
import { FEAT_SOURCES } from '@/lib/sources/feats'
import { ITEM_SOURCES } from '@/lib/sources/items'
import { FIGHTING_STYLE_SOURCES, getFightingStyleSource } from '@/lib/sources/fighting-styles'
import type { FightingStyleId } from '@/lib/dnd-helpers'

export type {
  RaceSource,
  ClassSource,
  SubclassSource,
  SubclassId,
  BackgroundSource,
  FeatSource,
  ItemSource,
  GrantBundle,
  SourceTag,
}

export { RACE_SOURCES, CLASS_SOURCES, SUBCLASS_SOURCES, BACKGROUND_SOURCES, FEAT_SOURCES, ITEM_SOURCES, FIGHTING_STYLE_SOURCES }
export { getFightingStyleSource }

export function getRaceSource(id: RaceId): RaceSource | undefined {
  return RACE_SOURCES.find((r) => r.id === id)
}

export function getClassSource(id: ClassId): ClassSource | undefined {
  return CLASS_SOURCES.find((c) => c.id === id)
}

export function getSubclassSource(id: SubclassId): SubclassSource | undefined {
  return SUBCLASS_SOURCES.find((s) => s.id === id)
}

export function getBackgroundSource(id: BackgroundId): BackgroundSource | undefined {
  return BACKGROUND_SOURCES.find((b) => b.id === id)
}

export function getFeatSource(id: string): FeatSource | undefined {
  return FEAT_SOURCES.find((f) => f.id === id)
}

export function getItemSource(id: string): ItemSource | undefined {
  return ITEM_SOURCES.find((i) => i.id === id)
}

export interface CollectBundlesResult {
  readonly bundles: readonly GrantBundle[]
  readonly warnings: readonly string[]
}

export function collectBundles(build: CharacterBuild): CollectBundlesResult {
  const bundles: GrantBundle[] = []
  const warnings: string[] = []

  // Race
  const raceSource = getRaceSource(build.raceId)
  if (raceSource) {
    const tag: SourceTag = { origin: 'race', id: build.raceId }
    bundles.push({ source: tag, grants: raceSource.grants })
  } else {
    const msg = `No source data found for race "${build.raceId}" — race grants will be empty`
    warnings.push(msg)
    console.warn(msg)
  }

  // Class levels — count levels per class in order
  const classCounts = new Map<ClassId, number>()
  for (const level of build.levels) {
    const prev = classCounts.get(level.classId) ?? 0
    classCounts.set(level.classId, prev + 1)
  }

  for (const [classId, levelCount] of classCounts) {
    const classSource = getClassSource(classId)
    if (!classSource) {
      const msg = `No source data found for class "${classId}" — class grants will be empty`
      warnings.push(msg)
      console.warn(msg)
      continue
    }
    for (let i = 0; i < levelCount && i < classSource.levels.length; i++) {
      const level = i + 1
      const tag: SourceTag = { origin: 'class', id: classId, level }
      bundles.push({ source: tag, grants: classSource.levels[i].grants })
    }
  }

  // Subclass features
  for (const [classId, levelCount] of classCounts) {
    const classSource = getClassSource(classId)
    if (!classSource) continue

    // Collect subclass grants from class levels up to levelCount
    const subclassGrants: SubclassGrant[] = []
    for (let i = 0; i < levelCount && i < classSource.levels.length; i++) {
      for (const grant of classSource.levels[i].grants) {
        if (grant.type === 'subclass') {
          subclassGrants.push(grant as SubclassGrant)
        }
      }
    }

    for (const subclassGrant of subclassGrants) {
      const subclassDecision = build.choices[subclassGrant.key]
      if (subclassDecision?.type === 'subclass') {
        const subclassSource = getSubclassSource(subclassDecision.subclassId)
        if (subclassSource) {
          for (const feature of subclassSource.features) {
            if (feature.classLevel <= levelCount) {
              const tag: SourceTag = {
                origin: 'subclass',
                id: subclassDecision.subclassId,
                classId,
                level: feature.classLevel,
              }
              bundles.push({ source: tag, grants: feature.grants })
            }
          }
        } else {
          const msg = `No source data found for subclass "${subclassDecision.subclassId}" — subclass features will be empty`
          warnings.push(msg)
          console.warn(msg)
        }
      }
    }
  }

  // Fighting style choices — expand chosen styles into grant bundles
  const allFightingStyleGrants: { grant: FightingStyleChoiceGrant; source: SourceTag }[] = []
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === 'fighting-style-choice') {
        allFightingStyleGrants.push({ grant: grant as FightingStyleChoiceGrant, source: bundle.source })
      }
    }
  }

  for (const { grant, source } of allFightingStyleGrants) {
    const decision = build.choices[grant.key]
    if (decision?.type === 'fighting-style-choice') {
      for (const styleId of decision.styles) {
        const styleSource = getFightingStyleSource(styleId as FightingStyleId)
        if (styleSource) {
          bundles.push({ source, grants: styleSource.grants })
        }
      }
    }
  }

  // Background (only predefined backgrounds have grant sources)
  if (build.backgroundId && isBackgroundId(build.backgroundId)) {
    const backgroundSource = getBackgroundSource(build.backgroundId)
    if (backgroundSource) {
      const tag: SourceTag = { origin: 'background', id: build.backgroundId }
      bundles.push({ source: tag, grants: backgroundSource.grants })
    }
  }

  // Feats
  for (const featId of build.feats) {
    const featSource = getFeatSource(featId)
    if (featSource) {
      const tag: SourceTag = { origin: 'feat', id: featId }
      bundles.push({ source: tag, grants: featSource.grants })
    }
  }

  // Items
  for (const itemId of build.activeItems) {
    const itemSource = getItemSource(itemId)
    if (itemSource) {
      const tag: SourceTag = { origin: 'item', id: itemId }
      bundles.push({ source: tag, grants: itemSource.grants })
    }
  }

  return { bundles, warnings }
}
