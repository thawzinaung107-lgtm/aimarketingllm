import { PromotionalCarousel } from '@/components/promotional-carousel'
import { CourseGrid } from '@/components/course-card'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { getCurrentUser } from '@/lib/auth'
import { getPublishedCourses, getActiveHomepageBanners } from '@/lib/db-helpers'

/**
 * NOTE: This homepage is a placeholder layout. It has NOT been built from the
 * Figma Option 2 V3 design (Figma MCP access is pending). Do not treat it as
 * matching the design.
 */
export default async function Home() {
  const [user, banners, courses] = await Promise.all([
    getCurrentUser(),
    getActiveHomepageBanners(),
    getPublishedCourses(),
  ])

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {banners.length > 0 && (
          <div className="mb-12">
            <PromotionalCarousel banners={banners} />
          </div>
        )}
        <section>
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Courses</h2>
          <CourseGrid courses={courses} />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
