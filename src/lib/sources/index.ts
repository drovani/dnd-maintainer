import type { RaceId, ClassId, BackgroundId } from '@/lib/dnd-helpers'
import type {
  RaceSource,
  ClassSource,
  SubclassSource,
  BackgroundSource,
  FeatSource,
  ItemSource,
  GrantBundle,
  SourceTag,
} from '@/types/sources'
import type { CharacterBuild } from '@/types/choices'
import { RACE_SOURCES } from '@/lib/sources/races'
import { CLASS_SOURCES } from '@/lib/sources/classes'
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses'
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds'
import { FEAT_SOURCES } from '@/lib/sources/feats'
import { ITEM_SOURCES } from '@/lib/sources/items'

export type {
  RaceSource,
  ClassSource,
  SubclassSource,
  BackgroundSource,
  FeatSource,
  ItemSource,
  GrantBundle,
  SourceTag,
}

export { RACE_SOURCES, CLASS_SOURCES, SUBCLASS_SOURCES, BACKGROUND_SOURCES, FEAT_SOURCES, ITEM_SOURCES }

export function getRaceSource(id: RaceId): RaceSource | undefined {
  return RACE_SOURCES.find((r) => r.id === id)
}

export function getClassSource(id: ClassId): ClassSource | undefined {
  return CLASS_SOURCES.find((c) => c.id === id)
}

export function getSubclassSource(id: string): SubclassSource | undefined {
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

export function collectBundles(build: CharacterBuild): readonly GrantBundle[] {
  const bundles: GrantBundle[] = []

  // Race
  const raceSource = getRaceSource(build.raceId)
  if (raceSource) {
    const tag: SourceTag = { origin: 'race', id: build.raceId }
    bundles.push({ source: tag, grants: raceSource.grants })
  } else {
    console.warn(`No source data found for race "${build.raceId}" — race grants will be empty`)
  }

  // Class levels — count levels per class in order
  const classCounts = new Map<ClassId, number>()
  for (const applied of build.appliedLevels) {
    const prev = classCounts.get(applied.classId) ?? 0
    classCounts.set(applied.classId, prev + 1)
  }

  for (const [classId, levelCount] of classCounts) {
    const classSource = getClassSource(classId)
    if (!classSource) {
      console.warn(`No source data found for class "${classId}" — class grants will be empty`)
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
    const subclassChoiceKey = `subclass:${classId}`
    const subclassDecision = build.choices[subclassChoiceKey]
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
      }
    }
  }

  // Background
  const backgroundSource = build.backgroundId ? getBackgroundSource(build.backgroundId) : undefined
  if (backgroundSource && build.backgroundId) {
    const tag: SourceTag = { origin: 'background', id: build.backgroundId }
    bundles.push({ source: tag, grants: backgroundSource.grants })
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

  return bundles
}
