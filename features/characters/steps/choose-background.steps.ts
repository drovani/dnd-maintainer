import { Then } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';
import { getBackgroundSource } from '@/lib/sources';
import type { BackgroundId, FeatId, SkillId } from '@/lib/dnd-helpers';

/**
 * Feature-unique steps for choose-background (resolver seam).
 *
 * The shared Given "a new character with the {word} background" sets this.resolved
 * (and this.build). These Then steps assert the BACKGROUND's contribution to the
 * resolved build: fixed skills, a tool proficiency-or-choice, the 2024 three-point
 * ability increase, and the origin feat — each scoped to the background source so
 * the assertion cannot be satisfied by class/species grants.
 */

const SKILL_BY_NAME: Readonly<Record<string, SkillId>> = {
  Athletics: 'athletics',
  Intimidation: 'intimidation',
};

function skillId(name: string): SkillId {
  const id = SKILL_BY_NAME[name];
  if (!id) throw new Error(`Unknown skill name "${name}" — expected one of ${Object.keys(SKILL_BY_NAME).join(', ')}`);
  return id;
}

Then('the character is proficient in the {word} skill', function (this: DndWorld, skillName: string) {
  const id = skillId(skillName);
  const skill = this.resolved!.skills[id];
  if (!skill?.proficient) {
    throw new Error(`Expected proficiency in the ${skillName} skill, but it was not proficient`);
  }
});

Then('the character has a tool proficiency from the background', function (this: DndWorld) {
  // The 2024 rules grant either a fixed tool proficiency or a tool choice. Accept
  // either, scoped to a background source so a class/species tool cannot satisfy it.
  const hasFixedTool = this.resolved!.toolProficiencies.some((t) =>
    t.sources.some((s) => s.origin === 'background')
  );
  const hasToolChoice = this.resolved!.pendingChoices.some(
    (c) => c.type === 'tool-choice' && c.source.origin === 'background'
  );
  if (!hasFixedTool && !hasToolChoice) {
    throw new Error('Expected a background tool proficiency or pending tool choice, but found neither');
  }
});

Then('the background grants {int} points of ability score increases', function (this: DndWorld, points: number) {
  const asi = this.resolved!.pendingChoices.find((c) => c.type === 'asi' && c.source.origin === 'background');
  if (!asi || asi.type !== 'asi') {
    const types = this.resolved!.pendingChoices.map((c) => c.type);
    throw new Error(`Expected a background ASI choice; pending choice types were: ${JSON.stringify(types)}`);
  }
  if (asi.points !== points) {
    throw new Error(`Expected ${points} points of ability score increases, got ${asi.points}`);
  }
});

Then('the character gains an origin feat', function (this: DndWorld) {
  const background = getBackgroundSource(this.build!.backgroundId as BackgroundId);
  const featGrant = background?.grants.find((g) => g.type === 'feat');
  if (!featGrant) {
    throw new Error(`Background "${this.build!.backgroundId}" defines no origin feat grant`);
  }
  const featId = (featGrant as { readonly featId: FeatId }).featId;
  const hasFeat = this.resolved!.features.some((f) => f.source.origin === 'feat' && f.source.id === featId);
  if (!hasFeat) {
    const featSources = this.resolved!.features
      .filter((f) => f.source.origin === 'feat')
      .map((f) => (f.source.origin === 'feat' ? f.source.id : null));
    throw new Error(
      `Expected origin feat "${featId}" in resolved features; feat-origin sources: ${JSON.stringify(featSources)}`
    );
  }
});
