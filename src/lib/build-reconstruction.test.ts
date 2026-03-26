import { describe, it, expect } from 'vitest'
import { reconstructBuild } from '@/lib/build-reconstruction'
import type { BuildLevelRow, CharacterIdentity } from '@/lib/build-reconstruction'

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

  it('throws when background is null', () => {
    expect(() =>
      reconstructBuild({ race: 'human', background: null }, [creationRow], []),
    ).toThrow('Character is missing required background')
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
    expect(result.appliedLevels).toHaveLength(0)
  })

  it('maps level rows to appliedLevels', () => {
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
    }
    const result = reconstructBuild(identity, [creationRow, level1, level2], [])
    expect(result.appliedLevels).toHaveLength(2)
    expect(result.appliedLevels[0]).toEqual({ classId: 'fighter', classLevel: 1 })
    expect(result.appliedLevels[1]).toEqual({ classId: 'fighter', classLevel: 2 })
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
    }
    // Pass rows out of order
    const result = reconstructBuild(identity, [creationRow, level2, level1], [])
    expect(result.appliedLevels).toHaveLength(2)
    expect(result.appliedLevels[0]).toEqual({ classId: 'fighter', classLevel: 1 })
    expect(result.appliedLevels[1]).toEqual({ classId: 'fighter', classLevel: 2 })
  })

  it('maps subclass_id into choices using subclass:${classId} key format', () => {
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
    }
    const result = reconstructBuild(identity, [creationRow, level3], [])
    expect(result.choices['subclass:fighter']).toEqual({
      type: 'subclass',
      subclassId: 'champion',
    })
  })

  it('maps asi_allocation into choices', () => {
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
    }
    const result = reconstructBuild(identity, [creationRow, level4], [])
    expect(result.choices['fighter-4-asi']).toEqual({ type: 'asi', allocation: { str: 2 } })
  })

  it('merges choices from JSONB', () => {
    const creationWithChoices: BuildLevelRow = {
      ...creationRow,
      choices: {
        'background-skills': { type: 'skill-choice', skills: ['athletics', 'intimidation'] },
      },
    }
    const result = reconstructBuild(identity, [creationWithChoices], [])
    expect(result.choices['background-skills']).toEqual({
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
        'fighter-skills': { type: 'skill-choice', skills: ['athletics', 'perception'] },
      },
    }
    const result = reconstructBuild(identity, [creationRow, level1WithChoices], [])
    expect(result.choices['fighter-skills']).toEqual({
      type: 'skill-choice',
      skills: ['athletics', 'perception'],
    })
  })

  it('throws when choice JSONB contains invalid data', () => {
    const creationWithBadChoices: BuildLevelRow = {
      ...creationRow,
      choices: { bad: { type: 'unknown' } },
    }
    expect(() => reconstructBuild(identity, [creationWithBadChoices], [])).toThrow()
  })

  it('throws when level row is missing class_id', () => {
    const levelMissingClassId: BuildLevelRow = {
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
    }
    expect(() => reconstructBuild(identity, [creationRow, levelMissingClassId], [])).toThrow(
      'missing class_id',
    )
  })

  it('throws when level row is missing class_level', () => {
    const levelMissingClassLevel: BuildLevelRow = {
      sequence: 1,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: null,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
    }
    expect(() => reconstructBuild(identity, [creationRow, levelMissingClassLevel], [])).toThrow(
      'missing class_level',
    )
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
    }
    const result = reconstructBuild(identity, [creationRow, level1, level2], [])
    expect(result.hpRolls).toEqual([null, 8])
  })
})
