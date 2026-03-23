import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const SUPABASE_FETCH_TIMEOUT_MS = 5000

export function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (url, options) => {
    const controller = new AbortController()
    const callerSignal = options?.signal as AbortSignal | undefined

    if (callerSignal?.aborted) {
      throw callerSignal.reason instanceof Error
        ? callerSignal.reason
        : new DOMException('Aborted', 'AbortError')
    }

    const timer = setTimeout(() => {
      controller.abort(new DOMException('Request timed out', 'TimeoutError'))
    }, timeoutMs)

    const onCallerAbort = (): void => {
      clearTimeout(timer)
      controller.abort(callerSignal?.reason)
    }
    callerSignal?.addEventListener('abort', onCallerAbort)

    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error(`Supabase request timed out after ${timeoutMs}ms`)
      }
      throw error
    } finally {
      clearTimeout(timer)
      callerSignal?.removeEventListener('abort', onCallerAbort)
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS),
  },
})
