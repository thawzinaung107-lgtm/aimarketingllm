import 'server-only'
import { signPrivateObject } from '@/lib/private-storage'
export interface PlaybackGrant { url: string; expiresAt: string }
export interface StreamingProvider { sign: (key: string, ttlSeconds: number) => Promise<PlaybackGrant> }
/** Adapter is explicitly selected, never assumed to be the final provider. */
export function streamingProvider(): StreamingProvider | null {
  if (process.env.STREAMING_PROVIDER !== 'supabase') return null
  return { async sign(key, ttlSeconds) {
    const url = await signPrivateObject(process.env.LESSON_VIDEO_BUCKET || 'lesson-videos', key, ttlSeconds)
    return { url, expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString() }
  } }
}
