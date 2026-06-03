import type { ClassId } from '@/lib/dnd-helpers';

// TODO(verify): confirm 2024 PHB starting-gold GP per class.
// These are the fixed GP alternative to the class starting-equipment package.
// Source: 2024 PHB Starting Equipment tables per class (one-time purchase alternative).
// Reviewer: please cross-check against the "Starting Equipment" entry in each class chapter.
export const STARTING_GOLD_BY_CLASS: Readonly<Record<ClassId, number>> = {
  barbarian: 50,
  bard: 125,
  cleric: 110,
  druid: 50,
  fighter: 175,
  monk: 25,
  paladin: 150,
  ranger: 125,
  rogue: 100,
  sorcerer: 75,
  warlock: 100,
  wizard: 75,
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
