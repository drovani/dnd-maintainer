import { describe, it, expect } from 'vitest';
import { mapNonEmpty } from '@/lib/non-empty';

describe('mapNonEmpty', () => {
  it('maps every element and preserves the non-empty tuple shape at the type level', () => {
    const result = mapNonEmpty([1, 2, 3] as const, (x) => x * 2);
    expect(result).toEqual([2, 4, 6]);
    // Compile-time: result is `readonly [number, ...number[]]`, so result[0] is non-optional.
    const first: number = result[0];
    expect(first).toBe(2);
  });

  it('handles a single-element tuple', () => {
    const result = mapNonEmpty(['a'] as const, (s) => s.toUpperCase());
    expect(result).toEqual(['A']);
  });

  it('does not mutate the input', () => {
    const input = [1, 2] as const;
    mapNonEmpty(input, (x) => x + 100);
    expect(input).toEqual([1, 2]);
  });
});
