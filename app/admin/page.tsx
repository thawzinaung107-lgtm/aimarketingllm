import { SiteHeader, SiteFooter } from '@/components/site-chrome'
import { requireAdminPage } from '@/lib/auth'

/**
 * Admin entry point. Guarded server-side (requireAdminPage) in addition to
 * the proxy's optimistic check and database RLS. Admin features are not built
 * yet; this page exists so route protection can be verified.
 */
export default async function AdminPage() {
  const user = await requireAdminPage()
  return (
    <>
      <SiteHeader user={user} />
      <main className="wrap min-h-[70vh] pt-[35px] pb-[72px]">
        <h1 className="text-[clamp(31px,4vw,49px)] leading-[1.13] font-bold tracking-[-1.8px]">Admin</h1>
        <p className="mt-2 text-muted">Admin tools are not implemented yet.</p>
      </main>
      <SiteFooter />
    </>
  )
}
