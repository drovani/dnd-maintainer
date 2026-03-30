import {
  setupMockReset,
  describeListQuery,
  renderHook,
  createWrapper,
  supabase,
  mockQueryResult,
} from '@/test/hook-test-helpers'

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))

import { useCharacterBuildLevels, useCharacterItems } from '@/hooks/useCharacterBuild'
import type { BuildLevelRow } from '@/lib/build-reconstruction'

const baseBuildLevel: BuildLevelRow = {
  sequence: 0,
  base_abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  ability_method: 'standard-array',
  class_id: null,
  class_level: null,
  subclass_id: null,
  asi_allocation: null,
  feat_id: null,
  hp_roll: null,
  choices: {},
  deleted_at: null,
}

const baseItem = {
  id: 'item-1',
  character_id: 'char-1',
  item_id: 'longsword',
  quantity: 1,
  equipped: true,
}

setupMockReset()

describeListQuery(
  'useCharacterBuildLevels',
  () => renderHook(() => useCharacterBuildLevels('char-1'), { wrapper: createWrapper() }),
  baseBuildLevel,
  () => renderHook(() => useCharacterBuildLevels(undefined), { wrapper: createWrapper() }),
  'character_id',
)

describe('useCharacterBuildLevels', () => {
  it('filters by deleted_at IS NULL', async () => {
    mockQueryResult.data = [baseBuildLevel]

    const { result } = renderHook(() => useCharacterBuildLevels('char-1'), { wrapper: createWrapper() })

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.is).toHaveBeenCalledWith('deleted_at', null)
  })

  it('orders results by sequence', async () => {
    mockQueryResult.data = [baseBuildLevel]

    const { result } = renderHook(() => useCharacterBuildLevels('char-1'), { wrapper: createWrapper() })

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.order).toHaveBeenCalledWith('sequence')
  })
})

describeListQuery(
  'useCharacterItems',
  () => renderHook(() => useCharacterItems('char-1'), { wrapper: createWrapper() }),
  baseItem,
  () => renderHook(() => useCharacterItems(undefined), { wrapper: createWrapper() }),
  'character_id',
)
