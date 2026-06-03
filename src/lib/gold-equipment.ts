import type { ClassId } from '@/lib/dnd-helpers';
import type { ChoiceKey } from '@/types/choices';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import type { GrantBundle } from '@/types/sources';

// 2024 PHB starting-equipment Option B (spend-gold) values.
export const STARTING_GOLD_BY_CLASS: Readonly<Record<ClassId, number>> = {
  barbarian: 75,
  bard: 90,
  cleric: 110,
  druid: 50,
  fighter: 155,
  monk: 50,
  paladin: 150,
  ranger: 150,
  rogue: 100,
  sorcerer: 50,
  warlock: 100,
  wizard: 55,
};

/**
 * Returns the fixed starting gold amount for the given class, or 0 if classId is null.
 */
export function getStartingGold(classId: ClassId | null): number {
  if (classId === null) return 0;
  return STARTING_GOLD_BY_CLASS[classId];
}

/**
 * Computes the total cost (in GP) of a list of purchased items.
 *
 * Uses integer copper (×100) accumulation to avoid floating-point drift.
 * Each item's cost is rounded to the nearest copper before summing.
 */
export function computePurchaseTotal(items: readonly { costGp: number; quantity: number }[]): number {
  let totalCopper = 0;
  for (const item of items) {
    totalCopper += Math.round(item.costGp * 100) * item.quantity;
  }
  return Math.round(totalCopper) / 100;
}

/**
 * Collects all `bundle-choice` ChoiceKeys that originate from a class source.
 * Used when switching to buy-with-gold mode to clear class equipment selections
 * without touching background-origin bundle choices.
 */
export function collectClassBundleKeys(bundles: readonly GrantBundle[]): readonly ChoiceKey[] {
  return collectGrantsByType(bundles, 'bundle-choice')
    .filter((tg) => tg.source.origin === 'class')
    .map((tg) => tg.grant.key);
}
