import { describe, it, expect } from 'vitest'
import { CharacterBuildSchema, CharacterBuildSchemaStrict } from '@/lib/schemas/character-build'

const validBuild = {
  raceId: 'human',
  backgroundId: 'soldier',
  baseAbilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  abilityMethod: 'standard-array' as const,
  appliedLevels: [{ classId: 'fighter', classLevel: 1 }],
  choices: {},
  feats: [],
  activeItems: [],
  hpRolls: [null],
}

describe('CharacterBuildSchema', () => {
  it('accepts a valid build', () => {
    const result = CharacterBuildSchema.safeParse(validBuild)
    expect(result.success).toBe(true)
  })

  it('rejects abilities outside 1-30', () => {
    const tooLow = CharacterBuildSchema.safeParse({
      ...validBuild,
      baseAbilities: { ...validBuild.baseAbilities, str: 0 },
    })
    expect(tooLow.success).toBe(false)

    const tooHigh = CharacterBuildSchema.safeParse({
      ...validBuild,
      baseAbilities: { ...validBuild.baseAbilities, str: 31 },
    })
    expect(tooHigh.success).toBe(false)
  })

  it('rejects empty raceId', () => {
    const result = CharacterBuildSchema.safeParse({
      ...validBuild,
      raceId: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid abilityMethod', () => {
    const result = CharacterBuildSchema.safeParse({
      ...validBuild,
      abilityMethod: 'invalid-method',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty build (fresh character with empty arrays)', () => {
    const emptyBuild = {
      raceId: 'human',
      backgroundId: 'soldier',
      baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      abilityMethod: 'standard-array' as const,
      appliedLevels: [],
      choices: {},
      feats: [],
      activeItems: [],
      hpRolls: [],
    }
    const result = CharacterBuildSchema.safeParse(emptyBuild)
    expect(result.success).toBe(true)
  })
})

describe('CharacterBuildSchemaStrict', () => {
  it('rejects mismatched hpRolls and appliedLevels lengths', () => {
    const result = CharacterBuildSchemaStrict.safeParse({
      ...validBuild,
      appliedLevels: [{ classId: 'fighter', classLevel: 1 }],
      hpRolls: [null, 8], // 2 rolls but 1 level
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('hpRolls length must match appliedLevels length')
    }
  })

  it('rejects non-null hpRolls[0]', () => {
    const result = CharacterBuildSchemaStrict.safeParse({
      ...validBuild,
      appliedLevels: [{ classId: 'fighter', classLevel: 1 }],
      hpRolls: [10], // first roll should be null
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('hpRolls[0] must be null (level 1 uses max die)')
    }
  })

  it('rejects non-sequential classLevels', () => {
    const result = CharacterBuildSchemaStrict.safeParse({
      ...validBuild,
      appliedLevels: [
        { classId: 'fighter', classLevel: 1 },
        { classId: 'fighter', classLevel: 3 }, // skips level 2
      ],
      hpRolls: [null, 8],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('classLevels must be sequential per classId')
    }
  })

  it('accepts valid multi-class build', () => {
    const result = CharacterBuildSchemaStrict.safeParse({
      ...validBuild,
      appliedLevels: [
        { classId: 'fighter', classLevel: 1 },
        { classId: 'fighter', classLevel: 2 },
        { classId: 'rogue', classLevel: 1 },
      ],
      hpRolls: [null, 8, 6],
    })
    expect(result.success).toBe(true)
  })
})
