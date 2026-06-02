import { createChoiceKey } from '@/types/choices';
import type { FeatSource } from '@/types/sources';

export const FEAT_SOURCES: readonly FeatSource[] = [
  // Origin feats — no level prerequisite, granted by backgrounds
  {
    id: 'alert',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-alert' } }],
  },
  {
    id: 'crafter',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-crafter' } }],
  },
  {
    id: 'healer',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-healer' } }],
  },
  {
    id: 'lucky',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-lucky' } }],
  },
  {
    id: 'magic-initiate',
    category: 'origin',
    prerequisites: [],
    repeatable: true,
    grants: [
      {
        type: 'feature-choice',
        key: createChoiceKey('feature-choice', 'feat', 'magic-initiate', 0),
        options: [
          {
            optionId: 'bard',
            featureId: 'feat-magic-initiate-bard',
            grants: [{ type: 'feature', feature: { id: 'feat-magic-initiate-bard' } }],
          },
          {
            optionId: 'cleric',
            featureId: 'feat-magic-initiate-cleric',
            grants: [{ type: 'feature', feature: { id: 'feat-magic-initiate-cleric' } }],
          },
          {
            optionId: 'druid',
            featureId: 'feat-magic-initiate-druid',
            grants: [{ type: 'feature', feature: { id: 'feat-magic-initiate-druid' } }],
          },
          {
            optionId: 'sorcerer',
            featureId: 'feat-magic-initiate-sorcerer',
            grants: [{ type: 'feature', feature: { id: 'feat-magic-initiate-sorcerer' } }],
          },
          {
            optionId: 'warlock',
            featureId: 'feat-magic-initiate-warlock',
            grants: [{ type: 'feature', feature: { id: 'feat-magic-initiate-warlock' } }],
          },
          {
            optionId: 'wizard',
            featureId: 'feat-magic-initiate-wizard',
            grants: [{ type: 'feature', feature: { id: 'feat-magic-initiate-wizard' } }],
          },
        ],
      },
    ],
  },
  {
    id: 'musician',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-musician' } }],
  },
  {
    id: 'savage-attacker',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-savage-attacker' } }],
  },
  {
    id: 'skilled',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-skilled' } }],
  },
  {
    id: 'tavern-brawler',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-tavern-brawler' } }],
  },
  {
    id: 'tough',
    category: 'origin',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'feat-tough' } }],
  },

  // Fighting Style feats — grants must be kept manually in sync with FIGHTING_STYLE_SOURCES
  {
    id: 'archery',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-archery' } }],
  },
  {
    id: 'defense',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [
      { type: 'feature', feature: { id: 'fighting-style-defense' } },
      { type: 'ac-bonus', bonus: 1 },
    ],
  },
  {
    id: 'dueling',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-dueling' } }],
  },
  {
    id: 'great-weapon-fighting',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-great-weapon-fighting' } }],
  },
  {
    id: 'protection',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-protection' } }],
  },
  {
    id: 'two-weapon-fighting',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-two-weapon-fighting' } }],
  },
  {
    id: 'blind-fighting',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-blind-fighting' } }],
  },
  {
    id: 'interception',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-interception' } }],
  },
  {
    id: 'thrown-weapon-fighting',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-thrown-weapon-fighting' } }],
  },
  {
    id: 'unarmed-fighting',
    category: 'fightingStyle',
    prerequisites: [],
    grants: [{ type: 'feature', feature: { id: 'fighting-style-unarmed-fighting' } }],
  },

  // General feats — level 4+ prerequisite
  {
    id: 'actor',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-actor' } }],
  },
  {
    id: 'athlete',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-athlete' } }],
  },
  {
    id: 'charger',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-charger' } }],
  },
  {
    id: 'chef',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-chef' } }],
  },
  {
    id: 'crossbow-expert',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-crossbow-expert' } }],
  },
  {
    id: 'crusher',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-crusher' } }],
  },
  {
    id: 'defensive-duelist',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-defensive-duelist' } }],
  },
  {
    id: 'dual-wielder',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-dual-wielder' } }],
  },
  {
    id: 'durable',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-durable' } }],
  },
  {
    id: 'elemental-adept',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    repeatable: true,
    grants: [
      {
        type: 'feature-choice',
        key: createChoiceKey('feature-choice', 'feat', 'elemental-adept', 0),
        options: [
          {
            optionId: 'acid',
            featureId: 'feat-elemental-adept-acid',
            grants: [{ type: 'feature', feature: { id: 'feat-elemental-adept-acid' } }],
          },
          {
            optionId: 'cold',
            featureId: 'feat-elemental-adept-cold',
            grants: [{ type: 'feature', feature: { id: 'feat-elemental-adept-cold' } }],
          },
          {
            optionId: 'fire',
            featureId: 'feat-elemental-adept-fire',
            grants: [{ type: 'feature', feature: { id: 'feat-elemental-adept-fire' } }],
          },
          {
            optionId: 'lightning',
            featureId: 'feat-elemental-adept-lightning',
            grants: [{ type: 'feature', feature: { id: 'feat-elemental-adept-lightning' } }],
          },
          {
            optionId: 'thunder',
            featureId: 'feat-elemental-adept-thunder',
            grants: [{ type: 'feature', feature: { id: 'feat-elemental-adept-thunder' } }],
          },
        ],
      },
    ],
  },
  {
    id: 'fey-touched',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-fey-touched' } }],
  },
  {
    id: 'grappler',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-grappler' } }],
  },
  {
    id: 'great-weapon-master',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-great-weapon-master' } }],
  },
  {
    id: 'heavily-armored',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-heavily-armored' } }],
  },
  {
    id: 'heavy-armor-master',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-heavy-armor-master' } }],
  },
  {
    id: 'inspiring-leader',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-inspiring-leader' } }],
  },
  {
    id: 'keen-mind',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-keen-mind' } }],
  },
  {
    id: 'lightly-armored',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-lightly-armored' } }],
  },
  {
    id: 'mage-slayer',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-mage-slayer' } }],
  },
  {
    id: 'medium-armor-master',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-medium-armor-master' } }],
  },
  {
    id: 'moderately-armored',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-moderately-armored' } }],
  },
  {
    id: 'mounted-combatant',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-mounted-combatant' } }],
  },
  {
    id: 'observant',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-observant' } }],
  },
  {
    id: 'piercer',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-piercer' } }],
  },
  {
    id: 'poisoner',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-poisoner' } }],
  },
  {
    id: 'polearm-master',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-polearm-master' } }],
  },
  {
    id: 'resilient',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    repeatable: true,
    grants: [
      {
        type: 'feature-choice',
        key: createChoiceKey('feature-choice', 'feat', 'resilient', 0),
        options: [
          {
            optionId: 'strength',
            featureId: 'feat-resilient-strength',
            grants: [{ type: 'feature', feature: { id: 'feat-resilient-strength' } }],
          },
          {
            optionId: 'dexterity',
            featureId: 'feat-resilient-dexterity',
            grants: [{ type: 'feature', feature: { id: 'feat-resilient-dexterity' } }],
          },
          {
            optionId: 'constitution',
            featureId: 'feat-resilient-constitution',
            grants: [{ type: 'feature', feature: { id: 'feat-resilient-constitution' } }],
          },
          {
            optionId: 'intelligence',
            featureId: 'feat-resilient-intelligence',
            grants: [{ type: 'feature', feature: { id: 'feat-resilient-intelligence' } }],
          },
          {
            optionId: 'wisdom',
            featureId: 'feat-resilient-wisdom',
            grants: [{ type: 'feature', feature: { id: 'feat-resilient-wisdom' } }],
          },
          {
            optionId: 'charisma',
            featureId: 'feat-resilient-charisma',
            grants: [{ type: 'feature', feature: { id: 'feat-resilient-charisma' } }],
          },
        ],
      },
    ],
  },
  {
    id: 'ritual-caster',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-ritual-caster' } }],
  },
  {
    id: 'sentinel',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-sentinel' } }],
  },
  {
    id: 'shadow-touched',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-shadow-touched' } }],
  },
  {
    id: 'sharpshooter',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-sharpshooter' } }],
  },
  {
    id: 'shield-master',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-shield-master' } }],
  },
  {
    id: 'skill-expert',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-skill-expert' } }],
  },
  {
    id: 'skulker',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-skulker' } }],
  },
  {
    id: 'slasher',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-slasher' } }],
  },
  {
    id: 'speedy',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-speedy' } }],
  },
  {
    id: 'spell-sniper',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-spell-sniper' } }],
  },
  {
    id: 'telekinetic',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-telekinetic' } }],
  },
  {
    id: 'telepathic',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-telepathic' } }],
  },
  {
    id: 'war-caster',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-war-caster' } }],
  },
  {
    id: 'weapon-master',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-weapon-master' } }],
  },
  {
    id: 'martial-weapon-training',
    category: 'general',
    prerequisites: [{ type: 'level-minimum', level: 4 }],
    grants: [{ type: 'feature', feature: { id: 'feat-martial-weapon-training' } }],
  },

  // Epic Boon feats — level 19+ prerequisite
  {
    id: 'boon-of-combat-prowess',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-combat-prowess' } }],
  },
  {
    id: 'boon-of-dimensional-travel',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-dimensional-travel' } }],
  },
  {
    id: 'boon-of-energy-resistance',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-energy-resistance' } }],
  },
  {
    id: 'boon-of-fate',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-fate' } }],
  },
  {
    id: 'boon-of-fortitude',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-fortitude' } }],
  },
  {
    id: 'boon-of-irresistible-offense',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-irresistible-offense' } }],
  },
  {
    id: 'boon-of-night-spirit',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-night-spirit' } }],
  },
  {
    id: 'boon-of-recovery',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-recovery' } }],
  },
  {
    id: 'boon-of-skill',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-skill' } }],
  },
  {
    id: 'boon-of-speed',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-speed' } }],
  },
  {
    id: 'boon-of-spell-recall',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-spell-recall' } }],
  },
  {
    id: 'boon-of-truesight',
    category: 'epicBoon',
    prerequisites: [{ type: 'level-minimum', level: 19 }],
    grants: [{ type: 'feature', feature: { id: 'feat-boon-of-truesight' } }],
  },
];
