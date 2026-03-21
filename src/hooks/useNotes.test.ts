import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test/wrapper'
import { supabase, mockQueryResult } from '@/test/mocks/supabase'

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))

import { useNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes'
import type { Note } from '@/types/database'

const baseNote: Note = {
  id: 'note-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  campaign_id: 'camp-1',
  title: 'The Ancient Prophecy',
  content: 'In the age of dragons...',
  category: 'lore',
  tags: ['prophecy', 'lore'],
  is_pinned: false,
}

beforeEach(() => {
  mockQueryResult.data = null
  mockQueryResult.error = null
  vi.mocked(supabase.from).mockClear()
})

describe('useNotes', () => {
  it('returns a list of notes for a campaign', async () => {
    mockQueryResult.data = [baseNote]

    const { result } = renderHook(() => useNotes('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([baseNote])
    expect(supabase.eq).toHaveBeenCalledWith('campaign_id', 'camp-1')
  })

  it('returns empty array when no notes exist', async () => {
    mockQueryResult.data = []

    const { result } = renderHook(() => useNotes('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('sets error state when query fails', async () => {
    mockQueryResult.error = { message: 'DB error' }

    const { result } = renderHook(() => useNotes('camp-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('does not fetch when campaignId is empty string', () => {
    const { result } = renderHook(() => useNotes(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useNote', () => {
  it('returns a single note by id', async () => {
    mockQueryResult.data = baseNote

    const { result } = renderHook(() => useNote('note-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(baseNote)
  })

  it('does not fetch when id is empty string', () => {
    const { result } = renderHook(() => useNote(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('useCreateNote', () => {
  it('inserts a note and returns it', async () => {
    mockQueryResult.data = baseNote

    const { result } = renderHook(() => useCreateNote(), { wrapper: createWrapper() })

    const { id, created_at, updated_at, ...createPayload } = baseNote
    result.current.mutate(createPayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(baseNote)
    expect(supabase.insert).toHaveBeenCalled()
  })

  it('sets error when insert fails', async () => {
    mockQueryResult.error = { message: 'Insert failed' }

    const { result } = renderHook(() => useCreateNote(), { wrapper: createWrapper() })

    const { id, created_at, updated_at, ...createPayload } = baseNote
    result.current.mutate(createPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateNote', () => {
  it('updates a note by id', async () => {
    const updated = { ...baseNote, title: 'Updated Title' }
    mockQueryResult.data = updated

    const { result } = renderHook(() => useUpdateNote(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'note-1', title: 'Updated Title' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.update).toHaveBeenCalled()
    expect(supabase.eq).toHaveBeenCalledWith('id', 'note-1')
  })
})

describe('useDeleteNote', () => {
  it('deletes a note by id', async () => {
    mockQueryResult.data = null

    const { result } = renderHook(() => useDeleteNote(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'note-1', campaignId: 'camp-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.delete).toHaveBeenCalled()
    expect(supabase.eq).toHaveBeenCalledWith('id', 'note-1')
  })
})
