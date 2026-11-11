import Link from 'next/link'
import { BookOpen, CreditCard, Gift, Monitor, User, LayoutDashboard } from 'lucide-react'
const studentLinks = [
  ['/my-courses', 'My learning', BookOpen], ['/payments', 'Payments', CreditCard],
  ['/redeem', 'Redeem a code', Gift], ['/profile', 'Profile', User], ['/profile/devices', 'Devices', Monitor],
] as const
export const adminLinks = [
  ['/admin', 'Overview'], ['/admin/courses', 'Courses'], ['/admin/lessons', 'Lessons'],
  ['/admin/payments', 'Payments'], ['/admin/redeem-codes', 'Redeem codes'], ['/admin/students', 'Students'],
  ['/admin/enrollments', 'Student access'], ['/admin/devices', 'Devices'], ['/admin/banners', 'Homepage CMS'], ['/admin/audit-logs', 'Audit history'],
] as const
export function StudentSidebar() {
  return <aside className="rounded-[13px] bg-charcoal p-[23px] text-white"><h2 className="mb-5 font-bold">MY ACCOUNT</h2><nav aria-label="Student navigation" className="grid gap-1">{studentLinks.map(([href,label,Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-lg p-3 text-[#d1d4d8] hover:bg-white/10"><Icon size={16} aria-hidden="true" />{label}</Link>)}</nav></aside>
}
export function AdminSidebar() {
  return <aside className="rounded-[13px] bg-charcoal p-[23px] text-white"><h2 className="mb-5 flex gap-2 font-bold"><LayoutDashboard size={20} aria-hidden="true" />ADMIN DASHBOARD</h2><nav aria-label="Admin navigation">{adminLinks.map(([href,label]) => <Link key={href} href={href} className="my-1 block rounded-lg px-3 py-2.5 text-[#d1d4d8] hover:bg-white/10">{label}</Link>)}</nav></aside>
}
export function DashboardStats({ stats }: { stats: { label: string; value: number | string }[] }) {
  return <dl className="grid grid-cols-1 gap-3 min-[481px]:grid-cols-3">{stats.map(s => <div key={s.label} className="rounded-[11px] border border-line p-[19px]"><dt className="text-xs text-muted">{s.label}</dt><dd className="mt-1 text-[25px] font-bold tracking-[-.6px]">{s.value}</dd></div>)}</dl>
}
