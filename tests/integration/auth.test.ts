import { describe, expect, it } from 'vitest'
import {
  createCourse, createGoogleUser, endSession, http, newAdmin, newStudent, registerDeviceViaApp, serviceClient, signIn,
} from './helpers'

describe('profile creation (V6)', () => {
  it('first Google sign-in creates exactly one student profile, ignoring role in metadata', async () => {
    const u = await createGoogleUser({ full_name: 'First Login', role: 'admin' })
    const { data } = await serviceClient().from('profiles').select('role, full_name').eq('id', u.id)
    expect(data).toEqual([{ role: 'student', full_name: 'First Login' }])
  })

  it('returning sign-in keeps the same single profile', async () => {
    const u = await createGoogleUser({ full_name: 'Returner' })
    await signIn(u)
    await signIn(u)
    const { data } = await serviceClient().from('profiles').select('id').eq('id', u.id)
    expect(data).toHaveLength(1)
  })
})

describe('session handling and route protection', () => {
  it('signed-out users are redirected from protected pages to /login', async () => {
    for (const path of ['/my-courses', '/profile', '/admin']) {
      const res = await http(path)
      expect(res.status, path).toBe(307)
      expect(res.headers.get('location'), path).toMatch(/\/login\?next=/)
    }
  })

  it('a signed-in student session persists across requests and can open the dashboard', async () => {
    const s = await newStudent({ full_name: 'Dash Student' })
    const first = await http('/my-courses', { cookie: s.cookieHeader })
    const second = await http('/my-courses', { cookie: s.cookieHeader })
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(await second.text()).toContain('My learning')
  })

  it('students are redirected away from /admin; admins can open it', async () => {
    const s = await newStudent()
    const denied = await http('/admin', { cookie: s.cookieHeader })
    expect(denied.status).toBe(307)
    expect(new URL(denied.headers.get('location')!, 'http://x').pathname).toBe('/')

    const a = await newAdmin()
    const ok = await http('/admin', { cookie: a.cookieHeader })
    expect(ok.status).toBe(200)
    expect(await ok.text()).toContain('Admin')
  })

  it('a forged/invalid session cookie is treated as signed out', async () => {
    const s = await newStudent()
    const forged = s.cookieHeader.replace(/base64-[A-Za-z0-9_-]{10}/, 'base64-AAAAAAAAAA')
    const res = await http('/my-courses', { cookie: forged })
    expect(res.status).toBe(307)
  })

  it('an expired (revoked) session can no longer access protected pages', async () => {
    const s = await newStudent()
    expect((await http('/profile', { cookie: s.cookieHeader })).status).toBe(200)
    // End the server-side session (what expiry, sign-out-everywhere, or
    // device removal does). The still-unexpired JWT in the cookie must no
    // longer grant access.
    await endSession(s.sessionId)
    const res = await http('/profile', { cookie: s.cookieHeader })
    expect(res.status).toBe(307)
  })

  it('sign-out is POST-only and ends the session', async () => {
    const s = await newStudent()
    const viaGet = await http('/auth/signout', { cookie: s.cookieHeader })
    expect(viaGet.status).toBe(405)

    const out = await http('/auth/signout', { method: 'POST', cookie: s.cookieHeader })
    expect(out.status).toBe(303)
    // The server-side session is revoked, so the old access token is rejected.
    const { error } = await s.client.auth.getUser()
    expect(error).not.toBeNull()
    // And the app itself no longer accepts the old cookie.
    expect((await http('/profile', { cookie: s.cookieHeader })).status).toBe(307)
  })

  it('OAuth callback without a code fails safely', async () => {
    const res = await http('/auth/callback')
    expect(res.headers.get('location')).toContain('/login?error=missing_code')
    const res2 = await http('/auth/callback?error=access_denied')
    expect(res2.headers.get('location')).toContain('/login?error=provider')
  })

  it('OAuth callback with an invalid code does not create a session', async () => {
    const res = await http('/auth/callback?code=not-a-real-code&next=//evil.example')
    const loc = res.headers.get('location')!
    expect(loc).toContain('/login?error=exchange_failed')
    expect(loc).not.toContain('evil.example')
  })
})

describe('device registration and removal API', () => {
  it('first two devices register; a third is sent to the device-limit page', async () => {
    const u = await createGoogleUser()
    const d1 = await registerDeviceViaApp(await signIn(u))
    expect(d1.location).toContain('/my-courses')
    const d2 = await registerDeviceViaApp(await signIn(u))
    expect(d2.location).toContain('/my-courses')
    const d3 = await registerDeviceViaApp(await signIn(u))
    expect(d3.location).toContain('/device-limit')

    const { count } = await serviceClient().from('registered_devices').select('*', { count: 'exact', head: true }).eq('user_id', u.id)
    expect(count).toBe(2)
  })

  it('the same device (same cookie) does not consume a second slot', async () => {
    const u = await createGoogleUser()
    const first = await registerDeviceViaApp(await signIn(u))
    await registerDeviceViaApp(await signIn(u), first.deviceKey)
    const { count } = await serviceClient().from('registered_devices').select('*', { count: 'exact', head: true }).eq('user_id', u.id)
    expect(count).toBe(1)
  })

  it('removal requires auth, checks ownership, revokes sessions, and is rate limited', async () => {
    const ownerUser = await createGoogleUser()
    const owner = await signIn(ownerUser)
    await registerDeviceViaApp(owner)
    const { data: devs } = await serviceClient().from('registered_devices').select('id').eq('user_id', owner.id)
    const deviceId = devs![0].id

    // Unauthenticated
    expect((await http(`/api/devices/${deviceId}`, { method: 'DELETE' })).status).toBe(401)
    // Invalid id
    const other = await newStudent()
    expect((await http('/api/devices/not-a-uuid', { method: 'DELETE', cookie: other.cookieHeader })).status).toBe(400)
    // Cross-site origin
    const xs = await http(`/api/devices/${deviceId}`, { method: 'DELETE', cookie: owner.cookieHeader, headers: { origin: 'https://evil.example' } })
    expect(xs.status).toBe(403)
    // Another user's device
    const notMine = await http(`/api/devices/${deviceId}`, { method: 'DELETE', cookie: other.cookieHeader })
    expect(notMine.status).toBe(404)
    expect((await serviceClient().from('registered_devices').select('id').eq('id', deviceId)).data).toHaveLength(1)

    // Owner removes it from a second session; the first session is revoked.
    const second = await signIn(ownerUser)
    const ok = await http(`/api/devices/${deviceId}`, { method: 'DELETE', cookie: second.cookieHeader })
    expect(ok.status).toBe(204)
    expect((await serviceClient().from('registered_devices').select('id').eq('id', deviceId)).data).toHaveLength(0)
    const { error } = await owner.client.auth.getUser()
    expect(error, 'session bound to removed device must be revoked').not.toBeNull()
    expect((await http('/profile', { cookie: owner.cookieHeader })).status, 'app must reject the removed device session').toBe(307)

    // Rate limit: 5 removals/hour
    const limiter = await signIn(ownerUser)
    let last = 0
    for (let i = 0; i < 5; i++) {
      await registerDeviceViaApp(await signIn(ownerUser))
      const { data } = await serviceClient().from('registered_devices').select('id').eq('user_id', owner.id).limit(1)
      last = (await http(`/api/devices/${data![0].id}`, { method: 'DELETE', cookie: limiter.cookieHeader })).status
      if (last === 429) break
    }
    expect(last).toBe(429)
  })
})

describe('data API enforcement with real tokens (PostgREST)', () => {
  it('student cannot escalate, self-enroll, read codes or video paths', async () => {
    const s = await newStudent()
    const { courseId, lessonId } = await createCourse()

    const esc = await s.client.from('profiles').update({ role: 'admin' }).eq('id', s.id)
    expect(esc.error?.code).toBe('42501')

    const enr = await s.client.from('enrollments').insert({ user_id: s.id, course_id: courseId, status: 'active' })
    expect(enr.error?.code).toBe('42501')

    const codes = await s.client.from('redeem_codes').select('*')
    expect(codes.data ?? []).toHaveLength(0)

    const media = await s.client.from('lesson_media').select('storage_path')
    expect(media.data ?? []).toHaveLength(0)

    const play = await s.client.rpc('get_lesson_playback', { p_lesson_id: lessonId })
    expect(play.error?.code).toBe('42501')

    const { data: p } = await serviceClient().from('profiles').select('role').eq('id', s.id).single()
    expect(p!.role).toBe('student')
    const { count } = await serviceClient().from('enrollments').select('*', { count: 'exact', head: true }).eq('user_id', s.id)
    expect(count).toBe(0)
  })

  it('admin can approve a student payment and the student then gets playback on a registered device', async () => {
    const studentUser = await createGoogleUser()
    const s = await signIn(studentUser)
    await registerDeviceViaApp(s)
    const a = await newAdmin()
    const { courseId, lessonId } = await createCourse(30)

    const { data: paymentId, error: subErr } = await s.client.rpc('submit_manual_payment', { p_course_id: courseId, p_amount: 1000, p_payment_reference: 'IT-REF' })
    expect(subErr).toBeNull()
    const denied = await s.client.rpc('approve_manual_payment', { p_payment_id: paymentId! })
    expect(denied.error?.code).toBe('42501')

    const approved = await a.client.rpc('approve_manual_payment', { p_payment_id: paymentId! })
    expect(approved.error).toBeNull()

    const play = await s.client.rpc('get_lesson_playback', { p_lesson_id: lessonId })
    expect(play.error).toBeNull()
    expect(play.data).toMatch(/^courses\//)
  })

  it('anon cannot read private tables', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const anon = createClient('http://127.0.0.1:54321', process.env.TEST_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } })
    for (const t of ['profiles', 'enrollments', 'manual_payments', 'registered_devices', 'redeem_codes', 'lesson_media', 'admin_audit_logs'] as const) {
      const { error } = await anon.from(t).select('*').limit(1)
      expect(error?.code, t).toBe('42501')
    }
  })
})
