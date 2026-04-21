import { describe, it, expect } from 'vitest';
import { parseChoiceKey, createChoiceKey } from '@/types/choices';

describe('parseChoiceKey', () => {
  it('parses a valid choice key', () => {
    const result = parseChoiceKey('skill-choice:class:fighter:0');
    expect(result).toEqual({ category: 'skill-choice', origin: 'class', id: 'fighter', index: 0 });
  });

  it('throws on wrong segment count (too few)', () => {
    expect(() => parseChoiceKey('a:b')).toThrow('expected 4 colon-separated segments');
  });

  it('throws on wrong segment count (too many)', () => {
    expect(() => parseChoiceKey('a:b:c:d:e')).toThrow('expected 4 colon-separated segments');
  });

  it('throws on invalid category', () => {
    expect(() => parseChoiceKey('invalid:class:fighter:0')).toThrow('Invalid choice key category');
  });

  it('throws on invalid origin', () => {
    expect(() => parseChoiceKey('skill-choice:invalid:fighter:0')).toThrow('Invalid choice key origin');
  });

  it('throws on NaN index', () => {
    expect(() => parseChoiceKey('skill-choice:class:fighter:abc')).toThrow('must be a non-negative integer');
  });

  it('throws on negative index', () => {
    expect(() => parseChoiceKey('skill-choice:class:fighter:-1')).toThrow('must be a non-negative integer');
  });

  it('throws on float index', () => {
    expect(() => parseChoiceKey('skill-choice:class:fighter:1.5')).toThrow('must be a non-negative integer');
  });

  it('roundtrips with createChoiceKey', () => {
    const key = createChoiceKey('asi', 'class', 'fighter', 2);
    const parsed = parseChoiceKey(key);
    expect(parsed).toEqual({ category: 'asi', origin: 'class', id: 'fighter', index: 2 });
  });
});
