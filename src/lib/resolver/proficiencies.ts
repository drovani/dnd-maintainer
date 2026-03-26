import { DND_SKILLS } from '@/lib/dnd-helpers'
import type { AbilityKey, SkillId, ArmorProficiencyId, WeaponProficiencyId, ToolProficiencyId, LanguageId } from '@/lib/dnd-helpers'
import type { GrantBundle, SourceTag } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { ResolvedAbility, ResolvedSkill, Sourced } from '@/types/resolved'

export function resolveSavingThrows(
  abilities: Readonly<Record<AbilityKey, ResolvedAbility>>,
  _bundles: readonly GrantBundle[],
): Readonly<Record<AbilityKey, { readonly proficient: boolean; readonly bonus: number; readonly sources: readonly SourceTag[] }>> {
  const keys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  const result = {} as Record<AbilityKey, { readonly proficient: boolean; readonly bonus: number; readonly sources: readonly SourceTag[] }>
  for (const key of keys) {
    result[key] = {
      proficient: false,
      bonus: abilities[key].modifier,
      sources: [],
    }
  }
  return result
}

export function resolveSkills(
  abilities: Readonly<Record<AbilityKey, ResolvedAbility>>,
  _bundles: readonly GrantBundle[],
  _proficiencyBonus: number,
  _choices: Readonly<Record<ChoiceKey, ChoiceDecision>>,
): Readonly<Record<SkillId, ResolvedSkill>> {
  const result = {} as Record<SkillId, ResolvedSkill>
  for (const skill of DND_SKILLS) {
    const ability = skill.ability as AbilityKey
    result[skill.id] = {
      ability,
      proficient: false,
      expertise: false,
      bonus: abilities[ability].modifier,
      sources: [],
    }
  }
  return result
}

export function resolveProficiencies(_bundles: readonly GrantBundle[]): {
  readonly armor: readonly Sourced<ArmorProficiencyId>[]
  readonly weapon: readonly Sourced<WeaponProficiencyId>[]
  readonly tool: readonly Sourced<ToolProficiencyId>[]
  readonly language: readonly Sourced<LanguageId>[]
} {
  return {
    armor: [],
    weapon: [],
    tool: [],
    language: [],
  }
}
