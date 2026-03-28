import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CharacterProvider, useCharacterContext, resolveChoiceSequence } from '@/hooks/useCharacterContext'
import type { BuildLevelRow } from '@/lib/build-reconstruction'
import type { Character } from '@/types/database'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// resolveChoiceSequence — pure function tests
// ---------------------------------------------------------------------------

const creationRow: BuildLevelRow = {
  sequence: 0,
  base_abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  ability_method: 'standard-array',
  class_id: null,
  class_level: null,
  subclass_id: null,
  asi_allocation: null,
  feat_id: null,
  hp_roll: null,
  choices: null,
}

const fighterLevel1: BuildLevelRow = {
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

const wizardLevel2: BuildLevelRow = {
  sequence: 2,
  base_abilities: null,
  ability_method: null,
  class_id: 'wizard',
  class_level: 1,
  subclass_id: null,
  asi_allocation: null,
  feat_id: null,
  hp_roll: null,
  choices: null,
}

const rows = [creationRow, fighterLevel1, wizardLevel2] as const

describe('resolveChoiceSequence', () => {
  it('routes race choices to sequence 0', () => {
    expect(resolveChoiceSequence('language-choice:race:human:0', rows)).toBe(0)
  })

  it('routes background choices to sequence 0', () => {
    expect(resolveChoiceSequence('skill-choice:background:soldier:0', rows)).toBe(0)
  })

  it('routes class choices to the matching level row', () => {
    expect(resolveChoiceSequence('skill-choice:class:fighter:0', rows)).toBe(1)
  })

  it('routes class choices to correct row in multiclass', () => {
    expect(resolveChoiceSequence('skill-choice:class:wizard:0', rows)).toBe(2)
  })

  it('falls back to sequence 0 when class has no matching level row', () => {
    expect(resolveChoiceSequence('skill-choice:class:rogue:0', rows)).toBe(0)
  })

  it('falls back to sequence 0 for unknown origins', () => {
    expect(resolveChoiceSequence('skill-choice:unknown:foo:0', rows)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// CharacterProvider — integration tests
// ---------------------------------------------------------------------------

function buildSeedCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-char',
    campaign_id: 'test-campaign',
    name: 'Test Character',
    player_name: null,
    character_type: 'pc',
    race: 'human',
    class: 'fighter',
    subclass: null,
    level: 1,
    background: 'soldier',
    alignment: 'n',
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: null,
    armor_class: null,
    speed: null,
    proficiency_bonus: null,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'draft',
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function createWrapper(
  character: Character,
  initialRows: BuildLevelRow[] = [],
  initialEquippedItems: string[] = [],
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <CharacterProvider
        initialCharacter={character}
        initialRows={initialRows}
        initialEquippedItems={initialEquippedItems}
      >
        {children}
      </CharacterProvider>
    )
  }
}

describe('CharacterProvider', () => {
  it('seeds a creation row if none exists', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, []),
    })

    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].sequence).toBe(0)
  })

  it('preserves existing creation row', () => {
    const character = buildSeedCharacter()
    const existingCreation: BuildLevelRow = {
      ...creationRow,
      base_abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    }
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [existingCreation]),
    })

    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].base_abilities?.str).toBe(15)
  })

  it('updateCharacter sets race and auto-updates size', () => {
    const character = buildSeedCharacter({ race: null, size: null })
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, []),
    })

    act(() => {
      result.current.updateCharacter({ race: 'human' })
    })

    expect(result.current.character.race).toBe('human')
    expect(result.current.character.size).toBe('medium')
    expect(result.current.isDirty).toBe(true)
  })

  it('levelUp adds a new level row with correct sequence', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow]),
    })

    act(() => {
      result.current.levelUp('fighter', null)
    })

    const levelRows = result.current.rows.filter((r) => r.sequence !== 0)
    expect(levelRows).toHaveLength(1)
    expect(levelRows[0].class_id).toBe('fighter')
    expect(levelRows[0].class_level).toBe(1)
    expect(levelRows[0].sequence).toBe(1)
  })

  it('levelDown removes the highest-sequence level row', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    expect(result.current.rows).toHaveLength(2)

    act(() => {
      result.current.levelDown()
    })

    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].sequence).toBe(0)
  })

  it('levelDown does not remove creation row', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow]),
    })

    act(() => {
      result.current.levelDown()
    })

    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].sequence).toBe(0)
  })

  it('makeChoice stores decision on the correct row', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    act(() => {
      result.current.makeChoice('skill-choice:class:fighter:0', {
        type: 'skill-choice',
        skills: ['athletics', 'perception'],
      })
    })

    // Should be stored on the fighter level row (sequence 1)
    const levelRow = result.current.rows.find((r) => r.sequence === 1)
    expect(levelRow?.choices).toHaveProperty('skill-choice:class:fighter:0')
  })

  it('makeChoice stores race choices on creation row', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    act(() => {
      result.current.makeChoice('language-choice:race:human:0', {
        type: 'language-choice',
        languages: ['elvish'],
      })
    })

    const creationRowResult = result.current.rows.find((r) => r.sequence === 0)
    expect(creationRowResult?.choices).toHaveProperty('language-choice:race:human:0')
  })

  it('clearChoice removes decision from the correct row', () => {
    const character = buildSeedCharacter()
    const creationWithChoice: BuildLevelRow = {
      ...creationRow,
      choices: {
        'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
      },
    }
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationWithChoice, fighterLevel1]),
    })

    act(() => {
      result.current.clearChoice('language-choice:race:human:0')
    })

    const creationRowResult = result.current.rows.find((r) => r.sequence === 0)
    expect(creationRowResult?.choices).not.toHaveProperty('language-choice:race:human:0')
  })

  it('markSaved clears isDirty', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow]),
    })

    act(() => {
      result.current.updateCharacter({ name: 'New Name' })
    })
    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.markSaved()
    })
    expect(result.current.isDirty).toBe(false)
  })

  it('derives build and resolved from valid character data', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    expect(result.current.build).not.toBeNull()
    expect(result.current.resolved).not.toBeNull()
    expect(result.current.buildError).toBeNull()
  })

  it('sets buildError when character has no race', () => {
    const character = buildSeedCharacter({ race: null })
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    expect(result.current.build).toBeNull()
    expect(result.current.buildError).toBe('Character is missing required race')
  })

  it('throws when useCharacterContext is used outside provider', () => {
    expect(() => {
      renderHook(() => useCharacterContext())
    }).toThrow('useCharacterContext must be used within a CharacterProvider')
  })
})
