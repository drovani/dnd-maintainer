import type { Grant } from '@/types/grants';
import type { GrantBundle, SourceTag } from '@/types/sources';
import type { ClassId } from '@/lib/dnd-helpers';

export type TaggedGrant<G extends Grant> = {
  readonly grant: G;
  readonly source: SourceTag;
};

// Counts class-origin bundles; relies on collectBundles emitting one per class level.
export function getClassLevel(bundles: readonly GrantBundle[], classId: ClassId): number {
  return bundles.filter((b) => b.source.origin === 'class' && b.source.id === classId).length;
}

type GrantByType = { [G in Grant as G['type']]: G };

export function collectGrantsByType<T extends Grant['type']>(
  bundles: readonly GrantBundle[],
  type: T
): readonly { grant: GrantByType[T]; source: SourceTag }[] {
  const result: { grant: GrantByType[T]; source: SourceTag }[] = [];
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === type) {
        result.push({ grant: grant as GrantByType[T], source: bundle.source });
      }
    }
  }
  return result;
}
