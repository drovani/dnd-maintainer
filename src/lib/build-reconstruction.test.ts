import { describe, it, expect } from 'vitest'
import { reconstructBuild } from '@/lib/build-reconstruction'
import type { BuildLevelRow, CharacterIdentity } from '@/lib/build-reconstruction'
import { collectBundles } from '@/lib/sources/index'
import { resolveCharacter } from '@/lib/resolver/index'
import { createChoiceKey } from '@/types/choices'

const identity: CharacterIdentity = { race: 'human', background: 'soldier' }

const creationRow: BuildLevelRow = {
  sequence: 0,
  base_abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  ability_method: 'standard-array',
  class_id: null,
  class_level: null,
  subclass_id: null,
  asi_allocation: null,
  feat_id: null,
  hp_roll: null,
  choices: null,
  deleted_at: null,
}

describe('reconstructBuild', () => {
  it('throws when sequence 0 row is missing', () => {
    const levelRow: BuildLevelRow = {
      sequence: 1,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: 10,
      choices: null,
      deleted_at: null,
    }
    expect(() => reconstructBuild(identity, [levelRow], [])).toThrow(
      'Missing creation row (sequence 0)',
    )
  })

  it('throws when race is null', () => {
    expect(() =>
      reconstructBuild({ race: null, background: 'soldier' }, [creationRow], []),
    ).toThrow('Character is missing required race')
  })

  it('allows null background', () => {
    const result = reconstructBuild({ race: 'human', background: null }, [creationRow], [])
    expect(result.backgroundId).toBeNull()
  })

  it('assembles CharacterBuild from sequence 0 row', () => {
    const result = reconstructBuild(identity, [creationRow], [])
    expect(result.baseAbilities).toEqual({
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    })
    expect(result.abilityMethod).toBe('standard-array')
    expect(result.levels).toHaveLength(0)
  })

  it('maps level rows to levels', () => {
    const level1: BuildLevelRow = {
      sequence: 1,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const level2: BuildLevelRow = {
      sequence: 2,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 2,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: 8,
      choices: null,
      deleted_at: null,
    }
    const result = reconstructBuild(identity, [creationRow, level1, level2], [])
    expect(result.levels).toHaveLength(2)
    expect(result.levels[0]).toEqual({ classId: 'fighter', classLevel: 1, hpRoll: null })
    expect(result.levels[1]).toEqual({ classId: 'fighter', classLevel: 2, hpRoll: 8 })
  })

  it('sorts rows by sequence regardless of input order', () => {
    const level1: BuildLevelRow = {
      sequence: 1,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const level2: BuildLevelRow = {
      sequence: 2,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 2,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: 8,
      choices: null,
      deleted_at: null,
    }
    // Pass rows out of order
    const result = reconstructBuild(identity, [creationRow, level2, level1], [])
    expect(result.levels).toHaveLength(2)
    expect(result.levels[0]).toEqual({ classId: 'fighter', classLevel: 1, hpRoll: null })
    expect(result.levels[1]).toEqual({ classId: 'fighter', classLevel: 2, hpRoll: 8 })
  })

  it('maps subclass_id into choices using createChoiceKey format', () => {
    const level3: BuildLevelRow = {
      sequence: 3,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 3,
      subclass_id: 'champion',
      asi_allocation: null,
      feat_id: null,
      hp_roll: 6,
      choices: null,
      deleted_at: null,
    }
    const expectedKey = createChoiceKey('subclass', 'class', 'fighter', 0)
    const result = reconstructBuild(identity, [creationRow, level3], [])
    expect(result.choices[expectedKey]).toEqual({
      type: 'subclass',
      subclassId: 'champion',
    })
  })

  it('maps asi_allocation into choices using createChoiceKey format', () => {
    const level4: BuildLevelRow = {
      sequence: 4,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 4,
      subclass_id: null,
      asi_allocation: { str: 2 },
      feat_id: null,
      hp_roll: 7,
      choices: null,
      deleted_at: null,
    }
    const expectedKey = createChoiceKey('asi', 'class', 'fighter', 0)
    const result = reconstructBuild(identity, [creationRow, level4], [])
    expect(result.choices[expectedKey]).toEqual({ type: 'asi', allocation: { str: 2 } })
  })

  it('maps multiple asi_allocations to distinct grant indices (fighter levels 4 and 6)', () => {
    const level4: BuildLevelRow = {
      sequence: 4,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 4,
      subclass_id: null,
      asi_allocation: { str: 2 },
      feat_id: null,
      hp_roll: 7,
      choices: null,
      deleted_at: null,
    }
    const level6: BuildLevelRow = {
      sequence: 6,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 6,
      subclass_id: null,
      asi_allocation: { cha: 2 },
      feat_id: null,
      hp_roll: 5,
      choices: null,
      deleted_at: null,
    }
    const result = reconstructBuild(identity, [creationRow, level4, level6], [])
    const key0 = createChoiceKey('asi', 'class', 'fighter', 0)
    const key1 = createChoiceKey('asi', 'class', 'fighter', 1)
    expect(result.choices[key0]).toEqual({ type: 'asi', allocation: { str: 2 } })
    expect(result.choices[key1]).toEqual({ type: 'asi', allocation: { cha: 2 } })
  })

  it('merges choices from JSONB', () => {
    const creationWithChoices: BuildLevelRow = {
      ...creationRow,
      choices: {
        'skill-choice:background:soldier:0': { type: 'skill-choice', skills: ['athletics', 'intimidation'] },
      },
    }
    const result = reconstructBuild(identity, [creationWithChoices], [])
    expect(result.choices['skill-choice:background:soldier:0']).toEqual({
      type: 'skill-choice',
      skills: ['athletics', 'intimidation'],
    })
  })

  it('uses default abilities when base_abilities is null', () => {
    const creationWithNullAbilities: BuildLevelRow = {
      ...creationRow,
      base_abilities: null,
    }
    const result = reconstructBuild(identity, [creationWithNullAbilities], [])
    expect(result.baseAbilities).toEqual({
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    })
  })

  it('uses default ability method when ability_method is null', () => {
    const creationWithNullMethod: BuildLevelRow = {
      ...creationRow,
      ability_method: null,
    }
    const result = reconstructBuild(identity, [creationWithNullMethod], [])
    expect(result.abilityMethod).toBe('standard-array')
  })

  it('throws when ability_method is an invalid value', () => {
    const creationWithBadMethod: BuildLevelRow = {
      ...creationRow,
      ability_method: 'invalid-method',
    }
    expect(() => reconstructBuild(identity, [creationWithBadMethod], [])).toThrow(
      'Invalid ability_method',
    )
  })

  it('merges level-row choices JSONB into result', () => {
    const level1WithChoices: BuildLevelRow = {
      sequence: 1,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: {
        'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      },
      deleted_at: null,
    }
    const result = reconstructBuild(identity, [creationRow, level1WithChoices], [])
    expect(result.choices['skill-choice:class:fighter:0']).toEqual({
      type: 'skill-choice',
      skills: ['athletics', 'perception'],
    })
  })

  it('throws when choice JSONB contains invalid data', () => {
    const creationWithBadChoices: BuildLevelRow = {
      ...creationRow,
      choices: { bad: { type: 'unknown' } } as unknown as BuildLevelRow['choices'],
    }
    expect(() => reconstructBuild(identity, [creationWithBadChoices], [])).toThrow()
  })

  it('throws when level row is missing class_id', () => {
    const levelMissingClassId = {
      sequence: 1,
      base_abilities: null,
      ability_method: null,
      class_id: null,
      class_level: 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    } as unknown as BuildLevelRow
    expect(() => reconstructBuild(identity, [creationRow, levelMissingClassId], [])).toThrow()
  })

  it('throws when level row has invalid class_id', () => {
    const levelBadClassId: BuildLevelRow = {
      sequence: 1,
      class_id: 'nonexistent-class',
      class_level: 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    expect(() => reconstructBuild(identity, [creationRow, levelBadClassId], [])).toThrow('Unknown class ID')
  })

  it('equippedItems becomes activeItems', () => {
    const result = reconstructBuild(identity, [creationRow], ['longsword', 'shield'])
    expect(result.activeItems).toEqual(['longsword', 'shield'])
  })

  it('feats extracted from rows with feat_id', () => {
    const levelWithFeat: BuildLevelRow = {
      sequence: 4,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 4,
      subclass_id: null,
      asi_allocation: null,
      feat_id: 'alert',
      hp_roll: 5,
      choices: null,
      deleted_at: null,
    }
    const result = reconstructBuild(identity, [creationRow, levelWithFeat], [])
    expect(result.feats).toEqual(['alert'])
  })

  it('hpRolls mapped from levelRows', () => {
    const level1: BuildLevelRow = {
      sequence: 1,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const level2: BuildLevelRow = {
      sequence: 2,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 2,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: 8,
      choices: null,
      deleted_at: null,
    }
    const result = reconstructBuild(identity, [creationRow, level1, level2], [])
    expect(result.levels.map((l) => l.hpRoll)).toEqual([null, 8])
  })
})

describe('Human Fighter Level 1 round-trip', () => {
  it('reconstructs and resolves a complete Human Fighter L1', () => {
    const character: CharacterIdentity = {
      race: 'human',
      background: 'soldier',
    }

    const rows: BuildLevelRow[] = [
      {
        sequence: 0,
        base_abilities: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 12 },
        ability_method: 'standard-array',
        class_id: null,
        class_level: null,
        subclass_id: null,
        hp_roll: null,
        feat_id: null,
        asi_allocation: null,
        choices: {},
        deleted_at: null,
      },
      {
        sequence: 1,
        base_abilities: null,
        ability_method: null,
        class_id: 'fighter',
        class_level: 1,
        subclass_id: null,
        hp_roll: null,
        feat_id: null,
        asi_allocation: null,
        choices: {
          'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'intimidation'] },
          'fighting-style-choice:class:fighter:0': { type: 'fighting-style-choice', styles: ['defense'] },
        },
        deleted_at: null,
      },
    ]

    // Reconstruct build
    const build = reconstructBuild(character, rows, [])

    // Verify build shape
    expect(build.raceId).toBe('human')
    expect(build.backgroundId).toBe('soldier')
    expect(build.levels).toHaveLength(1)
    expect(build.levels[0].classId).toBe('fighter')

    // Resolve character
    const { bundles } = collectBundles(build)
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: build.levels.length,
      bundles,
      choices: build.choices,
      levels: build.levels,
    })

    // Abilities: base + 1 human racial bonus to each
    expect(resolved.abilities.str.total).toBe(16) // 15 + 1
    expect(resolved.abilities.dex.total).toBe(14) // 13 + 1
    expect(resolved.abilities.con.total).toBe(15) // 14 + 1
    expect(resolved.abilities.int.total).toBe(9)  // 8 + 1
    expect(resolved.abilities.wis.total).toBe(11) // 10 + 1
    expect(resolved.abilities.cha.total).toBe(13) // 12 + 1

    // HP: d10 max at level 1 + CON modifier (15 → +2)
    expect(resolved.hitPoints.max).toBe(12) // 10 + 2

    // AC: armored = 10 + DEX modifier (14 → +2)
    expect(resolved.armorClass.effective).toBe(13) // 10 + 2 (DEX) + 1 (Defense style)

    // Speed: from human race
    expect(resolved.speed['walk']?.value).toBe(30)

    // Proficiency bonus at level 1
    expect(resolved.proficiencyBonus).toBe(2)

    // Saving throws: fighter grants STR and CON proficiency
    expect(resolved.savingThrows.str.proficient).toBe(true)
    expect(resolved.savingThrows.con.proficient).toBe(true)
    expect(resolved.savingThrows.dex.proficient).toBe(false)

    // Skills: athletics and intimidation from fighter skill choice
    // (soldier background also grants these, so proficiency is set either way)
    expect(resolved.skills.athletics.proficient).toBe(true)
    expect(resolved.skills.intimidation.proficient).toBe(true)

    // Features: chosen fighting style (defense) and fighter-second-wind
    expect(resolved.features.length).toBeGreaterThanOrEqual(2)
    const featureIds = resolved.features.map((f) => f.feature.id)
    expect(featureIds).toContain('fighting-style-defense')
    expect(featureIds).toContain('fighter-second-wind')

    // Armor proficiencies from fighter level 1
    expect(resolved.armorProficiencies.map((p) => p.value)).toContain('light')
    expect(resolved.armorProficiencies.map((p) => p.value)).toContain('heavy')

    // Weapon proficiencies from fighter level 1
    expect(resolved.weaponProficiencies.map((p) => p.value)).toContain('simple')
    expect(resolved.weaponProficiencies.map((p) => p.value)).toContain('martial')

    // The fighter skill choice is resolved — no pending skill choices
    const unresolvedSkillChoices = resolved.pendingChoices.filter((c) => c.type === 'skill-choice')
    expect(unresolvedSkillChoices).toHaveLength(0)
  })
})
