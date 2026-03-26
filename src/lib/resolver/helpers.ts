import type { Grant } from '@/types/grants'
import type { GrantBundle, SourceTag } from '@/types/sources'

export type TaggedGrant<G extends Grant> = {
  readonly grant: G
  readonly source: SourceTag
}

export function collectGrantsByType<G extends Grant>(
  bundles: readonly GrantBundle[],
  type: G['type'],
): readonly TaggedGrant<G>[] {
  const result: TaggedGrant<G>[] = []
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === type) {
        result.push({ grant: grant as G, source: bundle.source })
      }
    }
  }
  return result
}
