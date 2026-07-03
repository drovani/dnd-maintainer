import type { BackgroundSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { ARTISAN_TOOL_IDS, MUSICAL_INSTRUMENT_IDS } from '@/lib/sources/tool-groups';

const GAMING_SETS = [
  'gaming-set-dice',
  'gaming-set-cards',
  'gaming-set-dragonchess',
  'gaming-set-three-dragon-ante',
] as const;

export const BACKGROUND_SOURCES: readonly BackgroundSource[] = [
  {
    id: 'acolyte',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'acolyte', 0),
        points: 3,
        from: ['int', 'wis', 'cha'],
      },
      { type: 'proficiency', category: 'skill', id: 'insight' },
      { type: 'proficiency', category: 'skill', id: 'religion' },
      { type: 'proficiency', category: 'tool', id: 'calligrapherstools' },
      { type: 'feature', feature: { id: 'feat-magic-initiate-cleric' } },
    ],
  },
  {
    id: 'artisan',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'artisan', 0),
        points: 3,
        from: ['str', 'dex', 'int'],
      },
      { type: 'proficiency', category: 'skill', id: 'investigation' },
      { type: 'proficiency', category: 'skill', id: 'persuasion' },
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: createChoiceKey('tool-choice', 'background', 'artisan', 0),
        count: 1,
        from: ARTISAN_TOOL_IDS,
      },
      { type: 'feat', featId: 'crafter' },
    ],
  },
  {
    id: 'charlatan',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'charlatan', 0),
        points: 3,
        from: ['dex', 'con', 'cha'],
      },
      { type: 'proficiency', category: 'skill', id: 'deception' },
      { type: 'proficiency', category: 'skill', id: 'sleightofhand' },
      { type: 'proficiency', category: 'tool', id: 'forgerykit' },
      { type: 'feat', featId: 'skilled' },
    ],
  },
  {
    id: 'criminal',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'criminal', 0),
        points: 3,
        from: ['dex', 'con', 'int'],
      },
      { type: 'proficiency', category: 'skill', id: 'sleightofhand' },
      { type: 'proficiency', category: 'skill', id: 'stealth' },
      { type: 'proficiency', category: 'tool', id: 'thievestools' },
      { type: 'feat', featId: 'alert' },
    ],
  },
  {
    id: 'entertainer',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'entertainer', 0),
        points: 3,
        from: ['str', 'dex', 'cha'],
      },
      { type: 'proficiency', category: 'skill', id: 'acrobatics' },
      { type: 'proficiency', category: 'skill', id: 'performance' },
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: createChoiceKey('tool-choice', 'background', 'entertainer', 0),
        count: 1,
        from: MUSICAL_INSTRUMENT_IDS,
      },
      { type: 'feat', featId: 'musician' },
    ],
  },
  {
    id: 'farmer',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'farmer', 0),
        points: 3,
        from: ['str', 'con', 'wis'],
      },
      { type: 'proficiency', category: 'skill', id: 'animalhandling' },
      { type: 'proficiency', category: 'skill', id: 'nature' },
      { type: 'proficiency', category: 'tool', id: 'carpentertools' },
      { type: 'feat', featId: 'tough' },
    ],
  },
  {
    id: 'guard',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'guard', 0),
        points: 3,
        from: ['str', 'int', 'wis'],
      },
      { type: 'proficiency', category: 'skill', id: 'athletics' },
      { type: 'proficiency', category: 'skill', id: 'perception' },
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: createChoiceKey('tool-choice', 'background', 'guard', 0),
        count: 1,
        from: GAMING_SETS,
      },
      { type: 'feat', featId: 'alert' },
    ],
  },
  {
    id: 'guide',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'guide', 0),
        points: 3,
        from: ['dex', 'con', 'wis'],
      },
      { type: 'proficiency', category: 'skill', id: 'stealth' },
      { type: 'proficiency', category: 'skill', id: 'survival' },
      { type: 'proficiency', category: 'tool', id: 'cartographerstools' },
      { type: 'feature', feature: { id: 'feat-magic-initiate-druid' } },
    ],
  },
  {
    id: 'hermit',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'hermit', 0),
        points: 3,
        from: ['con', 'wis', 'cha'],
      },
      { type: 'proficiency', category: 'skill', id: 'medicine' },
      { type: 'proficiency', category: 'skill', id: 'religion' },
      { type: 'proficiency', category: 'tool', id: 'herbalismkit' },
      { type: 'feat', featId: 'healer' },
    ],
  },
  {
    id: 'merchant',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'merchant', 0),
        points: 3,
        from: ['con', 'int', 'cha'],
      },
      { type: 'proficiency', category: 'skill', id: 'animalhandling' },
      { type: 'proficiency', category: 'skill', id: 'persuasion' },
      { type: 'proficiency', category: 'tool', id: 'navigatorstools' },
      { type: 'feat', featId: 'lucky' },
    ],
  },
  {
    id: 'noble',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'noble', 0),
        points: 3,
        from: ['str', 'int', 'cha'],
      },
      { type: 'proficiency', category: 'skill', id: 'history' },
      { type: 'proficiency', category: 'skill', id: 'persuasion' },
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: createChoiceKey('tool-choice', 'background', 'noble', 0),
        count: 1,
        from: GAMING_SETS,
      },
      { type: 'feat', featId: 'skilled' },
    ],
  },
  {
    id: 'sage',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'sage', 0),
        points: 3,
        from: ['con', 'int', 'wis'],
      },
      { type: 'proficiency', category: 'skill', id: 'arcana' },
      { type: 'proficiency', category: 'skill', id: 'history' },
      { type: 'proficiency', category: 'tool', id: 'calligrapherstools' },
      { type: 'feature', feature: { id: 'feat-magic-initiate-wizard' } },
    ],
  },
  {
    id: 'sailor',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'sailor', 0),
        points: 3,
        from: ['str', 'dex', 'con'],
      },
      { type: 'proficiency', category: 'skill', id: 'acrobatics' },
      { type: 'proficiency', category: 'skill', id: 'perception' },
      { type: 'proficiency', category: 'tool', id: 'navigatorstools' },
      { type: 'feat', featId: 'tavern-brawler' },
    ],
  },
  {
    id: 'scribe',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'scribe', 0),
        points: 3,
        from: ['dex', 'int', 'wis'],
      },
      { type: 'proficiency', category: 'skill', id: 'investigation' },
      { type: 'proficiency', category: 'skill', id: 'perception' },
      { type: 'proficiency', category: 'tool', id: 'calligrapherstools' },
      { type: 'feat', featId: 'skilled' },
    ],
  },
  {
    id: 'soldier',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'soldier', 0),
        points: 3,
        from: ['str', 'dex', 'con'],
      },
      { type: 'proficiency', category: 'skill', id: 'athletics' },
      { type: 'proficiency', category: 'skill', id: 'intimidation' },
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: createChoiceKey('tool-choice', 'background', 'soldier', 0),
        count: 1,
        from: GAMING_SETS,
      },
      { type: 'feat', featId: 'savage-attacker' },
    ],
  },
  {
    id: 'wayfarer',
    grants: [
      {
        type: 'asi',
        key: createChoiceKey('asi', 'background', 'wayfarer', 0),
        points: 3,
        from: ['dex', 'wis', 'cha'],
      },
      { type: 'proficiency', category: 'skill', id: 'insight' },
      { type: 'proficiency', category: 'skill', id: 'stealth' },
      { type: 'proficiency', category: 'tool', id: 'thievestools' },
      { type: 'feat', featId: 'lucky' },
    ],
  },
];
