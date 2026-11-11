import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

export type UserRole = Database['public']['Enums']['user_role']

export interface CurrentUser {
  id: string
  email: string | null
  fullName: string | null
  role: UserRole
  sessionId: string | null
}

/**
 * The signed-in user, verified server-side. The JWT is validated by
 * getClaims(); the role is read from the database (never from the token or
 * user metadata, which the user can influence).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null

  // Reject revoked sessions immediately (the JWT alone stays valid until expiry).
  const { data: active } = await supabase.rpc('current_session_is_active')
  if (active !== true) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', claims.sub)
    .maybeSingle()

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    sessionId: typeof claims.session_id === 'string' ? claims.session_id : null,
  }
})

/** For pages: redirect to /login if signed out. */
export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login')
  return user
}

/** For admin pages: redirect signed-out users to login, non-admins home. */
export async function requireAdminPage(): Promise<CurrentUser> {
  const user = await requireUser('/admin')
  if (user.role !== 'admin') redirect('/')
  return user
}

export class AuthError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message)
  }
}

/** For route handlers / server actions: throws AuthError instead of redirecting. */
export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) throw new AuthError(401, 'Authentication required')
  return user
}

export async function assertAdmin(): Promise<CurrentUser> {
  const user = await assertUser()
  if (user.role !== 'admin') throw new AuthError(403, 'Admin access required')
  return user
}
