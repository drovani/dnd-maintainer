import { getProficiencyBonus } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import type { GrantBundle } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { ResolvedCharacter, PendingChoice } from '@/types/resolved'
import type { HitDie } from '@/types/grants'
import { collectGrantsByType } from '@/lib/resolver/helpers'
import { resolveAbilities } from '@/lib/resolver/abilities'
import { resolveSavingThrows, resolveSkills, resolveProficiencies } from '@/lib/resolver/proficiencies'
import { resolveFeatures } from '@/lib/resolver/features'
import { resolveHp, resolveSpeed, resolveAc } from '@/lib/resolver/combat'
import { resolveSpellcasting } from '@/lib/resolver/spellcasting'

export interface ResolverInput {
  readonly baseAbilities: AbilityScores
  readonly level: number
  readonly bundles: readonly GrantBundle[]
  readonly choices: Readonly<Record<ChoiceKey, ChoiceDecision>>
  readonly hpRolls?: readonly (number | null)[]
  readonly levels?: readonly { readonly hpRoll: number | null }[]
}

export function resolveCharacter(input: ResolverInput): ResolvedCharacter {
  const { baseAbilities, level, bundles, choices } = input
  const hpRolls = input.hpRolls ?? input.levels?.map((l) => l.hpRoll) ?? []

  const proficiencyBonus = getProficiencyBonus(level)
  const abilities = resolveAbilities(baseAbilities, bundles, choices)
  const conModifier = abilities.con.modifier
  const dexModifier = abilities.dex.modifier

  const savingThrows = resolveSavingThrows(abilities, bundles, proficiencyBonus)
  const skills = resolveSkills(abilities, bundles, proficiencyBonus, choices)
  const proficiencies = resolveProficiencies(bundles, choices)
  const features = resolveFeatures(bundles)
  const hitPoints = resolveHp(bundles, hpRolls, conModifier, level)
  const speed = resolveSpeed(bundles)
  const armorClass = resolveAc(bundles, dexModifier)
  const spellcasting = resolveSpellcasting(bundles)

  // Build hitDie array from hit-die grants
  const hitDieGrants = collectGrantsByType(bundles, 'hit-die')
  const hitDieMap = new Map<HitDie, number>()
  for (const { grant } of hitDieGrants) {
    hitDieMap.set(grant.die, (hitDieMap.get(grant.die) ?? 0) + 1)
  }
  const hitDie = Array.from(hitDieMap.entries()).map(([die, count]) => ({ die, count }))

  // Aggregate pending choices
  const pendingChoices: PendingChoice[] = [...proficiencies.pendingChoices]

  // Unresolved ability-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'ability-choice')) {
    const decision = choices[grant.key]
    if (!decision || decision.type !== 'ability-choice') {
      pendingChoices.push({
        type: 'ability-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        bonus: grant.bonus,
        from: grant.from,
      })
    }
  }

  // Unresolved skill-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'proficiency-choice')) {
    if (grant.category === 'skill') {
      const decision = choices[grant.key]
      if (!decision || decision.type !== 'skill-choice') {
        pendingChoices.push({
          type: 'skill-choice',
          choiceKey: grant.key,
          source,
          category: 'skill',
          count: grant.count,
          from: grant.from,
        })
      }
    }
  }

  // Unresolved or invalid ASI grants
  for (const { grant, source } of collectGrantsByType(bundles, 'asi')) {
    const decision = choices[grant.key]
    const totalAllocated = decision?.type === 'asi'
      ? Object.values(decision.allocation).reduce((sum, v) => sum + (v ?? 0), 0)
      : 0
    const isValid = decision?.type === 'asi' && totalAllocated > 0 && totalAllocated <= grant.points
    if (!isValid) {
      pendingChoices.push({
        type: 'asi',
        choiceKey: grant.key,
        source,
        points: grant.points,
      })
    }
  }

  // Unresolved subclass grants
  for (const { grant, source } of collectGrantsByType(bundles, 'subclass')) {
    const decision = choices[grant.key]
    if (!decision || decision.type !== 'subclass') {
      pendingChoices.push({
        type: 'subclass',
        choiceKey: grant.key,
        source,
        classId: grant.classId,
      })
    }
  }

  return {
    abilities,
    hitDie,
    hitPoints,
    speed,
    initiative: dexModifier,
    proficiencyBonus,
    armorClass,
    savingThrows,
    skills,
    armorProficiencies: proficiencies.armor,
    weaponProficiencies: proficiencies.weapon,
    toolProficiencies: proficiencies.tool,
    languages: proficiencies.language,
    features,
    resistances: [],
    immunities: [],
    spellcasting,
    pendingChoices,
  }
}
