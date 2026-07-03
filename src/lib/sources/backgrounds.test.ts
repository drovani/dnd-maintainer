import { describe, it, expect } from 'vitest';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';

describe('BACKGROUND_SOURCES', () => {
  it('defines at least one background', () => {
    expect(BACKGROUND_SOURCES.length).toBeGreaterThan(0);
  });

  // Regression for #287: in the 2024 ruleset, backgrounds grant no languages.
  // Every character knows Common + 2 chosen languages, granted by their species.
  // A stray background language-choice produced an erroneous 3rd choice.
  it('no background grants a language proficiency or language choice', () => {
    for (const bg of BACKGROUND_SOURCES) {
      const languageGrants = bg.grants.filter(
        (g) =>
          (g.type === 'proficiency' && g.category === 'language') ||
          (g.type === 'proficiency-choice' && g.category === 'language')
      );
      expect(languageGrants, `background "${bg.id}" must not grant languages in 2024`).toEqual([]);
    }
  });
});
