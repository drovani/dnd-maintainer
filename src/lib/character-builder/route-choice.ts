/**
 * Routing helper for proficiency-style choices where a single item (skill, language, tool)
 * may be eligible for more than one grant — e.g. Athletics is granted by both Human (choose
 * any 1 skill) and Barbarian (choose 2 from a 6-skill list).
 *
 * When the user checks such an item we want it to consume the *most restrictive* eligible
 * grant first: the one with the smallest pool. Filling the narrow Barbarian bucket before the
 * "any skill" Human bucket leaves the broad grant free for skills that can only come from it,
 * which maximizes how many distinct skills the player can ultimately select.
 */

interface RoutableChoice {
  readonly from: readonly unknown[];
  readonly count: number;
}

/**
 * Among `eligible` choices that still have room, return the one with the smallest `from` pool
 * (most restrictive). Ties keep the earlier element (stable). Returns `undefined` when none has
 * room.
 *
 * @param eligible      Choices the item is eligible for (the item is in each `from` pool).
 * @param selectedCount Returns how many items a given choice currently holds.
 */
export function pickMostRestrictiveChoiceWithRoom<T extends RoutableChoice>(
  eligible: readonly T[],
  selectedCount: (choice: T) => number
): T | undefined {
  let best: T | undefined;
  for (const choice of eligible) {
    if (selectedCount(choice) >= choice.count) continue;
    if (best === undefined || choice.from.length < best.from.length) {
      best = choice;
    }
  }
  return best;
}
