import type { LandTerrainId } from '@/lib/dnd-helpers';

/**
 * Spell grants for Circle of the Land subclass terrain choices.
 * Each terrain grants bonus prepared spells at character levels 3, 5, 7, and 9
 * (druid levels 3, 5, 7, 9) — two spells per tier.
 * Cross-reference: PHB 2014 p.68 "Circle Spells".
 */

export interface LandTerrainSpellTier {
  /** Druid level at which these spells are gained */
  readonly level: 3 | 5 | 7 | 9;
  readonly spellIds: readonly [string, string];
}

export interface LandTerrainSpellGrant {
  readonly terrainId: LandTerrainId;
  readonly tiers: readonly LandTerrainSpellTier[];
}

export const LAND_TERRAIN_SPELL_GRANTS: readonly LandTerrainSpellGrant[] = [
  {
    terrainId: 'arctic',
    tiers: [
      { level: 3, spellIds: ['hold-person', 'spike-growth'] },
      { level: 5, spellIds: ['slow', 'sleet-storm'] },
      { level: 7, spellIds: ['freedom-of-movement', 'ice-storm'] },
      { level: 9, spellIds: ['commune-with-nature', 'cone-of-cold'] },
    ],
  },
  {
    terrainId: 'coast',
    tiers: [
      { level: 3, spellIds: ['mirror-image', 'misty-step'] },
      { level: 5, spellIds: ['water-breathing', 'water-walk'] },
      { level: 7, spellIds: ['control-water', 'freedom-of-movement'] },
      { level: 9, spellIds: ['conjure-elemental', 'scrying'] },
    ],
  },
  {
    terrainId: 'desert',
    tiers: [
      { level: 3, spellIds: ['blur', 'silence'] },
      { level: 5, spellIds: ['create-food-and-water', 'protection-from-energy'] },
      { level: 7, spellIds: ['blight', 'hallucinatory-terrain'] },
      { level: 9, spellIds: ['insect-plague', 'wall-of-stone'] },
    ],
  },
  {
    terrainId: 'forest',
    tiers: [
      { level: 3, spellIds: ['barkskin', 'spider-climb'] },
      { level: 5, spellIds: ['call-lightning', 'plant-growth'] },
      { level: 7, spellIds: ['divination', 'freedom-of-movement'] },
      { level: 9, spellIds: ['commune-with-nature', 'tree-stride'] },
    ],
  },
  {
    terrainId: 'grassland',
    tiers: [
      { level: 3, spellIds: ['invisibility', 'pass-without-trace'] },
      { level: 5, spellIds: ['daylight', 'haste'] },
      { level: 7, spellIds: ['divination', 'freedom-of-movement'] },
      { level: 9, spellIds: ['dream', 'insect-plague'] },
    ],
  },
  {
    terrainId: 'mountain',
    tiers: [
      { level: 3, spellIds: ['spider-climb', 'spike-growth'] },
      { level: 5, spellIds: ['lightning-bolt', 'meld-into-stone'] },
      { level: 7, spellIds: ['stone-shape', 'stoneskin'] },
      { level: 9, spellIds: ['passwall', 'wall-of-stone'] },
    ],
  },
  {
    terrainId: 'swamp',
    tiers: [
      { level: 3, spellIds: ['acid-arrow', 'darkness'] },
      { level: 5, spellIds: ['water-walk', 'stinking-cloud'] },
      { level: 7, spellIds: ['freedom-of-movement', 'locate-creature'] },
      { level: 9, spellIds: ['insect-plague', 'scrying'] },
    ],
  },
  {
    terrainId: 'underdark',
    tiers: [
      { level: 3, spellIds: ['spider-climb', 'web'] },
      { level: 5, spellIds: ['gaseous-form', 'stinking-cloud'] },
      { level: 7, spellIds: ['greater-invisibility', 'stone-shape'] },
      { level: 9, spellIds: ['cloudkill', 'insect-plague'] },
    ],
  },
];

const TERRAIN_GRANT_MAP: ReadonlyMap<LandTerrainId, LandTerrainSpellGrant> = new Map(
  LAND_TERRAIN_SPELL_GRANTS.map((g) => [g.terrainId, g])
);

export function getLandTerrainSpellGrant(terrainId: LandTerrainId): LandTerrainSpellGrant | undefined {
  return TERRAIN_GRANT_MAP.get(terrainId);
}
