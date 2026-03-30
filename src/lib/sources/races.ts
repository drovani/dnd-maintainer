import type { RaceSource } from '@/types/sources'
import { createChoiceKey } from '@/types/choices'

export const RACE_SOURCES: readonly RaceSource[] = [
  {
    id: 'human',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      { type: 'ability-bonus', ability: 'str', bonus: 1 },
      { type: 'ability-bonus', ability: 'dex', bonus: 1 },
      { type: 'ability-bonus', ability: 'con', bonus: 1 },
      { type: 'ability-bonus', ability: 'int', bonus: 1 },
      { type: 'ability-bonus', ability: 'wis', bonus: 1 },
      { type: 'ability-bonus', ability: 'cha', bonus: 1 },
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'race', 'human', 0),
        count: 1,
        from: null,
      },
    ],
  },
]
