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

  it('maps subclass_id into choices', () => {
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
    expect(result.choices['fighter-3-subclass']).toEqual({
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
