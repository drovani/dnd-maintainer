import { describe, it, expect } from 'vitest';
import { getSubclassSource } from '@/lib/sources';
import type { SubclassId } from '@/lib/sources/subclasses';

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

  it('wildheart level 3 grants 2 features: animal-speaker and rage-of-the-wilds', () => {
    const source = getSubclassSource('wildheart');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'wildheart-animal-speaker' }),
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

  it('wildheart level 10 grants nature-speaker feature', () => {
    const source = getSubclassSource('wildheart');
    const level10 = source?.features.find((f) => f.classLevel === 10);
    expect(level10).toBeDefined();
    expect(level10?.grants).toHaveLength(1);
    expect(level10?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'wildheart-nature-speaker' },
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

  it('zealot level 3 grants 2 features: divine-fury and warrior-of-the-gods', () => {
    const source = getSubclassSource('zealot');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(2);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'zealot-divine-fury' }),
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

  it('collegedance level 3 grants 3 features: inspirational-dance, unarmored-defense, frolicking-steps', () => {
    const source = getSubclassSource('collegedance');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
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

  it('lifedomain has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('lifedomain');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('lifedomain level 3 grants heavy armor proficiency, disciple-of-life, preserve-life, and domain-spells', () => {
    const source = getSubclassSource('lifedomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(4);
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
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lifedomain-domain-spells' }),
        }),
      ])
    );
  });

  it('lifedomain level 6 grants blessed-strikes feature', () => {
    const source = getSubclassSource('lifedomain');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(1);
    expect(level6?.grants[0]).toMatchObject({
      type: 'feature',
      feature: { id: 'lifedomain-blessed-strikes' },
    });
  });
});

describe('getSubclassSource — Light Domain', () => {
  it('returns defined for lightdomain', () => {
    expect(getSubclassSource('lightdomain')).toBeDefined();
  });

  it('lightdomain has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('lightdomain');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('lightdomain level 3 grants bonus-cantrip, warding-flare, radiance-of-the-dawn, and domain-spells', () => {
    const source = getSubclassSource('lightdomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(4);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lightdomain-bonus-cantrip' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lightdomain-warding-flare' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lightdomain-radiance-of-the-dawn' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'lightdomain-domain-spells' }),
        }),
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
});

describe('getSubclassSource — Trickery Domain', () => {
  it('returns defined for trickerydomain', () => {
    expect(getSubclassSource('trickerydomain')).toBeDefined();
  });

  it('trickerydomain has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('trickerydomain');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('trickerydomain level 3 grants blessing-of-the-trickster, invoke-duplicity, and domain-spells', () => {
    const source = getSubclassSource('trickerydomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(3);
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
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'trickerydomain-domain-spells' }),
        }),
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
});

describe('getSubclassSource — War Domain', () => {
  it('returns defined for wardomain', () => {
    expect(getSubclassSource('wardomain')).toBeDefined();
  });

  it('wardomain has 2 feature levels (L3, L6)', () => {
    const source = getSubclassSource('wardomain');
    expect(source?.features).toHaveLength(2);
    expect(source?.features.map((f) => f.classLevel)).toEqual([3, 6]);
  });

  it('wardomain level 3 grants heavy armor, martial weapons proficiencies, war-priest, guided-strike, and domain-spells', () => {
    const source = getSubclassSource('wardomain');
    const level3 = source?.features.find((f) => f.classLevel === 3);
    expect(level3).toBeDefined();
    expect(level3?.grants).toHaveLength(5);
    expect(level3?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'proficiency', category: 'armor', id: 'heavy' }),
        expect.objectContaining({ type: 'proficiency', category: 'weapon', id: 'martial' }),
        expect.objectContaining({ type: 'feature', feature: expect.objectContaining({ id: 'wardomain-war-priest' }) }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'wardomain-guided-strike' }),
        }),
        expect.objectContaining({
          type: 'feature',
          feature: expect.objectContaining({ id: 'wardomain-domain-spells' }),
        }),
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

  it('circlesea level 6 grants 2 items: swim speed grant and aquatic-affinity feature', () => {
    const source = getSubclassSource('circlesea');
    const level6 = source?.features.find((f) => f.classLevel === 6);
    expect(level6).toBeDefined();
    expect(level6?.grants).toHaveLength(2);
    expect(level6?.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'speed', mode: 'swim', value: 30 }),
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

describe('getSubclassSource — unknown', () => {
  it('returns undefined for unknown subclass', () => {
    expect(getSubclassSource('unknown-subclass' as SubclassId)).toBeUndefined();
  });
});
