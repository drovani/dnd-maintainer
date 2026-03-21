import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test/wrapper'
import { supabase, mockQueryResult } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))

import { useCampaigns, useCampaign, useCampaignMutations } from '@/hooks/useCampaigns'
import type { Campaign } from '@/types/database'

const baseCampaign: Campaign = {
  id: 'camp-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  name: 'Test Campaign',
  status: 'active',
  description: null,
  setting: null,
  image_url: null,
  dm_notes: null,
  archived_at: null,
}

beforeEach(() => {
  mockQueryResult.data = null
  mockQueryResult.error = null
  vi.mocked(supabase.from).mockClear()
})

describe('useCampaigns', () => {
  it('returns a list of campaigns', async () => {
    mockQueryResult.data = [baseCampaign]

    const { result } = renderHook(() => useCampaigns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([baseCampaign])
  })

  it('returns empty array when no campaigns exist', async () => {
    mockQueryResult.data = []

    const { result } = renderHook(() => useCampaigns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('sets error state when query fails', async () => {
    mockQueryResult.error = { message: 'DB error' }

    const { result } = renderHook(() => useCampaigns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual({ message: 'DB error' })
  })
})

describe('useCampaign', () => {
  it('returns a single campaign by id', async () => {
    mockQueryResult.data = baseCampaign

    const { result } = renderHook(() => useCampaign('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(baseCampaign)
  })

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useCampaign(undefined), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useCampaignMutations', () => {
  it('create inserts with status planning', async () => {
    mockQueryResult.data = { ...baseCampaign, status: 'planning' }

    const { result } = renderHook(() => useCampaignMutations(), { wrapper: createWrapper() })

    result.current.create.mutate({ name: 'New Campaign' })

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true))
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'planning' })
    )
  })

  it('update patches the campaign by id', async () => {
    const updated = { ...baseCampaign, name: 'Updated Name' }
    mockQueryResult.data = updated

    const { result } = renderHook(() => useCampaignMutations(), { wrapper: createWrapper() })

    result.current.update.mutate({ id: 'camp-1', name: 'Updated Name' })

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
    expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }))
    expect(supabase.eq).toHaveBeenCalledWith('id', 'camp-1')
  })

  it('archive sets archived_at to an ISO string', async () => {
    mockQueryResult.data = null

    const { result } = renderHook(() => useCampaignMutations(), { wrapper: createWrapper() })

    result.current.archive.mutate('camp-1')

    await waitFor(() => expect(result.current.archive.isSuccess).toBe(true))
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ archived_at: expect.any(String) })
    )
    expect(supabase.eq).toHaveBeenCalledWith('id', 'camp-1')
  })
})
