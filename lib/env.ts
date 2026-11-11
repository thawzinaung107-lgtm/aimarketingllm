import { z } from 'zod'

/**
 * Public (browser-safe) configuration. Validated lazily so `next build` works
 * without secrets; any request that needs Supabase fails fast with a clear
 * message if configuration is missing.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.url(),
})

export type PublicEnv = z.infer<typeof publicSchema>

export function getPublicEnv(): PublicEnv {
  // Each key must be referenced literally so Next can inline it in the browser.
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })
  if (!parsed.success) {
    const keys = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Invalid or missing public environment variables: ${keys}. See .env.example.`)
  }
  return parsed.data
}
