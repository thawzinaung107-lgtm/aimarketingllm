import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

const paramsSchema = z.object({ deviceId: z.uuid() })

/**
 * Remove one of the caller's registered devices. Ownership, throttling
 * (5 removals per hour) and revocation of the device's auth sessions are all
 * enforced inside the database function remove_my_device().
 */
export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/devices/[deviceId]'>) {
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const parsed = paramsSchema.safeParse(await ctx.params)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid device id' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_my_device', { p_device_id: parsed.data.deviceId })

  if (error) {
    if (error.code === 'P0002') return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    if (error.code === 'LMS08') return NextResponse.json({ error: error.message }, { status: 429 })
    return NextResponse.json({ error: 'Could not remove device' }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
