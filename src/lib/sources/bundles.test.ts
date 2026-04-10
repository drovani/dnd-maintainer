import { describe, it, expect } from 'vitest'
import { BUNDLE_CATALOG, getBundleDef, requireBundleDef, resolveBundleRef } from '@/lib/sources/bundles'
import { getItemDef } from '@/lib/sources/items'

describe('BUNDLE_CATALOG', () => {
  it('has unique ids', () => {
    const ids = BUNDLE_CATALOG.map((b) => b.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('every bundle has at least one content item', () => {
    for (const bundle of BUNDLE_CATALOG) {
      expect(bundle.contents.length, `bundle "${bundle.id}" must have at least one item`).toBeGreaterThan(0)
    }
  })

  it('all content itemIds resolve via getItemDef', () => {
    for (const bundle of BUNDLE_CATALOG) {
      for (const { itemId } of bundle.contents) {
        const def = getItemDef(itemId)
        expect(def, `bundle "${bundle.id}" references unknown itemId "${itemId}"`).toBeDefined()
      }
    }
  })

  it('all bundles have a valid category', () => {
    const validCategories = ['loadout', 'armor', 'melee-weapon', 'ranged-weapon', 'pack', 'gear'] as const
    for (const bundle of BUNDLE_CATALOG) {
      expect(validCategories, `bundle "${bundle.id}" has invalid category "${bundle.category}"`).toContain(bundle.category)
    }
  })
})

describe('getBundleDef', () => {
  it('returns the correct bundle for a known id', () => {
    const bundle = getBundleDef('fighter-chainmail')
    expect(bundle).toBeDefined()
    expect(bundle?.id).toBe('fighter-chainmail')
    expect(bundle?.category).toBe('loadout')
    expect(bundle?.contents).toHaveLength(1)
    expect(bundle?.contents[0].itemId).toBe('chain-mail')
  })

  it('returns undefined for an unknown id', () => {
    expect(getBundleDef('nonexistent-bundle')).toBeUndefined()
  })
})

describe('requireBundleDef', () => {
  it('returns the bundle for a known id', () => {
    const bundle = requireBundleDef('fighter-archer-kit')
    expect(bundle.id).toBe('fighter-archer-kit')
    expect(bundle.category).toBe('loadout')
    expect(bundle.contents).toHaveLength(3)
  })

  it('throws for an unknown id', () => {
    expect(() => requireBundleDef('nonexistent-bundle')).toThrow('Unknown bundle id')
  })
})

describe('resolveBundleRef', () => {
  it('resolves a bundle id to its contents with kind "bundle"', () => {
    const result = resolveBundleRef('longsword-and-shield')
    expect(result.kind).toBe('bundle')
    expect(result.contents).toHaveLength(2)
    expect(result.contents.map((c) => c.itemId)).toContain('longsword')
    expect(result.contents.map((c) => c.itemId)).toContain('shield')
  })

  it('resolves a pack item id to its contents with kind "pack"', () => {
    const result = resolveBundleRef('dungeoneers-pack')
    expect(result.kind).toBe('pack')
    expect(result.contents.length).toBeGreaterThan(0)
    expect(result.contents.map((c) => c.itemId)).toContain('backpack')
  })

  it('resolves explorers-pack to contents with kind "pack"', () => {
    const result = resolveBundleRef('explorers-pack')
    expect(result.kind).toBe('pack')
    expect(result.contents.map((c) => c.itemId)).toContain('bedroll')
  })

  it('throws for an unknown id', () => {
    expect(() => resolveBundleRef('completely-unknown')).toThrow('Unknown bundle or pack id')
  })

  // Spot checks for each Fighter bundle
  it('fighter-chainmail contains chain-mail', () => {
    const result = resolveBundleRef('fighter-chainmail')
    expect(result.contents[0].itemId).toBe('chain-mail')
    expect(result.contents[0].quantity).toBe(1)
  })

  it('fighter-archer-kit contains leather, longbow, arrows-20', () => {
    const result = resolveBundleRef('fighter-archer-kit')
    const ids = result.contents.map((c) => c.itemId)
    expect(ids).toContain('leather')
    expect(ids).toContain('longbow')
    expect(ids).toContain('arrows-20')
  })

  it('two-longswords contains longsword with quantity 2', () => {
    const result = resolveBundleRef('two-longswords')
    expect(result.contents[0].itemId).toBe('longsword')
    expect(result.contents[0].quantity).toBe(2)
  })

  it('light-crossbow-kit contains light-crossbow and bolts-20', () => {
    const result = resolveBundleRef('light-crossbow-kit')
    const ids = result.contents.map((c) => c.itemId)
    expect(ids).toContain('light-crossbow')
    expect(ids).toContain('bolts-20')
  })

  it('two-handaxes contains handaxe with quantity 2', () => {
    const result = resolveBundleRef('two-handaxes')
    expect(result.contents[0].itemId).toBe('handaxe')
    expect(result.contents[0].quantity).toBe(2)
  })
})
