import { describe, it, expect } from 'vitest'
import { resolveHp, resolveSpeed, resolveAc } from '@/lib/resolver/combat'
import type { GrantBundle } from '@/types/sources'

const NO_BUNDLES: readonly GrantBundle[] = []

describe('resolveHp', () => {
  it('returns 0 max HP when level is 0', () => {
    expect(resolveHp(NO_BUNDLES, [], 0, 0).max).toBe(0)
  })

  it('returns 0 max HP when no hit-die grants', () => {
    expect(resolveHp(NO_BUNDLES, [], 0, 1).max).toBe(0)
  })

  it('level 1: max die + CON modifier', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
    ]
    // CON 15 → modifier +2, HP = 10 + 2 = 12
    expect(resolveHp(bundles, [], 2, 1).max).toBe(12)
  })

  it('level 1 with zero CON modifier: max die only', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
    ]
    expect(resolveHp(bundles, [], 0, 1).max).toBe(10)
  })

  it('level 2: adds rolled value + CON modifier for second level', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
    ]
    // Level 1: 10+2=12, Level 2: roll 7+2=9, total 21
    expect(resolveHp(bundles, [7], 2, 2).max).toBe(21)
  })

  it('uses average (floor die/2 + 1) when roll is null', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'hit-die', die: 10 }],
      },
    ]
    // Level 1: 10+0=10, Level 2: null roll → avg = floor(10/2)+1=6, 6+0=6, total 16
    expect(resolveHp(bundles, [null], 0, 2).max).toBe(16)
  })
})

describe('resolveSpeed', () => {
  it('returns empty record with no bundles', () => {
    const result = resolveSpeed(NO_BUNDLES)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('collects walk speed from grants', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'speed', mode: 'walk', value: 30 }],
      },
    ]
    const result = resolveSpeed(bundles)
    expect(result.walk).toBeDefined()
    expect(result.walk.value).toBe(30)
  })

  it('takes highest value when same mode appears multiple times', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'speed', mode: 'walk', value: 30 }],
      },
      {
        source: { origin: 'feat', id: 'mobile' },
        grants: [{ type: 'speed', mode: 'walk', value: 40 }],
      },
    ]
    const result = resolveSpeed(bundles)
    expect(result.walk.value).toBe(40)
  })

  it('handles multiple speed modes independently', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [
          { type: 'speed', mode: 'walk', value: 30 },
          { type: 'speed', mode: 'swim', value: 30 },
        ],
      },
    ]
    const result = resolveSpeed(bundles)
    expect(result.walk.value).toBe(30)
    expect(result.swim.value).toBe(30)
  })
})

describe('resolveAc', () => {
  it('returns default AC 10 + DEX modifier when no grants', () => {
    const result = resolveAc(NO_BUNDLES, 2)
    expect(result.effective).toBe(12)
    expect(result.calculations).toHaveLength(0)
    expect(result.bonuses).toHaveLength(0)
  })

  it('armored mode: 10 + DEX modifier', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'armor-class', calculation: { mode: 'armored' } }],
      },
    ]
    // DEX 14 → mod +2, armored AC = 10 + 2 = 12
    const result = resolveAc(bundles, 2)
    expect(result.calculations).toHaveLength(1)
    expect(result.calculations[0].mode).toBe('armored')
    expect(result.calculations[0].baseValue).toBe(12)
    expect(result.effective).toBe(12)
  })

  it('natural armor mode uses baseAc', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'armor-class', calculation: { mode: 'natural', baseAc: 14 } }],
      },
    ]
    const result = resolveAc(bundles, 0)
    expect(result.calculations[0].mode).toBe('natural')
    expect(result.calculations[0].baseValue).toBe(14)
    expect(result.effective).toBe(14)
  })

  it('ac-bonus grants add to effective AC', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          { type: 'armor-class', calculation: { mode: 'armored' } },
          { type: 'ac-bonus', bonus: 2 },
        ],
      },
    ]
    // armored: 10 + 0 = 10, bonus +2 = 12
    const result = resolveAc(bundles, 0)
    expect(result.effective).toBe(12)
    expect(result.bonuses).toHaveLength(1)
  })
})
