import { describe, it, expect } from 'vitest';
import { getSubclassSource, collectBundles } from '@/lib/sources';
import type { SubclassId } from '@/lib/sources/subclasses';
import { createChoiceKey } from '@/types/choices';
import type { CharacterBuild } from '@/types/choices';
import type { ClassId, SpeciesId, BackgroundId } from '@/lib/dnd-helpers';
import { resolveCharacter } from '@/lib/resolver';

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
        expect.objectContaining({ type: 'spell', spellId: 'light', alwaysPrepared: false }),
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

  it('circleland level 3 grants lands-aid and terrain feature-choice (2024 PHB — no bonus-cantrip)', () => {
    const source = getSubclassSource('circleland');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'circleland-lands-aid' }) }),
        expect.objectContaining({
          type: 'feature-choice',
          key: 'feature-choice:subclass:circleland:0',
          options: expect.arrayContaining([
            expect.objectContaining({ optionId: 'arid', featureId: 'circleland-land-arid' }),
            expect.objectContaining({ optionId: 'polar', featureId: 'circleland-land-polar' }),
            expect.objectContaining({ optionId: 'temperate', featureId: 'circleland-land-temperate' }),
            expect.objectContaining({ optionId: 'tropical', featureId: 'circleland-land-tropical' }),
          ]),
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

  it('psiwarrior has 5 feature levels (L3, L7, L10, L15, L18)', () => {
    const source = getSubclassSource('psiwarrior');
    expect(source?.features).toHaveLength(5);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 7, 10, 15, 18]);
  });

  it('psiwarrior level 3 grants psionic-power feature + psionic-energy resource pool', () => {
    const source = getSubclassSource('psiwarrior');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'psiwarrior-psionic-power' }),
        }),
        expect.objectContaining({
          type: 'resource-pool',
          poolId: 'psionic-energy',
          max: { mode: 'fixed', value: 4 },
          regen: 'long-rest',
        }),
      ])
    );
  });

  it('psiwarrior level 7 grants telekinetic-adept feature with INT-based saveDC', () => {
    const source = getSubclassSource('psiwarrior');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'psiwarrior-telekinetic-adept', saveDC: { dcAbility: 'int' } },
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

  it('psiwarrior level 15 grants bulwark-of-force feature', () => {
    const source = getSubclassSource('psiwarrior');
    const level15 = source?.features.find((f) => f.classLevel === 15);
    expect(level15).toBeDefined();
    expect(level15?.grants).toHaveLength(1);
    expect(level15?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'psiwarrior-bulwark-of-force' },
    });
  });

  it('psiwarrior level 18 grants telekinetic-master feature', () => {
    const source = getSubclassSource('psiwarrior');
    const level18 = source?.features.find((f) => f.classLevel === 18);
    expect(level18).toBeDefined();
    expect(level18?.grants).toHaveLength(1);
    expect(level18?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'psiwarrior-telekinetic-master' },
    });
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

  it('oathofdevotion has 6 feature levels (L3, L5, L7, L9, L13, L17)', () => {
    const source = getSubclassSource('oathofdevotion');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 7, 9, 13, 17]);
  });

  it('oathofdevotion level 3 grants sacred-weapon and L3 spell grants (holy-rebuke removed: not a 2024 PHB option)', () => {
    const source = getSubclassSource('oathofdevotion');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    // 1 feature grant + 2 spell grants (holy-rebuke removed in 2024)
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofdevotion-sacred-weapon' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'protection-from-evil-and-good', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'shield-of-faith', alwaysPrepared: true }),
      ])
    );
    const featureIds = level3!.grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g as { type: 'feature'; feature: { id: string } }).feature.id);
    expect(featureIds).not.toContain('oathofdevotion-holy-rebuke');
  });

  it('oathofdevotion level 5 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofdevotion');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'aid', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'zone-of-truth', alwaysPrepared: true }),
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

  it('oathofdevotion level 9 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofdevotion');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'beacon-of-hope', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'dispel-magic', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofdevotion level 13 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofdevotion');
    const level13 = source?.features.find((f) => f.classLevel === 13);
    expect(level13).toBeDefined();
    expect(level13?.grants).toHaveLength(2);
    expect(level13?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'guardian-of-faith', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofdevotion level 17 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofdevotion');
    const level17 = source?.features.find((f) => f.classLevel === 17);
    expect(level17).toBeDefined();
    expect(level17?.grants).toHaveLength(2);
    expect(level17?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'commune', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'flame-strike', alwaysPrepared: true }),
      ])
    );
  });
});

describe('getSubclassSource — Oath of Glory', () => {
  it('returns defined for oathofglory', () => {
    expect(getSubclassSource('oathofglory')).toBeDefined();
  });

  it('oathofglory has 6 feature levels (L3, L5, L7, L9, L13, L17)', () => {
    const source = getSubclassSource('oathofglory');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 7, 9, 13, 17]);
  });

  it('oathofglory level 3 grants peerless-athlete, inspiring-smite, and L3 spell grants', () => {
    const source = getSubclassSource('oathofglory');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    // 2 feature grants + 2 spell grants
    expect(level3?.grants).toHaveLength(4);
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
        expect.objectContaining({ type: 'spell', spellId: 'guiding-bolt', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'heroism', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofglory level 5 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofglory');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'enhance-ability', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'magic-weapon', alwaysPrepared: true }),
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

  it('oathofglory level 9 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofglory');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'haste', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'protection-from-energy', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofglory level 13 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofglory');
    const level13 = source?.features.find((f) => f.classLevel === 13);
    expect(level13).toBeDefined();
    expect(level13?.grants).toHaveLength(2);
    expect(level13?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'compulsion', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofglory level 17 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofglory');
    const level17 = source?.features.find((f) => f.classLevel === 17);
    expect(level17).toBeDefined();
    expect(level17?.grants).toHaveLength(2);
    expect(level17?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'legend-lore', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'yolandes-regal-presence', alwaysPrepared: true }),
      ])
    );
  });
});

describe('getSubclassSource — Oath of the Ancients', () => {
  it('returns defined for oathofancients', () => {
    expect(getSubclassSource('oathofancients')).toBeDefined();
  });

  it('oathofancients has 6 feature levels (L3, L5, L7, L9, L13, L17)', () => {
    const source = getSubclassSource('oathofancients');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 7, 9, 13, 17]);
  });

  it('oathofancients level 3 grants natures-wrath (with saveDC:cha) and L3 spell grants; turn-the-faithless removed', () => {
    const source = getSubclassSource('oathofancients');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    // 1 feature grant + 2 spell grants (turn-the-faithless removed in 2024)
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofancients-natures-wrath', saveDC: { dcAbility: 'cha' } }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'ensnaring-strike', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'speak-with-animals', alwaysPrepared: true }),
      ])
    );
    // Confirm 2014 holdover is absent
    const featureIds = level3?.grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).not.toContain('oathofancients-turn-the-faithless');
  });

  it('oathofancients-natures-wrath has saveDC.dcAbility === "cha"', () => {
    const source = getSubclassSource('oathofancients');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const naturesWrathGrant = level3?.grants.find(
      (g) => g.type === 'feature' && g.feature.id === 'oathofancients-natures-wrath'
    );
    expect(naturesWrathGrant).toBeDefined();
    if (naturesWrathGrant?.type === 'feature') {
      expect(naturesWrathGrant.feature.saveDC?.dcAbility).toBe('cha');
    }
  });

  it('oathofancients level 5 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofancients');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'misty-step', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'moonbeam', alwaysPrepared: true }),
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

  it('oathofancients level 9 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofancients');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'plant-growth', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'protection-from-energy', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofancients level 13 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofancients');
    const level13 = source?.features.find((f) => f.classLevel === 13);
    expect(level13).toBeDefined();
    expect(level13?.grants).toHaveLength(2);
    expect(level13?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'ice-storm', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'stoneskin', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofancients level 17 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofancients');
    const level17 = source?.features.find((f) => f.classLevel === 17);
    expect(level17).toBeDefined();
    expect(level17?.grants).toHaveLength(2);
    expect(level17?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'commune-with-nature', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'tree-stride', alwaysPrepared: true }),
      ])
    );
  });
});

describe('getSubclassSource — Oath of Vengeance', () => {
  it('returns defined for oathofvengeance', () => {
    expect(getSubclassSource('oathofvengeance')).toBeDefined();
  });

  it('oathofvengeance has 6 feature levels (L3, L5, L7, L9, L13, L17)', () => {
    const source = getSubclassSource('oathofvengeance');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 7, 9, 13, 17]);
  });

  it('oathofvengeance level 3 grants vow-of-enmity and L3 spell grants; abjure-enemy removed', () => {
    const source = getSubclassSource('oathofvengeance');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    // 1 feature grant + 2 spell grants (abjure-enemy removed in 2024)
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'oathofvengeance-vow-of-enmity' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'bane', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'hunters-mark', alwaysPrepared: true }),
      ])
    );
    // Confirm 2014 holdover is absent
    const featureIds = level3?.grants
      .filter((g) => g.type === 'feature')
      .map((g) => (g.type === 'feature' ? g.feature.id : ''));
    expect(featureIds).not.toContain('oathofvengeance-abjure-enemy');
  });

  it('oathofvengeance level 5 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofvengeance');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'hold-person', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'misty-step', alwaysPrepared: true }),
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

  it('oathofvengeance level 9 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofvengeance');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'haste', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'protection-from-energy', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofvengeance level 13 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofvengeance');
    const level13 = source?.features.find((f) => f.classLevel === 13);
    expect(level13).toBeDefined();
    expect(level13?.grants).toHaveLength(2);
    expect(level13?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'banishment', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'dimension-door', alwaysPrepared: true }),
      ])
    );
  });

  it('oathofvengeance level 17 grants 2 spell grants with alwaysPrepared:true', () => {
    const source = getSubclassSource('oathofvengeance');
    const level17 = source?.features.find((f) => f.classLevel === 17);
    expect(level17).toBeDefined();
    expect(level17?.grants).toHaveLength(2);
    expect(level17?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'hold-monster', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'scrying', alwaysPrepared: true }),
      ])
    );
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

  it('feywanderer has 6 feature levels (L3, L5, L7, L9, L13, L17)', () => {
    const source = getSubclassSource('feywanderer');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 7, 9, 13, 17]);
  });

  it('feywanderer level 3 grants 4 items: dreadful-strikes, skill proficiency-choice, otherworldly-glamour, charm-person', () => {
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
        expect.objectContaining({ type: 'spell', spellId: 'charm-person', alwaysPrepared: true }),
      ])
    );
  });

  it('feywanderer level 3 has no inert subclass-spells feature grant', () => {
    const source = getSubclassSource('feywanderer');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const inertGrant = level3?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'feywanderer-subclass-spells'
    );
    expect(inertGrant).toBeUndefined();
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

  it('feywanderer level 5 grants misty-step (alwaysPrepared)', () => {
    const source = getSubclassSource('feywanderer');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(1);
    expect(level5?.grants[0]).toMatchObject({ type: 'spell', spellId: 'misty-step', alwaysPrepared: true });
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

  it('feywanderer level 9 grants summon-fey (alwaysPrepared)', () => {
    const source = getSubclassSource('feywanderer');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(1);
    expect(level9?.grants[0]).toMatchObject({ type: 'spell', spellId: 'summon-fey', alwaysPrepared: true });
  });

  it('feywanderer level 13 grants dimension-door (alwaysPrepared)', () => {
    const source = getSubclassSource('feywanderer');
    const level13 = source?.features.find((f) => f.classLevel === 13);
    expect(level13).toBeDefined();
    expect(level13?.grants).toHaveLength(1);
    expect(level13?.grants[0]).toMatchObject({ type: 'spell', spellId: 'dimension-door', alwaysPrepared: true });
  });

  it('feywanderer level 17 grants mislead (alwaysPrepared)', () => {
    const source = getSubclassSource('feywanderer');
    const level17 = source?.features.find((f) => f.classLevel === 17);
    expect(level17).toBeDefined();
    expect(level17?.grants).toHaveLength(1);
    expect(level17?.grants[0]).toMatchObject({ type: 'spell', spellId: 'mislead', alwaysPrepared: true });
  });
});

describe('getSubclassSource — Gloom Stalker', () => {
  it('returns defined for gloomstalker', () => {
    expect(getSubclassSource('gloomstalker')).toBeDefined();
  });

  it('gloomstalker has 6 feature levels (L3, L5, L7, L9, L13, L17)', () => {
    const source = getSubclassSource('gloomstalker');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 7, 9, 13, 17]);
  });

  it('gloomstalker level 3 grants 3 items: dread-ambusher, umbral-sight, disguise-self', () => {
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
        expect.objectContaining({ type: 'spell', spellId: 'disguise-self', alwaysPrepared: true }),
      ])
    );
  });

  it('gloomstalker level 3 has no inert subclass-spells feature grant', () => {
    const source = getSubclassSource('gloomstalker');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const inertGrant = level3?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'gloomstalker-subclass-spells'
    );
    expect(inertGrant).toBeUndefined();
  });

  it('gloomstalker level 5 grants rope-trick (alwaysPrepared)', () => {
    const source = getSubclassSource('gloomstalker');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(1);
    expect(level5?.grants[0]).toMatchObject({ type: 'spell', spellId: 'rope-trick', alwaysPrepared: true });
  });

  it('gloomstalker level 7 grants iron-mind feature and WIS saving-throw proficiency', () => {
    const source = getSubclassSource('gloomstalker');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'gloomstalker-iron-mind' }),
        }),
        expect.objectContaining({ type: 'proficiency', category: 'saving-throw', id: 'wis' }),
      ])
    );
  });

  it('gloomstalker level 9 grants fear (alwaysPrepared)', () => {
    const source = getSubclassSource('gloomstalker');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(1);
    expect(level9?.grants[0]).toMatchObject({ type: 'spell', spellId: 'fear', alwaysPrepared: true });
  });

  it('gloomstalker level 13 grants greater-invisibility (alwaysPrepared)', () => {
    const source = getSubclassSource('gloomstalker');
    const level13 = source?.features.find((f) => f.classLevel === 13);
    expect(level13).toBeDefined();
    expect(level13?.grants).toHaveLength(1);
    expect(level13?.grants[0]).toMatchObject({ type: 'spell', spellId: 'greater-invisibility', alwaysPrepared: true });
  });

  it('gloomstalker level 17 grants seeming (alwaysPrepared)', () => {
    const source = getSubclassSource('gloomstalker');
    const level17 = source?.features.find((f) => f.classLevel === 17);
    expect(level17).toBeDefined();
    expect(level17?.grants).toHaveLength(1);
    expect(level17?.grants[0]).toMatchObject({ type: 'spell', spellId: 'seeming', alwaysPrepared: true });
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

  it('hunter level 3 grants 2 items: hunters-lore and hunters-prey feature-choice', () => {
    const source = getSubclassSource('hunter');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'hunter-hunters-lore' }) }),
        expect.objectContaining({
          type: 'feature-choice',
          key: createChoiceKey('feature-choice', 'subclass', 'hunter', 0),
          options: expect.arrayContaining([
            expect.objectContaining({ optionId: 'colossus-slayer', featureId: 'hunter-hunters-prey-colossus-slayer' }),
            expect.objectContaining({ optionId: 'horde-breaker', featureId: 'hunter-hunters-prey-horde-breaker' }),
          ]),
        }),
      ])
    );
  });

  it('hunter level 3 has no inert hunters-prey feature grant', () => {
    const source = getSubclassSource('hunter');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const inertGrant = level3?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'hunter-hunters-prey'
    );
    expect(inertGrant).toBeUndefined();
  });

  it('hunter level 7 grants 1 item: defensive-tactics feature-choice (escape-the-horde / multiattack-defense)', () => {
    const source = getSubclassSource('hunter');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(1);
    expect(level7?.grants[0]).toMatchObject({
      type: 'feature-choice',
      key: createChoiceKey('feature-choice', 'subclass', 'hunter', 1),
      options: expect.arrayContaining([
        expect.objectContaining({
          optionId: 'escape-the-horde',
          featureId: 'hunter-defensive-tactics-escape-the-horde',
        }),
        expect.objectContaining({
          optionId: 'multiattack-defense',
          featureId: 'hunter-defensive-tactics-multiattack-defense',
        }),
      ]),
    });
  });

  it('hunter level 7 has no inert defensive-tactics feature grant', () => {
    const source = getSubclassSource('hunter');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    const inertGrant = level7?.grants.find(
      (g) => g.type === 'feature' && 'feature' in g && g.feature.id === 'hunter-defensive-tactics'
    );
    expect(inertGrant).toBeUndefined();
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

  it('aberrantsorcery has 5 feature levels (L3, L5, L6, L7, L9)', () => {
    const source = getSubclassSource('aberrantsorcery');
    expect(source?.features).toHaveLength(5);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9]);
  });

  it('aberrantsorcery level 3 grants telepathic-speech feature and 4 L3 spell grants (no subclass-spells stub)', () => {
    const source = getSubclassSource('aberrantsorcery');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(6);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'aberrantsorcery-telepathic-speech' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'arms-of-hadar', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'calm-emotions', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'detect-thoughts', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'dissonant-whispers', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'mind-sliver', alwaysPrepared: false }),
      ])
    );
    // mind-sliver is a cantrip (alwaysPrepared:false routes it to cantrips list)
    const mindSliver = level3?.grants.find((g) => g.type === 'spell' && g.spellId === 'mind-sliver');
    expect(mindSliver).toMatchObject({ type: 'spell', spellId: 'mind-sliver', alwaysPrepared: false });
    // no inert subclass-spells stub
    expect(level3?.grants.some((g) => g.type === 'feature' && g.feature.id === 'aberrantsorcery-subclass-spells')).toBe(
      false
    );
    // psionic-sorcery NOT at L3 (relocated to L6 per 2024 PHB)
    expect(level3?.grants.some((g) => g.type === 'feature' && g.feature.id === 'aberrantsorcery-psionic-sorcery')).toBe(
      false
    );
  });

  it('aberrantsorcery level 5 has hunger-of-hadar and sending spell grants', () => {
    const source = getSubclassSource('aberrantsorcery');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'hunger-of-hadar', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'sending', alwaysPrepared: true }),
      ])
    );
  });

  it('aberrantsorcery level 6 grants psionic-sorcery feature, psychic resistance, and psychic-defenses (2024 PHB places psionic-sorcery at L6)', () => {
    const source = getSubclassSource('aberrantsorcery');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(3);
    expect(level6?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'aberrantsorcery-psionic-sorcery' }),
        }),
        expect.objectContaining({ type: 'resistance', damageType: 'psychic' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'aberrantsorcery-psychic-defenses' }),
        }),
      ])
    );
  });

  it('aberrantsorcery level 7 has evards-black-tentacles and summon-aberration spell grants', () => {
    const source = getSubclassSource('aberrantsorcery');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'evards-black-tentacles', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'summon-aberration', alwaysPrepared: true }),
      ])
    );
  });

  it('aberrantsorcery level 9 has rarys-telepathic-bond and telekinesis spell grants', () => {
    const source = getSubclassSource('aberrantsorcery');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'rarys-telepathic-bond', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'telekinesis', alwaysPrepared: true }),
      ])
    );
  });
});

describe('getSubclassSource — Clockwork Sorcery', () => {
  it('returns defined for clockworksorcery', () => {
    expect(getSubclassSource('clockworksorcery')).toBeDefined();
  });

  it('clockworksorcery has 6 feature levels (L3, L5, L6, L7, L9, L14)', () => {
    const source = getSubclassSource('clockworksorcery');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9, 14]);
  });

  it('clockworksorcery level 3 grants restore-balance feature and 4 L3 spell grants (no subclass-spells stub, no trance-of-order)', () => {
    const source = getSubclassSource('clockworksorcery');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(5);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'clockworksorcery-restore-balance' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'aid', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'alarm', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'lesser-restoration', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'protection-from-evil-and-good', alwaysPrepared: true }),
      ])
    );
    // no inert subclass-spells stub
    expect(
      level3?.grants.some((g) => g.type === 'feature' && g.feature.id === 'clockworksorcery-subclass-spells')
    ).toBe(false);
    // trance-of-order NOT at L3 (relocated to L14 per 2024 PHB)
    expect(
      level3?.grants.some((g) => g.type === 'feature' && g.feature.id === 'clockworksorcery-trance-of-order')
    ).toBe(false);
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

  it('clockworksorcery level 5 has dispel-magic and protection-from-energy spell grants', () => {
    const source = getSubclassSource('clockworksorcery');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'dispel-magic', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'protection-from-energy', alwaysPrepared: true }),
      ])
    );
  });

  it('clockworksorcery level 7 has freedom-of-movement and summon-construct spell grants', () => {
    const source = getSubclassSource('clockworksorcery');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'summon-construct', alwaysPrepared: true }),
      ])
    );
  });

  it('clockworksorcery level 9 has greater-restoration and wall-of-force spell grants', () => {
    const source = getSubclassSource('clockworksorcery');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'greater-restoration', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'wall-of-force', alwaysPrepared: true }),
      ])
    );
  });

  it('clockworksorcery level 14 grants trance-of-order feature (2024 PHB placement)', () => {
    const source = getSubclassSource('clockworksorcery');
    const level14 = source?.features.find((f) => f.classLevel === 14);
    expect(level14).toBeDefined();
    expect(level14?.grants).toHaveLength(1);
    expect(level14?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'clockworksorcery-trance-of-order' },
    });
  });
});

describe('getSubclassSource — Draconic Sorcery', () => {
  it('returns defined for draconicsorcery', () => {
    expect(getSubclassSource('draconicsorcery')).toBeDefined();
  });

  it('draconicsorcery has 5 feature levels (L3, L5, L6, L7, L9)', () => {
    const source = getSubclassSource('draconicsorcery');
    expect(source?.features).toHaveLength(5);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9]);
  });

  it('draconicsorcery level 3 grants 8 items: hp-bonus, armor-class, draconic language, 10-option feature-choice, 4 spell grants (no inert stubs)', () => {
    const source = getSubclassSource('draconicsorcery');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(8);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'hp-bonus', perLevel: 1 }),
        expect.objectContaining({ type: 'armor-class', calculation: { mode: 'natural', baseAc: 13 } }),
        expect.objectContaining({ type: 'proficiency', category: 'language', id: 'draconic' }),
        expect.objectContaining({ type: 'feature-choice' }),
        expect.objectContaining({ type: 'spell', spellId: 'alter-self', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'chromatic-orb', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'command', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'dragons-breath', alwaysPrepared: true }),
      ])
    );
    // no inert feature stubs
    expect(level3?.grants.some((g) => g.type === 'feature' && g.feature.id === 'draconicsorcery-dragon-ancestor')).toBe(
      false
    );
    expect(level3?.grants.some((g) => g.type === 'feature' && g.feature.id === 'draconicsorcery-subclass-spells')).toBe(
      false
    );
    // feature-choice has 10 options
    const choice = level3?.grants.find((g) => g.type === 'feature-choice');
    expect(choice?.type === 'feature-choice' && choice.options).toHaveLength(10);
  });

  it('draconicsorcery level 5 has fear and fly spell grants', () => {
    const source = getSubclassSource('draconicsorcery');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'fear', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'fly', alwaysPrepared: true }),
      ])
    );
  });

  it('draconicsorcery level 7 has arcane-eye and charm-monster spell grants', () => {
    const source = getSubclassSource('draconicsorcery');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'arcane-eye', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'charm-monster', alwaysPrepared: true }),
      ])
    );
  });

  it('draconicsorcery level 9 has legend-lore and summon-dragon spell grants', () => {
    const source = getSubclassSource('draconicsorcery');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'legend-lore', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'summon-dragon', alwaysPrepared: true }),
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

  it('wildmagicsorcery level 3 grants 2 features: wild-magic-surge and tides-of-chaos (no subclass spells, no subclass-spells stub)', () => {
    const source = getSubclassSource('wildmagicsorcery');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
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
      ])
    );
    // no spell grants — 2024 Wild Magic has no subclass spell list
    expect(level3?.grants.some((g) => g.type === 'spell')).toBe(false);
    // no inert subclass-spells stub
    expect(
      level3?.grants.some((g) => g.type === 'feature' && g.feature.id === 'wildmagicsorcery-subclass-spells')
    ).toBe(false);
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

  it('archfeypatron has 6 feature levels (L3, L5, L6, L7, L9, L10)', () => {
    const source = getSubclassSource('archfeypatron');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9, 10]);
  });

  it('archfeypatron level 3 has steps-of-the-fey feature and 5 always-prepared spell grants; no patron-spells stub', () => {
    const source = getSubclassSource('archfeypatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(6);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'archfeypatron-steps-of-the-fey' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'calm-emotions', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'faerie-fire', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'misty-step', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'phantasmal-force', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'sleep', alwaysPrepared: true }),
      ])
    );
    const stubGrant = level3?.grants.find(
      (g) => g.type === 'feature' && g.feature.id === 'archfeypatron-patron-spells'
    );
    expect(stubGrant).toBeUndefined();
  });

  it('archfeypatron level 5 grants blink and plant-growth (always prepared)', () => {
    const source = getSubclassSource('archfeypatron');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'blink', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'plant-growth', alwaysPrepared: true }),
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

  it('archfeypatron level 7 grants dominate-beast and greater-invisibility (always prepared)', () => {
    const source = getSubclassSource('archfeypatron');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'dominate-beast', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'greater-invisibility', alwaysPrepared: true }),
      ])
    );
  });

  it('archfeypatron level 9 grants dominate-person and seeming (always prepared)', () => {
    const source = getSubclassSource('archfeypatron');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'dominate-person', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'seeming', alwaysPrepared: true }),
      ])
    );
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

  it('celestialpatron has 6 feature levels (L3, L5, L6, L7, L9, L10)', () => {
    const source = getSubclassSource('celestialpatron');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9, 10]);
  });

  it('celestialpatron level 3 has religion proficiency, healing-light, 2 cantrip grants (alwaysPrepared:false), 4 always-prepared spells; no bonus-cantrip or patron-spells stubs', () => {
    const source = getSubclassSource('celestialpatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(8);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'proficiency', category: 'skill', id: 'religion' }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'celestialpatron-healing-light' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'light', alwaysPrepared: false }),
        expect.objectContaining({ type: 'spell', spellId: 'sacred-flame', alwaysPrepared: false }),
        expect.objectContaining({ type: 'spell', spellId: 'aid', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'cure-wounds', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'guiding-bolt', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'lesser-restoration', alwaysPrepared: true }),
      ])
    );
    // Exactly 2 alwaysPrepared:false grants (the cantrips)
    const cantripsGrants = level3?.grants.filter((g) => g.type === 'spell' && !g.alwaysPrepared);
    expect(cantripsGrants).toHaveLength(2);
    // Stubs must be absent
    const bonusCantrip = level3?.grants.find(
      (g) => g.type === 'feature' && g.feature.id === 'celestialpatron-bonus-cantrip'
    );
    expect(bonusCantrip).toBeUndefined();
    const patronSpells = level3?.grants.find(
      (g) => g.type === 'feature' && g.feature.id === 'celestialpatron-patron-spells'
    );
    expect(patronSpells).toBeUndefined();
  });

  it('celestialpatron level 5 grants daylight and revivify (always prepared)', () => {
    const source = getSubclassSource('celestialpatron');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'daylight', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'revivify', alwaysPrepared: true }),
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

  it('celestialpatron level 7 grants guardian-of-faith and wall-of-fire (always prepared)', () => {
    const source = getSubclassSource('celestialpatron');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'guardian-of-faith', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'wall-of-fire', alwaysPrepared: true }),
      ])
    );
  });

  it('celestialpatron level 9 grants greater-restoration and summon-celestial (always prepared)', () => {
    const source = getSubclassSource('celestialpatron');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'greater-restoration', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'summon-celestial', alwaysPrepared: true }),
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

  it('fiendpatron has 6 feature levels (L3, L5, L6, L7, L9, L10)', () => {
    const source = getSubclassSource('fiendpatron');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9, 10]);
  });

  it('fiendpatron level 3 has dark-ones-blessing and 4 always-prepared spells; no patron-spells stub', () => {
    const source = getSubclassSource('fiendpatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(5);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'fiendpatron-dark-ones-blessing' }),
        }),
        expect.objectContaining({ type: 'spell', spellId: 'burning-hands', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'command', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'scorching-ray', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'suggestion', alwaysPrepared: true }),
      ])
    );
    const stubGrant = level3?.grants.find((g) => g.type === 'feature' && g.feature.id === 'fiendpatron-patron-spells');
    expect(stubGrant).toBeUndefined();
  });

  it('fiendpatron level 5 grants fireball and stinking-cloud (always prepared)', () => {
    const source = getSubclassSource('fiendpatron');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'fireball', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'stinking-cloud', alwaysPrepared: true }),
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

  it('fiendpatron level 7 grants fire-shield and wall-of-fire (always prepared)', () => {
    const source = getSubclassSource('fiendpatron');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'fire-shield', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'wall-of-fire', alwaysPrepared: true }),
      ])
    );
  });

  it('fiendpatron level 9 grants geas and insect-plague (always prepared)', () => {
    const source = getSubclassSource('fiendpatron');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'geas', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'insect-plague', alwaysPrepared: true }),
      ])
    );
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

  it('greatoldonepatron has 6 feature levels (L3, L5, L6, L7, L9, L10)', () => {
    const source = getSubclassSource('greatoldonepatron');
    expect(source?.features).toHaveLength(6);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 5, 6, 7, 9, 10]);
  });

  it('greatoldonepatron level 3 has skill proficiency-choice, awakened-mind, and 4 always-prepared spells; no psychic-spells stub', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(6);
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
        expect.objectContaining({ type: 'spell', spellId: 'detect-thoughts', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'dissonant-whispers', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'hideous-laughter', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'phantasmal-force', alwaysPrepared: true }),
      ])
    );
    const stubGrant = level3?.grants.find(
      (g) => g.type === 'feature' && g.feature.id === 'greatoldonepatron-psychic-spells'
    );
    expect(stubGrant).toBeUndefined();
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

  it('greatoldonepatron level 3 proficiency-choice key uses skill-choice category with subclass origin', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    const profChoice = level3?.grants.find((g) => g.type === 'proficiency-choice');
    expect(profChoice).toBeDefined();
    expect((profChoice as { key: string }).key).toBe(
      createChoiceKey('skill-choice', 'subclass', 'greatoldonepatron', 1)
    );
  });

  it('greatoldonepatron level 5 grants clairvoyance and hunger-of-hadar (always prepared)', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level5 = source?.features.find((f) => f.classLevel === 5);
    expect(level5).toBeDefined();
    expect(level5?.grants).toHaveLength(2);
    expect(level5?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'clairvoyance', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'hunger-of-hadar', alwaysPrepared: true }),
      ])
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

  it('greatoldonepatron level 7 grants confusion and summon-aberration (always prepared)', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level7 = source?.features.find((f) => f.classLevel === 7);
    expect(level7).toBeDefined();
    expect(level7?.grants).toHaveLength(2);
    expect(level7?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'confusion', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'summon-aberration', alwaysPrepared: true }),
      ])
    );
  });

  it('greatoldonepatron level 9 grants modify-memory and telekinesis (always prepared)', () => {
    const source = getSubclassSource('greatoldonepatron');
    const level9 = source?.features.find((f) => f.classLevel === 9);
    expect(level9).toBeDefined();
    expect(level9?.grants).toHaveLength(2);
    expect(level9?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'spell', spellId: 'modify-memory', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'telekinesis', alwaysPrepared: true }),
      ])
    );
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

  it('abjurer level 10 grants spellbreaker feature + counterspell + dispel-magic always-prepared (NOT improved-abjuration)', () => {
    const source = getSubclassSource('abjurer');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(3);
    expect(level10?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'abjurer-spellbreaker' }) }),
        expect.objectContaining({ type: 'spell', spellId: 'counterspell', alwaysPrepared: true }),
        expect.objectContaining({ type: 'spell', spellId: 'dispel-magic', alwaysPrepared: true }),
      ])
    );
    // Regression guard: improved-abjuration (2014) must NOT appear
    expect(level10?.grants).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'abjurer-improved-abjuration' }),
        }),
      ])
    );
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

  it('diviner level 3 grants 3 grants: divination-savant, portent, and portent resource pool', () => {
    const source = getSubclassSource('diviner');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
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
        expect.objectContaining({
          type: 'resource-pool',
          poolId: 'portent',
          max: { mode: 'fixed', value: 2 },
          regen: 'long-rest',
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

  it('evoker level 3 grants 2 features: evocation-savant and potent-cantrip (2024 PHB — NOT sculpt-spells)', () => {
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
          feature: expect.objectContaining({ id: 'evoker-potent-cantrip' }),
        }),
      ])
    );
    // Regression guard: sculpt-spells must NOT be at L3 (2014 holdover)
    expect(level3?.grants).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'evoker-sculpt-spells' }) }),
      ])
    );
  });

  it('evoker level 6 grants 1 feature: sculpt-spells (2024 PHB — NOT potent-cantrip)', () => {
    const source = getSubclassSource('evoker');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'evoker-sculpt-spells' },
    });
    // Regression guard: potent-cantrip must NOT be at L6 (2014 holdover)
    expect(level6?.grants[0]).not.toMatchObject({
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

  it('illusionist level 10 grants 2 grants: illusory-self feature and illusory-self resource pool', () => {
    const source = getSubclassSource('illusionist');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(2);
    expect(level10?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'illusionist-illusory-self' }),
        }),
        expect.objectContaining({
          type: 'resource-pool',
          poolId: 'illusory-self',
          max: { mode: 'fixed', value: 1 },
          regen: 'short-rest',
        }),
      ])
    );
  });
});

describe('getSubclassSource — unknown', () => {
  it('returns undefined for unknown subclass', () => {
    expect(getSubclassSource('unknown-subclass' as SubclassId)).toBeUndefined();
  });
});

// ── Resolver integration: Wizard school correctness ──────────────────────────

describe('Diviner Portent resource pool resolver integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'wizard', 0);

  it('Diviner L3: resourcePools includes portent with max=2 and long-rest regen', () => {
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 },
      abilityMethod: 'standard-array',
      levels: [
        { classId: 'wizard' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'wizard' as ClassId, classLevel: 2, hpRoll: 4 },
        { classId: 'wizard' as ClassId, classLevel: 3, hpRoll: 4 },
      ],
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'diviner' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    const pool = resolved.resourcePools.find((p) => p.poolId === 'portent');
    expect(pool).toBeDefined();
    expect(pool?.max).toBe(2);
    expect(pool?.regen).toBe('long-rest');
  });
});

describe('Abjurer Spellbreaker resolver integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'wizard', 0);

  it('Abjurer L10: alwaysPreparedSpells includes counterspell and dispel-magic', () => {
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 },
      abilityMethod: 'standard-array',
      levels: Array.from({ length: 10 }, (_, i) => ({
        classId: 'wizard' as ClassId,
        classLevel: i + 1,
        hpRoll: i === 0 ? null : 4,
      })),
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'abjurer' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 10,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting?.alwaysPreparedSpells).toContain('counterspell');
    expect(resolved.spellcasting?.alwaysPreparedSpells).toContain('dispel-magic');
  });
});

// ── Resolver integration: domain spell level-gating ──────────────────────────

describe('Cleric Life Domain resolver integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'cleric', 0);

  function makeLifeDomainBuild(classLevels: number): CharacterBuild {
    const levels = Array.from({ length: classLevels }, (_, i) => ({
      classId: 'cleric' as ClassId,
      classLevel: i + 1,
      hpRoll: i === 0 ? null : 6,
    }));
    return {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 16, cha: 10 },
      abilityMethod: 'standard-array',
      levels,
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'lifedomain' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
  }

  it('Cleric L5 Life Domain: alwaysPreparedSpells includes mass-healing-word and revivify', () => {
    const build = makeLifeDomainBuild(5);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting).not.toBeNull();
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('mass-healing-word');
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('revivify');
  });

  it('Cleric L5 Life Domain: alwaysPreparedSpells does NOT include aura-of-life (L7 spell)', () => {
    const build = makeLifeDomainBuild(5);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('aura-of-life');
  });

  it('Cleric L5 Life Domain: alwaysPreparedSpells includes all L3 domain spells', () => {
    const build = makeLifeDomainBuild(5);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    const prepared = resolved.spellcasting!.alwaysPreparedSpells;
    expect(prepared).toContain('aid');
    expect(prepared).toContain('bless');
    expect(prepared).toContain('cure-wounds');
    expect(prepared).toContain('lesser-restoration');
  });

  it('Cleric L7 Life Domain: alwaysPreparedSpells includes aura-of-life and death-ward', () => {
    const build = makeLifeDomainBuild(7);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 7,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('aura-of-life');
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('death-ward');
  });

  it('Cleric L9 Life Domain: alwaysPreparedSpells includes greater-restoration and mass-cure-wounds', () => {
    const build = makeLifeDomainBuild(9);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 9,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('greater-restoration');
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('mass-cure-wounds');
  });
});

describe('Cleric Light Domain resolver integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'cleric', 0);

  function makeLightDomainBuild(classLevels: number): CharacterBuild {
    const levels = Array.from({ length: classLevels }, (_, i) => ({
      classId: 'cleric' as ClassId,
      classLevel: i + 1,
      hpRoll: i === 0 ? null : 6,
    }));
    return {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 16, cha: 10 },
      abilityMethod: 'standard-array',
      levels,
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'lightdomain' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
  }

  it('Cleric L3 Light Domain: light is in spellcasting.cantrips (not alwaysPreparedSpells)', () => {
    const build = makeLightDomainBuild(3);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting).not.toBeNull();
    expect(resolved.spellcasting!.cantrips).toContain('light');
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('light');
  });

  it('Cleric L3 Light Domain: L3 leveled domain spells are in alwaysPreparedSpells', () => {
    const build = makeLightDomainBuild(3);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    const prepared = resolved.spellcasting!.alwaysPreparedSpells;
    expect(prepared).toContain('burning-hands');
    expect(prepared).toContain('faerie-fire');
    expect(prepared).toContain('scorching-ray');
    expect(prepared).toContain('see-invisibility');
  });
});

// ── Resolver integration: Ranger subclasses ──────────────────────────────────

describe('Ranger Fey Wanderer resolver integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'ranger', 0);

  function makeFeyWandererBuild(classLevels: number): CharacterBuild {
    const levels = Array.from({ length: classLevels }, (_, i) => ({
      classId: 'ranger' as ClassId,
      classLevel: i + 1,
      hpRoll: i === 0 ? null : 6,
    }));
    return {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 10, dex: 14, con: 10, int: 10, wis: 14, cha: 10 },
      abilityMethod: 'standard-array',
      levels,
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'feywanderer' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
  }

  it('Ranger L9 Fey Wanderer: alwaysPreparedSpells has L3 charm-person', () => {
    const build = makeFeyWandererBuild(9);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 9,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('charm-person');
  });

  it('Ranger L9 Fey Wanderer: alwaysPreparedSpells has L5 misty-step', () => {
    const build = makeFeyWandererBuild(9);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 9,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('misty-step');
  });

  it('Ranger L9 Fey Wanderer: alwaysPreparedSpells has L9 summon-fey', () => {
    const build = makeFeyWandererBuild(9);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 9,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('summon-fey');
  });

  it('Ranger L9 Fey Wanderer: alwaysPreparedSpells does NOT include L13 dimension-door', () => {
    const build = makeFeyWandererBuild(9);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 9,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('dimension-door');
  });

  it('Ranger L9 Fey Wanderer: alwaysPreparedSpells does NOT include L17 mislead', () => {
    const build = makeFeyWandererBuild(9);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 9,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('mislead');
  });
});

describe('Ranger Gloom Stalker resolver integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'ranger', 0);

  function makeGloomStalkerBuild(classLevels: number): CharacterBuild {
    const levels = Array.from({ length: classLevels }, (_, i) => ({
      classId: 'ranger' as ClassId,
      classLevel: i + 1,
      hpRoll: i === 0 ? null : 6,
    }));
    return {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 10, dex: 14, con: 10, int: 10, wis: 14, cha: 10 },
      abilityMethod: 'standard-array',
      levels,
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'gloomstalker' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
  }

  it('Ranger L7 Gloom Stalker: savingThrows.wis.proficient is true (Iron Mind WIS save grant)', () => {
    const build = makeGloomStalkerBuild(7);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 7,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.savingThrows.wis.proficient).toBe(true);
  });

  it('Ranger L7 Gloom Stalker: alwaysPreparedSpells has L3 disguise-self', () => {
    const build = makeGloomStalkerBuild(7);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 7,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('disguise-self');
  });

  it('Ranger L7 Gloom Stalker: alwaysPreparedSpells has L5 rope-trick', () => {
    const build = makeGloomStalkerBuild(7);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 7,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).toContain('rope-trick');
  });

  it('Ranger L7 Gloom Stalker: alwaysPreparedSpells does NOT include fear (L9 spell)', () => {
    const build = makeGloomStalkerBuild(7);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 7,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('fear');
  });

  it('Ranger L7 Gloom Stalker: alwaysPreparedSpells does NOT include greater-invisibility (L13 spell)', () => {
    const build = makeGloomStalkerBuild(7);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 7,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('greater-invisibility');
  });

  it('Ranger L7 Gloom Stalker: alwaysPreparedSpells does NOT include seeming (L17 spell)', () => {
    const build = makeGloomStalkerBuild(7);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 7,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('seeming');
  });

  it('Ranger L6 Gloom Stalker: savingThrows.wis.proficient is false (Iron Mind not yet granted)', () => {
    const build = makeGloomStalkerBuild(6);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 6,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.savingThrows.wis.proficient).toBe(false);
  });
});

// ── Resolver integration: Sorcerer subclasses ────────────────────────────────

describe('Sorcerer Aberrant Sorcery resolver integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'sorcerer', 0);

  function makeAberrantBuild(classLevels: number): CharacterBuild {
    const levels = Array.from({ length: classLevels }, (_, i) => ({
      classId: 'sorcerer' as ClassId,
      classLevel: i + 1,
      hpRoll: i === 0 ? null : 4,
    }));
    return {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 },
      abilityMethod: 'standard-array',
      levels,
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'aberrantsorcery' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
  }

  it('Sorcerer L5 Aberrant: alwaysPreparedSpells includes L3 spells (arms-of-hadar, dissonant-whispers) and L5 spells (hunger-of-hadar, sending)', () => {
    const build = makeAberrantBuild(5);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    const prepared = resolved.spellcasting!.alwaysPreparedSpells;
    expect(prepared).toContain('arms-of-hadar');
    expect(prepared).toContain('calm-emotions');
    expect(prepared).toContain('detect-thoughts');
    expect(prepared).toContain('dissonant-whispers');
    expect(prepared).toContain('hunger-of-hadar');
    expect(prepared).toContain('sending');
  });

  it('Sorcerer L5 Aberrant: alwaysPreparedSpells does NOT include L7 spells (evards-black-tentacles)', () => {
    const build = makeAberrantBuild(5);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('evards-black-tentacles');
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('summon-aberration');
  });

  it('Sorcerer L5 Aberrant: mind-sliver is in cantrips (not alwaysPreparedSpells)', () => {
    const build = makeAberrantBuild(5);
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 5,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    expect(resolved.spellcasting!.cantrips).toContain('mind-sliver');
    expect(resolved.spellcasting!.alwaysPreparedSpells).not.toContain('mind-sliver');
  });
});

describe('Sorcerer resource pool resolver integration', () => {
  it('Sorcerer L2: resourcePools includes sorcery-points with max=2 and long-rest regen', () => {
    const subclassKey = createChoiceKey('subclass', 'class', 'sorcerer', 0);
    const build: CharacterBuild = {
      speciesId: 'human' as SpeciesId,
      backgroundId: 'acolyte' as BackgroundId,
      baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 },
      abilityMethod: 'standard-array',
      levels: [
        { classId: 'sorcerer' as ClassId, classLevel: 1, hpRoll: null },
        { classId: 'sorcerer' as ClassId, classLevel: 2, hpRoll: 4 },
      ],
      choices: {
        [subclassKey]: { type: 'subclass' as const, subclassId: 'wildmagicsorcery' as SubclassId },
      },
      feats: [],
      activeItems: [],
    };
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 2,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    const pool = resolved.resourcePools.find((p) => p.poolId === 'sorcery-points');
    expect(pool).toBeDefined();
    expect(pool?.max).toBe(2);
    expect(pool?.regen).toBe('long-rest');
  });
});

describe('Sorcerer Draconic Sorcery Dragon Ancestor resolver integration', () => {
  const subclassKey = createChoiceKey('subclass', 'class', 'sorcerer', 0);
  const dragonAncestorKey = createChoiceKey('feature-choice', 'subclass', 'draconicsorcery', 0);

  const baseBuild: CharacterBuild = {
    speciesId: 'human' as SpeciesId,
    backgroundId: 'acolyte' as BackgroundId,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 },
    abilityMethod: 'standard-array',
    levels: [
      { classId: 'sorcerer' as ClassId, classLevel: 1, hpRoll: null },
      { classId: 'sorcerer' as ClassId, classLevel: 2, hpRoll: 4 },
      { classId: 'sorcerer' as ClassId, classLevel: 3, hpRoll: 4 },
    ],
    choices: {
      [subclassKey]: { type: 'subclass' as const, subclassId: 'draconicsorcery' as SubclassId },
    },
    feats: [],
    activeItems: [],
  };

  it('Draconic L3 undecided: emits a pending feature-choice for dragon ancestor (subclass origin)', () => {
    const { bundles, expandedFeats } = collectBundles(baseBuild);
    const resolved = resolveCharacter({
      baseAbilities: baseBuild.baseAbilities,
      level: 3,
      bundles,
      choices: baseBuild.choices,
      expandedFeats,
    });
    const pending = resolved.pendingChoices.find(
      (c) => c.type === 'feature-choice' && c.choiceKey === dragonAncestorKey
    );
    expect(pending).toBeDefined();
    if (pending?.type === 'feature-choice') {
      expect(pending.options).toHaveLength(10);
      const optionIds = pending.options.map((o) => o.optionId);
      expect(optionIds).toContain('red');
      expect(optionIds).toContain('gold');
      expect(optionIds).toContain('silver');
    }
  });

  it('Draconic L3 with red dragon choice: no pending dragon-ancestor feature-choice', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: {
        ...baseBuild.choices,
        [dragonAncestorKey]: { type: 'feature-choice' as const, optionId: 'red' },
      },
    };
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    const pending = resolved.pendingChoices.find(
      (c) => c.type === 'feature-choice' && c.choiceKey === dragonAncestorKey
    );
    expect(pending).toBeUndefined();
  });

  it('Draconic L3 with red dragon choice: result.features contains draconicsorcery-dragon-ancestor-red', () => {
    const build: CharacterBuild = {
      ...baseBuild,
      choices: {
        ...baseBuild.choices,
        [dragonAncestorKey]: { type: 'feature-choice' as const, optionId: 'red' },
      },
    };
    const { bundles, expandedFeats } = collectBundles(build);
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: 3,
      bundles,
      choices: build.choices,
      expandedFeats,
    });
    const featureIds = resolved.features.map((f) => f.feature.id);
    expect(featureIds).toContain('draconicsorcery-dragon-ancestor-red');
  });
});
