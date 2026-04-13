import { makeQuickBuild, type ClassSource } from '@/types/sources'
import { createChoiceKey } from '@/types/choices'
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers'

const EMPTY_LEVEL = { grants: [] } as const

export const CLASS_SOURCES: readonly ClassSource[] = [
  {
    id: 'fighter',
    primaryAbility: 'str',
    quickBuild: makeQuickBuild({
      highestAbility: ['str', 'dex'], // PHB: "Strength or Dexterity"
      secondaryAbility: 'con',
      suggestedBackground: 'soldier',
    }),
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
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'fighter', 0),
            category: 'loadout',
            bundleIds: ['fighter-chainmail', 'fighter-archer-kit'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'fighter', 1),
            category: 'melee-weapon',
            bundleIds: ['martial-weapon-and-shield', 'two-martial-weapons'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'fighter', 2),
            category: 'ranged-weapon',
            bundleIds: ['light-crossbow-kit', 'two-handaxes'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'fighter', 3),
            category: 'pack',
            bundleIds: ['dungeoneers-pack', 'explorers-pack'],
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
