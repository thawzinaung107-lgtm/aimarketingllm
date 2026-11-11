'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import { courseSchema, localLink, objectKey, uuid, type ActionState } from '@/lib/validation'
export async function adminAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await assertAdmin() // Never trust the layout, hidden fields or user metadata.
  if (!sensitiveFeaturesEnabled()) return { message: 'Changes are disabled pending database security verification.' }
  const db = await createClient()
  const text = (key: string) => String(form.get(key) ?? '')
  const id = () => uuid.parse(text('id'))
  const reason = () => z.string().trim().min(5).max(500).parse(text('reason'))
  const op = text('operation')
  let error: { message: string } | null = null
  try {
    switch (op) {
      case 'course': {
        const payload = courseSchema.parse({ ...Object.fromEntries(form), is_published: form.get('is_published') === 'on' })
        const result = text('id') ? await db.from('courses').update(payload).eq('id',id()).select('id').single() : await db.from('courses').insert(payload).select('id').single()
        error = result.error; break
      }
      case 'lesson': {
        const payload = z.object({ course_id: uuid, title: z.string().trim().min(1).max(200), description: z.string().max(10000), display_order: z.coerce.number().int().min(0).max(100000), duration_seconds: z.preprocess(v => v === '' ? null : v, z.coerce.number().int().positive().nullable()), is_published: z.boolean() }).parse({ ...Object.fromEntries(form), is_published: form.get('is_published') === 'on' })
        const result = text('id') ? await db.from('lessons').update(payload).eq('id',id()).select('id').single() : await db.from('lessons').insert(payload).select('id').single()
        error = result.error; break
      }
      case 'media': {
        const result = await db.from('lesson_media').upsert({ lesson_id:id(), storage_path:objectKey.parse(text('storage_path')) })
        error = result.error; break
      }
      case 'banner': {
        const payload = z.object({ title:z.string().trim().min(1).max(120), eyebrow:z.string().max(40), description:z.string().max(300), image_url:localLink, link_url:localLink, display_order:z.coerce.number().int().min(0).max(100000), is_active:z.boolean() }).parse({ ...Object.fromEntries(form), is_active:form.get('is_active') === 'on' })
        const result = text('id') ? await db.from('homepage_banners').update(payload).eq('id',id()).select('id').single() : await db.from('homepage_banners').insert(payload).select('id').single()
        error = result.error; break
      }
      case 'approve': {
        if (text('verified') !== 'on') return { message:'Confirm that you verified the receipt, amount and currency.' }
        const result = await db.rpc('approve_manual_payment',{ p_payment_id:id(), p_admin_notes:reason() }); error=result.error; break
      }
      case 'reject': { const result = await db.rpc('reject_manual_payment',{ p_payment_id:id(), p_admin_notes:reason() }); error=result.error; break }
      case 'codes': {
        const expiry = z.iso.datetime({ offset:true }).parse(text('expires_at'))
        if (Date.parse(expiry) <= Date.now()) return { message:'Code expiry must be in the future.' }
        const result = await db.rpc('admin_create_redeem_codes',{ p_course_id:uuid.parse(text('course_id')), p_count:z.coerce.number().int().min(1).max(100).parse(text('count')), p_max_uses:z.coerce.number().int().min(1).max(10000).parse(text('max_uses')), p_expires_at:expiry })
        if (result.error) { error=result.error; break }
        revalidatePath('/admin/redeem-codes')
        return { ok:true, message:'Codes generated. Store them securely; plaintext is shown only now.', codes:result.data.map(c => c.code) }
      }
      case 'disable-code': { const result = await db.from('redeem_codes').update({ is_active:false }).eq('id',id()).select('id').single(); error=result.error; break }
      case 'grant': {
        const expiry = z.iso.datetime({ offset:true }).parse(text('expires_at'))
        if (Date.parse(expiry) <= Date.now()) return { message:'Enrollment expiry must be in the future.' }
        const result = await db.rpc('admin_grant_enrollment',{ p_user_id:uuid.parse(text('user_id')), p_course_id:uuid.parse(text('course_id')), p_expires_at:expiry, p_reason:reason() }); error=result.error; break
      }
      case 'revoke': { const result=await db.rpc('admin_revoke_enrollment',{ p_enrollment_id:id(),p_reason:reason() }); error=result.error; break }
      case 'remove-device': { const result=await db.rpc('admin_remove_device',{ p_device_id:id(),p_reason:reason() }); error=result.error; break }
      default: return { message:'Unknown operation.' }
    }
  } catch (e) {
    if (e instanceof z.ZodError) return { message:e.issues.map(i => `${i.path.join('.') || 'Form'}: ${i.message}`).join('; ') }
    return { message:'The change could not be saved. Please try again.' }
  }
  if (error) return { message:'The database rejected this change. Check required terms, permissions and whether this record was already reviewed.' }
  revalidatePath('/admin','layout'); revalidatePath('/'); revalidatePath('/courses','layout'); revalidatePath('/my-courses')
  return { ok:true, message:'Change saved.' }
}
