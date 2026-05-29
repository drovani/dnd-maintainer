import { Then } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';

/**
 * Feature-unique steps for choose-class.feature (resolver seam).
 *
 * Shared Given/Then phrases (class/species/background construction, saving-throw,
 * subclass, and skill-list assertions) live in character-common.steps.ts and must
 * NOT be redefined here. These steps assert on `this.resolved` for the signature
 * level-1 class mechanics that choose-class.feature exercises uniquely.
 */

Then('the character must choose weapon masteries', function (this: DndWorld) {
  const choice = this.resolved!.pendingChoices.find((c) => c.type === 'weapon-mastery-choice');
  if (!choice) {
    const types = this.resolved!.pendingChoices.map((c) => c.type);
    throw new Error(`Expected a pending weapon-mastery-choice; pending choice types were: ${JSON.stringify(types)}`);
  }
});

Then('the character has spellcasting from its class', function (this: DndWorld) {
  if (this.resolved!.spellcasting === null) {
    throw new Error('Expected the character to have spellcasting from its class, but spellcasting was null');
  }
});
