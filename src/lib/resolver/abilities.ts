import type { AbilityKey } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import type { GrantBundle } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { ResolvedAbility } from '@/types/resolved'

export function resolveAbilities(
  baseAbilities: AbilityScores,
  _bundles: readonly GrantBundle[],
  _choices: Readonly<Record<ChoiceKey, ChoiceDecision>>,
): Readonly<Record<AbilityKey, ResolvedAbility>> {
  const keys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  const result = {} as Record<AbilityKey, ResolvedAbility>
  for (const key of keys) {
    const score = baseAbilities[key]
    result[key] = {
      base: score,
      bonuses: [],
      total: score,
      modifier: Math.floor((score - 10) / 2),
    }
  }
  return result
}
