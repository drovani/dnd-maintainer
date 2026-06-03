import { describe, it, expect } from 'vitest';
import { SPELL_CATALOG, getSpellDef, requireSpellDef, getSpellsForList } from '@/lib/sources/spells';
import gamedata from '@/locales/en/gamedata.json';

describe('SPELL_CATALOG', () => {
  it('has no duplicate ids', () => {
    const ids = SPELL_CATALOG.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every catalog spell has a non-empty spells.<id>.name in gamedata', () => {
    for (const spell of SPELL_CATALOG) {
      const entry = (gamedata.spells as Record<string, { name: string; description: string } | undefined>)[spell.id];
      expect(entry, `Missing gamedata entry for spell "${spell.id}"`).toBeDefined();
      expect(entry!.name.length, `Empty name for spell "${spell.id}"`).toBeGreaterThan(0);
    }
  });

  it("every spell's nativeClasses is non-empty", () => {
    for (const spell of SPELL_CATALOG) {
      expect(spell.nativeClasses.length, `nativeClasses is empty for spell "${spell.id}"`).toBeGreaterThan(0);
    }
  });
});

describe('getSpellsForList', () => {
  it("returns all druid cantrips when filtered by classId='druid' and level=0", () => {
    const druidCantrips = getSpellsForList('druid', 0);
    // All 10 catalog spells are druid cantrips
    expect(druidCantrips.length).toBe(10);
  });

  it('returns spells that include druid in nativeClasses', () => {
    const druidCantrips = getSpellsForList('druid', 0);
    for (const spell of druidCantrips) {
      expect(spell.nativeClasses).toContain('druid');
    }
  });

  it('filters by level correctly', () => {
    const druidCantrips = getSpellsForList('druid', 0);
    for (const spell of druidCantrips) {
      expect(spell.level).toBe(0);
    }
  });

  it('returns all druid spells when no level filter', () => {
    const allDruid = getSpellsForList('druid');
    expect(allDruid.length).toBeGreaterThanOrEqual(10);
  });

  it('returns empty array for class with no matching spells', () => {
    // No level-9 spells in the catalog
    const result = getSpellsForList('druid', 9);
    expect(result).toEqual([]);
  });
});

describe('getSpellDef', () => {
  it('returns the SpellDef for a known id', () => {
    const def = getSpellDef('guidance');
    expect(def).toBeDefined();
    expect(def!.id).toBe('guidance');
    expect(def!.level).toBe(0);
    expect(def!.school).toBe('divination');
  });

  it('returns undefined for an unknown id', () => {
    expect(getSpellDef('nonexistent-spell')).toBeUndefined();
  });
});

describe('requireSpellDef', () => {
  it('returns the SpellDef for a known id', () => {
    const def = requireSpellDef('thorn-whip');
    expect(def.id).toBe('thorn-whip');
  });

  it('throws for an unknown id', () => {
    expect(() => requireSpellDef('not-a-spell')).toThrowError(/Unknown spell id/);
  });
});
