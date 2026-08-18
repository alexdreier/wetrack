import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let client: SupabaseClient<Database> | undefined

export function createClient(): SupabaseClient<Database> {
  if (client) return client

  // Placeholder values keep envless builds/prerenders working; real requests
  // require the env vars, which is the correct failure mode when misconfigured.
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return client
}
