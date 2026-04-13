import type { BundleDef, ItemDef, SlotFilter } from '@/types/items'
import { ARMOR_CATALOG, getItemDef, WEAPON_CATALOG } from '@/lib/sources/items'

export const BUNDLE_CATALOG: readonly BundleDef[] = [
  {
    id: 'fighter-chainmail',
    category: 'loadout',
    contents: [{ itemId: 'chain-mail', quantity: 1 }],
    slots: [],
  },
  {
    id: 'fighter-archer-kit',
    category: 'loadout',
    contents: [
      { itemId: 'leather', quantity: 1 },
      { itemId: 'longbow', quantity: 1 },
      { itemId: 'arrows-20', quantity: 1 },
    ],
    slots: [],
  },
  {
    id: 'martial-weapon-and-shield',
    category: 'melee-weapon',
    contents: [],
    slots: [
      {
        slotKey: 'weapon',
        quantity: 1,
        filter: { kind: 'weapon', category: 'martial' },
      },
      {
        slotKey: 'shield',
        quantity: 1,
        filter: { kind: 'armor', category: 'shield' },
      },
    ],
  },
  {
    id: 'two-martial-weapons',
    category: 'melee-weapon',
    contents: [],
    slots: [
      {
        slotKey: 'weapon-1',
        quantity: 1,
        filter: { kind: 'weapon', category: 'martial' },
      },
      {
        slotKey: 'weapon-2',
        quantity: 1,
        filter: { kind: 'weapon', category: 'martial' },
      },
    ],
  },
  {
    id: 'light-crossbow-kit',
    category: 'ranged-weapon',
    contents: [
      { itemId: 'light-crossbow', quantity: 1 },
      { itemId: 'bolts-20', quantity: 1 },
    ],
    slots: [],
  },
  {
    id: 'two-handaxes',
    category: 'ranged-weapon',
    contents: [{ itemId: 'handaxe', quantity: 2 }],
    slots: [],
  },
]

export function getBundleDef(id: string): BundleDef | undefined {
  return BUNDLE_CATALOG.find((b) => b.id === id)
}

export function requireBundleDef(id: string): BundleDef {
  const bundle = getBundleDef(id)
  if (!bundle) throw new Error(`Unknown bundle id: "${id}"`)
  return bundle
}

/** Returns the i18n key for a bundle's display name. */
export function getBundleNameKey(bundleId: string): `bundles.${string}.name` {
  return `bundles.${bundleId}.name`
}

/**
 * Resolves a bundle or pack id to its fixed contents and kind.
 * Note: this ignores any bundle slots — callers that need slot-materialized items must
 * resolve them separately via `getItemsForSlot` and user slot picks.
 * Checks BUNDLE_CATALOG first, then falls back to pack-type items in ITEM_CATALOG.
 * Throws if the id is unknown or does not resolve to a bundle/pack.
 */
export function resolveBundleRef(id: string): {
  readonly contents: readonly { readonly itemId: string; readonly quantity: number }[]
  readonly kind: 'bundle' | 'pack'
} {
  const bundle = getBundleDef(id)
  if (bundle) return { contents: bundle.contents, kind: 'bundle' }

  const item = getItemDef(id)
  if (item?.type === 'pack') return { contents: item.contents, kind: 'pack' }

  throw new Error(`Unknown bundle or pack id: "${id}"`)
}

/**
 * Returns every item from WEAPON_CATALOG / ARMOR_CATALOG that satisfies the given SlotFilter.
 * Used by the ChoicePicker slot UI to populate the Select dropdown for slotted bundles,
 * and by the resolver to validate persisted slot picks against the current catalog.
 */
export function getItemsForSlot(filter: SlotFilter): readonly ItemDef[] {
  if (filter.kind === 'weapon') {
    return WEAPON_CATALOG.filter((w) => {
      if (filter.category !== undefined && w.category !== filter.category) return false
      if (filter.range !== undefined && w.range !== filter.range) return false
      return true
    })
  }
  // armor
  return ARMOR_CATALOG.filter((a) => a.category === filter.category)
}
