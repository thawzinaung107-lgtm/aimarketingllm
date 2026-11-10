import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { UserRole } from '@/lib/database.types'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
}

/**
 * Get the current authenticated user from the session
 * Cached per request
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', authUser.id)
    .single()

  if (!profile) {
    return null
  }

  return profile
})

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Check if the current user is a student
 */
export async function isStudent(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'student'
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()

  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  return user
}

/**
 * Require student role - throws if not student
 */
export async function requireStudent(): Promise<User> {
  const user = await requireAuth()

  if (user.role !== 'student') {
    throw new Error('Forbidden: Student access required')
  }

  return user
}

/**
 * Check if user has access to a specific course (enrolled and not expired)
 */
export async function hasActiveCourseAccess(courseId: string): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status, expires_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .single()

  if (!enrollment) {
    return false
  }

  // Check if enrollment is expired
  if (enrollment.expires_at && new Date(enrollment.expires_at) < new Date()) {
    return false
  }

  return true
}
