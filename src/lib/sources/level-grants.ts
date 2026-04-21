import type { Grant } from '@/types/grants';
import type { ClassId } from '@/lib/dnd-helpers';
import type { SubclassId } from '@/types/sources';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses';

export interface LevelGrantPreview {
  readonly classGrants: readonly Grant[];
  readonly subclassGrants: readonly Grant[];
}

/**
 * Return all grants a class level will produce, without committing any rows.
 * Used by the LevelUpDialog to show what the level grants before the user confirms.
 */
export function getGrantsForLevel(
  classId: ClassId,
  targetClassLevel: number,
  subclassId: SubclassId | null
): LevelGrantPreview {
  const classSource = CLASS_SOURCES.find((cs) => cs.id === classId);
  if (!classSource) {
    console.warn(`getGrantsForLevel: no class source for "${classId}"`);
  }
  const classGrants = classSource?.levels[targetClassLevel - 1]?.grants ?? [];

  let subclassGrants: readonly Grant[] = [];
  if (subclassId) {
    const subclassSource = SUBCLASS_SOURCES.find((sc) => sc.id === subclassId && sc.classId === classId);
    const feature = subclassSource?.features.find((f) => f.classLevel === targetClassLevel);
    subclassGrants = feature?.grants ?? [];
  }

  return { classGrants, subclassGrants };
}
