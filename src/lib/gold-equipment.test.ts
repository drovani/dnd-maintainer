import { describe, it, expect } from 'vitest';
import { computePurchaseTotal, getStartingGold, STARTING_GOLD_BY_CLASS } from '@/lib/gold-equipment';
import type { ClassId } from '@/lib/dnd-helpers';

describe('computePurchaseTotal', () => {
  it('returns 0 for an empty list', () => {
    expect(computePurchaseTotal([])).toBe(0);
  });

  it('returns the cost of a single item with quantity 1', () => {
    expect(computePurchaseTotal([{ costGp: 2, quantity: 1 }])).toBe(2);
  });

  it('multiplies cost by quantity', () => {
    expect(computePurchaseTotal([{ costGp: 5, quantity: 4 }])).toBe(20);
  });

  it('sums multiple distinct items', () => {
    expect(
      computePurchaseTotal([
        { costGp: 15, quantity: 1 }, // longsword
        { costGp: 10, quantity: 1 }, // chain shirt
      ])
    ).toBe(25);
  });

  it('handles duplicate items with quantities (as separate entries)', () => {
    expect(
      computePurchaseTotal([
        { costGp: 2, quantity: 3 }, // 3 daggers
        { costGp: 2, quantity: 2 }, // 2 more daggers
      ])
    ).toBe(10);
  });

  it('avoids floating-point drift for fractional GP values (dart edge case: 0.05 + 0.04)', () => {
    // 20 darts at 0.05gp each = 1gp, plus 20 more darts as second entry (0.04+0.05 would drift)
    // Specifically: 0.05 * 100 = 5 copper, 0.04 * 100 = 4 copper — no drift when rounded per item
    expect(
      computePurchaseTotal([
        { costGp: 0.05, quantity: 1 },
        { costGp: 0.04, quantity: 1 },
      ])
    ).toBe(0.09);
  });

  it('handles 20 darts at 0.05gp each without float drift', () => {
    // 20 × 0.05 = 1.0 exactly via copper: round(0.05*100)*20 = 5*20 = 100 copper = 1gp
    expect(computePurchaseTotal([{ costGp: 0.05, quantity: 20 }])).toBe(1.0);
  });

  it('sums items with mixed fractional costs', () => {
    // sling 0.1gp + 20 sling bullets 0.04gp + explorer pack 10gp
    expect(
      computePurchaseTotal([
        { costGp: 0.1, quantity: 1 },
        { costGp: 0.04, quantity: 1 },
        { costGp: 10, quantity: 1 },
      ])
    ).toBe(10.14);
  });
});

describe('getStartingGold', () => {
  it('returns 0 when classId is null', () => {
    expect(getStartingGold(null)).toBe(0);
  });

  it('returns the correct GP for fighter', () => {
    expect(getStartingGold('fighter')).toBe(STARTING_GOLD_BY_CLASS['fighter']);
  });

  it('returns the correct GP for wizard', () => {
    expect(getStartingGold('wizard')).toBe(STARTING_GOLD_BY_CLASS['wizard']);
  });

  it('returns a positive number for every ClassId', () => {
    const classIds: ClassId[] = [
      'barbarian',
      'bard',
      'cleric',
      'druid',
      'fighter',
      'monk',
      'paladin',
      'ranger',
      'rogue',
      'sorcerer',
      'warlock',
      'wizard',
    ];
    for (const classId of classIds) {
      expect(getStartingGold(classId)).toBeGreaterThan(0);
    }
  });
});

describe('STARTING_GOLD_BY_CLASS', () => {
  it('covers all 12 ClassId values without extras (typecheck enforces)', () => {
    // This is a structural/typecheck test — the Readonly<Record<ClassId, number>> type
    // already ensures all 12 keys are present and no unknown keys exist.
    // Here we just verify the runtime object has 12 entries as a sanity check.
    expect(Object.keys(STARTING_GOLD_BY_CLASS)).toHaveLength(12);
  });

  it('all values are non-negative numbers', () => {
    for (const [, gp] of Object.entries(STARTING_GOLD_BY_CLASS)) {
      expect(typeof gp).toBe('number');
      expect(gp).toBeGreaterThanOrEqual(0);
    }
  });
});
