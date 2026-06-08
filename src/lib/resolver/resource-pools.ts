import type { GrantBundle } from '@/types/sources';
import type { ResolvedResourcePool } from '@/types/resolved';
import { collectGrantsByType, getClassLevel } from '@/lib/resolver/helpers';
import { getProficiencyBonus } from '@/lib/dnd-helpers';
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
      // class-level, level-steps, and proficiency-bonus all key off the character's level in the named class.
      const level = getClassLevel(bundles, maxSpec.classId);
      if (level === 0) {
        logger.warn(
          `resource-pool "${grant.poolId}" declares classId "${maxSpec.classId}" but no bundles for that class were found — max will be 0`
        );
      }
      if (maxSpec.mode === 'level-steps') {
        max = stepValueForLevel(maxSpec.steps, level);
      } else if (maxSpec.mode === 'proficiency-bonus') {
        // PB derived from the class level (correct for single-class characters).
        max = level === 0 ? 0 : getProficiencyBonus(level);
      } else if (maxSpec.mode === 'class-level') {
        max = level;
      } else {
        const _exhaustive: never = maxSpec;
        throw new Error(`Unhandled resource-pool max mode: ${JSON.stringify(_exhaustive)}`);
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
