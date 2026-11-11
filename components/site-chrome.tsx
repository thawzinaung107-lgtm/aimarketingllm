import Link from 'next/link'
import type { CurrentUser } from '@/lib/auth'

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-gray-900">
          AI Marketing LMS
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-gray-700">
          {user ? (
            <>
              <Link href="/my-courses" className="hover:text-gray-900">My Courses</Link>
              {user.role === 'admin' && <Link href="/admin" className="hover:text-gray-900">Admin</Link>}
              <Link href="/profile" className="hover:text-gray-900">{user.fullName || user.email || 'Profile'}</Link>
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-gray-600 sm:px-6 lg:px-8">
        AI Marketing LMS
      </div>
    </footer>
  )
}

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Sign out
      </button>
    </form>
  )
}
