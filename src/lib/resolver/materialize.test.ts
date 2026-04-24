import { describe, it, expect } from 'vitest';
import { buildMaterializedItemRows } from '@/lib/resolver/materialize';
import type { ResolvedCharacter, ResolvedEquipmentItem } from '@/types/resolved';
import type { SourceTag } from '@/types/sources';
import { requireItemDef } from '@/lib/sources/items';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(itemId: string, quantity: number, source: SourceTag): ResolvedEquipmentItem {
  return {
    itemId,
    itemDef: requireItemDef(itemId),
    quantity,
    source,
    equipped: false,
  };
}

function makeResolved(equipment: readonly ResolvedEquipmentItem[]): ResolvedCharacter {
  return {
    equipment,
    // Minimal stubs for unused fields
    abilities: {} as ResolvedCharacter['abilities'],
    hitDie: [],
    hitPoints: { max: 10 },
    speed: {},
    initiative: 0,
    proficiencyBonus: 2,
    armorClass: { effective: 10, calculations: [], bonuses: [] },
    savingThrows: {} as ResolvedCharacter['savingThrows'],
    skills: {} as ResolvedCharacter['skills'],
    armorProficiencies: [],
    weaponProficiencies: [],
    toolProficiencies: [],
    languages: [],
    features: [],
    resistances: [],
    immunities: [],
    spellcasting: null,
    attacks: [],
    toolExpertise: [],
    pendingChoices: [],
  };
}

const CHARACTER_ID = 'test-character-id';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildMaterializedItemRows', () => {
  it('Fighter L1 archer loadout → rows for leather, longbow, arrows-20 with bundle source', () => {
    const bundleSource: SourceTag = { origin: 'bundle', id: 'fighter-archer-kit' };
    const resolved = makeResolved([
      makeItem('leather', 1, bundleSource),
      makeItem('longbow', 1, bundleSource),
      makeItem('arrows-20', 1, bundleSource),
    ]);

    const rows = buildMaterializedItemRows(resolved, CHARACTER_ID);

    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.item_id === 'leather')).toMatchObject({
      character_id: CHARACTER_ID,
      item_id: 'leather',
      quantity: 1,
      equipped: false,
      attuned: false,
      source: bundleSource,
    });
    expect(rows.find((r) => r.item_id === 'longbow')).toMatchObject({
      item_id: 'longbow',
      source: bundleSource,
    });
    expect(rows.find((r) => r.item_id === 'arrows-20')).toMatchObject({
      item_id: 'arrows-20',
      source: bundleSource,
    });
  });

  it('Soldier background items get background source', () => {
    const bgSource: SourceTag = { origin: 'background', id: 'soldier' };
    const resolved = makeResolved([makeItem('common-clothes', 1, bgSource), makeItem('pouch', 1, bgSource)]);

    const rows = buildMaterializedItemRows(resolved, CHARACTER_ID);

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.source).toEqual(bgSource);
    }
  });

  it('same item with different sources produces two separate rows', () => {
    const bundleSource: SourceTag = { origin: 'bundle', id: 'fighter-archer-kit' };
    const bgSource: SourceTag = { origin: 'background', id: 'soldier' };
    // Two different sources for the same item
    const resolved = makeResolved([makeItem('arrows-20', 1, bundleSource), makeItem('arrows-20', 1, bgSource)]);

    const rows = buildMaterializedItemRows(resolved, CHARACTER_ID);

    expect(rows).toHaveLength(2);
    const both = rows.filter((r) => r.item_id === 'arrows-20');
    expect(both).toHaveLength(2);
    const sources = both.map((r) => (r.source as SourceTag).origin);
    expect(sources).toContain('bundle');
    expect(sources).toContain('background');
  });

  it('same item with same source aggregates quantity into one row', () => {
    const bundleSource: SourceTag = { origin: 'bundle', id: 'two-longswords' };
    const resolved = makeResolved([makeItem('longsword', 1, bundleSource), makeItem('longsword', 1, bundleSource)]);

    const rows = buildMaterializedItemRows(resolved, CHARACTER_ID);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      item_id: 'longsword',
      quantity: 2,
      source: bundleSource,
    });
  });

  it('pack-type dungeoneers-pack via bundle-choice → expanded rows with pack source', () => {
    const packSource: SourceTag = { origin: 'pack', id: 'dungeoneers-pack' };
    // Dungeoneer's pack expands into multiple items
    const resolved = makeResolved([
      makeItem('torches-10', 1, packSource),
      makeItem('rations-10', 1, packSource),
      makeItem('hemp-rope-50ft', 1, packSource),
    ]);

    const rows = buildMaterializedItemRows(resolved, CHARACTER_ID);

    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.source).toEqual(packSource);
    }
    expect(rows.find((r) => r.item_id === 'torches-10')?.quantity).toBe(1);
    expect(rows.find((r) => r.item_id === 'rations-10')?.quantity).toBe(1);
  });

  it('returns empty array when resolved.equipment is empty', () => {
    const resolved = makeResolved([]);
    const rows = buildMaterializedItemRows(resolved, CHARACTER_ID);
    expect(rows).toHaveLength(0);
  });
});
