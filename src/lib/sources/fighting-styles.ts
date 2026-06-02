import type { FightingStyleId } from '@/lib/dnd-helpers';
import type { Grant } from '@/types/grants';

export interface FightingStyleSource {
  readonly id: FightingStyleId;
  readonly grants: readonly Grant[];
}

export const FIGHTING_STYLE_SOURCES: readonly FightingStyleSource[] = [
  {
    id: 'archery',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-archery' } }],
  },
  {
    id: 'defense',
    grants: [
      { type: 'feature', feature: { id: 'fighting-style-defense' } },
      { type: 'ac-bonus', bonus: 1 },
    ],
  },
  {
    id: 'dueling',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-dueling' } }],
  },
  {
    id: 'great-weapon-fighting',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-great-weapon-fighting' } }],
  },
  {
    id: 'protection',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-protection' } }],
  },
  {
    id: 'two-weapon-fighting',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-two-weapon-fighting' } }],
  },
  {
    id: 'blind-fighting',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-blind-fighting' } }],
  },
  {
    id: 'interception',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-interception' } }],
  },
  {
    id: 'thrown-weapon-fighting',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-thrown-weapon-fighting' } }],
  },
  {
    id: 'unarmed-fighting',
    grants: [{ type: 'feature', feature: { id: 'fighting-style-unarmed-fighting' } }],
  },
];

export function getFightingStyleSource(id: FightingStyleId): FightingStyleSource | undefined {
  return FIGHTING_STYLE_SOURCES.find((s) => s.id === id);
}
