import { createTimeoutFetch, SUPABASE_FETCH_TIMEOUT_MS } from '@/lib/supabase'

describe('createTimeoutFetch', () => {
  it('returns response when fetch resolves normally', async () => {
    const mockResponse = new Response('ok', { status: 200 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const timeoutFetch = createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS)
    const result = await timeoutFetch('https://example.com/api')

    expect(result).toBe(mockResponse)
  })

  it('rejects with timed out error when fetch never resolves and timeout elapses', async () => {
    vi.useFakeTimers()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
        // Reject when the controller's signal aborts
        return new Promise<Response>((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            reject(opts.signal!.reason)
          })
        })
      }),
    )

    const timeoutFetch = createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS)
    const fetchPromise = timeoutFetch('https://example.com/api')
    const assertion = expect(fetchPromise).rejects.toThrow(
      `timed out after ${SUPABASE_FETCH_TIMEOUT_MS}ms`,
    )

    await vi.advanceTimersByTimeAsync(SUPABASE_FETCH_TIMEOUT_MS + 1)
    await assertion

    vi.useRealTimers()
  })

  it('rejects immediately when caller signal is already aborted', async () => {
    // fetch should not be called at all
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    const controller = new AbortController()
    controller.abort()

    const timeoutFetch = createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS)
    await expect(
      timeoutFetch('https://example.com/api', { signal: controller.signal }),
    ).rejects.toThrow()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('re-throws non-timeout errors unchanged', async () => {
    const networkError = new Error('network down')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError))

    const timeoutFetch = createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS)
    await expect(timeoutFetch('https://example.com/api')).rejects.toThrow('network down')
  })
})
