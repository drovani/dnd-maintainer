import { describe, it, expect } from 'vitest';
import { makeQuickBuild } from '@/types/sources';

describe('makeQuickBuild', () => {
  it('passes through a valid quick-build spec unchanged', () => {
    const qb = makeQuickBuild({
      highestAbility: ['str', 'dex'],
      secondaryAbility: 'con',
      suggestedBackground: 'soldier',
    });
    expect(qb.highestAbility).toEqual(['str', 'dex']);
    expect(qb.secondaryAbility).toBe('con');
  });

  it('throws when secondaryAbility overlaps highestAbility', () => {
    expect(() =>
      makeQuickBuild({
        highestAbility: ['str', 'dex'],
        secondaryAbility: 'str',
        suggestedBackground: 'soldier',
      })
    ).toThrow(/must not appear/);
  });

  it('throws when highestAbility contains duplicates', () => {
    expect(() =>
      makeQuickBuild({
        highestAbility: ['str', 'str'],
        secondaryAbility: 'con',
        suggestedBackground: 'soldier',
      })
    ).toThrow(/duplicates/);
  });
});
