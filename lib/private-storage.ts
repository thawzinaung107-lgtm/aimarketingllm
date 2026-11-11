import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { objectKey } from '@/lib/validation'
/** Never sign/upload against a bucket that has accidentally become public. */
export async function privateBucket(name: string) {
  const service = createServiceClient()
  const { data, error } = await service.storage.getBucket(name)
  if (error || !data || data.public) throw new Error('Private storage is unavailable')
  return service.storage.from(name)
}
export async function signPrivateObject(bucketName: string, key: string, seconds: number) {
  objectKey.parse(key)
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 300) throw new Error('Invalid expiry')
  const bucket = await privateBucket(bucketName)
  const { data, error } = await bucket.createSignedUrl(key, seconds)
  if (error || !data?.signedUrl) throw new Error('Media is unavailable')
  return data.signedUrl
}
