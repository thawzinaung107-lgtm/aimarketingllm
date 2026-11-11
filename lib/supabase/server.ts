import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { getPublicEnv } from '@/lib/env'
import { getServerEnv } from '@/lib/env.server'

/** Per-request client acting as the signed-in user (RLS applies). */
export async function createClient() {
  // Read request cookies first: this marks the caller as request-time
  // rendering, so `next build` never needs Supabase configuration.
  const cookieStore = await cookies()
  const env = getPublicEnv()

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  })
}

/**
 * Privileged client (bypasses RLS). Server-only. Use ONLY for operations that
 * have already been authorised, e.g. minting a signed URL after
 * get_lesson_playback() has confirmed access.
 */
export function createServiceClient() {
  const env = getPublicEnv()
  const server = getServerEnv()
  return createAdminSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, server.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
