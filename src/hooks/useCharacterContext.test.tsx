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
  deleted_at: null,
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
  deleted_at: null,
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
  deleted_at: null,
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

  it('throws when class has no matching active level row', () => {
    expect(() => resolveChoiceSequence('skill-choice:class:rogue:0', rows)).toThrow('No active level row found')
  })

  it('throws for unknown origins', () => {
    expect(() => resolveChoiceSequence('skill-choice:unknown:foo:0', rows)).toThrow('Invalid choice key origin')
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

  it('levelDown soft-deletes the highest-sequence active level row', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    expect(result.current.rows).toHaveLength(2)

    act(() => {
      result.current.levelDown()
    })

    // Row count unchanged — row is soft-deleted, not removed
    expect(result.current.rows).toHaveLength(2)
    const levelRow = result.current.rows.find((r) => r.sequence === 1)
    expect(levelRow?.deleted_at).toBeTruthy()
    expect(result.current.isDirty).toBe(true)
  })

  it('levelDown does not affect creation row', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow]),
    })

    act(() => {
      result.current.levelDown()
    })

    // No level rows to soft-delete — creation row untouched
    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].sequence).toBe(0)
    expect(result.current.rows[0].deleted_at).toBeNull()
  })

  it('hasDeletedRows is true after levelDown and false when no soft-deleted rows exist', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    expect(result.current.hasDeletedRows).toBe(false)

    act(() => {
      result.current.levelDown()
    })

    expect(result.current.hasDeletedRows).toBe(true)
  })

  it('undoLevelDown clears deleted_at on the most recently soft-deleted row', () => {
    const character = buildSeedCharacter()
    const fighterLevel2: BuildLevelRow = {
      sequence: 2,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 2,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1, fighterLevel2]),
    })

    act(() => {
      result.current.levelDown()
    })

    // sequence 2 should be soft-deleted
    expect(result.current.rows.find((r) => r.sequence === 2)?.deleted_at).toBeTruthy()
    expect(result.current.hasDeletedRows).toBe(true)

    act(() => {
      result.current.undoLevelDown()
    })

    // sequence 2 should be restored
    expect(result.current.rows.find((r) => r.sequence === 2)?.deleted_at).toBeFalsy()
    expect(result.current.hasDeletedRows).toBe(false)
  })

  it('undoLevelDown is a no-op when no soft-deleted rows exist', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    const rowsBefore = result.current.rows

    act(() => {
      result.current.undoLevelDown()
    })

    expect(result.current.rows).toEqual(rowsBefore)
  })

  it('levelUp restores a soft-deleted row instead of appending a new one', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    act(() => {
      result.current.levelDown()
    })

    expect(result.current.rows).toHaveLength(2)
    expect(result.current.rows.find((r) => r.sequence === 1)?.deleted_at).toBeTruthy()

    act(() => {
      result.current.levelUp('fighter', 8)
    })

    // Should still be 2 rows (restored, not appended)
    expect(result.current.rows).toHaveLength(2)
    const restoredRow = result.current.rows.find((r) => r.sequence === 1)
    expect(restoredRow?.deleted_at).toBeFalsy()
    expect(restoredRow?.hp_roll).toBe(8)
  })

  it('build reconstruction excludes soft-deleted rows', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    // Before levelDown: build should reflect 1 level
    expect(result.current.build?.levels).toHaveLength(1)

    act(() => {
      result.current.levelDown()
    })

    // After soft-delete: build should reflect 0 levels (deleted row excluded)
    expect(result.current.build?.levels).toHaveLength(0)
  })

  it('makeChoice with subclass decision sets subclass_id on the Fighter L3 row', () => {
    const character = buildSeedCharacter()
    const fighterLevel2: BuildLevelRow = {
      sequence: 2,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 2,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const fighterLevel3: BuildLevelRow = {
      sequence: 3,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 3,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1, fighterLevel2, fighterLevel3]),
    })

    act(() => {
      result.current.makeChoice('subclass:class:fighter:0', {
        type: 'subclass',
        subclassId: 'champion',
      })
    })

    // subclass_id should be set on the Fighter L3 row (sequence 3)
    const l3Row = result.current.rows.find((r) => r.sequence === 3)
    expect(l3Row?.subclass_id).toBe('champion')
  })

  it('makeChoice with asi decision sets asi_allocation on the Fighter L4 row', () => {
    const character = buildSeedCharacter()
    const fighterLevel2: BuildLevelRow = {
      sequence: 2,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 2,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const fighterLevel3: BuildLevelRow = {
      sequence: 3,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 3,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const fighterLevel4: BuildLevelRow = {
      sequence: 4,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 4,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1, fighterLevel2, fighterLevel3, fighterLevel4]),
    })

    act(() => {
      result.current.makeChoice('asi:class:fighter:0', {
        type: 'asi',
        allocation: { str: 2 },
      })
    })

    // asi_allocation should be set on the Fighter L4 row (sequence 4)
    const l4Row = result.current.rows.find((r) => r.sequence === 4)
    expect(l4Row?.asi_allocation).toEqual({ str: 2 })
  })

  it('clearChoice for subclass nulls the dedicated column on the correct row', () => {
    const character = buildSeedCharacter()
    const fighterLevel2: BuildLevelRow = {
      sequence: 2,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 2,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const fighterLevel3: BuildLevelRow = {
      sequence: 3,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 3,
      subclass_id: 'champion',
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1, fighterLevel2, fighterLevel3]),
    })

    act(() => {
      result.current.clearChoice('subclass:class:fighter:0')
    })

    const l3Row = result.current.rows.find((r) => r.sequence === 3)
    expect(l3Row?.subclass_id).toBeNull()
  })

  it('clearChoice for ASI nulls the dedicated column on the correct row', () => {
    const character = buildSeedCharacter()
    const fighterLevel2: BuildLevelRow = {
      sequence: 2,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 2,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const fighterLevel3: BuildLevelRow = {
      sequence: 3,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 3,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const fighterLevel4: BuildLevelRow = {
      sequence: 4,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 4,
      subclass_id: null,
      asi_allocation: { str: 2 },
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    }
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1, fighterLevel2, fighterLevel3, fighterLevel4]),
    })

    act(() => {
      result.current.clearChoice('asi:class:fighter:0')
    })

    const l4Row = result.current.rows.find((r) => r.sequence === 4)
    expect(l4Row?.asi_allocation).toBeNull()
  })

  it('levelUp with class mismatch on soft-deleted row appends a new row', () => {
    const character = buildSeedCharacter()
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, fighterLevel1]),
    })

    // Soft-delete the fighter row
    act(() => {
      result.current.levelDown()
    })
    expect(result.current.rows.find((r) => r.sequence === 1)?.deleted_at).toBeTruthy()

    // Level up as wizard — should NOT restore the fighter row
    act(() => {
      result.current.levelUp('wizard', 6)
    })

    // Fighter row remains soft-deleted, new wizard row appended
    expect(result.current.rows).toHaveLength(3)
    expect(result.current.rows.find((r) => r.sequence === 1)?.deleted_at).toBeTruthy()
    const wizardRow = result.current.rows.find((r) => r.sequence === 2)
    expect(wizardRow?.class_id).toBe('wizard')
    expect(wizardRow?.deleted_at).toBeNull()
  })

  it('does not level past 20 (max level guard)', () => {
    const character = buildSeedCharacter()
    const levelRows: BuildLevelRow[] = Array.from({ length: 20 }, (_, i) => ({
      sequence: i + 1,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: i + 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: i === 0 ? null : 6,
      choices: null,
      deleted_at: null,
    }))
    const { result } = renderHook(() => useCharacterContext(), {
      wrapper: createWrapper(character, [creationRow, ...levelRows]),
    })

    expect(result.current.level).toBe(20)

    act(() => {
      result.current.levelUp('fighter', 6)
    })

    // Still 20 — no new row added
    expect(result.current.level).toBe(20)
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

  describe('updateCreation', () => {
    it('sets base_abilities on the creation row', () => {
      const character = buildSeedCharacter()
      const { result } = renderHook(() => useCharacterContext(), {
        wrapper: createWrapper(character, [creationRow]),
      })

      act(() => {
        result.current.updateCreation({
          base_abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
        })
      })

      const creation = result.current.rows.find((r) => r.sequence === 0)
      expect(creation?.base_abilities).toEqual({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })
    })

    it('merges choices with existing choices rather than replacing', () => {
      const character = buildSeedCharacter()
      const creationWithChoice: BuildLevelRow = {
        ...creationRow,
        choices: {
          'language-choice:race:human:0': { type: 'language-choice', languages: ['elvish'] },
        },
      }
      const { result } = renderHook(() => useCharacterContext(), {
        wrapper: createWrapper(character, [creationWithChoice]),
      })

      act(() => {
        result.current.updateCreation({
          choices: {
            'skill-choice:background:soldier:0': { type: 'skill-choice', skills: ['athletics'] },
          },
        })
      })

      const creation = result.current.rows.find((r) => r.sequence === 0)
      // Original choice should still be present
      expect(creation?.choices).toHaveProperty('language-choice:race:human:0')
      // New choice should also be present
      expect(creation?.choices).toHaveProperty('skill-choice:background:soldier:0')
    })

    it('updates auto-seeded creation row with new abilities', () => {
      const character = buildSeedCharacter()
      // Pass only a level row — no creation row at sequence 0.
      // Note: CharacterProvider seeds a creation row normally, so we need to
      // simulate the -1 branch by providing rows that already include sequence 0
      // but then filtering. Instead, we use a level-only row set.
      // Since the provider auto-seeds, we use the hook's updateCreation on an
      // already-seeded provider and verify it works. To test the -1 branch,
      // we need to construct a scenario where the creation row is absent.
      //
      // The provider seeds a creation row if none exists in initialRows.
      // However, updateCreation itself handles the -1 case. We can test it
      // by providing initialRows with only a level row — the provider will
      // seed a creation row, but we can verify updateCreation works on it.
      //
      // Actually, let's test the -1 branch directly by removing the creation row
      // via levelDown-like manipulation. Since there's no direct way, we test
      // the code path by providing an initialRows that the provider would seed,
      // but the actual -1 branch in updateCreation is a safety net. Let's verify
      // the function by checking the row count increases when we call updateCreation
      // on a provider that has no creation row — which requires a workaround.

      // Simplest approach: pass a creation row to avoid seeding, then use the
      // provider normally. The -1 branch is a defensive path. We verify that
      // updateCreation with abilities works correctly regardless.
      const { result } = renderHook(() => useCharacterContext(), {
        wrapper: createWrapper(character, [fighterLevel1]),
      })

      // The provider auto-seeded a creation row, so we have 2 rows
      expect(result.current.rows).toHaveLength(2)

      act(() => {
        result.current.updateCreation({
          base_abilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
        })
      })

      const creation = result.current.rows.find((r) => r.sequence === 0)
      expect(creation?.base_abilities).toEqual({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
    })
  })

  describe('replaceLevel', () => {
    it('swaps the class on a level row in a single update', () => {
      const character = buildSeedCharacter()
      const { result } = renderHook(() => useCharacterContext(), {
        wrapper: createWrapper(character, [creationRow, fighterLevel1]),
      })

      act(() => {
        result.current.replaceLevel(1, 'wizard', null)
      })

      const levelRow = result.current.rows.find((r) => r.sequence === 1)
      expect(levelRow?.class_id).toBe('wizard')
      expect(levelRow?.class_level).toBe(1)
      expect(result.current.isDirty).toBe(true)
    })

    it('resets choices on the replaced level row', () => {
      const character = buildSeedCharacter()
      const fighterWithChoices: BuildLevelRow = {
        ...fighterLevel1,
        choices: {
          'skill-choice:class:fighter:0': { type: 'skill-choice', skills: ['athletics'] },
        },
      }
      const { result } = renderHook(() => useCharacterContext(), {
        wrapper: createWrapper(character, [creationRow, fighterWithChoices]),
      })

      act(() => {
        result.current.replaceLevel(1, 'wizard', null)
      })

      const levelRow = result.current.rows.find((r) => r.sequence === 1)
      expect(levelRow?.choices).toBeNull()
    })

    it('sets subclass_id when provided', () => {
      const character = buildSeedCharacter()
      const { result } = renderHook(() => useCharacterContext(), {
        wrapper: createWrapper(character, [creationRow, fighterLevel1]),
      })

      act(() => {
        result.current.replaceLevel(1, 'wizard', 'evocation')
      })

      const levelRow = result.current.rows.find((r) => r.sequence === 1)
      expect(levelRow?.class_id).toBe('wizard')
      expect(levelRow?.subclass_id).toBe('evocation')
    })

    it('does nothing when sequence does not exist', () => {
      const character = buildSeedCharacter()
      const { result } = renderHook(() => useCharacterContext(), {
        wrapper: createWrapper(character, [creationRow, fighterLevel1]),
      })

      const rowsBefore = result.current.rows

      act(() => {
        result.current.replaceLevel(99, 'wizard', null)
      })

      // Rows should be unchanged (same references for the row objects)
      expect(result.current.rows).toHaveLength(rowsBefore.length)
      expect(result.current.rows.find((r) => r.sequence === 1)?.class_id).toBe('fighter')
    })
  })

  it('throws when useCharacterContext is used outside provider', () => {
    expect(() => {
      renderHook(() => useCharacterContext())
    }).toThrow('useCharacterContext must be used within a CharacterProvider')
  })
})
