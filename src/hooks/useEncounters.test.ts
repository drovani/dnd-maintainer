import {
  setupMockReset,
  describeListQuery,
  describeSingleQuery,
  describeCreateMutation,
  describeUpdateMutation,
  renderHook,
  waitFor,
  createWrapper,
  supabase,
  mockQueryResult,
} from '@/test/hook-test-helpers'

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

setupMockReset()

describeListQuery(
  'useEncounters',
  () => renderHook(() => useEncounters('camp-1'), { wrapper: createWrapper() }),
  baseEncounter,
  () => renderHook(() => useEncounters(''), { wrapper: createWrapper() }),
  'campaign_id',
)

// useSessionEncounters is session-scoped — tested inline for the extra eq assertion
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

describeSingleQuery(
  'useEncounter',
  (id) => renderHook(() => useEncounter(id as string), { wrapper: createWrapper() }),
  baseEncounter,
  'enc-1',
  '',
)

const { id: _id, created_at: _created_at, updated_at: _updated_at, ...createEncounterPayload } = baseEncounter

describeCreateMutation(
  'useCreateEncounter',
  () => renderHook(() => useCreateEncounter(), { wrapper: createWrapper() }),
  createEncounterPayload,
  baseEncounter,
)

describeUpdateMutation(
  'useUpdateEncounter',
  () => renderHook(() => useUpdateEncounter(), { wrapper: createWrapper() }),
  { id: 'enc-1', name: 'Dragon Fight' },
)

describe('useDeleteEncounter', () => {
  it('deletes by id and succeeds', async () => {
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
