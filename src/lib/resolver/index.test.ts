import { describe, it, expect } from 'vitest';
import { resolveCharacter } from '@/lib/resolver';
import type { ResolverInput } from '@/lib/resolver';
import type { AbilityKey, ClassId } from '@/lib/dnd-helpers';
import { DND_SKILLS } from '@/lib/dnd-helpers';
import { collectBundles } from '@/lib/sources';
import type { CharacterBuild } from '@/types/choices';
import { createChoiceKey } from '@/types/choices';
import type { ChoiceDecision } from '@/types/choices';
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

// ---------------------------------------------------------------------------
// Barbarian integration tests
// ---------------------------------------------------------------------------

describe('Human Barbarian L1 integration', () => {
  // STR 15, DEX 14, CON 16 → after human +1 each: STR 16, DEX 15, CON 17
  // DEX modifier = 2, CON modifier = 3
  // Unarmored AC = 10 + 2 + 3 = 15
  // HP max = 12 (hit die) + 3 (CON mod) = 15
  const barbarianL1Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 14, con: 16, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      'skill-choice:class:barbarian:0': { type: 'skill-choice', skills: ['athletics', 'intimidation'] },
      'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      // Leave both bundle-choice grants unresolved to test pending choices
    },
    levels: [{ classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null }],
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(barbarianL1Build);

  const input: ResolverInput = {
    baseAbilities: barbarianL1Build.baseAbilities,
    level: 1,
    bundles,
    choices: barbarianL1Build.choices,
    levels: barbarianL1Build.levels,
  };

  it('unarmored AC = 10 + DEX modifier (2) + CON modifier (3) = 15', () => {
    const result = resolveCharacter(input);
    expect(result.armorClass.effective).toBe(15);
  });

  it('features contain barbarian-rage with usesCount: 2', () => {
    const result = resolveCharacter(input);
    const rageFeature = result.features.find((f) => f.feature.id === 'barbarian-rage');
    expect(rageFeature).toBeDefined();
    expect(rageFeature!.feature.usesCount).toBe(2);
  });

  it('features contain barbarian-unarmored-defense', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('barbarian-unarmored-defense');
  });

  it('HP max = 12 (barbarian hit die) + 3 (CON mod) = 15', () => {
    const result = resolveCharacter(input);
    expect(result.hitDie[0].die).toBe(12);
    expect(result.hitPoints.max).toBe(15);
  });

  it('two bundle-choice grants appear in pendingChoices when not resolved', () => {
    const result = resolveCharacter(input);
    const bundlePending = result.pendingChoices.filter((c) => c.type === 'bundle-choice');
    expect(bundlePending).toHaveLength(2);
  });
});

describe('Human Barbarian L3 + Totem Warrior + Bear integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'barbarian', 0);
  const totemL3Key = createChoiceKey('totem-animal-choice', 'class', 'barbarian', 0);

  const barbarianL3Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 14, con: 16, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      'skill-choice:class:barbarian:0': { type: 'skill-choice', skills: ['athletics', 'intimidation'] },
      'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'totemwarrior' as SubclassId },
      [totemL3Key]: { type: 'totem-animal-choice' as const, animal: 'bear' as const },
      'bundle-choice:class:barbarian:0': {
        type: 'bundle-choice' as const,
        bundleId: 'barbarian-greataxe',
        slotPicks: {},
      },
      'bundle-choice:class:barbarian:1': {
        type: 'bundle-choice' as const,
        bundleId: 'two-handaxes',
        slotPicks: {},
      },
    },
    levels: [
      { classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'barbarian' as ClassId, classLevel: 2, hpRoll: 8 },
      { classId: 'barbarian' as ClassId, classLevel: 3, hpRoll: 7 },
    ],
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(barbarianL3Build);

  const input: ResolverInput = {
    baseAbilities: barbarianL3Build.baseAbilities,
    level: 3,
    bundles,
    choices: barbarianL3Build.choices,
    levels: barbarianL3Build.levels,
  };

  it('features contain totemwarrior-totem-spirit-bear', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toContain('totemwarrior-totem-spirit-bear');
  });

  it('pendingChoices does NOT contain an entry for the L3 totem choiceKey', () => {
    const result = resolveCharacter(input);
    const totemPending = result.pendingChoices.filter(
      (c) => c.type === 'totem-animal-choice' && c.choiceKey === totemL3Key
    );
    expect(totemPending).toHaveLength(0);
  });

  it('barbarian-rage has usesCount: 3 (dedupe keeps L3 re-emission over L1)', () => {
    const result = resolveCharacter(input);
    const rageFeature = result.features.find((f) => f.feature.id === 'barbarian-rage');
    expect(rageFeature).toBeDefined();
    expect(rageFeature!.feature.usesCount).toBe(3);
  });

  it('no pending choices remain when all choices resolved', () => {
    const result = resolveCharacter(input);
    expect(result.pendingChoices).toHaveLength(0);
  });
});

describe('Human Barbarian L6 + Totem Warrior (no totem decisions) integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'barbarian', 0);
  const totemL3Key = createChoiceKey('totem-animal-choice', 'class', 'barbarian', 0);
  const totemL6Key = createChoiceKey('totem-animal-choice', 'class', 'barbarian', 1);

  const barbarianL6Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 14, con: 16, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      'skill-choice:class:barbarian:0': { type: 'skill-choice', skills: ['athletics', 'intimidation'] },
      'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'totemwarrior' as SubclassId },
      'bundle-choice:class:barbarian:0': {
        type: 'bundle-choice' as const,
        bundleId: 'barbarian-greataxe',
        slotPicks: {},
      },
      'bundle-choice:class:barbarian:1': {
        type: 'bundle-choice' as const,
        bundleId: 'two-handaxes',
        slotPicks: {},
      },
      // Intentionally omit both totem-animal-choice decisions
    },
    levels: [
      { classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'barbarian' as ClassId, classLevel: 2, hpRoll: 8 },
      { classId: 'barbarian' as ClassId, classLevel: 3, hpRoll: 7 },
      { classId: 'barbarian' as ClassId, classLevel: 4, hpRoll: 6 },
      { classId: 'barbarian' as ClassId, classLevel: 5, hpRoll: 9 },
      { classId: 'barbarian' as ClassId, classLevel: 6, hpRoll: 8 },
    ],
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(barbarianL6Build);

  const input: ResolverInput = {
    baseAbilities: barbarianL6Build.baseAbilities,
    level: 6,
    bundles,
    choices: barbarianL6Build.choices,
    levels: barbarianL6Build.levels,
  };

  it('pendingChoices contains TWO totem-animal-choice entries', () => {
    const result = resolveCharacter(input);
    const totemPending = result.pendingChoices.filter((c) => c.type === 'totem-animal-choice');
    expect(totemPending).toHaveLength(2);
  });

  it('the two totem-animal-choice pending entries have distinct choiceKeys', () => {
    const result = resolveCharacter(input);
    const totemPending = result.pendingChoices.filter((c) => c.type === 'totem-animal-choice');
    const keys = totemPending.map((c) => c.choiceKey);
    expect(keys).toContain(totemL3Key);
    expect(keys).toContain(totemL6Key);
  });

  it('the two totem-animal-choice pending entries have distinct choiceKeys (one per grant)', () => {
    const result = resolveCharacter(input);
    const totemPending = result.pendingChoices.filter((c) => c.type === 'totem-animal-choice');
    // Each grant emits its own pending entry identified by its unique choiceKey
    expect(totemPending.map((c) => c.choiceKey)).toContain(totemL3Key);
    expect(totemPending.map((c) => c.choiceKey)).toContain(totemL6Key);
  });
});

describe('Totem Warrior — invalid totem decision falls through to pending', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'barbarian', 0);
  const totemL3Key = createChoiceKey('totem-animal-choice', 'class', 'barbarian', 0);

  const invalidDecision = { type: 'totem-animal-choice', animal: 'cat' } as unknown as ChoiceDecision;

  const barbarianL3Build: CharacterBuild = {
    raceId: 'human',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 14, con: 16, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      'skill-choice:class:barbarian:0': { type: 'skill-choice', skills: ['athletics', 'intimidation'] },
      'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['dwarvish'] },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'totemwarrior' as SubclassId },
      [totemL3Key]: invalidDecision,
      'bundle-choice:class:barbarian:0': {
        type: 'bundle-choice' as const,
        bundleId: 'barbarian-greataxe',
        slotPicks: {},
      },
      'bundle-choice:class:barbarian:1': {
        type: 'bundle-choice' as const,
        bundleId: 'two-handaxes',
        slotPicks: {},
      },
    },
    levels: [
      { classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'barbarian' as ClassId, classLevel: 2, hpRoll: 8 },
      { classId: 'barbarian' as ClassId, classLevel: 3, hpRoll: 7 },
    ],
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(barbarianL3Build);

  const input: ResolverInput = {
    baseAbilities: barbarianL3Build.baseAbilities,
    level: 3,
    bundles,
    choices: barbarianL3Build.choices,
    levels: barbarianL3Build.levels,
  };

  it('does NOT synthesize totemwarrior-totem-spirit-cat feature', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).not.toContain('totemwarrior-totem-spirit-cat');
  });

  it('emits a pending totem-animal-choice entry for the invalid decision key', () => {
    const result = resolveCharacter(input);
    const totemPending = result.pendingChoices.filter(
      (c) => c.type === 'totem-animal-choice' && c.choiceKey === totemL3Key
    );
    expect(totemPending).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Hill Dwarf integration tests
// ---------------------------------------------------------------------------

describe('Hill Dwarf Barbarian L3 integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'barbarian', 0);
  const dwarfToolKey = createChoiceKey('tool-choice', 'race', 'dwarf-hill', 0);

  // Base abilities chosen so Hill Dwarf's +2 CON and +1 WIS are observable over defaults
  const hillDwarfL3Build: CharacterBuild = {
    raceId: 'dwarf-hill',
    backgroundId: 'soldier',
    baseAbilities: { str: 15, dex: 14, con: 16, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array',
    choices: {
      'skill-choice:class:barbarian:0': { type: 'skill-choice', skills: ['athletics', 'intimidation'] },
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
      'language-choice:background:soldier:0': { type: 'language-choice', languages: ['elvish'] },
      [subclassKey]: { type: 'subclass' as const, subclassId: 'berserker' as SubclassId },
      'bundle-choice:class:barbarian:0': {
        type: 'bundle-choice' as const,
        bundleId: 'barbarian-greataxe',
        slotPicks: {},
      },
      'bundle-choice:class:barbarian:1': {
        type: 'bundle-choice' as const,
        bundleId: 'two-handaxes',
        slotPicks: {},
      },
      // Intentionally leave dwarf tool-choice unresolved to verify it surfaces as pending
    },
    levels: [
      { classId: 'barbarian' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'barbarian' as ClassId, classLevel: 2, hpRoll: 8 },
      { classId: 'barbarian' as ClassId, classLevel: 3, hpRoll: 7 },
    ],
    feats: [],
    activeItems: [],
  };

  const { bundles } = collectBundles(hillDwarfL3Build);

  const input: ResolverInput = {
    baseAbilities: hillDwarfL3Build.baseAbilities,
    level: 3,
    bundles,
    choices: hillDwarfL3Build.choices,
    levels: hillDwarfL3Build.levels,
  };

  it('CON total = 18 (base 16 + dwarf +2)', () => {
    const result = resolveCharacter(input);
    expect(result.abilities.con.total).toBe(18);
    expect(result.abilities.con.modifier).toBe(4);
  });

  it('WIS total = 11 (base 10 + hill subrace +1)', () => {
    const result = resolveCharacter(input);
    expect(result.abilities.wis.total).toBe(11);
  });

  // HP = L1 max die (12) + CON mod (4) = 16
  //    + L2 roll 8 + CON mod 4 = 12 → 28
  //    + L3 roll 7 + CON mod 4 = 11 → 39
  //    + Dwarven Toughness 1 × 3 levels = 3 → 42
  it('HP max = 42 (hit die + CON mods + Dwarven Toughness)', () => {
    const result = resolveCharacter(input);
    expect(result.hitPoints.max).toBe(42);
  });

  it('features include darkvision, dwarven resilience, stonecunning, and dwarven toughness', () => {
    const result = resolveCharacter(input);
    const featureIds = result.features.map((f) => f.feature.id);
    expect(featureIds).toEqual(
      expect.arrayContaining([
        'dwarf-darkvision',
        'dwarf-dwarven-resilience',
        'dwarf-stonecunning',
        'dwarf-dwarven-toughness',
      ])
    );
  });

  it('resistances include poison with race source', () => {
    const result = resolveCharacter(input);
    const poisonResistance = result.resistances.find((r) => r.value === 'poison');
    expect(poisonResistance).toBeDefined();
    expect(poisonResistance!.sources).toContainEqual({ origin: 'race', id: 'dwarf-hill' });
  });

  it('walk speed is 25 (dwarf)', () => {
    const result = resolveCharacter(input);
    expect(result.speed.walk?.value).toBe(25);
  });

  it('pendingChoices contains the unresolved dwarf tool-choice', () => {
    const result = resolveCharacter(input);
    const dwarfToolPending = result.pendingChoices.filter(
      (c) => c.type === 'tool-choice' && c.choiceKey === dwarfToolKey
    );
    expect(dwarfToolPending).toHaveLength(1);
  });
});
