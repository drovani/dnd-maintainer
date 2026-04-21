import type { ResolvedCharacter } from '@/types/resolved';
import type { TablesInsert } from '@/types/supabase';

/**
 * Builds the rows to insert into `character_items` from a resolved character.
 *
 * Items with the same itemId AND the same source are aggregated into a single
 * row (quantities summed). Items with the same itemId but different sources
 * produce separate rows — preserving the distinct provenance.
 *
 * Called once at finalize time. The idempotency guard (checking for existing
 * rows) lives in `useBuilderAutosave.finalize`.
 */
export function buildMaterializedItemRows(
  resolved: ResolvedCharacter,
  characterId: string
): readonly TablesInsert<'character_items'>[] {
  const grouped = new Map<string, { itemId: string; quantity: number; source: object }>();

  for (const item of resolved.equipment) {
    const key = `${item.itemId}::${JSON.stringify(item.source)}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      grouped.set(key, { itemId: item.itemId, quantity: item.quantity, source: item.source as object });
    }
  }

  const rows: TablesInsert<'character_items'>[] = [];
  for (const { itemId, quantity, source } of grouped.values()) {
    rows.push({
      character_id: characterId,
      item_id: itemId,
      quantity,
      equipped: false,
      attuned: false,
      source: source as TablesInsert<'character_items'>['source'],
    });
  }

  return rows;
}
