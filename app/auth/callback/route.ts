import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/routes'

/**
 * Email confirmation (PKCE) callback. Exchanges the code for a session cookie.
 * Profiles are created by the database trigger on auth.users (always with the
 * 'student' role), so this route never writes to profiles.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))
  const providerError = searchParams.get('error')

  if (providerError || !code) {
    return NextResponse.redirect(`${origin}/login?error=${providerError ? 'provider' : 'missing_code'}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  // Register (or recognise) this device before allowing access to content.
  return NextResponse.redirect(`${origin}/auth/device?next=${encodeURIComponent(next)}`)
}
