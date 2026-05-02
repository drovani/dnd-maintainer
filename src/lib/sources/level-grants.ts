import type { Grant } from '@/types/grants';
import { getLogger } from '@/lib/logger';

const logger = getLogger('sources.level-grants');
import type { ClassId } from '@/lib/dnd-helpers';
import type { SubclassId } from '@/lib/sources/subclasses';
import { SUBCLASS_SOURCES, SUBCLASS_IDS_BY_CLASS } from '@/lib/sources/subclasses';
import { CLASS_SOURCES } from '@/lib/sources/classes';

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
    logger.warn(`getGrantsForLevel: no class source for "${classId}"`);
  }
  const classGrants = classSource?.levels[targetClassLevel - 1]?.grants ?? [];

  let subclassGrants: readonly Grant[] = [];
  if (subclassId && (SUBCLASS_IDS_BY_CLASS[classId] as readonly SubclassId[]).includes(subclassId)) {
    const subclassSource = SUBCLASS_SOURCES[subclassId];
    const feature = subclassSource?.features.find((f) => f.classLevel === targetClassLevel);
    subclassGrants = feature?.grants ?? [];
  }

  return { classGrants, subclassGrants };
}
