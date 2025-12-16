import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build/SSG
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      auth: {
        signInWithPassword: async () => ({ error: new Error('Not configured') }),
        resetPasswordForEmail: async () => ({ error: new Error('Not configured') }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        updateUser: async () => ({ error: new Error('Not configured') }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ data: [], error: null }) }) }),
        insert: async () => ({ error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
        delete: () => ({ eq: async () => ({ error: null }) }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          remove: async () => ({ error: null }),
        }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<any>(supabaseUrl, supabaseAnonKey)
}
