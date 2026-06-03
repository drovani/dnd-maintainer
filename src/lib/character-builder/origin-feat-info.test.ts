import { describe, it, expect } from 'vitest';
import { deriveOriginFeatInfo } from '@/lib/character-builder/origin-feat-info';
import type { Grant } from '@/types/grants';

describe('deriveOriginFeatInfo', () => {
  it('returns { namespace: feats } when a feat grant is present', () => {
    const grants: readonly Grant[] = [{ type: 'feat', featId: 'alert' }];
    const result = deriveOriginFeatInfo(grants);
    expect(result).toEqual({ id: 'alert', namespace: 'feats' });
  });

  it('returns { namespace: features } for a direct feat-magic-initiate-cleric feature grant', () => {
    const grants: readonly Grant[] = [{ type: 'feature', feature: { id: 'feat-magic-initiate-cleric' } }];
    const result = deriveOriginFeatInfo(grants);
    expect(result).toEqual({ id: 'feat-magic-initiate-cleric', namespace: 'features' });
  });

  it('returns { namespace: features } for a direct feat-magic-initiate-druid feature grant', () => {
    const grants: readonly Grant[] = [{ type: 'feature', feature: { id: 'feat-magic-initiate-druid' } }];
    const result = deriveOriginFeatInfo(grants);
    expect(result).toEqual({ id: 'feat-magic-initiate-druid', namespace: 'features' });
  });

  it('returns { namespace: features } for a direct feat-magic-initiate-wizard feature grant', () => {
    const grants: readonly Grant[] = [{ type: 'feature', feature: { id: 'feat-magic-initiate-wizard' } }];
    const result = deriveOriginFeatInfo(grants);
    expect(result).toEqual({ id: 'feat-magic-initiate-wizard', namespace: 'features' });
  });

  it('returns null when no feat or magic-initiate feature grant exists', () => {
    const grants: readonly Grant[] = [{ type: 'proficiency', category: 'skill', id: 'insight' }];
    const result = deriveOriginFeatInfo(grants);
    expect(result).toBeNull();
  });

  it('returns null for empty grants array', () => {
    const result = deriveOriginFeatInfo([]);
    expect(result).toBeNull();
  });

  it('feat grant wins over direct feature grant when both are present (feat-first precedence)', () => {
    const grants: readonly Grant[] = [
      { type: 'feature', feature: { id: 'feat-magic-initiate-cleric' } },
      { type: 'feat', featId: 'alert' },
    ];
    const result = deriveOriginFeatInfo(grants);
    expect(result).toEqual({ id: 'alert', namespace: 'feats' });
  });

  it('ignores feature grants whose id does not start with feat-magic-initiate-', () => {
    const grants: readonly Grant[] = [{ type: 'feature', feature: { id: 'fighter-second-wind' } }];
    const result = deriveOriginFeatInfo(grants);
    expect(result).toBeNull();
  });
});
