import { makeQuickBuild, type ClassSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers';

const EMPTY_LEVEL = { grants: [] } as const;

const ROGUE_SKILL_POOL = [
  'acrobatics',
  'athletics',
  'deception',
  'insight',
  'intimidation',
  'investigation',
  'perception',
  'performance',
  'persuasion',
  'sleightofhand',
  'stealth',
] as const;

export const CLASS_SOURCES: readonly ClassSource[] = [
  /**
   * Rage is re-emitted at L1/L3/L6/L9 with scaling usesCount; resolveFeatures
   * in src/lib/resolver/features.ts dedupes by feature id, keeping the
   * highest-rank (latest level) source.
   */
  {
    id: 'barbarian',
    primaryAbility: 'str',
    quickBuild: makeQuickBuild({
      highestAbility: ['str'],
      secondaryAbility: 'con',
      suggestedBackground: 'outlander',
    }),
    levels: [
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
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-reckless-attack' } },
          { type: 'feature', feature: { id: 'barbarian-danger-sense' } },
        ],
      },
      {
        grants: [
          { type: 'subclass', classId: 'barbarian', key: createChoiceKey('subclass', 'class', 'barbarian', 0) },
          { type: 'feature', feature: { id: 'barbarian-rage', usesPerRest: 'long', usesCount: 3 } },
        ],
      },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 0), points: 2 }] },
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-extra-attack' } },
          { type: 'feature', feature: { id: 'barbarian-fast-movement' } },
          { type: 'speed', mode: 'walk', value: 40 },
        ],
      },
      {
        grants: [{ type: 'feature', feature: { id: 'barbarian-rage', usesPerRest: 'long', usesCount: 4 } }],
      },
      { grants: [{ type: 'feature', feature: { id: 'barbarian-feral-instinct' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 1), points: 2 }] },
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-brutal-critical-1' } },
          { type: 'feature', feature: { id: 'barbarian-rage', usesPerRest: 'long', usesCount: 4 } },
        ],
      },
      // Level 10 — path feature handled by subclass entries
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
    id: 'rogue',
    primaryAbility: 'dex',
    quickBuild: makeQuickBuild({
      highestAbility: ['dex'],
      secondaryAbility: 'int',
      suggestedBackground: 'criminal',
    }),
    levels: [
      {
        grants: [
          { type: 'hit-die', die: 8 },
          { type: 'proficiency', category: 'armor', id: 'light' },
          { type: 'proficiency', category: 'weapon', id: 'simple' },
          { type: 'proficiency', category: 'weapon', id: 'handcrossbow' },
          { type: 'proficiency', category: 'weapon', id: 'longsword' },
          { type: 'proficiency', category: 'weapon', id: 'rapier' },
          { type: 'proficiency', category: 'weapon', id: 'shortsword' },
          { type: 'proficiency', category: 'tool', id: 'thievestools' },
          { type: 'proficiency', category: 'saving-throw', id: 'dex' },
          { type: 'proficiency', category: 'saving-throw', id: 'int' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'rogue', 0),
            count: 4,
            from: ROGUE_SKILL_POOL,
          },
          { type: 'armor-class', calculation: { mode: 'armored' } },
          {
            type: 'expertise-choice',
            key: createChoiceKey('expertise-choice', 'class', 'rogue', 0),
            count: 2,
            from: null,
            fromTools: ['thievestools'],
          },
          { type: 'feature', feature: { id: 'rogue-sneak-attack' } },
          { type: 'feature', feature: { id: 'rogue-thieves-cant' } },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'rogue', 0),
            category: 'loadout',
            bundleIds: ['rogue-loadout'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'rogue', 1),
            category: 'melee-weapon',
            bundleIds: ['rogue-rapier', 'rogue-shortsword-melee'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'rogue', 2),
            category: 'ranged-weapon',
            bundleIds: ['rogue-shortbow-kit', 'rogue-shortsword-ranged'],
          },
          {
            type: 'bundle-choice',
            key: createChoiceKey('bundle-choice', 'class', 'rogue', 3),
            category: 'pack',
            bundleIds: ['burglars-pack', 'dungeoneers-pack', 'explorers-pack'],
          },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'rogue-cunning-action' } }] },
      { grants: [{ type: 'subclass', classId: 'rogue', key: createChoiceKey('subclass', 'class', 'rogue', 0) }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'rogue', 0), points: 2 }] },
      { grants: [{ type: 'feature', feature: { id: 'rogue-uncanny-dodge' } }] },
      {
        grants: [
          {
            type: 'expertise-choice',
            key: createChoiceKey('expertise-choice', 'class', 'rogue', 1),
            count: 2,
            from: null,
            fromTools: ['thievestools'],
          },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'rogue-evasion' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'rogue', 1), points: 2 }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'rogue', 2), points: 2 }] },
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
