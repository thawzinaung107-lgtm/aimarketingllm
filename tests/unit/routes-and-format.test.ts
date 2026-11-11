import { describe, expect, it } from 'vitest'
import { isProtectedPath, safeNextPath } from '@/lib/routes'
import { formatPrice, isExpired } from '@/lib/format'

describe('safeNextPath (open-redirect protection)', () => {
  it.each([
    ['/my-courses', '/my-courses'],
    ['/courses/abc?x=1', '/courses/abc?x=1'],
  ])('allows same-origin path %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '',
    null,
    '/foo\nbar',
    '/' + 'a'.repeat(600),
  ])('rejects %s', (input) => {
    expect(safeNextPath(input as string | null)).toBe('/my-courses')
  })
})

describe('isProtectedPath', () => {
  it('protects student and admin areas', () => {
    for (const p of ['/my-courses', '/profile', '/admin', '/admin/payments', '/learn/x']) {
      expect(isProtectedPath(p)).toBe(true)
    }
  })
  it('does not protect public pages or look-alike prefixes', () => {
    for (const p of ['/', '/login', '/courses/x', '/administrator', '/profiles']) {
      expect(isProtectedPath(p)).toBe(false)
    }
  })
})

describe('formatPrice (no invented currency)', () => {
  it('returns null when price or currency is not configured', () => {
    expect(formatPrice(null, 'MMK')).toBeNull()
    expect(formatPrice(1000, null)).toBeNull()
    expect(formatPrice(1000, 'usd')).toBeNull()
  })
  it('uses the configured ISO currency code, never a hardcoded symbol', () => {
    const out = formatPrice(150000, 'MMK')!
    expect(out).toContain('MMK')
    expect(out).not.toContain('$')
  })
})

describe('isExpired', () => {
  const now = new Date('2026-01-01T00:00:00Z')
  it('treats missing expiry as expired (fail closed)', () => {
    expect(isExpired(null, now)).toBe(true)
  })
  it('compares against now', () => {
    expect(isExpired('2025-12-31T23:59:59Z', now)).toBe(true)
    expect(isExpired('2026-01-01T00:00:00Z', now)).toBe(true)
    expect(isExpired('2026-01-01T00:00:01Z', now)).toBe(false)
  })
})
