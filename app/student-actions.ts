'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import type { ActionState } from '@/lib/validation'
export async function redeemAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await assertUser()
  if (!sensitiveFeaturesEnabled()) return { message: 'Code activation is awaiting security verification.' }
  const code = z.string().trim().min(4).max(80).safeParse(form.get('code'))
  if (!code.success) return { message: 'Enter a valid course code.' }
  const db = await createClient()
  const { error } = await db.rpc('redeem_code', { p_code: code.data })
  if (error) return { message: 'This code is invalid, expired, already used, or the course is unavailable.' }
  revalidatePath('/my-courses')
  return { ok: true, message: 'Your course access is active. Open My learning to continue.' }
}
export async function profileAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const user = await assertUser()
  const name = z.string().trim().min(1).max(200).safeParse(form.get('full_name'))
  if (!name.success) return { message: 'Enter a name between 1 and 200 characters.' }
  const db = await createClient()
  const { error } = await db.from('profiles').update({ full_name: name.data }).eq('id', user.id)
  if (error) return { message: 'We could not update your profile. Please try again.' }
  revalidatePath('/profile')
  return { ok: true, message: 'Profile updated.' }
}
