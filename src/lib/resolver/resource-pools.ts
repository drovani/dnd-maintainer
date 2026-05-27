import type { GrantBundle } from '@/types/sources';
import type { ResolvedResourcePool } from '@/types/resolved';
import { collectGrantsByType } from '@/lib/resolver/helpers';

export function resolveResourcePools(bundles: readonly GrantBundle[]): readonly ResolvedResourcePool[] {
  const pools: ResolvedResourcePool[] = [];
  for (const { grant, source } of collectGrantsByType(bundles, 'resource-pool')) {
    const { max: maxSpec } = grant;
    const max =
      maxSpec.mode === 'fixed'
        ? maxSpec.value
        : bundles.filter((b) => b.source.origin === 'class' && b.source.id === maxSpec.classId).length;
    pools.push({
      poolId: grant.poolId,
      max,
      regen: grant.regen,
      source,
    });
  }
  return pools;
}
