import { describe, it, expect } from 'vitest';
import { getSubclassSource } from '@/lib/sources';
import type { SubclassId } from '@/lib/sources/subclasses';
import { createChoiceKey } from '@/types/choices';

describe('assassin skill-expertise grant', () => {
  it('assassin level 9 has exactly 2 grants: feature and skill-expertise: deception', () => {
    const source = getSubclassSource('assassin');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9!.grants).toHaveLength(2);
    expect(level9!.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'assassin-infiltration-expertise' }),
        }),
        expect.objectContaining({ type: 'skill-expertise', skill: 'deception' }),
      ])
    );
  });
});

describe('thief skill-expertise grant', () => {
  it('thief level 9 has exactly 2 grants: feature and skill-expertise: stealth', () => {
    const source = getSubclassSource('thief');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9!.grants).toHaveLength(2);
    expect(level9!.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'thief-supreme-sneak' }) }),
        expect.objectContaining({ type: 'skill-expertise', skill: 'stealth' }),
      ])
    );
  });

  it('thief level 3 has Second-Story Work walk-equivalent climb grant (2024 PHB)', () => {
    const source = getSubclassSource('thief');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3!.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'thief-second-story-work' }),
        }),
        expect.objectContaining({ type: 'speed', mode: 'climb', value: 'walk-equivalent' }),
      ])
    );
  });
});

describe('getSubclassSource — Champion', () => {
  it('returns defined for champion', () => {
    expect(getSubclassSource('champion')).toBeDefined();
  });

  it('champion has 5 features', () => {
    const source = getSubclassSource('champion');
    expect(source?.features).toHaveLength(5);
  });

  it('champion level 3 feature grants champion-improved-critical', () => {
    const source = getSubclassSource('champion');
    const level3Feature = source?.features.find((f) => f.classLevel === 3);
    expect(level3Feature).toBeDefined();
    expect(level3Feature?.grants).toHaveLength(1);
    const grant = level3Feature?.grants[0];
    expect(grant?.type).toBe('feature');
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('champion-improved-critical');
    }
  });

  it('champion level 7 feature grants remarkable athlete with ability-check-bonus', () => {
    const source = getSubclassSource('champion');
    const level7Feature = source?.features.find((f) => f.classLevel === 7);
    expect(level7Feature).toBeDefined();
    expect(level7Feature?.grants).toHaveLength(2);
    expect(level7Feature?.grants[0]).toMatchObject({ type: 'feature', feature: { id: 'champion-remarkable-athlete' } });
    expect(level7Feature?.grants[1]).toMatchObject({
      type: 'ability-check-bonus',
      abilities: ['str', 'dex', 'con'],
      value: 'half-proficiency',
      onlyWhenNotProficient: true,
      featureId: 'champion-remarkable-athlete',
    });
  });

  it('champion level 10 grants a fighting-style-choice', () => {
    const source = getSubclassSource('champion');
    const level10Feature = source?.features.find((f) => f.classLevel === 10);
    expect(level10Feature).toBeDefined();
    expect(level10Feature?.grants).toHaveLength(1);
    const grant = level10Feature?.grants[0];
    expect(grant?.type).toBe('fighting-style-choice');
  });

  it('champion feature classLevels are 3, 7, 10, 15, 18', () => {
    const source = getSubclassSource('champion');
    const levels = source?.features.map((f) => f.classLevel);
    expect(levels).toEqual([3, 7, 10, 15, 18]);
  });
});

describe('getSubclassSource — Berserker', () => {
  it('returns defined for berserker', () => {
    expect(getSubclassSource('berserker')).toBeDefined();
  });

  it('berserker has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('berserker');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('berserker level 3 grants 2 features: frenzy and mindless-rage', () => {
    const source = getSubclassSource('berserker');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'berserker-frenzy' }) }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'berserker-mindless-rage' }),
        }),
      ])
    );
  });

  it('berserker level 6 grants retaliation feature', () => {
    const source = getSubclassSource('berserker');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'berserker-retaliation' },
    });
  });

  it('berserker level 10 grants intimidating-presence feature', () => {
    const source = getSubclassSource('berserker');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'berserker-intimidating-presence' },
    });
  });
});

describe('getSubclassSource — Wild Heart', () => {
  it('returns defined for wildheart', () => {
    expect(getSubclassSource('wildheart')).toBeDefined();
  });

  it('wildheart has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('wildheart');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('wildheart level 3 grants 2 grants: speak-with-animals spell and rage-of-the-wilds', () => {
    const source = getSubclassSource('wildheart');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'spell',
          spellId: 'speak-with-animals',
          alwaysPrepared: true,
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'wildheart-rage-of-the-wilds' }),
        }),
      ])
    );
  });

  it('wildheart level 6 grants aspect-of-the-wilds feature', () => {
    const source = getSubclassSource('wildheart');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'wildheart-aspect-of-the-wilds' },
    });
  });

  it('wildheart level 10 grants commune-with-nature spell (always prepared)', () => {
    const source = getSubclassSource('wildheart');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'spell',
      spellId: 'commune-with-nature',
      alwaysPrepared: true,
    });
  });
});

describe('getSubclassSource — World Tree', () => {
  it('returns defined for worldtree', () => {
    expect(getSubclassSource('worldtree')).toBeDefined();
  });

  it('worldtree has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('worldtree');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('worldtree level 3 grants vitality-of-the-tree feature', () => {
    const source = getSubclassSource('worldtree');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(1);
    expect(level3?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'worldtree-vitality-of-the-tree' },
    });
  });

  it('worldtree level 6 grants branches-of-the-tree feature', () => {
    const source = getSubclassSource('worldtree');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'worldtree-branches-of-the-tree' },
    });
  });

  it('worldtree level 10 grants battering-roots feature', () => {
    const source = getSubclassSource('worldtree');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'worldtree-battering-roots' },
    });
  });
});

describe('getSubclassSource — Zealot', () => {
  it('returns defined for zealot', () => {
    expect(getSubclassSource('zealot')).toBeDefined();
  });

  it('zealot has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('zealot');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('zealot level 3 grants a damage-choice for Divine Fury and the Warrior of the Gods feature', () => {
    const source = getSubclassSource('zealot');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'damage-choice',
          count: 1,
          from: ['radiant', 'necrotic'],
          featureIdPrefix: 'zealot-divine-fury',
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'zealot-warrior-of-the-gods' }),
        }),
      ])
    );
  });

  it('zealot level 6 grants fanatical-focus feature', () => {
    const source = getSubclassSource('zealot');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'zealot-fanatical-focus' },
    });
  });

  it('zealot level 10 grants zealous-presence feature', () => {
    const source = getSubclassSource('zealot');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'zealot-zealous-presence' },
    });
  });
});

describe('getSubclassSource — College of Dance', () => {
  it('returns defined for collegedance', () => {
    expect(getSubclassSource('collegedance')).toBeDefined();
  });

  it('collegedance has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('collegedance');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('collegedance level 3 grants 4 items: armor-class + 3 features (inspirational-dance, unarmored-defense, frolicking-steps)', () => {
    const source = getSubclassSource('collegedance');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(4);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'armor-class',
          calculation: { mode: 'unarmored', formula: 'dance' },
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'collegedance-inspirational-dance' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'collegedance-unarmored-defense' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'collegedance-frolicking-steps' }),
        }),
      ])
    );
  });

  it('collegedance level 3 armor-class grant has dance unarmored formula', () => {
    const source = getSubclassSource('collegedance');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const acGrant = level3?.grants.find((g) => g.type === 'armor-class');
    expect(acGrant).toBeDefined();
    expect(acGrant).toMatchObject({ type: 'armor-class', calculation: { mode: 'unarmored', formula: 'dance' } });
  });

  it('collegedance level 6 grants dance-of-victory feature', () => {
    const source = getSubclassSource('collegedance');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'collegedance-dance-of-victory' },
    });
  });
});

describe('getSubclassSource — College of Glamour', () => {
  it('returns defined for collegeglamour', () => {
    expect(getSubclassSource('collegeglamour')).toBeDefined();
  });

  it('collegeglamour has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('collegeglamour');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('collegeglamour level 3 grants 2 features: mantle-of-inspiration and enthralling-performance', () => {
    const source = getSubclassSource('collegeglamour');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'collegeglamour-mantle-of-inspiration' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'collegeglamour-enthralling-performance' }),
        }),
      ])
    );
  });

  it('collegeglamour level 6 grants mantle-of-majesty feature', () => {
    const source = getSubclassSource('collegeglamour');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'collegeglamour-mantle-of-majesty' },
    });
  });
});

describe('getSubclassSource — College of Lore', () => {
  it('returns defined for collegelore', () => {
    expect(getSubclassSource('collegelore')).toBeDefined();
  });

  it('collegelore has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('collegelore');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('collegelore level 3 grants 2 items: skill proficiency-choice and cutting-words feature', () => {
    const source = getSubclassSource('collegelore');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'proficiency-choice',
          category: 'skill',
          count: 3,
          from: null,
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'collegelore-cutting-words' }),
        }),
      ])
    );
  });

  it('collegelore level 3 proficiency-choice key has subclass origin', () => {
    const source = getSubclassSource('collegelore');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const profChoice = level3?.grants.find((g) => g.type === 'proficiency-choice');
    expect(profChoice).toBeDefined();
    expect((profChoice as { key: string }).key).toBe(createChoiceKey('skill-choice', 'subclass', 'collegelore', 0));
  });

  it('collegelore level 6 grants magical-secrets feature', () => {
    const source = getSubclassSource('collegelore');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'collegelore-magical-secrets' },
    });
  });
});

describe('getSubclassSource — College of Valor', () => {
  it('returns defined for collegevalor', () => {
    expect(getSubclassSource('collegevalor')).toBeDefined();
  });

  it('collegevalor has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('collegevalor');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('collegevalor level 3 grants 4 items: medium armor, shields, martial weapons proficiencies and combat-inspiration', () => {
    const source = getSubclassSource('collegevalor');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(4);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'proficiency', category: 'armor', id: 'medium' }),
        expect.objectContaining({ type: 'proficiency', category: 'armor', id: 'shields' }),
        expect.objectContaining({ type: 'proficiency', category: 'weapon', id: 'martial' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'collegevalor-combat-inspiration' }),
        }),
      ])
    );
  });

  it('collegevalor level 6 grants extra-attack feature', () => {
    const source = getSubclassSource('collegevalor');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'collegevalor-extra-attack' },
    });
  });
});

describe('getSubclassSource — Life Domain', () => {
  it('returns defined for lifedomain', () => {
    expect(getSubclassSource('lifedomain')).toBeDefined();
  });

  it('lifedomain has 5 feature levels (L3, L5, L6, L7, L9)', () => {
    const source = getSubclassSource('lifedomain');
    expect(source?.features).toHaveLength(5);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9]);
  });

  it('lifedomain level 3 grants heavy armor, disciple-of-life, preserve-life, and 4 domain spell grants', () => {
    const source = getSubclassSource('lifedomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(7);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'proficiency', category: 'armor', id: 'heavy' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lifedomain-disciple-of-life' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lifedomain-preserve-life' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'aid', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'bless', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'cure-wounds', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'lesser-restoration', alwaysPrepared: true }),
      ])
    );
  });

  it('lifedomain level 3 has no domain-spells inert feature grant', () => {
    const source = getSubclassSource('lifedomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const inertGrant = level3?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'lifedomain-domain-spells'
    );
    expect(inertGrant).toBeUndefined();
  });

  it('lifedomain level 5 grants mass-healing-word and revivify (alwaysPrepared)', () => {
    const source = getSubclassSource('lifedomain');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'mass-healing-word', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'revivify', alwaysPrepared: true }),
      ])
    );
  });

  it('lifedomain level 6 grants the Blessed Healer feature (not Blessed Strikes; 2024 PHB)', () => {
    const source = getSubclassSource('lifedomain');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'lifedomain-blessed-healer' },
    });
  });

  it('lifedomain level 7 grants aura-of-life and death-ward (alwaysPrepared)', () => {
    const source = getSubclassSource('lifedomain');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'aura-of-life', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'death-ward', alwaysPrepared: true }),
      ])
    );
  });

  it('lifedomain level 9 grants greater-restoration and mass-cure-wounds (alwaysPrepared)', () => {
    const source = getSubclassSource('lifedomain');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'greater-restoration', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'mass-cure-wounds', alwaysPrepared: true }),
      ])
    );
  });
});

describe('getSubclassSource — Light Domain', () => {
  it('returns defined for lightdomain', () => {
    expect(getSubclassSource('lightdomain')).toBeDefined();
  });

  it('lightdomain has 5 feature levels (L3, L5, L6, L7, L9)', () => {
    const source = getSubclassSource('lightdomain');
    expect(source?.features).toHaveLength(5);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9]);
  });

  it('lightdomain level 3 grants light cantrip, warding-flare, radiance-of-the-dawn, and 4 domain spell grants', () => {
    const source = getSubclassSource('lightdomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(7);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'light', alwaysPrepared: true }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lightdomain-warding-flare' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lightdomain-radiance-of-the-dawn' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'burning-hands', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'faerie-fire', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'scorching-ray', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'see-invisibility', alwaysPrepared: true }),
      ])
    );
  });

  it('lightdomain level 3 has no bonus-cantrip inert feature grant', () => {
    const source = getSubclassSource('lightdomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const inertGrant = level3?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'lightdomain-bonus-cantrip'
    );
    expect(inertGrant).toBeUndefined();
  });

  it('lightdomain level 3 has no domain-spells inert feature grant', () => {
    const source = getSubclassSource('lightdomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const inertGrant = level3?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'lightdomain-domain-spells'
    );
    expect(inertGrant).toBeUndefined();
  });

  it('lightdomain level 5 grants daylight and fireball (alwaysPrepared)', () => {
    const source = getSubclassSource('lightdomain');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'daylight', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'fireball', alwaysPrepared: true }),
      ])
    );
  });

  it('lightdomain level 6 grants improved-warding-flare feature', () => {
    const source = getSubclassSource('lightdomain');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'lightdomain-improved-warding-flare' },
    });
  });

  it('lightdomain level 7 grants arcane-eye and wall-of-fire (alwaysPrepared)', () => {
    const source = getSubclassSource('lightdomain');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'arcane-eye', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'wall-of-fire', alwaysPrepared: true }),
      ])
    );
  });

  it('lightdomain level 9 grants flame-strike and scrying (alwaysPrepared)', () => {
    const source = getSubclassSource('lightdomain');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'flame-strike', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'scrying', alwaysPrepared: true }),
      ])
    );
  });
});

describe('getSubclassSource — Trickery Domain', () => {
  it('returns defined for trickerydomain', () => {
    expect(getSubclassSource('trickerydomain')).toBeDefined();
  });

  it('trickerydomain has 5 feature levels (L3, L5, L6, L7, L9)', () => {
    const source = getSubclassSource('trickerydomain');
    expect(source?.features).toHaveLength(5);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9]);
  });

  it('trickerydomain level 3 grants blessing-of-the-trickster, invoke-duplicity, and 4 domain spell grants', () => {
    const source = getSubclassSource('trickerydomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(6);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'trickerydomain-blessing-of-the-trickster' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'trickerydomain-invoke-duplicity' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'charm-person', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'disguise-self', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'invisibility', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'pass-without-trace', alwaysPrepared: true }),
      ])
    );
  });

  it('trickerydomain level 3 has no domain-spells inert feature grant', () => {
    const source = getSubclassSource('trickerydomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const inertGrant = level3?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'trickerydomain-domain-spells'
    );
    expect(inertGrant).toBeUndefined();
  });

  it('trickerydomain level 5 grants hypnotic-pattern and nondetection (alwaysPrepared)', () => {
    const source = getSubclassSource('trickerydomain');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'hypnotic-pattern', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'nondetection', alwaysPrepared: true }),
      ])
    );
  });

  it('trickerydomain level 6 grants tricksters-transposition feature', () => {
    const source = getSubclassSource('trickerydomain');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'trickerydomain-tricksters-transposition' },
    });
  });

  it('trickerydomain level 7 grants confusion and dimension-door (alwaysPrepared)', () => {
    const source = getSubclassSource('trickerydomain');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'confusion', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'dimension-door', alwaysPrepared: true }),
      ])
    );
  });

  it('trickerydomain level 9 grants dominate-person and modify-memory (alwaysPrepared)', () => {
    const source = getSubclassSource('trickerydomain');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'dominate-person', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'modify-memory', alwaysPrepared: true }),
      ])
    );
  });
});

describe('getSubclassSource — War Domain', () => {
  it('returns defined for wardomain', () => {
    expect(getSubclassSource('wardomain')).toBeDefined();
  });

  it('wardomain has 5 feature levels (L3, L5, L6, L7, L9)', () => {
    const source = getSubclassSource('wardomain');
    expect(source?.features).toHaveLength(5);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9]);
  });

  it('wardomain level 3 grants heavy armor, martial weapons, war-priest, guided-strike, and 4 domain spell grants', () => {
    const source = getSubclassSource('wardomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(8);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'proficiency', category: 'armor', id: 'heavy' }),
        expect.objectContaining({ type: 'proficiency', category: 'weapon', id: 'martial' }),
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'wardomain-war-priest' }) }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'wardomain-guided-strike' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'guiding-bolt', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'magic-weapon', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'shield-of-faith', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'spiritual-weapon', alwaysPrepared: true }),
      ])
    );
  });

  it('wardomain level 3 has no domain-spells inert feature grant', () => {
    const source = getSubclassSource('wardomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const inertGrant = level3?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'wardomain-domain-spells'
    );
    expect(inertGrant).toBeUndefined();
  });

  it('wardomain level 5 grants crusaders-mantle and spirit-guardians (alwaysPrepared)', () => {
    const source = getSubclassSource('wardomain');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'crusaders-mantle', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'spirit-guardians', alwaysPrepared: true }),
      ])
    );
  });

  it('wardomain level 6 grants war-gods-blessing feature', () => {
    const source = getSubclassSource('wardomain');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'wardomain-war-gods-blessing' },
    });
  });

  it('wardomain level 7 grants fire-shield and freedom-of-movement (alwaysPrepared)', () => {
    const source = getSubclassSource('wardomain');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'fire-shield', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true }),
      ])
    );
  });

  it('wardomain level 9 grants hold-monster and steel-wind-strike (alwaysPrepared)', () => {
    const source = getSubclassSource('wardomain');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'hold-monster', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'steel-wind-strike', alwaysPrepared: true }),
      ])
    );
  });
});

describe('getSubclassSource — Circle of the Land', () => {
  it('returns defined for circleland', () => {
    expect(getSubclassSource('circleland')).toBeDefined();
  });

  it('circleland has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('circleland');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('circleland level 3 grants 3 features: lands-aid, bonus-cantrip, bonus-spells', () => {
    const source = getSubclassSource('circleland');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'circleland-lands-aid' }) }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'circleland-bonus-cantrip' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'circleland-bonus-spells' }),
        }),
      ])
    );
  });

  it('circleland level 6 grants natural-recovery feature', () => {
    const source = getSubclassSource('circleland');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'circleland-natural-recovery' },
    });
  });

  it('circleland level 10 grants natures-ward feature', () => {
    const source = getSubclassSource('circleland');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'circleland-natures-ward' },
    });
  });
});

describe('getSubclassSource — Circle of the Moon', () => {
  it('returns defined for circlemoon', () => {
    expect(getSubclassSource('circlemoon')).toBeDefined();
  });

  it('circlemoon has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('circlemoon');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('circlemoon level 3 grants 2 features: circle-forms and improved-wild-shape', () => {
    const source = getSubclassSource('circlemoon');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'circlemoon-circle-forms' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'circlemoon-improved-wild-shape' }),
        }),
      ])
    );
  });

  it('circlemoon level 6 grants improved-circle-forms feature', () => {
    const source = getSubclassSource('circlemoon');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'circlemoon-improved-circle-forms' },
    });
  });

  it('circlemoon level 10 grants elemental-wild-shape feature', () => {
    const source = getSubclassSource('circlemoon');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'circlemoon-elemental-wild-shape' },
    });
  });
});

describe('getSubclassSource — Circle of the Sea', () => {
  it('returns defined for circlesea', () => {
    expect(getSubclassSource('circlesea')).toBeDefined();
  });

  it('circlesea has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('circlesea');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('circlesea level 3 grants 1 feature: wrath-of-the-sea', () => {
    const source = getSubclassSource('circlesea');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(1);
    expect(level3?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'circlesea-wrath-of-the-sea' },
    });
  });

  it('circlesea level 6 grants 2 items: walk-equivalent swim speed grant and aquatic-affinity feature', () => {
    const source = getSubclassSource('circlesea');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(2);
    expect(level6?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'speed', mode: 'swim', value: 'walk-equivalent' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'circlesea-aquatic-affinity' }),
        }),
      ])
    );
  });

  it('circlesea level 10 grants stormborn feature', () => {
    const source = getSubclassSource('circlesea');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'circlesea-stormborn' },
    });
  });
});

describe('getSubclassSource — Circle of Stars', () => {
  it('returns defined for circlestars', () => {
    expect(getSubclassSource('circlestars')).toBeDefined();
  });

  it('circlestars has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('circlestars');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('circlestars level 3 grants 2 features: star-map and starry-form', () => {
    const source = getSubclassSource('circlestars');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'circlestars-star-map' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'circlestars-starry-form' }),
        }),
      ])
    );
  });

  it('circlestars level 6 grants cosmic-omen feature', () => {
    const source = getSubclassSource('circlestars');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'circlestars-cosmic-omen' },
    });
  });

  it('circlestars level 10 grants twinkling-constellations feature', () => {
    const source = getSubclassSource('circlestars');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'circlestars-twinkling-constellations' },
    });
  });
});

describe('getSubclassSource — Psi Warrior', () => {
  it('returns defined for psiwarrior', () => {
    expect(getSubclassSource('psiwarrior')).toBeDefined();
  });

  it('psiwarrior has 3 feature levels (L3, L7, L10)', () => {
    const source = getSubclassSource('psiwarrior');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7, 10]);
  });

  it('psiwarrior level 3 grants 1 feature: psionic-power', () => {
    const source = getSubclassSource('psiwarrior');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(1);
    expect(level3?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'psiwarrior-psionic-power' },
    });
  });

  it('psiwarrior level 7 grants 1 feature: telekinetic-adept', () => {
    const source = getSubclassSource('psiwarrior');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'psiwarrior-telekinetic-adept' },
    });
  });

  it('psiwarrior level 10 grants 2 items: psychic resistance and guarded-mind feature', () => {
    const source = getSubclassSource('psiwarrior');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(2);
    expect(level10?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'resistance', damageType: 'psychic' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'psiwarrior-guarded-mind' }),
        }),
      ])
    );
  });
});

describe('getSubclassSource — Warrior of Mercy', () => {
  it('returns defined for warriorofmercy', () => {
    expect(getSubclassSource('warriorofmercy')).toBeDefined();
  });

  it('warriorofmercy has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('warriorofmercy');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('warriorofmercy level 3 grants Implements of Mercy proficiencies plus hand-of-healing and hand-of-harm', () => {
    const source = getSubclassSource('warriorofmercy');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'warriorofmercy-implements-of-mercy' }),
        }),
        { type: 'proficiency', category: 'skill', id: 'insight' },
        { type: 'proficiency', category: 'skill', id: 'medicine' },
        { type: 'proficiency', category: 'tool', id: 'herbalismkit' },
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'warriorofmercy-hand-of-healing' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'warriorofmercy-hand-of-harm' }),
        }),
      ])
    );
  });

  it('warriorofmercy level 6 grants physicians-touch feature', () => {
    const source = getSubclassSource('warriorofmercy');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'warriorofmercy-physicians-touch', saveDC: { dcAbility: 'wis' } },
    });
  });
});

describe('getSubclassSource — Warrior of Shadow', () => {
  it('returns defined for warriorofshadow', () => {
    expect(getSubclassSource('warriorofshadow')).toBeDefined();
  });

  it('warriorofshadow has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('warriorofshadow');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('warriorofshadow level 3 grants 1 feature: shadow-arts', () => {
    const source = getSubclassSource('warriorofshadow');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(1);
    expect(level3?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'warriorofshadow-shadow-arts' },
    });
  });

  it('warriorofshadow level 6 grants shadow-step feature', () => {
    const source = getSubclassSource('warriorofshadow');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'warriorofshadow-shadow-step' },
    });
  });
});

describe('getSubclassSource — Warrior of the Elements', () => {
  it('returns defined for warriorofelements', () => {
    expect(getSubclassSource('warriorofelements')).toBeDefined();
  });

  it('warriorofelements has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('warriorofelements');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('warriorofelements level 3 grants 2 features: elemental-attunement and manipulate-elements', () => {
    const source = getSubclassSource('warriorofelements');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'warriorofelements-elemental-attunement' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'warriorofelements-manipulate-elements' }),
        }),
      ])
    );
  });

  it('warriorofelements level 6 grants elemental-burst feature', () => {
    const source = getSubclassSource('warriorofelements');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'warriorofelements-elemental-burst', saveDC: { dcAbility: 'wis' } },
    });
  });
});

describe('getSubclassSource — Warrior of the Open Hand', () => {
  it('returns defined for warrioropenhand', () => {
    expect(getSubclassSource('warrioropenhand')).toBeDefined();
  });

  it('warrioropenhand has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('warrioropenhand');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('warrioropenhand level 3 grants 1 feature: open-hand-technique', () => {
    const source = getSubclassSource('warrioropenhand');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(1);
    expect(level3?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'warrioropenhand-open-hand-technique', saveDC: { dcAbility: 'wis' } },
    });
  });

  it('warrioropenhand level 6 grants wholeness-of-body feature', () => {
    const source = getSubclassSource('warrioropenhand');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'warrioropenhand-wholeness-of-body' },
    });
  });
});

describe('getSubclassSource — Oath of Devotion', () => {
  it('returns defined for oathofdevotion', () => {
    expect(getSubclassSource('oathofdevotion')).toBeDefined();
  });

  it('oathofdevotion has 2 feature levels (L3, L7)', () => {
    const source = getSubclassSource('oathofdevotion');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7]);
  });

  it('oathofdevotion level 3 grants 3 items: sacred-weapon, holy-rebuke, and oath-spells', () => {
    const source = getSubclassSource('oathofdevotion');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofdevotion-sacred-weapon' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofdevotion-holy-rebuke' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofdevotion-oath-spells' }),
        }),
      ])
    );
  });

  it('oathofdevotion level 7 grants aura-of-devotion feature', () => {
    const source = getSubclassSource('oathofdevotion');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'oathofdevotion-aura-of-devotion' },
    });
  });
});

describe('getSubclassSource — Oath of Glory', () => {
  it('returns defined for oathofglory', () => {
    expect(getSubclassSource('oathofglory')).toBeDefined();
  });

  it('oathofglory has 2 feature levels (L3, L7)', () => {
    const source = getSubclassSource('oathofglory');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7]);
  });

  it('oathofglory level 3 grants 3 items: peerless-athlete, inspiring-smite, and oath-spells', () => {
    const source = getSubclassSource('oathofglory');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofglory-peerless-athlete' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofglory-inspiring-smite' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofglory-oath-spells' }),
        }),
      ])
    );
  });

  it('oathofglory level 7 grants aura-of-alacrity feature', () => {
    const source = getSubclassSource('oathofglory');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'oathofglory-aura-of-alacrity' },
    });
  });
});

describe('getSubclassSource — Oath of the Ancients', () => {
  it('returns defined for oathofancients', () => {
    expect(getSubclassSource('oathofancients')).toBeDefined();
  });

  it('oathofancients has 2 feature levels (L3, L7)', () => {
    const source = getSubclassSource('oathofancients');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7]);
  });

  it('oathofancients level 3 grants 3 items: natures-wrath, turn-the-faithless, and oath-spells', () => {
    const source = getSubclassSource('oathofancients');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofancients-natures-wrath' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofancients-turn-the-faithless' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofancients-oath-spells' }),
        }),
      ])
    );
  });

  it('oathofancients level 7 grants aura-of-warding feature', () => {
    const source = getSubclassSource('oathofancients');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'oathofancients-aura-of-warding' },
    });
  });
});

describe('getSubclassSource — Oath of Vengeance', () => {
  it('returns defined for oathofvengeance', () => {
    expect(getSubclassSource('oathofvengeance')).toBeDefined();
  });

  it('oathofvengeance has 2 feature levels (L3, L7)', () => {
    const source = getSubclassSource('oathofvengeance');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7]);
  });

  it('oathofvengeance level 3 grants 3 items: vow-of-enmity, abjure-enemy, and oath-spells', () => {
    const source = getSubclassSource('oathofvengeance');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofvengeance-vow-of-enmity' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofvengeance-abjure-enemy' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofvengeance-oath-spells' }),
        }),
      ])
    );
  });

  it('oathofvengeance level 7 grants relentless-avenger feature', () => {
    const source = getSubclassSource('oathofvengeance');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'oathofvengeance-relentless-avenger' },
    });
  });
});

describe('getSubclassSource — Beast Master', () => {
  it('returns defined for beastmaster', () => {
    expect(getSubclassSource('beastmaster')).toBeDefined();
  });

  it('beastmaster has 2 feature levels (L3, L7)', () => {
    const source = getSubclassSource('beastmaster');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7]);
  });

  it('beastmaster level 3 grants 1 feature: primal-companion', () => {
    const source = getSubclassSource('beastmaster');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(1);
    expect(level3?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'beastmaster-primal-companion' },
    });
  });

  it('beastmaster level 7 grants 1 feature: exceptional-training', () => {
    const source = getSubclassSource('beastmaster');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'beastmaster-exceptional-training' },
    });
  });
});

describe('getSubclassSource — Fey Wanderer', () => {
  it('returns defined for feywanderer', () => {
    expect(getSubclassSource('feywanderer')).toBeDefined();
  });

  it('feywanderer has 2 feature levels (L3, L7)', () => {
    const source = getSubclassSource('feywanderer');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7]);
  });

  it('feywanderer level 3 grants 4 items: dreadful-strikes, skill proficiency-choice, otherworldly-glamour, subclass-spells', () => {
    const source = getSubclassSource('feywanderer');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(4);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'feywanderer-dreadful-strikes' }),
        }),
        expect.objectContaining({
          type: 'proficiency-choice',
          category: 'skill',
          count: 1,
          from: expect.arrayContaining(['deception', 'performance', 'persuasion']),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'feywanderer-otherworldly-glamour' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'feywanderer-subclass-spells' }),
        }),
      ])
    );
  });

  it('feywanderer level 3 proficiency-choice from list contains exactly deception, performance, persuasion', () => {
    const source = getSubclassSource('feywanderer');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const choiceGrant = level3?.grants.find((g) => g.type === 'proficiency-choice');
    expect(choiceGrant).toBeDefined();
    if (choiceGrant?.type === 'proficiency-choice' && choiceGrant.category === 'skill') {
      expect(choiceGrant.from).toEqual(expect.arrayContaining(['deception', 'performance', 'persuasion']));
      expect(choiceGrant.from).toHaveLength(3);
    }
  });

  it('feywanderer level 3 proficiency-choice key has subclass origin', () => {
    const source = getSubclassSource('feywanderer');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const profChoice = level3?.grants.find((g) => g.type === 'proficiency-choice');
    expect(profChoice).toBeDefined();
    expect((profChoice as { key: string }).key).toBe(createChoiceKey('skill-choice', 'subclass', 'feywanderer', 0));
  });

  it('feywanderer level 7 grants 1 feature: beguiling-twist', () => {
    const source = getSubclassSource('feywanderer');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'feywanderer-beguiling-twist' },
    });
  });
});

describe('getSubclassSource — Gloom Stalker', () => {
  it('returns defined for gloomstalker', () => {
    expect(getSubclassSource('gloomstalker')).toBeDefined();
  });

  it('gloomstalker has 2 feature levels (L3, L7)', () => {
    const source = getSubclassSource('gloomstalker');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7]);
  });

  it('gloomstalker level 3 grants 3 features: dread-ambusher, umbral-sight, subclass-spells', () => {
    const source = getSubclassSource('gloomstalker');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'gloomstalker-dread-ambusher' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'gloomstalker-umbral-sight' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'gloomstalker-subclass-spells' }),
        }),
      ])
    );
  });

  it('gloomstalker level 7 grants 1 feature: iron-mind', () => {
    const source = getSubclassSource('gloomstalker');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'gloomstalker-iron-mind' },
    });
  });
});

describe('getSubclassSource — Hunter', () => {
  it('returns defined for hunter', () => {
    expect(getSubclassSource('hunter')).toBeDefined();
  });

  it('hunter has 2 feature levels (L3, L7)', () => {
    const source = getSubclassSource('hunter');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7]);
  });

  it('hunter level 3 grants 2 features: hunters-lore and hunters-prey', () => {
    const source = getSubclassSource('hunter');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'hunter-hunters-lore' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'hunter-hunters-prey' }),
        }),
      ])
    );
  });

  it('hunter level 7 grants 1 feature: defensive-tactics', () => {
    const source = getSubclassSource('hunter');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'hunter-defensive-tactics' },
    });
  });
});

describe('getSubclassSource — Soulknife', () => {
  it('returns defined for soulknife', () => {
    expect(getSubclassSource('soulknife')).toBeDefined();
  });

  it('soulknife has 2 feature levels (L3, L9)', () => {
    const source = getSubclassSource('soulknife');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 9]);
  });

  it('soulknife level 3 grants 2 features: psionic-power and psychic-blades', () => {
    const source = getSubclassSource('soulknife');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'soulknife-psionic-power' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'soulknife-psychic-blades' }),
        }),
      ])
    );
  });

  it('soulknife level 9 grants 1 feature: soul-blades', () => {
    const source = getSubclassSource('soulknife');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(1);
    expect(level9?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'soulknife-soul-blades' },
    });
  });
});

describe('getSubclassSource — Aberrant Sorcery', () => {
  it('returns defined for aberrantsorcery', () => {
    expect(getSubclassSource('aberrantsorcery')).toBeDefined();
  });

  it('aberrantsorcery has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('aberrantsorcery');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('aberrantsorcery level 3 grants 3 features: telepathic-speech, psionic-sorcery, subclass-spells', () => {
    const source = getSubclassSource('aberrantsorcery');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'aberrantsorcery-telepathic-speech' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'aberrantsorcery-psionic-sorcery' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'aberrantsorcery-subclass-spells' }),
        }),
      ])
    );
  });

  it('aberrantsorcery level 6 grants 2 items: psychic resistance and psychic-defenses feature', () => {
    const source = getSubclassSource('aberrantsorcery');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(2);
    expect(level6?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'resistance', damageType: 'psychic' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'aberrantsorcery-psychic-defenses' }),
        }),
      ])
    );
  });
});

describe('getSubclassSource — Clockwork Sorcery', () => {
  it('returns defined for clockworksorcery', () => {
    expect(getSubclassSource('clockworksorcery')).toBeDefined();
  });

  it('clockworksorcery has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('clockworksorcery');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('clockworksorcery level 3 grants 3 features: restore-balance, trance-of-order, subclass-spells', () => {
    const source = getSubclassSource('clockworksorcery');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'clockworksorcery-restore-balance' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'clockworksorcery-trance-of-order' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'clockworksorcery-subclass-spells' }),
        }),
      ])
    );
  });

  it('clockworksorcery level 6 grants 1 feature: bastion-of-law', () => {
    const source = getSubclassSource('clockworksorcery');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'clockworksorcery-bastion-of-law' },
    });
  });
});

describe('getSubclassSource — Draconic Sorcery', () => {
  it('returns defined for draconicsorcery', () => {
    expect(getSubclassSource('draconicsorcery')).toBeDefined();
  });

  it('draconicsorcery has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('draconicsorcery');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('draconicsorcery level 3 grants 5 items: hp-bonus, armor-class, draconic language, dragon-ancestor feature, subclass-spells feature', () => {
    const source = getSubclassSource('draconicsorcery');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(5);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'hp-bonus', perLevel: 1 }),
        expect.objectContaining({ type: 'armor-class', calculation: { mode: 'natural', baseAc: 13 } }),
        expect.objectContaining({ type: 'proficiency', category: 'language', id: 'draconic' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'draconicsorcery-dragon-ancestor' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'draconicsorcery-subclass-spells' }),
        }),
      ])
    );
  });

  it('draconicsorcery level 6 grants 1 feature: elemental-affinity', () => {
    const source = getSubclassSource('draconicsorcery');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'draconicsorcery-elemental-affinity' },
    });
  });
});

describe('getSubclassSource — Wild Magic Sorcery', () => {
  it('returns defined for wildmagicsorcery', () => {
    expect(getSubclassSource('wildmagicsorcery')).toBeDefined();
  });

  it('wildmagicsorcery has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('wildmagicsorcery');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('wildmagicsorcery level 3 grants 3 features: wild-magic-surge, tides-of-chaos, subclass-spells', () => {
    const source = getSubclassSource('wildmagicsorcery');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'wildmagicsorcery-wild-magic-surge' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'wildmagicsorcery-tides-of-chaos' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'wildmagicsorcery-subclass-spells' }),
        }),
      ])
    );
  });

  it('wildmagicsorcery level 6 grants 1 feature: bend-luck', () => {
    const source = getSubclassSource('wildmagicsorcery');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'wildmagicsorcery-bend-luck' },
    });
  });
});

describe('getSubclassSource — Archfey Patron', () => {
  it('returns defined for archfeypatron', () => {
    expect(getSubclassSource('archfeypatron')).toBeDefined();
  });

  it('archfeypatron has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('archfeypatron');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('archfeypatron level 3 grants 2 features: steps-of-the-fey and patron-spells', () => {
    const source = getSubclassSource('archfeypatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'archfeypatron-steps-of-the-fey' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'archfeypatron-patron-spells' }),
        }),
      ])
    );
  });

  it('archfeypatron level 6 grants 1 feature: misty-escape', () => {
    const source = getSubclassSource('archfeypatron');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'archfeypatron-misty-escape' },
    });
  });

  it('archfeypatron level 10 grants 1 feature: beguiling-defenses', () => {
    const source = getSubclassSource('archfeypatron');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'archfeypatron-beguiling-defenses' },
    });
  });
});

describe('getSubclassSource — Celestial Patron', () => {
  it('returns defined for celestialpatron', () => {
    expect(getSubclassSource('celestialpatron')).toBeDefined();
  });

  it('celestialpatron has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('celestialpatron');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('celestialpatron level 3 grants 4 items: religion proficiency, bonus-cantrip, healing-light, patron-spells', () => {
    const source = getSubclassSource('celestialpatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(4);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'proficiency', category: 'skill', id: 'religion' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'celestialpatron-bonus-cantrip' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'celestialpatron-healing-light' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'celestialpatron-patron-spells' }),
        }),
      ])
    );
  });

  it('celestialpatron level 6 grants 2 items: radiant resistance and radiant-soul feature', () => {
    const source = getSubclassSource('celestialpatron');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(2);
    expect(level6?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'resistance', damageType: 'radiant' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'celestialpatron-radiant-soul' }),
        }),
      ])
    );
  });

  it('celestialpatron level 10 grants 1 feature: celestial-resilience', () => {
    const source = getSubclassSource('celestialpatron');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'celestialpatron-celestial-resilience' },
    });
  });
});

describe('getSubclassSource — Fiend Patron', () => {
  it('returns defined for fiendpatron', () => {
    expect(getSubclassSource('fiendpatron')).toBeDefined();
  });

  it('fiendpatron has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('fiendpatron');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('fiendpatron level 3 grants 2 features: dark-ones-blessing and patron-spells', () => {
    const source = getSubclassSource('fiendpatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'fiendpatron-dark-ones-blessing' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'fiendpatron-patron-spells' }),
        }),
      ])
    );
  });

  it('fiendpatron level 6 grants 1 feature: dark-ones-own-luck', () => {
    const source = getSubclassSource('fiendpatron');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'fiendpatron-dark-ones-own-luck' },
    });
  });

  it('fiendpatron level 10 grants 1 feature: fiendish-resilience', () => {
    const source = getSubclassSource('fiendpatron');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'fiendpatron-fiendish-resilience' },
    });
  });
});

describe('getSubclassSource — Great Old One Patron', () => {
  it('returns defined for greatoldonepatron', () => {
    expect(getSubclassSource('greatoldonepatron')).toBeDefined();
  });

  it('greatoldonepatron has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('greatoldonepatron');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('greatoldonepatron level 3 grants 3 items: skill proficiency-choice, awakened-mind, and psychic-spells', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'proficiency-choice',
          category: 'skill',
          count: 1,
          from: expect.arrayContaining(['arcana', 'history', 'intimidation', 'nature', 'religion', 'survival']),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'greatoldonepatron-awakened-mind' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'greatoldonepatron-psychic-spells' }),
        }),
      ])
    );
  });

  it('greatoldonepatron level 3 proficiency-choice from list contains exactly the 6 allowed skills', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const choiceGrant = level3?.grants.find((g) => g.type === 'proficiency-choice');
    expect(choiceGrant).toBeDefined();
    if (choiceGrant?.type === 'proficiency-choice' && choiceGrant.category === 'skill') {
      expect(choiceGrant.from).toEqual(
        expect.arrayContaining(['arcana', 'history', 'intimidation', 'nature', 'religion', 'survival'])
      );
      expect(choiceGrant.from).toHaveLength(6);
    }
  });

  it('greatoldonepatron level 3 proficiency-choice key has subclass origin', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const profChoice = level3?.grants.find((g) => g.type === 'proficiency-choice');
    expect(profChoice).toBeDefined();
    expect((profChoice as { key: string }).key).toBe(
      createChoiceKey('skill-choice', 'subclass', 'greatoldonepatron', 1)
    );
  });

  it('greatoldonepatron level 6 grants 1 feature: clairvoyant-combatant', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'greatoldonepatron-clairvoyant-combatant' },
    });
  });

  it('greatoldonepatron level 10 grants 1 feature: eldritch-hex', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'greatoldonepatron-eldritch-hex' },
    });
  });
});

describe('getSubclassSource — Abjurer', () => {
  it('returns defined for abjurer', () => {
    expect(getSubclassSource('abjurer')).toBeDefined();
  });

  it('abjurer has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('abjurer');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('abjurer level 3 grants 2 features: abjuration-savant and arcane-ward', () => {
    const source = getSubclassSource('abjurer');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'abjurer-abjuration-savant' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'abjurer-arcane-ward' }),
        }),
      ])
    );
  });

  it('abjurer level 6 grants 1 feature: projected-ward', () => {
    const source = getSubclassSource('abjurer');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'abjurer-projected-ward' },
    });
  });

  it('abjurer level 10 grants 1 feature: improved-abjuration', () => {
    const source = getSubclassSource('abjurer');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'abjurer-improved-abjuration' },
    });
  });
});

describe('getSubclassSource — Diviner', () => {
  it('returns defined for diviner', () => {
    expect(getSubclassSource('diviner')).toBeDefined();
  });

  it('diviner has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('diviner');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('diviner level 3 grants 2 features: divination-savant and portent', () => {
    const source = getSubclassSource('diviner');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'diviner-divination-savant' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'diviner-portent' }),
        }),
      ])
    );
  });

  it('diviner level 6 grants 1 feature: expert-divination', () => {
    const source = getSubclassSource('diviner');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'diviner-expert-divination' },
    });
  });

  it('diviner level 10 grants 1 feature: the-third-eye', () => {
    const source = getSubclassSource('diviner');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'diviner-the-third-eye' },
    });
  });
});

describe('getSubclassSource — Evoker', () => {
  it('returns defined for evoker', () => {
    expect(getSubclassSource('evoker')).toBeDefined();
  });

  it('evoker has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('evoker');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('evoker level 3 grants 2 features: evocation-savant and sculpt-spells', () => {
    const source = getSubclassSource('evoker');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'evoker-evocation-savant' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'evoker-sculpt-spells' }),
        }),
      ])
    );
  });

  it('evoker level 6 grants 1 feature: potent-cantrip', () => {
    const source = getSubclassSource('evoker');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'evoker-potent-cantrip' },
    });
  });

  it('evoker level 10 grants 1 feature: empowered-evocation', () => {
    const source = getSubclassSource('evoker');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'evoker-empowered-evocation' },
    });
  });
});

describe('getSubclassSource — Illusionist', () => {
  it('returns defined for illusionist', () => {
    expect(getSubclassSource('illusionist')).toBeDefined();
  });

  it('illusionist has 3 feature levels (L3, L6, L10)', () => {
    const source = getSubclassSource('illusionist');
    expect(source?.features).toHaveLength(3);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6, 10]);
  });

  it('illusionist level 3 grants 2 features: illusion-savant and improved-illusions', () => {
    const source = getSubclassSource('illusionist');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'illusionist-illusion-savant' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'illusionist-improved-illusions' }),
        }),
      ])
    );
  });

  it('illusionist level 6 grants 1 feature: phantasmal-creatures', () => {
    const source = getSubclassSource('illusionist');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'illusionist-phantasmal-creatures' },
    });
  });

  it('illusionist level 10 grants 1 feature: illusory-self', () => {
    const source = getSubclassSource('illusionist');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'illusionist-illusory-self' },
    });
  });
});

describe('getSubclassSource — unknown', () => {
  it('returns undefined for unknown subclass', () => {
    expect(getSubclassSource('unknown-subclass' as SubclassId)).toBeUndefined();
  });
});
