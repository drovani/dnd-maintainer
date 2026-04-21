import { describe, expect, it } from 'vitest';
import { diceRange, formatHeight, formatWeight, parseHeight, parseWeight, RACE_PHYSICALS } from './race-physicals';

describe('diceRange', () => {
  it('returns [count, count*sides]', () => {
    expect(diceRange({ count: 2, sides: 10 })).toEqual([2, 20]);
    expect(diceRange({ count: 1, sides: 6 })).toEqual([1, 6]);
  });
});

describe('formatHeight', () => {
  it.each([
    [70, '5\'10"'],
    [60, '5\'0"'],
    [37, '3\'1"'],
  ])('formatHeight(%i) === %s', (inches, expected) => {
    expect(formatHeight(inches)).toBe(expected);
  });
});

describe('parseHeight', () => {
  it('parses valid height strings', () => {
    expect(parseHeight('5\'10"')).toBe(70);
    expect(parseHeight('5\'0"')).toBe(60);
  });
  it('returns null for invalid/null inputs', () => {
    expect(parseHeight(null)).toBeNull();
    expect(parseHeight('bad')).toBeNull();
    expect(parseHeight("5'")).toBeNull();
    expect(parseHeight('')).toBeNull();
  });
});

describe('formatWeight', () => {
  it('formats as "X lbs"', () => {
    expect(formatWeight(180)).toBe('180 lbs');
  });
});

describe('parseWeight', () => {
  it('parses valid weight strings', () => {
    expect(parseWeight('180 lbs')).toBe(180);
    expect(parseWeight('180lbs')).toBe(180);
  });
  it('returns null for invalid/null inputs', () => {
    expect(parseWeight(null)).toBeNull();
    expect(parseWeight('bad')).toBeNull();
  });
});

describe('RACE_PHYSICALS', () => {
  it('has entry for all 14 races', () => {
    expect(RACE_PHYSICALS['human'].heightBase).toBe(56);
    expect(RACE_PHYSICALS['gnome-forest'].weightDice).toBeNull();
    expect(RACE_PHYSICALS['halfling-lightfoot'].weightDice).toBeNull();
    expect(RACE_PHYSICALS['dragonborn'].weightDice).not.toBeNull();
  });
});
