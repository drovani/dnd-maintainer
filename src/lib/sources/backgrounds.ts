import type { BackgroundSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';

export const BACKGROUND_SOURCES: readonly BackgroundSource[] = [
  {
    id: 'soldier',
    grants: [
      { type: 'proficiency', category: 'skill', id: 'athletics' },
      { type: 'proficiency', category: 'skill', id: 'intimidation' },
      { type: 'proficiency', category: 'tool', id: 'vehicles-land' },
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: createChoiceKey('tool-choice', 'background', 'soldier', 0),
        count: 1,
        from: ['gaming-set-dice', 'gaming-set-cards', 'gaming-set-dragonchess', 'gaming-set-three-dragon-ante'],
      },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'background', 'soldier', 0),
        count: 1,
        from: null,
      },
      { type: 'equipment', itemId: 'insignia-of-rank', quantity: 1 },
      { type: 'equipment', itemId: 'common-clothes', quantity: 1 },
      { type: 'equipment', itemId: 'pouch', quantity: 1 },
    ],
  },
];
