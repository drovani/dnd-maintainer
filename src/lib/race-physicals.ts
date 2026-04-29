import type { SpeciesId } from '@/lib/dnd-helpers';

export interface DiceSpec {
  readonly count: number;
  readonly sides: number;
}

export type WeightRule = { readonly kind: 'fixed' } | { readonly kind: 'variable'; readonly dice: DiceSpec };

export interface SpeciesPhysicals {
  readonly heightBase: number; // inches
  readonly heightDice: DiceSpec;
  readonly weightBase: number; // pounds
  readonly weightRule: WeightRule;
}

// Height/weight data (PHB 2024 and related sources). Exhaustive by design — adding a SpeciesId without an entry fails typecheck.
export const SPECIES_PHYSICALS: Readonly<Record<SpeciesId, SpeciesPhysicals>> = {
  aasimar: {
    heightBase: 56,
    heightDice: { count: 2, sides: 10 },
    weightBase: 110,
    weightRule: { kind: 'variable', dice: { count: 2, sides: 4 } },
  },
  dragonborn: {
    heightBase: 66,
    heightDice: { count: 2, sides: 8 },
    weightBase: 175,
    weightRule: { kind: 'variable', dice: { count: 2, sides: 6 } },
  },
  dwarf: {
    heightBase: 44,
    heightDice: { count: 2, sides: 4 },
    weightBase: 115,
    weightRule: { kind: 'variable', dice: { count: 2, sides: 6 } },
  },
  elf: {
    heightBase: 54,
    heightDice: { count: 2, sides: 10 },
    weightBase: 90,
    weightRule: { kind: 'variable', dice: { count: 1, sides: 4 } },
  },
  gnome: { heightBase: 35, heightDice: { count: 2, sides: 4 }, weightBase: 35, weightRule: { kind: 'fixed' } },
  goliath: {
    heightBase: 76,
    heightDice: { count: 2, sides: 10 },
    weightBase: 200,
    weightRule: { kind: 'variable', dice: { count: 2, sides: 6 } },
  },
  halfling: { heightBase: 31, heightDice: { count: 2, sides: 4 }, weightBase: 35, weightRule: { kind: 'fixed' } },
  human: {
    heightBase: 56,
    heightDice: { count: 2, sides: 10 },
    weightBase: 110,
    weightRule: { kind: 'variable', dice: { count: 2, sides: 4 } },
  },
  orc: {
    heightBase: 58,
    heightDice: { count: 2, sides: 10 },
    weightBase: 140,
    weightRule: { kind: 'variable', dice: { count: 2, sides: 6 } },
  },
  tiefling: {
    heightBase: 57,
    heightDice: { count: 2, sides: 8 },
    weightBase: 110,
    weightRule: { kind: 'variable', dice: { count: 2, sides: 4 } },
  },
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
