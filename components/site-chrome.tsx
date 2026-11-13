import Link from 'next/link'
import type { CurrentUser } from '@/lib/auth'
import { MobileNavToggle } from '@/components/mobile-nav'

const PUBLIC_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'All courses' },
  { href: '/how-it-works', label: 'How it works' },
]

/** Option 2 V3 header: brand mark + text nav + sign-in button. */
export function SiteHeader({ user }: { user: CurrentUser | null }) {
  const links = [
    ...PUBLIC_LINKS,
    ...(user ? [{ href: '/my-courses', label: 'My learning' }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin' }] : []),
  ]
  return (
    <header className="wrap relative flex h-[69px] items-center gap-8 border-b border-line min-[1101px]:h-[79px]">
      <Link href="/" className="text-[13px] min-[481px]:text-base font-extrabold tracking-[-.4px] whitespace-nowrap">
        <b aria-hidden="true" className="mr-[9px] inline-grid size-[27px] place-items-center rounded-md bg-black text-[15px] text-white">
          ■
        </b>
        AI MARKETING ACADEMY
      </Link>
      <MobileNavToggle>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="py-2.5 text-[13px] text-[#444] hover:underline">
            {l.label}
          </Link>
        ))}
        {user ? (
          <Link href="/profile" className="btn btn-alt max-w-[150px] overflow-hidden text-ellipsis">
            {user.fullName || 'Account'}
          </Link>
        ) : (
          <Link href="/login" className="btn">
            Sign in
          </Link>
        )}
      </MobileNavToggle>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="wrap flex justify-between gap-5 border-t border-line pt-7 pb-[38px] text-xs text-[#777] max-[480px]:flex-col">
      <span>AI MARKETING ACADEMY · onlinelearning.ccone.app</span>
      <span>Online courses · English</span>
    </footer>
  )
}

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className="btn btn-alt">
        Sign out
      </button>
    </form>
  )
}
