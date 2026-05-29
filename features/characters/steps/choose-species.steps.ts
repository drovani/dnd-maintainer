import { Then, When } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';
import { resolveBuild } from '../../steps/support/character-builder.js';
import { ELF_LINEAGE_GRANTS } from '@/lib/sources/species';
import { createChoiceKey } from '@/types/choices';

/**
 * Feature-unique steps for choose-species (resolver seam).
 *
 * Shared Given steps in character-common.steps.ts set `this.resolved` from a
 * build. These steps assert species contributions: racial trait features, the
 * lineage sub-choice, and lineage sub-trait expansion. Trait/label phrases are
 * multi-word, so they use regex step definitions (not {word}). The lineage-label
 * matcher is constrained to (lineage|draconic ancestry) so it cannot collide with
 * the shared "must choose a subclass" step.
 */

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

// --- Racial traits -----------------------------------------------------------

Then(/^the character has the (.+) trait$/, function (this: DndWorld, traitName: string) {
  const slug = slugify(traitName);
  const has = this.resolved!.features.some((f) => f.feature.id.endsWith(slug));
  if (!has) {
    const ids = this.resolved!.features.map((f) => f.feature.id);
    throw new Error(`Expected a feature ending in "${slug}" for trait "${traitName}"; got: ${JSON.stringify(ids)}`);
  }
});

// --- Lineage sub-choice (constrained so it never matches "a subclass") -------

Then(/^the character must choose a (lineage|draconic ancestry)$/, function (this: DndWorld, _label: string) {
  const has = this.resolved!.pendingChoices.some((c) => c.type === 'lineage-choice');
  if (!has) {
    const types = this.resolved!.pendingChoices.map((c) => c.type);
    throw new Error(`Expected a pending lineage-choice; pending choice types were: ${JSON.stringify(types)}`);
  }
});

Then('the character has no lineage choice to make', function (this: DndWorld) {
  const has = this.resolved!.pendingChoices.some((c) => c.type === 'lineage-choice');
  if (has) {
    throw new Error('Expected no pending lineage-choice, but one was present');
  }
});

// --- Choosing a lineage expands its sub-traits -------------------------------

When('the character chooses the Wood Elf lineage', function (this: DndWorld) {
  const lineageKey = createChoiceKey('lineage-choice', 'species', 'elf', 0);
  this.build = {
    ...this.build!,
    choices: {
      ...this.build!.choices,
      [lineageKey]: { type: 'lineage-choice', lineageId: 'wood-elf' },
    },
  };
  this.resolved = resolveBuild(this.build);
});

Then('the character gains the traits of the Wood Elf lineage', function (this: DndWorld) {
  const expectedIds = ELF_LINEAGE_GRANTS['wood-elf']!.filter((g) => g.type === 'feature').map((g) => g.feature.id);
  const resolvedIds = new Set(this.resolved!.features.map((f) => f.feature.id));
  const missing = expectedIds.filter((id) => !resolvedIds.has(id));
  if (missing.length > 0) {
    throw new Error(`Wood Elf lineage traits missing from resolved features: ${JSON.stringify(missing)}`);
  }
});
