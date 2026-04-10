import { describe, it, expect } from 'vitest'
import { WEAPON_CATALOG, ARMOR_CATALOG, PACK_CATALOG, ITEM_CATALOG, getItemDef } from '@/lib/sources/items'

describe('ITEM_CATALOG', () => {
  it('all item IDs are unique across the combined catalog', () => {
    const ids = ITEM_CATALOG.map((item) => item.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all weapons have valid damageDice format (NdN)', () => {
    const diceRegex = /^\d+d\d+$/
    for (const weapon of WEAPON_CATALOG) {
      expect(weapon.damageDice, `weapon ${weapon.id} damageDice`).toMatch(diceRegex)
    }
  })

  it('all armor has baseAc > 0', () => {
    for (const armor of ARMOR_CATALOG) {
      expect(armor.baseAc, `armor ${armor.id} baseAc`).toBeGreaterThan(0)
    }
  })

  it('all pack contents reference valid item IDs in the catalog', () => {
    const allIds = new Set(ITEM_CATALOG.map((item) => item.id))
    for (const pack of PACK_CATALOG) {
      for (const { itemId } of pack.contents) {
        expect(allIds.has(itemId), `pack ${pack.id} references unknown item "${itemId}"`).toBe(true)
      }
    }
  })

  it('longsword is martial melee 1d8 slashing with versatile and versatileDice 1d10', () => {
    const def = getItemDef('longsword')
    expect(def).toBeDefined()
    if (!def || def.type !== 'weapon') throw new Error('longsword should be a weapon')
    expect(def.category).toBe('martial')
    expect(def.range).toBe('melee')
    expect(def.damageDice).toBe('1d8')
    expect(def.damageType).toBe('slashing')
    expect(def.properties).toContain('versatile')
    expect(def.versatileDice).toBe('1d10')
  })

  it('getItemDef returns undefined for unknown item', () => {
    expect(getItemDef('unknown-item-xyz')).toBeUndefined()
  })

  it('chain mail has baseAc 16 and maxDexBonus 0 (heavy armor)', () => {
    const def = getItemDef('chain-mail')
    expect(def).toBeDefined()
    if (!def || def.type !== 'armor') throw new Error('chain-mail should be armor')
    expect(def.baseAc).toBe(16)
    expect(def.maxDexBonus).toBe(0)
    expect(def.category).toBe('heavy')
  })

  it('shield has baseAc 2 and category shield', () => {
    const def = getItemDef('shield')
    expect(def).toBeDefined()
    if (!def || def.type !== 'armor') throw new Error('shield should be armor')
    expect(def.baseAc).toBe(2)
    expect(def.category).toBe('shield')
  })

  it('rapier has finesse property', () => {
    const def = getItemDef('rapier')
    expect(def).toBeDefined()
    if (!def || def.type !== 'weapon') throw new Error('rapier should be a weapon')
    expect(def.properties).toContain('finesse')
  })

  it('longbow is martial ranged with ammunition and two-handed', () => {
    const def = getItemDef('longbow')
    expect(def).toBeDefined()
    if (!def || def.type !== 'weapon') throw new Error('longbow should be a weapon')
    expect(def.category).toBe('martial')
    expect(def.range).toBe('ranged')
    expect(def.properties).toContain('ammunition')
    expect(def.properties).toContain('two-handed')
  })

  it('explorers-pack has expected contents', () => {
    const def = getItemDef('explorers-pack')
    expect(def).toBeDefined()
    if (!def || def.type !== 'pack') throw new Error('explorers-pack should be a pack')
    const contentIds = def.contents.map((c) => c.itemId)
    expect(contentIds).toContain('backpack')
    expect(contentIds).toContain('bedroll')
    expect(contentIds).toContain('rations-10')
  })

  it('insignia-of-rank exists as gear', () => {
    const def = getItemDef('insignia-of-rank')
    expect(def).toBeDefined()
    expect(def!.type).toBe('gear')
  })

  it('arrows-20 exists as gear', () => {
    const def = getItemDef('arrows-20')
    expect(def).toBeDefined()
    expect(def!.type).toBe('gear')
  })
})
