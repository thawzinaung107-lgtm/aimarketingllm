/** Paths that require a signed-in user (optimistic proxy check only). */
const PROTECTED_PREFIXES = ['/my-courses', '/profile', '/admin', '/learn', '/checkout', '/payments', '/redeem'] as const

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Validate a post-login redirect target. Only same-origin relative paths are
 * allowed, preventing open redirects such as `//evil.com` or `/\evil.com`.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/my-courses'): string {
  if (!next || typeof next !== 'string') return fallback
  if (next.length > 512) return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f\\]/.test(next)) return fallback
  try {
    const url = new URL(next, 'http://localhost')
    if (url.origin !== 'http://localhost') return fallback
    return url.pathname + url.search
  } catch {
    return fallback
  }
}
