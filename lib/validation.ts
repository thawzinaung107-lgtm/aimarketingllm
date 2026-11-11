import { z } from 'zod'
export const uuid = z.uuid()
export const objectKey = z.string().min(1).max(1024).refine(
  (s) => !s.startsWith('/') && !/[:\\?#\u0000-\u001f]/.test(s) && !s.split('/').includes('..'),
  'Use a private object key, not a URL',
)
export const localLink = z.string().max(512).refine(s => /^\/(?![/\\])/.test(s) && !/[\\\u0000-\u001f]/.test(s), 'Use a same-site path')
export const optionalText = (max: number) => z.string().trim().max(max).transform(s => s || null)
export const courseSchema = z.object({
  title: z.string().trim().min(1).max(120), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  description: optionalText(10000), category: optionalText(40),
  price: z.preprocess(v => v === '' ? null : v, z.coerce.number().min(0).max(99999999).nullable()),
  currency: z.string().regex(/^$|^[A-Z]{3}$/).transform(s => s || null),
  access_duration_days: z.preprocess(v => v === '' ? null : v, z.coerce.number().int().positive().max(36500).nullable()),
  is_published: z.boolean(), display_order: z.coerce.number().int().min(0).max(100000),
  thumbnail_url: z.union([localLink, z.literal('')]).transform(s => s || null),
}).refine(c => (c.price === null) === (c.currency === null), 'Configure price and currency together')
.refine(c => !c.is_published || (c.price !== null && c.currency !== null && c.access_duration_days !== null), 'Publishing requires configured price, currency and access duration')
export type ActionState = { ok?: boolean; message: string; codes?: string[] }
export const initialActionState: ActionState = { message: '' }
