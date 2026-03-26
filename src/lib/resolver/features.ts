import type { GrantBundle } from '@/types/sources'
import type { ResolvedFeature } from '@/types/resolved'
import { collectGrantsByType } from '@/lib/resolver/helpers'

export function resolveFeatures(bundles: readonly GrantBundle[]): readonly ResolvedFeature[] {
  return collectGrantsByType(bundles, 'feature').map(({ grant, source }) => ({
    feature: grant.feature,
    source,
  }))
}
