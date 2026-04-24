import { describe, it, expect } from 'vitest';
import { resolveCharacter } from '@/lib/resolver';
import type { ResolverInput } from '@/lib/resolver';
import type { AbilityKey, ClassId } from '@/lib/dnd-helpers';
import { DND_SKILLS } from '@/lib/dnd-helpers';
import { collectBundles } from '@/lib/sources';
import type { CharacterBuild, ChoiceDecision, ChoiceKey } from '@/types/choices';
import { createChoiceKey } from '@/types/choices';
import type { GrantBundle, SubclassId } from '@/types/sources';

const baseInput: ResolverInput = {
  baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  level: 0,
  bundles: [],
  choices: {},
  hpRolls: [],
};

describe('resolveCharacter', () => {
  it('collects resistance grants into resolved.resistances with source', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'race', id: 'tiefling' },
        grants: [{ type: 'resistance', damageType: 'fire' }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    expect(result.resistances).toHaveLength(1);
    expect(result.resistances[0].value).toBe('fire');
    expect(result.resistances[0].sources[0]).toEqual({ origin: 'race', id: 'tiefling' });
  });

  it('returns a valid ResolvedCharacter for empty input', () => {
    const result = resolveCharacter(baseInput);

    // All abilities have total=10, modifier=0
    const abilityKeys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    for (const key of abilityKeys) {
      expect(result.abilities[key].total).toBe(10);
      expect(result.abilities[key].modifier).toBe(0);
    }

    expect(result.proficiencyBonus).toBe(2);
    expect(result.pendingChoices).toHaveLength(0);
    expect(result.spellcasting).toBeNull();
    expect(result.hitPoints.max).toBe(0);
  });

  it.each([
    [8, -1],
    [10, 0],
    [12, 1],
    [14, 2],
    [15, 2],
    [20, 5],
  ])('calculates correct ability modifier for score %i → %i', (score, expectedModifier) => {
    const result = resolveCharacter({
      ...baseInput,
      baseAbilities: { str: score, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    });
    expect(result.abilities.str.modifier).toBe(expectedModifier);
  });

  it('returns all 6 ability keys', () => {
    const result = resolveCharacter(baseInput);
    const keys = Object.keys(result.abilities);
    expect(keys).toHaveLength(6);
    expect(keys).toContain('str');
    expect(keys).toContain('dex');
    expect(keys).toContain('con');
    expect(keys).toContain('int');
    expect(keys).toContain('wis');
    expect(keys).toContain('cha');
  });

  it.each([
    [1, 2],
    [5, 3],
  ])('proficiencyBonus at level %i is %i', (level, expectedBonus) => {
    const hitDieBundle: GrantBundle = {
      source: { origin: 'class', id: 'fighter', level: 1 },
      grants: [{ type: 'hit-die', die: 10 }],
    };
    const result = resolveCharacter({
      ...baseInput,
      level,
      bundles: [hitDieBundle],
      hpRolls: [null, ...Array(level - 1).fill(5)],
    });
    expect(result.proficiencyBonus).toBe(expectedBonus);
  });

  it('is deterministic: same input produces same output', () => {
    const result1 = resolveCharacter(baseInput);
    const result2 = resolveCharacter(baseInput);
    expect(result1.proficiencyBonus).toBe(result2.proficiencyBonus);
    expect(result1.abilities.str.total).toBe(result2.abilities.str.total);
    expect(result1.hitPoints.max).toBe(result2.hitPoints.max);
  });

  it('all skills have correct ability mapping', () => {
    const result = resolveCharacter(baseInput);
    for (const skillDef of DND_SKILLS) {
      const skill = result.skills[skillDef.id];
      expect(skill).toBeDefined();
      expect(skill.ability).toBe(skillDef.ability);
    }
  });
});

describe('Human Fighter L1 integration', () => {
  const humanFighterBuild: CharacterBuild = {
    raceId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      // Fighter skill choices (2 from list)
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      // Fighter fighting style choice
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['defense'] },
      // Human language choice
      'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      // Soldier tool choice
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      // Soldier language choice
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      // Fighter bundle choices
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-chainmail', slotPicks: {} },
      'bundle-choice:class:fighter:1': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword', shield: 'shield' },
      },
      'bundle-choice:class:fighter:2': { type: 'bundle-choice', bundleId: 'light-crossbow-kit', slotPicks: {} },
      'bundle-choice:class:fighter:3': { type: 'bundle-choice', bundleId: 'dungeoneers-pack', slotPicks: {} },
    },
    levels: [{ classId: 'fighter', classLevel: 1, hpRoll: null }],
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(humanFighterBuild);

  const input: ResolverInput = {
    baseAbilities: humanFighterBuild.baseAbilities,
    level: 1,
    bundles,
    choices: humanFighterBuild.choices,
    levels: humanFighterBuild.levels,
  };

  it('has correct ability totals with +1 human racial bonus to each', () => {
    const result = resolveCharacter(input);
    // Base + 1 human racial bonus
    expect(result.abilities.str.total).toBe(16); // 15+1
    expect(result.abilities.dex.total).toBe(14); // 13+1
    expect(result.abilities.con.total).toBe(15); // 14+1
    expect(result.abilities.int.total).toBe(9); // 8+1
    expect(result.abilities.wis.total).toBe(11); // 10+1
    expect(result.abilities.cha.total).toBe(13); // 12+1
  });

  it('has correct ability modifiers', () => {
    const result = resolveCharacter(input);
    expect(result.abilities.str.modifier).toBe(3); // (16-10)/2 = 3
    expect(result.abilities.dex.modifier).toBe(2); // (14-10)/2 = 2
    expect(result.abilities.con.modifier).toBe(2); // (15-10)/2 = 2
    expect(result.abilities.int.modifier).toBe(-1); // (9-10)/2 = -0.5 → -1
    expect(result.abilities.wis.modifier).toBe(0); // (11-10)/2 = 0.5 → 0
    expect(result.abilities.cha.modifier).toBe(1); // (13-10)/2 = 1.5 → 1
  });

  it('HP max = 10 (fighter die) + 2 (CON mod) = 12', () => {
    const result = resolveCharacter(input);
    expect(result.hitPoints.max).toBe(12);
  });

  it('AC = 10 + DEX modifier (2) + Defense style bonus (1) = 13', () => {
    const result = resolveCharacter(input);
    expect(result.armorClass.effective).toBe(13);
  });

  it('walk speed = 30', () => {
    const result = resolveCharacter(input);
    expect(result.speed.walk).toBeDefined();
    expect(result.speed.walk!.value).toBe(30);
  });

  it('proficiency bonus = 2 at level 1', () => {
    const result = resolveCharacter(input);
    expect(result.proficiencyBonus).toBe(2);
  });

  it('STR and CON saving throws are proficient', () => {
    const result = resolveCharacter(input);
    expect(result.savingThrows.str.proficient).toBe(true);
    expect(result.savingThrows.con.proficient).toBe(true);
    expect(result.savingThrows.dex.proficient).toBe(false);
    expect(result.savingThrows.int.proficient).toBe(false);
    expect(result.savingThrows.wis.proficient).toBe(false);
    expect(result.savingThrows.cha.proficient).toBe(false);
  });

  it('STR saving throw bonus = STR mod (3) + proficiency (2) = 5', () => {
    const result = resolveCharacter(input);
    expect(result.savingThrows.str.bonus).toBe(5);
  });

  it('has 2 features: chosen fighting style and Second Wind', () => {
    const result = resolveCharacter(input);
    expect(result.features).toHaveLength(2);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('fighting-style-defense');
    expect(featureIds).toContain('fighter-second-wind');
  });

  it('armor proficiencies include light, medium, heavy, shields', () => {
    const result = resolveCharacter(input);
    const armorIds = result.armorProficiencies.map((a) => a.value);
    expect(armorIds).toContain('light');
    expect(armorIds).toContain('medium');
    expect(armorIds).toContain('heavy');
    expect(armorIds).toContain('shields');
  });

  it('weapon proficiencies include simple and martial', () => {
    const result = resolveCharacter(input);
    const weaponIds = result.weaponProficiencies.map((w) => w.value);
    expect(weaponIds).toContain('simple');
    expect(weaponIds).toContain('martial');
  });

  it('selected skills (athletics, perception) are proficient', () => {
    const result = resolveCharacter(input);
    expect(result.skills.athletics.proficient).toBe(true);
    expect(result.skills.perception.proficient).toBe(true);
    // Background also grants athletics directly
    expect(result.skills.intimidation.proficient).toBe(true);
  });

  it('unselected skills are not proficient', () => {
    const result = resolveCharacter(input);
    expect(result.skills.acrobatics.proficient).toBe(false);
    expect(result.skills.arcana.proficient).toBe(false);
  });

  it('languages include common and chosen languages', () => {
    const result = resolveCharacter(input);
    const langIds = result.languages.map((l) => l.value);
    expect(langIds).toContain('common');
    expect(langIds).toContain('elvish');
    expect(langIds).toContain('dwarvish');
  });

  it('hitDie contains d10 from fighter class', () => {
    const result = resolveCharacter(input);
    expect(result.hitDie).toHaveLength(1);
    expect(result.hitDie[0].die).toBe(10);
    expect(result.hitDie[0].count).toBe(1);
  });

  it('initiative equals DEX modifier (2)', () => {
    const result = resolveCharacter(input);
    expect(result.initiative).toBe(2);
  });

  it('spellcasting is null (fighter has no spellcasting at L1)', () => {
    const result = resolveCharacter(input);
    expect(result.spellcasting).toBeNull();
  });

  it('no pending choices when all choices resolved', () => {
    const result = resolveCharacter(input);
    expect(result.pendingChoices).toHaveLength(0);
  });

  it('has pending ability-choice when no decision provided', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'ability-choice', key: 'ability-choice:race:human:0', count: 1, bonus: 1, from: null }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    const pending = result.pendingChoices.find((c) => c.type === 'ability-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe('ability-choice:race:human:0');
  });

  it('has pending ability-choice when decision is wrong type', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'ability-choice', key: 'ability-choice:race:human:0', count: 1, bonus: 1, from: null }],
      },
    ];
    // Provide a wrong-type decision for the same key
    const choices = {
      'ability-choice:race:human:0': { type: 'skill-choice' as const, skills: ['athletics'] as const },
    };
    const result = resolveCharacter({ ...baseInput, bundles, choices });
    const pending = result.pendingChoices.find((c) => c.type === 'ability-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe('ability-choice:race:human:0');
  });

  it('has pending skill choice when not resolved', () => {
    const inputWithoutSkillChoice: ResolverInput = {
      ...input,
      choices: {
        'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
        'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
        'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      },
    };
    const result = resolveCharacter(inputWithoutSkillChoice);
    const skillPending = result.pendingChoices.find((c) => c.type === 'skill-choice');
    expect(skillPending).toBeDefined();
    expect(skillPending?.choiceKey).toBe('skill-choice:class:fighter:0');
  });
});

describe('Pending ASI and Subclass choices', () => {
  const asiKey = createChoiceKey('asi', 'class', 'fighter', 0);
  const subclassKey = createChoiceKey('subclass', 'class', 'fighter', 0);

  it('emits pending ASI when no decision is provided', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [{ type: 'asi', key: asiKey, points: 2 }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    const pending = result.pendingChoices.find((c) => c.type === 'asi');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(asiKey);
    if (pending?.type === 'asi') {
      expect(pending.points).toBe(2);
    }
  });

  it('does not emit pending ASI when decision is resolved', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [{ type: 'asi', key: asiKey, points: 2 }],
      },
    ];
    const result = resolveCharacter({
      ...baseInput,
      bundles,
      choices: { [asiKey]: { type: 'asi', allocation: { str: 2 } } as const },
    });
    const pending = result.pendingChoices.find((c) => c.type === 'asi');
    expect(pending).toBeUndefined();
  });

  it('emits pending subclass when no decision is provided', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 3 },
        grants: [{ type: 'subclass', classId: 'fighter' as ClassId, key: subclassKey }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    const pending = result.pendingChoices.find((c) => c.type === 'subclass');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(subclassKey);
    if (pending?.type === 'subclass') {
      expect(pending.classId).toBe('fighter');
    }
  });

  it('does not emit pending subclass when decision is resolved', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 3 },
        grants: [{ type: 'subclass', classId: 'fighter' as ClassId, key: subclassKey }],
      },
    ];
    const result = resolveCharacter({
      ...baseInput,
      bundles,
      choices: { [subclassKey]: { type: 'subclass' as const, subclassId: 'champion' as SubclassId } },
    });
    const pending = result.pendingChoices.find((c) => c.type === 'subclass');
    expect(pending).toBeUndefined();
  });
});

describe('Human Fighter L1 equipment integration', () => {
  const humanFighterEquipBuild: CharacterBuild = {
    raceId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['dueling'] },
      'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      // Fighter bundle choices
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-chainmail', slotPicks: {} },
      'bundle-choice:class:fighter:1': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword', shield: 'shield' },
      },
      'bundle-choice:class:fighter:2': { type: 'bundle-choice', bundleId: 'light-crossbow-kit', slotPicks: {} },
      'bundle-choice:class:fighter:3': { type: 'bundle-choice', bundleId: 'dungeoneers-pack', slotPicks: {} },
    },
    levels: [{ classId: 'fighter', classLevel: 1, hpRoll: null }],
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(humanFighterEquipBuild);

  it('chain-mail equipped gives AC 16 (heavy armor, no DEX)', () => {
    const result = resolveCharacter({
      baseAbilities: humanFighterEquipBuild.baseAbilities,
      level: 1,
      bundles,
      choices: humanFighterEquipBuild.choices,
      levels: humanFighterEquipBuild.levels,
      equippedItemIds: ['chain-mail'],
    });
    expect(result.armorClass.effective).toBe(16);
  });

  it('chain-mail + longsword equipped: AC 16 and longsword attack present', () => {
    const result = resolveCharacter({
      baseAbilities: humanFighterEquipBuild.baseAbilities,
      level: 1,
      bundles,
      choices: humanFighterEquipBuild.choices,
      levels: humanFighterEquipBuild.levels,
      equippedItemIds: ['chain-mail', 'longsword'],
    });
    expect(result.armorClass.effective).toBe(16);
    expect(result.attacks.length).toBeGreaterThan(0);
    expect(result.attacks.some((a) => a.weaponId === 'longsword')).toBe(true);
  });

  it('longsword attack bonus = STR mod (3) + proficiency (2) = 5', () => {
    const result = resolveCharacter({
      baseAbilities: humanFighterEquipBuild.baseAbilities,
      level: 1,
      bundles,
      choices: humanFighterEquipBuild.choices,
      levels: humanFighterEquipBuild.levels,
      equippedItemIds: ['chain-mail', 'longsword'],
    });
    const longswordAttack = result.attacks.find((a) => a.weaponId === 'longsword');
    expect(longswordAttack).toBeDefined();
    // STR 15+1(human) = 16 → mod 3, prof 2 = 5
    expect(longswordAttack!.attackBonus).toBe(5);
  });

  it('shield alone adds +2 to AC even without body armor', () => {
    const result = resolveCharacter({
      baseAbilities: humanFighterEquipBuild.baseAbilities,
      level: 1,
      bundles,
      choices: humanFighterEquipBuild.choices,
      levels: humanFighterEquipBuild.levels,
      equippedItemIds: ['shield'],
    });
    // Unequipped armor → base 10 + DEX mod 2 = 12, plus shield +2 = 14
    expect(result.armorClass.effective).toBe(14);
    expect(result.armorClass.bonuses.some((b) => b.value === 2)).toBe(true);
  });
});

describe('Human Fighter L5 integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'fighter', 0);
  const asiKey = createChoiceKey('asi', 'class', 'fighter', 0);

  const fighterL5Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'fighter' as ClassId, classLevel: 2, hpRoll: 8 },
      { classId: 'fighter' as ClassId, classLevel: 3, hpRoll: 7 },
      { classId: 'fighter' as ClassId, classLevel: 4, hpRoll: 6 },
      { classId: 'fighter' as ClassId, classLevel: 5, hpRoll: 9 },
    ],
    choices: {
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['defense'] },
      'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'champion' as SubclassId },
      [asiKey]: { type: 'asi' as const, allocation: { str: 2 } },
      // Fighter bundle choices
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-chainmail', slotPicks: {} },
      'bundle-choice:class:fighter:1': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword', shield: 'shield' },
      },
      'bundle-choice:class:fighter:2': { type: 'bundle-choice', bundleId: 'light-crossbow-kit', slotPicks: {} },
      'bundle-choice:class:fighter:3': { type: 'bundle-choice', bundleId: 'dungeoneers-pack', slotPicks: {} },
    },
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(fighterL5Build);

  const input: ResolverInput = {
    baseAbilities: fighterL5Build.baseAbilities,
    level: 5,
    bundles,
    choices: fighterL5Build.choices,
    levels: fighterL5Build.levels,
  };

  it('proficiency bonus = 3 at level 5', () => {
    const result = resolveCharacter(input);
    expect(result.proficiencyBonus).toBe(3);
  });

  it('applies ASI +2 STR on top of base + human bonus', () => {
    const result = resolveCharacter(input);
    // base 15 + human +1 + ASI +2 = 18
    expect(result.abilities.str.total).toBe(18);
  });

  it('has fighter-action-surge feature (level 2)', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('fighter-action-surge');
  });

  it('has fighter-extra-attack feature (level 5)', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('fighter-extra-attack');
  });

  it('has champion-improved-critical feature (subclass level 3)', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('champion-improved-critical');
  });

  it('no pending choices when all choices are resolved', () => {
    const result = resolveCharacter(input);
    expect(result.pendingChoices).toHaveLength(0);
  });

  it('has pending ASI and subclass when those choices are missing', () => {
    const incompleteChoices = {
      'skill-choice:class:fighter:0': { type: 'skill-choice' as const, skills: ['athletics', 'perception'] as const },
      'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
      'tool-choice:background:soldier:0': { type: 'tool-choice' as const, tools: ['gaming-set-dice'] as const },
      'language-choice:background:soldier:0': { type: 'language-choice' as const, languages: ['dwarvish'] as const },
    };
    const result = resolveCharacter({ ...input, choices: incompleteChoices });
    const pendingTypes = result.pendingChoices.map((c) => c.type);
    expect(pendingTypes).toContain('asi');
    expect(pendingTypes).toContain('subclass');
  });
});

describe('Rogue L1 integration', () => {
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);

  const rogueL1Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {
      'skill-choice:class:rogue:0': {
        type: 'skill-choice' as const,
        skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
      },
      [expertiseKey0]: {
        type: 'expertise-choice' as const,
        skills: ['stealth', 'sleightofhand'] as const,
        tools: [] as const,
      },
      'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(rogueL1Build);
  const input: ResolverInput = {
    baseAbilities: rogueL1Build.baseAbilities,
    level: 1,
    bundles,
    choices: rogueL1Build.choices,
    levels: rogueL1Build.levels,
  };

  it('chosen skills with expertise have doubled proficiency bonus', () => {
    const result = resolveCharacter(input);
    // DEX 16+1(human)=17 → mod 3, prof 2, expertise 2 → stealth = 3+2+2 = 7
    expect(result.skills.stealth.proficient).toBe(true);
    expect(result.skills.stealth.expertise).toBe(true);
    expect(result.skills.stealth.bonus).toBe(7);
  });

  it('proficient skill without expertise has single proficiency bonus', () => {
    const result = resolveCharacter(input);
    // Perception is WIS-based: WIS 10+1(human)=11 → mod 0, prof 2 → bonus = 2
    expect(result.skills.perception.proficient).toBe(true);
    expect(result.skills.perception.expertise).toBe(false);
    expect(result.skills.perception.bonus).toBe(2);
  });

  it('has sneak attack and thieves cant features', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('rogue-sneak-attack');
    expect(featureIds).toContain('rogue-thieves-cant');
  });

  it('toolExpertise is empty when no tool expertise chosen', () => {
    const result = resolveCharacter(input);
    expect(result.toolExpertise).toHaveLength(0);
  });

  it('toolExpertise contains tool when tool expertise chosen', () => {
    const inputWithToolExpertise: ResolverInput = {
      ...input,
      choices: {
        ...rogueL1Build.choices,
        [expertiseKey0]: {
          type: 'expertise-choice' as const,
          skills: ['stealth'] as const,
          tools: ['thievestools'] as const,
        },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const result = resolveCharacter(inputWithToolExpertise);
    expect(result.toolExpertise).toContain('thievestools');
  });

  it('expertise choice without decision generates pending choice', () => {
    const inputNoExpertiseDecision: ResolverInput = {
      ...input,
      choices: {
        'skill-choice:class:rogue:0': {
          type: 'skill-choice',
          skills: ['stealth', 'deception', 'perception', 'sleightofhand'],
        },
        'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      },
    };
    const result = resolveCharacter(inputNoExpertiseDecision);
    const pending = result.pendingChoices.find((c) => c.type === 'expertise-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(expertiseKey0);
  });
});

describe('Rogue L3 + Thief subclass integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'rogue', 0);
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);

  const rogueL3Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'rogue' as ClassId, classLevel: 2, hpRoll: 5 },
      { classId: 'rogue' as ClassId, classLevel: 3, hpRoll: 5 },
    ],
    choices: {
      'skill-choice:class:rogue:0': {
        type: 'skill-choice' as const,
        skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
      },
      [expertiseKey0]: {
        type: 'expertise-choice' as const,
        skills: ['stealth', 'sleightofhand'] as const,
        tools: [] as const,
      },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'thief' as SubclassId },
      'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(rogueL3Build);
  const input: ResolverInput = {
    baseAbilities: rogueL3Build.baseAbilities,
    level: 3,
    bundles,
    choices: rogueL3Build.choices,
    levels: rogueL3Build.levels,
  };

  it('has thief subclass features at L3', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('thief-fast-hands');
    expect(featureIds).toContain('thief-second-story-work');
  });

  it('has pending subclass choice when subclass not decided', () => {
    const inputNoSubclass: ResolverInput = {
      ...input,
      choices: {
        'skill-choice:class:rogue:0': {
          type: 'skill-choice' as const,
          skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
        },
        [expertiseKey0]: {
          type: 'expertise-choice' as const,
          skills: ['stealth', 'sleightofhand'] as const,
          tools: [] as const,
        },
        'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const result = resolveCharacter(inputNoSubclass);
    const pending = result.pendingChoices.find((c) => c.type === 'subclass');
    expect(pending).toBeDefined();
    if (pending?.type === 'subclass') {
      expect(pending.classId).toBe('rogue');
    }
  });
});

describe('Rogue L1 expertise-choice combined decision', () => {
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);

  const rogueL1Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {
      'skill-choice:class:rogue:0': {
        type: 'skill-choice' as const,
        skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
      },
      [expertiseKey0]: {
        type: 'expertise-choice' as const,
        skills: ['stealth'] as const,
        tools: ['thievestools'] as const,
      },
      'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(rogueL1Build);
  const input: ResolverInput = {
    baseAbilities: rogueL1Build.baseAbilities,
    level: 1,
    bundles,
    choices: rogueL1Build.choices,
    levels: rogueL1Build.levels,
  };

  it('combined decision grants skill expertise and tool expertise in the same build', () => {
    const result = resolveCharacter(input);
    expect(result.skills.stealth.expertise).toBe(true);
    expect(result.toolExpertise).toContain('thievestools');
  });

  it('pending expertise-choice carries fromTools when no decision provided', () => {
    const inputNoDecision: ResolverInput = {
      ...input,
      choices: {
        'skill-choice:class:rogue:0': {
          type: 'skill-choice' as const,
          skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
        },
        'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const result = resolveCharacter(inputNoDecision);
    const pending = result.pendingChoices.find((c) => c.type === 'expertise-choice');
    expect(pending).toBeDefined();
    if (pending?.type === 'expertise-choice') {
      expect(pending.fromTools).toContain('thievestools');
    }
  });
});

describe('Rogue L6 second expertise-choice', () => {
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);
  const expertiseKey1 = createChoiceKey('expertise-choice', 'class', 'rogue', 1);
  const subclassKey = createChoiceKey('subclass', 'class', 'rogue', 0);

  const rogueL6Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'rogue' as ClassId, classLevel: 2, hpRoll: 5 },
      { classId: 'rogue' as ClassId, classLevel: 3, hpRoll: 5 },
      { classId: 'rogue' as ClassId, classLevel: 4, hpRoll: 5 },
      { classId: 'rogue' as ClassId, classLevel: 5, hpRoll: 5 },
      { classId: 'rogue' as ClassId, classLevel: 6, hpRoll: 5 },
    ],
    choices: {
      'skill-choice:class:rogue:0': {
        type: 'skill-choice' as const,
        skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
      },
      [expertiseKey0]: {
        type: 'expertise-choice' as const,
        skills: ['stealth', 'sleightofhand'] as const,
        tools: [] as const,
      },
      [expertiseKey1]: {
        type: 'expertise-choice' as const,
        skills: ['deception', 'perception'] as const,
        tools: [] as const,
      },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'thief' as SubclassId },
      'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(rogueL6Build);
  const input: ResolverInput = {
    baseAbilities: rogueL6Build.baseAbilities,
    level: 6,
    bundles,
    choices: rogueL6Build.choices,
    levels: rogueL6Build.levels,
  };

  it('L6 second expertise-choice resolves independently from L1', () => {
    const result = resolveCharacter(input);
    // L1 expertise
    expect(result.skills.stealth.expertise).toBe(true);
    expect(result.skills.sleightofhand.expertise).toBe(true);
    // L6 expertise
    expect(result.skills.deception.expertise).toBe(true);
    expect(result.skills.perception.expertise).toBe(true);
  });

  it('generates pending choice for L6 expertise when only L1 is resolved', () => {
    const inputPartial: ResolverInput = {
      ...input,
      choices: {
        'skill-choice:class:rogue:0': {
          type: 'skill-choice' as const,
          skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
        },
        [expertiseKey0]: {
          type: 'expertise-choice' as const,
          skills: ['stealth', 'sleightofhand'] as const,
          tools: [] as const,
        },
        [subclassKey]: { type: 'subclass' as const, subclassId: 'thief' as SubclassId },
        'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const result = resolveCharacter(inputPartial);
    const pendingExpertise = result.pendingChoices.filter((c) => c.type === 'expertise-choice');
    expect(pendingExpertise).toHaveLength(1);
    expect(pendingExpertise[0].choiceKey).toBe(expertiseKey1);
  });
});

describe('Rogue L3 + Assassin subclass integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'rogue', 0);
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);

  const rogueL3AssassinBuild: CharacterBuild = {
    raceId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'rogue' as ClassId, classLevel: 2, hpRoll: 5 },
      { classId: 'rogue' as ClassId, classLevel: 3, hpRoll: 5 },
    ],
    choices: {
      'skill-choice:class:rogue:0': {
        type: 'skill-choice' as const,
        skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
      },
      [expertiseKey0]: {
        type: 'expertise-choice' as const,
        skills: ['stealth', 'sleightofhand'] as const,
        tools: [] as const,
      },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'assassin' as SubclassId },
      'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(rogueL3AssassinBuild);
  const input: ResolverInput = {
    baseAbilities: rogueL3AssassinBuild.baseAbilities,
    level: 3,
    bundles,
    choices: rogueL3AssassinBuild.choices,
    levels: rogueL3AssassinBuild.levels,
  };

  it('has assassin subclass features at L3', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('assassin-assassinate');
  });

  it('grants disguisekit and poisonerskit tool proficiencies', () => {
    const result = resolveCharacter(input);
    const toolIds = result.toolProficiencies.map((t) => t.value);
    expect(toolIds).toContain('disguisekit');
    expect(toolIds).toContain('poisonerskit');
  });
});

describe('Rogue L3 + Arcane Trickster subclass integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'rogue', 0);
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);

  const rogueL3ArcaneBuild: CharacterBuild = {
    raceId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'rogue' as ClassId, classLevel: 2, hpRoll: 5 },
      { classId: 'rogue' as ClassId, classLevel: 3, hpRoll: 5 },
    ],
    choices: {
      'skill-choice:class:rogue:0': {
        type: 'skill-choice' as const,
        skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
      },
      [expertiseKey0]: {
        type: 'expertise-choice' as const,
        skills: ['stealth', 'sleightofhand'] as const,
        tools: [] as const,
      },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'arcanetrickster' as SubclassId },
      'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(rogueL3ArcaneBuild);
  const input: ResolverInput = {
    baseAbilities: rogueL3ArcaneBuild.baseAbilities,
    level: 3,
    bundles,
    choices: rogueL3ArcaneBuild.choices,
    levels: rogueL3ArcaneBuild.levels,
  };

  it('has Mage Hand Legerdemain feature at L3', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('arcanetrickster-mage-hand-legerdemain');
  });

  it('spellcasting grant is present in resolved bundles', () => {
    const { bundles } = collectBundles(rogueL3ArcaneBuild);
    const spellcastingGrants = bundles.flatMap((b) => b.grants.filter((g) => g.type === 'spellcasting'));
    expect(spellcastingGrants).toHaveLength(1);
    const grant = spellcastingGrants[0];
    if (grant.type === 'spellcasting') {
      expect(grant.ability).toBe('int');
    }
  });
});

describe('expertise-choice count and validity validation', () => {
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);

  const baseRogueL1Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {
      'skill-choice:class:rogue:0': {
        type: 'skill-choice' as const,
        skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
      },
      'language-choice:race:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  it('count-underfilled decision emits pending expertise-choice', () => {
    // Only 1 skill selected for a count-2 grant → should still be pending
    const build: CharacterBuild = {
      ...baseRogueL1Build,
      choices: {
        ...baseRogueL1Build.choices,
        [expertiseKey0]: {
          type: 'expertise-choice' as const,
          skills: ['stealth'] as const,
          tools: [] as const,
        },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const { bundles } = collectBundles(build);
    const input: ResolverInput = {
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
      levels: build.levels,
    };
    const result = resolveCharacter(input);
    const pending = result.pendingChoices.find((c) => c.type === 'expertise-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(expertiseKey0);
  });

  it('non-proficient skill in decision emits pending and does not apply expertise', () => {
    // Rogue has no arcana proficiency → arcana pick is invalid
    const build: CharacterBuild = {
      ...baseRogueL1Build,
      choices: {
        ...baseRogueL1Build.choices,
        [expertiseKey0]: {
          type: 'expertise-choice' as const,
          skills: ['arcana', 'stealth'] as const,
          tools: [] as const,
        },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const { bundles } = collectBundles(build);
    const input: ResolverInput = {
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
      levels: build.levels,
    };
    const result = resolveCharacter(input);
    // arcana is not proficient so the decision has only 1 valid pick (stealth) for count 2 → pending
    const pending = result.pendingChoices.find((c) => c.type === 'expertise-choice');
    expect(pending).toBeDefined();
    // arcana must not gain expertise even though it appears in the decision
    expect(result.skills.arcana.expertise).toBe(false);
  });

  it('tool outside fromTools pool is filtered and emits pending', () => {
    // herbalism-kit is not in rogue's fromTools (thievestools only)
    const build: CharacterBuild = {
      ...baseRogueL1Build,
      choices: {
        ...baseRogueL1Build.choices,
        [expertiseKey0]: {
          type: 'expertise-choice' as const,
          skills: [] as const,
          tools: ['herbalism-kit'] as const,
        },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const { bundles } = collectBundles(build);
    const input: ResolverInput = {
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
      levels: build.levels,
    };
    const result = resolveCharacter(input);
    // herbalism-kit is not in fromTools → filtered out → valid count is 0 < 2 → pending
    const pending = result.pendingChoices.find((c) => c.type === 'expertise-choice');
    expect(pending).toBeDefined();
    expect(result.toolExpertise).not.toContain('herbalism-kit');
  });

  it('valid full decision (2 proficient skills) resolves cleanly with no pending choice', () => {
    // stealth and sleightofhand are both rogue proficiencies → count 2 satisfied
    const build: CharacterBuild = {
      ...baseRogueL1Build,
      choices: {
        ...baseRogueL1Build.choices,
        [expertiseKey0]: {
          type: 'expertise-choice' as const,
          skills: ['stealth', 'sleightofhand'] as const,
          tools: [] as const,
        },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const { bundles } = collectBundles(build);
    const input: ResolverInput = {
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
      levels: build.levels,
    };
    const result = resolveCharacter(input);
    const pending = result.pendingChoices.find((c) => c.type === 'expertise-choice');
    expect(pending).toBeUndefined();
    expect(result.skills.stealth.expertise).toBe(true);
    expect(result.skills.sleightofhand.expertise).toBe(true);
  });
});
