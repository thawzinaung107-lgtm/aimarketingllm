import { notFound } from 'next/navigation'
import Link from 'next/link'
import { learningData } from '@/lib/learning'
import { StudentShell } from '@/components/student-shell'
import { ErrorState } from '@/components/states'
import { LessonPlayer } from '@/components/lesson-player'
import { LessonNavigation } from '@/components/lesson-navigation'
export default async function LessonPage({ params }: PageProps<'/learn/[courseId]/[lessonId]'>) {
  const { courseId, lessonId } = await params
  const data = await learningData(courseId)
  const lesson = data.lessons.find(l => l.id === lessonId)
  if (!lesson) notFound()
  const progress = data.progress.find(p => p.lesson_id === lessonId)
  const next = data.lessons[data.lessons.indexOf(lesson)+1]
  return <StudentShell title={data.course.title} path={`/learn/${courseId}/${lessonId}`}>
    {!data.allowed ? <ErrorState message={data.enrollment ? 'Access expired or inactive. Contact the academy about your enrollment.' : 'Unauthorized access. An active enrollment is required.'} /> : <div className="two-col"><div><LessonPlayer key={lessonId} lessonId={lessonId} initialPosition={progress?.watched_seconds} completed={progress?.is_completed} /><section className="panel mt-[18px]"><h2 className="text-lg font-bold">{lesson.title}</h2><p className="my-4 whitespace-pre-line text-muted">{lesson.description}</p>{next && <Link className="btn" href={`/learn/${courseId}/${next.id}`}>Next lesson →</Link>}</section></div><LessonNavigation courseId={courseId} current={lessonId} lessons={data.lessons} completed={data.progress.filter(p => p.is_completed).map(p => p.lesson_id)} /></div>}
  </StudentShell>
}
