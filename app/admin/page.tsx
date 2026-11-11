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
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
        <p className="mt-2 text-gray-600">Admin tools are not implemented yet.</p>
      </main>
      <SiteFooter />
    </div>
  )
}
