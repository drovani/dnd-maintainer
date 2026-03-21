import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test/wrapper'
import { supabase, mockQueryResult } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))

import { useSessions, useSession, useCreateSession, useUpdateSession, useDeleteSession } from '@/hooks/useSessions'
import type { Session } from '@/types/database'

const baseSession: Session = {
  id: 'sess-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  campaign_id: 'camp-1',
  session_number: 1,
  title: 'The First Adventure',
  date: '2024-01-15',
  summary: null,
  experience_awarded: 300,
  loot: null,
  notes: null,
}

beforeEach(() => {
  mockQueryResult.data = null
  mockQueryResult.error = null
  vi.mocked(supabase.from).mockClear()
})

describe('useSessions', () => {
  it('returns a list of sessions for a campaign', async () => {
    mockQueryResult.data = [baseSession]

    const { result } = renderHook(() => useSessions('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([baseSession])
    expect(supabase.eq).toHaveBeenCalledWith('campaign_id', 'camp-1')
  })

  it('returns empty array when no sessions exist', async () => {
    mockQueryResult.data = []

    const { result } = renderHook(() => useSessions('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('sets error state when query fails', async () => {
    mockQueryResult.error = { message: 'DB error' }

    const { result } = renderHook(() => useSessions('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('does not fetch when campaignId is empty string', () => {
    const { result } = renderHook(() => useSessions(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useSession', () => {
  it('returns a single session by id', async () => {
    mockQueryResult.data = baseSession

    const { result } = renderHook(() => useSession('sess-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(baseSession)
  })

  it('does not fetch when id is empty string', () => {
    const { result } = renderHook(() => useSession(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useCreateSession', () => {
  it('inserts a session and returns it', async () => {
    mockQueryResult.data = baseSession

    const { result } = renderHook(() => useCreateSession(), { wrapper: createWrapper() })

    const { id, created_at, updated_at, ...createPayload } = baseSession
    result.current.mutate(createPayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(baseSession)
    expect(supabase.insert).toHaveBeenCalled()
  })

  it('sets error when insert fails', async () => {
    mockQueryResult.error = { message: 'Insert failed' }

    const { result } = renderHook(() => useCreateSession(), { wrapper: createWrapper() })

    const { id, created_at, updated_at, ...createPayload } = baseSession
    result.current.mutate(createPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateSession', () => {
  it('updates a session by id', async () => {
    const updated = { ...baseSession, title: 'Updated Title' }
    mockQueryResult.data = updated

    const { result } = renderHook(() => useUpdateSession(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'sess-1', title: 'Updated Title' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.update).toHaveBeenCalled()
    expect(supabase.eq).toHaveBeenCalledWith('id', 'sess-1')
  })
})

describe('useDeleteSession', () => {
  it('deletes a session by id', async () => {
    mockQueryResult.data = null

    const { result } = renderHook(() => useDeleteSession(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'sess-1', campaignId: 'camp-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.delete).toHaveBeenCalled()
    expect(supabase.eq).toHaveBeenCalledWith('id', 'sess-1')
  })
})
