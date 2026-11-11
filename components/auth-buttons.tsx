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
    try {
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    if (error) {
      setError('Could not start Google sign-in. Please try again.')
      setIsLoading(false)
    }
    } catch {
      setError('Could not connect to Google sign-in. Check your connection and try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="btn w-full"
      >
        {isLoading ? 'Redirecting to Google…' : 'Continue with Google →'}
      </button>
      {error && <p role="alert" className="text-xs text-red-800">{error}</p>}
    </div>
  )
}
