import { describe, it, expect } from 'vitest';
import {
  backgroundHasLaterChoices,
  classHasLaterChoices,
  speciesHasLaterChoices,
} from '@/lib/character-builder/has-later-choices';

describe('has-later-choices', () => {
  describe('speciesHasLaterChoices', () => {
    it('returns true for species with lineage options (e.g. dragonborn, elf)', () => {
      expect(speciesHasLaterChoices('dragonborn')).toBe(true);
      expect(speciesHasLaterChoices('elf')).toBe(true);
    });

    it('returns false for species without sub-choices (e.g. halfling, dwarf)', () => {
      expect(speciesHasLaterChoices('halfling')).toBe(false);
      expect(speciesHasLaterChoices('dwarf')).toBe(false);
    });

    it('detects a pending feat-choice grant as a later choice (Human grants Versatile feat-choice)', () => {
      // Human grants a feat-choice (Versatile) — must trigger the indicator
      expect(speciesHasLaterChoices('human')).toBe(true);
    });
  });

  describe('classHasLaterChoices', () => {
    it('returns true for Fighter (Fighting Style at level 1)', () => {
      expect(classHasLaterChoices('fighter')).toBe(true);
    });

    it('returns true for Barbarian (Weapon Mastery picks at level 1)', () => {
      expect(classHasLaterChoices('barbarian')).toBe(true);
    });

    it('returns false for classes whose only level-1 pick is the universal skill choice (e.g. Wizard)', () => {
      expect(classHasLaterChoices('wizard')).toBe(false);
    });
  });

  describe('backgroundHasLaterChoices', () => {
    it('returns true for any background that grants an origin feat (all 2024 backgrounds)', () => {
      expect(backgroundHasLaterChoices('acolyte')).toBe(true);
      expect(backgroundHasLaterChoices('soldier')).toBe(true);
    });
  });
});
