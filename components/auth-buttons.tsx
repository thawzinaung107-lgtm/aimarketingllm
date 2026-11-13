'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Email + password sign-in / sign-up form. Replaces the former Google OAuth flow. */
export function EmailSignInForm({ next }: { next: string }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setInfo(null)
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || undefined } },
        })
        if (error) {
          setError(error.message)
          setIsLoading(false)
          return
        }
        if (data.session) {
          window.location.href = `/auth/device?next=${encodeURIComponent(next)}`
        } else {
          setInfo('Check your email to confirm your account, then sign in.')
          setIsLoading(false)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message)
          setIsLoading(false)
          return
        }
        window.location.href = `/auth/device?next=${encodeURIComponent(next)}`
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Full name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="field"
            autoComplete="name"
          />
        )}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="field"
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="field"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />
        <button type="submit" disabled={isLoading} className="btn w-full">
          {isLoading ? 'Please wait…' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
        </button>
      </form>
      {error && <p role="alert" className="text-xs text-red-800">{error}</p>}
      {info && <p role="status" className="text-xs text-[#4d5258]">{info}</p>}
      <p className="text-center text-xs text-muted">
        {mode === 'signin' ? (
          <>New here? <button type="button" onClick={() => { setMode('signup'); setError(null); setInfo(null) }} className="underline">Create an account</button></>
        ) : (
          <>Already have an account? <button type="button" onClick={() => { setMode('signin'); setError(null); setInfo(null) }} className="underline">Sign in</button></>
        )}
      </p>
    </div>
  )
}
