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

setupMockReset()

describeListQuery(
  'useSessions',
  () => renderHook(() => useSessions('camp-1'), { wrapper: createWrapper() }),
  baseSession,
  () => renderHook(() => useSessions(''), { wrapper: createWrapper() }),
  'campaign_id',
)

describeSingleQuery(
  'useSession',
  (id) => renderHook(() => useSession(id as string), { wrapper: createWrapper() }),
  baseSession,
  'sess-1',
  '',
)

const { id: _id, created_at: _created_at, updated_at: _updated_at, ...createSessionPayload } = baseSession

describeCreateMutation(
  'useCreateSession',
  () => renderHook(() => useCreateSession(), { wrapper: createWrapper() }),
  createSessionPayload,
  baseSession,
)

describeUpdateMutation(
  'useUpdateSession',
  () => renderHook(() => useUpdateSession(), { wrapper: createWrapper() }),
  { id: 'sess-1', title: 'Updated Title' },
)

describeDeleteMutation(
  'useDeleteSession',
  () => renderHook(() => useDeleteSession(), { wrapper: createWrapper() }),
  { id: 'sess-1', campaignId: 'camp-1' },
)
