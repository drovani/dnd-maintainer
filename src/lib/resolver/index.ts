import { getProficiencyBonus } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import type { GrantBundle } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { ResolvedCharacter } from '@/types/resolved'
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
  readonly hpRolls: readonly (number | null)[]
}

export function resolveCharacter(input: ResolverInput): ResolvedCharacter {
  const { baseAbilities, level, bundles, choices, hpRolls } = input

  const proficiencyBonus = getProficiencyBonus(level)
  const abilities = resolveAbilities(baseAbilities, bundles, choices)
  const conModifier = abilities.con.modifier
  const dexModifier = abilities.dex.modifier

  const savingThrows = resolveSavingThrows(abilities, bundles)
  const skills = resolveSkills(abilities, bundles, proficiencyBonus, choices)
  const proficiencies = resolveProficiencies(bundles)
  const features = resolveFeatures(bundles)
  const hitPoints = resolveHp(bundles, hpRolls, conModifier, level)
  const speed = resolveSpeed(bundles)
  const armorClass = resolveAc(bundles)
  const spellcasting = resolveSpellcasting(bundles)

  return {
    abilities,
    hitDie: [],
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
    pendingChoices: [],
  }
}
