import type { ClassSource } from '@/types/sources'
import { createChoiceKey } from '@/types/choices'

const EMPTY_LEVEL = { grants: [] } as const

export const CLASS_SOURCES: readonly ClassSource[] = [
  {
    id: 'fighter',
    primaryAbility: 'str',
    levels: [
      {
        grants: [
          { type: 'hit-die', die: 10 },
          { type: 'proficiency', category: 'armor', id: 'light' },
          { type: 'proficiency', category: 'armor', id: 'medium' },
          { type: 'proficiency', category: 'armor', id: 'heavy' },
          { type: 'proficiency', category: 'armor', id: 'shields' },
          { type: 'proficiency', category: 'weapon', id: 'simple' },
          { type: 'proficiency', category: 'weapon', id: 'martial' },
          { type: 'proficiency', category: 'saving-throw', id: 'str' },
          { type: 'proficiency', category: 'saving-throw', id: 'con' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'fighter', 0),
            count: 2,
            from: [
              'acrobatics',
              'animalhandling',
              'athletics',
              'history',
              'insight',
              'intimidation',
              'perception',
              'survival',
            ],
          },
          { type: 'armor-class', calculation: { mode: 'armored' } },
          { type: 'feature', feature: { id: 'fighter-fighting-style' } },
          { type: 'feature', feature: { id: 'fighter-second-wind' } },
        ],
      },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
    ],
  },
]
