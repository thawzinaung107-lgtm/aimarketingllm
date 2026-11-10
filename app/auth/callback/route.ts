import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user and create profile if doesn't exist
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // Create profile if doesn't exist
        if (!profile) {
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata.full_name || null,
              role: 'student', // Default role
            })
        }
      }
    }
  }

  // Redirect to home page
  return NextResponse.redirect(`${origin}/`)
}
