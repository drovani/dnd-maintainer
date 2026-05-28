import type { GrantBundle } from '@/types/sources';
import type { ResolvedAbility, ResolvedFeature } from '@/types/resolved';
import type { AbilityKey } from '@/lib/dnd-helpers';
import { collectGrantsByType } from '@/lib/resolver/helpers';

export function resolveFeatures(
  bundles: readonly GrantBundle[],
  abilities: Readonly<Record<AbilityKey, ResolvedAbility>>,
  proficiencyBonus: number
): readonly ResolvedFeature[] {
  return collectGrantsByType(bundles, 'feature').map(({ grant, source }) => {
    const { feature } = grant;
    if (feature.saveDC) {
      return {
        feature,
        source,
        saveDC: 8 + proficiencyBonus + abilities[feature.saveDC.dcAbility].modifier,
      };
    }
    return { feature, source };
  });
}
