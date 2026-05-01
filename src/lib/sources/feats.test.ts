import { describe, it, expect } from 'vitest';
import { FEAT_SOURCES } from '@/lib/sources/feats';
import { FEAT_CATEGORIES } from '@/types/sources';
import type { FeatCategory } from '@/types/sources';

const BACKGROUND_ORIGIN_FEAT_IDS = [
  'alert',
  'crafter',
  'healer',
  'lucky',
  'magic-initiate-cleric',
  'magic-initiate-druid',
  'magic-initiate-wizard',
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
});
