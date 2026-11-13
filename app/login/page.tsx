import { redirect } from 'next/navigation'
import { EmailSignInForm } from '@/components/auth-buttons'
import { SiteFooter, SiteHeader } from '@/components/site-chrome'
import { getCurrentUser } from '@/lib/auth'
import { safeNextPath } from '@/lib/routes'

const ERRORS: Record<string, string> = {
  provider: 'Sign-in was cancelled or failed.',
  missing_code: 'The sign-in link was incomplete. Please try again.',
  exchange_failed: 'Your sign-in could not be completed. Please try again.',
  device: 'We could not register this device. Please try again.',
}

export default async function LoginPage(props: PageProps<'/login'>) {
  const searchParams = await props.searchParams
  const next = safeNextPath(typeof searchParams.next === 'string' ? searchParams.next : null)
  const errorKey = typeof searchParams.error === 'string' ? searchParams.error : null

  if (await getCurrentUser()) redirect(next)

  return (
    <>
      <SiteHeader user={null} />
      <main className="wrap min-h-[70vh]">
        <div className="mx-auto my-[45px] max-w-[490px]">
          <span className="eyebrow">Welcome back</span>
          <h1 className="mt-2 text-[clamp(31px,4vw,49px)] leading-[1.13] font-bold tracking-[-1.8px]">Sign in to continue</h1>
          {errorKey && ERRORS[errorKey] && (
            <p role="alert" className="my-4 rounded-[9px] border border-[#e5e7e9] bg-[#f2f3f4] px-[15px] py-[13px] text-xs text-[#4d5258]">
              {ERRORS[errorKey]}
            </p>
          )}
          <div className="rounded-[15px] border border-line bg-white p-7">
            <h2 className="text-lg font-bold tracking-[-.4px]">Sign in with email</h2>
            <p className="text-muted">Use your email and password to access your courses and learning progress.</p>
            <EmailSignInForm next={next} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
