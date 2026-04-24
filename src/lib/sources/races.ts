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
          description:
            'You have advantage on saving throws against poison, and you have resistance against poison damage.',
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
    id: 'dwarf-hill',
    defaultSize: 'medium',
    defaultSpeed: 25,
    grants: [
      // Ability Score Increase: +2 CON (base dwarf), +1 WIS (hill subrace)
      { type: 'ability-bonus', ability: 'con', bonus: 2 },
      { type: 'ability-bonus', ability: 'wis', bonus: 1 },
      // Speed: 25 ft (not reduced by heavy armor)
      { type: 'speed', mode: 'walk', value: 25 },
      // Languages: Common, Dwarvish
      { type: 'proficiency', category: 'language', id: 'common' },
      { type: 'proficiency', category: 'language', id: 'dwarvish' },
      // Dwarven Combat Training: battleaxe, handaxe, lighthammer, warhammer
      { type: 'proficiency', category: 'weapon', id: 'battleaxe' },
      { type: 'proficiency', category: 'weapon', id: 'handaxe' },
      { type: 'proficiency', category: 'weapon', id: 'lighthammer' },
      { type: 'proficiency', category: 'weapon', id: 'warhammer' },
      // Tool Proficiency: choose one from smith's tools, brewer's supplies, mason's tools
      {
        type: 'proficiency-choice',
        category: 'tool',
        key: createChoiceKey('tool-choice', 'race', 'dwarf-hill', 0),
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
          description:
            'You have advantage on saving throws against poison, and you have resistance against poison damage.',
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
      // Dwarven Toughness (hill subrace): +1 HP per level
      { type: 'hp-bonus', perLevel: 1 },
      {
        type: 'feature',
        feature: {
          id: 'dwarf-dwarven-toughness',
          name: 'Dwarven Toughness',
          description: 'Your hit point maximum increases by 1, and it increases by 1 whenever you gain a level.',
        },
      },
    ],
  },
];
