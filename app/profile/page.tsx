import Link from 'next/link'
import { StudentShell } from '@/components/student-shell'
import { SignOutButton } from '@/components/site-chrome'
import { ActionForm } from '@/components/action-form'
import { profileAction } from '@/app/student-actions'
import { requireUser } from '@/lib/auth'
export default async function ProfilePage() {
  const user = await requireUser('/profile')
  return <StudentShell title="Your profile" path="/profile"><div className="panel mb-6"><p className="mb-5 break-all text-muted">{user.email}</p><ActionForm action={profileAction}><label className="block text-xs font-semibold">Full name<input className="field" name="full_name" defaultValue={user.fullName ?? ''} required maxLength={200} autoComplete="name" /></label></ActionForm></div><div className="flex flex-wrap gap-3"><Link href="/profile/devices" className="btn btn-alt">Manage devices</Link><SignOutButton /></div></StudentShell>
}
