import type { GrantBundle } from '@/types/sources'
import type { ResolvedArmorClass, Sourced } from '@/types/resolved'

export function resolveHp(
  _bundles: readonly GrantBundle[],
  _hpRolls: readonly (number | null)[],
  _conModifier: number,
  _level: number,
): { readonly max: number } {
  return { max: 0 }
}

export function resolveSpeed(_bundles: readonly GrantBundle[]): Readonly<Record<string, Sourced<number>>> {
  return {}
}

export function resolveAc(_bundles: readonly GrantBundle[]): ResolvedArmorClass {
  return {
    calculations: [],
    bonuses: [],
    effective: 10,
  }
}
