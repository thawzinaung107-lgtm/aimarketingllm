import { ActionForm } from '@/components/action-form'
import { adminAction } from '@/app/admin/actions'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
import type { Tables } from '@/lib/database.types'
export function Field({ name, label, value, type = 'text', required = false }: { name:string; label:string; value?:string|number|null; type?:string; required?:boolean }) {
  return <label className="block text-xs font-semibold">{label}<input className="field" name={name} type={type} defaultValue={value ?? ''} required={required} step={type === 'number' ? 'any' : undefined} /></label>
}
function Check({ name, label, value = false }: { name:string; label:string; value?:boolean }) { return <label className="flex items-start gap-3"><input className="mt-1" type="checkbox" name={name} defaultChecked={value} />{label}</label> }
export function AdminForm({ operation, id, children, submit = 'Save changes' }: { operation:string; id?:string; children?:React.ReactNode; submit?:string }) {
  return <ActionForm action={adminAction} submit={submit} disabled={!sensitiveFeaturesEnabled()}><input type="hidden" name="operation" value={operation} />{id && <input type="hidden" name="id" value={id} />}{children}</ActionForm>
}
export function CourseEditor({ course }: { course?:Tables<'courses'> }) {
  return <AdminForm operation="course" id={course?.id} submit={course ? 'Save course' : 'Create course'}><Field name="title" label="Course title" value={course?.title} required /><Field name="slug" label="URL slug" value={course?.slug} required /><label className="block text-xs font-semibold">Description<textarea className="field" name="description" defaultValue={course?.description ?? ''} rows={3} /></label><Field name="category" label="Category" value={course?.category} /><Field name="thumbnail_url" label="Image path (under /images or a same-site asset route)" value={course?.thumbnail_url} /><div className="grid gap-3 min-[600px]:grid-cols-2"><Field name="price" label="Confirmed price (leave blank if unknown)" type="number" value={course?.price} /><Field name="currency" label="Configured currency code" value={course?.currency} /><Field name="access_duration_days" label="Confirmed access duration in days" type="number" value={course?.access_duration_days} /><Field name="display_order" label="Display order" type="number" value={course?.display_order ?? 0} /></div><Check name="is_published" label="Publish course (requires confirmed price, currency and access duration)" value={course?.is_published} /></AdminForm>
}
export function LessonEditor({ lesson }: { lesson?:Tables<'lessons'> }) {
  return <AdminForm operation="lesson" id={lesson?.id}><Field name="course_id" label="Course ID" value={lesson?.course_id} required /><Field name="title" label="Lesson title" value={lesson?.title} required /><Field name="description" label="Description" value={lesson?.description} /><Field name="display_order" label="Lesson order" type="number" value={lesson?.display_order ?? 0} /><Field name="duration_seconds" label="Actual duration (seconds, optional)" type="number" value={lesson?.duration_seconds} /><Check name="is_published" label="Publish lesson metadata" value={lesson?.is_published} /></AdminForm>
}
export function BannerEditor({ banner }: { banner?:Tables<'homepage_banners'> }) {
  return <AdminForm operation="banner" id={banner?.id}><Field name="title" label="Title" value={banner?.title} required /><Field name="eyebrow" label="Eyebrow" value={banner?.eyebrow} /><Field name="description" label="Description (confirmed information only)" value={banner?.description} /><Field name="image_url" label="Same-site image path" value={banner?.image_url} required /><Field name="link_url" label="Same-site destination" value={banner?.link_url} required /><Field name="display_order" label="Order (first three active banners appear)" value={banner?.display_order ?? 0} type="number" /><Check name="is_active" label="Show banner" value={banner?.is_active} /></AdminForm>
}
export function PaymentReview({ id }: { id:string }) {
  return <div className="grid gap-5 min-[600px]:grid-cols-2"><AdminForm operation="approve" id={id} submit="Approve payment and grant access"><Check name="verified" label="I verified the receipt, amount and currency against the expected payment." /><Field name="reason" label="Verification notes (required)" required /></AdminForm><AdminForm operation="reject" id={id} submit="Reject payment"><Field name="reason" label="Rejection reason" required /></AdminForm></div>
}
