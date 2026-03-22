import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const SUPABASE_FETCH_TIMEOUT_MS = 5000

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options) => {
      const timeout = AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS)
      const signal = options?.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout
      try {
        return await fetch(url, { ...options, signal })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          throw new Error(`Supabase request timed out after ${SUPABASE_FETCH_TIMEOUT_MS}ms`)
        }
        throw error
      }
    },
  },
})
