import { DND_SKILLS } from '@/lib/dnd-helpers'
import type { AbilityKey, SkillId, ArmorProficiencyId, WeaponProficiencyId, ToolProficiencyId, LanguageId } from '@/lib/dnd-helpers'
import type { GrantBundle, SourceTag } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { ProficiencyGrant, ProficiencyChoiceGrant } from '@/types/grants'
import type { ResolvedAbility, ResolvedSkill, Sourced, PendingChoice } from '@/types/resolved'
import { collectGrantsByType } from '@/lib/resolver/helpers'

export function resolveSavingThrows(
  abilities: Readonly<Record<AbilityKey, ResolvedAbility>>,
  bundles: readonly GrantBundle[],
  proficiencyBonus: number,
): Readonly<Record<AbilityKey, { readonly proficient: boolean; readonly bonus: number; readonly sources: readonly SourceTag[] }>> {
  const keys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  const proficientAbilities = new Map<AbilityKey, SourceTag[]>()
  for (const { grant, source } of collectGrantsByType<ProficiencyGrant>(bundles, 'proficiency')) {
    if (grant.category === 'saving-throw') {
      const existing = proficientAbilities.get(grant.id) ?? []
      existing.push(source)
      proficientAbilities.set(grant.id, existing)
    }
  }

  const result = {} as Record<AbilityKey, { readonly proficient: boolean; readonly bonus: number; readonly sources: readonly SourceTag[] }>
  for (const key of keys) {
    const sources = proficientAbilities.get(key) ?? []
    const proficient = sources.length > 0
    result[key] = {
      proficient,
      bonus: abilities[key].modifier + (proficient ? proficiencyBonus : 0),
      sources,
    }
  }
  return result
}

export function resolveSkills(
  abilities: Readonly<Record<AbilityKey, ResolvedAbility>>,
  bundles: readonly GrantBundle[],
  proficiencyBonus: number,
  choices: Readonly<Record<ChoiceKey, ChoiceDecision>>,
): Readonly<Record<SkillId, ResolvedSkill>> {
  const proficientSkills = new Map<SkillId, SourceTag[]>()

  // Direct skill proficiency grants
  for (const { grant, source } of collectGrantsByType<ProficiencyGrant>(bundles, 'proficiency')) {
    if (grant.category === 'skill') {
      const existing = proficientSkills.get(grant.id) ?? []
      existing.push(source)
      proficientSkills.set(grant.id, existing)
    }
  }

  // Skill choice grants — look up decisions
  for (const { grant, source } of collectGrantsByType<ProficiencyChoiceGrant>(bundles, 'proficiency-choice')) {
    if (grant.category === 'skill') {
      const decision = choices[grant.key]
      if (decision?.type === 'skill-choice') {
        for (const skillId of decision.skills) {
          const existing = proficientSkills.get(skillId) ?? []
          existing.push(source)
          proficientSkills.set(skillId, existing)
        }
      }
    }
  }

  const result = {} as Record<SkillId, ResolvedSkill>
  for (const skill of DND_SKILLS) {
    const ability = skill.ability as AbilityKey
    const sources = proficientSkills.get(skill.id) ?? []
    const proficient = sources.length > 0
    result[skill.id] = {
      ability,
      proficient,
      expertise: false,
      bonus: abilities[ability].modifier + (proficient ? proficiencyBonus : 0),
      sources,
    }
  }
  return result
}

export function resolveProficiencies(
  bundles: readonly GrantBundle[],
  choices: Readonly<Record<ChoiceKey, ChoiceDecision>>,
): {
  readonly armor: readonly Sourced<ArmorProficiencyId>[]
  readonly weapon: readonly Sourced<WeaponProficiencyId>[]
  readonly tool: readonly Sourced<ToolProficiencyId>[]
  readonly language: readonly Sourced<LanguageId>[]
  readonly pendingChoices: readonly PendingChoice[]
} {
  const armorMap = new Map<ArmorProficiencyId, SourceTag[]>()
  const weaponMap = new Map<WeaponProficiencyId, SourceTag[]>()
  const toolMap = new Map<ToolProficiencyId, SourceTag[]>()
  const languageMap = new Map<LanguageId, SourceTag[]>()
  const pendingChoices: PendingChoice[] = []

  // Direct proficiency grants
  for (const { grant, source } of collectGrantsByType<ProficiencyGrant>(bundles, 'proficiency')) {
    if (grant.category === 'armor') {
      const existing = armorMap.get(grant.id) ?? []
      existing.push(source)
      armorMap.set(grant.id, existing)
    } else if (grant.category === 'weapon') {
      const existing = weaponMap.get(grant.id) ?? []
      existing.push(source)
      weaponMap.set(grant.id, existing)
    } else if (grant.category === 'tool') {
      const existing = toolMap.get(grant.id) ?? []
      existing.push(source)
      toolMap.set(grant.id, existing)
    } else if (grant.category === 'language') {
      const existing = languageMap.get(grant.id) ?? []
      existing.push(source)
      languageMap.set(grant.id, existing)
    }
  }

  // Choice grants for tool and language categories
  for (const { grant, source } of collectGrantsByType<ProficiencyChoiceGrant>(bundles, 'proficiency-choice')) {
    if (grant.category === 'tool') {
      const decision = choices[grant.key]
      if (decision?.type === 'tool-choice') {
        for (const toolId of decision.tools) {
          const existing = toolMap.get(toolId) ?? []
          existing.push(source)
          toolMap.set(toolId, existing)
        }
      } else {
        pendingChoices.push({
          type: 'tool-choice',
          choiceKey: grant.key,
          source,
          category: 'tool',
          count: grant.count,
          from: grant.from,
        })
      }
    } else if (grant.category === 'language') {
      const decision = choices[grant.key]
      if (decision?.type === 'language-choice') {
        for (const langId of decision.languages) {
          const existing = languageMap.get(langId) ?? []
          existing.push(source)
          languageMap.set(langId, existing)
        }
      } else {
        pendingChoices.push({
          type: 'language-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          from: grant.from,
        })
      }
    }
  }

  const toSourcedArray = <T>(map: Map<T, SourceTag[]>): Sourced<T>[] =>
    Array.from(map.entries()).map(([value, sources]) => ({ value, sources }))

  return {
    armor: toSourcedArray(armorMap),
    weapon: toSourcedArray(weaponMap),
    tool: toSourcedArray(toolMap),
    language: toSourcedArray(languageMap),
    pendingChoices,
  }
}
