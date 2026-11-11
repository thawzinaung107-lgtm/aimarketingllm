import { describe, expect, it } from 'vitest'
import { filterCourses, type CatalogCourse } from '@/lib/catalog'

const c = (title: string, category: string | null, description = ''): CatalogCourse => ({
  id: title, title, slug: title, description, thumbnail_url: null, price: null, currency: null, category,
})
const courses = [
  c('AI Marketing Strategy', 'AI Marketing', 'Campaign planning and audience research'),
  c('AI Content Creation', 'AI Content', 'Create marketing assets'),
  c('Uncategorised', null),
]

describe('filterCourses', () => {
  it('returns everything with no query or category', () => {
    expect(filterCourses(courses, '', null)).toHaveLength(3)
  })
  it('matches title, description and category case-insensitively', () => {
    expect(filterCourses(courses, 'STRATEGY', null).map((x) => x.title)).toEqual(['AI Marketing Strategy'])
    expect(filterCourses(courses, 'audience', null).map((x) => x.title)).toEqual(['AI Marketing Strategy'])
    expect(filterCourses(courses, 'ai content', null).map((x) => x.title)).toEqual(['AI Content Creation'])
  })
  it('filters by exact category and combines with query', () => {
    expect(filterCourses(courses, '', 'AI Content').map((x) => x.title)).toEqual(['AI Content Creation'])
    expect(filterCourses(courses, 'strategy', 'AI Content')).toEqual([])
  })
  it('ignores surrounding whitespace', () => {
    expect(filterCourses(courses, '  creation  ', null)).toHaveLength(1)
  })
})
