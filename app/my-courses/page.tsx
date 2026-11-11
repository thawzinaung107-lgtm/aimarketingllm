import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { requireUser } from '@/lib/auth'
import { getMyEnrollments } from '@/lib/db-helpers'
import { isExpired } from '@/lib/format'

export default async function MyCoursesPage() {
  const user = await requireUser('/my-courses')
  const enrollments = await getMyEnrollments(user.id)

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">My Courses</h1>

        {enrollments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-6 text-gray-600">You don&apos;t have any courses yet.</p>
            <Link href="/" className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800">
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const course = enrollment.courses
              if (!course) return null
              const expired = enrollment.status !== 'active' || isExpired(enrollment.expires_at)
              return (
                <article key={enrollment.id} className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="relative aspect-video bg-gray-100">
                    {course.thumbnail_url && (
                      <Image src={course.thumbnail_url} alt="" fill className="object-cover" />
                    )}
                    {expired && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="font-semibold text-white">Access expired</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="mb-2 text-lg font-semibold text-gray-900">{course.title}</h2>
                    {enrollment.expires_at && (
                      <p className={`text-sm ${expired ? 'text-red-700' : 'text-gray-600'}`}>
                        {expired ? 'Expired' : 'Access until'}{' '}
                        {new Date(enrollment.expires_at).toLocaleDateString('en', { dateStyle: 'medium' })}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
