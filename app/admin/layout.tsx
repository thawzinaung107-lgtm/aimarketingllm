import { requireAdminPage } from '@/lib/auth'
import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { AdminSidebar } from '@/components/dashboard'
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage()
  return <><SiteHeader user={user} /><main className="wrap py-[35px] pb-[72px]"><div className="dashboard"><AdminSidebar /><div className="min-w-0">{children}</div></div></main><SiteFooter /></>
}
