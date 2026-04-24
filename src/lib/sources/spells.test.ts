import { describe, it, expect } from 'vitest';
import { SPELL_CATALOG, getSpellDef, getSpellsForList } from '@/lib/sources/spells';
import { LAND_TERRAIN_SPELL_GRANTS } from '@/lib/sources/land-terrains';

describe('SPELL_CATALOG', () => {
  it('has no duplicate ids', () => {
    const ids = SPELL_CATALOG.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('PHB druid cantrip count is exactly 8', () => {
    const druidCantrips = getSpellsForList('druid', 0);
    expect(druidCantrips).toHaveLength(8);
  });

  it('druid cantrips include all 8 expected spell ids', () => {
    const druidCantrips = getSpellsForList('druid', 0).map((s) => s.id);
    const expected = [
      'druidcraft',
      'guidance',
      'mending',
      'poison-spray',
      'produce-flame',
      'resistance',
      'shillelagh',
      'thorn-whip',
    ];
    for (const id of expected) {
      expect(druidCantrips, `cantrips should include "${id}"`).toContain(id);
    }
  });

  it('getSpellsForList("druid", 0) returns exactly the 8 PHB druid cantrips', () => {
    const result = getSpellsForList('druid', 0);
    const ids = result.map((s) => s.id).sort();
    const expectedSorted = [
      'druidcraft',
      'guidance',
      'mending',
      'poison-spray',
      'produce-flame',
      'resistance',
      'shillelagh',
      'thorn-whip',
    ].sort();
    expect(ids).toEqual(expectedSorted);
  });

  it('all spell ids referenced in LAND_TERRAIN_SPELL_GRANTS resolve in the catalog', () => {
    for (const grant of LAND_TERRAIN_SPELL_GRANTS) {
      for (const tier of grant.tiers) {
        for (const spellId of tier.spellIds) {
          const def = getSpellDef(spellId);
          expect(
            def,
            `terrain "${grant.terrainId}" level ${tier.level} references unknown spell id "${spellId}"`
          ).toBeDefined();
        }
      }
    }
  });

  it('getSpellDef returns undefined for unknown id', () => {
    expect(getSpellDef('definitely-not-a-spell')).toBeUndefined();
  });

  it('all druid cantrips have level 0', () => {
    const cantrips = getSpellsForList('druid', 0);
    for (const spell of cantrips) {
      expect(spell.level).toBe(0);
    }
  });

  it('all spells have a valid school', () => {
    const validSchools = new Set([
      'abjuration',
      'conjuration',
      'divination',
      'enchantment',
      'evocation',
      'illusion',
      'necromancy',
      'transmutation',
    ]);
    for (const spell of SPELL_CATALOG) {
      expect(validSchools.has(spell.school), `spell "${spell.id}" has invalid school "${spell.school}"`).toBe(true);
    }
  });
});

describe('cross-class spells do not list druid', () => {
  const crossClassIds = [
    'mirror-image',
    'misty-step',
    'blur',
    'silence',
    'create-food-and-water',
    'spider-climb',
    'invisibility',
    'haste',
    'lightning-bolt',
    'acid-arrow',
    'darkness',
    'stinking-cloud',
    'web',
    'gaseous-form',
    'greater-invisibility',
    'cloudkill',
    'slow',
    'cone-of-cold',
  ];
  it.each(crossClassIds)('%s has classes without "druid"', (id) => {
    const spell = getSpellDef(id);
    expect(spell).toBeDefined();
    expect(spell!.classes).not.toContain('druid');
  });
});
