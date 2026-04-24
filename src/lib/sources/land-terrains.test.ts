import { describe, it, expect } from 'vitest';
import { LAND_TERRAIN_SPELL_GRANTS } from '@/lib/sources/land-terrains';
import { getSpellDef } from '@/lib/sources/spells';

describe('LAND_TERRAIN_SPELL_GRANTS', () => {
  it('has exactly 8 terrain entries', () => {
    expect(LAND_TERRAIN_SPELL_GRANTS).toHaveLength(8);
  });

  it('each terrain has exactly 4 tiers', () => {
    for (const grant of LAND_TERRAIN_SPELL_GRANTS) {
      expect(grant.tiers, `terrain "${grant.terrainId}" should have 4 tiers`).toHaveLength(4);
    }
  });

  it('each terrain has tiers at levels 3, 5, 7, and 9 in order', () => {
    for (const grant of LAND_TERRAIN_SPELL_GRANTS) {
      const levels = grant.tiers.map((t) => t.level);
      expect(levels, `terrain "${grant.terrainId}" tier levels`).toEqual([3, 5, 7, 9]);
    }
  });

  it('each tier has exactly 2 spell ids', () => {
    for (const grant of LAND_TERRAIN_SPELL_GRANTS) {
      for (const tier of grant.tiers) {
        expect(tier.spellIds, `terrain "${grant.terrainId}" level ${tier.level}`).toHaveLength(2);
      }
    }
  });

  it('every spell id in every tier resolves via getSpellDef', () => {
    for (const grant of LAND_TERRAIN_SPELL_GRANTS) {
      for (const tier of grant.tiers) {
        for (const spellId of tier.spellIds) {
          const def = getSpellDef(spellId);
          expect(
            def,
            `terrain "${grant.terrainId}" level ${tier.level} references unresolvable spell "${spellId}"`
          ).toBeDefined();
        }
      }
    }
  });

  it('covers all 8 expected terrain ids', () => {
    const terrainIds = LAND_TERRAIN_SPELL_GRANTS.map((g) => g.terrainId).sort();
    const expected = ['arctic', 'coast', 'desert', 'forest', 'grassland', 'mountain', 'swamp', 'underdark'].sort();
    expect(terrainIds).toEqual(expected);
  });
});
