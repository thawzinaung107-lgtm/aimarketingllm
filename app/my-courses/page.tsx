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
    <>
      <SiteHeader user={user} />
      <main className="wrap min-h-[70vh] pt-[35px] pb-[72px]">
        <span className="eyebrow">Student area</span>
        <h1 className="mt-2 text-[clamp(31px,4vw,49px)] leading-[1.13] font-bold tracking-[-1.8px]">My learning</h1>
        <p className="mb-8 text-muted">Pick up where you left off and view your enrolled courses.</p>

        {enrollments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-6 text-muted">You don&apos;t have any courses yet.</p>
            <Link href="/" className="btn">
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 min-[801px]:grid-cols-2">
            {enrollments.map((enrollment) => {
              const course = enrollment.courses
              if (!course) return null
              const expired = enrollment.status !== 'active' || isExpired(enrollment.expires_at)
              return (
                <article key={enrollment.id} className="overflow-hidden rounded-[15px] border border-line">
                  <div className="relative aspect-video bg-[#e9ebed]">
                    {course.thumbnail_url && (
                      <Image src={course.thumbnail_url} alt="" fill sizes="(max-width: 800px) 100vw, 400px" className="object-cover saturate-[.72]" />
                    )}
                    {expired && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="font-semibold text-white">Access expired</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="mb-2 text-lg font-semibold">{course.title}</h2>
                    {enrollment.expires_at && (
                      <p className={`text-sm ${expired ? 'text-red-700' : 'text-muted'}`}>
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
    </>
  )
}
