import {
  getAbilityModifier,
  getProficiencyBonus,
  getSpellSlots,
  getPointBuyCost,
  getPointBuyIncrementCost,
  getPointBuyDecrementReturn,
  getPointBuyEquivalent,
  roll4d6DropLowest,
  rollAbilityScores,
  getBaseRaceId,
  generateCharacterName,
  DND_RACES,
  DND_CLASSES,
  DND_SKILLS,
  DND_BACKGROUNDS,
  DND_ALIGNMENTS,
} from '@/lib/dnd-helpers'

// ---------------------------------------------------------------------------
// getAbilityModifier
// ---------------------------------------------------------------------------
describe('getAbilityModifier', () => {
  it.each<[number, number]>([
    [1, -5],
    [8, -1],
    [10, 0],
    [11, 0],
    [15, 2],
    [20, 5],
  ])('returns %i for score %i', (score, expected) => {
    expect(getAbilityModifier(score)).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// getProficiencyBonus
// ---------------------------------------------------------------------------
describe('getProficiencyBonus', () => {
  it.each<[number, number]>([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('returns %i for level %i', (level, expected) => {
    expect(getProficiencyBonus(level)).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// getSpellSlots
// ---------------------------------------------------------------------------
describe('getSpellSlots', () => {
  it('returns correct slots for wizard (full caster) at level 1', () => {
    expect(getSpellSlots('wizard', 1)).toEqual([2])
  })

  it('returns correct slots for wizard at level 5', () => {
    expect(getSpellSlots('wizard', 5)).toEqual([4, 3, 2])
  })

  it('returns correct slots for wizard at level 20', () => {
    expect(getSpellSlots('wizard', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1])
  })

  it('returns empty array for paladin (half caster) at level 1', () => {
    expect(getSpellSlots('paladin', 1)).toEqual([])
  })

  it('returns correct slots for paladin at level 5', () => {
    expect(getSpellSlots('paladin', 5)).toEqual([4, 2])
  })

  it('returns empty array for fighter (non-caster) at any level', () => {
    expect(getSpellSlots('fighter', 5)).toEqual([])
  })

  it('returns empty array for unknown class', () => {
    expect(getSpellSlots('unknown-class', 10)).toEqual([])
  })

  it('is case-insensitive for class name', () => {
    expect(getSpellSlots('Wizard', 1)).toEqual(getSpellSlots('wizard', 1))
  })
})

// ---------------------------------------------------------------------------
// Point buy functions
// ---------------------------------------------------------------------------
describe('getPointBuyCost', () => {
  it.each<[number, number]>([
    [8, 0],
    [14, 7],
    [15, 9],
    [7, 0],
    [16, 0],
  ])('returns %i for score %i', (score, expected) => {
    expect(getPointBuyCost(score)).toBe(expected)
  })
})

describe('getPointBuyIncrementCost', () => {
  it.each<[number, number]>([
    [8, 1],
    [13, 2],
    [14, 2],
    [15, Infinity],
  ])('returns %i for score %i', (score, expected) => {
    expect(getPointBuyIncrementCost(score)).toBe(expected)
  })
})

describe('getPointBuyDecrementReturn', () => {
  it.each<[number, number]>([
    [8, 0],
    [9, 1],
    [15, 2],
    [14, 2],
  ])('returns %i for score %i', (score, expected) => {
    expect(getPointBuyDecrementReturn(score)).toBe(expected)
  })
})

describe('getPointBuyEquivalent', () => {
  it('returns 0 for all scores at minimum (8)', () => {
    expect(getPointBuyEquivalent([8, 8, 8, 8, 8, 8])).toBe(0)
  })

  it('calculates correct total for standard array [15,14,13,12,10,8]', () => {
    // costs: 9+7+5+4+2+0 = 27
    expect(getPointBuyEquivalent([15, 14, 13, 12, 10, 8])).toBe(27)
  })

  it('clamps scores below 8 to 8 (cost 0)', () => {
    expect(getPointBuyEquivalent([6])).toBe(0)
  })

  it('clamps scores above 15 to 15 (cost 9)', () => {
    expect(getPointBuyEquivalent([20])).toBe(9)
  })

  it('handles empty array', () => {
    expect(getPointBuyEquivalent([])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// roll4d6DropLowest / rollAbilityScores
// ---------------------------------------------------------------------------
describe('roll4d6DropLowest', () => {
  it('always produces a result in the range 3–18 over many rolls', () => {
    for (let i = 0; i < 200; i++) {
      const result = roll4d6DropLowest()
      expect(result).toBeGreaterThanOrEqual(3)
      expect(result).toBeLessThanOrEqual(18)
    }
  })

  it('uses Math.random — returns 3 when all dice roll 1 (Math.random mocked to 0)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    // Math.floor(0 * 6) + 1 = 1 for all four dice; drop lowest (1), sum 1+1+1 = 3
    expect(roll4d6DropLowest()).toBe(3)
  })

  it('returns 18 when all dice roll 6 (Math.random mocked to just below 1)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999)
    // Math.floor(0.9999 * 6) + 1 = 6 for all four dice; drop lowest (6), sum 6+6+6 = 18
    expect(roll4d6DropLowest()).toBe(18)
  })
})

describe('rollAbilityScores', () => {
  it('returns an array of exactly 6 scores', () => {
    expect(rollAbilityScores()).toHaveLength(6)
  })

  it('all scores are in range 3–18', () => {
    const scores = rollAbilityScores()
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(3)
      expect(score).toBeLessThanOrEqual(18)
    }
  })

  it('returns scores sorted in descending order', () => {
    for (let i = 0; i < 20; i++) {
      const scores = rollAbilityScores()
      for (let j = 0; j < scores.length - 1; j++) {
        expect(scores[j]).toBeGreaterThanOrEqual(scores[j + 1])
      }
    }
  })
})

// ---------------------------------------------------------------------------
// getBaseRaceId
// ---------------------------------------------------------------------------
describe('getBaseRaceId', () => {
  it('returns the same id for a direct match (dragonborn)', () => {
    expect(getBaseRaceId('dragonborn')).toBe('dragonborn')
  })

  it('returns base id for a subrace (dwarf-hill → dwarf)', () => {
    expect(getBaseRaceId('dwarf-hill')).toBe('dwarf')
  })

  it('returns base id for another subrace (elf-dark → elf)', () => {
    expect(getBaseRaceId('elf-dark')).toBe('elf')
  })

  it('returns halfelf directly (no hyphen, direct match)', () => {
    expect(getBaseRaceId('halfelf')).toBe('halfelf')
  })

  it('returns halforc directly (no hyphen, direct match)', () => {
    expect(getBaseRaceId('halforc')).toBe('halforc')
  })

  it('returns the original id unchanged for an unknown race', () => {
    expect(getBaseRaceId('goblin')).toBe('goblin')
  })

  it('returns halfling for halfling-lightfoot', () => {
    expect(getBaseRaceId('halfling-lightfoot')).toBe('halfling')
  })
})

// ---------------------------------------------------------------------------
// generateCharacterName
// ---------------------------------------------------------------------------
describe('generateCharacterName', () => {
  it('returns null for an unknown race', () => {
    expect(generateCharacterName('goblin', 'male')).toBeNull()
  })

  it('returns a "FirstName ClanName" string for a known race', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const name = generateCharacterName('human', 'male')
    expect(name).not.toBeNull()
    // Should contain exactly one space separating first and clan name
    expect(name).toMatch(/^\S+ \S+$/)
  })

  it('picks the first name and clan when Math.random is 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const name = generateCharacterName('human', 'male')
    // first male name is 'Ander', first clan is 'Brightmantle'
    expect(name).toBe('Ander Brightmantle')
  })

  it('works with a subrace id (dwarf-hill) by resolving to base race', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const name = generateCharacterName('dwarf-hill', 'female')
    // first female dwarf name is 'Amber', first clan is 'Balderk'
    expect(name).toBe('Amber Balderk')
  })

  it('generates female names for gender female', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const name = generateCharacterName('tiefling', 'female')
    // first female tiefling name is 'Akta', first clan is 'Bloodthorn'
    expect(name).toBe('Akta Bloodthorn')
  })
})

// ---------------------------------------------------------------------------
// Static data shape and counts
// ---------------------------------------------------------------------------
describe.each<[string, ReadonlyArray<{ readonly id: string }>]>([
  ['DND_RACES', DND_RACES],
  ['DND_CLASSES', DND_CLASSES],
  ['DND_SKILLS', DND_SKILLS],
  ['DND_BACKGROUNDS', DND_BACKGROUNDS],
  ['DND_ALIGNMENTS', DND_ALIGNMENTS],
])('%s', (_label, collection) => {
  it('all entries have unique ids', () => {
    const ids = collection.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
