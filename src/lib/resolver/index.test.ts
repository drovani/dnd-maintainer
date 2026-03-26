import { describe, it, expect } from 'vitest'
import { resolveCharacter } from '@/lib/resolver'
import type { ResolverInput } from '@/lib/resolver'
import type { AbilityKey } from '@/lib/dnd-helpers'
import { DND_SKILLS } from '@/lib/dnd-helpers'

const baseInput: ResolverInput = {
  baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  level: 0,
  bundles: [],
  choices: {},
  hpRolls: [],
}

describe('resolveCharacter', () => {
  it('returns a valid ResolvedCharacter for empty input', () => {
    const result = resolveCharacter(baseInput)

    // All abilities have total=10, modifier=0
    const abilityKeys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    for (const key of abilityKeys) {
      expect(result.abilities[key].total).toBe(10)
      expect(result.abilities[key].modifier).toBe(0)
    }

    expect(result.proficiencyBonus).toBe(2)
    expect(result.pendingChoices).toHaveLength(0)
    expect(result.spellcasting).toBeNull()
    expect(result.hitPoints.max).toBe(0)
  })

  it.each([
    [8, -1],
    [10, 0],
    [12, 1],
    [14, 2],
    [15, 2],
    [20, 5],
  ])('calculates correct ability modifier for score %i → %i', (score, expectedModifier) => {
    const result = resolveCharacter({
      ...baseInput,
      baseAbilities: { str: score, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    })
    expect(result.abilities.str.modifier).toBe(expectedModifier)
  })

  it('returns all 6 ability keys', () => {
    const result = resolveCharacter(baseInput)
    const keys = Object.keys(result.abilities)
    expect(keys).toHaveLength(6)
    expect(keys).toContain('str')
    expect(keys).toContain('dex')
    expect(keys).toContain('con')
    expect(keys).toContain('int')
    expect(keys).toContain('wis')
    expect(keys).toContain('cha')
  })

  it.each([
    [1, 2],
    [5, 3],
  ])('proficiencyBonus at level %i is %i', (level, expectedBonus) => {
    const result = resolveCharacter({ ...baseInput, level })
    expect(result.proficiencyBonus).toBe(expectedBonus)
  })

  it('is deterministic: same input produces same output', () => {
    const result1 = resolveCharacter(baseInput)
    const result2 = resolveCharacter(baseInput)
    expect(result1.proficiencyBonus).toBe(result2.proficiencyBonus)
    expect(result1.abilities.str.total).toBe(result2.abilities.str.total)
    expect(result1.hitPoints.max).toBe(result2.hitPoints.max)
  })

  it('all skills have correct ability mapping', () => {
    const result = resolveCharacter(baseInput)
    for (const skillDef of DND_SKILLS) {
      const skill = result.skills[skillDef.id]
      expect(skill).toBeDefined()
      expect(skill.ability).toBe(skillDef.ability)
    }
  })
})
