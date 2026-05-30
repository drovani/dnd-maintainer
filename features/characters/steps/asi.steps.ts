import { Given, When, Then } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';
import { makeBuild, resolveBuild, makeChoices } from '../../steps/support/character-builder.js';
import { createChoiceKey } from '@/types/choices';
import type { AbilityKey, ClassId } from '@/lib/dnd-helpers';

// ---------------------------------------------------------------------------
// Ability Score Increase — resolver seam.
//
// Shared ASI vocabulary used by resolve-asi.feature and level-down.feature.
// Steps operate on this.build / this.resolved set up by the shared
// "a new character with the {word} class at level {int}" Given
// (character-common.steps.ts). Allocating re-runs the real resolver so the
// pending-choice and ability totals reflect the production pipeline.
// ---------------------------------------------------------------------------

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
  if (!key) {
    throw new Error(`Unknown ability name "${name}" — expected one of ${Object.keys(ABILITY_BY_NAME).join(', ')}`);
  }
  return key;
}

/** The ASI grant lives on the first class at grant index 0 (e.g. asi:class:fighter:0). */
function asiChoiceKey(world: DndWorld): ReturnType<typeof createChoiceKey> {
  const classId = world.build!.levels[0].classId as ClassId;
  return createChoiceKey('asi', 'class', classId, 0);
}

function hasPendingAsi(world: DndWorld): boolean {
  return world.resolved!.pendingChoices.some((c) => c.type === 'asi');
}

function allocate(world: DndWorld, allocation: Partial<Record<AbilityKey, number>>): void {
  const key = asiChoiceKey(world);
  world.build = { ...world.build!, choices: makeChoices([key, { type: 'asi', allocation }]) };
  world.resolved = resolveBuild(world.build);
}

// A no-background build so the only ASI is the class one. (2024 PHB backgrounds
// ALSO grant an ASI — e.g. soldier yields asi:background:soldier:0 — which would
// otherwise leave a second, unrelated ASI pending and make "the ability score
// increase" ambiguous.)
Given('a Fighter at level {int} with no background chosen', function (this: DndWorld, level: number) {
  this.build = makeBuild({ classId: 'fighter', level, backgroundId: null });
  this.resolved = resolveBuild(this.build);
});

When(
  'the player allocates {int} points of ability score increase to {word}',
  function (this: DndWorld, points: number, abilityName: string) {
    const allocation: Partial<Record<AbilityKey, number>> = {};
    allocation[abilityKey(abilityName)] = points;
    allocate(this, allocation);
  }
);

When(
  'the player allocates {int} point of ability score increase to {word} and {int} to {word}',
  function (this: DndWorld, p1: number, a1: string, p2: number, a2: string) {
    const allocation: Partial<Record<AbilityKey, number>> = {};
    allocation[abilityKey(a1)] = p1;
    allocation[abilityKey(a2)] = p2;
    allocate(this, allocation);
  }
);

Then('the character has a pending ability score increase', function (this: DndWorld) {
  if (!hasPendingAsi(this)) {
    const keys = this.resolved!.pendingChoices.map((c) => c.choiceKey);
    throw new Error(`Expected a pending ASI choice; pending choice keys were: ${JSON.stringify(keys)}`);
  }
});

Then('the ability score increase is still pending', function (this: DndWorld) {
  if (!hasPendingAsi(this)) {
    throw new Error(
      'Expected the ASI to remain pending (allocation did not equal the granted points), but it resolved'
    );
  }
});

Then('the ability score increase is no longer pending', function (this: DndWorld) {
  if (hasPendingAsi(this)) {
    const pendingKeys = this.resolved!.pendingChoices.filter((c) => c.type === 'asi').map((c) => c.choiceKey);
    throw new Error(
      `Expected the ASI to be resolved and removed from pending choices, but these ASI choices are still pending: ${JSON.stringify(pendingKeys)}`
    );
  }
});

Then('the character has no pending ability score increase', function (this: DndWorld) {
  if (hasPendingAsi(this)) {
    throw new Error('Expected no pending ASI choice, but one is present');
  }
});

Then(
  "the character's {word} score is increased by {int}",
  function (this: DndWorld, abilityName: string, delta: number) {
    const key = abilityKey(abilityName);
    const withAllocation = this.resolved!.abilities[key].total;
    // Baseline = the same build with the ASI unallocated, so the assertion isolates the
    // ASI delta from any species/background contributions to the score.
    const baseline = resolveBuild({ ...this.build!, choices: {} }).abilities[key].total;
    if (withAllocation - baseline !== delta) {
      throw new Error(
        `Expected ${abilityName} to increase by ${delta} (baseline ${baseline}), got total ${withAllocation}`
      );
    }
  }
);
