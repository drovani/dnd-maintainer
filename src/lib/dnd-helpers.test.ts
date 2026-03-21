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
  it('returns -5 for score 1', () => {
    expect(getAbilityModifier(1)).toBe(-5)
  })

  it('returns -1 for score 8', () => {
    expect(getAbilityModifier(8)).toBe(-1)
  })

  it('returns 0 for score 10', () => {
    expect(getAbilityModifier(10)).toBe(0)
  })

  it('returns 0 for score 11', () => {
    expect(getAbilityModifier(11)).toBe(0)
  })

  it('returns +2 for score 15', () => {
    expect(getAbilityModifier(15)).toBe(2)
  })

  it('returns +5 for score 20', () => {
    expect(getAbilityModifier(20)).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// getProficiencyBonus
// ---------------------------------------------------------------------------
describe('getProficiencyBonus', () => {
  it('returns 2 for level 1', () => {
    expect(getProficiencyBonus(1)).toBe(2)
  })

  it('returns 2 for level 4', () => {
    expect(getProficiencyBonus(4)).toBe(2)
  })

  it('returns 3 for level 5', () => {
    expect(getProficiencyBonus(5)).toBe(3)
  })

  it('returns 3 for level 8', () => {
    expect(getProficiencyBonus(8)).toBe(3)
  })

  it('returns 4 for level 9', () => {
    expect(getProficiencyBonus(9)).toBe(4)
  })

  it('returns 4 for level 12', () => {
    expect(getProficiencyBonus(12)).toBe(4)
  })

  it('returns 5 for level 13', () => {
    expect(getProficiencyBonus(13)).toBe(5)
  })

  it('returns 5 for level 16', () => {
    expect(getProficiencyBonus(16)).toBe(5)
  })

  it('returns 6 for level 17', () => {
    expect(getProficiencyBonus(17)).toBe(6)
  })

  it('returns 6 for level 20', () => {
    expect(getProficiencyBonus(20)).toBe(6)
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
  it('returns 0 for score 8 (minimum)', () => {
    expect(getPointBuyCost(8)).toBe(0)
  })

  it('returns 7 for score 14', () => {
    expect(getPointBuyCost(14)).toBe(7)
  })

  it('returns 9 for score 15 (maximum)', () => {
    expect(getPointBuyCost(15)).toBe(9)
  })

  it('returns 0 for out-of-range score (below 8)', () => {
    expect(getPointBuyCost(7)).toBe(0)
  })

  it('returns 0 for out-of-range score (above 15)', () => {
    expect(getPointBuyCost(16)).toBe(0)
  })
})

describe('getPointBuyIncrementCost', () => {
  it('returns 1 to go from 8 to 9', () => {
    expect(getPointBuyIncrementCost(8)).toBe(1)
  })

  it('returns 2 to go from 13 to 14', () => {
    expect(getPointBuyIncrementCost(13)).toBe(2)
  })

  it('returns 2 to go from 14 to 15', () => {
    expect(getPointBuyIncrementCost(14)).toBe(2)
  })

  it('returns Infinity when already at max (15)', () => {
    expect(getPointBuyIncrementCost(15)).toBe(Infinity)
  })
})

describe('getPointBuyDecrementReturn', () => {
  it('returns 0 when already at minimum (8)', () => {
    expect(getPointBuyDecrementReturn(8)).toBe(0)
  })

  it('returns 1 to go from 9 to 8', () => {
    expect(getPointBuyDecrementReturn(9)).toBe(1)
  })

  it('returns 2 to go from 15 to 14', () => {
    expect(getPointBuyDecrementReturn(15)).toBe(2)
  })

  it('returns 2 to go from 14 to 13', () => {
    expect(getPointBuyDecrementReturn(14)).toBe(2)
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
describe('DND_RACES', () => {
  it('all entries have unique ids', () => {
    const ids = DND_RACES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('DND_CLASSES', () => {
  it('all entries have unique ids', () => {
    const ids = DND_CLASSES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('DND_SKILLS', () => {
  it('all entries have unique ids', () => {
    const ids = DND_SKILLS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('DND_BACKGROUNDS', () => {
  it('all entries have unique ids', () => {
    const ids = DND_BACKGROUNDS.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('DND_ALIGNMENTS', () => {
  it('all entries have unique ids', () => {
    const ids = DND_ALIGNMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
