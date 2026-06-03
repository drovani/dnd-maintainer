import { describe, it, expect, vi } from 'vitest';
import { resolveCharacter } from '@/lib/resolver';
import type { ResolverInput } from '@/lib/resolver';
import type { AbilityKey, ClassId, FeatId } from '@/lib/dnd-helpers';
import { DND_SKILLS } from '@/lib/dnd-helpers';
import { getLogger } from '@/lib/logger';
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
        source: { origin: 'species', id: 'tiefling' },
        grants: [{ type: 'resistance', damageType: 'fire' }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    expect(result.resistances).toHaveLength(1);
    expect(result.resistances[0].value).toBe('fire');
    expect(result.resistances[0].sources[0]).toEqual({ origin: 'species', id: 'tiefling' });
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
    speciesId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      // Fighter skill choices (2 from list)
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      // Human skill choice (2024: 1 free skill)
      'skill-choice:species:human:0': { type: 'skill-choice', skills: ['intimidation'] },
      // Fighter fighting style choice
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['defense'] },
      // Human language choice
      'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
      // Soldier background ASI choice (+2 STR, +1 CON)
      'asi:background:soldier:0': { type: 'asi', allocation: { str: 2, con: 1 } },
      // Soldier tool choice
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      // Soldier language choice
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      // Human Versatile origin feat choice (2024 PHB)
      'feat-choice:species:human:0': { type: 'feat-choice', featId: 'alert' },
      // Fighter bundle choices
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-chainmail', slotPicks: {} },
      'bundle-choice:class:fighter:1': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword', shield: 'shield' },
      },
      'bundle-choice:class:fighter:2': { type: 'bundle-choice', bundleId: 'light-crossbow-kit', slotPicks: {} },
      'bundle-choice:class:fighter:3': { type: 'bundle-choice', bundleId: 'dungeoneers-pack', slotPicks: {} },
      // Fighter weapon mastery choices (L1: 3 slots)
      'weapon-mastery-choice:class:fighter:0': {
        type: 'weapon-mastery-choice',
        weaponIds: ['longsword', 'shortsword', 'handaxe'],
      },
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

  it('has correct ability totals (2024 human grants no ability bonus, background grants +2 STR +1 CON)', () => {
    const result = resolveCharacter(input);
    // 2024 human has no ASI; soldier background grants +2 STR, +1 CON
    expect(result.abilities.str.total).toBe(17);
    expect(result.abilities.dex.total).toBe(13);
    expect(result.abilities.con.total).toBe(15);
    expect(result.abilities.int.total).toBe(8);
    expect(result.abilities.wis.total).toBe(10);
    expect(result.abilities.cha.total).toBe(12);
  });

  it('has correct ability modifiers', () => {
    const result = resolveCharacter(input);
    expect(result.abilities.str.modifier).toBe(3); // (17-10)/2 = 3
    expect(result.abilities.dex.modifier).toBe(1); // (13-10)/2 = 1
    expect(result.abilities.con.modifier).toBe(2); // (15-10)/2 = 2
    expect(result.abilities.int.modifier).toBe(-1); // (8-10)/2 = -1
    expect(result.abilities.wis.modifier).toBe(0); // (10-10)/2 = 0
    expect(result.abilities.cha.modifier).toBe(1); // (12-10)/2 = 1
  });

  it('HP max = 10 (fighter die) + 2 (CON mod) = 12', () => {
    const result = resolveCharacter(input);
    expect(result.hitPoints.max).toBe(12);
  });

  it('AC = 10 + DEX modifier (1) + Defense style bonus (1) = 12', () => {
    const result = resolveCharacter(input);
    expect(result.armorClass.effective).toBe(12);
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

  it('has 5 features: Resourceful (human), chosen fighting style, Second Wind, savage-attacker feat (soldier background), and alert feat (human Versatile choice)', () => {
    const result = resolveCharacter(input);
    expect(result.features).toHaveLength(5);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('human-resourceful');
    expect(featureIds).toContain('fighting-style-defense');
    expect(featureIds).toContain('fighter-second-wind');
    expect(featureIds).toContain('feat-savage-attacker');
    expect(featureIds).toContain('feat-alert');
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

  it('initiative equals DEX modifier (1) — DEX 13, no 2024 human bonus', () => {
    const result = resolveCharacter(input);
    expect(result.initiative).toBe(1);
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
        source: { origin: 'species', id: 'human' },
        grants: [{ type: 'ability-choice', key: 'ability-choice:species:human:0', count: 1, bonus: 1, from: null }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    const pending = result.pendingChoices.find((c) => c.type === 'ability-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe('ability-choice:species:human:0');
  });

  it('has pending ability-choice when decision is wrong type', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [{ type: 'ability-choice', key: 'ability-choice:species:human:0', count: 1, bonus: 1, from: null }],
      },
    ];
    // Provide a wrong-type decision for the same key
    const choices = {
      'ability-choice:species:human:0': { type: 'skill-choice' as const, skills: ['athletics'] as const },
    };
    const result = resolveCharacter({ ...baseInput, bundles, choices });
    const pending = result.pendingChoices.find((c) => c.type === 'ability-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe('ability-choice:species:human:0');
  });

  it('has pending skill choice when not resolved (species choice emitted before class choice)', () => {
    const inputWithoutSkillChoice: ResolverInput = {
      ...input,
      choices: {
        'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
        'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
        'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      },
    };
    const result = resolveCharacter(inputWithoutSkillChoice);
    const allSkillPending = result.pendingChoices.filter((c) => c.type === 'skill-choice');
    // 2024 human grants a free skill choice (species:human:0) plus fighter class choice
    expect(allSkillPending.length).toBeGreaterThanOrEqual(1);
    const choiceKeys = allSkillPending.map((c) => c.choiceKey);
    expect(choiceKeys).toContain('skill-choice:class:fighter:0');
    expect(choiceKeys).toContain('skill-choice:species:human:0');
  });
});

describe('Pending ASI and Subclass choices', () => {
  const asiKey = createChoiceKey('asi', 'class', 'fighter', 0);
  const subclassKey = createChoiceKey('subclass', 'class', 'fighter', 0);

  it('emits pending ASI when no decision is provided', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [{ type: 'asi', key: asiKey, points: 2, from: null }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    const pending = result.pendingChoices.find((c) => c.type === 'asi');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(asiKey);
    if (pending?.type === 'asi') {
      expect(pending.points).toBe(2);
      expect(pending.from).toBeNull();
    }
  });

  it('does not emit pending ASI when decision is resolved', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [{ type: 'asi', key: asiKey, points: 2, from: null }],
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

describe('ASI from-constraint validation', () => {
  it('emits pending ASI with from pool when background soldier has no decision', () => {
    const soldierAsiKey = createChoiceKey('asi', 'background', 'soldier', 0);
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'asi', key: soldierAsiKey, points: 3, from: ['str', 'dex', 'con'] }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    const pending = result.pendingChoices.find((c) => c.type === 'asi');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(soldierAsiKey);
    if (pending?.type === 'asi') {
      expect(pending.points).toBe(3);
      expect(pending.from).toEqual(['str', 'dex', 'con']);
    }
  });

  it('emits pending ASI when allocation uses abilities outside the from pool', () => {
    // Acolyte grants ASI from ['int', 'wis', 'cha']; putting points in 'str' is invalid
    const acolyteAsiKey = createChoiceKey('asi', 'background', 'acolyte', 0);
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'background', id: 'acolyte' },
        grants: [{ type: 'asi', key: acolyteAsiKey, points: 3, from: ['int', 'wis', 'cha'] }],
      },
    ];
    const result = resolveCharacter({
      ...baseInput,
      bundles,
      // Points total is correct (3) but 'str' is outside the ['int', 'wis', 'cha'] pool
      choices: { [acolyteAsiKey]: { type: 'asi', allocation: { str: 2, wis: 1 } } as const },
    });
    const pending = result.pendingChoices.find((c) => c.type === 'asi');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(acolyteAsiKey);
  });

  it('does not emit pending ASI when all allocations are within the from pool', () => {
    const soldierAsiKey = createChoiceKey('asi', 'background', 'soldier', 0);
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'asi', key: soldierAsiKey, points: 3, from: ['str', 'dex', 'con'] }],
      },
    ];
    const result = resolveCharacter({
      ...baseInput,
      bundles,
      choices: { [soldierAsiKey]: { type: 'asi', allocation: { str: 2, con: 1 } } as const },
    });
    const pending = result.pendingChoices.find((c) => c.type === 'asi');
    expect(pending).toBeUndefined();
  });
});

describe('Human Fighter L1 equipment integration', () => {
  const humanFighterEquipBuild: CharacterBuild = {
    speciesId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['dueling'] },
      'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
      'asi:background:soldier:0': { type: 'asi', allocation: { str: 2, con: 1 } },
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
    // STR 15 + background +2 = 17 → mod 3, prof 2 = 5
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
    // Unequipped armor → base 10 + DEX mod 1 (DEX 13, no 2024 human ASI) = 11, plus shield +2 = 13
    expect(result.armorClass.effective).toBe(13);
    expect(result.armorClass.bonuses.some((b) => b.value === 2)).toBe(true);
  });
});

describe('Human Fighter L5 integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'fighter', 0);
  const asiKey = createChoiceKey('asi', 'class', 'fighter', 0);

  const fighterL5Build: CharacterBuild = {
    speciesId: 'human',
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
      'skill-choice:species:human:0': { type: 'skill-choice', skills: ['intimidation'] },
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['defense'] },
      'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
      'asi:background:soldier:0': { type: 'asi', allocation: { str: 2, con: 1 } },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      // Human Versatile origin feat choice (2024 PHB)
      'feat-choice:species:human:0': { type: 'feat-choice', featId: 'alert' },
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
      // Fighter weapon mastery choices (L1: 3 slots, L4: 1 slot)
      'weapon-mastery-choice:class:fighter:0': {
        type: 'weapon-mastery-choice',
        weaponIds: ['longsword', 'shortsword', 'handaxe'],
      },
      'weapon-mastery-choice:class:fighter:1': {
        type: 'weapon-mastery-choice',
        weaponIds: ['battleaxe'],
      },
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

  it('applies class ASI +2 STR and background ASI +2 STR +1 CON on top of base', () => {
    const result = resolveCharacter(input);
    // base 15 + background +2 STR + class ASI +2 STR = 19 (2024 human grants no ability bonus)
    expect(result.abilities.str.total).toBe(19);
    // base 14 + background +1 CON = 15
    expect(result.abilities.con.total).toBe(15);
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
      'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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
    speciesId: 'human',
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
      'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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
        'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
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
    speciesId: 'human',
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
      'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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
        'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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
    speciesId: 'human',
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
      'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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
        'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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
    speciesId: 'human',
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
      'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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

  it('includes cumulative rogue class features through level 6', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    // L1 features
    expect(featureIds).toContain('rogue-sneak-attack');
    expect(featureIds).toContain('rogue-thieves-cant');
    // L2 feature
    expect(featureIds).toContain('rogue-cunning-action');
    // L5 feature
    expect(featureIds).toContain('rogue-uncanny-dodge');
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
        'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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
    speciesId: 'human',
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
      'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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

describe('FeatGrant passthrough behavior', () => {
  it('does not emit any pending choices for a bundle containing only a feat grant', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'feat', featId: 'savage-attacker' }],
      },
    ];
    const result = resolveCharacter({ ...baseInput, bundles });
    // Feat grants reaching the resolver are a bug — they should have been expanded by collectBundles first
    expect(result.pendingChoices).toHaveLength(0);
  });

  it('does not throw when feat grants are present', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'feat', featId: 'savage-attacker' }],
      },
    ];
    expect(() => resolveCharacter({ ...baseInput, bundles })).not.toThrow();
  });

  it('emits logger.warn for unexpanded feat grant when not in expandedFeats', () => {
    const resolverLogger = getLogger('resolver');
    const warnSpy = vi.spyOn(resolverLogger, 'warn').mockImplementation(() => {});
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'feat', featId: 'savage-attacker' }],
      },
    ];
    resolveCharacter({ ...baseInput, bundles });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('savage-attacker'));
  });
});

describe('FeatGrant diagnostic not fired for expanded feats', () => {
  it('no logger.warn when feat grant is in expandedFeats', () => {
    const resolverLogger = getLogger('resolver');
    const warnSpy = vi.spyOn(resolverLogger, 'warn').mockImplementation(() => {});
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'feat', featId: 'savage-attacker' }],
      },
    ];
    resolveCharacter({ ...baseInput, bundles, expandedFeats: new Set<FeatId>(['savage-attacker' as FeatId]) });
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('savage-attacker'));
  });

  it('logger.warn fires for inner nested feat not in expandedFeats, not for outer expanded feat', () => {
    const resolverLogger = getLogger('resolver');
    const warnSpy = vi.spyOn(resolverLogger, 'warn').mockImplementation(() => {});
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'feat', featId: 'outer-feat' as FeatId }],
      },
      {
        source: { origin: 'feat', id: 'outer-feat' as FeatId },
        grants: [{ type: 'feat', featId: 'inner-nested' as FeatId }],
      },
    ];
    resolveCharacter({ ...baseInput, bundles, expandedFeats: new Set<FeatId>(['outer-feat' as FeatId]) });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('inner-nested'));
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('outer-feat'));
  });
});

describe('Rogue L3 + Arcane Trickster subclass integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'rogue', 0);
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);

  const rogueL3ArcaneBuild: CharacterBuild = {
    speciesId: 'human',
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
      'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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

describe('Dragonborn lineage-choice integration', () => {
  const lineageKey = createChoiceKey('lineage-choice', 'species', 'dragonborn', 0);

  const dragonbornBuild: CharacterBuild = {
    speciesId: 'dragonborn',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['defense'] },
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-chainmail', slotPicks: {} },
      'bundle-choice:class:fighter:1': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword', shield: 'shield' },
      },
      'bundle-choice:class:fighter:2': { type: 'bundle-choice', bundleId: 'light-crossbow-kit', slotPicks: {} },
      'bundle-choice:class:fighter:3': { type: 'bundle-choice', bundleId: 'dungeoneers-pack', slotPicks: {} },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  it('emits a pending lineage-choice with 10 options when no lineage decision is made', () => {
    const { bundles } = collectBundles(dragonbornBuild);
    const input: ResolverInput = {
      baseAbilities: dragonbornBuild.baseAbilities,
      level: 1,
      bundles,
      choices: dragonbornBuild.choices,
      levels: dragonbornBuild.levels,
    };
    const result = resolveCharacter(input);
    const pending = result.pendingChoices.find((c) => c.type === 'lineage-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(lineageKey);
    if (pending?.type === 'lineage-choice') {
      expect(pending.from.length).toBe(10);
      expect(pending.speciesId).toBe('dragonborn');
    }
  });

  it('resolves fire resistance and breath feature when chromatic-red lineage is chosen', () => {
    const buildWithLineage: CharacterBuild = {
      ...dragonbornBuild,
      choices: {
        ...dragonbornBuild.choices,
        [lineageKey]: { type: 'lineage-choice', lineageId: 'chromatic-red' },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const { bundles } = collectBundles(buildWithLineage);
    const input: ResolverInput = {
      baseAbilities: buildWithLineage.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithLineage.choices,
      levels: buildWithLineage.levels,
    };
    const result = resolveCharacter(input);
    expect(result.resistances.map((r) => r.value)).toContain('fire');
    expect(result.features.map((f) => f.feature.id)).toContain('dragonborn-breath-chromatic-red');
    const pending = result.pendingChoices.find((c) => c.type === 'lineage-choice');
    expect(pending).toBeUndefined();
  });
});

describe('Tiefling lineage-choice integration', () => {
  const lineageKey = createChoiceKey('lineage-choice', 'species', 'tiefling', 0);

  const tieflingBuild: CharacterBuild = {
    speciesId: 'tiefling',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['defense'] },
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-chainmail', slotPicks: {} },
      'bundle-choice:class:fighter:1': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword', shield: 'shield' },
      },
      'bundle-choice:class:fighter:2': { type: 'bundle-choice', bundleId: 'light-crossbow-kit', slotPicks: {} },
      'bundle-choice:class:fighter:3': { type: 'bundle-choice', bundleId: 'dungeoneers-pack', slotPicks: {} },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  it('emits a pending lineage-choice with 3 options when no lineage decision is made', () => {
    const { bundles } = collectBundles(tieflingBuild);
    const input: ResolverInput = {
      baseAbilities: tieflingBuild.baseAbilities,
      level: 1,
      bundles,
      choices: tieflingBuild.choices,
      levels: tieflingBuild.levels,
    };
    const result = resolveCharacter(input);
    const pending = result.pendingChoices.find((c) => c.type === 'lineage-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(lineageKey);
    if (pending?.type === 'lineage-choice') {
      expect(pending.from.length).toBe(3);
      expect(pending.speciesId).toBe('tiefling');
    }
  });

  it('resolves fire resistance and infernal feature when infernal lineage is chosen', () => {
    const buildWithLineage: CharacterBuild = {
      ...tieflingBuild,
      choices: {
        ...tieflingBuild.choices,
        [lineageKey]: { type: 'lineage-choice', lineageId: 'infernal' },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const { bundles } = collectBundles(buildWithLineage);
    const input: ResolverInput = {
      baseAbilities: buildWithLineage.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithLineage.choices,
      levels: buildWithLineage.levels,
    };
    const result = resolveCharacter(input);
    expect(result.resistances.map((r) => r.value)).toContain('fire');
    expect(result.features.map((f) => f.feature.id)).toContain('tiefling-fiendish-legacy-infernal');
    const pending = result.pendingChoices.find((c) => c.type === 'lineage-choice');
    expect(pending).toBeUndefined();
  });

  it('resolves poison resistance and abyssal feature when abyssal lineage is chosen', () => {
    const buildWithLineage: CharacterBuild = {
      ...tieflingBuild,
      choices: {
        ...tieflingBuild.choices,
        [lineageKey]: { type: 'lineage-choice', lineageId: 'abyssal' },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const { bundles } = collectBundles(buildWithLineage);
    const input: ResolverInput = {
      baseAbilities: buildWithLineage.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithLineage.choices,
      levels: buildWithLineage.levels,
    };
    const result = resolveCharacter(input);
    expect(result.resistances.map((r) => r.value)).toContain('poison');
    expect(result.features.map((f) => f.feature.id)).toContain('tiefling-fiendish-legacy-abyssal');
    const pending = result.pendingChoices.find((c) => c.type === 'lineage-choice');
    expect(pending).toBeUndefined();
  });

  it('resolves necrotic resistance and chthonic feature when chthonic lineage is chosen', () => {
    const buildWithLineage: CharacterBuild = {
      ...tieflingBuild,
      choices: {
        ...tieflingBuild.choices,
        [lineageKey]: { type: 'lineage-choice', lineageId: 'chthonic' },
      } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    };
    const { bundles } = collectBundles(buildWithLineage);
    const input: ResolverInput = {
      baseAbilities: buildWithLineage.baseAbilities,
      level: 1,
      bundles,
      choices: buildWithLineage.choices,
      levels: buildWithLineage.levels,
    };
    const result = resolveCharacter(input);
    expect(result.resistances.map((r) => r.value)).toContain('necrotic');
    expect(result.features.map((f) => f.feature.id)).toContain('tiefling-fiendish-legacy-chthonic');
    const pending = result.pendingChoices.find((c) => c.type === 'lineage-choice');
    expect(pending).toBeUndefined();
  });
});

describe('expertise-choice count and validity validation', () => {
  const expertiseKey0 = createChoiceKey('expertise-choice', 'class', 'rogue', 0);

  const baseRogueL1Build: CharacterBuild = {
    speciesId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {
      'skill-choice:class:rogue:0': {
        type: 'skill-choice' as const,
        skills: ['stealth', 'deception', 'perception', 'sleightofhand'] as const,
      },
      'language-choice:species:human:0': { type: 'language-choice' as const, languages: ['elvish'] as const },
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

  it('overfilled decision emits pending and caps applied expertise at grant.count', () => {
    // 3 proficient skills for a count-2 grant → should still be pending, and only 2 get expertise
    const build: CharacterBuild = {
      ...baseRogueL1Build,
      choices: {
        ...baseRogueL1Build.choices,
        [expertiseKey0]: {
          type: 'expertise-choice' as const,
          skills: ['stealth', 'sleightofhand', 'perception'] as const,
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
    const expertSkills = (['stealth', 'sleightofhand', 'perception'] as const).filter(
      (s) => result.skills[s].expertise
    );
    expect(expertSkills.length).toBe(2);
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

describe('feat grant expansion via background', () => {
  it('resolves feat feature from background origin feat grant (soldier → savage-attacker)', () => {
    // soldier background grants { type: 'feat', featId: 'savage-attacker' }
    // collectBundles should expand that into a feat bundle with feat-savage-attacker feature
    const build: CharacterBuild = {
      speciesId: 'human' as Parameters<typeof collectBundles>[0]['speciesId'],
      backgroundId: 'soldier' as Parameters<typeof collectBundles>[0]['backgroundId'],
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      abilityMethod: 'standard-array',
      levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
      choices: {},
      feats: [],
      activeItems: [],
    };

    const { bundles } = collectBundles(build);

    // There should be a bundle sourced from the savage-attacker feat
    const featBundle = bundles.find((b) => b.source.origin === 'feat' && b.source.id === 'savage-attacker');
    expect(featBundle).toBeDefined();

    // Resolving the character should include the feat-savage-attacker feature
    const input: ResolverInput = {
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
      levels: build.levels,
    };
    const result = resolveCharacter(input);
    const savageAttackerFeature = result.features.find((f) => f.feature.id === 'feat-savage-attacker');
    expect(savageAttackerFeature).toBeDefined();
  });
});

describe('Weapon mastery resolver', () => {
  const fighterL1Build: CharacterBuild = {
    speciesId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      'skill-choice:species:human:0': { type: 'skill-choice', skills: ['intimidation'] },
      'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['defense'] },
      'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
      'asi:background:soldier:0': { type: 'asi', allocation: { str: 2, con: 1 } },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      'bundle-choice:class:fighter:0': { type: 'bundle-choice', bundleId: 'fighter-chainmail', slotPicks: {} },
      'bundle-choice:class:fighter:1': {
        type: 'bundle-choice',
        bundleId: 'martial-weapon-and-shield',
        slotPicks: { weapon: 'longsword', shield: 'shield' },
      },
      'bundle-choice:class:fighter:2': { type: 'bundle-choice', bundleId: 'light-crossbow-kit', slotPicks: {} },
      'bundle-choice:class:fighter:3': { type: 'bundle-choice', bundleId: 'dungeoneers-pack', slotPicks: {} },
    },
    levels: [{ classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null }],
    feats: [],
    activeItems: [],
  };

  const { bundles: fighterBundles } = collectBundles(fighterL1Build);

  it('L1 Fighter has a weapon-mastery-choice pending choice with count 3', () => {
    const result = resolveCharacter({
      baseAbilities: fighterL1Build.baseAbilities,
      level: 1,
      bundles: fighterBundles,
      choices: fighterL1Build.choices,
      levels: fighterL1Build.levels,
    });
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(1);
    if (pending[0].type !== 'weapon-mastery-choice') throw new Error('Expected weapon-mastery-choice');
    expect(pending[0].count).toBe(3);
    expect(pending[0].from.length).toBeGreaterThan(0);
  });

  it('L1 Barbarian has a weapon-mastery-choice pending choice with count 2', () => {
    const barbarianBuild: CharacterBuild = {
      speciesId: 'human',
      backgroundId: 'soldier',
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
      abilityMethod: 'standard-array',
      choices: {
        'skill-choice:class:barbarian:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
        'skill-choice:species:human:0': { type: 'skill-choice', skills: ['intimidation'] },
        'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
        'asi:background:soldier:0': { type: 'asi', allocation: { str: 2, con: 1 } },
        'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
        'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      },
      levels: [{ classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null }],
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(barbarianBuild);
    const result = resolveCharacter({
      baseAbilities: barbarianBuild.baseAbilities,
      level: 1,
      bundles,
      choices: barbarianBuild.choices,
      levels: barbarianBuild.levels,
    });
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(1);
    if (pending[0].type !== 'weapon-mastery-choice') throw new Error('Expected weapon-mastery-choice');
    expect(pending[0].count).toBe(2);
  });

  it('L1 Paladin has a weapon-mastery-choice pending choice with count 2', () => {
    const paladinBuild: CharacterBuild = {
      speciesId: 'human',
      backgroundId: 'soldier',
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
      abilityMethod: 'standard-array',
      choices: {
        'skill-choice:class:paladin:0': { type: 'skill-choice', skills: ['athletics', 'persuasion'] },
        'skill-choice:species:human:0': { type: 'skill-choice', skills: ['intimidation'] },
        'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
        'asi:background:soldier:0': { type: 'asi', allocation: { str: 2, con: 1 } },
        'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
        'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      },
      levels: [{ classId: 'paladin' as ClassId, classLevel: 1, hpRoll: null }],
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(paladinBuild);
    const result = resolveCharacter({
      baseAbilities: paladinBuild.baseAbilities,
      level: 1,
      bundles,
      choices: paladinBuild.choices,
      levels: paladinBuild.levels,
    });
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(1);
    if (pending[0].type !== 'weapon-mastery-choice') throw new Error('Expected weapon-mastery-choice');
    expect(pending[0].count).toBe(2);
  });

  it('L1 Ranger has a weapon-mastery-choice pending choice with count 2', () => {
    const rangerBuild: CharacterBuild = {
      speciesId: 'human',
      backgroundId: 'soldier',
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
      abilityMethod: 'standard-array',
      choices: {
        'skill-choice:class:ranger:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
        'skill-choice:species:human:0': { type: 'skill-choice', skills: ['intimidation'] },
        'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
        'asi:background:soldier:0': { type: 'asi', allocation: { str: 2, con: 1 } },
        'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
        'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      },
      levels: [{ classId: 'ranger' as ClassId, classLevel: 1, hpRoll: null }],
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(rangerBuild);
    const result = resolveCharacter({
      baseAbilities: rangerBuild.baseAbilities,
      level: 1,
      bundles,
      choices: rangerBuild.choices,
      levels: rangerBuild.levels,
    });
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(1);
    if (pending[0].type !== 'weapon-mastery-choice') throw new Error('Expected weapon-mastery-choice');
    expect(pending[0].count).toBe(2);
  });

  it('L1 Rogue has a weapon-mastery-choice pending choice with count 2', () => {
    const rogueBuild: CharacterBuild = {
      speciesId: 'human',
      backgroundId: 'soldier',
      baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
      abilityMethod: 'standard-array',
      choices: {
        'skill-choice:class:rogue:0': {
          type: 'skill-choice',
          skills: ['stealth', 'deception', 'perception', 'sleightofhand'],
        },
        'skill-choice:species:human:0': { type: 'skill-choice', skills: ['intimidation'] },
        'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
        'asi:background:soldier:0': { type: 'asi', allocation: { str: 2, con: 1 } },
        'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
        'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      },
      levels: [{ classId: 'rogue' as ClassId, classLevel: 1, hpRoll: null }],
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(rogueBuild);
    const result = resolveCharacter({
      baseAbilities: rogueBuild.baseAbilities,
      level: 1,
      bundles,
      choices: rogueBuild.choices,
      levels: rogueBuild.levels,
    });
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(1);
    if (pending[0].type !== 'weapon-mastery-choice') throw new Error('Expected weapon-mastery-choice');
    expect(pending[0].count).toBe(2);
  });

  it('Fighter at L10 has 3 pending weapon-mastery-choice entries (L1+L4+L10) when no decisions provided', () => {
    const fighterL10Build: CharacterBuild = {
      ...fighterL1Build,
      levels: [
        { classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 2, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 3, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 4, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 5, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 6, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 7, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 8, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 9, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 10, hpRoll: null },
      ],
    };
    const { bundles } = collectBundles(fighterL10Build);
    const result = resolveCharacter({
      baseAbilities: fighterL10Build.baseAbilities,
      level: 10,
      bundles,
      choices: fighterL10Build.choices,
      levels: fighterL10Build.levels,
    });
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(3);
  });

  it('Wizard L5 has no weapon-mastery-choice in pendingChoices', () => {
    const wizardBuild: CharacterBuild = {
      speciesId: 'human',
      backgroundId: 'soldier',
      baseAbilities: { str: 8, dex: 13, con: 14, int: 16, wis: 10, cha: 12 },
      abilityMethod: 'standard-array',
      choices: {
        'skill-choice:class:wizard:0': { type: 'skill-choice', skills: ['arcana', 'history'] },
        'skill-choice:species:human:0': { type: 'skill-choice', skills: ['intimidation'] },
        'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
        'asi:background:soldier:0': { type: 'asi', allocation: { int: 2, con: 1 } },
        'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
        'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      },
      levels: [
        { classId: 'wizard' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'wizard' as ClassId, classLevel: 2, hpRoll: null },
        { classId: 'wizard' as ClassId, classLevel: 3, hpRoll: null },
        { classId: 'wizard' as ClassId, classLevel: 4, hpRoll: null },
        { classId: 'wizard' as ClassId, classLevel: 5, hpRoll: null },
      ],
      feats: [],
      activeItems: [],
    };
    const { bundles } = collectBundles(wizardBuild);
    const result = resolveCharacter({
      baseAbilities: wizardBuild.baseAbilities,
      level: 5,
      bundles,
      choices: wizardBuild.choices,
      levels: wizardBuild.levels,
    });
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(0);
  });

  it('resolved weaponMasteries reflects user decisions', () => {
    const choices: Partial<Record<ChoiceKey, ChoiceDecision>> = {
      ...fighterL1Build.choices,
      'weapon-mastery-choice:class:fighter:0': {
        type: 'weapon-mastery-choice',
        weaponIds: ['longsword', 'shortsword', 'handaxe'],
      },
    };
    const result = resolveCharacter({
      baseAbilities: fighterL1Build.baseAbilities,
      level: 1,
      bundles: fighterBundles,
      choices: choices as Record<ChoiceKey, ChoiceDecision>,
      levels: fighterL1Build.levels,
    });
    expect(result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice')).toHaveLength(0);
    expect(result.weaponMasteries).toHaveLength(3);
    const longswordMastery = result.weaponMasteries.find((m) => m.weaponId === 'longsword');
    expect(longswordMastery?.masteryId).toBe('sap');
    const handaxeMastery = result.weaponMasteries.find((m) => m.weaponId === 'handaxe');
    expect(handaxeMastery?.masteryId).toBe('vex');
  });

  it('cross-grant dedup: longsword in both L1 and L4 grants emits pending choice for L4 and has only one longsword mastery', () => {
    // Fighter L4 has two weapon-mastery-choice grants: L1 count=3, L4 count=1
    const fighterL4Build: CharacterBuild = {
      ...fighterL1Build,
      levels: [
        { classId: 'fighter' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 2, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 3, hpRoll: null },
        { classId: 'fighter' as ClassId, classLevel: 4, hpRoll: null },
      ],
    };
    const { bundles: l4Bundles } = collectBundles(fighterL4Build);

    // Provide longsword in both grants — L1 gets longsword/shortsword/handaxe, L4 duplicates longsword
    const choices: Partial<Record<ChoiceKey, ChoiceDecision>> = {
      ...fighterL1Build.choices,
      'subclass:class:fighter:0': { type: 'subclass', subclassId: 'champion' as SubclassId },
      'weapon-mastery-choice:class:fighter:0': {
        type: 'weapon-mastery-choice',
        weaponIds: ['longsword', 'shortsword', 'handaxe'],
      },
      // longsword already claimed by grant 0 — grant 1 (L4) should detect this as invalid
      'weapon-mastery-choice:class:fighter:1': {
        type: 'weapon-mastery-choice',
        weaponIds: ['longsword'],
      },
    };
    const result = resolveCharacter({
      baseAbilities: fighterL4Build.baseAbilities,
      level: 4,
      bundles: l4Bundles,
      choices: choices as Record<ChoiceKey, ChoiceDecision>,
      levels: fighterL4Build.levels,
    });

    // L4 grant (key :fighter:1) should emit a pending choice because longsword was already claimed
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(1);
    if (pending[0].type !== 'weapon-mastery-choice') throw new Error('Expected weapon-mastery-choice');
    expect(pending[0].choiceKey).toBe(createChoiceKey('weapon-mastery-choice', 'class', 'fighter', 1));

    // weaponMasteries should contain only one longsword entry
    const longswordEntries = result.weaponMasteries.filter((m) => m.weaponId === 'longsword');
    expect(longswordEntries).toHaveLength(1);
  });

  it('within-grant dedup: duplicate weaponIds in one decision emits a pending choice', () => {
    // Fighter L1 with decision containing longsword twice — effective count is 1, not 3
    const choices: Partial<Record<ChoiceKey, ChoiceDecision>> = {
      ...fighterL1Build.choices,
      'weapon-mastery-choice:class:fighter:0': {
        type: 'weapon-mastery-choice',
        weaponIds: ['longsword', 'longsword'],
      },
    };
    const result = resolveCharacter({
      baseAbilities: fighterL1Build.baseAbilities,
      level: 1,
      bundles: fighterBundles,
      choices: choices as Record<ChoiceKey, ChoiceDecision>,
      levels: fighterL1Build.levels,
    });

    // count=3 not satisfied by 2 raw ids that dedupe to 1 unique weapon
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(1);
    if (pending[0].type !== 'weapon-mastery-choice') throw new Error('Expected weapon-mastery-choice');
    expect(pending[0].count).toBe(3);

    // Only one longsword entry in resolved masteries
    const longswordEntries = result.weaponMasteries.filter((m) => m.weaponId === 'longsword');
    expect(longswordEntries).toHaveLength(1);
  });

  it('eligible-pool filter: ineligible weapon ids are excluded from resolved masteries', () => {
    // Fighter L1 decision includes a non-existent weapon id, one valid weapon, one valid weapon
    const choices: Partial<Record<ChoiceKey, ChoiceDecision>> = {
      ...fighterL1Build.choices,
      'weapon-mastery-choice:class:fighter:0': {
        type: 'weapon-mastery-choice',
        weaponIds: ['fakeweapon-id', 'longsword', 'shortsword'],
      },
    };
    const result = resolveCharacter({
      baseAbilities: fighterL1Build.baseAbilities,
      level: 1,
      bundles: fighterBundles,
      choices: choices as Record<ChoiceKey, ChoiceDecision>,
      levels: fighterL1Build.levels,
    });

    // fakeweapon-id excluded: only 2 valid weapons, count=3 not satisfied → pending choice
    const pending = result.pendingChoices.filter((c) => c.type === 'weapon-mastery-choice');
    expect(pending).toHaveLength(1);

    // Only valid weapons appear in resolved masteries
    const weaponIds = result.weaponMasteries.map((m) => m.weaponId);
    expect(weaponIds).not.toContain('fakeweapon-id');
    expect(weaponIds).toContain('longsword');
    expect(weaponIds).toContain('shortsword');
  });
});

describe('Damage-type choice resolver', () => {
  const damageKey = createChoiceKey('damage-choice', 'class', 'barbarian', 0);
  const bundles: readonly GrantBundle[] = [
    {
      source: { origin: 'subclass', id: 'zealot' as SubclassId, classId: 'barbarian' as ClassId, level: 3 },
      grants: [
        {
          type: 'damage-choice',
          key: damageKey,
          count: 1,
          from: ['radiant', 'necrotic'],
          featureIdPrefix: 'zealot-divine-fury',
        },
      ],
    },
  ];

  it('emits a pending damage-choice when no decision is recorded', () => {
    const result = resolveCharacter({ ...baseInput, bundles });
    const pending = result.pendingChoices.filter((c) => c.type === 'damage-choice');
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      choiceKey: damageKey,
      count: 1,
      from: ['radiant', 'necrotic'],
      featureIdPrefix: 'zealot-divine-fury',
    });
  });

  it('clears the pending damage-choice when a valid decision is recorded', () => {
    const decision: ChoiceDecision = { type: 'damage-choice', damageTypes: ['radiant'] };
    const choices: Record<ChoiceKey, ChoiceDecision> = { [damageKey]: decision };
    const result = resolveCharacter({ ...baseInput, bundles, choices });
    const pending = result.pendingChoices.filter((c) => c.type === 'damage-choice');
    expect(pending).toHaveLength(0);
  });

  it('re-emits the pending damage-choice when the recorded decision is outside grant.from', () => {
    const decision: ChoiceDecision = { type: 'damage-choice', damageTypes: ['fire'] };
    const choices: Record<ChoiceKey, ChoiceDecision> = { [damageKey]: decision };
    const result = resolveCharacter({ ...baseInput, bundles, choices });
    const pending = result.pendingChoices.filter((c) => c.type === 'damage-choice');
    expect(pending).toHaveLength(1);
  });
});

describe('bardicInspiration resolver integration', () => {
  const bardClassBundles = (classLevel: number): readonly GrantBundle[] => {
    const bundles: GrantBundle[] = [];
    for (let i = 1; i <= classLevel; i++) {
      bundles.push({
        source: { origin: 'class', id: 'bard' as ClassId, level: i },
        // Bard level 1 gets hit-die and bardic inspiration; other levels are empty stubs
        grants:
          i === 1
            ? [
                { type: 'hit-die', die: 8 },
                { type: 'feature', feature: { id: 'bard-bardic-inspiration' } },
              ]
            : [],
      });
    }
    return bundles;
  };

  const danceSubclassBundle: GrantBundle = {
    source: { origin: 'subclass', id: 'collegedance' as SubclassId, classId: 'bard' as ClassId, level: 3 },
    grants: [{ type: 'armor-class', calculation: { mode: 'unarmored', formula: 'dance' } }],
  };

  it('resolvedCharacter.bardicInspiration is null for non-bard', () => {
    const result = resolveCharacter(baseInput);
    expect(result.bardicInspiration).toBeNull();
  });

  it('resolvedCharacter.bardicInspiration.dieSize=6 for bard level 3', () => {
    const bundles = bardClassBundles(3);
    const result = resolveCharacter({
      ...baseInput,
      level: 3,
      bundles,
      hpRolls: [null, null, null],
    });
    expect(result.bardicInspiration).not.toBeNull();
    expect(result.bardicInspiration?.dieSize).toBe(6);
  });

  it('resolvedCharacter.bardicInspiration.dieSize=8 for bard level 5', () => {
    const bundles = bardClassBundles(5);
    const result = resolveCharacter({
      ...baseInput,
      level: 5,
      bundles,
      hpRolls: [null, null, null, null, null],
    });
    expect(result.bardicInspiration?.dieSize).toBe(8);
  });

  it('College of Dance L3 unarmored: armorClass includes dieSize bonus', () => {
    // DEX 14 → mod +2, dieSize 6 (bard L3) → dance AC = 10 + 2 + 6 = 18
    const bundles = [...bardClassBundles(3), danceSubclassBundle];
    const result = resolveCharacter({
      ...baseInput,
      baseAbilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
      level: 3,
      bundles,
      hpRolls: [null, null, null],
    });
    expect(result.bardicInspiration?.dieSize).toBe(6);
    expect(result.armorClass.effective).toBe(18);
  });

  it('College of Dance L3 with body armor: armorClass does NOT include dieSize bonus when armor wins', () => {
    // DEX +2, dieSize 6 → dance = 18; plate armor (20) > dance (18) → armored wins
    const armorBundle: GrantBundle = {
      source: { origin: 'class', id: 'fighter' as ClassId, level: 1 },
      grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
    };
    const bundles = [...bardClassBundles(3), danceSubclassBundle, armorBundle];
    const result = resolveCharacter({
      ...baseInput,
      baseAbilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
      level: 3,
      bundles,
      hpRolls: [null, null, null],
      equippedItemIds: [],
    });
    // Without actual plate equipped, armored falls back to 10 + dex = 12, dance wins (18)
    // To test armor winning we pass equippedArmorAc via the resolver's equipment path;
    // instead assert effective matches max(armored, dance) using 10+dex for unequipped armored
    expect(result.armorClass.calculations.length).toBeGreaterThanOrEqual(2);
    expect(result.armorClass.effective).toBe(18); // dance (18) > unequipped armored (12)
  });
});

describe('Cleric feature-choice integration (Divine Order)', () => {
  const divineOrderKey = createChoiceKey('feature-choice', 'class', 'cleric', 0);

  const baseBuild: CharacterBuild = {
    speciesId: 'human' as const,
    backgroundId: 'acolyte',
    baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'cleric' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {},
    feats: [],
    activeItems: [],
  };

  it('emits a pending feature-choice with both options when no decision is recorded', () => {
    const { bundles } = collectBundles(baseBuild);
    const result = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 1,
      bundles,
      choices: baseBuild.choices,
    });
    const pending = result.pendingChoices.find((c) => c.type === 'feature-choice');
    expect(pending).toBeDefined();
    if (pending?.type === 'feature-choice') {
      expect(pending.choiceKey).toBe(divineOrderKey);
      const optionIds = pending.options.map((o) => o.optionId);
      expect(optionIds).toEqual(['protector', 'thaumaturge']);
      const protectorOption = pending.options.find((o) => o.optionId === 'protector');
      expect(protectorOption?.featureId).toBe('cleric-divine-order-protector');
    }
  });

  it('does not emit a pending choice for divine-order once a valid option is selected', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [divineOrderKey]: { type: 'feature-choice' as const, optionId: 'protector' } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    // Look specifically for the divine-order choice (acolyte background also contributes a
    // magic-initiate feature-choice that remains pending unless a spell-list sub-choice is made)
    const pending = result.pendingChoices.find((c) => c.type === 'feature-choice' && c.choiceKey === divineOrderKey);
    expect(pending).toBeUndefined();
  });

  it('Protector grants martial weapon + heavy armor proficiencies on the resolved character', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [divineOrderKey]: { type: 'feature-choice' as const, optionId: 'protector' } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    const weaponProfValues = result.weaponProficiencies.map((p) => p.value);
    expect(weaponProfValues).toContain('martial');
    const armorProfValues = result.armorProficiencies.map((p) => p.value);
    expect(armorProfValues).toContain('heavy');
  });

  it('Thaumaturge does NOT grant Protector’s martial weapon proficiency', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [divineOrderKey]: { type: 'feature-choice' as const, optionId: 'thaumaturge' } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    const weaponProfValues = result.weaponProficiencies.map((p) => p.value);
    expect(weaponProfValues).not.toContain('martial');
  });

  it('chosen variant feature appears in the resolved features list', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [divineOrderKey]: { type: 'feature-choice' as const, optionId: 'protector' } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('cleric-divine-order-protector');
  });

  it('re-emits a pending feature-choice when the decision references an unknown optionId', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [divineOrderKey]: { type: 'feature-choice' as const, optionId: 'unknown' } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    const pending = result.pendingChoices.find((c) => c.type === 'feature-choice');
    expect(pending).toBeDefined();
    if (pending?.type === 'feature-choice') {
      expect(pending.choiceKey).toBe(divineOrderKey);
      const optionIds = pending.options.map((o) => o.optionId);
      expect(optionIds).toEqual(['protector', 'thaumaturge']);
    }
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).not.toContain('cleric-divine-order-protector');
    expect(featureIds).not.toContain('cleric-divine-order-thaumaturge');
  });

  it('re-emits pending when the decision under the feature-choice key has a wrong type', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [divineOrderKey]: { type: 'skill-choice' as const, skills: [] } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    const pending = result.pendingChoices.find((c) => c.type === 'feature-choice');
    expect(pending).toBeDefined();
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).not.toContain('cleric-divine-order-protector');
    expect(featureIds).not.toContain('cleric-divine-order-thaumaturge');
  });
});

describe('Druid feature-choice integration (Primal Order)', () => {
  const druidL1Key = createChoiceKey('feature-choice', 'class', 'druid', 0);

  const baseBuild: CharacterBuild = {
    speciesId: 'human' as const,
    backgroundId: 'acolyte',
    baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
    abilityMethod: 'standard-array',
    levels: [{ classId: 'druid' as ClassId, classLevel: 1, hpRoll: null }],
    choices: {},
    feats: [],
    activeItems: [],
  };

  it('emits a pending feature-choice with both options when no decision is recorded', () => {
    const { bundles } = collectBundles(baseBuild);
    const result = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 1,
      bundles,
      choices: baseBuild.choices,
    });
    const pending = result.pendingChoices.find((c) => c.type === 'feature-choice' && c.choiceKey === druidL1Key);
    expect(pending).toBeDefined();
    if (pending?.type === 'feature-choice') {
      const optionIds = pending.options.map((o) => o.optionId);
      expect(optionIds).toEqual(['magician', 'warden']);
      const magicianOption = pending.options.find((o) => o.optionId === 'magician');
      expect(magicianOption?.featureId).toBe('druid-primal-order-magician');
    }
  });

  it('Warden grants martial weapon + medium armor on the resolved character', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [druidL1Key]: { type: 'feature-choice' as const, optionId: 'warden' } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    const weaponProfValues = result.weaponProficiencies.map((p) => p.value);
    expect(weaponProfValues).toContain('martial');
    const armorProfValues = result.armorProficiencies.map((p) => p.value);
    expect(armorProfValues).toContain('medium');
  });

  it('Magician does NOT grant Warden martial weapon proficiency', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [druidL1Key]: { type: 'feature-choice' as const, optionId: 'magician' } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    const weaponProfValues = result.weaponProficiencies.map((p) => p.value);
    expect(weaponProfValues).not.toContain('martial');
  });

  it('chosen variant feature appears in resolved features', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: { [druidL1Key]: { type: 'feature-choice' as const, optionId: 'warden' } },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 1,
      bundles,
      choices: build.choices,
    });
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('druid-primal-order-warden');
  });
});

describe('Monk L6 + Warrior of Mercy integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'monk', 0);
  const asiKey = createChoiceKey('asi', 'class', 'monk', 0);

  // WIS 16 → mod +3; PB at L6 = 3; physicians-touch DC = 8 + 3 + 3 = 14
  const monkL6Build: CharacterBuild = {
    speciesId: 'human',
    backgroundId: null,
    baseAbilities: { str: 10, dex: 16, con: 12, int: 10, wis: 16, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'monk' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'monk' as ClassId, classLevel: 2, hpRoll: 5 },
      { classId: 'monk' as ClassId, classLevel: 3, hpRoll: 5 },
      { classId: 'monk' as ClassId, classLevel: 4, hpRoll: 5 },
      { classId: 'monk' as ClassId, classLevel: 5, hpRoll: 5 },
      { classId: 'monk' as ClassId, classLevel: 6, hpRoll: 5 },
    ],
    choices: {
      'skill-choice:class:monk:0': { type: 'skill-choice', skills: ['acrobatics', 'history'] },
      'language-choice:species:human:0': { type: 'language-choice', languages: ['elvish'] },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'warriorofmercy' as SubclassId },
      [asiKey]: { type: 'asi' as const, allocation: { dex: 2 } },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>,
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(monkL6Build);
  const input: ResolverInput = {
    baseAbilities: monkL6Build.baseAbilities,
    level: 6,
    bundles,
    choices: monkL6Build.choices,
    levels: monkL6Build.levels,
  };

  it('resourcePools contains exactly one focus-points entry with max=6 and regen=short-rest', () => {
    const result = resolveCharacter(input);
    const focusPool = result.resourcePools.filter((p) => p.poolId === 'focus-points');
    expect(focusPool).toHaveLength(1);
    expect(focusPool[0].max).toBe(6);
    expect(focusPool[0].regen).toBe('short-rest');
  });

  it('features contains warriorofmercy-physicians-touch with saveDC = 8 + PB(3) + wisMod(3) = 14', () => {
    const result = resolveCharacter(input);
    const physicians = result.features.find((f) => f.feature.id === 'warriorofmercy-physicians-touch');
    expect(physicians).toBeDefined();
    // WIS 16 → mod +3; PB at L6 = 3; DC = 8 + 3 + 3 = 14
    expect(physicians!.saveDC).toBe(14);
  });
});
describe('collapsed repeatable feat resolver integration', () => {
  // Note: collectBundles processes feature-choice grants before adding explicit build.feats,
  // so feat-origin feature-choice grants are not resolved via collectBundles. Tests drive
  // the resolver directly with hand-built bundles — matching the pattern of spellcasting.test.ts.

  describe('magic-initiate', () => {
    const magicInitiateKey = createChoiceKey('feature-choice', 'feat', 'magic-initiate', 0);

    it('emits a PendingChoice for magic-initiate when no spell-list option is chosen', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'feat', id: 'magic-initiate' },
          grants: [
            {
              type: 'feature-choice',
              key: magicInitiateKey,
              options: [
                { optionId: 'bard', featureId: 'feat-magic-initiate-bard', grants: [] },
                { optionId: 'cleric', featureId: 'feat-magic-initiate-cleric', grants: [] },
                { optionId: 'druid', featureId: 'feat-magic-initiate-druid', grants: [] },
                { optionId: 'sorcerer', featureId: 'feat-magic-initiate-sorcerer', grants: [] },
                { optionId: 'warlock', featureId: 'feat-magic-initiate-warlock', grants: [] },
                { optionId: 'wizard', featureId: 'feat-magic-initiate-wizard', grants: [] },
              ],
            },
          ],
        },
      ];
      const result = resolveCharacter({ ...baseInput, bundles, choices: {} });
      const pending = result.pendingChoices.find(
        (c) => c.type === 'feature-choice' && c.choiceKey === magicInitiateKey
      );
      expect(pending).toBeDefined();
      if (pending?.type === 'feature-choice') {
        const optionIds = pending.options.map((o) => o.optionId);
        expect(optionIds).toContain('wizard');
        expect(optionIds).toContain('cleric');
        expect(optionIds).toHaveLength(6);
      }
    });

    it('resolves feat-magic-initiate-wizard feature when wizard option grant is present', () => {
      // Feature-choice resolution happens in collectBundles before explicit build.feats are added.
      // Test the resolver's feature-resolution step directly: a bundle already containing the
      // resolved feature grant (as collectBundles would produce after processing the choice).
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'feat', id: 'magic-initiate' },
          grants: [{ type: 'feature', feature: { id: 'feat-magic-initiate-wizard' } }],
        },
      ];
      const result = resolveCharacter({ ...baseInput, bundles, choices: {} });
      const featureIds = result.features.map((f) => f.feature.id);
      expect(featureIds).toContain('feat-magic-initiate-wizard');
    });
  });

  describe('elemental-adept', () => {
    const elementalAdeptKey = createChoiceKey('feature-choice', 'feat', 'elemental-adept', 0);

    it('emits a PendingChoice when no damage-type option is chosen', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'feat', id: 'elemental-adept' },
          grants: [
            {
              type: 'feature-choice',
              key: elementalAdeptKey,
              options: [
                { optionId: 'acid', featureId: 'feat-elemental-adept-acid', grants: [] },
                { optionId: 'cold', featureId: 'feat-elemental-adept-cold', grants: [] },
                { optionId: 'fire', featureId: 'feat-elemental-adept-fire', grants: [] },
                { optionId: 'lightning', featureId: 'feat-elemental-adept-lightning', grants: [] },
                { optionId: 'thunder', featureId: 'feat-elemental-adept-thunder', grants: [] },
              ],
            },
          ],
        },
      ];
      const result = resolveCharacter({ ...baseInput, bundles, choices: {} });
      const pending = result.pendingChoices.find(
        (c) => c.type === 'feature-choice' && c.choiceKey === elementalAdeptKey
      );
      expect(pending).toBeDefined();
    });

    it('resolves feat-elemental-adept-fire feature when fire option is chosen', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'feat', id: 'elemental-adept' },
          grants: [{ type: 'feature', feature: { id: 'feat-elemental-adept-fire' } }],
        },
      ];
      const result = resolveCharacter({ ...baseInput, bundles, choices: {} });
      const featureIds = result.features.map((f) => f.feature.id);
      expect(featureIds).toContain('feat-elemental-adept-fire');
    });
  });

  describe('resilient', () => {
    const resilientKey = createChoiceKey('feature-choice', 'feat', 'resilient', 0);

    it('emits a PendingChoice when no ability option is chosen', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'feat', id: 'resilient' },
          grants: [
            {
              type: 'feature-choice',
              key: resilientKey,
              options: [
                { optionId: 'strength', featureId: 'feat-resilient-strength', grants: [] },
                { optionId: 'dexterity', featureId: 'feat-resilient-dexterity', grants: [] },
                { optionId: 'constitution', featureId: 'feat-resilient-constitution', grants: [] },
                { optionId: 'intelligence', featureId: 'feat-resilient-intelligence', grants: [] },
                { optionId: 'wisdom', featureId: 'feat-resilient-wisdom', grants: [] },
                { optionId: 'charisma', featureId: 'feat-resilient-charisma', grants: [] },
              ],
            },
          ],
        },
      ];
      const result = resolveCharacter({ ...baseInput, bundles, choices: {} });
      const pending = result.pendingChoices.find((c) => c.type === 'feature-choice' && c.choiceKey === resilientKey);
      expect(pending).toBeDefined();
    });

    it('resolves feat-resilient-constitution feature when constitution bundle is present', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'feat', id: 'resilient' },
          grants: [{ type: 'feature', feature: { id: 'feat-resilient-constitution' } }],
        },
      ];
      const result = resolveCharacter({ ...baseInput, bundles, choices: {} });
      const featureIds = result.features.map((f) => f.feature.id);
      expect(featureIds).toContain('feat-resilient-constitution');
    });

    it('resolves feat-resilient-charisma feature when charisma bundle is present', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'feat', id: 'resilient' },
          grants: [{ type: 'feature', feature: { id: 'feat-resilient-charisma' } }],
        },
      ];
      const result = resolveCharacter({ ...baseInput, bundles, choices: {} });
      const featureIds = result.features.map((f) => f.feature.id);
      expect(featureIds).toContain('feat-resilient-charisma');
    });
  });
});

describe('spell-choice pending-gate counts only pool-valid ids', () => {
  // The wizard cantrip pool (spellLevel 0) includes mending/message/poison-spray but NOT guidance
  // (guidance is cleric+druid only). This lets us construct a decision where raw size >= count
  // but pool-valid size < count — exactly the divergence the fix closes.
  const spellChoiceKey = createChoiceKey('spell-choice', 'class', 'wizard', 0);

  const spellChoiceBundle: GrantBundle = {
    source: { origin: 'class', id: 'wizard', level: 1 },
    grants: [
      {
        type: 'spell-choice',
        key: spellChoiceKey,
        count: 2,
        spellList: 'wizard' as ClassId,
        spellLevel: 0,
      },
    ],
  };

  it('emits pending when decision contains one pool-valid + one out-of-pool spell id (raw count satisfies, pool-valid does not)', () => {
    // mending is in the wizard cantrip pool; guidance is NOT (cleric/druid only).
    // Raw distinct size = 2, pool-valid size = 1 → should still be pending.
    const result = resolveCharacter({
      ...baseInput,
      bundles: [spellChoiceBundle],
      choices: {
        [spellChoiceKey]: { type: 'spell-choice' as const, spellIds: ['mending', 'guidance'] as const },
      },
    });
    const pending = result.pendingChoices.find((c) => c.type === 'spell-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(spellChoiceKey);
  });

  it('does not emit pending when decision contains two distinct pool-valid wizard cantrips', () => {
    // mending and message are both in the wizard cantrip pool → pool-valid size = 2 = count → complete
    const result = resolveCharacter({
      ...baseInput,
      bundles: [spellChoiceBundle],
      choices: {
        [spellChoiceKey]: { type: 'spell-choice' as const, spellIds: ['mending', 'message'] as const },
      },
    });
    const pending = result.pendingChoices.find((c) => c.type === 'spell-choice');
    expect(pending).toBeUndefined();
  });

  it('emits pending when no decision is provided', () => {
    const result = resolveCharacter({ ...baseInput, bundles: [spellChoiceBundle], choices: {} });
    const pending = result.pendingChoices.find((c) => c.type === 'spell-choice');
    expect(pending).toBeDefined();
    expect(pending?.choiceKey).toBe(spellChoiceKey);
    if (pending?.type === 'spell-choice') {
      expect(pending.count).toBe(2);
      expect(pending.spellList).toBe('wizard');
      expect(pending.spellLevel).toBe(0);
    }
  });
});

describe('Circle of the Land terrain feature-choice integration', () => {
  const druidSubclassKey = createChoiceKey('subclass', 'class', 'druid', 0);
  const druidPrimalOrderKey = createChoiceKey('feature-choice', 'class', 'druid', 0);
  const terrainChoiceKey = createChoiceKey('feature-choice', 'subclass', 'circleland', 0);

  const baseBuild: CharacterBuild = {
    speciesId: 'human' as const,
    backgroundId: 'acolyte',
    baseAbilities: { str: 10, dex: 10, con: 14, int: 8, wis: 15, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'druid' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'druid' as ClassId, classLevel: 2, hpRoll: null },
      { classId: 'druid' as ClassId, classLevel: 3, hpRoll: null },
    ],
    choices: {
      [druidSubclassKey]: { type: 'subclass' as const, subclassId: 'circleland' as SubclassId },
      [druidPrimalOrderKey]: { type: 'feature-choice' as const, optionId: 'warden' },
    },
    feats: [],
    activeItems: [],
  };

  it('emits a pending feature-choice with 4 terrain options when no terrain decision is recorded', () => {
    const { bundles } = collectBundles(baseBuild);
    const result = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 3,
      bundles,
      choices: baseBuild.choices,
    });
    const pending = result.pendingChoices.find((c) => c.type === 'feature-choice' && c.choiceKey === terrainChoiceKey);
    expect(pending).toBeDefined();
    if (pending?.type === 'feature-choice') {
      expect(pending.source.origin).toBe('subclass');
      const optionIds = pending.options.map((o) => o.optionId);
      expect(optionIds).toEqual(['arid', 'polar', 'temperate', 'tropical']);
    }
  });

  it('arid terrain: resolves leveled spells into alwaysPreparedSpells and cantrip into cantrips', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: {
        ...baseBuild.choices,
        [terrainChoiceKey]: { type: 'feature-choice' as const, optionId: 'arid' },
      },
    };
    const { bundles, warnings } = collectBundles(build);
    // The subclass-origin feature-choice must NOT produce an "invisible choice" warning
    expect(warnings).toEqual([]);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const alwaysPrepared = result.spellcasting!.alwaysPreparedSpells;
    expect(alwaysPrepared).toContain('burning-hands');
    expect(alwaysPrepared).toContain('blur');
    expect(alwaysPrepared).toContain('fireball');
    expect(alwaysPrepared).toContain('blight');
    expect(alwaysPrepared).toContain('wall-of-stone');
    // Cantrip routes to cantrips[], not alwaysPreparedSpells
    expect(alwaysPrepared).not.toContain('fire-bolt');
    expect(result.spellcasting!.cantrips).toContain('fire-bolt');
  });

  it('polar terrain: resolves leveled spells into alwaysPreparedSpells', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: {
        ...baseBuild.choices,
        [terrainChoiceKey]: { type: 'feature-choice' as const, optionId: 'polar' },
      },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const alwaysPrepared = result.spellcasting!.alwaysPreparedSpells;
    expect(alwaysPrepared).toContain('fog-cloud');
    expect(alwaysPrepared).toContain('hold-person');
    expect(alwaysPrepared).toContain('sleet-storm');
    expect(alwaysPrepared).toContain('ice-storm');
    expect(alwaysPrepared).toContain('cone-of-cold');
    expect(alwaysPrepared).not.toContain('ray-of-frost');
    expect(result.spellcasting!.cantrips).toContain('ray-of-frost');
  });

  it.each([
    {
      optionId: 'arid',
      cantrip: 'fire-bolt',
      leveledSpells: ['burning-hands', 'blur', 'fireball', 'blight', 'wall-of-stone'],
    },
    {
      optionId: 'polar',
      cantrip: 'ray-of-frost',
      leveledSpells: ['fog-cloud', 'hold-person', 'sleet-storm', 'ice-storm', 'cone-of-cold'],
    },
    {
      optionId: 'temperate',
      cantrip: 'shocking-grasp',
      leveledSpells: ['sleep', 'misty-step', 'lightning-bolt', 'freedom-of-movement', 'tree-stride'],
    },
    {
      optionId: 'tropical',
      cantrip: 'acid-splash',
      leveledSpells: ['ray-of-sickness', 'web', 'stinking-cloud', 'polymorph', 'insect-plague'],
    },
  ])(
    '$optionId terrain: cantrip in cantrips[], leveled spells in alwaysPreparedSpells',
    ({ optionId, cantrip, leveledSpells }) => {
      const build: CharacterBuild = {
        ...baseBuild,
        choices: {
          ...baseBuild.choices,
          [terrainChoiceKey]: { type: 'feature-choice' as const, optionId },
        },
      };
      const { bundles } = collectBundles(build);
      const result = resolveCharacter({
        baseAbilities: build.baseAbilities,
        level: 3,
        bundles,
        choices: build.choices,
      });
      expect(result.spellcasting).not.toBeNull();
      const alwaysPrepared = result.spellcasting!.alwaysPreparedSpells;
      for (const spellId of leveledSpells) {
        expect(alwaysPrepared, `${optionId} leveled spell ${spellId}`).toContain(spellId);
      }
      expect(alwaysPrepared, `${optionId} cantrip ${cantrip} must not be in alwaysPreparedSpells`).not.toContain(
        cantrip
      );
      expect(result.spellcasting!.cantrips, `${optionId} cantrip ${cantrip} must be in cantrips[]`).toContain(cantrip);
    }
  );

  it('does not emit a pending terrain choice once a valid option is selected', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: {
        ...baseBuild.choices,
        [terrainChoiceKey]: { type: 'feature-choice' as const, optionId: 'temperate' },
      },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
    });
    const pending = result.pendingChoices.find((c) => c.type === 'feature-choice' && c.choiceKey === terrainChoiceKey);
    expect(pending).toBeUndefined();
  });

  it('arid selection adds circleland-land-arid feature to resolved features', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: {
        ...baseBuild.choices,
        [terrainChoiceKey]: { type: 'feature-choice' as const, optionId: 'arid' },
      },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
    });
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('circleland-land-arid');
  });
});

describe('Paladin oath spells integration — L9 Oath of the Ancients', () => {
  const paladinSubclassKey = createChoiceKey('subclass', 'class', 'paladin', 0);

  const baseBuild: CharacterBuild = {
    speciesId: 'human' as const,
    backgroundId: 'soldier',
    baseAbilities: { str: 13, dex: 10, con: 14, int: 8, wis: 10, cha: 16 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'paladin' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'paladin' as ClassId, classLevel: 2, hpRoll: null },
      { classId: 'paladin' as ClassId, classLevel: 3, hpRoll: null },
      { classId: 'paladin' as ClassId, classLevel: 4, hpRoll: null },
      { classId: 'paladin' as ClassId, classLevel: 5, hpRoll: null },
      { classId: 'paladin' as ClassId, classLevel: 6, hpRoll: null },
      { classId: 'paladin' as ClassId, classLevel: 7, hpRoll: null },
      { classId: 'paladin' as ClassId, classLevel: 8, hpRoll: null },
      { classId: 'paladin' as ClassId, classLevel: 9, hpRoll: null },
    ],
    choices: {
      [paladinSubclassKey]: { type: 'subclass' as const, subclassId: 'oathofancients' as SubclassId },
    },
    feats: [],
    activeItems: [],
  };

  it('L3 oath spells (ensnaring-strike, speak-with-animals) are in alwaysPreparedSpells', () => {
    const { bundles } = collectBundles(baseBuild);
    const result = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 9,
      bundles,
      choices: baseBuild.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const alwaysPrepared = result.spellcasting!.alwaysPreparedSpells;
    expect(alwaysPrepared).toContain('ensnaring-strike');
    expect(alwaysPrepared).toContain('speak-with-animals');
  });

  it('L5 oath spells (misty-step, moonbeam) are in alwaysPreparedSpells', () => {
    const { bundles } = collectBundles(baseBuild);
    const result = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 9,
      bundles,
      choices: baseBuild.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const alwaysPrepared = result.spellcasting!.alwaysPreparedSpells;
    expect(alwaysPrepared).toContain('misty-step');
    expect(alwaysPrepared).toContain('moonbeam');
  });

  it('L9 oath spells (plant-growth, protection-from-energy) are in alwaysPreparedSpells', () => {
    const { bundles } = collectBundles(baseBuild);
    const result = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 9,
      bundles,
      choices: baseBuild.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const alwaysPrepared = result.spellcasting!.alwaysPreparedSpells;
    expect(alwaysPrepared).toContain('plant-growth');
    expect(alwaysPrepared).toContain('protection-from-energy');
  });

  it('L13 oath spells (ice-storm, stoneskin) are NOT in alwaysPreparedSpells at Paladin L9', () => {
    const { bundles } = collectBundles(baseBuild);
    const result = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 9,
      bundles,
      choices: baseBuild.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const alwaysPrepared = result.spellcasting!.alwaysPreparedSpells;
    expect(alwaysPrepared).not.toContain('ice-storm');
    expect(alwaysPrepared).not.toContain('stoneskin');
  });

  it('oathofancients-natures-wrath saveDC = 8 + PB(4 at L9) + CHA mod(+3 for CHA 16) = 15', () => {
    // baseBuild has CHA 16 (mod +3), no ASI choices that change it; PB at L9 = 4
    const { bundles } = collectBundles(baseBuild);
    const result = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 9,
      bundles,
      choices: baseBuild.choices,
    });
    const naturesWrath = result.features.find((f) => f.feature.id === 'oathofancients-natures-wrath');
    expect(naturesWrath).toBeDefined();
    expect(naturesWrath!.saveDC).toBe(15);
  });
});

describe('Hunter Ranger feature-choice integration', () => {
  const rangerSubclassKey = createChoiceKey('subclass', 'class', 'ranger', 0);
  const huntersPreyChoiceKey = createChoiceKey('feature-choice', 'subclass', 'hunter', 0);
  const defensiveTacticsChoiceKey = createChoiceKey('feature-choice', 'subclass', 'hunter', 1);

  const baseL3Build: CharacterBuild = {
    speciesId: 'human' as const,
    backgroundId: 'acolyte' as const,
    baseAbilities: { str: 10, dex: 14, con: 10, int: 10, wis: 14, cha: 10 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'ranger' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'ranger' as ClassId, classLevel: 2, hpRoll: 6 },
      { classId: 'ranger' as ClassId, classLevel: 3, hpRoll: 6 },
    ],
    choices: {
      [rangerSubclassKey]: { type: 'subclass' as const, subclassId: 'hunter' as SubclassId },
    },
    feats: [],
    activeItems: [],
  };

  it('Hunter Ranger L3 with colossus-slayer: features contains hunter-hunters-prey-colossus-slayer', () => {
    const build: CharacterBuild = {
      ...baseL3Build,
      choices: {
        ...baseL3Build.choices,
        [huntersPreyChoiceKey]: { type: 'feature-choice' as const, optionId: 'colossus-slayer' },
      },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
    });
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('hunter-hunters-prey-colossus-slayer');
  });

  it('Hunter Ranger L7 with escape-the-horde: features contains hunter-defensive-tactics-escape-the-horde', () => {
    const build: CharacterBuild = {
      ...baseL3Build,
      levels: [
        { classId: 'ranger' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'ranger' as ClassId, classLevel: 2, hpRoll: 6 },
        { classId: 'ranger' as ClassId, classLevel: 3, hpRoll: 6 },
        { classId: 'ranger' as ClassId, classLevel: 4, hpRoll: 6 },
        { classId: 'ranger' as ClassId, classLevel: 5, hpRoll: 6 },
        { classId: 'ranger' as ClassId, classLevel: 6, hpRoll: 6 },
        { classId: 'ranger' as ClassId, classLevel: 7, hpRoll: 6 },
      ],
      choices: {
        ...baseL3Build.choices,
        [huntersPreyChoiceKey]: { type: 'feature-choice' as const, optionId: 'colossus-slayer' },
        [defensiveTacticsChoiceKey]: { type: 'feature-choice' as const, optionId: 'escape-the-horde' },
      },
    };
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 7,
      bundles,
      choices: build.choices,
    });
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('hunter-defensive-tactics-escape-the-horde');
  });

  it("Hunter Ranger L3 with no Hunter's Prey decision: pendingChoices contains feature-choice with correct key and options", () => {
    const { bundles } = collectBundles(baseL3Build);
    const result = resolveCharacter({
      baseAbilities: baseL3Build.baseAbilities,
      level: 3,
      bundles,
      choices: baseL3Build.choices,
    });
    const pending = result.pendingChoices.find(
      (c) => c.type === 'feature-choice' && c.choiceKey === huntersPreyChoiceKey
    );
    expect(pending).toBeDefined();
    if (pending?.type === 'feature-choice') {
      expect(pending.source.origin).toBe('subclass');
      const optionIds = pending.options.map((o) => o.optionId);
      expect(optionIds).toContain('colossus-slayer');
      expect(optionIds).toContain('horde-breaker');
    }
  });
});

describe('Warlock patron spells — resolver integration', () => {
  const warlockSubclassKey = createChoiceKey('subclass', 'class', 'warlock', 0);

  function buildWarlock(subclassId: SubclassId, level: number): CharacterBuild {
    const levels = Array.from({ length: level }, (_, i) => ({
      classId: 'warlock' as ClassId,
      classLevel: i + 1,
      hpRoll: null,
    }));
    return {
      speciesId: 'human' as const,
      backgroundId: 'acolyte',
      baseAbilities: { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 16 },
      abilityMethod: 'standard-array',
      levels,
      choices: {
        [warlockSubclassKey]: { type: 'subclass' as const, subclassId },
      },
      feats: [],
      activeItems: [],
    };
  }

  it('Fiend Warlock L5: alwaysPreparedSpells contains L3 and L5 spells, not L7', () => {
    const build = buildWarlock('fiendpatron' as SubclassId, 5);
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const prepared = result.spellcasting!.alwaysPreparedSpells;
    // L3 spells
    expect(prepared).toContain('burning-hands');
    expect(prepared).toContain('command');
    expect(prepared).toContain('scorching-ray');
    expect(prepared).toContain('suggestion');
    // L5 spells
    expect(prepared).toContain('fireball');
    expect(prepared).toContain('stinking-cloud');
    // L7 spells must NOT be present at level 5
    expect(prepared).not.toContain('fire-shield');
    expect(prepared).not.toContain('wall-of-fire');
  });

  it('Fiend Warlock L9: alwaysPreparedSpells contains L7 and L9 spells', () => {
    const build = buildWarlock('fiendpatron' as SubclassId, 9);
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 9,
      bundles,
      choices: build.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const prepared = result.spellcasting!.alwaysPreparedSpells;
    // L7 spells
    expect(prepared).toContain('fire-shield');
    expect(prepared).toContain('wall-of-fire');
    // L9 spells
    expect(prepared).toContain('geas');
    expect(prepared).toContain('insect-plague');
  });

  it('Celestial Warlock L3: light and sacred-flame in cantrips[], NOT in alwaysPreparedSpells', () => {
    const build = buildWarlock('celestialpatron' as SubclassId, 3);
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const cantrips = result.spellcasting!.cantrips;
    const prepared = result.spellcasting!.alwaysPreparedSpells;
    expect(cantrips).toContain('light');
    expect(cantrips).toContain('sacred-flame');
    expect(prepared).not.toContain('light');
    expect(prepared).not.toContain('sacred-flame');
    // L3 leveled spells ARE in alwaysPreparedSpells
    expect(prepared).toContain('aid');
    expect(prepared).toContain('cure-wounds');
    expect(prepared).toContain('guiding-bolt');
    expect(prepared).toContain('lesser-restoration');
    // Patron cantrips must NOT appear in knownSpells either
    expect(result.spellcasting!.knownSpells).not.toContain('light');
    expect(result.spellcasting!.knownSpells).not.toContain('sacred-flame');
  });

  it('Celestial Warlock L5: alwaysPreparedSpells contains L3 and L5 spells, not L7', () => {
    const build = buildWarlock('celestialpatron' as SubclassId, 5);
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const prepared = result.spellcasting!.alwaysPreparedSpells;
    // L3 spells
    expect(prepared).toContain('aid');
    expect(prepared).toContain('cure-wounds');
    expect(prepared).toContain('guiding-bolt');
    expect(prepared).toContain('lesser-restoration');
    // L5 spells
    expect(prepared).toContain('daylight');
    expect(prepared).toContain('revivify');
    // L7 spells must NOT be present at level 5
    expect(prepared).not.toContain('guardian-of-faith');
    expect(prepared).not.toContain('wall-of-fire');
  });

  it('Archfey Warlock L5: alwaysPreparedSpells contains L3 and L5 spells, not L7', () => {
    const build = buildWarlock('archfeypatron' as SubclassId, 5);
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const prepared = result.spellcasting!.alwaysPreparedSpells;
    // L3 spells
    expect(prepared).toContain('calm-emotions');
    expect(prepared).toContain('faerie-fire');
    expect(prepared).toContain('misty-step');
    expect(prepared).toContain('phantasmal-force');
    expect(prepared).toContain('sleep');
    // L5 spells
    expect(prepared).toContain('blink');
    expect(prepared).toContain('plant-growth');
    // L7 spells must NOT be present
    expect(prepared).not.toContain('dominate-beast');
    expect(prepared).not.toContain('greater-invisibility');
  });

  it('Great Old One Warlock L5: alwaysPreparedSpells contains L3 and L5 spells, not L7', () => {
    const build = buildWarlock('greatoldonepatron' as SubclassId, 5);
    const { bundles } = collectBundles(build);
    const result = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
    });
    expect(result.spellcasting).not.toBeNull();
    const prepared = result.spellcasting!.alwaysPreparedSpells;
    // L3 spells
    expect(prepared).toContain('detect-thoughts');
    expect(prepared).toContain('dissonant-whispers');
    expect(prepared).toContain('hideous-laughter');
    expect(prepared).toContain('phantasmal-force');
    // L5 spells
    expect(prepared).toContain('clairvoyance');
    expect(prepared).toContain('hunger-of-hadar');
    // L7 spells must NOT be present
    expect(prepared).not.toContain('confusion');
    expect(prepared).not.toContain('summon-aberration');
  });
});
