import Image from 'next/image'
import Link from 'next/link'
import type { CatalogCourse } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'

export function CourseCard({ course, number }: { course: CatalogCourse; number: number }) {
  const price = formatPrice(course.price, course.currency)
  return (
    <article className="overflow-hidden rounded-[15px] border border-line bg-white">
      <div className="relative flex h-[170px] items-center justify-center overflow-hidden bg-[#e9ebed]">
        {course.thumbnail_url && (
          <Image
            src={course.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 800px) 100vw, 600px"
            className="object-cover saturate-[.72]"
          />
        )}
        <span className="absolute top-3.5 left-3.5 rounded-[7px] bg-white px-2.5 py-[5px] text-[10px] font-bold tracking-[.7px]">
          COURSE {String(number).padStart(2, '0')}
        </span>
      </div>
      <div className="p-6">
        {course.category && (
          <span className="text-[11px] font-semibold tracking-[.5px] text-[#6d7278] uppercase">{course.category}</span>
        )}
        <h3 className="my-2 text-lg font-bold tracking-[-.4px]">{course.title}</h3>
        <p className="min-h-[50px] break-words text-muted">{course.description}</p>
        <div className="mt-[18px] flex items-center justify-between gap-2.5 max-[480px]:flex-wrap max-[480px]:items-start">
          <span className="rounded-md bg-soft-2 px-[9px] py-1.5 text-[11px] text-[#53585e]">
            {price ?? 'Price to be confirmed'}
          </span>
          <Link href={`/courses/${course.slug}`} className="btn">
            View course →
          </Link>
        </div>
      </div>
    </article>
  )
}

export function CourseGrid({ courses, allCourses = courses }: { courses: CatalogCourse[]; allCourses?: CatalogCourse[] }) {
  return <div className="grid grid-cols-1 gap-5 min-[801px]:grid-cols-2">{courses.map(course => <CourseCard key={course.id} course={course} number={allCourses.indexOf(course) + 1} />)}</div>
}
