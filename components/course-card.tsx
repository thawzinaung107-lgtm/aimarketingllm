import Image from 'next/image'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  price: number | null
}

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-video bg-gray-100">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
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
        {course.price !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">
              ${course.price.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
              View Course →
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

interface CourseGridProps {
  courses: Course[]
}

export function CourseGrid({ courses }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No courses available at this time.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
