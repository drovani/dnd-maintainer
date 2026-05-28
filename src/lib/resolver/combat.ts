import type { SpeedMode } from '@/types/grants';
import type { GrantBundle, SourceTag } from '@/types/sources';
import type { ResolvedArmorClass, Sourced } from '@/types/resolved';
import { collectGrantsByType } from '@/lib/resolver/helpers';

export function resolveHp(
  bundles: readonly GrantBundle[],
  hpRolls: readonly (number | null)[],
  conModifier: number,
  level: number
): { readonly max: number } {
  if (level === 0) return { max: 0 };

  const hitDieGrants = collectGrantsByType(bundles, 'hit-die');
  if (hitDieGrants.length === 0) {
    throw new Error(`No hit die grants found at level ${level} — check class source data`);
  }

  // Use the first hit die found (multi-class would need more logic)
  const die = hitDieGrants[0].grant.die;

  // Level 1: max die + CON modifier
  let max = die + conModifier;

  // Subsequent levels: use rolled values (or average if null)
  // hpRolls is indexed by level row order (0-based). Index 0 is level 1 (skipped -- always max die). Loop starts at index 1 for level 2+.
  for (let i = 1; i < level; i++) {
    const roll = hpRolls[i];
    const value = roll !== null && roll !== undefined ? roll : Math.floor(die / 2) + 1;
    max += value + conModifier;
  }

  return { max };
}

export function resolveSpeed(bundles: readonly GrantBundle[]): Readonly<Partial<Record<SpeedMode, Sourced<number>>>> {
  const speedGrants = collectGrantsByType(bundles, 'speed');

  // First pass: resolve all fixed-value grants, taking the highest per mode.
  // 'walk-equivalent' grants are deferred to a second pass once the walk
  // speed is known.
  const bestPerMode = new Map<SpeedMode, { value: number; sources: SourceTag[] }>();
  const walkEquivalent = new Map<SpeedMode, SourceTag[]>();

  for (const { grant, source } of speedGrants) {
    if (grant.value === 'walk-equivalent') {
      const existing = walkEquivalent.get(grant.mode);
      if (existing) {
        existing.push(source);
      } else {
        walkEquivalent.set(grant.mode, [source]);
      }
      continue;
    }
    const existing = bestPerMode.get(grant.mode);
    if (!existing) {
      bestPerMode.set(grant.mode, { value: grant.value, sources: [source] });
    } else if (grant.value > existing.value) {
      bestPerMode.set(grant.mode, { value: grant.value, sources: [source] });
    } else if (grant.value === existing.value) {
      existing.sources.push(source);
    }
  }

  // Second pass: resolve walk-equivalent grants against the resolved walk speed.
  // If no walk speed exists, the walk-equivalent grant is silently dropped —
  // a character with no walk speed can't have a walk-derived speed anyway.
  const walkSpeed = bestPerMode.get('walk');
  if (walkSpeed) {
    for (const [mode, sources] of walkEquivalent) {
      if (mode === 'walk') continue;
      const existing = bestPerMode.get(mode);
      if (!existing) {
        bestPerMode.set(mode, { value: walkSpeed.value, sources });
      } else if (walkSpeed.value > existing.value) {
        bestPerMode.set(mode, { value: walkSpeed.value, sources });
      } else if (walkSpeed.value === existing.value) {
        existing.sources.push(...sources);
      }
    }
  }

  const result: Partial<Record<SpeedMode, Sourced<number>>> = {};
  for (const [mode, { value, sources }] of bestPerMode) {
    result[mode] = { value, sources };
  }
  return result;
}

export function resolveAc(
  bundles: readonly GrantBundle[],
  dexModifier: number,
  equippedArmor?: { readonly totalBase: number | null; readonly shieldBonus: number } | null,
  bardicDieSize?: 6 | 8 | 10 | 12 | null
): ResolvedArmorClass {
  const acGrants = collectGrantsByType(bundles, 'armor-class');
  const acBonusGrants = collectGrantsByType(bundles, 'ac-bonus');

  const calculations: {
    readonly mode: 'armored' | 'unarmored' | 'natural';
    readonly baseValue: number;
    readonly source: SourceTag;
  }[] = [];

  for (const { grant, source } of acGrants) {
    const calc = grant.calculation;
    switch (calc.mode) {
      case 'armored': {
        // When equipped body armor provides a totalBase, use it; otherwise fall back to 10 + DEX (unequipped)
        const baseValue = equippedArmor?.totalBase != null ? equippedArmor.totalBase : 10 + dexModifier;
        calculations.push({ mode: 'armored', baseValue, source });
        break;
      }
      case 'natural':
        calculations.push({ mode: 'natural', baseValue: calc.baseAc, source });
        break;
      case 'unarmored': {
        let baseValue = 10 + dexModifier;
        switch (calc.formula) {
          case 'dance':
            if (bardicDieSize != null) baseValue += bardicDieSize;
            break;
          case 'barbarian':
            // TODO: add CON modifier when ability scores are threaded through here
            break;
          case 'monk':
            // TODO: add WIS modifier when ability scores are threaded through here
            break;
          default: {
            const _exhaustive: never = calc.formula;
            throw new Error(`Unhandled unarmored formula: ${JSON.stringify(_exhaustive)}`);
          }
        }
        calculations.push({ mode: 'unarmored', baseValue, source });
        break;
      }
      default: {
        const _exhaustive: never = calc;
        throw new Error(`Unhandled AC calculation mode: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }

  const bonuses: { readonly value: number; readonly source: SourceTag }[] = acBonusGrants.map(({ grant, source }) => ({
    value: grant.bonus,
    source,
  }));

  // Add shield bonus whenever a shield is equipped, regardless of body armor
  if (equippedArmor != null && equippedArmor.shieldBonus > 0) {
    bonuses.push({
      value: equippedArmor.shieldBonus,
      source: { origin: 'item', id: 'shield' },
    });
  }

  // Effective AC: highest calculation base + all bonuses
  const baseAc = calculations.length > 0 ? Math.max(...calculations.map((c) => c.baseValue)) : 10 + dexModifier;

  const bonusTotal = bonuses.reduce((sum, b) => sum + b.value, 0);
  const effective = baseAc + bonusTotal;

  return { calculations, bonuses, effective };
}

const BARDIC_DIE_BY_LEVEL: ReadonlyArray<6 | 8 | 10 | 12> = [
  6,
  6,
  6,
  6, // levels 1-4
  8,
  8,
  8,
  8,
  8, // levels 5-9
  10,
  10,
  10,
  10,
  10, // levels 10-14
  12,
  12,
  12,
  12,
  12,
  12, // levels 15-20
];

export function resolveBardicInspiration(
  bundles: readonly GrantBundle[],
  bardLevel: number,
  chaModifier: number
): { readonly dieSize: 6 | 8 | 10 | 12; readonly uses: number } | null {
  const hasBardicInspiration = collectGrantsByType(bundles, 'feature').some(
    ({ grant }) => grant.feature.id === 'bard-bardic-inspiration'
  );
  if (!hasBardicInspiration) return null;
  if (bardLevel < 1) return null;
  const clampedLevel = Math.min(20, bardLevel);
  const dieSize = BARDIC_DIE_BY_LEVEL[clampedLevel - 1];
  // clampedLevel is guaranteed to be in [1, 20] and BARDIC_DIE_BY_LEVEL has 20 entries,
  // so dieSize is structurally always defined — if this throws, the invariant was broken.
  if (dieSize === undefined) throw new Error(`Bardic die lookup failed at level ${bardLevel}`);
  const uses = Math.max(1, chaModifier);
  return { dieSize, uses };
}
