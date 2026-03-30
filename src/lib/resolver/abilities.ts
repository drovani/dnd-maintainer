import type { AbilityKey } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import type { GrantBundle, SourceTag } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { ResolvedAbility } from '@/types/resolved'

import { collectGrantsByType } from '@/lib/resolver/helpers'

export function resolveAbilities(
  baseAbilities: AbilityScores,
  bundles: readonly GrantBundle[],
  choices: Readonly<Record<ChoiceKey, ChoiceDecision>>,
): Readonly<Record<AbilityKey, ResolvedAbility>> {
  const keys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  // Accumulate bonuses per ability
  const bonusList: Record<AbilityKey, { readonly value: number; readonly source: SourceTag }[]> = {
    str: [], dex: [], con: [], int: [], wis: [], cha: [],
  }

  // Direct ability-bonus grants
  for (const { grant, source } of collectGrantsByType(bundles, 'ability-bonus')) {
    bonusList[grant.ability].push({ value: grant.bonus, source })
  }

  // Ability-choice grants — look up the decision in choices
  for (const { grant, source } of collectGrantsByType(bundles, 'ability-choice')) {
    const decision = choices[grant.key]
    if (decision?.type === 'ability-choice') {
      for (const ability of decision.abilities) {
        bonusList[ability].push({ value: grant.bonus, source })
      }
    }
  }

  const result = {} as Record<AbilityKey, ResolvedAbility>
  for (const key of keys) {
    const base = baseAbilities[key]
    const bonuses = bonusList[key]
    const rawTotal = base + bonuses.reduce((sum, b) => sum + b.value, 0)
    const total = Math.min(rawTotal, 20)
    result[key] = {
      base,
      bonuses,
      total,
      modifier: Math.floor((total - 10) / 2),
    }
  }
  return result
}
