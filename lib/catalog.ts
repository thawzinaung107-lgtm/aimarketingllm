export interface CatalogCourse {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  price: number | null
  currency: string | null
  category: string | null
}

/** Case-insensitive search over title, description and category, plus an exact category filter. */
export function filterCourses<T extends CatalogCourse>(courses: T[], query: string, category: string | null): T[] {
  const q = query.trim().toLowerCase()
  return courses.filter((c) => {
    if (category && c.category !== category) return false
    if (!q) return true
    return [c.title, c.description, c.category].some((v) => v?.toLowerCase().includes(q))
  })
}
