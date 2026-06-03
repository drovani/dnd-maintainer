import type { Grant } from '@/types/grants';

export interface OriginFeatInfo {
  readonly id: string;
  readonly namespace: 'features' | 'feats';
}

/**
 * Derives the origin feat badge info from a background's grants array.
 *
 * Two shapes exist in the data (see PR #177):
 *   1. `{ type: 'feat', featId }` — common case (e.g. Alert, Savage Attacker).
 *      Maps to namespace 'feats' so callers use `t('feats.<id>.name')`.
 *   2. `{ type: 'feature', feature.id }` where the id starts with
 *      'feat-magic-initiate-' — direct-feature path used by acolyte/guide/sage.
 *      Maps to namespace 'features' so callers use `t('features.<id>.name')`.
 *
 * Feat-grant wins when both are present (preserves pre-extract behaviour).
 * Returns null when neither is found.
 */
export function deriveOriginFeatInfo(grants: readonly Grant[]): OriginFeatInfo | null {
  const featGrant = grants.find((g): g is Extract<Grant, { type: 'feat' }> => g.type === 'feat');
  if (featGrant) return { id: featGrant.featId, namespace: 'feats' };

  const directFeatureGrant = grants.find(
    (g): g is Extract<Grant, { type: 'feature' }> =>
      g.type === 'feature' && g.feature.id.startsWith('feat-magic-initiate-')
  );
  if (directFeatureGrant) return { id: directFeatureGrant.feature.id, namespace: 'features' };

  return null;
}
