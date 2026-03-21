/// <reference types="node" />
import { act, waitFor } from '@testing-library/react'
import { setupMockReset, withSuppressedRejections, renderHook, createWrapper, supabase, mockQueryResult } from '@/test/hook-test-helpers'

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'))

import { useBuilderAutosave } from '@/hooks/useBuilderAutosave'
import type { SaveStatus } from '@/hooks/useBuilderAutosave'

const basePayload = {
  campaign_id: 'camp-1',
  name: 'Hero Draft',
  character_type: 'pc' as const,
  player_name: 'Bob',
  race: 'human',
  class: 'fighter',
  subclass: null,
  level: 1,
  background: 'soldier',
  alignment: 'lawful-good',
  gender: null,
  hit_points_max: 10,
  hit_points_current: 10,
  armor_class: 16,
  speed: 30,
  abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 11, cha: 9 },
  saving_throws: {},
  skills: {},
  features: [],
  equipment: [],
  spells: { cantrips: [], spellsByLevel: {}, spellSlots: {} },
  personality_traits: null,
  ideals: null,
  bonds: null,
  flaws: null,
  appearance: null,
  backstory: null,
  notes: null,
}

setupMockReset()

beforeEach(() => {
  // Restore then to its default behavior in case a test overrode it
  supabase.then = (resolve, reject) => Promise.resolve({ ...mockQueryResult }).then(resolve, reject)
})

describe('useBuilderAutosave', () => {
  describe('initial state', () => {
    it('starts with saveStatus idle', () => {
      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      expect(result.current.saveStatus).toBe<SaveStatus>('idle')
    })

    it('exposes saveDraft, finalize, and clearStatus', () => {
      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      expect(typeof result.current.saveDraft).toBe('function')
      expect(typeof result.current.finalize).toBe('function')
      expect(typeof result.current.clearStatus).toBe('function')
    })
  })

  describe('saveDraft', () => {
    it('inserts on first call (no existing characterId) and returns the new id', async () => {
      mockQueryResult.data = { id: 'char-new' }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      let returnedId: string | undefined
      await act(async () => {
        returnedId = await result.current.saveDraft(basePayload)
      })

      expect(supabase.insert).toHaveBeenCalled()
      expect(returnedId).toBe('char-new')
    })

    it('sets saveStatus to saved after successful insert', async () => {
      mockQueryResult.data = { id: 'char-new' }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.saveDraft(basePayload)
      })

      expect(result.current.saveStatus).toBe<SaveStatus>('saved')
    })

    it('updates on subsequent calls after first insert establishes characterId', async () => {
      mockQueryResult.data = { id: 'char-existing' }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      // First call — inserts
      await act(async () => {
        await result.current.saveDraft(basePayload)
      })

      // Clear call tracking so we can detect the second call type
      vi.mocked(supabase.insert).mockClear()
      vi.mocked(supabase.update).mockClear()
      // Update doesn't need to return data
      mockQueryResult.data = null

      // Second call — should update, not insert
      await act(async () => {
        await result.current.saveDraft({ ...basePayload, name: 'Updated Name' })
      })

      expect(supabase.insert).not.toHaveBeenCalled()
      expect(supabase.update).toHaveBeenCalled()
    })

    it('sets saveStatus to error when supabase returns an error', async () => {
      expect.assertions(2)
      mockQueryResult.error = { message: 'Save failed' }
      mockQueryResult.data = null

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      await withSuppressedRejections(async () => {
        await act(async () => {
          await result.current.saveDraft(basePayload).catch((err: { message: string }) => {
            expect(err).toEqual({ message: 'Save failed' })
          })
        })

        expect(result.current.saveStatus).toBe<SaveStatus>('error')
      })
    })

    it('includes status draft in insert payload', async () => {
      mockQueryResult.data = { id: 'char-new' }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.saveDraft(basePayload)
      })

      expect(supabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' })
      )
    })
  })

  describe('finalize', () => {
    it('calls saveDraft then updates status to ready and returns id', async () => {
      mockQueryResult.data = { id: 'char-new' }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      let returnedId: string | undefined
      await act(async () => {
        returnedId = await result.current.finalize(basePayload)
      })

      expect(returnedId).toBe('char-new')
      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ready' })
      )
    })

    it('sets saveStatus to saved after successful finalize', async () => {
      mockQueryResult.data = { id: 'char-new' }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.finalize(basePayload)
      })

      expect(result.current.saveStatus).toBe<SaveStatus>('saved')
    })

    it('sets saveStatus to error when the status update fails', async () => {
      expect.assertions(2)
      // saveDraft insert succeeds; the ready-update fails.
      // Override `then` to return different results per call.
      let callIndex = 0
      supabase.then = (resolve, reject) => {
        callIndex++
        if (callIndex === 1) {
          return Promise.resolve({ data: { id: 'char-new' }, error: null }).then(resolve, reject)
        }
        return Promise.resolve({ data: null, error: { message: 'Status update failed' } }).then(resolve, reject)
      }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      await withSuppressedRejections(async () => {
        await act(async () => {
          await result.current.finalize(basePayload).catch((err: { message: string }) => {
            expect(err).toEqual({ message: 'Status update failed' })
          })
        })

        await waitFor(() => expect(result.current.saveStatus).toBe<SaveStatus>('error'))
      })
    })
  })

  describe('clearStatus', () => {
    it('transitions saveStatus from saved to idle', async () => {
      mockQueryResult.data = { id: 'char-new' }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.saveDraft(basePayload)
      })

      expect(result.current.saveStatus).toBe<SaveStatus>('saved')

      act(() => {
        result.current.clearStatus()
      })

      expect(result.current.saveStatus).toBe<SaveStatus>('idle')
    })

    it('does not change saveStatus when it is error', async () => {
      expect.assertions(3)
      mockQueryResult.error = { message: 'Save failed' }

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      await withSuppressedRejections(async () => {
        await act(async () => {
          await result.current.saveDraft(basePayload).catch((err: { message: string }) => {
            expect(err).toEqual({ message: 'Save failed' })
          })
        })

        expect(result.current.saveStatus).toBe<SaveStatus>('error')

        act(() => {
          result.current.clearStatus()
        })

        // clearStatus only resets 'saved' → 'idle'; error is preserved
        expect(result.current.saveStatus).toBe<SaveStatus>('error')
      })
    })

    it('does not change saveStatus when it is idle', () => {
      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() })

      act(() => {
        result.current.clearStatus()
      })

      expect(result.current.saveStatus).toBe<SaveStatus>('idle')
    })
  })
})
