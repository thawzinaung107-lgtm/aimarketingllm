import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { signPrivateObject } from '@/lib/private-storage'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import { privateJson } from '@/lib/http-security'
import { uuid } from '@/lib/validation'
export async function GET(_request: Request, { params }: RouteContext<'/api/payments/[paymentId]/receipt'>) {
  const user = await getCurrentUser()
  if (!user) return privateJson({ error: 'Authentication required' },401)
  const { paymentId } = await params
  if (!uuid.safeParse(paymentId).success) return privateJson({ error: 'Invalid payment' },400)
  if (!sensitiveFeaturesEnabled()) return privateJson({ error: 'Receipt viewing is not enabled.' },503)
  const db = await createClient()
  const { data: payment } = await db.from('manual_payments').select('user_id,payment_proof_url').eq('id',paymentId).maybeSingle()
  if (!payment || (payment.user_id !== user.id && user.role !== 'admin') || !payment.payment_proof_url?.startsWith(`${payment.user_id}/`)) return privateJson({ error: 'Receipt unavailable' },404)
  try {
    const url = await signPrivateObject('payment-receipts',payment.payment_proof_url,60)
    return new Response(null, { status: 303, headers: { Location: url, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } })
  } catch { return privateJson({ error: 'Receipt storage unavailable' },503) }
}
