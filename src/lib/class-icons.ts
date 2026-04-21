import type { ClassId } from '@/lib/dnd-helpers'
import { CLASS_SOURCES } from '@/lib/sources/classes'
import { getBundleNameKey } from '@/lib/sources/bundles'
import { getItemNameKey } from '@/lib/sources/items'
import type { SourceTag } from '@/types/sources'
import type { BundleCategory } from '@/types/items'
import type { TFunction } from 'i18next'
import {
  Axe,
  Backpack,
  BookOpen,
  Eye,
  Flame,
  Hand,
  Leaf,
  Music,
  ShieldCheck,
  Sparkles,
  Sun,
  Swords,
  Target,
  User,
  VenetianMask,
  type LucideIcon,
} from 'lucide-react'

export const CLASS_ICONS: Readonly<Record<ClassId, LucideIcon>> = {
  barbarian: Axe,
  bard: Music,
  cleric: Sun,
  druid: Leaf,
  fighter: Swords,
  monk: Hand,
  paladin: ShieldCheck,
  ranger: Target,
  rogue: VenetianMask,
  sorcerer: Flame,
  warlock: Eye,
  wizard: Sparkles,
}

const BUNDLE_TO_CLASS: ReadonlyMap<string, ClassId> = (() => {
  const map = new Map<string, ClassId>()
  for (const cls of CLASS_SOURCES) {
    for (const level of cls.levels) {
      for (const grant of level.grants) {
        if (grant.type === 'bundle-choice') {
          for (const bundleId of grant.bundleIds) {
            if (!map.has(bundleId)) map.set(bundleId, cls.id)
          }
        }
      }
    }
  }
  return map
})()

/**
 * Resolve a user-friendly display name for a grant source (race name, class name,
 * background name, bundle/item name, etc.) using the gamedata namespace.
 */
export function getSourceDisplayName(
  source: SourceTag,
  tGamedata: TFunction<'gamedata'>,
): string {
  switch (source.origin) {
    case 'race':
      return tGamedata(`races.${source.id}`, { defaultValue: source.id })
    case 'class':
      return tGamedata(`classes.${source.id}`, { defaultValue: source.id })
    case 'subclass':
      return tGamedata(`subclasses.${source.id}.name`, { defaultValue: source.id })
    case 'background':
      return tGamedata(`backgrounds.${source.id}`, { defaultValue: source.id })
    case 'feat':
      return source.id
    case 'item':
      return tGamedata(getItemNameKey('gear', source.id), { defaultValue: source.id })
    case 'bundle':
      return tGamedata(getBundleNameKey(source.id), { defaultValue: source.id })
    case 'pack':
      return tGamedata(getItemNameKey('pack', source.id), { defaultValue: source.id })
    case 'loot':
      return source.description
  }
}

/**
 * Resolve an icon for an equipment grant based on its source and (optionally) bundle category.
 * Packs always map to the backpack icon regardless of origin. Bundle-origin items try to
 * trace back to the class that grants them.
 */
export function getGrantIcon(
  source: SourceTag,
  bundleCategory?: BundleCategory,
): LucideIcon | null {
  if (bundleCategory === 'pack') return Backpack
  switch (source.origin) {
    case 'class':
      return CLASS_ICONS[source.id]
    case 'subclass':
      return CLASS_ICONS[source.classId]
    case 'background':
      return BookOpen
    case 'race':
      return User
    case 'pack':
      return Backpack
    case 'bundle': {
      const classId = BUNDLE_TO_CLASS.get(source.id)
      return classId ? CLASS_ICONS[classId] : Swords
    }
    default:
      return null
  }
}
