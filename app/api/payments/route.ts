import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { z } from 'zod'
import { assertUser, AuthError } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import { assertSameOrigin, limitedFormData, privateJson } from '@/lib/http-security'
import { privateBucket } from '@/lib/private-storage'
export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const user = await assertUser()
    if (!sensitiveFeaturesEnabled() || !process.env.MANUAL_PAYMENT_INSTRUCTIONS?.trim()) return privateJson({ error: 'Payments are not available yet.' }, 503)
    const form = await limitedFormData(request, 6 * 1024 * 1024)
    const parsed = z.object({ courseId: z.uuid(), amount: z.coerce.number().finite().min(0).max(99999999), reference: z.string().trim().min(1).max(200) }).safeParse(Object.fromEntries(form))
    if (!parsed.success) return privateJson({ error: 'Check your payment details.' }, 400)
    const file = form.get('receipt')
    if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) return privateJson({ error: 'Choose a JPEG, PNG or WebP receipt under 5 MB.' }, 400)
    const db = await createClient()
    const { data: course, error: courseError } = await db.from('courses').select('id').eq('id', parsed.data.courseId).eq('is_published',true).maybeSingle()
    if (courseError || !course) return privateJson({ error: 'This course is unavailable.' }, 400)
    // Decode/re-encode instead of trusting a MIME type or original filename.
    let image: Buffer
    try { image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 20000000 }).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer() } catch { return privateJson({ error: 'The receipt is not a valid image.' }, 400) }
    const bucket = await privateBucket('payment-receipts')
    const path = `${user.id}/${randomUUID()}.webp`
    const { error: uploadError } = await bucket.upload(path, image, { contentType: 'image/webp', upsert: false })
    if (uploadError) return privateJson({ error: 'Receipt upload failed. Please try again.' }, 503)
    const { error } = await db.rpc('submit_manual_payment', { p_course_id: parsed.data.courseId, p_amount: parsed.data.amount, p_payment_reference: parsed.data.reference, p_proof_path: path })
    if (error) {
      await bucket.remove([path])
      return privateJson({ error: 'Payment could not be submitted. Check for an existing pending payment or active enrollment.' }, 409)
    }
    return privateJson({ message: 'Payment submitted for review. No course access has been granted yet.' }, 201)
  } catch (error) {
    if (error instanceof AuthError) return privateJson({ error: error.message }, error.status)
    return privateJson({ error: 'Payment submission is unavailable. Check the file size and try again.' }, 503)
  }
}
