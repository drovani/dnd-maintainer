import { describe, it, expect } from 'vitest';
import { FEAT_SOURCES } from '@/lib/sources/feats';
import { FEAT_CATEGORIES } from '@/types/sources';
import type { FeatCategory } from '@/types/sources';

const BACKGROUND_ORIGIN_FEAT_IDS = [
  'alert',
  'crafter',
  'healer',
  'lucky',
  'magic-initiate',
  'musician',
  'savage-attacker',
  'skilled',
  'tavern-brawler',
  'tough',
] as const;

describe('FEAT_SOURCES', () => {
  it.each(BACKGROUND_ORIGIN_FEAT_IDS)('background-referenced feat "%s" exists in FEAT_SOURCES', (featId) => {
    const source = FEAT_SOURCES.find((f) => f.id === featId);
    expect(source).toBeDefined();
  });

  it('every feat has a valid category', () => {
    const validCategories = new Set<FeatCategory>(FEAT_CATEGORIES);
    for (const feat of FEAT_SOURCES) {
      expect(validCategories.has(feat.category), `feat "${feat.id}" has invalid category "${feat.category}"`).toBe(
        true
      );
    }
  });

  it('all background-referenced feats have origin category', () => {
    for (const featId of BACKGROUND_ORIGIN_FEAT_IDS) {
      const source = FEAT_SOURCES.find((f) => f.id === featId);
      expect(source?.category, `feat "${featId}" should have origin category`).toBe('origin');
    }
  });

  it('all general feats have a level-minimum prerequisite of 4', () => {
    const generalFeats = FEAT_SOURCES.filter((f) => f.category === 'general');
    expect(generalFeats.length).toBeGreaterThan(0);
    for (const feat of generalFeats) {
      const levelPrereq = feat.prerequisites.find((p) => p.type === 'level-minimum');
      expect(levelPrereq, `general feat "${feat.id}" missing level-minimum prerequisite`).toBeDefined();
      if (levelPrereq?.type === 'level-minimum') {
        expect(levelPrereq.level, `general feat "${feat.id}" should require level 4`).toBe(4);
      }
    }
  });

  it('all epic boon feats have a level-minimum prerequisite of 19', () => {
    const epicBoonFeats = FEAT_SOURCES.filter((f) => f.category === 'epicBoon');
    expect(epicBoonFeats.length).toBeGreaterThan(0);
    for (const feat of epicBoonFeats) {
      const levelPrereq = feat.prerequisites.find((p) => p.type === 'level-minimum');
      expect(levelPrereq, `epic boon feat "${feat.id}" missing level-minimum prerequisite`).toBeDefined();
      if (levelPrereq?.type === 'level-minimum') {
        expect(levelPrereq.level, `epic boon feat "${feat.id}" should require level 19`).toBe(19);
      }
    }
  });

  it('every feat has at least one grant', () => {
    for (const feat of FEAT_SOURCES) {
      expect(feat.grants.length, `feat "${feat.id}" has no grants`).toBeGreaterThan(0);
    }
  });

  it('has no duplicate feat IDs', () => {
    const ids = FEAT_SOURCES.map((f) => f.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has exactly 74 entries', () => {
    expect(FEAT_SOURCES).toHaveLength(74);
  });

  it('all fightingStyle feats have no prerequisites', () => {
    const feats = FEAT_SOURCES.filter((f) => f.category === 'fightingStyle');
    expect(feats.length).toBeGreaterThan(0);
    for (const feat of feats) {
      expect(feat.prerequisites).toHaveLength(0);
    }
  });

  it('defense fightingStyle feat grants both a feature and an ac-bonus of 1', () => {
    const defense = FEAT_SOURCES.find((f) => f.id === 'defense');
    expect(defense?.grants).toHaveLength(2);
    expect(defense?.grants.some((g) => g.type === 'feature')).toBe(true);
    expect(defense?.grants.some((g) => g.type === 'ac-bonus' && g.bonus === 1)).toBe(true);
  });

  describe('collapsed repeatable feats', () => {
    it('magic-initiate is marked repeatable: true', () => {
      const feat = FEAT_SOURCES.find((f) => f.id === 'magic-initiate');
      expect(feat?.repeatable).toBe(true);
    });

    it('elemental-adept is marked repeatable: true', () => {
      const feat = FEAT_SOURCES.find((f) => f.id === 'elemental-adept');
      expect(feat?.repeatable).toBe(true);
    });

    it('resilient is marked repeatable: true', () => {
      const feat = FEAT_SOURCES.find((f) => f.id === 'resilient');
      expect(feat?.repeatable).toBe(true);
    });

    it('magic-initiate has 6 feature-choice options (bard/cleric/druid/sorcerer/warlock/wizard)', () => {
      const feat = FEAT_SOURCES.find((f) => f.id === 'magic-initiate');
      const choiceGrant = feat?.grants.find((g) => g.type === 'feature-choice');
      expect(choiceGrant).toBeDefined();
      if (choiceGrant?.type === 'feature-choice') {
        const optionIds = choiceGrant.options.map((o) => o.optionId);
        expect(optionIds).toEqual(['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard']);
      }
    });

    it('elemental-adept has 5 feature-choice options (acid/cold/fire/lightning/thunder)', () => {
      const feat = FEAT_SOURCES.find((f) => f.id === 'elemental-adept');
      const choiceGrant = feat?.grants.find((g) => g.type === 'feature-choice');
      expect(choiceGrant).toBeDefined();
      if (choiceGrant?.type === 'feature-choice') {
        const optionIds = choiceGrant.options.map((o) => o.optionId);
        expect(optionIds).toEqual(['acid', 'cold', 'fire', 'lightning', 'thunder']);
      }
    });

    it('resilient has 6 feature-choice options including charisma', () => {
      const feat = FEAT_SOURCES.find((f) => f.id === 'resilient');
      const choiceGrant = feat?.grants.find((g) => g.type === 'feature-choice');
      expect(choiceGrant).toBeDefined();
      if (choiceGrant?.type === 'feature-choice') {
        const optionIds = choiceGrant.options.map((o) => o.optionId);
        expect(optionIds).toContain('charisma');
        expect(optionIds).toHaveLength(6);
        expect(optionIds).toEqual(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']);
      }
    });

    it.each(['magic-initiate', 'elemental-adept', 'resilient'] as const)(
      '%s: each option has grants: [] and featureId matching feat-<feat>-<optionId>',
      (featId) => {
        const feat = FEAT_SOURCES.find((f) => f.id === featId);
        const choiceGrant = feat?.grants.find((g) => g.type === 'feature-choice');
        expect(choiceGrant).toBeDefined();
        if (choiceGrant?.type === 'feature-choice') {
          for (const option of choiceGrant.options) {
            expect(
              option.grants,
              `${featId} option "${option.optionId}" should have empty grants (double-grant guard)`
            ).toHaveLength(0);
            expect(
              option.featureId,
              `${featId} option "${option.optionId}" featureId should be feat-${featId}-${option.optionId}`
            ).toBe(`feat-${featId}-${option.optionId}`);
          }
        }
      }
    );
  });
});
