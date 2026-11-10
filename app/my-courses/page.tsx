import { requireAuth } from '@/lib/auth'
import { getUserEnrollments } from '@/lib/db-helpers'
import Link from 'next/link'
import Image from 'next/image'

export default async function MyCoursesPage() {
  const user = await requireAuth()

  const enrollments = await getUserEnrollments(user.id)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                AI Marketing LMS
              </Link>
              <nav className="flex items-center gap-6">
                <Link
                  href="/my-courses"
                  className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 pb-1"
                >
                  My Courses
                </Link>
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Browse Courses
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-lg text-gray-600">
            Continue learning from where you left off
          </p>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">
              You haven&apos;t enrolled in any courses yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.courses
              if (!course) return null

              const isExpired =
                enrollment.expires_at &&
                new Date(enrollment.expires_at) < new Date()

              return (
                <Link
                  key={enrollment.id}
                  href={`/courses/${course.slug}/learn`}
                  className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-video bg-gray-100">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {isExpired && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          Access Expired
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {!isExpired ? (
                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                          Continue Learning →
                        </span>
                      ) : (
                        <span className="text-sm text-red-600">
                          Expired on{' '}
                          {new Date(enrollment.expires_at!).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
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
