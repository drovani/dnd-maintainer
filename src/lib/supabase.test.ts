import { createTimeoutFetch, SUPABASE_FETCH_TIMEOUT_MS } from '@/lib/supabase';

describe('createTimeoutFetch', () => {
  it('returns response when fetch resolves normally', async () => {
    const mockResponse = new Response('ok', { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const timeoutFetch = createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS);
    const result = await timeoutFetch('https://example.com/api');

    expect(result).toBe(mockResponse);
  });

  it('rejects with timeout error when request exceeds time limit', async () => {
    // AbortSignal.timeout() uses real browser timers not supported in jsdom,
    // so we stub it to fire immediately with a TimeoutError.
    const abortController = new AbortController();
    const timeoutError = new DOMException('signal timed out', 'TimeoutError');
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(abortController.signal);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            reject(timeoutError);
          });
          // Trigger abort synchronously after attaching listener
          abortController.abort(timeoutError);
        });
      })
    );

    const timeoutFetch = createTimeoutFetch(10); // 10ms timeout
    await expect(timeoutFetch('https://example.com/api', {})).rejects.toThrow(
      'Supabase request to https://example.com/api timed out after 10ms'
    );
  });

  it('rejects immediately when caller signal is already aborted', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new DOMException('signal is aborted without reason', 'AbortError'));
    vi.stubGlobal('fetch', mockFetch);

    const controller = new AbortController();
    controller.abort();

    const timeoutFetch = createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS);
    await expect(timeoutFetch('https://example.com/api', { signal: controller.signal })).rejects.toThrow(DOMException);
  });

  it('rejects with AbortError when caller aborts an in-flight request', async () => {
    const controller = new AbortController();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      })
    );

    const timeoutFetch = createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS);
    const fetchPromise = timeoutFetch('https://example.com/api', { signal: controller.signal });

    controller.abort();

    await expect(fetchPromise).rejects.toThrow(DOMException);
  });

  it('re-throws non-timeout errors unchanged', async () => {
    const networkError = new Error('network down');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));

    const timeoutFetch = createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS);
    await expect(timeoutFetch('https://example.com/api')).rejects.toThrow('network down');
  });
});
