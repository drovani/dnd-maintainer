import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test/wrapper'
import { supabase, mockQueryResult } from '@/test/mocks/supabase'

// Minimal shape of result.current that all hook results share.
interface QueryResult {
  isSuccess: boolean
  isError: boolean
  isLoading: boolean
  fetchStatus: string
  data: unknown
  error: unknown
}

interface MutationResult {
  isSuccess: boolean
  isError: boolean
  data: unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: (payload: any) => void
}

type InvokeFn = () => { result: { current: QueryResult } }
type MutationInvokeFn = () => { result: { current: MutationResult } }

/**
 * Call inside each test file's top-level scope to register the standard
 * beforeEach reset used by all CRUD hook tests.
 */
export function setupMockReset(): void {
  beforeEach(() => {
    mockQueryResult.data = null
    mockQueryResult.error = null
    vi.mocked(supabase.from).mockClear()
  })
}

/**
 * Generates a describe block for a list query hook (e.g. useSessions('camp-1')).
 *
 * @param label           - The describe block label (e.g. 'useSessions')
 * @param invoke          - Calls the hook with an enabled ID (returns data)
 * @param mockItem        - A single item of the entity type, used as list element
 * @param invokeDisabled  - Calls the hook with the disabled ID ('' or undefined).
 *                          Pass null to skip the "does not fetch" test (useCampaigns has no ID param).
 * @param eqField         - When set, asserts supabase.eq was called with this field (e.g. 'campaign_id')
 */
export function describeListQuery<T>(
  label: string,
  invoke: InvokeFn,
  mockItem: T,
  invokeDisabled: InvokeFn | null,
  eqField?: string,
): void {
  describe(label, () => {
    it(`returns a list of ${label.replace(/^use/, '').toLowerCase()}`, async () => {
      mockQueryResult.data = [mockItem]

      const { result } = invoke()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockItem])
      if (eqField) {
        expect(supabase.eq).toHaveBeenCalledWith(eqField, expect.any(String))
      }
    })

    it('returns empty array when none exist', async () => {
      mockQueryResult.data = []

      const { result } = invoke()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })

    it('sets error state when query fails', async () => {
      mockQueryResult.error = { message: 'DB error' }

      const { result } = invoke()

      await waitFor(() => expect(result.current.isError).toBe(true))
    })

    if (invokeDisabled !== null) {
      it('does not fetch when id is disabled', () => {
        const { result } = invokeDisabled()

        expect(result.current.fetchStatus).toBe('idle')
        expect(supabase.from).not.toHaveBeenCalled()
      })
    }
  })
}

/**
 * Generates a describe block for a single-item query hook (e.g. useSession('sess-1')).
 *
 * @param label         - The describe block label (e.g. 'useSession')
 * @param invokeWith    - Calls the hook with the given id argument
 * @param mockItem      - The single entity to return
 * @param validId       - An ID that enables the query
 * @param disabledId    - ID value that disables fetching ('' or undefined)
 */
export function describeSingleQuery<T>(
  label: string,
  invokeWith: (id: string | undefined) => { result: { current: QueryResult } },
  mockItem: T,
  validId: string,
  disabledId: string | undefined,
): void {
  describe(label, () => {
    it(`returns a single ${label.replace(/^use/, '').toLowerCase()} by id`, async () => {
      mockQueryResult.data = mockItem

      const { result } = invokeWith(validId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockItem)
    })

    it(`does not fetch when id is ${disabledId === '' ? 'empty string' : 'undefined'}`, () => {
      const { result } = invokeWith(disabledId)

      expect(result.current.fetchStatus).toBe('idle')
      expect(supabase.from).not.toHaveBeenCalled()
    })
  })
}

/**
 * Generates a describe block for a standalone create mutation hook
 * (e.g. useCreateSession).
 *
 * @param label      - The describe block label (e.g. 'useCreateSession')
 * @param hookFn     - The mutation hook under test (no args)
 * @param payload    - The payload to pass to mutate()
 * @param mockItem   - The data to return on success
 */
export function describeCreateMutation<TPayload, TResult>(
  label: string,
  hookFn: MutationInvokeFn,
  payload: TPayload,
  mockItem: TResult,
): void {
  describe(label, () => {
    it('inserts and returns the created item', async () => {
      mockQueryResult.data = mockItem

      const { result } = hookFn()
      result.current.mutate(payload)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockItem)
      expect(supabase.insert).toHaveBeenCalled()
    })

    it('sets error when insert fails', async () => {
      mockQueryResult.error = { message: 'Insert failed' }

      const { result } = hookFn()
      result.current.mutate(payload)

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })
}

/**
 * Generates a describe block for a standalone update mutation hook
 * (e.g. useUpdateSession).
 *
 * @param label    - The describe block label
 * @param hookFn   - The mutation hook under test
 * @param payload  - The update payload (must include id)
 */
export function describeUpdateMutation<TPayload extends { id: string }>(
  label: string,
  hookFn: MutationInvokeFn,
  payload: TPayload,
): void {
  describe(label, () => {
    it('updates by id and succeeds', async () => {
      mockQueryResult.data = { id: payload.id }

      const { result } = hookFn()
      result.current.mutate(payload)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(supabase.update).toHaveBeenCalled()
      expect(supabase.eq).toHaveBeenCalledWith('id', payload.id)
    })
  })
}

/**
 * Generates a describe block for a standalone delete mutation hook
 * (e.g. useDeleteSession).
 *
 * @param label    - The describe block label
 * @param hookFn   - The mutation hook under test
 * @param payload  - The delete payload (must include id)
 */
export function describeDeleteMutation<TPayload extends { id: string }>(
  label: string,
  hookFn: MutationInvokeFn,
  payload: TPayload,
): void {
  describe(label, () => {
    it('deletes by id and succeeds', async () => {
      mockQueryResult.data = null

      const { result } = hookFn()
      result.current.mutate(payload)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(supabase.delete).toHaveBeenCalled()
      expect(supabase.eq).toHaveBeenCalledWith('id', payload.id)
    })
  })
}

// Re-export commonly needed test utilities so files only need one import line.
export { renderHook, waitFor, createWrapper, supabase, mockQueryResult }
