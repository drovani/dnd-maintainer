import { describe, it, expect } from 'vitest';
import gamedata from '@/locales/en/gamedata.json';

// Regression coverage for the textual corrections in #293: Bard and Bard-college
// feature descriptions were wrong or incomplete. These pin the corrected 2024-PHB
// wording. (Functional/level/feature-restructure fixes are tracked in a separate issue
// per the maintainer's direction.)

const features = gamedata.features as Record<string, { name: string; description: string }>;
const desc = (id: string): string => features[id]?.description ?? '';

describe('Bard feature description corrections (#293)', () => {
  it('Countercharm is the 2024 reaction reroll vs Frightened/Charmed', () => {
    const d = desc('bard-countercharm');
    expect(d).toContain('Reaction');
    expect(d).toContain('Frightened or Charmed');
    expect(d).toContain('reroll');
    expect(d).not.toContain('mind-influencing effects');
  });

  it('Font of Inspiration mentions expending a spell slot to regain Bardic Inspiration', () => {
    expect(desc('bard-font-of-inspiration')).toContain('expend a spell slot');
  });

  it('Magical Secrets lists Bard/Cleric/Druid/Wizard and no longer says "any classes"', () => {
    const d = desc('bard-magical-secrets');
    expect(d).toContain('Bard, Cleric, Druid, and Wizard');
    expect(d).not.toContain('any classes');
  });

  it('Superior Inspiration regains uses until you have two', () => {
    expect(desc('bard-superior-inspiration')).toContain('until you have two');
  });

  it('Words of Creation names Power Word Heal and Power Word Kill', () => {
    const d = desc('bard-words-of-creation');
    expect(d).toContain('Power Word Heal');
    expect(d).toContain('Power Word Kill');
  });

  it('Glamour Mantle of Inspiration grants twice the die roll in temp HP', () => {
    expect(desc('collegeglamour-mantle-of-inspiration')).toContain('twice the number rolled');
  });

  it('Glamour Mantle of Majesty is the corrected Command version (concentration, auto-fail)', () => {
    const d = desc('collegeglamour-mantle-of-majesty');
    expect(d).toContain('Command');
    expect(d).toContain('Concentration');
    expect(d).toContain('automatically fails');
    expect(d).not.toContain('cast Command on yourself');
  });

  it('Valor Extra Attack allows substituting a cantrip', () => {
    const d = desc('collegevalor-extra-attack');
    expect(d).toContain('cantrip');
  });
});
