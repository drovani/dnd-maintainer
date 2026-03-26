import { describe, it, expect } from 'vitest'
import {
  getRaceSource,
  getClassSource,
  getSubclassSource,
  getBackgroundSource,
  getFeatSource,
  getItemSource,
  collectBundles,
} from '@/lib/sources'
import type { CharacterBuild } from '@/types/choices'
import type { RaceId, BackgroundId, ClassId } from '@/lib/dnd-helpers'

const humanFighterL1Build: CharacterBuild = {
  raceId: 'human' as RaceId,
  backgroundId: 'soldier' as BackgroundId,
  baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
  abilityMethod: 'standard-array',
  appliedLevels: [{ classId: 'fighter' as ClassId, classLevel: 1 }],
  choices: {},
  feats: [],
  activeItems: [],
  hpRolls: [],
}

describe('getRaceSource', () => {
  it('returns a RaceSource for human with correct fields', () => {
    const source = getRaceSource('human' as RaceId)
    expect(source).toBeDefined()
    expect(source?.id).toBe('human')
    expect(source?.defaultSize).toBe('medium')
    expect(source?.defaultSpeed).toBe(30)
    expect(source?.grants).toBeDefined()
    expect(source?.grants.length).toBeGreaterThan(0)
  })
})

describe('getClassSource', () => {
  it('returns a ClassSource for fighter with 20 levels', () => {
    const source = getClassSource('fighter' as Parameters<typeof getClassSource>[0])
    expect(source).toBeDefined()
    expect(source?.id).toBe('fighter')
    expect(source?.levels).toHaveLength(20)
  })

  it('fighter level 1 has correct grant count', () => {
    const source = getClassSource('fighter' as Parameters<typeof getClassSource>[0])
    // 4 armor + 2 weapon + 2 saving-throw + 1 skill-choice + 1 armor-class + 2 features + 1 hit-die = 13
    expect(source?.levels[0].grants).toHaveLength(13)
  })
})

describe('getSubclassSource', () => {
  it('returns undefined', () => {
    expect(getSubclassSource('champion')).toBeUndefined()
  })
})

describe('getBackgroundSource', () => {
  it('returns a BackgroundSource for soldier with correct grants', () => {
    const source = getBackgroundSource('soldier' as BackgroundId)
    expect(source).toBeDefined()
    expect(source?.id).toBe('soldier')
    // 2 skill + 1 tool + 1 tool-choice + 1 language-choice = 5
    expect(source?.grants).toHaveLength(5)
  })
})

describe('getFeatSource', () => {
  it('returns undefined', () => {
    expect(getFeatSource('alert')).toBeUndefined()
  })
})

describe('getItemSource', () => {
  it('returns undefined', () => {
    expect(getItemSource('longsword')).toBeUndefined()
  })
})

describe('collectBundles', () => {
  it('returns 3 bundles for Human Fighter L1 build', () => {
    const bundles = collectBundles(humanFighterL1Build)
    // race bundle + class L1 bundle + background bundle = 3
    expect(bundles).toHaveLength(3)
  })

  it('does not throw for unknown IDs', () => {
    const unknownBuild: CharacterBuild = {
      ...humanFighterL1Build,
      raceId: 'gnome-forest' as RaceId,
      backgroundId: 'hermit' as BackgroundId,
      appliedLevels: [],
    }
    expect(() => collectBundles(unknownBuild)).not.toThrow()
  })
})
