import { redirect } from 'next/navigation'
import { GoogleSignInButton } from '@/components/auth-buttons'
import { getCurrentUser } from '@/lib/auth'
import { safeNextPath } from '@/lib/routes'

const ERRORS: Record<string, string> = {
  provider: 'Google sign-in was cancelled or failed.',
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Sign in</h1>
      <p className="mb-6 text-gray-600">Use your Google account to access your courses.</p>
      {errorKey && ERRORS[errorKey] && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {ERRORS[errorKey]}
        </p>
      )}
      <GoogleSignInButton next={next} />
    </main>
  )
}
