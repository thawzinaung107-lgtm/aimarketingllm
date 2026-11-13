/**
 * Integration test helpers. LOCAL Supabase only: the URL is asserted to be
 * loopback so these tests can never run against a hosted project.
 *
 * Sessions are minted with GoTrue's admin API (generateLink + verifyOtp),
 * which produces the same kind of session and cookie the sign-in flow
 * produces. The user is created with email/password auth.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export const SUPABASE_URL = process.env.TEST_SUPABASE_URL ?? 'http://127.0.0.1:54321'
export const APP_URL = process.env.TEST_APP_URL ?? 'http://localhost:3100'
const PUBLISHABLE_KEY = process.env.TEST_SUPABASE_PUBLISHABLE_KEY!
const SECRET_KEY = process.env.TEST_SUPABASE_SECRET_KEY!

const host = new URL(SUPABASE_URL).hostname
if (!['127.0.0.1', 'localhost'].includes(host)) {
  throw new Error(`Refusing to run integration tests against non-local Supabase: ${SUPABASE_URL}`)
}

export function serviceClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } })
}

export interface TestUser {
  id: string
  email: string
  client: SupabaseClient<Database>
  /** Serialized Supabase auth cookies for HTTP requests to the Next app. */
  cookieHeader: string
  sessionId: string
}

const RUN = Date.now().toString(36)
let n = 0

export async function createTestUser(meta: Record<string, unknown> = {}): Promise<{ id: string; email: string }> {
  const admin = serviceClient()
  const email = `it-${RUN}-${++n}@example.com`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: `pw-${RUN}-${n}`,
    user_metadata: meta,
  })
  if (error) throw error
  return { id: data.user.id, email }
}

/** Sign an existing user in and return an authenticated client + cookies. */
export async function signIn(user: { id: string; email: string }): Promise<TestUser> {
  const admin = serviceClient()
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email: user.email })
  if (linkErr) throw linkErr

  const jar = new Map<string, string>()
  const ssr = createServerClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const c of cookies) {
          if (c.value) jar.set(c.name, c.value)
          else jar.delete(c.name)
        }
      },
    },
  })
  const { data, error } = await ssr.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
  if (error || !data.session) throw error ?? new Error('no session')

  const claims = JSON.parse(Buffer.from(data.session.access_token.split('.')[1], 'base64url').toString())
  const client = createClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  })
  return {
    id: user.id,
    email: user.email,
    client,
    sessionId: claims.session_id,
    cookieHeader: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
  }
}

export async function newStudent(meta: Record<string, unknown> = {}): Promise<TestUser> {
  return signIn(await createTestUser(meta))
}

/** Promote via the trusted server side (service role), then sign in fresh. */
export async function newAdmin(): Promise<TestUser> {
  const u = await createTestUser()
  const { error } = await serviceClient().from('profiles').update({ role: 'admin' }).eq('id', u.id)
  if (error) throw error
  return signIn(u)
}

/** Published, fully-configured test course. Values are neutral test data. */
export async function createCourse(durationDays = 30) {
  const admin = serviceClient()
  const slug = `it-${RUN}-${++n}`
  const { data: course, error } = await admin
    .from('courses')
    .insert({ title: `Test ${slug}`, slug, price: 1000, currency: 'MMK', access_duration_days: durationDays, is_published: true })
    .select('id')
    .single()
  if (error) throw error
  const { data: lesson, error: lErr } = await admin
    .from('lessons')
    .insert({ course_id: course.id, title: 'Lesson 1', is_published: true, duration_seconds: 600 })
    .select('id')
    .single()
  if (lErr) throw lErr
  const { error: mErr } = await admin.from('lesson_media').insert({ lesson_id: lesson.id, storage_path: `courses/${slug}/l1.mp4` })
  if (mErr) throw mErr
  return { courseId: course.id, lessonId: lesson.id }
}

export async function http(path: string, init: RequestInit & { cookie?: string } = {}) {
  const headers = new Headers(init.headers)
  if (init.cookie) headers.set('cookie', init.cookie)
  return fetch(`${APP_URL}${path}`, { ...init, headers, redirect: 'manual' })
}

/** Run the app's device-registration step for a session; returns the device cookie. */
export async function registerDeviceViaApp(user: TestUser, deviceCookie?: string) {
  const cookie = deviceCookie ? `${user.cookieHeader}; lms_device=${deviceCookie}` : user.cookieHeader
  const res = await http('/auth/device?next=/my-courses', { cookie, headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0' } })
  const set = res.headers.getSetCookie().find((c) => c.startsWith('lms_device='))
  const key = set?.split(';')[0].split('=')[1]
  return { res, location: res.headers.get('location'), deviceKey: key }
}

/** Delete an auth session directly in the LOCAL database (simulates expiry/revocation). */
export async function endSession(sessionId: string) {
  const { execFileSync } = await import('node:child_process')
  if (!/^[0-9a-f-]{36}$/.test(sessionId)) throw new Error('bad session id')
  execFileSync('docker', ['exec', process.env.SUPABASE_DB_CONTAINER ?? 'supabase_db_ai-marketing-lms',
    'psql', '-U', 'postgres', '-d', 'postgres', '-qAtc', `delete from auth.sessions where id = '${sessionId}'`])
}
