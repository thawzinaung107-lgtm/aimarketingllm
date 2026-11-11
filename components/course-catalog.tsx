'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { filterCourses, type CatalogCourse } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'

/**
 * Option 2 V3 course area: search field + category chips + two-column cards.
 * Filtering is client-side over published courses only (RLS already limits
 * what is fetched).
 */
export function CourseCatalog({ courses }: { courses: CatalogCourse[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const categories = useMemo(
    () => [...new Set(courses.map((c) => c.category).filter((c): c is string => Boolean(c)))],
    [courses],
  )
  const visible = useMemo(() => filterCourses(courses, query, category), [courses, query, category])

  if (courses.length === 0) {
    return <p className="text-muted">Courses will be listed here once they are published.</p>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          aria-label="Search courses"
          placeholder="Search courses by name or topic"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[260px] flex-1 rounded-[10px] border border-[#dcdfe3] px-3.5 py-3 max-[480px]:w-full max-[480px]:max-w-none min-[481px]:max-w-[440px]"
        />
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-3" role="group" aria-label="Filter by category">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              All courses
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 min-[801px]:grid-cols-2">
        {visible.map((course) => (
          <CourseCard key={course.id} course={course} number={courses.indexOf(course) + 1} />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted" role="status">
        {visible.length === 0 ? 'No matching courses. Try a different search.' : ''}
      </p>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[9px] border px-3.5 py-2.5 text-xs ${
        active ? 'border-ink bg-ink text-white' : 'border-[#dddfe2] bg-white text-[#45484d]'
      }`}
    >
      {children}
    </button>
  )
}

function CourseCard({ course, number }: { course: CatalogCourse; number: number }) {
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
        <p className="min-h-[50px] text-muted">{course.description}</p>
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
