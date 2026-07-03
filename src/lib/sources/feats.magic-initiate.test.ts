import { describe, it, expect } from 'vitest';
import { FEAT_SOURCES } from '@/lib/sources/feats';
import gamedata from '@/locales/en/gamedata.json';

// Regression coverage for #286: the Magic Initiate origin feat lets you choose
// Intelligence, Wisdom, or Charisma as the spellcasting ability when you take
// the feat — it is NOT tied to the chosen class's spellcasting ability. These
// tests assert the variant descriptions reflect the free ability choice and no
// longer hardcode a single class-tied ability.

const features = gamedata.features as Record<string, { name: string; description: string }>;

function magicInitiateFeatureIds(): readonly string[] {
  const feat = FEAT_SOURCES.find((f) => f.id === 'magic-initiate');
  const featureChoice = feat?.grants.find((g) => g.type === 'feature-choice');
  if (featureChoice?.type !== 'feature-choice') return [];
  return featureChoice.options.map((o) => o.featureId);
}

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
});
