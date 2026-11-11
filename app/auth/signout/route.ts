import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** POST-only so a cross-site link or image cannot sign the user out. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
