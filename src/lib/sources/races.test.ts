import { describe, it, expect } from 'vitest';
import { getRaceSource } from '@/lib/sources';
import type { RaceId } from '@/lib/dnd-helpers';
import { createChoiceKey } from '@/types/choices';

const LIGHTFOOT_SHARED_FEATURE_IDS = [
  'halfling-lucky',
  'halfling-brave',
  'halfling-nimbleness',
  'halfling-naturally-stealthy',
];

const STOUT_SHARED_FEATURE_IDS = [
  'halfling-lucky',
  'halfling-brave',
  'halfling-nimbleness',
  'halfling-stout-resilience',
];

describe('Mountain Dwarf race source', () => {
  const source = getRaceSource('dwarf-mountain' as RaceId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(25);
  });

  it('grants +2 STR and +2 CON', () => {
    const abilityBonuses = source?.grants.filter((g) => g.type === 'ability-bonus');
    expect(abilityBonuses).toEqual(
      expect.arrayContaining([
        { type: 'ability-bonus', ability: 'str', bonus: 2 },
        { type: 'ability-bonus', ability: 'con', bonus: 2 },
      ])
    );
    expect(abilityBonuses).toHaveLength(2);
  });

  it('grants 25 ft walk speed', () => {
    const speed = source?.grants.find((g) => g.type === 'speed');
    expect(speed).toEqual({ type: 'speed', mode: 'walk', value: 25 });
  });

  it('grants Common and Dwarvish languages', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(2);
    expect(languages).toEqual(
      expect.arrayContaining([
        { type: 'proficiency', category: 'language', id: 'common' },
        { type: 'proficiency', category: 'language', id: 'dwarvish' },
      ])
    );
  });

  it('grants light and medium armor proficiency', () => {
    const armor = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'armor');
    expect(armor).toEqual(
      expect.arrayContaining([
        { type: 'proficiency', category: 'armor', id: 'light' },
        { type: 'proficiency', category: 'armor', id: 'medium' },
      ])
    );
    expect(armor).toHaveLength(2);
  });

  it('grants dwarven weapon proficiencies', () => {
    const weapons = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'weapon');
    expect(weapons).toEqual(
      expect.arrayContaining([
        { type: 'proficiency', category: 'weapon', id: 'battleaxe' },
        { type: 'proficiency', category: 'weapon', id: 'handaxe' },
        { type: 'proficiency', category: 'weapon', id: 'lighthammer' },
        { type: 'proficiency', category: 'weapon', id: 'warhammer' },
      ])
    );
    expect(weapons).toHaveLength(4);
  });

  it('grants tool proficiency choice from artisan tools', () => {
    const toolChoice = source?.grants.find((g) => g.type === 'proficiency-choice');
    expect(toolChoice).toEqual({
      type: 'proficiency-choice',
      category: 'tool',
      key: createChoiceKey('tool-choice', 'race', 'dwarf-mountain', 0),
      count: 1,
      from: ['smithstools', 'brewersupplies', 'masonstools'],
    });
  });

  it('grants darkvision, dwarven resilience, and stonecunning features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(3);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(
      expect.arrayContaining(['dwarf-darkvision', 'dwarf-dwarven-resilience', 'dwarf-stonecunning'])
    );
  });

  it('grants poison resistance', () => {
    const resistance = source?.grants.find((g) => g.type === 'resistance');
    expect(resistance).toEqual({ type: 'resistance', damageType: 'poison' });
  });
});

describe('Lightfoot Halfling race source', () => {
  const source = getRaceSource('halfling-lightfoot' as RaceId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('small');
    expect(source?.defaultSpeed).toBe(25);
  });

  it('grants +2 DEX and +1 CHA', () => {
    const abilityBonuses = source?.grants.filter((g) => g.type === 'ability-bonus');
    expect(abilityBonuses).toEqual(
      expect.arrayContaining([
        { type: 'ability-bonus', ability: 'dex', bonus: 2 },
        { type: 'ability-bonus', ability: 'cha', bonus: 1 },
      ])
    );
    expect(abilityBonuses).toHaveLength(2);
  });

  it('grants 25 ft walk speed', () => {
    const speed = source?.grants.find((g) => g.type === 'speed');
    expect(speed).toEqual({ type: 'speed', mode: 'walk', value: 25 });
  });

  it('grants Common and Halfling languages', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(2);
    expect(languages).toEqual(
      expect.arrayContaining([
        { type: 'proficiency', category: 'language', id: 'common' },
        { type: 'proficiency', category: 'language', id: 'halfling' },
      ])
    );
  });

  it('grants no armor, weapon, or tool proficiencies', () => {
    const nonLanguageProficiencies = source?.grants.filter(
      (g) => g.type === 'proficiency' && g.category !== 'language'
    );
    expect(nonLanguageProficiencies).toHaveLength(0);
    const proficiencyChoices = source?.grants.filter((g) => g.type === 'proficiency-choice');
    expect(proficiencyChoices).toHaveLength(0);
  });

  it('grants lucky, brave, halfling nimbleness, and naturally stealthy features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(4);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(expect.arrayContaining(LIGHTFOOT_SHARED_FEATURE_IDS));
  });

  it('grants no damage resistances', () => {
    const resistance = source?.grants.find((g) => g.type === 'resistance');
    expect(resistance).toBeUndefined();
  });
});

describe('Stout Halfling race source', () => {
  const source = getRaceSource('halfling-stout' as RaceId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('small');
    expect(source?.defaultSpeed).toBe(25);
  });

  it('grants +2 DEX and +1 CON', () => {
    const abilityBonuses = source?.grants.filter((g) => g.type === 'ability-bonus');
    expect(abilityBonuses).toEqual(
      expect.arrayContaining([
        { type: 'ability-bonus', ability: 'dex', bonus: 2 },
        { type: 'ability-bonus', ability: 'con', bonus: 1 },
      ])
    );
    expect(abilityBonuses).toHaveLength(2);
  });

  it('grants 25 ft walk speed', () => {
    const speed = source?.grants.find((g) => g.type === 'speed');
    expect(speed).toEqual({ type: 'speed', mode: 'walk', value: 25 });
  });

  it('grants Common and Halfling languages', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(2);
    expect(languages).toEqual(
      expect.arrayContaining([
        { type: 'proficiency', category: 'language', id: 'common' },
        { type: 'proficiency', category: 'language', id: 'halfling' },
      ])
    );
  });

  it('grants no armor, weapon, or tool proficiencies', () => {
    const nonLanguageProficiencies = source?.grants.filter(
      (g) => g.type === 'proficiency' && g.category !== 'language'
    );
    expect(nonLanguageProficiencies).toHaveLength(0);
    const proficiencyChoices = source?.grants.filter((g) => g.type === 'proficiency-choice');
    expect(proficiencyChoices).toHaveLength(0);
  });

  it('grants lucky, brave, halfling nimbleness, and stout resilience features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(4);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(expect.arrayContaining(STOUT_SHARED_FEATURE_IDS));
  });

  it('grants poison resistance', () => {
    const resistance = source?.grants.find((g) => g.type === 'resistance');
    expect(resistance).toEqual({ type: 'resistance', damageType: 'poison' });
  });
});

describe('Half-Elf race source', () => {
  const source = getRaceSource('halfelf' as RaceId);

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants exactly one fixed ability bonus: +2 CHA', () => {
    const abilityBonuses = source?.grants.filter((g) => g.type === 'ability-bonus');
    expect(abilityBonuses).toHaveLength(1);
    expect(abilityBonuses).toEqual([{ type: 'ability-bonus', ability: 'cha', bonus: 2 }]);
  });

  it('grants one ability-choice with count 2, bonus 1, from all abilities except CHA', () => {
    const abilityChoice = source?.grants.find((g) => g.type === 'ability-choice');
    expect(abilityChoice).toEqual({
      type: 'ability-choice',
      key: createChoiceKey('ability-choice', 'race', 'halfelf', 0),
      count: 2,
      bonus: 1,
      from: ['str', 'dex', 'con', 'int', 'wis'],
    });
  });

  it('grants 30 ft walk speed', () => {
    const speed = source?.grants.find((g) => g.type === 'speed');
    expect(speed).toEqual({ type: 'speed', mode: 'walk', value: 30 });
  });

  it('grants Common and Elvish languages as fixed proficiencies', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(2);
    expect(languages).toEqual(
      expect.arrayContaining([
        { type: 'proficiency', category: 'language', id: 'common' },
        { type: 'proficiency', category: 'language', id: 'elvish' },
      ])
    );
  });

  it('grants one language-choice with count 1 and from: null (any language)', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'race', 'halfelf', 0),
      count: 1,
      from: null,
    });
  });

  it('grants one skill-choice with count 2 and from: null (any skill)', () => {
    const skillChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'skill');
    expect(skillChoice).toEqual({
      type: 'proficiency-choice',
      category: 'skill',
      key: createChoiceKey('skill-choice', 'race', 'halfelf', 0),
      count: 2,
      from: null,
    });
  });

  it('grants three features: darkvision, fey ancestry, skill versatility', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(3);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(
      expect.arrayContaining(['halfelf-darkvision', 'halfelf-fey-ancestry', 'halfelf-skill-versatility'])
    );
  });
});
