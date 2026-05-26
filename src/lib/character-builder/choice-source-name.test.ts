import { describe, it, expect, beforeAll } from 'vitest';
import i18next from 'i18next';
import '@/lib/i18n';
import type { TFunction } from 'i18next';
import { getChoiceSourceName } from '@/lib/character-builder/choice-source-name';
import type { ChoiceKey } from '@/types/choices';

let t: TFunction<'gamedata'>;

beforeAll(() => {
  t = i18next.getFixedT('en', 'gamedata') as TFunction<'gamedata'>;
});

describe('getChoiceSourceName', () => {
  it("returns the species display name for a 'species' origin key", () => {
    const result = getChoiceSourceName('language-choice:species:human:0' as ChoiceKey, t);
    expect(result).toBe('Human');
  });

  it("returns the background display name for a 'background' origin key", () => {
    const result = getChoiceSourceName('skill-choice:background:soldier:0' as ChoiceKey, t);
    expect(result).toBe('Soldier');
  });

  it("returns the class display name for a 'class' origin key", () => {
    const result = getChoiceSourceName('skill-choice:class:fighter:0' as ChoiceKey, t);
    expect(result).toBe('Fighter');
  });

  it("returns the subclass display name for a 'subclass' origin key — collegelore", () => {
    const result = getChoiceSourceName('skill-choice:subclass:collegelore:0' as ChoiceKey, t);
    expect(result).toBe('College of Lore');
  });

  it("returns the subclass display name for a 'subclass' origin key — feywanderer", () => {
    const result = getChoiceSourceName('skill-choice:subclass:feywanderer:0' as ChoiceKey, t);
    expect(result).toBe('Fey Wanderer');
  });

  it("returns the subclass display name for a 'subclass' origin key — greatoldonepatron", () => {
    const result = getChoiceSourceName('skill-choice:subclass:greatoldonepatron:1' as ChoiceKey, t);
    expect(result).toBe('The Great Old One Patron');
  });
});
