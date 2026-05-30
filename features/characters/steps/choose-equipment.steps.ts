import { When, Then } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';
import { makeBuild, makeChoices, resolveBuild } from '../../steps/support/character-builder.js';
import { createChoiceKey } from '@/types/choices';

/**
 * Feature-unique steps for choose-equipment (resolver seam).
 *
 * The shared `Given a new character with the {word} class at level {int}` sets
 * this.build + this.resolved. These steps assert on the starting-equipment
 * bundle-choices that a class grants, and re-resolve the build after recording a
 * choice — the same rebuild pattern level-up.steps.ts uses.
 *
 * The fighter's first loadout bundle-choice is `bundle-choice:class:fighter:0`
 * with bundleIds ['fighter-chainmail', 'fighter-archer-kit'].
 */

const FIGHTER_LOADOUT_KEY = createChoiceKey('bundle-choice', 'class', 'fighter', 0);

Then('the character must choose a starting equipment option', function (this: DndWorld) {
  const choice = this.resolved!.pendingChoices.find(
    (c) => c.type === 'bundle-choice' && c.choiceKey === FIGHTER_LOADOUT_KEY
  );
  if (!choice || choice.type !== 'bundle-choice') {
    const keys = this.resolved!.pendingChoices.map((c) => c.choiceKey);
    throw new Error(
      `Expected a pending starting-equipment bundle-choice ${FIGHTER_LOADOUT_KEY}; pending choice keys were: ${JSON.stringify(keys)}`
    );
  }
  if (choice.bundleIds.length === 0) {
    throw new Error(`Expected the starting-equipment choice to offer options, but bundleIds was empty`);
  }
});

When('the character chooses the first starting equipment option', function (this: DndWorld) {
  const pending = this.resolved!.pendingChoices.find(
    (c) => c.type === 'bundle-choice' && c.choiceKey === FIGHTER_LOADOUT_KEY
  );
  if (!pending || pending.type !== 'bundle-choice') {
    throw new Error(`No pending starting-equipment choice ${FIGHTER_LOADOUT_KEY} to choose from`);
  }
  const firstBundleId = pending.bundleIds[0];

  this.build = makeBuild({
    classId: 'fighter',
    level: 1,
    choices: makeChoices([FIGHTER_LOADOUT_KEY, { type: 'bundle-choice', bundleId: firstBundleId, slotPicks: {} }]),
  });
  this.resolved = resolveBuild(this.build);
});

Then("the chosen items appear in the character's inventory", function (this: DndWorld) {
  // The first fighter loadout option (fighter-chainmail) materializes chain-mail.
  const hasChainMail = this.resolved!.equipment.some((item) => item.itemId === 'chain-mail');
  if (!hasChainMail) {
    const ids = this.resolved!.equipment.map((item) => item.itemId);
    throw new Error(`Expected chosen loadout items in inventory; equipment itemIds were: ${JSON.stringify(ids)}`);
  }
});

When('the character chooses to start with gold instead of equipment', function (this: DndWorld) {
  // No "gold instead of equipment" option is modeled yet: the bundle-choice offers
  // only equipment packages. Re-resolve a fighter build unchanged so downstream
  // assertions inspect the (still equipment-only) resolved state.
  this.build = makeBuild({ classId: 'fighter', level: 1 });
  this.resolved = resolveBuild(this.build);
});

Then("the character's inventory reflects the gold option", function (this: DndWorld) {
  // INTENDED: the loadout choice should offer a gold alternative so the player can
  // forgo the equipment package and start with starting gold instead. No such option
  // exists in the bundle catalog today, so this fails on a real assertion.
  const loadout = this.resolved!.pendingChoices.find(
    (c) => c.type === 'bundle-choice' && c.choiceKey === FIGHTER_LOADOUT_KEY
  );
  const offersGold = loadout?.type === 'bundle-choice' && loadout.bundleIds.includes('gold');
  if (!offersGold) {
    const offered = loadout?.type === 'bundle-choice' ? loadout.bundleIds : [];
    throw new Error(
      `Expected a "gold instead of equipment" option in the starting-equipment choice, but options were: ${JSON.stringify(offered)}`
    );
  }
});
