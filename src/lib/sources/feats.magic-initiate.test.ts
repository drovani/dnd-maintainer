import { describe, it, expect } from 'vitest';
import { FEAT_SOURCES } from '@/lib/sources/feats';
import gamedata from '@/locales/en/gamedata.json';

// Regression coverage for #286: the Magic Initiate origin feat lets you choose
// Intelligence, Wisdom, or Charisma as the spellcasting ability when you take
// the feat — it is NOT tied to the chosen class's spellcasting ability. These
// tests assert the variant descriptions reflect the free ability choice and no
// longer hardcode a single class-tied ability.

const features = gamedata.features as Record<string, { name: string; description: string }>;
const feats = gamedata.feats as Record<string, { name: string; description?: string }>;

function magicInitiateFeatureIds(): readonly string[] {
  const feat = FEAT_SOURCES.find((f) => f.id === 'magic-initiate');
  const featureChoice = feat?.grants.find((g) => g.type === 'feature-choice');
  if (featureChoice?.type !== 'feature-choice') return [];
  return featureChoice.options.map((o) => o.featureId);
}

function magicInitiateOptionIds(): readonly string[] {
  const feat = FEAT_SOURCES.find((f) => f.id === 'magic-initiate');
  const featureChoice = feat?.grants.find((g) => g.type === 'feature-choice');
  if (featureChoice?.type !== 'feature-choice') return [];
  return featureChoice.options.map((o) => o.optionId);
}

// Regression coverage for #288: in the 2024 PHB the Magic Initiate origin feat
// offers only the Cleric, Druid, or Wizard spell lists. Bard, Sorcerer, and
// Warlock are 2014 holdovers and must not be selectable.
describe('Magic Initiate class options (#288)', () => {
  it('offers exactly Cleric, Druid, and Wizard', () => {
    expect([...magicInitiateOptionIds()].sort()).toEqual(['cleric', 'druid', 'wizard']);
  });

  it.each(['bard', 'sorcerer', 'warlock'])('does not offer %s', (optionId) => {
    expect(magicInitiateOptionIds()).not.toContain(optionId);
  });

  it.each(['feat-magic-initiate-bard', 'feat-magic-initiate-sorcerer', 'feat-magic-initiate-warlock'])(
    'has no gamedata description for the removed %s variant',
    (featureId) => {
      expect(features[featureId]).toBeUndefined();
    }
  );

  it('top-level description lists only Cleric, Druid, or Wizard', () => {
    const description = feats['magic-initiate']?.description ?? '';
    expect(description).toContain('Cleric, Druid, or Wizard');
    expect(description).not.toMatch(/Bard|Sorcerer|Warlock/);
  });
});

describe('Magic Initiate spellcasting ability (#286)', () => {
  const featureIds = magicInitiateFeatureIds();

  it('has at least one Magic Initiate variant', () => {
    expect(featureIds.length).toBeGreaterThan(0);
  });

  it.each(featureIds)('%s description offers a choice of Int/Wis/Cha spellcasting ability', (featureId) => {
    const entry = features[featureId];
    expect(entry, `missing gamedata description for "${featureId}"`).toBeDefined();
    expect(entry.description).toContain('Intelligence, Wisdom, or Charisma');
  });

  it.each(featureIds)('%s description does not hardcode a single class-tied ability', (featureId) => {
    const { description } = features[featureId];
    expect(description).not.toMatch(/(Intelligence|Wisdom|Charisma) is your spellcasting ability/);
  });

  it('top-level feats.magic-initiate description offers the Int/Wis/Cha choice', () => {
    const description = feats['magic-initiate']?.description;
    expect(description, 'missing gamedata description for feats.magic-initiate').toBeDefined();
    expect(description).toContain('Intelligence, Wisdom, or Charisma');
    // must not tie the ability to the chosen class (the #286 bug)
    expect(description).not.toMatch(/spellcasting ability for these spells is the same as the chosen class/);
  });
});
