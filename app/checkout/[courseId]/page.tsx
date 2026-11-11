import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentShell } from '@/components/student-shell'
import { PaymentForm } from '@/components/payment-form'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import { formatPrice } from '@/lib/format'
import { uuid } from '@/lib/validation'
export default async function CheckoutPage({ params }: PageProps<'/checkout/[courseId]'>) {
  const { courseId } = await params
  await requireUser(`/checkout/${courseId}`)
  if (!uuid.safeParse(courseId).success) notFound()
  const db = await createClient()
  const { data: course, error } = await db.from('courses').select('title,price,currency,access_duration_days').eq('id',courseId).eq('is_published',true).maybeSingle()
  if (error) throw error
  if (!course) notFound()
  const instructions = process.env.MANUAL_PAYMENT_INSTRUCTIONS?.trim()
  const enabled = sensitiveFeaturesEnabled() && Boolean(instructions)
  return <StudentShell title="Submit your payment" path={`/checkout/${courseId}`}><div className="two-col"><section className="panel"><h2 className="mb-5 text-lg font-bold">Payment information</h2><p className="mb-5 whitespace-pre-line text-muted">{instructions || 'Official payment instructions have not been configured. Please do not send a payment yet.'}</p><PaymentForm courseId={courseId} enabled={enabled} />{!enabled && <p className="mt-4 text-muted">Payment submission is not available yet.</p>}</section><aside className="panel self-start"><h2 className="text-lg font-bold">{course.title}</h2><p className="my-4">{formatPrice(course.price,course.currency) ?? 'Price to be confirmed'}</p><p className="text-muted">{course.access_duration_days ? `${course.access_duration_days} days of access after activation.` : 'Access duration to be confirmed.'}</p><p className="mt-5 text-muted">A receipt is private and reviewed by an administrator. Submission alone does not unlock lessons.</p></aside></div></StudentShell>
}
