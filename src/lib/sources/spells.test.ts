import { describe, it, expect } from 'vitest';
import { SPELL_CATALOG, getSpellDef, requireSpellDef, getSpellsForList } from '@/lib/sources/spells';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses';
import { SPECIES_SOURCES } from '@/lib/sources/species';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';
import { FEAT_SOURCES } from '@/lib/sources/feats';
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

  it('every catalog spell has a non-empty spells.<id>.description in gamedata', () => {
    for (const spell of SPELL_CATALOG) {
      const entry = (gamedata.spells as Record<string, { name: string; description: string } | undefined>)[spell.id];
      expect(entry, `Missing gamedata entry for spell "${spell.id}"`).toBeDefined();
      expect(entry!.description.length, `Empty description for spell "${spell.id}"`).toBeGreaterThan(0);
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

describe('spell-grant catalog invariant', () => {
  it('every type:spell grant across all source registries references a catalogued spellId', () => {
    const missing: string[] = [];

    for (const source of SPECIES_SOURCES) {
      for (const grant of source.grants) {
        if (grant.type === 'spell' && !getSpellDef(grant.spellId)) {
          missing.push(`species:${source.id} → "${grant.spellId}"`);
        }
      }
    }

    for (const classSource of CLASS_SOURCES) {
      for (const [i, level] of classSource.levels.entries()) {
        for (const grant of level.grants) {
          if (grant.type === 'spell' && !getSpellDef(grant.spellId)) {
            missing.push(`class:${classSource.id}:level${i + 1} → "${grant.spellId}"`);
          }
        }
      }
    }

    for (const [subclassId, subclassSource] of Object.entries(SUBCLASS_SOURCES)) {
      for (const feature of subclassSource.features) {
        for (const grant of feature.grants) {
          if (grant.type === 'spell' && !getSpellDef(grant.spellId)) {
            missing.push(`subclass:${subclassId}:classLevel${feature.classLevel} → "${grant.spellId}"`);
          }
        }
      }
    }

    for (const source of BACKGROUND_SOURCES) {
      for (const grant of source.grants) {
        if (grant.type === 'spell' && !getSpellDef(grant.spellId)) {
          missing.push(`background:${source.id} → "${grant.spellId}"`);
        }
      }
    }

    for (const source of FEAT_SOURCES) {
      for (const grant of source.grants) {
        if (grant.type === 'spell' && !getSpellDef(grant.spellId)) {
          missing.push(`feat:${source.id} → "${grant.spellId}"`);
        }
      }
    }

    expect(missing, 'spell grants referencing uncatalogued spellIds').toEqual([]);
  });
});
