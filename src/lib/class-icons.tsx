import React from 'react';
import type { ClassId } from '@/lib/dnd-helpers';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import type { SourceTag } from '@/types/sources';
import type { BundleCategory } from '@/types/items';
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
} from 'lucide-react';

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
};

const BUNDLE_TO_CLASS: ReadonlyMap<string, ClassId> = (() => {
  const map = new Map<string, ClassId>();
  for (const cls of CLASS_SOURCES) {
    for (const level of cls.levels) {
      for (const grant of level.grants) {
        if (grant.type === 'bundle-choice') {
          for (const bundleId of grant.bundleIds) {
            if (!map.has(bundleId)) map.set(bundleId, cls.id);
          }
        }
      }
    }
  }
  return map;
})();

// Re-exported from the React-free `source-display` module so existing importers
// (and their test mocks of `@/lib/class-icons`) keep working unchanged.
export { getSourceDisplayName } from '@/lib/source-display';

/**
 * Resolve an icon for an equipment grant based on its source and (optionally) bundle category.
 * Packs always map to the backpack icon regardless of origin. Bundle-origin items try to
 * trace back to the class that grants them.
 */
export function getGrantIcon(source: SourceTag, bundleCategory?: BundleCategory): LucideIcon | null {
  if (bundleCategory === 'pack') return Backpack;
  switch (source.origin) {
    case 'class':
      return CLASS_ICONS[source.id];
    case 'subclass':
      return CLASS_ICONS[source.classId];
    case 'background':
      return BookOpen;
    case 'species':
      return User;
    case 'pack':
      return Backpack;
    case 'bundle': {
      const classId = BUNDLE_TO_CLASS.get(source.id);
      return classId ? CLASS_ICONS[classId] : Swords;
    }
    default:
      return null;
  }
}

interface SourceIconProps {
  readonly source: SourceTag;
  readonly bundleCategory?: BundleCategory;
  readonly className?: string;
}

/**
 * Thin JSX wrapper around getGrantIcon — renders the icon for a grant source,
 * or null when no icon is defined. The lookup table is the source of truth;
 * this component just saves consumers from repeating the same null-check.
 */
export function SourceIcon({ source, bundleCategory, className }: SourceIconProps): React.JSX.Element | null {
  const Icon = getGrantIcon(source, bundleCategory);
  if (!Icon) return null;
  return React.createElement(Icon, { className });
}
