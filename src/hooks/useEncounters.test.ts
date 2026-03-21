import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test/wrapper'
import { supabase, mockQueryResult } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))

import {
  useEncounters,
  useSessionEncounters,
  useEncounter,
  useCreateEncounter,
  useUpdateEncounter,
  useDeleteEncounter,
} from '@/hooks/useEncounters'
import type { Encounter } from '@/types/database'

const baseEncounter: Encounter = {
  id: 'enc-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  campaign_id: 'camp-1',
  session_id: 'sess-1',
  name: 'Goblin Ambush',
  description: null,
  combatants: null,
  round: 0,
  status: 'planning',
  notes: null,
}

beforeEach(() => {
  mockQueryResult.data = null
  mockQueryResult.error = null
  vi.mocked(supabase.from).mockClear()
})

describe('useEncounters', () => {
  it('returns a list of encounters for a campaign', async () => {
    mockQueryResult.data = [baseEncounter]

    const { result } = renderHook(() => useEncounters('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([baseEncounter])
    expect(supabase.eq).toHaveBeenCalledWith('campaign_id', 'camp-1')
  })

  it('returns empty array when no encounters exist', async () => {
    mockQueryResult.data = []

    const { result } = renderHook(() => useEncounters('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('does not fetch when campaignId is empty string', () => {
    const { result } = renderHook(() => useEncounters(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useSessionEncounters', () => {
  it('returns encounters filtered by sessionId', async () => {
    mockQueryResult.data = [baseEncounter]

    const { result } = renderHook(() => useSessionEncounters('sess-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([baseEncounter])
    expect(supabase.eq).toHaveBeenCalledWith('session_id', 'sess-1')
  })

  it('does not fetch when sessionId is empty string', () => {
    const { result } = renderHook(() => useSessionEncounters(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useEncounter', () => {
  it('returns a single encounter by id', async () => {
    mockQueryResult.data = baseEncounter

    const { result } = renderHook(() => useEncounter('enc-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(baseEncounter)
  })

  it('does not fetch when id is empty string', () => {
    const { result } = renderHook(() => useEncounter(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useCreateEncounter', () => {
  it('inserts an encounter and returns it', async () => {
    mockQueryResult.data = baseEncounter

    const { result } = renderHook(() => useCreateEncounter(), { wrapper: createWrapper() })

    const { id, created_at, updated_at, ...createPayload } = baseEncounter
    result.current.mutate(createPayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(baseEncounter)
    expect(supabase.insert).toHaveBeenCalled()
  })

  it('sets error when insert fails', async () => {
    mockQueryResult.error = { message: 'Insert failed' }

    const { result } = renderHook(() => useCreateEncounter(), { wrapper: createWrapper() })

    const { id, created_at, updated_at, ...createPayload } = baseEncounter
    result.current.mutate(createPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateEncounter', () => {
  it('updates an encounter by id', async () => {
    const updated = { ...baseEncounter, name: 'Dragon Fight' }
    mockQueryResult.data = updated

    const { result } = renderHook(() => useUpdateEncounter(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'enc-1', name: 'Dragon Fight' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.update).toHaveBeenCalled()
    expect(supabase.eq).toHaveBeenCalledWith('id', 'enc-1')
  })
})

describe('useDeleteEncounter', () => {
  it('deletes an encounter by id', async () => {
    mockQueryResult.data = null

    const { result } = renderHook(() => useDeleteEncounter(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'enc-1', campaignId: 'camp-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.delete).toHaveBeenCalled()
    expect(supabase.eq).toHaveBeenCalledWith('id', 'enc-1')
  })

  it('deletes an encounter with optional sessionId', async () => {
    mockQueryResult.data = null

    const { result } = renderHook(() => useDeleteEncounter(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'enc-1', campaignId: 'camp-1', sessionId: 'sess-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.eq).toHaveBeenCalledWith('id', 'enc-1')
  })
})
