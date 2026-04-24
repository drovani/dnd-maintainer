import { describe, it, expect } from 'vitest';
import { resolveFeatures } from '@/lib/resolver/features';
import type { GrantBundle } from '@/types/sources';

describe('resolveFeatures', () => {
  it('returns empty array when no bundles have feature grants', () => {
    const result = resolveFeatures([]);
    expect(result).toHaveLength(0);
  });

  it('returns a single entry for a single feature grant', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'class', id: 'barbarian', level: 1 },
        grants: [{ type: 'feature', feature: { id: 'barbarian-rage', usesCount: 2 } }],
      },
    ];
    const result = resolveFeatures(bundles);
    expect(result).toHaveLength(1);
    expect(result[0].feature.id).toBe('barbarian-rage');
    expect(result[0].feature.usesCount).toBe(2);
  });

  it('dedupes duplicate ids, keeping the higher-level class entry', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'class', id: 'barbarian', level: 1 },
        grants: [{ type: 'feature', feature: { id: 'barbarian-rage', usesCount: 2 } }],
      },
      {
        source: { origin: 'class', id: 'barbarian', level: 3 },
        grants: [{ type: 'feature', feature: { id: 'barbarian-rage', usesCount: 3 } }],
      },
    ];
    const result = resolveFeatures(bundles);
    expect(result).toHaveLength(1);
    expect(result[0].feature.usesCount).toBe(3);
    expect(result[0].source).toMatchObject({ origin: 'class', level: 3 });
  });

  it('keeps both entries when feature ids are distinct', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'class', id: 'barbarian', level: 1 },
        grants: [
          { type: 'feature', feature: { id: 'barbarian-rage' } },
          { type: 'feature', feature: { id: 'barbarian-unarmored-defense' } },
        ],
      },
    ];
    const result = resolveFeatures(bundles);
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.feature.id);
    expect(ids).toContain('barbarian-rage');
    expect(ids).toContain('barbarian-unarmored-defense');
  });

  it('non-class sources (origin !== class/subclass) rank as 0 and are overridden by any class entry', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'feature', feature: { id: 'shared-feature', usesCount: 0 } }],
      },
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'feature', feature: { id: 'shared-feature', usesCount: 1 } }],
      },
    ];
    const result = resolveFeatures(bundles);
    expect(result).toHaveLength(1);
    // class entry (level 1, rank 1) beats race entry (rank 0)
    expect(result[0].feature.usesCount).toBe(1);
    expect(result[0].source.origin).toBe('class');
  });

  it('non-class source wins if it appears after a class entry with the same id when ranks are equal (rank 0 vs 0)', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'feature', feature: { id: 'shared-feature', usesCount: 1 } }],
      },
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'feature', feature: { id: 'shared-feature', usesCount: 2 } }],
      },
    ];
    const result = resolveFeatures(bundles);
    // Both rank 0, second one wins via `rank >= existing.rank`
    expect(result).toHaveLength(1);
    expect(result[0].feature.usesCount).toBe(2);
  });

  it('higher subclass level beats lower class level for same feature id', () => {
    const bundles: readonly GrantBundle[] = [
      {
        source: { origin: 'class', id: 'barbarian', level: 1 },
        grants: [{ type: 'feature', feature: { id: 'barbarian-rage', usesCount: 2 } }],
      },
      {
        source: { origin: 'subclass', id: 'berserker', classId: 'barbarian', level: 6 },
        grants: [{ type: 'feature', feature: { id: 'barbarian-rage', usesCount: 4 } }],
      },
    ];
    const result = resolveFeatures(bundles);
    expect(result).toHaveLength(1);
    expect(result[0].feature.usesCount).toBe(4);
    expect(result[0].source.origin).toBe('subclass');
  });
});
