import type { SpellSchool } from '@/types/spells';
import { getSpellDef } from '@/lib/sources/spells';

export interface SpellDisplayMeta {
  readonly level: number;
  readonly school: SpellSchool;
}

/**
 * Returns catalog-level metadata for a spell by id, or null when the id is not
 * in SPELL_CATALOG.  Name translation is intentionally left to the caller
 * so this helper stays pure and framework-free.
 */
export function getSpellDisplayMeta(id: string): SpellDisplayMeta | null {
  const def = getSpellDef(id);
  if (!def) return null;
  return { level: def.level, school: def.school };
}
