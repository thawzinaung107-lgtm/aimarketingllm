import Image from 'next/image'
import Link from 'next/link'
import { StudentShell } from '@/components/student-shell'
import { DashboardStats } from '@/components/dashboard'
import { EmptyState } from '@/components/states'
import { requireUser } from '@/lib/auth'
import { getMyEnrollments } from '@/lib/db-helpers'
import { createClient } from '@/lib/supabase/server'
import { isExpired } from '@/lib/format'
export default async function MyCoursesPage() {
  const user = await requireUser('/my-courses')
  const enrollments = await getMyEnrollments(user.id)
  const db = await createClient()
  const { data: progress, error } = await db.from('lesson_progress').select('lesson_id,enrollment_id,is_completed').eq('user_id',user.id)
  if (error) throw error
  const active = enrollments.filter(e => e.status === 'active' && !isExpired(e.expires_at))
  const relevantProgress = (progress ?? []).filter(p => active.some(e => e.id === p.enrollment_id))
  return <StudentShell title="My learning" path="/my-courses"><p className="mb-6 text-muted">Pick up where you left off and view your enrolled courses.</p><DashboardStats stats={[{ label: 'Active courses', value: active.length },{ label: 'Completed lessons', value: relevantProgress.filter(p => p.is_completed).length },{ label: 'Lessons started', value: relevantProgress.length }]} /><div className="mt-7">{enrollments.length === 0 ? <EmptyState title="You don't have any courses yet"><Link className="btn mt-3" href="/courses">Browse courses</Link></EmptyState> : <div className="grid gap-5 min-[1000px]:grid-cols-2">{enrollments.map(e => {
    const course = e.courses
    if (!course) return null
    const expired = e.status !== 'active' || isExpired(e.expires_at)
    return <article key={e.id} className="panel">{course.thumbnail_url && <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-soft"><Image src={course.thumbnail_url} alt="" fill sizes="(max-width: 800px) 100vw, 500px" className="object-cover saturate-[.72]" /></div>}<h2 className="mb-3 text-lg font-semibold">{course.title}</h2><p className="mb-3 text-muted">{expired ? 'Access expired' : 'Access until'} {e.expires_at ? new Date(e.expires_at).toLocaleDateString('en',{ dateStyle:'medium' }) : '—'}</p><p className="mb-4 text-muted">{(progress ?? []).filter(p => p.enrollment_id === e.id && p.is_completed).length} lessons completed</p><Link href={expired ? `/courses/${course.slug}` : `/learn/${course.id}`} className="btn">{expired ? 'View course' : 'Resume watching →'}</Link></article>
  })}</div>}</div></StudentShell>
}
