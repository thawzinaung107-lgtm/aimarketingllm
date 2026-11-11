import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import { privateJson } from '@/lib/http-security'
import { uuid, objectKey } from '@/lib/validation'
import { streamingProvider } from '@/lib/streaming'
import { playbackLifetime } from '@/lib/playback-policy'
export async function GET(_request: Request, { params }: RouteContext<'/api/lessons/[lessonId]/playback'>) {
  const user = await getCurrentUser()
  if (!user) return privateJson({ error: 'Unauthorized access' },401)
  const { lessonId } = await params
  if (!uuid.safeParse(lessonId).success) return privateJson({ error: 'Invalid lesson' },400)
  if (!sensitiveFeaturesEnabled()) return privateJson({ error: 'Playback awaits security verification.' },503)
  const db = await createClient()
  // This RPC verifies user, registered session/device, publication and expiry.
  const { data: key, error } = await db.rpc('get_lesson_playback',{ p_lesson_id: lessonId })
  if (error) return privateJson({ error: 'Unauthorized access or access expired. Check your enrollment and registered devices.' },403)
  if (!objectKey.safeParse(key).success) return privateJson({ error: 'Video is not configured.' },503)
  const configuredTtl = z.coerce.number().int().min(30).max(300).safeParse(process.env.SIGNED_URL_TTL_SECONDS || 120)
  if (!configuredTtl.success) return privateJson({ error: 'Playback configuration is unavailable.' },503)
  let ttl = configuredTtl.data
  if (user.role !== 'admin') {
    const { data: lesson } = await db.from('lessons').select('course_id').eq('id',lessonId).single()
    const { data: enrollment } = await db.from('enrollments').select('expires_at').eq('user_id',user.id).eq('course_id',lesson?.course_id ?? '').eq('status','active').maybeSingle()
    ttl = playbackLifetime(enrollment?.expires_at ?? null, ttl)
    if (!ttl) return privateJson({ error: 'Access expired' },403)
  }
  const provider = streamingProvider()
  if (!provider) return privateJson({ error: 'Streaming provider integration pending.' },503)
  try { return privateJson(await provider.sign(key!,ttl)) }
  catch { return privateJson({ error: 'Video temporarily unavailable. Please try again.' },503) }
}
