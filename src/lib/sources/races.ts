import type { RaceSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';

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
  {
    id: 'dwarf-mountain',
    defaultSize: 'medium',
    defaultSpeed: 25,
    grants: [
      // Ability Score Increase: +2 STR, +2 CON
      { type: 'ability-bonus', ability: 'str', bonus: 2 },
      { type: 'ability-bonus', ability: 'con', bonus: 2 },
      // Speed: 25 ft (not reduced by heavy armor)
      { type: 'speed', mode: 'walk', value: 25 },
      // Languages: Common, Dwarvish
      { type: 'proficiency', category: 'language', id: 'common' },
      { type: 'proficiency', category: 'language', id: 'dwarvish' },
      // Dwarven Armor Training: light and medium armor proficiency
      { type: 'proficiency', category: 'armor', id: 'light' },
      { type: 'proficiency', category: 'armor', id: 'medium' },
      // Dwarven Combat Training: battleaxe, handaxe, lighthammer, warhammer
      { type: 'proficiency', category: 'weapon', id: 'battleaxe' },
      { type: 'proficiency', category: 'weapon', id: 'handaxe' },
      { type: 'proficiency', category: 'weapon', id: 'lighthammer' },
      { type: 'proficiency', category: 'weapon', id: 'warhammer' },
      // Tool Proficiency: choose one from smith's tools, brewer's supplies, mason's tools
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: createChoiceKey('tool-choice', 'race', 'dwarf-mountain', 0),
        count: 1,
        from: ['smithstools', 'brewersupplies', 'masonstools'],
      },
      // Darkvision (60 ft)
      {
        type: 'feature',
        feature: {
          id: 'dwarf-darkvision',
          name: 'Darkvision',
          description:
            'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.',
        },
      },
      // Dwarven Resilience: advantage on saves vs. poison, resistance to poison damage
      { type: 'resistance', damageType: 'poison' },
      {
        type: 'feature',
        feature: {
          id: 'dwarf-dwarven-resilience',
          name: 'Dwarven Resilience',
          description: 'You have advantage on saving throws against poison.',
        },
      },
      // Stonecunning
      {
        type: 'feature',
        feature: {
          id: 'dwarf-stonecunning',
          name: 'Stonecunning',
          description:
            'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus.',
        },
      },
    ],
  },
  {
    id: 'halfling-lightfoot',
    defaultSize: 'small',
    defaultSpeed: 25,
    grants: [
      { type: 'ability-bonus', ability: 'dex', bonus: 2 },
      { type: 'ability-bonus', ability: 'cha', bonus: 1 },
      { type: 'speed', mode: 'walk', value: 25 },
      { type: 'proficiency', category: 'language', id: 'common' },
      { type: 'proficiency', category: 'language', id: 'halfling' },
      {
        type: 'feature',
        feature: {
          id: 'halfling-lucky',
          name: 'Lucky',
          description:
            'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
        },
      },
      {
        type: 'feature',
        feature: {
          id: 'halfling-brave',
          name: 'Brave',
          description: 'You have advantage on saving throws against being frightened.',
        },
      },
      {
        type: 'feature',
        feature: {
          id: 'halfling-nimbleness',
          name: 'Halfling Nimbleness',
          description: 'You can move through the space of any creature that is of a size larger than yours.',
        },
      },
      {
        type: 'feature',
        feature: {
          id: 'halfling-naturally-stealthy',
          name: 'Naturally Stealthy',
          description:
            'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.',
        },
      },
    ],
  },
  {
    id: 'halfling-stout',
    defaultSize: 'small',
    defaultSpeed: 25,
    grants: [
      { type: 'ability-bonus', ability: 'dex', bonus: 2 },
      { type: 'ability-bonus', ability: 'con', bonus: 1 },
      { type: 'speed', mode: 'walk', value: 25 },
      { type: 'proficiency', category: 'language', id: 'common' },
      { type: 'proficiency', category: 'language', id: 'halfling' },
      {
        type: 'feature',
        feature: {
          id: 'halfling-lucky',
          name: 'Lucky',
          description:
            'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
        },
      },
      {
        type: 'feature',
        feature: {
          id: 'halfling-brave',
          name: 'Brave',
          description: 'You have advantage on saving throws against being frightened.',
        },
      },
      {
        type: 'feature',
        feature: {
          id: 'halfling-nimbleness',
          name: 'Halfling Nimbleness',
          description: 'You can move through the space of any creature that is of a size larger than yours.',
        },
      },
      { type: 'resistance', damageType: 'poison' },
      {
        type: 'feature',
        feature: {
          id: 'halfling-stout-resilience',
          name: 'Stout Resilience',
          description:
            'You have advantage on saving throws against poison, and you have resistance against poison damage.',
        },
      },
    ],
  },
  {
    id: 'halfelf',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      // Ability Score Increase: +2 CHA (fixed)
      { type: 'ability-bonus', ability: 'cha', bonus: 2 },
      // Ability Score Increase: +1 to two other abilities of player's choice (not CHA)
      {
        type: 'ability-choice',
        key: createChoiceKey('ability-choice', 'race', 'halfelf', 0),
        count: 2,
        bonus: 1,
        from: ['str', 'dex', 'con', 'int', 'wis'],
      },
      // Speed: 30 ft
      { type: 'speed', mode: 'walk', value: 30 },
      // Languages: Common, Elvish (fixed)
      { type: 'proficiency', category: 'language', id: 'common' },
      { type: 'proficiency', category: 'language', id: 'elvish' },
      // One additional language of choice
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'race', 'halfelf', 0),
        count: 1,
        from: null,
      },
      // Skill Versatility: proficiency in 2 skills of player's choice
      {
        type: 'proficiency-choice',
        category: 'skill',
        key: createChoiceKey('skill-choice', 'race', 'halfelf', 0),
        count: 2,
        from: null,
      },
      // Darkvision (60 ft)
      { type: 'feature', feature: { id: 'halfelf-darkvision' } },
      // Fey Ancestry: advantage vs charm, immune to magical sleep
      { type: 'feature', feature: { id: 'halfelf-fey-ancestry' } },
      // Skill Versatility
      { type: 'feature', feature: { id: 'halfelf-skill-versatility' } },
    ],
  },
];
