import { redirect } from 'next/navigation'
import Link from 'next/link'
import { learningData } from '@/lib/learning'
import { StudentShell } from '@/components/student-shell'
import { EmptyState } from '@/components/states'
export default async function LearnPage({ params }: PageProps<'/learn/[courseId]'>) {
  const { courseId } = await params
  const data = await learningData(courseId)
  if (data.allowed) {
    const last = data.progress.find(p => data.lessons.some(l => l.id === p.lesson_id))
    const id = last?.lesson_id ?? data.lessons[0]?.id
    if (id) redirect(`/learn/${courseId}/${id}`)
  }
  return <StudentShell title={data.course.title} path={`/learn/${courseId}`}><EmptyState title={data.allowed ? 'Lessons are being prepared' : data.enrollment ? 'Access expired or inactive' : 'Course access required'}><p className="mb-4">{data.allowed ? 'Published lessons will appear here.' : 'You need an active, unexpired enrollment to watch this course.'}</p><Link className="btn" href="/my-courses">My learning</Link></EmptyState></StudentShell>
}
