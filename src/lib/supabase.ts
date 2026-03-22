import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
      const timeout = AbortSignal.timeout(5000)
      const signal = options?.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout
      return fetch(url, { ...options, signal })
    },
  },
})
