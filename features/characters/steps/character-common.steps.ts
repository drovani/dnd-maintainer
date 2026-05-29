import { Given, Then } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';
import { makeBuild, resolveBuild } from '../../steps/support/character-builder.js';
import type { ClassId, SpeciesId, BackgroundId, AbilityKey } from '@/lib/dnd-helpers';

/**
 * SHARED character-build vocabulary (resolver seam).
 *
 * These Given/Then phrases recur across multiple character feature files
 * (choose-class, choose-skills, choose-equipment, choose-species, ...). Cucumber
 * step definitions are GLOBAL, so they are defined ONCE here. Per-feature step
 * files must NOT redefine any phrase below — they add only feature-unique steps.
 *
 * Build is constructed and resolved into `this.resolved` via the real
 * collectBundles() + resolveCharacter() pipeline.
 */

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

// --- Shared Given steps: construct + resolve a build ------------------------

Given(
  'a new character with the {word} class at level {int}',
  function (this: DndWorld, classId: string, level: number) {
    this.build = makeBuild({ classId: classId as ClassId, level });
    this.resolved = resolveBuild(this.build);
  }
);

Given('a new character with the {word} class', function (this: DndWorld, classId: string) {
  this.build = makeBuild({ classId: classId as ClassId, level: 1 });
  this.resolved = resolveBuild(this.build);
});

Given('a new character with the {word} species', function (this: DndWorld, speciesId: string) {
  this.build = makeBuild({ speciesId: speciesId as SpeciesId, level: 1 });
  this.resolved = resolveBuild(this.build);
});

Given('a new character with the {word} background', function (this: DndWorld, backgroundId: string) {
  this.build = makeBuild({ backgroundId: backgroundId as BackgroundId, level: 1 });
  this.resolved = resolveBuild(this.build);
});

Given(
  'a new character with the {word} class and the {word} background',
  function (this: DndWorld, classId: string, backgroundId: string) {
    this.build = makeBuild({ classId: classId as ClassId, backgroundId: backgroundId as BackgroundId, level: 1 });
    this.resolved = resolveBuild(this.build);
  }
);

// --- Shared Then steps: assert against the resolved character ----------------

Then('the character is proficient in {word} saving throws', function (this: DndWorld, abilityName: string) {
  const key = abilityKey(abilityName);
  const st = this.resolved!.savingThrows[key];
  if (!st?.proficient) {
    throw new Error(`Expected proficiency in ${abilityName} saving throws, but it was not proficient`);
  }
});

Then('the character must choose a subclass', function (this: DndWorld) {
  const has = this.resolved!.pendingChoices.some((c) => c.type === 'subclass');
  if (!has) {
    const types = this.resolved!.pendingChoices.map((c) => c.type);
    throw new Error(`Expected a pending subclass choice; pending choice types were: ${JSON.stringify(types)}`);
  }
});

Then(
  'the character must choose {int} skills from the {word} skill list',
  function (this: DndWorld, count: number, classId: string) {
    const choice = this.resolved!.pendingChoices.find(
      (c) => c.type === 'skill-choice' && c.choiceKey.includes(`:class:${classId}:`)
    );
    if (!choice || choice.type !== 'skill-choice') {
      const keys = this.resolved!.pendingChoices.map((c) => c.choiceKey);
      throw new Error(
        `Expected a class skill-choice for "${classId}"; pending choice keys were: ${JSON.stringify(keys)}`
      );
    }
    if (choice.count !== count) {
      throw new Error(`Expected ${count} skill choices from ${classId}, got ${choice.count}`);
    }
  }
);
