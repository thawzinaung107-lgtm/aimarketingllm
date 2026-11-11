import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Read helpers. All of these run as the signed-in user (or anon), so RLS is
 * the access boundary. Writes that grant access are NOT exposed here; they go
 * through database functions (see supabase/migrations/*security_remediation*).
 */

export async function getPublishedCourses() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug, description, thumbnail_url, price, currency, category')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function getActiveHomepageBanners() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('homepage_banners')
    .select('id, eyebrow, title, description, image_url, link_url')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(3)
  if (error) throw error
  return data
}

export async function getMyEnrollments(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, status, enrolled_at, expires_at, courses ( id, title, slug, description, thumbnail_url )')
    .eq('user_id', userId)
    .in('status', ['active', 'expired'])
    .order('enrolled_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getMyDevices(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('registered_devices')
    .select('id, device_name, last_used_at, created_at')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false })
  if (error) throw error
  return data
}
