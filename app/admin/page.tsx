import Link from 'next/link'
import { requireAdminPage } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
export default async function AdminPage() {
  await requireAdminPage()
  const db = await createClient()
  const results = await Promise.all([
    db.from('profiles').select('id',{ count:'exact', head:true }).eq('role','student'),
    db.from('enrollments').select('id',{ count:'exact', head:true }).eq('status','active').gt('expires_at',new Date().toISOString()),
    db.from('manual_payments').select('id',{ count:'exact', head:true }).eq('status','pending'),
  ])
  for (const r of results) if (r.error) throw r.error
  return <><span className="eyebrow">Academy management</span><h1 className="page-title">Admin overview</h1><DashboardStats stats={[{ label:'Students', value:results[0].count ?? 0 },{ label:'Active enrollments',value:results[1].count ?? 0 },{ label:'Payments pending',value:results[2].count ?? 0 }]} /><div className="panel mt-5"><h2 className="mb-3 text-lg font-bold">Academy operations</h2><p className="mb-4 text-muted">Review payment receipts before approving access. Configure course terms before publishing.</p>{!sensitiveFeaturesEnabled() && <p className="mb-4 text-muted">New administrative changes are disabled pending database security verification. Read-only views remain available.</p>}<div className="flex flex-wrap gap-3"><Link className="btn" href="/admin/payments">Review payments</Link><Link className="btn btn-alt" href="/admin/courses">Manage courses</Link><Link className="btn btn-alt" href="/admin/audit-logs">Audit history</Link></div></div></>
}
