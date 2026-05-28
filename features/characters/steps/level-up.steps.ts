import { Given, When, Then } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';
import { collectBundles } from '@/lib/sources';
import { resolveCharacter } from '@/lib/resolver';
import { createChoiceKey } from '@/types/choices';
import type { BuildLevel } from '@/types/choices';

function makeFighterBuild(level: number) {
  const levels: BuildLevel[] = Array.from({ length: level }, (_, i) => ({
    classId: 'fighter' as const,
    classLevel: i + 1,
    hpRoll: null,
  }));

  return {
    speciesId: 'human' as const,
    backgroundId: 'soldier' as const,
    baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
    abilityMethod: 'standard-array' as const,
    choices: {},
    levels,
    feats: [],
    activeItems: [],
  };
}

Given('a Fighter character build at level 3', function (this: DndWorld) {
  this.build = makeFighterBuild(3);
});

When('the character levels up to level 4', function (this: DndWorld) {
  this.build = makeFighterBuild(4);
  const { bundles, expandedFeats } = collectBundles(this.build);
  this.resolvedAtLevel = resolveCharacter({
    baseAbilities: this.build.baseAbilities,
    level: 4,
    bundles,
    choices: this.build.choices,
    hpRolls: Array(4).fill(null) as (number | null)[],
    expandedFeats,
  });
});

Then('the resolved character has a pending ASI choice from the Fighter class', function (this: DndWorld) {
  const asiKey = createChoiceKey('asi', 'class', 'fighter', 0);
  const hasPendingAsi = this.resolvedAtLevel!.pendingChoices.some((c) => c.type === 'asi' && c.choiceKey === asiKey);
  if (!hasPendingAsi) {
    const keys = this.resolvedAtLevel!.pendingChoices.map((c) => c.choiceKey);
    throw new Error(`Expected pending ASI ${asiKey}, got: ${JSON.stringify(keys)}`);
  }
});

Then('the resolved character has proficiency bonus {int}', function (this: DndWorld, expected: number) {
  if (this.resolvedAtLevel!.proficiencyBonus !== expected) {
    throw new Error(`Expected proficiency bonus ${expected}, got ${this.resolvedAtLevel!.proficiencyBonus}`);
  }
});
