import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { StudentSidebar } from '@/components/dashboard'
import { requireUser } from '@/lib/auth'
export async function StudentShell({ title, path, children }: { title: string; path: string; children: React.ReactNode }) {
  const user = await requireUser(path)
  return <><SiteHeader user={user} /><main className="wrap py-[35px] pb-[72px]"><div className="dashboard"><StudentSidebar /><div className="min-w-0"><span className="eyebrow">Student area</span><h1 className="page-title">{title}</h1>{children}</div></div></main><SiteFooter /></>
}
