import { makeQuickBuild, type ClassSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers';
import type { SpellLevel } from '@/types/spells';

const EMPTY_LEVEL = { grants: [] } as const;

export const CLASS_SOURCES: readonly ClassSource[] = [
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
  {
    id: 'druid',
    primaryAbility: 'wis',
    quickBuild: makeQuickBuild({
      highestAbility: ['wis'],
      secondaryAbility: 'con',
      suggestedBackground: 'hermit',
    }),
    levels: [
      // Level 1
      {
        grants: [
          { type: 'hit-die', die: 8 },
          { type: 'proficiency', category: 'armor', id: 'light' },
          { type: 'proficiency', category: 'armor', id: 'medium-nonmetal' },
          { type: 'proficiency', category: 'armor', id: 'shields-nonmetal' },
          { type: 'proficiency', category: 'weapon', id: 'club' },
          { type: 'proficiency', category: 'weapon', id: 'dagger' },
          { type: 'proficiency', category: 'weapon', id: 'dart' },
          { type: 'proficiency', category: 'weapon', id: 'javelin' },
          { type: 'proficiency', category: 'weapon', id: 'mace' },
          { type: 'proficiency', category: 'weapon', id: 'quarterstaff' },
          { type: 'proficiency', category: 'weapon', id: 'scimitar' },
          { type: 'proficiency', category: 'weapon', id: 'sickle' },
          { type: 'proficiency', category: 'weapon', id: 'sling' },
          { type: 'proficiency', category: 'weapon', id: 'spear' },
          { type: 'proficiency', category: 'tool', id: 'herbalismkit' },
          { type: 'proficiency', category: 'saving-throw', id: 'int' },
          { type: 'proficiency', category: 'saving-throw', id: 'wis' },
          { type: 'proficiency', category: 'language', id: 'druidic' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'druid', 0),
            count: 2,
            from: ['arcana', 'animalhandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
          },
          { type: 'armor-class', calculation: { mode: 'armored' } },
          { type: 'feature', feature: { id: 'druid-druidic' } },
          { type: 'feature', feature: { id: 'druid-spellcasting' } },
          { type: 'spellcasting', ability: 'wis', source: 'class' },
          {
            type: 'spell-choice',
            key: createChoiceKey('spell-choice', 'class', 'druid', 0),
            count: 2,
            fromList: 'druid',
            maxLevel: 0 as SpellLevel,
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'druid', 0),
            category: 'loadout',
            bundleIds: ['druid-shield', 'druid-simple-weapon'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'druid', 1),
            category: 'melee-weapon',
            bundleIds: ['druid-scimitar', 'druid-simple-melee'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'druid', 2),
            category: 'pack',
            bundleIds: ['druid-starter-kit'],
          },
        ],
      },
      // Level 2
      {
        grants: [
          {
            type: 'subclass',
            classId: 'druid',
            key: createChoiceKey('subclass', 'class', 'druid', 0),
          },
          {
            type: 'feature',
            feature: { id: 'druid-wild-shape', usesPerRest: 'short', usesCount: 2 },
          },
        ],
      },
      // Level 3
      EMPTY_LEVEL,
      // Level 4
      {
        grants: [
          { type: 'asi', key: createChoiceKey('asi', 'class', 'druid', 0), points: 2 },
          {
            type: 'spell-choice',
            key: createChoiceKey('spell-choice', 'class', 'druid', 1),
            count: 1,
            fromList: 'druid',
            maxLevel: 0 as SpellLevel,
          },
          { type: 'feature', feature: { id: 'druid-wild-shape-improvement-swim' } },
        ],
      },
      // Level 5
      EMPTY_LEVEL,
      // Level 6
      EMPTY_LEVEL,
      // Level 7
      EMPTY_LEVEL,
      // Level 8
      {
        grants: [
          { type: 'asi', key: createChoiceKey('asi', 'class', 'druid', 1), points: 2 },
          { type: 'feature', feature: { id: 'druid-wild-shape-improvement-fly' } },
        ],
      },
      // Level 9
      EMPTY_LEVEL,
      // Level 10
      {
        grants: [
          {
            type: 'spell-choice',
            key: createChoiceKey('spell-choice', 'class', 'druid', 2),
            count: 1,
            fromList: 'druid',
            maxLevel: 0 as SpellLevel,
          },
        ],
      },
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
];
