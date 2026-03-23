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
    const timeout = AbortSignal.timeout(timeoutMs)
    const signal = options?.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout
    try {
      return await fetch(url, { ...options, signal })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        const target = typeof url === 'string' ? url : url.toString()
        throw new Error(`Supabase request to ${target} timed out after ${timeoutMs}ms`)
      }
      throw error
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createTimeoutFetch(SUPABASE_FETCH_TIMEOUT_MS),
  },
})
