import type { GrantBundle } from '@/types/sources';
import type { ResolvedFeature } from '@/types/resolved';
import { collectGrantsByType } from '@/lib/resolver/helpers';

export function resolveFeatures(bundles: readonly GrantBundle[]): readonly ResolvedFeature[] {
  const byId = new Map<string, { entry: ResolvedFeature; rank: number }>();
  for (const { grant, source } of collectGrantsByType(bundles, 'feature')) {
    const rank = source.origin === 'class' || source.origin === 'subclass' ? source.level : 0;
    const existing = byId.get(grant.feature.id);
    if (!existing || rank >= existing.rank) {
      byId.set(grant.feature.id, { entry: { feature: grant.feature, source }, rank });
    }
  }
  return Array.from(byId.values()).map((v) => v.entry);
}
