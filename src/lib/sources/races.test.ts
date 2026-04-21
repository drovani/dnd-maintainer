import { describe, it, expect } from 'vitest';
import { getRaceSource } from '@/lib/sources';
import type { RaceId } from '@/lib/dnd-helpers';
import { createChoiceKey } from '@/types/choices';

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
