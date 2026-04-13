import type { SpeedMode } from '@/types/grants'
import type { GrantBundle, SourceTag } from '@/types/sources'
import type { ResolvedArmorClass, Sourced } from '@/types/resolved'
import { collectGrantsByType } from '@/lib/resolver/helpers'

export function resolveHp(
  bundles: readonly GrantBundle[],
  hpRolls: readonly (number | null)[],
  conModifier: number,
  level: number,
): { readonly max: number } {
  if (level === 0) return { max: 0 }

  const hitDieGrants = collectGrantsByType(bundles, 'hit-die')
  if (hitDieGrants.length === 0) {
    throw new Error(`No hit die grants found at level ${level} — check class source data`)
  }

  // Use the first hit die found (multi-class would need more logic)
  const die = hitDieGrants[0].grant.die

  // Level 1: max die + CON modifier
  let max = die + conModifier

  // Subsequent levels: use rolled values (or average if null)
  // hpRolls is indexed by level row order (0-based). Index 0 is level 1 (skipped -- always max die). Loop starts at index 1 for level 2+.
  for (let i = 1; i < level; i++) {
    const roll = hpRolls[i]
    const value = roll !== null && roll !== undefined ? roll : Math.floor(die / 2) + 1
    max += value + conModifier
  }

  return { max }
}

export function resolveSpeed(bundles: readonly GrantBundle[]): Readonly<Partial<Record<SpeedMode, Sourced<number>>>> {
  const speedGrants = collectGrantsByType(bundles, 'speed')

  // Group by mode, taking highest value per mode
  const bestPerMode = new Map<SpeedMode, { value: number; sources: SourceTag[] }>()

  for (const { grant, source } of speedGrants) {
    const existing = bestPerMode.get(grant.mode)
    if (!existing) {
      bestPerMode.set(grant.mode, { value: grant.value, sources: [source] })
    } else if (grant.value > existing.value) {
      bestPerMode.set(grant.mode, { value: grant.value, sources: [source] })
    } else if (grant.value === existing.value) {
      existing.sources.push(source)
    }
  }

  const result: Partial<Record<SpeedMode, Sourced<number>>> = {}
  for (const [mode, { value, sources }] of bestPerMode) {
    result[mode] = { value, sources }
  }
  return result
}

export function resolveAc(
  bundles: readonly GrantBundle[],
  dexModifier: number,
  equippedArmor?: { readonly totalBase: number | null; readonly shieldBonus: number } | null,
): ResolvedArmorClass {
  const acGrants = collectGrantsByType(bundles, 'armor-class')
  const acBonusGrants = collectGrantsByType(bundles, 'ac-bonus')

  const calculations: { readonly mode: 'armored' | 'unarmored' | 'natural'; readonly baseValue: number; readonly source: SourceTag }[] = []

  for (const { grant, source } of acGrants) {
    const calc = grant.calculation
    switch (calc.mode) {
      case 'armored': {
        // When equipped body armor provides a totalBase, use it; otherwise fall back to 10 + DEX (unequipped)
        const baseValue = equippedArmor?.totalBase != null ? equippedArmor.totalBase : 10 + dexModifier
        calculations.push({ mode: 'armored', baseValue, source })
        break
      }
      case 'natural':
        calculations.push({ mode: 'natural', baseValue: calc.baseAc, source })
        break
      case 'unarmored':
        // Unarmored: 10 + DEX modifier. TODO: barbarian formula should add CON modifier, monk should add WIS modifier.
        calculations.push({ mode: 'unarmored', baseValue: 10 + dexModifier, source })
        break
      default: {
        const _exhaustive: never = calc
        throw new Error(`Unhandled AC calculation mode: ${JSON.stringify(_exhaustive)}`)
      }
    }
  }

  const bonuses: { readonly value: number; readonly source: SourceTag }[] = acBonusGrants.map(({ grant, source }) => ({
    value: grant.bonus,
    source,
  }))

  // Add shield bonus whenever a shield is equipped, regardless of body armor
  if (equippedArmor != null && equippedArmor.shieldBonus > 0) {
    bonuses.push({
      value: equippedArmor.shieldBonus,
      source: { origin: 'item', id: 'shield' },
    })
  }

  // Effective AC: highest calculation base + all bonuses
  const baseAc = calculations.length > 0
    ? Math.max(...calculations.map((c) => c.baseValue))
    : 10 + dexModifier

  const bonusTotal = bonuses.reduce((sum, b) => sum + b.value, 0)
  const effective = baseAc + bonusTotal

  return { calculations, bonuses, effective }
}
