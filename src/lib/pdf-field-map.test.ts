import { describe, it, expect } from 'vitest';
import { buildFieldValues, characterDisplayName, signed, PDF_SKILLS, PDF_ABILITIES } from '@/lib/pdf-field-map';
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
  it('maps name, separate class/level, species, background, alignment, size (2024 sheet)', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter({ size: 'medium' }));
    // The in-sheet name field is just the character name (no player-name field on the 2024 sheet).
    expect(text.characterName).toBe('Aragorn');
    expect(text.class).toBe('Fighter');
    expect(text.level).toBe('5');
    expect(text.species).toBe('Human');
    expect(text.background).toBe('Soldier');
    expect(text.alignment).toBe('Lawful Good');
    expect(text.size).toBe('M'); // single-letter abbreviation on the 2024 sheet
    // No subclass on the base fixture, and the 2024 sheet has no player-name field.
    expect(text.subclass).toBeUndefined();
    expect(text.playerName).toBeUndefined();
  });

  it('emits the subclass in its own field when present', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter({ subclass: 'champion' }));
    expect(text.subclass).toBe('Champion');
  });

  it('keeps the in-sheet name field as just the character name', () => {
    const pc = buildFieldValues(makeResolved(), makeCharacter({ player_name: 'Viggo' }));
    expect(pc.text.characterName).toBe('Aragorn');
  });
});

describe('characterDisplayName (download filename)', () => {
  it('folds player into the name for a PC, e.g. "Sebastian (Sebastian)"', () => {
    expect(characterDisplayName(makeCharacter({ name: 'Sebastian', player_name: 'Sebastian' }))).toBe(
      'Sebastian (Sebastian)'
    );
    expect(characterDisplayName(makeCharacter({ player_name: 'Viggo' }))).toBe('Aragorn (Viggo)');
  });

  it('uses just the name for an NPC or a player-less PC', () => {
    expect(characterDisplayName(makeCharacter({ character_type: 'npc', player_name: 'Ignored' }))).toBe('Aragorn');
    expect(characterDisplayName(makeCharacter({ player_name: null }))).toBe('Aragorn');
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
    expect(text.currentHp).toBe('44'); // freshly-built character starts at full
    expect(text.hitDiceMax).toBe('5d10'); // fixture: 5× d10
    expect(text.profBonus).toBe('+3');
    expect(text.passivePerception).toBe('14'); // 10 + 4
  });

  it('omits hit-dice max when the build has no hit dice', () => {
    const { text } = buildFieldValues(makeResolved({ hitDie: [] }), makeCharacter());
    expect(text.hitDiceMax).toBeUndefined();
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

describe('buildFieldValues — features split (2024 sections)', () => {
  it('splits features into class features, species traits and feats by grant origin', () => {
    const resolved = makeResolved({
      features: [
        { feature: { id: 'second-wind', name: 'Second Wind' }, source: { origin: 'class', id: 'fighter', level: 1 } },
        { feature: { id: 'darkvision', name: 'Darkvision' }, source: { origin: 'species', id: 'elf', level: 0 } },
        { feature: { id: 'alert', name: 'Alert' }, source: { origin: 'feat', id: 'alert', level: 0 } },
      ] as ResolvedCharacter['features'],
      weaponMasteries: [{ weaponId: 'longsword', masteryId: 'sap' }],
    });
    const character = makeCharacter({ heroic_inspiration: true, exhaustion_level: 2 });
    const { text, checks } = buildFieldValues(resolved, character);
    // Class section gets class/subclass features plus the no-dedicated-field extras.
    expect(text.classFeatures).toContain('Second Wind');
    expect(text.classFeatures).toContain('Exhaustion: level 2');
    expect(text.classFeatures).toContain('Weapon Mastery: Longsword (Sap)');
    expect(text.speciesTraits).toContain('Darkvision');
    expect(text.feats).toContain('Alert');
    expect(checks.inspiration).toBe(true);
  });

  it('omits the exhaustion / mastery extras from class features when inactive', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter());
    expect(text.classFeatures).not.toContain('Exhaustion');
    expect(text.classFeatures).not.toContain('Weapon Mastery');
  });
});

describe('buildFieldValues — equipment & backstory', () => {
  it('lists equipment with quantity multipliers and merges personality + backstory', () => {
    const resolved = makeResolved({
      equipment: [equippedWeapon('longsword'), equippedWeapon('dagger', 2)],
    });
    const { text } = buildFieldValues(resolved, makeCharacter());
    expect(text.equipment).toContain('Longsword');
    expect(text.equipment).toContain('Dagger ×2');
    // The 2024 sheet has a single combined Backstory & Personality block.
    expect(text.backstory).toContain('Heir of Isildur');
    expect(text.backstory).toContain('Personality Traits: Stoic');
    expect(text.backstory).toContain('Ideals: Honor');
    expect(text.backstory).toContain('Bonds: My people');
    expect(text.backstory).toContain('Flaws: Reluctant');
  });
});

describe('buildFieldValues — 2024 proficiencies & languages', () => {
  it('renders weapon/tool/language text and armor-training checkboxes', () => {
    const sourced = <T>(value: T) => ({ value, sources: [] });
    const resolved = makeResolved({
      weaponProficiencies: [sourced('simple'), sourced('martial')] as ResolvedCharacter['weaponProficiencies'],
      toolProficiencies: [sourced('thievestools')] as ResolvedCharacter['toolProficiencies'],
      languages: [sourced('common'), sourced('elvish')] as ResolvedCharacter['languages'],
      armorProficiencies: [
        sourced('light'),
        sourced('medium'),
        sourced('shields'),
      ] as ResolvedCharacter['armorProficiencies'],
    });
    const { text, checks } = buildFieldValues(resolved, makeCharacter());
    expect(text.weaponProficienciesText).toBe('Simple, Martial');
    // Tool ids are concatenated (no separators) and this layer is i18n-free, so titleCase
    // can't reinsert spaces — display names proper come from the i18n layer elsewhere.
    expect(text.toolProficienciesText).toBe('Thievestools');
    expect(text.languages).toBe('Common, Elvish');
    expect(checks.armorLight).toBe(true);
    expect(checks.armorMedium).toBe(true);
    expect(checks.armorHeavy).toBe(false);
    expect(checks.armorShields).toBe(true);
  });
});

describe('buildFieldValues — spellcasting', () => {
  it('maps save DC, attack bonus, ability and modifier when the character casts', () => {
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
    expect(text.spellcastingModifier).toBe('+0'); // int 10 → +0
    // The 2024 sheet has no spellcasting-class field.
    expect(text.spellcastingClass).toBeUndefined();
  });

  it('omits spell fields entirely for a non-caster', () => {
    const { text } = buildFieldValues(makeResolved(), makeCharacter());
    expect(text.spellSaveDc).toBeUndefined();
    expect(text.spellAttackBonus).toBeUndefined();
  });
});
