import { StudentShell } from '@/components/student-shell'
import { EmptyState } from '@/components/states'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/format'
export default async function PaymentsPage() {
  const user = await requireUser('/payments')
  const db = await createClient()
  const { data, error } = await db.from('manual_payments').select('id,amount,currency,status,submitted_at,admin_notes,courses(title)').eq('user_id', user.id).order('submitted_at', { ascending: false })
  if (error) throw error
  return <StudentShell title="Payment review" path="/payments">{data?.length ? <div className="space-y-4">{data.map(p => <article key={p.id} className="panel"><h2 className="text-lg font-semibold">{p.courses?.title ?? 'Course'}</h2><p className="mt-2">{formatPrice(p.amount,p.currency)} · <strong className="capitalize">{p.status}</strong></p><p className="text-muted">Submitted {new Date(p.submitted_at).toLocaleDateString('en')}</p>{p.status === 'pending' && <p className="mt-3 text-muted">Awaiting verification. Access has not been granted by this submission.</p>}{p.admin_notes && <p className="mt-3 whitespace-pre-line">Review note: {p.admin_notes}</p>}</article>)}</div> : <EmptyState title="No payment submissions">Your payment status will appear here after you submit a receipt.</EmptyState>}</StudentShell>
}
