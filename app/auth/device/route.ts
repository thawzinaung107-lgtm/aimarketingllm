import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/routes'
import { DEVICE_COOKIE, deviceCookieOptions, describeUserAgent, newDeviceKey } from '@/lib/device'

/**
 * Binds the current auth session to a registered device (max 2 per account,
 * enforced in the database). If the account already has two other devices,
 * the user is sent to the device-limit page and gets no lesson access.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'))
  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) return NextResponse.redirect(`${origin}/login`)

  const existingKey = request.cookies.get(DEVICE_COOKIE)?.value
  const deviceKey = existingKey && existingKey.length >= 32 ? existingKey : newDeviceKey()
  const ua = request.headers.get('user-agent')

  const { data: deviceId, error } = await supabase.rpc('register_current_device', {
    p_device_key: deviceKey,
    p_device_name: describeUserAgent(ua),
    p_user_agent: ua?.slice(0, 500) ?? undefined,
  })

  const target = error ? `${origin}/login?error=device` : deviceId ? `${origin}${next}` : `${origin}/device-limit`
  const response = NextResponse.redirect(target)
  response.cookies.set(DEVICE_COOKIE, deviceKey, deviceCookieOptions)
  return response
}
