import { describe, it, expect } from 'vitest'
import { resolveSavingThrows, resolveSkills, resolveProficiencies } from '@/lib/resolver/proficiencies'
import type { GrantBundle } from '@/types/sources'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { ResolvedAbility } from '@/types/resolved'

const NO_BUNDLES: readonly GrantBundle[] = []
const NO_CHOICES: Readonly<Record<ChoiceKey, ChoiceDecision>> = {}

// All ability modifiers 0
const ZERO_ABILITIES: Readonly<Record<string, ResolvedAbility>> = {
  str: { base: 10, bonuses: [], total: 10, modifier: 0 },
  dex: { base: 10, bonuses: [], total: 10, modifier: 0 },
  con: { base: 10, bonuses: [], total: 10, modifier: 0 },
  int: { base: 10, bonuses: [], total: 10, modifier: 0 },
  wis: { base: 10, bonuses: [], total: 10, modifier: 0 },
  cha: { base: 10, bonuses: [], total: 10, modifier: 0 },
}

// Abilities with positive modifiers
const POSITIVE_ABILITIES: Readonly<Record<string, ResolvedAbility>> = {
  str: { base: 16, bonuses: [], total: 16, modifier: 3 },
  dex: { base: 14, bonuses: [], total: 14, modifier: 2 },
  con: { base: 15, bonuses: [], total: 15, modifier: 2 },
  int: { base: 8, bonuses: [], total: 8, modifier: -1 },
  wis: { base: 10, bonuses: [], total: 10, modifier: 0 },
  cha: { base: 12, bonuses: [], total: 12, modifier: 1 },
}

describe('resolveSavingThrows', () => {
  it('all abilities not proficient with no bundles', () => {
    const result = resolveSavingThrows(ZERO_ABILITIES, NO_BUNDLES, 2)
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      expect(result[key].proficient).toBe(false)
      expect(result[key].bonus).toBe(0)
      expect(result[key].sources).toHaveLength(0)
    }
  })

  it('adds proficiency bonus to proficient saving throws', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          { type: 'proficiency', category: 'saving-throw', id: 'str' },
          { type: 'proficiency', category: 'saving-throw', id: 'con' },
        ],
      },
    ]
    const result = resolveSavingThrows(ZERO_ABILITIES, bundles, 2)
    expect(result.str.proficient).toBe(true)
    expect(result.str.bonus).toBe(2)
    expect(result.con.proficient).toBe(true)
    expect(result.con.bonus).toBe(2)
    expect(result.dex.proficient).toBe(false)
    expect(result.dex.bonus).toBe(0)
  })

  it('applies ability modifier plus proficiency bonus', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [{ type: 'proficiency', category: 'saving-throw', id: 'str' }],
      },
    ]
    const result = resolveSavingThrows(POSITIVE_ABILITIES, bundles, 2)
    // STR: modifier 3 + proficiencyBonus 2 = 5
    expect(result.str.bonus).toBe(5)
    // DEX: modifier 2, not proficient
    expect(result.dex.bonus).toBe(2)
  })

  it('tracks source tags', () => {
    const source = { origin: 'class' as const, id: 'fighter' as const, level: 1 }
    const bundles: GrantBundle[] = [
      {
        source,
        grants: [{ type: 'proficiency', category: 'saving-throw', id: 'str' }],
      },
    ]
    const result = resolveSavingThrows(ZERO_ABILITIES, bundles, 2)
    expect(result.str.sources).toHaveLength(1)
    expect(result.str.sources[0]).toEqual(source)
  })
})

describe('resolveSkills', () => {
  it('all skills have correct ability mapping with zero bonuses', () => {
    const result = resolveSkills(ZERO_ABILITIES, NO_BUNDLES, 2, NO_CHOICES)
    expect(result.athletics.ability).toBe('str')
    expect(result.athletics.proficient).toBe(false)
    expect(result.athletics.bonus).toBe(0)
    expect(result.perception.ability).toBe('wis')
  })

  it('applies direct skill proficiency grants', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'proficiency', category: 'skill', id: 'athletics' }],
      },
    ]
    const result = resolveSkills(ZERO_ABILITIES, bundles, 2, NO_CHOICES)
    expect(result.athletics.proficient).toBe(true)
    expect(result.athletics.bonus).toBe(2)
    expect(result.perception.proficient).toBe(false)
  })

  it('applies skill-choice grants when decision exists', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: 'skill-choice:class:fighter:0',
            count: 2,
            from: ['athletics', 'perception'],
          },
        ],
      },
    ]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics', 'perception'] },
    }
    const result = resolveSkills(ZERO_ABILITIES, bundles, 2, choices)
    expect(result.athletics.proficient).toBe(true)
    expect(result.perception.proficient).toBe(true)
    expect(result.acrobatics.proficient).toBe(false)
  })

  it('skill bonus includes ability modifier', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'proficiency', category: 'skill', id: 'athletics' }],
      },
    ]
    const result = resolveSkills(POSITIVE_ABILITIES, bundles, 2, NO_CHOICES)
    // STR 16 → mod 3, proficient +2 = 5
    expect(result.athletics.bonus).toBe(5)
  })

  it('does not apply skill-choice when no decision', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: 'skill-choice:class:fighter:0',
            count: 2,
            from: null,
          },
        ],
      },
    ]
    const result = resolveSkills(ZERO_ABILITIES, bundles, 2, NO_CHOICES)
    for (const key of Object.keys(result) as (keyof typeof result)[]) {
      expect(result[key].proficient).toBe(false)
    }
  })
})

describe('resolveProficiencies', () => {
  it('returns empty arrays with no bundles', () => {
    const result = resolveProficiencies(NO_BUNDLES, NO_CHOICES)
    expect(result.armor).toHaveLength(0)
    expect(result.weapon).toHaveLength(0)
    expect(result.tool).toHaveLength(0)
    expect(result.language).toHaveLength(0)
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('collects armor and weapon proficiencies', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 1 },
        grants: [
          { type: 'proficiency', category: 'armor', id: 'light' },
          { type: 'proficiency', category: 'armor', id: 'heavy' },
          { type: 'proficiency', category: 'weapon', id: 'simple' },
          { type: 'proficiency', category: 'weapon', id: 'martial' },
        ],
      },
    ]
    const result = resolveProficiencies(bundles, NO_CHOICES)
    expect(result.armor.map((a) => a.value)).toContain('light')
    expect(result.armor.map((a) => a.value)).toContain('heavy')
    expect(result.weapon.map((w) => w.value)).toContain('simple')
    expect(result.weapon.map((w) => w.value)).toContain('martial')
  })

  it('collects direct language proficiencies', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'proficiency', category: 'language', id: 'common' }],
      },
    ]
    const result = resolveProficiencies(bundles, NO_CHOICES)
    expect(result.language.map((l) => l.value)).toContain('common')
  })

  it('resolves language-choice grants with decision', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [
          {
            type: 'proficiency-choice',
            category: 'language',
            key: 'language-choice:race:human:0',
            count: 1,
            from: null,
          },
        ],
      },
    ]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
    }
    const result = resolveProficiencies(bundles, choices)
    expect(result.language.map((l) => l.value)).toContain('elvish')
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('produces pending choice for unresolved language-choice', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [
          {
            type: 'proficiency-choice',
            category: 'language',
            key: 'language-choice:race:human:0',
            count: 1,
            from: null,
          },
        ],
      },
    ]
    const result = resolveProficiencies(bundles, NO_CHOICES)
    expect(result.pendingChoices).toHaveLength(1)
    expect(result.pendingChoices[0].type).toBe('language-choice')
    expect(result.pendingChoices[0].choiceKey).toBe('language-choice:race:human:0')
  })

  it('resolves tool-choice grants with decision', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [
          {
            type: 'proficiency-choice',
            category: 'tool',
            key: 'tool-choice:background:soldier:0',
            count: 1,
            from: ['gaming-set-dice', 'gaming-set-cards'],
          },
        ],
      },
    ]
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'tool-choice:background:soldier:0': { type: 'tool-choice', tools: ['gaming-set-dice'] },
    }
    const result = resolveProficiencies(bundles, choices)
    expect(result.tool.map((t) => t.value)).toContain('gaming-set-dice')
    expect(result.pendingChoices).toHaveLength(0)
  })

  it('deduplicates proficiencies from multiple sources', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'race', id: 'human' },
        grants: [{ type: 'proficiency', category: 'language', id: 'common' }],
      },
      {
        source: { origin: 'background', id: 'soldier' },
        grants: [{ type: 'proficiency', category: 'language', id: 'common' }],
      },
    ]
    const result = resolveProficiencies(bundles, NO_CHOICES)
    // One entry for 'common', but with two sources
    const commonEntry = result.language.find((l) => l.value === 'common')
    expect(commonEntry).toBeDefined()
    expect(commonEntry?.sources).toHaveLength(2)
    expect(result.language.filter((l) => l.value === 'common')).toHaveLength(1)
  })
})
