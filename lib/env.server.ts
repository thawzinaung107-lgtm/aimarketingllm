import 'server-only'
import { z } from 'zod'

/**
 * Server-only secrets. Importing this module from a Client Component fails the
 * build (`server-only`), so the secret key can never reach the browser bundle.
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(20),
  LESSON_VIDEO_BUCKET: z.string().min(1).default('lesson-videos'),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
})

export function getServerEnv() {
  const parsed = serverSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    LESSON_VIDEO_BUCKET: process.env.LESSON_VIDEO_BUCKET,
    SIGNED_URL_TTL_SECONDS: process.env.SIGNED_URL_TTL_SECONDS,
  })
  if (!parsed.success) {
    const keys = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Invalid or missing server environment variables: ${keys}. See .env.example.`)
  }
  return parsed.data
}
