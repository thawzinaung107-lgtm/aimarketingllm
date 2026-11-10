import { PromotionalCarousel } from '@/components/promotional-carousel'
import { CourseGrid } from '@/components/course-card'
import { LoginButton } from '@/components/auth-buttons'
import { getCurrentUser } from '@/lib/auth'
import { getPublishedCourses, getActiveHomepageBanners } from '@/lib/db-helpers'
import Link from 'next/link'

export default async function Home() {
  const user = await getCurrentUser()
  const [banners, courses] = await Promise.all([
    getActiveHomepageBanners(),
    getPublishedCourses(),
  ])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AI Marketing LMS</h1>
            </div>
            <nav className="flex items-center gap-6">
              {user ? (
                <>
                  <Link
                    href="/my-courses"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    My Courses
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {user.full_name || user.email}
                  </Link>
                </>
              ) : (
                <LoginButton />
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Promotional Carousel */}
        {banners.length > 0 && (
          <div className="mb-12">
            <PromotionalCarousel banners={banners} />
          </div>
        )}

        {/* Courses Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Explore Courses
            </h2>
            <p className="text-lg text-gray-600">
              Learn new skills and advance your career with our expert-led courses
            </p>
          </div>

          <CourseGrid courses={courses} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-600">
            © 2024 AI Marketing LMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
