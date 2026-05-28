import type { GrantBundle } from '@/types/sources';
import type { ResolvedResourcePool } from '@/types/resolved';
import { collectGrantsByType, getClassLevel } from '@/lib/resolver/helpers';
import { getLogger } from '@/lib/logger';

const logger = getLogger('resolver');

export function resolveResourcePools(bundles: readonly GrantBundle[]): readonly ResolvedResourcePool[] {
  const pools: ResolvedResourcePool[] = [];
  for (const { grant, source } of collectGrantsByType(bundles, 'resource-pool')) {
    const { max: maxSpec } = grant;
    let max: number;
    if (maxSpec.mode === 'fixed') {
      max = maxSpec.value;
    } else {
      max = getClassLevel(bundles, maxSpec.classId);
      if (max === 0) {
        logger.warn(
          `resource-pool "${grant.poolId}" declares classId "${maxSpec.classId}" but no bundles for that class were found — max will be 0`
        );
      }
    }
    pools.push({
      poolId: grant.poolId,
      max,
      regen: grant.regen,
      source,
    });
  }
  return pools;
}
