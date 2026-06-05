import type { GrantBundle } from '@/types/sources';
import type { ResolvedResourcePool } from '@/types/resolved';
import { collectGrantsByType, getClassLevel } from '@/lib/resolver/helpers';
import { getLogger } from '@/lib/logger';

const logger = getLogger('resolver');

/** Highest-minLevel step whose threshold `level` satisfies wins (order-independent); 0 if none. */
function stepValueForLevel(
  steps: readonly { readonly minLevel: number; readonly value: number }[],
  level: number
): number {
  let bestMin = -1;
  let value = 0;
  for (const step of steps) {
    if (level >= step.minLevel && step.minLevel > bestMin) {
      bestMin = step.minLevel;
      value = step.value;
    }
  }
  return value;
}

export function resolveResourcePools(bundles: readonly GrantBundle[]): readonly ResolvedResourcePool[] {
  const pools: ResolvedResourcePool[] = [];
  for (const { grant, source } of collectGrantsByType(bundles, 'resource-pool')) {
    const { max: maxSpec } = grant;
    let max: number;
    if (maxSpec.mode === 'fixed') {
      max = maxSpec.value;
    } else {
      // class-level and level-steps both key off the character's level in the named class.
      const level = getClassLevel(bundles, maxSpec.classId);
      if (level === 0) {
        logger.warn(
          `resource-pool "${grant.poolId}" declares classId "${maxSpec.classId}" but no bundles for that class were found — max will be 0`
        );
      }
      max = maxSpec.mode === 'level-steps' ? stepValueForLevel(maxSpec.steps, level) : level;
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
