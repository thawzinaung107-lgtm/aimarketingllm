import { CourseCatalog } from '@/components/course-catalog'
import { SiteFooter, SiteHeader } from '@/components/site-chrome'
import { getCurrentUser } from '@/lib/auth'
import { getPublishedCourses } from '@/lib/db-helpers'

export const metadata = { title: 'All courses · AI Marketing Academy' }

export default async function CoursesPage() {
  const [user, courses] = await Promise.all([getCurrentUser(), getPublishedCourses()])
  return (
    <>
      <SiteHeader user={user} />
      <main className="wrap min-h-[70vh] pt-[35px] pb-[72px]">
        <nav aria-label="Breadcrumb" className="mb-5 text-xs text-[#8b8f95]">Home / All courses</nav>
        <span className="eyebrow">Course catalog</span>
        <h1 className="mt-2 text-[clamp(31px,4vw,49px)] leading-[1.13] font-bold tracking-[-1.8px]">Explore all courses</h1>
        <p className="mb-6 text-muted">Find practical learning that matches your goals.</p>
        <CourseCatalog courses={courses} />
      </main>
      <SiteFooter />
    </>
  )
}
