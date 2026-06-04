import { describe, it, expect } from 'vitest';
import { buildFieldValues, signed, PDF_SKILLS, PDF_ABILITIES } from '@/lib/pdf-field-map';
import { requireItemDef } from '@/lib/sources/items';
import type { Character } from '@/types/database';
import type { AbilityKey } from '@/types/database';
import type { ResolvedAbility, ResolvedCharacter, ResolvedEquipmentItem, ResolvedSkill } from '@/types/resolved';

// --- minimal typed fixtures -------------------------------------------------

function ability(score: number): ResolvedAbility {
  return { base: score, bonuses: [], total: score, modifier: Math.floor((score - 10) / 2) };
}

function skill(abilityKey: AbilityKey, bonus: number, proficient = false): ResolvedSkill {
  return { ability: abilityKey, proficient, expertise: false, bonus, breakdown: [], sources: [] };
}

function equippedWeapon(itemId: string, quantity = 1): ResolvedEquipmentItem {
  return {
    itemId,
    itemDef: requireItemDef(itemId),
    quantity,
    source: { origin: 'loot', description: 'test' },
    equipped: true,
  };
}

const SKILL_ABILITY: Record<string, AbilityKey> = {
  acrobatics: 'dex',
  animalhandling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleightofhand: 'dex',
  stealth: 'dex',
  survival: 'wis',
};

function makeResolved(overrides: Partial<ResolvedCharacter> = {}): ResolvedCharacter {
  const abilities = {
    str: ability(16),
    dex: ability(14),
    con: ability(13),
    int: ability(10),
    wis: ability(12),
    cha: ability(8),
  };
  const skills = Object.fromEntries(
    PDF_SKILLS.map((s) => [s, skill(SKILL_ABILITY[s], 0)])
  ) as ResolvedCharacter['skills'];

  return {
    abilities,
    hitDie: [{ die: 10, count: 5 }],
    hitPoints: { max: 44 },
    speed: { walk: { value: 30, sources: [] } },
    initiative: 2,
    proficiencyBonus: 3,
    armorClass: { calculations: [], bonuses: [], effective: 18 },
    savingThrows: {
      str: { proficient: true, bonus: 6, sources: [], breakdown: [] },
      dex: { proficient: false, bonus: 2, sources: [], breakdown: [] },
      con: { proficient: true, bonus: 4, sources: [], breakdown: [] },
      int: { proficient: false, bonus: 0, sources: [], breakdown: [] },
      wis: { proficient: false, bonus: 1, sources: [], breakdown: [] },
      cha: { proficient: false, bonus: -1, sources: [], breakdown: [] },
    },
    skills,
    armorProficiencies: [],
    weaponProficiencies: [],
    toolProficiencies: [],
    languages: [],
    features: [],
    resistances: [],
    immunities: [],
    spellcasting: null,
    equipment: [],
    attacks: [],
    toolExpertise: [],
    bardicInspiration: null,
    pendingChoices: [],
    weaponMasteries: [],
    resourcePools: [],
    ...overrides,
  };
}

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'c1',
    slug: 'aragorn',
    previous_slugs: [],
    created_at: '',
    updated_at: '',
    campaign_id: 'camp1',
    name: 'Aragorn',
    player_name: 'Viggo',
    character_type: 'pc',
    species: 'human',
    class: 'fighter',
    subclass: null,
    level: 5,
    background: 'soldier',
    alignment: 'lg',
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: 44,
    armor_class: 18,
    speed: 30,
    proficiency_bonus: 3,
    personality_traits: 'Stoic',
    ideals: 'Honor',
    bonds: 'My people',
    flaws: 'Reluctant',
    appearance: 'Weathered ranger',
    backstory: 'Heir of Isildur',
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'ready',
    weapon_masteries: null,
    heroic_inspiration: false,
    exhaustion_level: 0,
    conditions: [],
    hit_dice_used: null,
    spell_slots_used: null,
    ...overrides,
  };
}

// --- tests ------------------------------------------------------------------

describe('signed', () => {
  it.each([
    [3, '+3'],
    [0, '+0'],
    [-1, '-1'],
  ])('formats %d as %s', (input, expected) => {
    expect(signed(input)).toBe(expected);
  });
});

describe('buildFieldValues — identity', () => {
  it('maps name, player, class+level, species, background, alignment as display text', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter());
    expect(text.characterName).toBe('Aragorn');
    expect(text.playerName).toBe('Viggo');
    expect(text.classLevel).toBe('Fighter 5');
    expect(text.species).toBe('Human');
    expect(text.background).toBe('Soldier');
    expect(text.alignment).toBe('Lawful Good');
  });

  it('appends subclass to class+level when present', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter({ subclass: 'champion' }));
    expect(text.classLevel).toBe('Fighter 5 (Champion)');
  });

  it('leaves player name blank for an NPC with no player', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter({ player_name: null }));
    expect(text.playerName).toBe('');
  });
});

describe('buildFieldValues — abilities & saves', () => {
  it('maps each ability score and signed modifier', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter());
    expect(text.strScore).toBe('16');
    expect(text.strMod).toBe('+3');
    expect(text.dexMod).toBe('+2');
    expect(text.chaScore).toBe('8');
    expect(text.chaMod).toBe('-1');
  });

  it('maps saving-throw bonuses (signed) and proficiency checkboxes', () => {
    const { text, checks } = buildFieldValues(makeResolved(), makeCharacter());
    expect(text.strSave).toBe('+6');
    expect(text.chaSave).toBe('-1');
    expect(checks.strSaveProf).toBe(true);
    expect(checks.conSaveProf).toBe(true);
    expect(checks.dexSaveProf).toBe(false);
  });

  it('emits a save entry for all six abilities', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter());
    for (const a of PDF_ABILITIES) {
      expect(text[`${a}Save`]).toMatch(/^[+-]\d+$/);
    }
  });
});

describe('buildFieldValues — skills', () => {
  it('maps signed skill bonuses and proficiency checkboxes', () => {
    const resolved = makeResolved({
      skills: {
        ...makeResolved().skills,
        athletics: skill('str', 6, true),
        stealth: skill('dex', 5, true),
      },
    });
    const { text, checks } = buildFieldValues(resolved, makeCharacter());
    expect(text.athletics).toBe('+6');
    expect(checks.athleticsProf).toBe(true);
    expect(text.stealth).toBe('+5');
    expect(checks.stealthProf).toBe(true);
    expect(checks.arcanaProf).toBe(false);
  });
});

describe('buildFieldValues — combat', () => {
  it('maps AC, initiative, speed, max HP, proficiency bonus and passive perception', () => {
    const resolved = makeResolved({
      skills: { ...makeResolved().skills, perception: skill('wis', 4, true) },
    });
    const { text } = buildFieldValues(resolved, makeCharacter());
    expect(text.armorClass).toBe('18');
    expect(text.initiative).toBe('+2');
    expect(text.speed).toBe('30 ft');
    expect(text.maxHp).toBe('44');
    expect(text.profBonus).toBe('+3');
    expect(text.passivePerception).toBe('14'); // 10 + 4
  });
});

describe('buildFieldValues — attacks', () => {
  it('maps up to three weapon rows with signed attack bonus and damage', () => {
    const resolved = makeResolved({
      attacks: [
        {
          weaponId: 'longsword',
          attackBonus: 6,
          attackBreakdown: [],
          damageDice: '1d8',
          damageBonus: 3,
          damageBreakdown: [],
          damageType: 'slashing',
          properties: [],
          range: 'melee',
        },
      ],
    });
    const { text } = buildFieldValues(resolved, makeCharacter());
    expect(text.atk1Name).toBe('Longsword');
    expect(text.atk1Bonus).toBe('+6');
    expect(text.atk1Damage).toBe('1d8+3 slashing');
  });

  it('omits the damage bonus segment when it is zero', () => {
    const resolved = makeResolved({
      attacks: [
        {
          weaponId: 'club',
          attackBonus: 5,
          attackBreakdown: [],
          damageDice: '1d4',
          damageBonus: 0,
          damageBreakdown: [],
          damageType: 'bludgeoning',
          properties: [],
          range: 'melee',
        },
      ],
    });
    const { text } = buildFieldValues(resolved, makeCharacter());
    expect(text.atk1Damage).toBe('1d4 bludgeoning');
  });
});

describe('buildFieldValues — features block (2024 extras)', () => {
  it('folds Heroic Inspiration, Exhaustion and Weapon Mastery into the features text', () => {
    const resolved = makeResolved({
      features: [
        { feature: { id: 'second-wind', name: 'Second Wind' }, source: { origin: 'class', id: 'fighter', level: 1 } },
      ],
      weaponMasteries: [{ weaponId: 'longsword', masteryId: 'sap' }],
    });
    const character = makeCharacter({ heroic_inspiration: true, exhaustion_level: 2 });
    const { text, checks } = buildFieldValues(resolved, character);
    expect(text.featuresTraits).toContain('Second Wind');
    expect(text.featuresTraits).toContain('Heroic Inspiration: yes');
    expect(text.featuresTraits).toContain('Exhaustion: level 2');
    expect(text.featuresTraits).toContain('Weapon Mastery: Longsword (Sap)');
    expect(checks.inspiration).toBe(true);
  });

  it('omits the 2024 extras when they are inactive', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter());
    expect(text.featuresTraits).not.toContain('Heroic Inspiration');
    expect(text.featuresTraits).not.toContain('Exhaustion');
  });
});

describe('buildFieldValues — equipment & personality', () => {
  it('lists equipment with quantity multipliers and copies personality fields', () => {
    const resolved = makeResolved({
      equipment: [equippedWeapon('longsword'), equippedWeapon('dagger', 2)],
    });
    const { text } = buildFieldValues(resolved, makeCharacter());
    expect(text.equipment).toContain('Longsword');
    expect(text.equipment).toContain('Dagger ×2');
    expect(text.personalityTraits).toBe('Stoic');
    expect(text.ideals).toBe('Honor');
    expect(text.bonds).toBe('My people');
    expect(text.flaws).toBe('Reluctant');
    expect(text.backstory).toBe('Heir of Isildur');
  });
});

describe('buildFieldValues — spellcasting', () => {
  it('maps spell save DC, attack bonus and ability when the character casts', () => {
    const resolved = makeResolved({
      spellcasting: {
        ability: 'int',
        spellSaveDC: 15,
        spellAttackBonus: 7,
        cantrips: [],
        knownSpells: [],
        alwaysPreparedSpells: [],
        slots: [4, 3, 2],
        preparedCount: 0,
        pactMagic: null,
      },
    });
    const { text } = buildFieldValues(resolved, makeCharacter({ class: 'wizard' }));
    expect(text.spellSaveDc).toBe('15');
    expect(text.spellAttackBonus).toBe('+7');
    expect(text.spellcastingAbility).toBe('Intelligence');
    expect(text.spellcastingClass).toBe('Wizard');
  });

  it('omits spell fields entirely for a non-caster', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter());
    expect(text.spellSaveDc).toBeUndefined();
    expect(text.spellAttackBonus).toBeUndefined();
  });
});
