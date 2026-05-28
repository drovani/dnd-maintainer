import { Given, Then } from '@cucumber/cucumber';
import { getAbilityModifier } from '@/lib/dnd-helpers';
import type { DndWorld } from '../../steps/support/world.js';

Given('an ability score of {int}', function (this: DndWorld, score: number) {
  this.abilityScore = score;
});

Then('the ability modifier is {int}', function (this: DndWorld, expected: number) {
  const actual = getAbilityModifier(this.abilityScore!);
  if (actual !== expected) {
    throw new Error(`Expected modifier ${expected} for score ${this.abilityScore}, got ${actual}`);
  }
});
