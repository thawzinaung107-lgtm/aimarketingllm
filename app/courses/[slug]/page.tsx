import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { CourseDetail } from '@/components/course-detail'
export default async function CoursePage({ params }: PageProps<'/courses/[slug]'>) {
  const { slug } = await params
  const db = await createClient()
  const { data: course, error } = await db.from('courses').select('*').eq('slug', slug).eq('is_published', true).maybeSingle()
  if (error) throw error
  if (!course) notFound()
  const { data: lessons, error: lessonError } = await db.from('lessons').select('id,title,duration_seconds').eq('course_id', course.id).eq('is_published', true).order('display_order')
  if (lessonError) throw lessonError
  return <><SiteHeader user={await getCurrentUser()} /><main className="wrap py-[35px] pb-[72px]"><CourseDetail course={course} lessons={lessons ?? []} /></main><SiteFooter /></>
}
