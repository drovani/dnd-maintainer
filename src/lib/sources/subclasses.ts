import type { SubclassSource } from '@/types/sources'

export const SUBCLASS_SOURCES: readonly SubclassSource[] = [
  {
    id: 'champion',
    classId: 'fighter',
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'champion-improved-critical' } }] },
      { classLevel: 7, grants: [] },
      { classLevel: 10, grants: [] },
      { classLevel: 15, grants: [] },
      { classLevel: 18, grants: [] },
    ],
  },
]
