import { describe, it, expect } from 'vitest';
import { getSpeciesSource } from '@/lib/sources';
import {
  SPECIES_SOURCES,
  DRAGONBORN_LINEAGE_GRANTS,
  DRAGONBORN_LINEAGE_DAMAGE,
  GOLIATH_ANCESTRY_GRANTS,
  TIEFLING_LINEAGE_GRANTS,
  ELF_LINEAGE_GRANTS,
  GNOME_LINEAGE_GRANTS,
  LINEAGE_GRANTS_REGISTRY,
} from '@/lib/sources/species';
import { DND_SPECIES } from '@/lib/dnd-helpers';
import { createChoiceKey } from '@/types/choices';

describe('SPECIES_SOURCES cross-reference', () => {
  it('every SpeciesId has a SPECIES_SOURCES entry', () => {
    for (const s of DND_SPECIES) {
      expect(getSpeciesSource(s.id)).toBeDefined();
    }
  });

  it('SPECIES_SOURCES has exactly 10 entries', () => {
    expect(SPECIES_SOURCES).toHaveLength(10);
  });
});

describe('Human species source (2024 PHB)', () => {
  const source = getSpeciesSource('human');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants no ability bonuses', () => {
    const abilityBonuses = source?.grants.filter((g) => g.type === 'ability-bonus');
    expect(abilityBonuses).toHaveLength(0);
  });

  it('grants 30 ft walk speed', () => {
    const speed = source?.grants.find((g) => g.type === 'speed');
    expect(speed).toEqual({ type: 'speed', mode: 'walk', value: 30 });
  });

  it('grants Common language only', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'human', 0),
      count: 2,
      from: null,
    });
  });

  it('grants one skill choice from any skill', () => {
    const skillChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'skill');
    expect(skillChoice).toEqual({
      type: 'proficiency-choice',
      category: 'skill',
      key: createChoiceKey('skill-choice', 'species', 'human', 0),
      count: 1,
      from: null,
    });
  });

  it('grants Resourceful feature', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(1);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toContain('human-resourceful');
  });
});

describe('Dwarf species source (2024 PHB)', () => {
  const source = getSpeciesSource('dwarf');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults (30 ft speed in 2024)', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants no ability bonuses', () => {
    const abilityBonuses = source?.grants.filter((g) => g.type === 'ability-bonus');
    expect(abilityBonuses).toHaveLength(0);
  });

  it('grants 30 ft walk speed', () => {
    const speed = source?.grants.find((g) => g.type === 'speed');
    expect(speed).toEqual({ type: 'speed', mode: 'walk', value: 30 });
  });

  it('grants Common language only (no locked Dwarvish in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'dwarf', 0),
      count: 2,
      from: null,
    });
  });

  it('grants no armor, weapon, or tool proficiency choices', () => {
    const nonLanguageProficiencies = source?.grants.filter(
      (g) => g.type === 'proficiency' && g.category !== 'language' && g.category !== 'skill'
    );
    expect(nonLanguageProficiencies).toHaveLength(0);
    const nonLanguageChoices = source?.grants.filter(
      (g) => g.type === 'proficiency-choice' && g.category !== 'language'
    );
    expect(nonLanguageChoices).toHaveLength(0);
  });

  it('grants darkvision, dwarven-resilience, stonecunning, dwarven-toughness features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(4);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(
      expect.arrayContaining([
        'dwarf-darkvision',
        'dwarf-dwarven-resilience',
        'dwarf-stonecunning',
        'dwarf-dwarven-toughness',
      ])
    );
  });

  it('grants poison resistance', () => {
    const resistance = source?.grants.find((g) => g.type === 'resistance');
    expect(resistance).toEqual({ type: 'resistance', damageType: 'poison' });
  });

  it('grants +1 HP per level bonus', () => {
    const hpBonus = source?.grants.find((g) => g.type === 'hp-bonus');
    expect(hpBonus).toEqual({ type: 'hp-bonus', perLevel: 1 });
  });
});

describe('Elf species source (2024 PHB)', () => {
  const source = getSpeciesSource('elf');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants Common language only (no locked Elvish in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'elf', 0),
      count: 2,
      from: null,
    });
  });

  it('grants skill choice from Insight, Perception, or Survival', () => {
    const skillChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'skill');
    expect(skillChoice).toEqual({
      type: 'proficiency-choice',
      category: 'skill',
      key: createChoiceKey('skill-choice', 'species', 'elf', 0),
      count: 1,
      from: ['insight', 'perception', 'survival'],
    });
  });

  it('grants darkvision, fey-ancestry, and trance features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(3);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(expect.arrayContaining(['elf-darkvision', 'elf-fey-ancestry', 'elf-trance']));
  });

  it('grants lineage choice from Drow, High Elf, Wood Elf', () => {
    const lineageGrant = source?.grants.find((g) => g.type === 'lineage-choice');
    expect(lineageGrant).toEqual({
      type: 'lineage-choice',
      key: createChoiceKey('lineage-choice', 'species', 'elf', 0),
      speciesId: 'elf',
      from: ['drow', 'high-elf', 'wood-elf'],
    });
  });
});

describe('Gnome species source (2024 PHB)', () => {
  const source = getSpeciesSource('gnome');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults (30 ft speed in 2024, small size)', () => {
    expect(source?.defaultSize).toBe('small');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants Common language only (no locked Gnomish in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'gnome', 0),
      count: 2,
      from: null,
    });
  });

  it('grants darkvision and gnomish-cunning features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(2);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(expect.arrayContaining(['gnome-darkvision', 'gnome-gnomish-cunning']));
  });

  it('grants lineage choice from Forest and Rock', () => {
    const lineageGrant = source?.grants.find((g) => g.type === 'lineage-choice');
    expect(lineageGrant).toEqual({
      type: 'lineage-choice',
      key: createChoiceKey('lineage-choice', 'species', 'gnome', 0),
      speciesId: 'gnome',
      from: ['forest', 'rock'],
    });
  });
});

describe('Halfling species source (2024 PHB)', () => {
  const source = getSpeciesSource('halfling');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults (30 ft speed in 2024, small size)', () => {
    expect(source?.defaultSize).toBe('small');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants no ability bonuses', () => {
    const abilityBonuses = source?.grants.filter((g) => g.type === 'ability-bonus');
    expect(abilityBonuses).toHaveLength(0);
  });

  it('grants 30 ft walk speed', () => {
    const speed = source?.grants.find((g) => g.type === 'speed');
    expect(speed).toEqual({ type: 'speed', mode: 'walk', value: 30 });
  });

  it('grants Common only (no Halfling language in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'halfling', 0),
      count: 2,
      from: null,
    });
  });

  it('grants no armor, weapon, or tool proficiency choices', () => {
    const nonLanguageProficiencies = source?.grants.filter(
      (g) => g.type === 'proficiency' && g.category !== 'language'
    );
    expect(nonLanguageProficiencies).toHaveLength(0);
    const nonLanguageChoices = source?.grants.filter(
      (g) => g.type === 'proficiency-choice' && g.category !== 'language'
    );
    expect(nonLanguageChoices).toHaveLength(0);
  });

  it('grants brave, halfling-nimbleness, lucky, and naturally-stealthy features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(4);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(
      expect.arrayContaining([
        'halfling-brave',
        'halfling-halfling-nimbleness',
        'halfling-lucky',
        'halfling-naturally-stealthy',
      ])
    );
  });

  it('grants no damage resistances', () => {
    const resistance = source?.grants.find((g) => g.type === 'resistance');
    expect(resistance).toBeUndefined();
  });
});

describe('Aasimar species source (2024 PHB)', () => {
  const source = getSpeciesSource('aasimar');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants Common language only (no locked Celestial in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'aasimar', 0),
      count: 2,
      from: null,
    });
  });

  it('grants necrotic and radiant resistances', () => {
    const resistances = source?.grants.filter((g) => g.type === 'resistance');
    expect(resistances).toHaveLength(2);
    expect(resistances).toEqual(
      expect.arrayContaining([
        { type: 'resistance', damageType: 'necrotic' },
        { type: 'resistance', damageType: 'radiant' },
      ])
    );
  });

  it('grants the four base features ungated at level 1', () => {
    const base = [
      'aasimar-darkvision',
      'aasimar-celestial-resistance',
      'aasimar-healing-hands',
      'aasimar-light-bearer',
    ];
    for (const id of base) {
      const grant = source?.grants.find((g) => g.type === 'feature' && g.feature.id === id);
      expect(grant, `missing base feature ${id}`).toBeDefined();
      if (grant?.type === 'feature') {
        expect(grant.minCharacterLevel, `${id} should not be level-gated`).toBeUndefined();
      }
    }
  });

  // Regression for #289 + #301: Celestial Revelation grants ALL THREE transformations (chosen per
  // use, not a one-time build choice), as informational features gated to character level 3 — NOT
  // a feature-choice.
  it('does not model Celestial Revelation as a feature-choice', () => {
    const choice = source?.grants.find((g) => g.type === 'feature-choice');
    expect(choice).toBeUndefined();
  });

  it('grants all three Celestial Revelation transformations (plus overview) gated at character level 3', () => {
    const celestial = ['heavenly-wings', 'inner-radiance', 'necrotic-shroud'].map(
      (o) => `aasimar-celestial-revelation-${o}`
    );
    for (const id of [...celestial, 'aasimar-celestial-revelation']) {
      const grant = source?.grants.find((g) => g.type === 'feature' && g.feature.id === id);
      expect(grant, `missing celestial feature ${id}`).toBeDefined();
      if (grant?.type === 'feature') {
        expect(grant.minCharacterLevel, `${id} should be gated to level 3`).toBe(3);
      }
    }
  });
});

describe('Dragonborn species source (2024 PHB)', () => {
  const source = getSpeciesSource('dragonborn');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants Common language only (no locked Draconic in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'dragonborn', 0),
      count: 2,
      from: null,
    });
  });

  it('grants lineage choice from all 10 draconic lineages', () => {
    const lineageGrant = source?.grants.find((g) => g.type === 'lineage-choice');
    expect(lineageGrant).toBeDefined();
    if (lineageGrant?.type !== 'lineage-choice') return;
    expect(lineageGrant.speciesId).toBe('dragonborn');
    expect(lineageGrant.from).toHaveLength(10);
    expect(lineageGrant.from).toEqual(
      expect.arrayContaining([
        'chromatic-black',
        'chromatic-blue',
        'chromatic-green',
        'chromatic-red',
        'chromatic-white',
        'metallic-brass',
        'metallic-bronze',
        'metallic-copper',
        'metallic-gold',
        'metallic-silver',
      ])
    );
  });

  it('DRAGONBORN_LINEAGE_GRANTS has exactly 10 entries', () => {
    expect(Object.keys(DRAGONBORN_LINEAGE_GRANTS)).toHaveLength(10);
  });

  it('each dragonborn lineage grant includes a resistance and two features', () => {
    for (const [lineageId, grants] of Object.entries(DRAGONBORN_LINEAGE_GRANTS)) {
      const safeGrants = grants!;
      const resistance = safeGrants.find((g) => g.type === 'resistance');
      const features = safeGrants.filter((g) => g.type === 'feature');
      expect(resistance).toBeDefined();
      expect(features).toHaveLength(2);
      const featureIds = features.map((g) => g.type === 'feature' && g.feature.id);
      expect(featureIds).toContain(`dragonborn-breath-${lineageId}`);
    }
  });

  // #292: damage-type map used by the lineage table, derived from each lineage's resistance grant.
  it('DRAGONBORN_LINEAGE_DAMAGE maps every lineage to its 2024 PHB damage type', () => {
    expect(DRAGONBORN_LINEAGE_DAMAGE).toEqual({
      'chromatic-black': 'acid',
      'chromatic-blue': 'lightning',
      'chromatic-green': 'poison',
      'chromatic-red': 'fire',
      'chromatic-white': 'cold',
      'metallic-brass': 'fire',
      'metallic-bronze': 'lightning',
      'metallic-copper': 'acid',
      'metallic-gold': 'fire',
      'metallic-silver': 'cold',
    });
  });

  it('DRAGONBORN_LINEAGE_DAMAGE damage type matches each lineage resistance grant', () => {
    for (const [lineageId, grants] of Object.entries(DRAGONBORN_LINEAGE_GRANTS)) {
      const resistance = grants!.find((g) => g.type === 'resistance');
      const damageType = resistance?.type === 'resistance' ? resistance.damageType : undefined;
      expect(DRAGONBORN_LINEAGE_DAMAGE[lineageId]).toBe(damageType);
    }
  });

  it('all dragonborn lineages have 60 ft darkvision', () => {
    const lineages = [
      'chromatic-black',
      'chromatic-blue',
      'chromatic-green',
      'chromatic-red',
      'chromatic-white',
      'metallic-brass',
      'metallic-bronze',
      'metallic-copper',
      'metallic-gold',
      'metallic-silver',
    ];
    for (const lineageId of lineages) {
      const grants = DRAGONBORN_LINEAGE_GRANTS[lineageId]!;
      const featureIds = grants.filter((g) => g.type === 'feature').map((g) => g.type === 'feature' && g.feature.id);
      expect(featureIds).toContain('dragonborn-darkvision');
    }
  });
});

describe('Goliath species source (2024 PHB)', () => {
  const source = getSpeciesSource('goliath');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults (35 ft speed)', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(35);
  });

  it('grants 35 ft walk speed', () => {
    const speed = source?.grants.find((g) => g.type === 'speed');
    expect(speed).toEqual({ type: 'speed', mode: 'walk', value: 35 });
  });

  it('grants Common language only (no locked Giant in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'goliath', 0),
      count: 2,
      from: null,
    });
  });

  it('grants Athletics skill proficiency', () => {
    const skillProf = source?.grants.find((g) => g.type === 'proficiency' && g.category === 'skill');
    expect(skillProf).toEqual({ type: 'proficiency', category: 'skill', id: 'athletics' });
  });

  it('grants large-form and powerful-build features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(2);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(expect.arrayContaining(['goliath-large-form', 'goliath-powerful-build']));
  });

  it('grants lineage choice from all 6 giant ancestries', () => {
    const lineageGrant = source?.grants.find((g) => g.type === 'lineage-choice');
    expect(lineageGrant).toEqual({
      type: 'lineage-choice',
      key: createChoiceKey('lineage-choice', 'species', 'goliath', 0),
      speciesId: 'goliath',
      from: ['cloud', 'fire', 'frost', 'hill', 'stone', 'storm'],
    });
  });

  it('GOLIATH_ANCESTRY_GRANTS has exactly 6 entries', () => {
    expect(Object.keys(GOLIATH_ANCESTRY_GRANTS)).toHaveLength(6);
  });
});

describe('Orc species source (2024 PHB)', () => {
  const source = getSpeciesSource('orc');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants Common language only (no locked Orc in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'orc', 0),
      count: 2,
      from: null,
    });
  });

  it('grants adrenaline-rush, darkvision, powerful-build, relentless-endurance features', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(4);
    const featureIds = features?.map((g) => g.type === 'feature' && g.feature.id);
    expect(featureIds).toEqual(
      expect.arrayContaining([
        'orc-adrenaline-rush',
        'orc-darkvision',
        'orc-powerful-build',
        'orc-relentless-endurance',
      ])
    );
  });

  it('grants no damage resistances', () => {
    const resistance = source?.grants.find((g) => g.type === 'resistance');
    expect(resistance).toBeUndefined();
  });
});

describe('Tiefling species source (2024 PHB)', () => {
  const source = getSpeciesSource('tiefling');

  it('source is defined', () => {
    expect(source).toBeDefined();
  });

  it('has correct defaults', () => {
    expect(source?.defaultSize).toBe('medium');
    expect(source?.defaultSpeed).toBe(30);
  });

  it('grants Common language only (no locked Infernal in 2024)', () => {
    const languages = source?.grants.filter((g) => g.type === 'proficiency' && g.category === 'language');
    expect(languages).toHaveLength(1);
    expect(languages).toEqual([{ type: 'proficiency', category: 'language', id: 'common' }]);
  });

  it('grants two language choices from any language', () => {
    const langChoice = source?.grants.find((g) => g.type === 'proficiency-choice' && g.category === 'language');
    expect(langChoice).toEqual({
      type: 'proficiency-choice',
      category: 'language',
      key: createChoiceKey('language-choice', 'species', 'tiefling', 0),
      count: 2,
      from: null,
    });
  });

  it('grants darkvision feature', () => {
    const features = source?.grants.filter((g) => g.type === 'feature');
    expect(features).toHaveLength(1);
    expect(features?.[0]).toEqual({ type: 'feature', feature: { id: 'tiefling-darkvision' } });
  });

  it('grants lineage choice from Abyssal, Chthonic, Infernal', () => {
    const lineageGrant = source?.grants.find((g) => g.type === 'lineage-choice');
    expect(lineageGrant).toEqual({
      type: 'lineage-choice',
      key: createChoiceKey('lineage-choice', 'species', 'tiefling', 0),
      speciesId: 'tiefling',
      from: ['abyssal', 'chthonic', 'infernal'],
    });
  });

  it('TIEFLING_LINEAGE_GRANTS has exactly 3 entries', () => {
    expect(Object.keys(TIEFLING_LINEAGE_GRANTS)).toHaveLength(3);
  });

  it('each tiefling lineage grant includes a resistance and a fiendish legacy feature', () => {
    for (const [lineageId, grants] of Object.entries(TIEFLING_LINEAGE_GRANTS)) {
      const safeGrants = grants!;
      const resistance = safeGrants.find((g) => g.type === 'resistance');
      const feature = safeGrants.find((g) => g.type === 'feature');
      expect(resistance).toBeDefined();
      expect(feature).toBeDefined();
      if (feature?.type === 'feature') {
        expect(feature.feature.id).toBe(`tiefling-fiendish-legacy-${lineageId}`);
      }
    }
  });
});

describe('ELF_LINEAGE_GRANTS', () => {
  it('has exactly 3 keys', () => {
    expect(Object.keys(ELF_LINEAGE_GRANTS)).toHaveLength(3);
  });

  it('drow lineage includes a feature with id elf-drow-darkvision', () => {
    const drowGrants = ELF_LINEAGE_GRANTS['drow'];
    expect(drowGrants).toBeDefined();
    const darkvision = drowGrants?.find((g) => g.type === 'feature' && g.feature.id === 'elf-drow-darkvision');
    expect(darkvision).toBeDefined();
  });

  it('wood-elf lineage includes a speed grant of 35 ft walk', () => {
    const woodElfGrants = ELF_LINEAGE_GRANTS['wood-elf'];
    expect(woodElfGrants).toBeDefined();
    const speedGrant = woodElfGrants?.find((g) => g.type === 'speed');
    expect(speedGrant).toEqual({ type: 'speed', mode: 'walk', value: 35 });
  });
});

describe('GNOME_LINEAGE_GRANTS', () => {
  it('has exactly 2 keys', () => {
    expect(Object.keys(GNOME_LINEAGE_GRANTS)).toHaveLength(2);
  });
});

describe('LINEAGE_GRANTS_REGISTRY', () => {
  it('has exactly 5 keys', () => {
    expect(Object.keys(LINEAGE_GRANTS_REGISTRY)).toHaveLength(5);
  });
});

describe('SPECIES_SOURCES ↔ DND_SPECIES invariants', () => {
  it('DND_SPECIES.languageChoices matches the proficiency-choice language count in SPECIES_SOURCES', () => {
    for (const species of DND_SPECIES) {
      const source = getSpeciesSource(species.id);
      const languageChoiceGrant = source?.grants.find(
        (g) => g.type === 'proficiency-choice' && g.category === 'language'
      );
      const expected = species.languageChoices ?? 0;
      const actual = languageChoiceGrant?.type === 'proficiency-choice' ? languageChoiceGrant.count : 0;
      expect(actual).toBe(expected);
    }
  });
});
