import { makeQuickBuild, type ClassSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers';

const EMPTY_LEVEL = { grants: [] } as const;

export const CLASS_SOURCES: readonly ClassSource[] = [
  {
    id: 'barbarian',
    primaryAbility: 'str',
    quickBuild: makeQuickBuild({
      highestAbility: ['str'],
      secondaryAbility: 'con',
      suggestedBackground: 'outlander',
    }),
    levels: [
      // Level 1
      {
        grants: [
          { type: 'hit-die', die: 12 },
          { type: 'proficiency', category: 'armor', id: 'light' },
          { type: 'proficiency', category: 'armor', id: 'medium' },
          { type: 'proficiency', category: 'armor', id: 'shields' },
          { type: 'proficiency', category: 'weapon', id: 'simple' },
          { type: 'proficiency', category: 'weapon', id: 'martial' },
          { type: 'proficiency', category: 'saving-throw', id: 'str' },
          { type: 'proficiency', category: 'saving-throw', id: 'con' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'barbarian', 0),
            count: 2,
            from: ['animalhandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
          },
          { type: 'armor-class', calculation: { mode: 'unarmored', formula: 'barbarian' } },
          { type: 'feature', feature: { id: 'barbarian-rage', usesPerRest: 'long', usesCount: 2 } },
          { type: 'feature', feature: { id: 'barbarian-unarmored-defense' } },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'barbarian', 0),
            category: 'melee-weapon',
            bundleIds: ['barbarian-greataxe', 'any-martial-melee'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'barbarian', 1),
            category: 'ranged-weapon',
            bundleIds: ['two-handaxes', 'any-simple-weapon'],
          },
          { type: 'equipment', itemId: 'javelin', quantity: 4 },
          { type: 'equipment', itemId: 'explorers-pack', quantity: 1 },
        ],
      },
      // Level 2
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-reckless-attack' } },
          { type: 'feature', feature: { id: 'barbarian-danger-sense' } },
        ],
      },
      // Level 3 — subclass + rage scaling (dedupe keeps this usesCount: 3 over L1's 2)
      {
        grants: [
          { type: 'subclass', classId: 'barbarian', key: createChoiceKey('subclass', 'class', 'barbarian', 0) },
          { type: 'feature', feature: { id: 'barbarian-rage', usesPerRest: 'long', usesCount: 3 } },
        ],
      },
      // Level 4 — ASI
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 0), points: 2 }] },
      // Level 5 — Extra Attack + Fast Movement
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-extra-attack' } },
          { type: 'feature', feature: { id: 'barbarian-fast-movement' } },
          { type: 'speed', mode: 'walk', value: 40 },
        ],
      },
      // Level 6 — rage uses up (dedupe keeps usesCount: 4 over L3's 3)
      {
        grants: [{ type: 'feature', feature: { id: 'barbarian-rage', usesPerRest: 'long', usesCount: 4 } }],
      },
      // Level 7 — Feral Instinct
      { grants: [{ type: 'feature', feature: { id: 'barbarian-feral-instinct' } }] },
      // Level 8 — ASI
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 1), points: 2 }] },
      // Level 9 — Brutal Critical + rage re-emit (usesCount: 4, same as L6)
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-brutal-critical-1' } },
          { type: 'feature', feature: { id: 'barbarian-rage', usesPerRest: 'long', usesCount: 4 } },
        ],
      },
      // Level 10 — path feature handled by subclass entries
      EMPTY_LEVEL,
      // Levels 11-20
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
  {
    id: 'fighter',
    primaryAbility: 'str',
    quickBuild: makeQuickBuild({
      highestAbility: ['str', 'dex'],
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
          {
            type: 'fighting-style-choice',
            key: createChoiceKey('fighting-style-choice', 'class', 'fighter', 0),
            count: 1,
            from: FIGHTING_STYLE_IDS,
          },
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
];
