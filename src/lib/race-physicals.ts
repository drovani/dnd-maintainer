import type { RaceId } from '@/lib/dnd-helpers';

export interface DiceSpec {
  readonly count: number;
  readonly sides: number;
}

export interface RacePhysicals {
  readonly heightBase: number; // inches
  readonly heightDice: DiceSpec;
  readonly weightBase: number; // pounds
  readonly weightDice: DiceSpec | null; // null = fixed weight multiplier of 1 (halflings, gnomes)
}

// PHB Chapter 4 height/weight table. Exhaustive by design — adding a RaceId without an entry fails typecheck.
export const RACE_PHYSICALS: Readonly<Record<RaceId, RacePhysicals>> = {
  dragonborn: {
    heightBase: 66,
    heightDice: { count: 2, sides: 8 },
    weightBase: 175,
    weightDice: { count: 2, sides: 6 },
  },
  'dwarf-hill': {
    heightBase: 44,
    heightDice: { count: 2, sides: 4 },
    weightBase: 115,
    weightDice: { count: 2, sides: 6 },
  },
  'dwarf-mountain': {
    heightBase: 48,
    heightDice: { count: 2, sides: 4 },
    weightBase: 130,
    weightDice: { count: 2, sides: 6 },
  },
  'elf-dark': {
    heightBase: 53,
    heightDice: { count: 2, sides: 6 },
    weightBase: 75,
    weightDice: { count: 1, sides: 6 },
  },
  'elf-high': {
    heightBase: 54,
    heightDice: { count: 2, sides: 10 },
    weightBase: 90,
    weightDice: { count: 1, sides: 4 },
  },
  'elf-wood': {
    heightBase: 54,
    heightDice: { count: 2, sides: 10 },
    weightBase: 100,
    weightDice: { count: 1, sides: 4 },
  },
  'gnome-forest': { heightBase: 35, heightDice: { count: 2, sides: 4 }, weightBase: 35, weightDice: null },
  'gnome-rock': { heightBase: 35, heightDice: { count: 2, sides: 4 }, weightBase: 35, weightDice: null },
  halfelf: { heightBase: 57, heightDice: { count: 2, sides: 8 }, weightBase: 110, weightDice: { count: 2, sides: 4 } },
  halforc: { heightBase: 58, heightDice: { count: 2, sides: 10 }, weightBase: 140, weightDice: { count: 2, sides: 6 } },
  'halfling-lightfoot': { heightBase: 31, heightDice: { count: 2, sides: 4 }, weightBase: 35, weightDice: null },
  'halfling-stout': { heightBase: 31, heightDice: { count: 2, sides: 4 }, weightBase: 35, weightDice: null },
  human: { heightBase: 56, heightDice: { count: 2, sides: 10 }, weightBase: 110, weightDice: { count: 2, sides: 4 } },
  tiefling: { heightBase: 57, heightDice: { count: 2, sides: 8 }, weightBase: 110, weightDice: { count: 2, sides: 4 } },
};

export function diceRange(spec: DiceSpec): readonly [number, number] {
  return [spec.count, spec.count * spec.sides] as const;
}

/** Formats inches as `5'10"`. */
export function formatHeight(totalInches: number): string {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

/** Parses `5'10"` back to total inches. Returns null on failure. */
export function parseHeight(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(\d+)'(\d+)"$/);
  if (!match) return null;
  return Number(match[1]) * 12 + Number(match[2]);
}

/** Formats lbs as `180 lbs`. */
export function formatWeight(lbs: number): string {
  return `${lbs} lbs`;
}

/** Parses `180 lbs` back to number. Returns null on failure. */
export function parseWeight(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(\d+)\s*lbs$/);
  return match ? Number(match[1]) : null;
}
