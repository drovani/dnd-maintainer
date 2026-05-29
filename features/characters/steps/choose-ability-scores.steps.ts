import { Given, When, Then } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';
import { makeBuild, resolveBuild } from '../../steps/support/character-builder.js';
import {
  STANDARD_ARRAY as STANDARD_ARRAY_VALUES,
  POINT_BUY_TOTAL,
  POINT_BUY_COSTS,
  getPointBuyIncrementCost,
  getAbilityModifier,
} from '@/lib/dnd-helpers';
import type { AbilityKey } from '@/lib/dnd-helpers';
import type { AbilityScores } from '@/types/database';
import type { CharacterBuild } from '@/types/choices';
import { createChoiceKey } from '@/types/choices';

/**
 * Feature-unique steps for the ability-score creation step (resolver/helper seam).
 *
 * The supported-method rules (standard array fixed set, point-buy 27-point pool,
 * point-buy rejecting scores above 15) are asserted against the pure helpers in
 * src/lib/dnd-helpers.ts. The background-increase rule resolves a real build
 * (soldier background) through collectBundles() + resolveCharacter() and asserts
 * on this.resolved.abilities. Shared Given steps (character-common.steps.ts) are
 * reused where possible; the steps below are not defined anywhere else.
 */

type AbilityMethod = CharacterBuild['abilityMethod'];

const ABILITY_BY_NAME: Readonly<Record<string, AbilityKey>> = {
  Strength: 'str',
  Dexterity: 'dex',
  Constitution: 'con',
  Intelligence: 'int',
  Wisdom: 'wis',
  Charisma: 'cha',
};

function abilityKey(name: string): AbilityKey {
  const key = ABILITY_BY_NAME[name];
  if (!key)
    throw new Error(`Unknown ability name "${name}" — expected one of ${Object.keys(ABILITY_BY_NAME).join(', ')}`);
  return key;
}

// Scenario-local state. Cucumber runs scenarios serially; each chosen Given resets
// the slice it owns, so no cross-scenario bleed.
let chosenMethod: AbilityMethod | null = null;
let attemptedScore: number | null = null;
let baseScores: AbilityScores | null = null;
let increasedAbilities: AbilityKey[] = [];

// --- Method selection -------------------------------------------------------

Given('a new character using the {word} ability method', function (this: DndWorld, method: string) {
  chosenMethod = method as AbilityMethod;
  attemptedScore = null;
  baseScores = null;
  increasedAbilities = [];
});

// --- Standard array ---------------------------------------------------------

Then('the available base scores are 15, 14, 13, 12, 10, and 8', function (this: DndWorld) {
  if (chosenMethod !== 'standard-array') {
    throw new Error(`Expected the standard-array method, but the chosen method was "${chosenMethod}"`);
  }
  const expected = [15, 14, 13, 12, 10, 8];
  const actual = [...STANDARD_ARRAY_VALUES];
  if (actual.length !== expected.length || expected.some((v, i) => actual[i] !== v)) {
    throw new Error(`Expected standard array ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
});

// --- Point buy --------------------------------------------------------------

Then('the character has {int} points to spend on ability scores', function (this: DndWorld, expected: number) {
  if (chosenMethod !== 'point-buy') {
    throw new Error(`Expected the point-buy method, but the chosen method was "${chosenMethod}"`);
  }
  if (POINT_BUY_TOTAL !== expected) {
    throw new Error(`Expected ${expected} point-buy points, got ${POINT_BUY_TOTAL}`);
  }
});

When('the character tries to set a base ability score of {int}', function (this: DndWorld, score: number) {
  attemptedScore = score;
});

Then('the score is not allowed', function (this: DndWorld) {
  if (attemptedScore === null) {
    throw new Error('No base ability score was attempted');
  }
  // A score is allowed under point buy iff it has a defined cost (8..15) and is
  // reachable by incrementing from below. 16 has no cost and incrementing from
  // 15 returns Infinity, so it is rejected by the pure point-buy helpers.
  const hasCost = Object.prototype.hasOwnProperty.call(POINT_BUY_COSTS, attemptedScore);
  const reachable = Number.isFinite(getPointBuyIncrementCost(attemptedScore - 1));
  if (hasCost || reachable) {
    throw new Error(`Expected base score ${attemptedScore} to be rejected by point buy, but it was allowed`);
  }
});

// --- Background increases on top of base scores -----------------------------

Given('base ability scores of 15, 14, 13, 12, 10, and 8', function (this: DndWorld) {
  // Assign the standard-array values to a concrete mapping. The two highest sit
  // on Strength and Constitution so the soldier increase lands on real values.
  baseScores = { str: 15, con: 14, dex: 13, int: 12, wis: 10, cha: 8 };
});

When(
  'the soldier ability increases are applied to {word} and {word}',
  function (this: DndWorld, firstName: string, secondName: string) {
    if (!baseScores) throw new Error('Base ability scores were not set before applying increases');
    const first = abilityKey(firstName);
    const second = abilityKey(secondName);
    increasedAbilities = [first, second];

    // Soldier's ASI is a +2/+1 allocation chosen from {str, dex, con} (2024 PHB).
    const asiKey = createChoiceKey('asi', 'background', 'soldier', 0);
    this.build = makeBuild({
      backgroundId: 'soldier',
      baseAbilities: baseScores,
      choices: {
        [asiKey]: { type: 'asi', allocation: { [first]: 2, [second]: 1 } },
      },
    });
    this.resolved = resolveBuild(this.build);
  }
);

Then('the final {word} score includes the background increase', function (this: DndWorld, abilityName: string) {
  if (!baseScores) throw new Error('Base ability scores were not set');
  const key = abilityKey(abilityName);
  const resolved = this.resolved!.abilities[key];
  const expectedBonus = increasedAbilities[0] === key ? 2 : increasedAbilities.includes(key) ? 1 : 0;
  if (expectedBonus === 0) {
    throw new Error(`${abilityName} did not receive a background increase`);
  }
  const expectedTotal = baseScores[key] + expectedBonus;
  if (resolved.total !== expectedTotal) {
    throw new Error(
      `Expected final ${abilityName} score ${expectedTotal} (base ${baseScores[key]} + ${expectedBonus}), got ${resolved.total}`
    );
  }
});

Then('the final ability modifiers reflect the increased scores', function (this: DndWorld) {
  const abilities = this.resolved!.abilities;
  for (const key of increasedAbilities) {
    const resolved = abilities[key];
    const expectedModifier = getAbilityModifier(resolved.total);
    if (resolved.modifier !== expectedModifier) {
      throw new Error(
        `Expected modifier ${expectedModifier} for ${key} (total ${resolved.total}), got ${resolved.modifier}`
      );
    }
  }
});
