import { Given, When, Then } from '@cucumber/cucumber';
import { createElement } from 'react';
import type { DndWorld } from '../../steps/support/world.js';
import { resolveBuild } from '../../steps/support/character-builder.js';

// ---------------------------------------------------------------------------
// Level down — resolver seam for the mechanical revert, plus a light
// LevelControls render for the level-1 availability rule.
// ---------------------------------------------------------------------------

When('the most recent level is removed', function (this: DndWorld) {
  const levels = this.build!.levels;
  if (levels.length <= 1) {
    throw new Error('Cannot remove a level below level 1');
  }
  this.build = { ...this.build!, levels: levels.slice(0, -1) };
  this.resolved = resolveBuild(this.build);
  // Mirror onto resolvedAtLevel so the shared "their proficiency bonus is {int}"
  // step (level-up.steps.ts) reads the post-revert character.
  this.resolvedAtLevel = this.resolved;
});

Then('the character is level {int}', function (this: DndWorld, expected: number) {
  const actual = this.build!.levels.length;
  if (actual !== expected) {
    throw new Error(`Expected the character to be level ${expected}, got ${actual}`);
  }
});

// --- Light LevelControls render: the level-1 availability rule ---------------

async function renderLevelControls(world: DndWorld, level: number) {
  const ctxStub = {
    useCharacterContext: () => ({
      level,
      rows: [],
      resolved: null,
      hasDeletedRows: false,
      nextRestoreLevel: null,
      levelUp: () => undefined,
      levelDown: () => undefined,
      undoLevelDown: () => undefined,
    }),
  };
  const mod = await world.esmockWithSupabase('@/components/character-sheet/LevelControls', {
    '@/hooks/useCharacterContext': ctxStub,
    // Stub the heavy level-up dialog — it is closed in these scenarios anyway.
    '@/components/character-sheet/LevelUpDialog': { LevelUpDialog: () => null },
  });
  const LevelControls = (mod as { LevelControls: (p: { classId: string }) => React.ReactElement }).LevelControls;
  return world.renderRoute('/', createElement(LevelControls, { classId: 'fighter' }));
}

function levelDownButton(): HTMLButtonElement | null {
  return (
    (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).find((b) =>
      /Level Down/i.test((b.textContent ?? '').trim())
    ) ?? null
  );
}

Given('a level {int} Fighter is shown on the character sheet', async function (this: DndWorld, level: number) {
  await renderLevelControls(this, level);
});

Then('the Level Down action is unavailable', function (this: DndWorld) {
  const btn = levelDownButton();
  // Unavailable = either not rendered, or rendered disabled. The app hides it.
  if (btn && !btn.disabled) {
    throw new Error('Expected no actionable Level Down control at level 1, but an enabled button was rendered');
  }
});

Then('the Level Down action is available', function (this: DndWorld) {
  const btn = levelDownButton();
  if (!btn || btn.disabled) {
    throw new Error('Expected an actionable Level Down control above level 1, but none was rendered');
  }
});
