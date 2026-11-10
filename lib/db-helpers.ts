import { createClient } from '@/lib/supabase/server'

/**
 * Get active enrollments for a user
 */
export async function getUserEnrollments(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses (
        id,
        title,
        slug,
        description,
        thumbnail_url,
        access_duration_days
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get course with lessons for enrolled student
 */
export async function getCourseWithLessons(courseId: string, userId: string) {
  const supabase = await createClient()

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, expires_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .single()

  if (!enrollment) {
    return null
  }

  // Check expiration
  if (enrollment.expires_at && new Date(enrollment.expires_at) < new Date()) {
    return null
  }

  // Get course with lessons
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      lessons (
        id,
        title,
        description,
        video_url,
        duration_seconds,
        display_order
      )
    `)
    .eq('id', courseId)
    .eq('is_published', true)
    .single()

  if (error) throw error

  return {
    ...course,
    enrollment_id: enrollment.id,
  }
}

/**
 * Get lesson progress for a user
 */
export async function getLessonProgress(
  userId: string,
  lessonId: string,
  enrollmentId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('enrollment_id', enrollmentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

/**
 * Update lesson progress
 */
export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  enrollmentId: string,
  watchedSeconds: number,
  isCompleted: boolean = false
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      enrollment_id: enrollmentId,
      watched_seconds: watchedSeconds,
      is_completed: isCompleted,
      last_watched_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Submit manual payment
 */
export async function submitManualPayment(
  userId: string,
  courseId: string,
  amount: number,
  paymentProofUrl: string | null,
  paymentNotes: string | null
) {
  const supabase = await createClient()

  // Create pending enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      status: 'pending_payment',
    })
    .select()
    .single()

  if (enrollmentError) throw enrollmentError

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('manual_payments')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrollment_id: enrollment.id,
      amount,
      payment_proof_url: paymentProofUrl,
      payment_notes: paymentNotes,
      status: 'pending',
    })
    .select()
    .single()

  if (paymentError) throw paymentError
  return { enrollment, payment }
}

/**
 * Redeem a code (uses database function for atomicity)
 */
export async function redeemCode(code: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('redeem_code', {
    p_code: code,
    p_user_id: userId,
  })

  if (error) throw error
  return data
}

/**
 * Get published courses for browsing
 */
export async function getPublishedCourses() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug, description, thumbnail_url, price, display_order')
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Get active homepage banners
 */
export async function getActiveHomepageBanners() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('homepage_banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(3)

  if (error) throw error
  return data
}

/**
 * Register a device
 */
export async function registerDevice(
  userId: string,
  deviceFingerprint: string,
  deviceName: string | null,
  userAgent: string | null,
  ipAddress: string | null
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registered_devices')
    .upsert({
      user_id: userId,
      device_fingerprint: deviceFingerprint,
      device_name: deviceName,
      user_agent: userAgent,
      ip_address: ipAddress,
      last_used_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user's registered devices
 */
export async function getUserDevices(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registered_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Remove a device
 */
export async function removeDevice(userId: string, deviceId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('registered_devices')
    .delete()
    .eq('id', deviceId)
    .eq('user_id', userId)

  if (error) throw error
}
