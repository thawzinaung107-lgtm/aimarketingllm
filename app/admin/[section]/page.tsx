import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminForm, Field, CourseEditor, LessonEditor, BannerEditor, PaymentReview } from '@/components/admin-forms'
import { EmptyState } from '@/components/states'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import { formatPrice } from '@/lib/format'
const sections: Record<string,string> = { courses:'Courses', lessons:'Lessons', payments:'Payments', 'redeem-codes':'Redeem codes', students:'Students', enrollments:'Student access', devices:'Devices', banners:'Homepage CMS', 'audit-logs':'Audit history' }
export default async function AdminSection({ params, searchParams }: PageProps<'/admin/[section]'>) {
  await requireAdminPage()
  const { section } = await params
  if (!sections[section]) notFound()
  const query = await searchParams
  const page = Math.min(10000,Math.max(1,Number(query.page) || 1)) | 0
  const start = (page-1)*25
  const db = await createClient()
  let content: React.ReactNode
  let count = 0
  if (section === 'courses') {
    const { data, error } = await db.from('courses').select('*').order('created_at',{ ascending:false }).range(start,start+24)
    if (error) throw error
    count=data.length
    content=<><details className="panel"><summary className="cursor-pointer font-bold">Create a course</summary><div className="mt-5"><CourseEditor /></div></details>{data.map(c => <details key={c.id} className="panel"><summary className="cursor-pointer font-semibold">{c.title} · {c.is_published ? 'Published' : 'Draft'}</summary><p className="my-4 break-all text-xs text-muted">ID: {c.id}</p><CourseEditor course={c} /></details>)}</>
  } else if (section === 'lessons') {
    const { data,error } = await db.from('lessons').select('*').order('created_at',{ ascending:false }).range(start,start+24)
    if (error) throw error
    count=data.length
    content=<><details className="panel"><summary className="cursor-pointer font-bold">Create a lesson</summary><div className="mt-5"><LessonEditor /></div></details>{data.map(l => <details key={l.id} className="panel"><summary className="cursor-pointer font-semibold">{l.title} · {l.is_published ? 'Published' : 'Draft'}</summary><div className="my-5"><LessonEditor lesson={l} /></div><h2 className="mb-4 font-bold">Private streaming source</h2><p className="mb-4 text-muted">Upload through your approved provider tooling. Use a private object key, never a permanent video URL.</p><AdminForm operation="media" id={l.id}><Field name="storage_path" label="Private object key" required /></AdminForm></details>)}</>
  } else if (section === 'banners') {
    const { data,error } = await db.from('homepage_banners').select('*').order('display_order').range(start,start+24)
    if (error) throw error
    count=data.length
    content=<><details className="panel"><summary className="cursor-pointer font-bold">Create a banner</summary><div className="mt-5"><BannerEditor /></div></details>{data.map(b => <details className="panel" key={b.id}><summary className="cursor-pointer font-semibold">{b.title} · {b.is_active ? 'Active' : 'Hidden'}</summary><div className="mt-5"><BannerEditor banner={b} /></div></details>)}</>
  } else if (section === 'payments') {
    const { data,error } = await db.from('manual_payments').select('id,user_id,amount,currency,expected_amount,status,payment_reference,submitted_at,payment_proof_url,courses(title)').order('submitted_at',{ ascending:false }).range(start,start+24)
    if (error) throw error
    count=data.length
    content=data.map(p => <article className="panel" key={p.id}><h2 className="text-lg font-bold">{p.courses?.title ?? 'Course'} · {p.status}</h2><dl className="my-4 grid gap-2 text-sm"><div><dt className="text-muted">Student ID</dt><dd className="break-all">{p.user_id}</dd></div><div><dt className="text-muted">Submitted / expected amount</dt><dd>{formatPrice(p.amount,p.currency)} / {formatPrice(p.expected_amount,p.currency)}</dd></div><div><dt className="text-muted">Reference</dt><dd>{p.payment_reference || 'Not provided'}</dd></div></dl>{p.payment_proof_url && <a href={`/api/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="btn btn-alt mb-5">View private receipt</a>}{p.status === 'pending' && <PaymentReview id={p.id} />}</article>)
  } else if (section === 'redeem-codes') {
    const { data,error } = await db.from('redeem_codes').select('id,code_hint,course_id,max_uses,current_uses,is_active,expires_at').order('created_at',{ ascending:false }).range(start,start+24)
    if (error) throw error
    count=data.length
    content=<><section className="panel"><h2 className="mb-5 text-lg font-bold">Generate codes</h2><AdminForm operation="codes" submit="Generate codes"><Field name="course_id" label="Course ID" required /><Field name="count" label="Number of codes (1–100)" type="number" required /><Field name="max_uses" label="Maximum uses per code" type="number" required /><Field name="expires_at" label="Expiry (ISO timestamp with timezone, e.g. YYYY-MM-DDT00:00:00Z)" required /></AdminForm></section>{data.map(c => <article className="panel" key={c.id}><p className="mb-4">Code ending {c.code_hint} · {c.current_uses}/{c.max_uses} uses · {c.is_active ? 'Active' : 'Disabled'}</p><p className="mb-4 break-all text-xs text-muted">Course {c.course_id} · Expires {c.expires_at ?? 'No configured code expiry'}</p>{c.is_active && <AdminForm operation="disable-code" id={c.id} submit="Disable code" />}</article>)}</>
  } else if (section === 'enrollments') {
    const { data,error } = await db.from('enrollments').select('id,user_id,course_id,status,expires_at,courses(title)').order('created_at',{ ascending:false }).range(start,start+24)
    if (error) throw error
    count=data.length
    content=<><section className="panel"><h2 className="mb-5 text-lg font-bold">Grant or update access</h2><p className="mb-4 text-muted">Administrative exception only. An explicit reason and expiry are required and audited.</p><AdminForm operation="grant" submit="Grant access"><Field name="user_id" label="Student ID" required /><Field name="course_id" label="Course ID" required /><Field name="expires_at" label="Access expiry (ISO timestamp with timezone)" required /><Field name="reason" label="Reason for access change" required /></AdminForm></section>{data.map(e => <article className="panel" key={e.id}><h2 className="font-bold">{e.courses?.title} · {e.status}</h2><p className="my-3 break-all text-xs text-muted">Student {e.user_id} · Expires {e.expires_at ?? 'Not activated'}</p>{e.status === 'active' && <AdminForm operation="revoke" id={e.id} submit="Revoke course access"><Field name="reason" label="Reason for revocation" required /></AdminForm>}</article>)}</>
  } else if (section === 'devices') {
    const { data,error } = await db.from('registered_devices').select('id,user_id,device_name,last_used_at').order('last_used_at',{ ascending:false }).range(start,start+24)
    if (error) throw error
    count=data.length
    content=data.map(d => <article className="panel" key={d.id}><h2 className="font-bold">{d.device_name ?? 'Device'}</h2><p className="my-4 break-all text-xs text-muted">Student {d.user_id} · Last used {d.last_used_at}</p><AdminForm operation="remove-device" id={d.id} submit="Revoke device and its sessions"><Field name="reason" label="Reason for revocation" required /></AdminForm></article>)
  } else if (section === 'students') {
    const term = typeof query.q === 'string' ? query.q.slice(0,100).replace(/[%_]/g,'') : ''
    let request = db.from('profiles').select('id,full_name,email,created_at').eq('role','student').order('created_at',{ ascending:false }).range(start,start+24)
    if (term) request=request.ilike('email',`%${term}%`)
    const { data,error } = await request
    if (error) throw error
    count=data.length
    content=<><form className="panel" method="get"><label className="font-semibold">Search student email<input type="search" className="field" name="q" defaultValue={term} /></label><button className="btn">Search</button></form><div className="panel overflow-x-auto"><table className="data-table"><caption className="sr-only">Students</caption><thead><tr><th>Name / email</th><th>Student ID</th></tr></thead><tbody>{data.map(s => <tr key={s.id}><td>{s.full_name || 'Student'}<br />{s.email}</td><td>{s.id}</td></tr>)}</tbody></table></div></>
  } else {
    const { data,error } = await db.from('admin_audit_logs').select('id,admin_id,action,entity_type,entity_id,created_at').order('created_at',{ ascending:false }).range(start,start+24)
    if (error) throw error
    count=data.length
    content=<div className="panel overflow-x-auto"><table className="data-table"><caption className="sr-only">Immutable administrative audit history</caption><thead><tr><th>When</th><th>Action</th><th>Entity</th><th>Administrator</th></tr></thead><tbody>{data.map(a => <tr key={a.id}><td>{new Date(a.created_at).toISOString()}</td><td>{a.action}</td><td>{a.entity_type}<br />{a.entity_id}</td><td>{a.admin_id ?? 'System'}</td></tr>)}</tbody></table></div>
  }
  const pageHref = (n:number) => `/admin/${section}?${new URLSearchParams({ page:String(n), ...(typeof query.q === 'string' ? { q:query.q } : {}) })}`
  return <><span className="eyebrow">Academy management</span><h1 className="page-title">{sections[section]}</h1>{!sensitiveFeaturesEnabled() && <p className="mb-5 rounded-lg border border-line bg-soft p-3 text-muted">Read-only until database security verification is complete.</p>}<div className="space-y-5">{content}{count === 0 && <EmptyState title="No records found" />}</div><nav className="mt-6 flex flex-wrap items-center gap-4" aria-label="Pagination">{page > 1 && <Link href={pageHref(page-1)} className="btn btn-alt">Previous</Link>}<span>Page {page}</span>{count === 25 && <Link href={pageHref(page+1)} className="btn btn-alt">Next</Link>}</nav></>
}
