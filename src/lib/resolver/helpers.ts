import type { Grant } from '@/types/grants'
import type { GrantBundle, SourceTag } from '@/types/sources'

export type TaggedGrant<G extends Grant> = {
  readonly grant: G
  readonly source: SourceTag
}

type GrantByType = { [G in Grant as G['type']]: G }

export function collectGrantsByType<T extends Grant['type']>(
  bundles: readonly GrantBundle[],
  type: T,
): readonly { grant: GrantByType[T]; source: SourceTag }[] {
  const result: { grant: GrantByType[T]; source: SourceTag }[] = []
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === type) {
        result.push({ grant: grant as GrantByType[T], source: bundle.source })
      }
    }
  }
  return result
}
