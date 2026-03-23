import {
  setupMockReset,
  describeListQuery,
  describeSingleQuery,
  describeCreateMutation,
  describeUpdateMutation,
  describeDeleteMutation,
  renderHook,
  createWrapper,
} from '@/test/hook-test-helpers'

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

setupMockReset()

describeListQuery(
  'useNotes',
  () => renderHook(() => useNotes('camp-1'), { wrapper: createWrapper() }),
  baseNote,
  () => renderHook(() => useNotes(''), { wrapper: createWrapper() }),
  'campaign_id',
)

describeSingleQuery(
  'useNote',
  (id) => renderHook(() => useNote(id as string), { wrapper: createWrapper() }),
  baseNote,
  'note-1',
  '',
)

const { id: _id, created_at: _created_at, updated_at: _updated_at, ...createNotePayload } = baseNote

describeCreateMutation(
  'useCreateNote',
  () => renderHook(() => useCreateNote(), { wrapper: createWrapper() }),
  createNotePayload,
  baseNote,
)

describeUpdateMutation(
  'useUpdateNote',
  () => renderHook(() => useUpdateNote(), { wrapper: createWrapper() }),
  { id: 'note-1', title: 'Updated Title' },
)

describeDeleteMutation(
  'useDeleteNote',
  () => renderHook(() => useDeleteNote(), { wrapper: createWrapper() }),
  { id: 'note-1' },
)
