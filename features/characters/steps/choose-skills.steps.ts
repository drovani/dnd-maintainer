import { Given, When, Then } from '@cucumber/cucumber';
import type { DndWorld } from '../../steps/support/world.js';
import { makeBuild, makeChoices, resolveBuild } from '../../steps/support/character-builder.js';
import { createChoiceKey } from '@/types/choices';
import type { SkillId } from '@/lib/dnd-helpers';

/**
 * Feature-unique steps for choose-skills (resolver seam).
 *
 * Shared Given/Then phrases (e.g. "a new character with the {word} class and the
 * {word} background", "must choose {int} skills from the {word} skill list") live
 * in character-common.steps.ts and MUST NOT be redefined here.
 *
 * Assertions read this.resolved.skills (Record<SkillId, ResolvedSkill>) and
 * this.resolved.pendingChoices.
 */

const SKILL_BY_NAME: Readonly<Record<string, SkillId>> = {
  Athletics: 'athletics',
  Intimidation: 'intimidation',
  Stealth: 'stealth',
};

function skillId(name: string): SkillId {
  const id = SKILL_BY_NAME[name];
  if (!id) throw new Error(`Unknown skill name "${name}" — extend SKILL_BY_NAME`);
  return id;
}

// --- Rule: skill proficiencies combine across sources -----------------------

Then("the character's skill proficiencies include the soldier background skills", function (this: DndWorld) {
  // The soldier background grants Athletics and Intimidation as fixed
  // (non-choice) skill proficiencies.
  const skills = this.resolved!.skills;
  for (const id of ['athletics', 'intimidation'] as const) {
    if (!skills[id]?.proficient) {
      throw new Error(`Expected proficiency in ${id} from the soldier background, but it was not proficient`);
    }
  }
});

Then('the character may choose additional skills from the {word}', function (this: DndWorld, classId: string) {
  const choice = this.resolved!.pendingChoices.find(
    (c) => c.type === 'skill-choice' && c.choiceKey.includes(`:class:${classId}:`)
  );
  if (!choice) {
    const keys = this.resolved!.pendingChoices.map((c) => c.choiceKey);
    throw new Error(
      `Expected a pending class skill-choice for "${classId}"; pending keys were: ${JSON.stringify(keys)}`
    );
  }
});

// --- Rule: overlapping skill grants are not double-counted ------------------

Given(
  'a new character whose class and background both grant the {word} skill',
  function (this: DndWorld, name: string) {
    const id = skillId(name);
    // Default build is fighter + soldier. Soldier grants Athletics as a fixed
    // proficiency; the fighter class skill-choice picks Athletics too — the same
    // skill granted by two sources.
    const fighterSkillKey = createChoiceKey('skill-choice', 'class', 'fighter', 0);
    this.build = makeBuild({
      classId: 'fighter',
      backgroundId: 'soldier',
      level: 1,
      choices: makeChoices([fighterSkillKey, { type: 'skill-choice', skills: [id] }]),
    });
    this.resolved = resolveBuild(this.build);
  }
);

Then('the character is proficient in the {word} skill exactly once', function (this: DndWorld, name: string) {
  const id = skillId(name);
  const skill = this.resolved!.skills[id];
  if (!skill?.proficient) {
    throw new Error(`Expected proficiency in ${id}, but it was not proficient`);
  }
  // Deduplication invariant: the proficiency bonus is applied once, not once
  // per granting source.
  const proficiencyComponents = skill.breakdown.filter((c) => c.type === 'proficiency');
  if (proficiencyComponents.length !== 1) {
    throw new Error(
      `Expected exactly one proficiency component in ${id} breakdown, got ${proficiencyComponents.length}: ${JSON.stringify(skill.breakdown)}`
    );
  }
  const abilityMod = skill.breakdown.find((c) => c.type === 'ability')?.value ?? 0;
  const pb = this.resolved!.proficiencyBonus;
  const expected = abilityMod + pb;
  if (skill.bonus !== expected) {
    throw new Error(
      `Expected ${id} bonus ${expected} (ability ${abilityMod} + PB ${pb}, counted once), got ${skill.bonus}`
    );
  }
});

// --- Rule: expertise improves a chosen skill --------------------------------

When('the character chooses Expertise in the {word} skill', function (this: DndWorld, name: string) {
  const id = skillId(name);
  // A rogue must first be proficient in the skill (via the class skill-choice)
  // before expertise can double its proficiency bonus.
  const skillKey = createChoiceKey('skill-choice', 'class', 'rogue', 0);
  const expertiseKey = createChoiceKey('expertise-choice', 'class', 'rogue', 0);
  this.build = makeBuild({
    classId: 'rogue',
    level: 1,
    choices: makeChoices(
      [skillKey, { type: 'skill-choice', skills: [id, 'acrobatics', 'perception', 'investigation'] }],
      [expertiseKey, { type: 'expertise-choice', skills: [id, 'acrobatics'], tools: [] }]
    ),
  });
  this.resolved = resolveBuild(this.build);
});

Then('the {word} skill applies double the proficiency bonus', function (this: DndWorld, name: string) {
  const id = skillId(name);
  const skill = this.resolved!.skills[id];
  if (!skill?.proficient) {
    throw new Error(`Expected ${id} to be proficient before expertise applies`);
  }
  if (!skill.expertise) {
    throw new Error(`Expected ${id} to have expertise, but expertise was false`);
  }
  const pb = this.resolved!.proficiencyBonus;
  const expertiseComponent = skill.breakdown.find((c) => c.type === 'expertise');
  if (!expertiseComponent || expertiseComponent.value !== pb) {
    throw new Error(
      `Expected an expertise component worth ${pb} (doubling PB) in ${id} breakdown, got ${JSON.stringify(skill.breakdown)}`
    );
  }
  const abilityMod = skill.breakdown.find((c) => c.type === 'ability')?.value ?? 0;
  const expected = abilityMod + pb * 2;
  if (skill.bonus !== expected) {
    throw new Error(`Expected ${id} bonus ${expected} (ability ${abilityMod} + 2*PB ${pb}), got ${skill.bonus}`);
  }
});
