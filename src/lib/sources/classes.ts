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
  // ─── Barbarian ───────────────────────────────────────────────────────────────
  {
    id: 'barbarian',
    primaryAbility: 'str',
    quickBuild: makeQuickBuild({
      highestAbility: ['str'],
      secondaryAbility: 'con',
      suggestedBackground: 'soldier',
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
            from: ['athletics', 'animalhandling', 'intimidation', 'nature', 'perception', 'survival'],
          },
          { type: 'feature', feature: { id: 'barbarian-rage' } },
          { type: 'feature', feature: { id: 'barbarian-unarmored-defense' } },
          { type: 'armor-class', calculation: { mode: 'unarmored', formula: 'barbarian' } },
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'barbarian', 0),
            count: 2,
          },
        ],
      },
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-reckless-attack' } },
          { type: 'feature', feature: { id: 'barbarian-danger-sense' } },
        ],
      },
      {
        grants: [{ type: 'subclass', classId: 'barbarian', key: createChoiceKey('subclass', 'class', 'barbarian', 0) }],
      },
      {
        grants: [
          { type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 0), points: 2, from: null },
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'barbarian', 1),
            count: 1,
          },
        ],
      },
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-extra-attack' } },
          { type: 'feature', feature: { id: 'barbarian-fast-movement' } },
        ],
      },
      EMPTY_LEVEL,
      {
        grants: [
          { type: 'feature', feature: { id: 'barbarian-feral-instinct' } },
          { type: 'feature', feature: { id: 'barbarian-instinctive-pounce' } },
        ],
      },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 1), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'barbarian-brutal-strike' } }] },
      {
        grants: [
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'barbarian', 2),
            count: 1,
          },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'barbarian-relentless-rage' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 2), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'barbarian-improved-brutal-strike' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'barbarian-persistent-rage' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 3), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'barbarian-improved-brutal-strike-2' } }] },
      { grants: [{ type: 'feature', feature: { id: 'barbarian-indomitable-might' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'barbarian', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'barbarian-primal-champion' } }] },
    ],
  },

  // ─── Bard ─────────────────────────────────────────────────────────────────
  {
    id: 'bard',
    primaryAbility: 'cha',
    quickBuild: makeQuickBuild({
      highestAbility: ['cha'],
      secondaryAbility: 'dex',
      suggestedBackground: 'entertainer',
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
          { type: 'proficiency', category: 'saving-throw', id: 'dex' },
          { type: 'proficiency', category: 'saving-throw', id: 'cha' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'bard', 0),
            count: 3,
            from: null,
          },
          {
            type: 'proficiency-choice',
            category: 'tool',
            key: createChoiceKey('tool-choice', 'class', 'bard', 1),
            count: 3,
            from: ['bagpipes', 'drum', 'dulcimer', 'flute', 'lute', 'lyre', 'horn', 'panflute', 'shawm', 'viol'],
          },
          { type: 'spellcasting', ability: 'cha', source: 'class' },
          { type: 'feature', feature: { id: 'bard-bardic-inspiration' } },
          { type: 'armor-class', calculation: { mode: 'armored' } },
        ],
      },
      {
        grants: [
          { type: 'feature', feature: { id: 'bard-jack-of-all-trades' } },
          { type: 'feature', feature: { id: 'bard-song-of-rest' } },
        ],
      },
      {
        grants: [
          { type: 'subclass', classId: 'bard', key: createChoiceKey('subclass', 'class', 'bard', 0) },
          {
            type: 'expertise-choice',
            key: createChoiceKey('expertise-choice', 'class', 'bard', 0),
            count: 2,
            from: null,
            fromTools: [],
          },
        ],
      },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'bard', 0), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'bard-font-of-inspiration' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'bard-countercharm' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'bard', 1), points: 2, from: null }] },
      EMPTY_LEVEL,
      {
        grants: [
          { type: 'feature', feature: { id: 'bard-magical-secrets' } },
          {
            type: 'expertise-choice',
            key: createChoiceKey('expertise-choice', 'class', 'bard', 1),
            count: 2,
            from: null,
            fromTools: [],
          },
        ],
      },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'bard', 2), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'bard-superior-inspiration' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'bard', 3), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'bard-words-of-creation' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'bard', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'bard-epic-boon' } }] },
    ],
  },

  // ─── Cleric ───────────────────────────────────────────────────────────────
  {
    id: 'cleric',
    primaryAbility: 'wis',
    quickBuild: makeQuickBuild({
      highestAbility: ['wis'],
      secondaryAbility: 'con',
      suggestedBackground: 'acolyte',
    }),
    levels: [
      {
        grants: [
          { type: 'hit-die', die: 8 },
          { type: 'proficiency', category: 'armor', id: 'light' },
          { type: 'proficiency', category: 'armor', id: 'medium' },
          { type: 'proficiency', category: 'armor', id: 'shields' },
          { type: 'proficiency', category: 'weapon', id: 'simple' },
          { type: 'proficiency', category: 'saving-throw', id: 'wis' },
          { type: 'proficiency', category: 'saving-throw', id: 'cha' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'cleric', 0),
            count: 2,
            from: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
          },
          { type: 'spellcasting', ability: 'wis', source: 'class' },
          {
            type: 'feature-choice',
            key: createChoiceKey('feature-choice', 'class', 'cleric', 0),
            options: [
              {
                optionId: 'protector',
                featureId: 'cleric-divine-order-protector',
                grants: [
                  { type: 'proficiency', category: 'weapon', id: 'martial' },
                  { type: 'proficiency', category: 'armor', id: 'heavy' },
                ],
              },
              {
                optionId: 'thaumaturge',
                featureId: 'cleric-divine-order-thaumaturge',
                // Mechanical effects (extra cantrip; Wis-mod bonus to Arcana/Religion checks) are
                // inert pending a cantrip-grant system and an ability-check-bonus value beyond
                // 'half-proficiency'.
                grants: [],
              },
            ],
          },
          { type: 'armor-class', calculation: { mode: 'armored' } },
        ],
      },
      {
        grants: [{ type: 'feature', feature: { id: 'cleric-channel-divinity' } }],
      },
      { grants: [{ type: 'subclass', classId: 'cleric', key: createChoiceKey('subclass', 'class', 'cleric', 0) }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'cleric', 0), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'cleric-smite-undead' } }] },
      EMPTY_LEVEL,
      {
        grants: [
          {
            type: 'feature-choice',
            key: createChoiceKey('feature-choice', 'class', 'cleric', 1),
            options: [
              {
                optionId: 'divine-strike',
                featureId: 'cleric-blessed-strikes-divine-strike',
                // On-hit damage rider (+1d8 necrotic/radiant on weapon hits) has no grant model yet.
                grants: [],
              },
              {
                optionId: 'potent-spellcasting',
                featureId: 'cleric-blessed-strikes-potent-spellcasting',
                // Cantrip-damage modifier (+Wis mod) has no grant model yet.
                grants: [],
              },
            ],
          },
        ],
      },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'cleric', 1), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'cleric-divine-intervention' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'cleric', 2), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'cleric', 3), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'cleric-channel-divinity-3' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'cleric', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'cleric-greater-divine-intervention' } }] },
    ],
  },

  // ─── Druid ────────────────────────────────────────────────────────────────
  {
    id: 'druid',
    primaryAbility: 'wis',
    quickBuild: makeQuickBuild({
      highestAbility: ['wis'],
      secondaryAbility: 'con',
      suggestedBackground: 'hermit',
    }),
    levels: [
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
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'druid', 0),
            count: 2,
            from: ['arcana', 'animalhandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
          },
          { type: 'spellcasting', ability: 'wis', source: 'class' },
          {
            type: 'feature-choice',
            key: createChoiceKey('feature-choice', 'class', 'druid', 0),
            options: [
              {
                optionId: 'magician',
                featureId: 'druid-primal-order-magician',
                // inert pending cantrip-grant + ability-check-bonus systems
                grants: [],
              },
              {
                optionId: 'warden',
                featureId: 'druid-primal-order-warden',
                grants: [
                  { type: 'proficiency', category: 'weapon', id: 'martial' },
                  { type: 'proficiency', category: 'armor', id: 'medium-nonmetal' },
                ],
              },
            ],
          },
          { type: 'armor-class', calculation: { mode: 'armored' } },
        ],
      },
      {
        grants: [
          { type: 'feature', feature: { id: 'druid-wild-shape' } },
          { type: 'feature', feature: { id: 'druid-wild-companion' } },
        ],
      },
      { grants: [{ type: 'subclass', classId: 'druid', key: createChoiceKey('subclass', 'class', 'druid', 0) }] },
      {
        grants: [
          { type: 'asi', key: createChoiceKey('asi', 'class', 'druid', 0), points: 2, from: null },
          { type: 'feature', feature: { id: 'druid-wild-shape-improvement-1' } },
        ],
      },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'druid-wild-resurgence' } }] },
      {
        grants: [
          { type: 'asi', key: createChoiceKey('asi', 'class', 'druid', 1), points: 2, from: null },
          { type: 'feature', feature: { id: 'druid-wild-shape-improvement-2' } },
        ],
      },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      {
        grants: [
          {
            type: 'feature-choice',
            key: createChoiceKey('feature-choice', 'class', 'druid', 1),
            options: [
              {
                optionId: 'potent-spellcasting',
                featureId: 'druid-elemental-fury-potent-spellcasting',
                // inert pending cantrip-damage model
                grants: [],
              },
              {
                optionId: 'primal-strike',
                featureId: 'druid-elemental-fury-primal-strike',
                // inert pending on-hit damage model
                grants: [],
              },
            ],
          },
        ],
      },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'druid', 2), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'druid', 3), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'druid-improved-elemental-fury' } }] },
      { grants: [{ type: 'feature', feature: { id: 'druid-beast-spells' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'druid', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'druid-archdruid' } }] },
    ],
  },

  // ─── Fighter ──────────────────────────────────────────────────────────────
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
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'fighter', 0),
            count: 3,
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
      {
        grants: [
          { type: 'asi', key: createChoiceKey('asi', 'class', 'fighter', 0), points: 2, from: null },
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'fighter', 1),
            count: 1,
          },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'fighter-extra-attack' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'fighter', 1), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'fighter', 2), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'fighter-indomitable' } }] },
      {
        grants: [
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'fighter', 2),
            count: 1,
          },
        ],
      },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      {
        grants: [
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'fighter', 3),
            count: 1,
          },
        ],
      },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
    ],
  },

  // ─── Monk ─────────────────────────────────────────────────────────────────
  {
    id: 'monk',
    primaryAbility: 'dex',
    quickBuild: makeQuickBuild({
      highestAbility: ['dex'],
      secondaryAbility: 'wis',
      suggestedBackground: 'hermit',
    }),
    levels: [
      {
        grants: [
          { type: 'hit-die', die: 8 },
          { type: 'proficiency', category: 'weapon', id: 'simple' },
          { type: 'proficiency', category: 'weapon', id: 'shortsword' },
          { type: 'proficiency', category: 'saving-throw', id: 'str' },
          { type: 'proficiency', category: 'saving-throw', id: 'dex' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'monk', 0),
            count: 2,
            from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
          },
          { type: 'feature', feature: { id: 'monk-martial-arts' } },
          { type: 'feature', feature: { id: 'monk-unarmored-defense' } },
          { type: 'armor-class', calculation: { mode: 'unarmored', formula: 'monk' } },
        ],
      },
      {
        grants: [
          { type: 'feature', feature: { id: 'monk-focus-points' } },
          {
            type: 'resource-pool',
            poolId: 'focus-points',
            max: { mode: 'class-level', classId: 'monk' },
            regen: 'short-rest',
          },
          { type: 'feature', feature: { id: 'monk-unarmored-movement' } },
          { type: 'feature', feature: { id: 'monk-uncanny-metabolism' } },
        ],
      },
      {
        grants: [
          { type: 'subclass', classId: 'monk', key: createChoiceKey('subclass', 'class', 'monk', 0) },
          { type: 'feature', feature: { id: 'monk-deflect-attacks' } },
        ],
      },
      {
        grants: [
          { type: 'asi', key: createChoiceKey('asi', 'class', 'monk', 0), points: 2, from: null },
          { type: 'feature', feature: { id: 'monk-slow-fall' } },
        ],
      },
      {
        grants: [
          { type: 'feature', feature: { id: 'monk-extra-attack' } },
          { type: 'feature', feature: { id: 'monk-stunning-strike' } },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'monk-empowered-strikes' } }] },
      {
        grants: [
          { type: 'feature', feature: { id: 'monk-evasion' } },
          { type: 'feature', feature: { id: 'monk-stillness-of-mind' } },
        ],
      },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'monk', 1), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'monk-acrobatic-movement' } }] },
      {
        grants: [
          { type: 'feature', feature: { id: 'monk-heightened-focus' } },
          { type: 'feature', feature: { id: 'monk-self-restoration' } },
        ],
      },
      EMPTY_LEVEL,
      {
        grants: [
          { type: 'asi', key: createChoiceKey('asi', 'class', 'monk', 2), points: 2, from: null },
          { type: 'feature', feature: { id: 'monk-disciplined-survivor' } },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'monk-perfect-focus' } }] },
      { grants: [{ type: 'feature', feature: { id: 'monk-diamond-soul' } }] },
      { grants: [{ type: 'feature', feature: { id: 'monk-superior-defense' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'monk', 3), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'monk-body-and-mind' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'monk', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'monk-epic-boon' } }] },
    ],
  },

  // ─── Paladin ──────────────────────────────────────────────────────────────
  {
    id: 'paladin',
    primaryAbility: 'str',
    quickBuild: makeQuickBuild({
      highestAbility: ['str'],
      secondaryAbility: 'cha',
      suggestedBackground: 'noble',
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
          { type: 'proficiency', category: 'saving-throw', id: 'wis' },
          { type: 'proficiency', category: 'saving-throw', id: 'cha' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'paladin', 0),
            count: 2,
            from: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
          },
          { type: 'spellcasting', ability: 'cha', source: 'class' },
          { type: 'feature', feature: { id: 'paladin-lay-on-hands' } },
          { type: 'feature', feature: { id: 'paladin-divine-sense' } },
          { type: 'armor-class', calculation: { mode: 'armored' } },
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'paladin', 0),
            count: 2,
          },
        ],
      },
      {
        grants: [
          { type: 'feature', feature: { id: 'paladin-divine-smite' } },
          { type: 'feature', feature: { id: 'paladin-channel-divinity' } },
        ],
      },
      { grants: [{ type: 'subclass', classId: 'paladin', key: createChoiceKey('subclass', 'class', 'paladin', 0) }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'paladin', 0), points: 2, from: null }] },
      {
        grants: [
          { type: 'feature', feature: { id: 'paladin-extra-attack' } },
          { type: 'feature', feature: { id: 'paladin-faithful-steed' } },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'paladin-aura-of-protection' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'paladin', 1), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'paladin-abjure-foes' } }] },
      { grants: [{ type: 'feature', feature: { id: 'paladin-aura-of-courage' } }] },
      { grants: [{ type: 'feature', feature: { id: 'paladin-radiant-strikes' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'paladin', 2), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'paladin-restoring-touch' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'paladin', 3), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'paladin-aura-expansion' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'paladin', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'paladin-epic-boon' } }] },
    ],
  },

  // ─── Ranger ───────────────────────────────────────────────────────────────
  {
    id: 'ranger',
    primaryAbility: 'dex',
    quickBuild: makeQuickBuild({
      highestAbility: ['dex'],
      secondaryAbility: 'wis',
      suggestedBackground: 'guide',
    }),
    levels: [
      {
        grants: [
          { type: 'hit-die', die: 10 },
          { type: 'proficiency', category: 'armor', id: 'light' },
          { type: 'proficiency', category: 'armor', id: 'medium' },
          { type: 'proficiency', category: 'armor', id: 'shields' },
          { type: 'proficiency', category: 'weapon', id: 'simple' },
          { type: 'proficiency', category: 'weapon', id: 'martial' },
          { type: 'proficiency', category: 'saving-throw', id: 'str' },
          { type: 'proficiency', category: 'saving-throw', id: 'dex' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'ranger', 0),
            count: 3,
            from: [
              'animalhandling',
              'athletics',
              'insight',
              'investigation',
              'nature',
              'perception',
              'stealth',
              'survival',
            ],
          },
          { type: 'feature', feature: { id: 'ranger-favored-enemy' } },
          { type: 'feature', feature: { id: 'ranger-weapon-mastery' } },
          { type: 'armor-class', calculation: { mode: 'armored' } },
          {
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'ranger', 0),
            count: 2,
          },
        ],
      },
      {
        grants: [
          { type: 'spellcasting', ability: 'wis', source: 'class' },
          { type: 'feature', feature: { id: 'ranger-deft-explorer' } },
          {
            type: 'fighting-style-choice',
            key: createChoiceKey('fighting-style-choice', 'class', 'ranger', 0),
            count: 1,
            from: FIGHTING_STYLE_IDS,
          },
        ],
      },
      {
        grants: [{ type: 'subclass', classId: 'ranger', key: createChoiceKey('subclass', 'class', 'ranger', 0) }],
      },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'ranger', 0), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'ranger-extra-attack' } }] },
      {
        grants: [
          {
            type: 'expertise-choice',
            key: createChoiceKey('expertise-choice', 'class', 'ranger', 0),
            count: 2,
            from: null,
            fromTools: [],
          },
          // Roving (L6, 2024 PHB): climb + swim equal to walking speed. The +10
          // walking-speed bump (and its heavy-armor restriction) stays in feature
          // text — needs additive-speed and conditional-grant infrastructure
          // that don't exist yet. The co-located expertise-choice is itself
          // misplaced in 2024 (PHB has Expertise at L9, not L6) — see issue
          // tracker for the full Ranger feature-placement audit.
          { type: 'feature', feature: { id: 'ranger-roving' } },
          { type: 'speed', mode: 'climb', value: 'walk-equivalent' },
          { type: 'speed', mode: 'swim', value: 'walk-equivalent' },
        ],
      },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'ranger', 1), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'ranger-conjure-barrage' } }] },
      { grants: [{ type: 'feature', feature: { id: 'ranger-tireless' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'ranger', 2), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'ranger-relentless-hunter' } }] },
      { grants: [{ type: 'feature', feature: { id: 'ranger-natures-veil' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'ranger', 3), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'ranger-conjure-volley' } }] },
      { grants: [{ type: 'feature', feature: { id: 'ranger-swift-quiver' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'ranger', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'ranger-epic-boon' } }] },
    ],
  },

  // ─── Rogue ────────────────────────────────────────────────────────────────
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
            type: 'weapon-mastery-choice',
            key: createChoiceKey('weapon-mastery-choice', 'class', 'rogue', 0),
            count: 2,
          },
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
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'rogue', 0), points: 2, from: null }] },
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
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'rogue', 1), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'rogue', 2), points: 2, from: null }] },
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

  // ─── Sorcerer ─────────────────────────────────────────────────────────────
  {
    id: 'sorcerer',
    primaryAbility: 'cha',
    quickBuild: makeQuickBuild({
      highestAbility: ['cha'],
      secondaryAbility: 'con',
      suggestedBackground: 'sage',
    }),
    levels: [
      {
        grants: [
          { type: 'hit-die', die: 6 },
          { type: 'proficiency', category: 'weapon', id: 'dagger' },
          { type: 'proficiency', category: 'weapon', id: 'dart' },
          { type: 'proficiency', category: 'weapon', id: 'sling' },
          { type: 'proficiency', category: 'weapon', id: 'quarterstaff' },
          { type: 'proficiency', category: 'weapon', id: 'lightcrossbow' },
          { type: 'proficiency', category: 'saving-throw', id: 'con' },
          { type: 'proficiency', category: 'saving-throw', id: 'cha' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'sorcerer', 0),
            count: 2,
            from: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
          },
          { type: 'spellcasting', ability: 'cha', source: 'class' },
          { type: 'feature', feature: { id: 'sorcerer-innate-sorcery' } },
          { type: 'armor-class', calculation: { mode: 'armored' } },
        ],
      },
      {
        grants: [
          { type: 'feature', feature: { id: 'sorcerer-font-of-magic' } },
          { type: 'feature', feature: { id: 'sorcerer-metamagic' } },
        ],
      },
      { grants: [{ type: 'subclass', classId: 'sorcerer', key: createChoiceKey('subclass', 'class', 'sorcerer', 0) }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'sorcerer', 0), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'sorcerer-sorcery-incarnate' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'sorcerer', 1), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'sorcerer-metamagic-options' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'sorcerer', 2), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'sorcerer', 3), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'sorcerer-arcane-apotheosis' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'sorcerer', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'sorcerer-sorcerous-restoration' } }] },
    ],
  },

  // ─── Warlock ──────────────────────────────────────────────────────────────
  {
    id: 'warlock',
    primaryAbility: 'cha',
    quickBuild: makeQuickBuild({
      highestAbility: ['cha'],
      secondaryAbility: 'con',
      suggestedBackground: 'charlatan',
    }),
    levels: [
      {
        grants: [
          { type: 'hit-die', die: 8 },
          { type: 'proficiency', category: 'armor', id: 'light' },
          { type: 'proficiency', category: 'weapon', id: 'simple' },
          { type: 'proficiency', category: 'saving-throw', id: 'wis' },
          { type: 'proficiency', category: 'saving-throw', id: 'cha' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'warlock', 0),
            count: 2,
            from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
          },
          { type: 'spellcasting', ability: 'cha', source: 'class' },
          { type: 'feature', feature: { id: 'warlock-eldritch-invocations' } },
          { type: 'feature', feature: { id: 'warlock-magical-cunning' } },
          { type: 'armor-class', calculation: { mode: 'armored' } },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'warlock-pact-magic-enhancement' } }] },
      {
        grants: [
          { type: 'subclass', classId: 'warlock', key: createChoiceKey('subclass', 'class', 'warlock', 0) },
          { type: 'feature', feature: { id: 'warlock-pact-boon' } },
        ],
      },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'warlock', 0), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'warlock', 1), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'warlock-mystic-arcanum-6' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'warlock', 2), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'warlock-mystic-arcanum-7' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'warlock-mystic-arcanum-8' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'warlock', 3), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'warlock-mystic-arcanum-9' } }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'warlock', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'warlock-eldritch-master' } }] },
    ],
  },

  // ─── Wizard ───────────────────────────────────────────────────────────────
  {
    id: 'wizard',
    primaryAbility: 'int',
    quickBuild: makeQuickBuild({
      highestAbility: ['int'],
      secondaryAbility: 'con',
      suggestedBackground: 'sage',
    }),
    levels: [
      {
        grants: [
          { type: 'hit-die', die: 6 },
          { type: 'proficiency', category: 'weapon', id: 'dagger' },
          { type: 'proficiency', category: 'weapon', id: 'dart' },
          { type: 'proficiency', category: 'weapon', id: 'sling' },
          { type: 'proficiency', category: 'weapon', id: 'quarterstaff' },
          { type: 'proficiency', category: 'weapon', id: 'lightcrossbow' },
          { type: 'proficiency', category: 'saving-throw', id: 'int' },
          { type: 'proficiency', category: 'saving-throw', id: 'wis' },
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'class', 'wizard', 0),
            count: 2,
            from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
          },
          { type: 'spellcasting', ability: 'int', source: 'class' },
          { type: 'feature', feature: { id: 'wizard-arcane-recovery' } },
          { type: 'armor-class', calculation: { mode: 'armored' } },
        ],
      },
      { grants: [{ type: 'feature', feature: { id: 'wizard-scholar' } }] },
      { grants: [{ type: 'subclass', classId: 'wizard', key: createChoiceKey('subclass', 'class', 'wizard', 0) }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'wizard', 0), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'wizard-memorize-spell' } }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'wizard', 1), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'wizard', 2), points: 2, from: null }] },
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      EMPTY_LEVEL,
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'wizard', 3), points: 2, from: null }] },
      EMPTY_LEVEL,
      { grants: [{ type: 'feature', feature: { id: 'wizard-spell-mastery' } }] },
      { grants: [{ type: 'asi', key: createChoiceKey('asi', 'class', 'wizard', 4), points: 2, from: null }] },
      { grants: [{ type: 'feature', feature: { id: 'wizard-signature-spells' } }] },
    ],
  },
];
