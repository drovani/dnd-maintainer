import type { BundleDef } from '@/types/items'
import { getItemDef } from '@/lib/sources/items'

export const BUNDLE_CATALOG: readonly BundleDef[] = [
  {
    id: 'fighter-chainmail',
    category: 'loadout',
    contents: [{ itemId: 'chain-mail', quantity: 1 }],
  },
  {
    id: 'fighter-archer-kit',
    category: 'loadout',
    contents: [
      { itemId: 'leather', quantity: 1 },
      { itemId: 'longbow', quantity: 1 },
      { itemId: 'arrows-20', quantity: 1 },
    ],
  },
  {
    id: 'longsword-and-shield',
    category: 'melee-weapon',
    contents: [
      { itemId: 'longsword', quantity: 1 },
      { itemId: 'shield', quantity: 1 },
    ],
  },
  {
    id: 'two-longswords',
    category: 'melee-weapon',
    contents: [{ itemId: 'longsword', quantity: 2 }],
  },
  {
    id: 'light-crossbow-kit',
    category: 'ranged-weapon',
    contents: [
      { itemId: 'light-crossbow', quantity: 1 },
      { itemId: 'bolts-20', quantity: 1 },
    ],
  },
  {
    id: 'two-handaxes',
    category: 'ranged-weapon',
    contents: [{ itemId: 'handaxe', quantity: 2 }],
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

/**
 * Resolves a bundle or pack id to its contents and kind.
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
