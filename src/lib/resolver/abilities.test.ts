import { describe, it, expect } from 'vitest'
import { resolveAbilities } from '@/lib/resolver/abilities'
import type { GrantBundle } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { AbilityScores } from '@/types/database'

const BASE: AbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
const NO_BUNDLES: readonly GrantBundle[] = []
const NO_CHOICES: Readonly<Record<ChoiceKey, ChoiceDecision>> = {}

describe('resolveAbilities', () => {
  it('returns base values unchanged when no bundles', () => {
    const result = resolveAbilities(BASE, NO_BUNDLES, NO_CHOICES)
    expect(result.str.total).toBe(10)
    expect(result.str.modifier).toBe(0)
    expect(result.str.base).toBe(10)
    expect(result.str.bonuses).toHaveLength(0)
  })

  it.each([
    [8, -1],
    [10, 0],
    [12, 1],
    [13, 1],
    [14, 2],
    [15, 2],
    [20, 5],
  ])('modifier for score %i → %i', (score, expectedMod) => {
    const result = resolveAbilities({ ...BASE, str: score }, NO_BUNDLES, NO_CHOICES)
    expect(result.str.modifier).toBe(expectedMod)
  })

  it('applies ability-bonus grants', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [
          { type: 'ability-bonus', ability: 'str', bonus: 1 },
          { type: 'ability-bonus', ability: 'dex', bonus: 2 },
        ],
      },
    ]
    const result = resolveAbilities(BASE, bundles, NO_CHOICES)
    expect(result.str.total).toBe(11)
    expect(result.dex.total).toBe(12)
    expect(result.con.total).toBe(10)
  })

  it('tracks bonus sources', () => {
    const source = { origin: 'race' as const, id: 'human' as const }
    const bundles: GrantBundle[] = [
      {
        source,
        grants: [{ type: 'ability-bonus', ability: 'str', bonus: 1 }],
      },
    ]
    const result = resolveAbilities(BASE, bundles, NO_CHOICES)
    expect(result.str.bonuses).toHaveLength(1)
    expect(result.str.bonuses[0].value).toBe(1)
    expect(result.str.bonuses[0].source).toEqual(source)
  })

  it('caps ability total at 20', () => {
    const highBase = { ...BASE, str: 19 }
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'ability-bonus', ability: 'str', bonus: 3 }],
      },
    ]
    const result = resolveAbilities(highBase, bundles, NO_CHOICES)
    expect(result.str.total).toBe(20)
    expect(result.str.modifier).toBe(5)
  })

  it('applies ability-choice grants when decision exists', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [
          {
            type: 'ability-choice',
            key: 'ability-choice:race:human:0',
            count: 2,
            bonus: 1,
            from: ['str', 'dex'],
          },
        ],
      },
    ]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'ability-choice:race:human:0': { type: 'ability-choice', abilities: ['str', 'con'] },
    }
    const result = resolveAbilities(BASE, bundles, choices)
    expect(result.str.total).toBe(11)
    expect(result.con.total).toBe(11)
    expect(result.dex.total).toBe(10)
  })

  it('does not apply ability-choice grants when no decision', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [
          {
            type: 'ability-choice',
            key: 'ability-choice:race:human:0',
            count: 2,
            bonus: 1,
            from: null,
          },
        ],
      },
    ]
    const result = resolveAbilities(BASE, bundles, NO_CHOICES)
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      expect(result[key].total).toBe(10)
    }
  })
})
