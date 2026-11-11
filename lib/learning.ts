import 'server-only'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { uuid } from '@/lib/validation'
export async function learningData(courseId: string) {
  const user = await requireUser(`/learn/${courseId}`)
  if (!uuid.safeParse(courseId).success) notFound()
  const db = await createClient()
  const [{ data: course, error: courseError }, { data: enrollment, error: enrollmentError }] = await Promise.all([
    db.from('courses').select('id,title').eq('id',courseId).eq('is_published',true).maybeSingle(),
    db.from('enrollments').select('id,status,expires_at').eq('user_id',user.id).eq('course_id',courseId).maybeSingle(),
  ])
  if (courseError || enrollmentError) throw courseError || enrollmentError
  if (!course) notFound()
  const allowed = enrollment?.status === 'active' && !!enrollment.expires_at && Date.parse(enrollment.expires_at) > Date.now()
  const { data: lessons, error } = await db.from('lessons').select('id,title,description').eq('course_id',courseId).eq('is_published',true).order('display_order')
  if (error) throw error
  const { data: progress, error: progressError } = enrollment ? await db.from('lesson_progress').select('lesson_id,watched_seconds,is_completed,last_watched_at').eq('user_id',user.id).eq('enrollment_id',enrollment.id).order('last_watched_at',{ ascending: false }) : { data: [], error: null }
  if (progressError) throw progressError
  return { user, course, enrollment, allowed, lessons: lessons ?? [], progress: progress ?? [] }
}
