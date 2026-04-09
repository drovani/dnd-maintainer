import {
  setupMockReset,
  describeListQuery,
  describeSingleQuery,
  renderHook,
  waitFor,
  createWrapper,
  supabase,
  mockQueryResult,
} from '@/test/hook-test-helpers'

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))

import { useCharacters, useCharacter, usePlayerNames, useCharacterMutations } from '@/hooks/useCharacters'
import type { Character } from '@/types/database'

const baseCharacter: Character = {
  id: 'char-1',
  slug: 'aria-silverw-char',
  previous_slugs: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  campaign_id: 'camp-1',
  name: 'Aria Silverwind',
  player_name: 'Alice',
  character_type: 'pc',
  race: 'elf-high',
  class: 'wizard',
  subclass: null,
  level: 3,
  background: 'sage',
  alignment: 'ng',
  gender: null,
  size: null,
  age: null,
  height: null,
  weight: null,
  eye_color: null,
  hair_color: null,
  skin_color: null,
  hit_points_max: 18,
  armor_class: 12,
  speed: 30,
  proficiency_bonus: 2,
  personality_traits: null,
  ideals: null,
  bonds: null,
  flaws: null,
  appearance: null,
  backstory: null,
  notes: null,
  portrait_url: null,
  is_active: true,
  status: 'ready',
}

setupMockReset()

describeListQuery(
  'useCharacters',
  () => renderHook(() => useCharacters('camp-1'), { wrapper: createWrapper() }),
  baseCharacter,
  () => renderHook(() => useCharacters(''), { wrapper: createWrapper() }),
  'campaign_id',
)

describeSingleQuery(
  'useCharacter',
  (id) => renderHook(() => useCharacter(id as string | undefined), { wrapper: createWrapper() }),
  baseCharacter,
  'char-1',
  undefined,
)

describe('useCharacter slug query pattern', () => {
  it('queries by slug using .or() with both slug and previous_slugs', async () => {
    mockQueryResult.data = baseCharacter

    const { result } = renderHook(() => useCharacter('aria-silverw-char'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.or).toHaveBeenCalledWith(
      'slug.eq.aria-silverw-char,previous_slugs.cs.{"aria-silverw-char"}'
    )
  })

  it('throws when slug contains invalid characters', async () => {
    const { result } = renderHook(() => useCharacter('bad,slug'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
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

    const { id: _id, created_at: _created_at, updated_at: _updated_at, is_active: _is_active, ...createPayload } = baseCharacter
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
