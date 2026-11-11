import { z } from 'zod'
import { assertUser, AuthError } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import { assertSameOrigin, privateJson } from '@/lib/http-security'
import { uuid } from '@/lib/validation'
export async function POST(request: Request, { params }: RouteContext<'/api/lessons/[lessonId]/progress'>) {
  try {
    assertSameOrigin(request); await assertUser()
    if (!sensitiveFeaturesEnabled()) return privateJson({ error: 'Progress recording unavailable' },503)
    const { lessonId } = await params
    if (!uuid.safeParse(lessonId).success) return privateJson({ error: 'Invalid lesson' },400)
    const body = z.object({ seconds: z.number().int().min(0).max(2147483647), completed: z.boolean() }).safeParse(await request.json())
    if (!body.success) return privateJson({ error: 'Invalid progress' },400)
    const db = await createClient()
    const { error } = await db.rpc('record_lesson_progress',{ p_lesson_id: lessonId, p_position_seconds: body.data.seconds, p_completed: body.data.completed })
    if (error) return privateJson({ error: 'Access expired or unauthorized. Progress was not saved.' },403)
    return privateJson({ saved: true })
  } catch (error) { return privateJson({ error: 'Could not save progress' }, error instanceof AuthError ? error.status : 400) }
}
