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
import type { RaceId, BackgroundId } from '@/lib/dnd-helpers'

const minimalBuild: CharacterBuild = {
  raceId: 'human' as RaceId,
  backgroundId: 'soldier' as BackgroundId,
  baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  abilityMethod: 'standard-array',
  appliedLevels: [],
  choices: {},
  feats: [],
  activeItems: [],
  hpRolls: [],
}

describe('getRaceSource', () => {
  it('returns undefined for any id', () => {
    expect(getRaceSource('human' as RaceId)).toBeUndefined()
  })
})

describe('getClassSource', () => {
  it('returns undefined for any id', () => {
    expect(getClassSource('fighter' as Parameters<typeof getClassSource>[0])).toBeUndefined()
  })
})

describe('getSubclassSource', () => {
  it('returns undefined', () => {
    expect(getSubclassSource('champion')).toBeUndefined()
  })
})

describe('getBackgroundSource', () => {
  it('returns undefined', () => {
    expect(getBackgroundSource('soldier' as BackgroundId)).toBeUndefined()
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
  it('returns empty array', () => {
    const bundles = collectBundles(minimalBuild)
    expect(bundles).toHaveLength(0)
  })

  it('does not throw for unknown IDs', () => {
    expect(() => collectBundles(minimalBuild)).not.toThrow()
  })
})
