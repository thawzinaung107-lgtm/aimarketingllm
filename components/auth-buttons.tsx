'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Starts Google OAuth (PKCE). The only sign-in method offered. */
export function GoogleSignInButton({ next }: { next: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    if (error) {
      setError('Could not start Google sign-in. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Redirecting to Google…' : 'Continue with Google'}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
