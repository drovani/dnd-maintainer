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

setupMockReset()

// useCampaigns has no id param — pass null to skip the "does not fetch" test
describeListQuery(
  'useCampaigns',
  () => renderHook(() => useCampaigns(), { wrapper: createWrapper() }),
  baseCampaign,
  null,
)

describeSingleQuery(
  'useCampaign',
  (id) => renderHook(() => useCampaign(id as string | undefined), { wrapper: createWrapper() }),
  baseCampaign,
  'camp-1',
  undefined,
)

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
