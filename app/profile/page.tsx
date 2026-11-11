import { SiteHeader, SiteFooter, SignOutButton } from '@/components/site-chrome'
import { DeviceList } from '@/components/device-list'
import { requireUser } from '@/lib/auth'
import { getMyDevices } from '@/lib/db-helpers'

export default async function ProfilePage() {
  const user = await requireUser('/profile')
  const devices = await getMyDevices(user.id)

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Profile</h1>

        <section className="mb-6 rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Account</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-gray-900">{user.fullName || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-gray-900">{user.email ?? 'Not available'}</dd>
            </div>
          </dl>
        </section>

        <section className="mb-6 rounded-lg border border-gray-200 p-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Devices</h2>
          <p className="mb-4 text-sm text-gray-600">
            Your account can be used on up to two devices. Removing a device signs it out.
          </p>
          <DeviceList devices={devices} />
        </section>

        <div className="flex justify-end">
          <SignOutButton />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
