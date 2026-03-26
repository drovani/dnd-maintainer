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
  if (hitDieGrants.length === 0) return { max: 0 }

  // Use the first hit die found (multi-class would need more logic)
  const die = hitDieGrants[0].grant.die

  // Level 1: max die + CON modifier
  let max = die + conModifier

  // Subsequent levels: use rolled values (or average if null)
  // hpRolls[0] = level 1 slot (unused — level 1 always uses max die)
  // hpRolls[i] = roll for level i+1
  for (let i = 1; i < level; i++) {
    const roll = hpRolls[i]
    const value = roll !== null && roll !== undefined ? roll : Math.floor(die / 2) + 1
    max += value + conModifier
  }

  return { max }
}

export function resolveSpeed(bundles: readonly GrantBundle[]): Readonly<Record<string, Sourced<number>>> {
  const speedGrants = collectGrantsByType(bundles, 'speed')

  // Group by mode, taking highest value per mode
  const bestPerMode = new Map<string, { value: number; sources: SourceTag[] }>()

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

  const result: Record<string, Sourced<number>> = {}
  for (const [mode, { value, sources }] of bestPerMode) {
    result[mode] = { value, sources }
  }
  return result
}

export function resolveAc(bundles: readonly GrantBundle[], dexModifier: number): ResolvedArmorClass {
  const acGrants = collectGrantsByType(bundles, 'armor-class')
  const acBonusGrants = collectGrantsByType(bundles, 'ac-bonus')

  const calculations: { readonly mode: 'armored' | 'unarmored' | 'natural'; readonly baseValue: number; readonly source: SourceTag }[] = []

  for (const { grant, source } of acGrants) {
    const calc = grant.calculation
    switch (calc.mode) {
      case 'armored':
        calculations.push({ mode: 'armored', baseValue: 10 + dexModifier, source })
        break
      case 'natural':
        calculations.push({ mode: 'natural', baseValue: calc.baseAc, source })
        break
      case 'unarmored':
        // Basic unarmored: 10 + DEX modifier (barbarian/monk formulas extend this)
        calculations.push({ mode: 'unarmored', baseValue: 10 + dexModifier, source })
        break
      default: {
        const _exhaustive: never = calc
        throw new Error(`Unhandled AC calculation mode: ${JSON.stringify(_exhaustive)}`)
      }
    }
  }

  const bonuses = acBonusGrants.map(({ grant, source }) => ({
    value: grant.bonus,
    source,
  }))

  // Effective AC: highest calculation base + all bonuses
  const baseAc = calculations.length > 0
    ? Math.max(...calculations.map((c) => c.baseValue))
    : 10 + dexModifier

  const bonusTotal = bonuses.reduce((sum, b) => sum + b.value, 0)
  const effective = baseAc + bonusTotal

  return { calculations, bonuses, effective }
}
