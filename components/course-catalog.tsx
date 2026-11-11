'use client'

import { CourseGrid } from '@/components/course-card'
import { CourseSearch, CourseFilters } from '@/components/course-controls'
import { useMemo, useState } from 'react'
import { filterCourses, type CatalogCourse } from '@/lib/catalog'

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


  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CourseSearch value={query} onChange={setQuery} />
        <CourseFilters categories={categories} value={category} onChange={setCategory} />
      </div>

      {courses.length === 0 && <p className="text-muted">Courses will be listed here once they are published.</p>}
      <CourseGrid courses={visible} allCourses={courses} />
      <p className="mt-4 text-xs text-muted" role="status">
        {courses.length > 0 && visible.length === 0 ? 'No matching courses. Try a different search.' : ''}
      </p>
    </div>
  )
}
