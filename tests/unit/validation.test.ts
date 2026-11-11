import { describe, it, expect } from 'vitest'
import { courseSchema, objectKey, localLink } from '@/lib/validation'
import { playbackLifetime } from '@/lib/playback-policy'
describe('private object references', () => {
  it.each(['https://cdn.example/video.mp4','//host/file','/absolute/file','folder/../secret','folder\\secret','path?token=permanent','x#fragment','data:video/mp4'])('rejects permanent/unsafe reference %s', value => { expect(objectKey.safeParse(value).success).toBe(false) })
  it('accepts an object key', () => { expect(objectKey.parse('courses/a/lesson-1.mp4')).toBe('courses/a/lesson-1.mp4') })
  it.each(['javascript:alert(1)','//evil.test','/\\evil.test','https://outside.test'])('rejects unsafe CMS destination %s', value => { expect(localLink.safeParse(value).success).toBe(false) })
})
describe('business configuration', () => {
  const draft = { title:'Draft course',slug:'draft-course',description:'',category:'',thumbnail_url:'',price:'',currency:'',access_duration_days:'',display_order:0,is_published:false }
  it('keeps unconfirmed price/currency/duration null, never defaulted', () => { expect(courseSchema.parse(draft)).toMatchObject({ price:null,currency:null,access_duration_days:null }) })
  it('blocks publication with missing terms', () => { expect(courseSchema.safeParse({ ...draft,is_published:true }).success).toBe(false) })
  it('requires a price/currency pair', () => { expect(courseSchema.safeParse({ ...draft,price:1000 }).success).toBe(false) })
  it('accepts explicit test-only configured terms', () => { expect(courseSchema.safeParse({ ...draft,price:1000,currency:'MMK',access_duration_days:30,is_published:true }).success).toBe(true) })
})
describe('playback lifetime', () => {
  const now=Date.parse('2026-11-11T00:00:00Z')
  it.each([null,'invalid','2026-11-10T00:00:00Z','2026-11-11T00:00:00Z'])('fails closed for %s', value => { expect(playbackLifetime(value,120,now)).toBe(0) })
  it('caps grant at enrollment expiry', () => { expect(playbackLifetime('2026-11-11T00:00:15Z',120,now)).toBe(15) })
  it('caps excessive requested lifetimes', () => { expect(playbackLifetime('2026-11-12T00:00:00Z',3600,now)).toBe(300) })
})
