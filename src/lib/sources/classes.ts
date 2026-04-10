import type { ClassSource } from '@/types/sources'
import { createChoiceKey } from '@/types/choices'
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers'

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
          { type: 'fighting-style-choice', key: createChoiceKey('fighting-style-choice', 'class', 'fighter', 0), count: 1, from: FIGHTING_STYLE_IDS },
          { type: 'feature', feature: { id: 'fighter-second-wind' } },
          {
            type: 'equipment-choice',
            key: createChoiceKey('equipment-choice', 'class', 'fighter', 0),
            options: [
              [{ itemId: 'chain-mail', quantity: 1 }],
              [{ itemId: 'leather', quantity: 1 }, { itemId: 'longbow', quantity: 1 }, { itemId: 'arrows-20', quantity: 1 }],
            ],
          },
          {
            type: 'equipment-choice',
            key: createChoiceKey('equipment-choice', 'class', 'fighter', 1),
            options: [
              [{ itemId: 'longsword', quantity: 1 }, { itemId: 'shield', quantity: 1 }],
              [{ itemId: 'longsword', quantity: 2 }],
            ],
          },
          {
            type: 'equipment-choice',
            key: createChoiceKey('equipment-choice', 'class', 'fighter', 2),
            options: [
              [{ itemId: 'light-crossbow', quantity: 1 }, { itemId: 'bolts-20', quantity: 1 }],
              [{ itemId: 'handaxe', quantity: 2 }],
            ],
          },
          {
            type: 'equipment-choice',
            key: createChoiceKey('equipment-choice', 'class', 'fighter', 3),
            options: [
              [{ itemId: 'dungeoneers-pack', quantity: 1 }],
              [{ itemId: 'explorers-pack', quantity: 1 }],
            ],
          },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'fighter-action-surge' } }] },
      { grants: [{ type: 'subclass', classId: 'fighter', key: createChoiceKey('subclass', 'class', 'fighter', 0) }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'fighter', 0), points: 2 }] },
      { grants: [{ type: 'feature', feature: { id: 'fighter-extra-attack' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'fighter', 1), points: 2 }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'fighter', 2), points: 2 }] },
      { grants: [{ type: 'feature', feature: { id: 'fighter-indomitable' } }] },
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
