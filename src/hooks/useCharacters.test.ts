import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test/wrapper'
import { supabase, mockQueryResult } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))

import { useCharacters, useCharacter, usePlayerNames, useCharacterMutations } from '@/hooks/useCharacters'
import type { Character } from '@/types/database'

const baseCharacter: Character = {
  id: 'char-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  campaign_id: 'camp-1',
  name: 'Aria Silverwind',
  player_name: 'Alice',
  character_type: 'pc',
  race: 'elf',
  class: 'wizard',
  subclass: null,
  level: 3,
  background: 'sage',
  alignment: 'neutral-good',
  experience_points: 900,
  hit_points_max: 18,
  hit_points_current: 18,
  hit_points_temp: 0,
  armor_class: 12,
  speed: 30,
  initiative_bonus: 2,
  proficiency_bonus: 2,
  abilities: { str: 8, dex: 14, con: 12, int: 17, wis: 13, cha: 10 },
  saving_throws: null,
  skills: null,
  features: null,
  equipment: null,
  spells: null,
  personality_traits: null,
  ideals: null,
  bonds: null,
  flaws: null,
  appearance: null,
  backstory: null,
  notes: null,
  portrait_url: null,
  is_npc: false,
  is_active: true,
  status: 'ready',
  gender: null,
}

beforeEach(() => {
  mockQueryResult.data = null
  mockQueryResult.error = null
  vi.mocked(supabase.from).mockClear()
})

describe('useCharacters', () => {
  it('returns list of characters filtered by campaignId', async () => {
    mockQueryResult.data = [baseCharacter]

    const { result } = renderHook(() => useCharacters('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([baseCharacter])
    expect(supabase.eq).toHaveBeenCalledWith('campaign_id', 'camp-1')
  })

  it('returns empty array when no characters exist', async () => {
    mockQueryResult.data = []

    const { result } = renderHook(() => useCharacters('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('sets error state when query fails', async () => {
    mockQueryResult.error = { message: 'DB error' }

    const { result } = renderHook(() => useCharacters('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCharacter', () => {
  it('returns a single character by id', async () => {
    mockQueryResult.data = baseCharacter

    const { result } = renderHook(() => useCharacter('char-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(baseCharacter)
  })

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useCharacter(undefined), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('usePlayerNames', () => {
  it('returns sorted unique player names', async () => {
    mockQueryResult.data = [
      { player_name: 'Charlie' },
      { player_name: 'Alice' },
      { player_name: 'Alice' },
      { player_name: 'Bob' },
    ]

    const { result } = renderHook(() => usePlayerNames(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('deduplicates player names', async () => {
    mockQueryResult.data = [
      { player_name: 'Alice' },
      { player_name: 'Alice' },
    ]

    const { result } = renderHook(() => usePlayerNames(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data).toEqual(['Alice'])
  })

  it('returns empty array when no player names exist', async () => {
    mockQueryResult.data = []

    const { result } = renderHook(() => usePlayerNames(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

describe('useCharacterMutations', () => {
  it('create inserts character and returns it', async () => {
    mockQueryResult.data = baseCharacter

    const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() })

    const { id, created_at, updated_at, is_npc, is_active, ...createPayload } = baseCharacter
    result.current.create.mutate(createPayload)

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true))
    expect(result.current.create.data).toEqual(baseCharacter)
  })

  it('update patches character by id', async () => {
    const updated = { ...baseCharacter, name: 'New Name' }
    mockQueryResult.data = updated

    const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() })

    result.current.update.mutate({ id: 'char-1', name: 'New Name' })

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
    expect(supabase.eq).toHaveBeenCalledWith('id', 'char-1')
  })

  it('remove deletes character by id', async () => {
    mockQueryResult.data = null

    const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() })

    result.current.remove.mutate({ id: 'char-1', campaignId: 'camp-1' })

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true))
    expect(supabase.eq).toHaveBeenCalledWith('id', 'char-1')
  })
})
