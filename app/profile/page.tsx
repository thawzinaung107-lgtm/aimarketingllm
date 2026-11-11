import { SiteHeader, SiteFooter, SignOutButton } from '@/components/site-chrome'
import { DeviceList } from '@/components/device-list'
import { requireUser } from '@/lib/auth'
import { getMyDevices } from '@/lib/db-helpers'

export default async function ProfilePage() {
  const user = await requireUser('/profile')
  const devices = await getMyDevices(user.id)

  return (
    <>
      <SiteHeader user={user} />
      <main className="wrap min-h-[70vh] max-w-[820px] pt-[35px] pb-[72px]">
        <h1 className="mb-8 text-[clamp(31px,4vw,49px)] leading-[1.13] font-bold tracking-[-1.8px]">Profile</h1>

        <section className="mb-6 rounded-[15px] border border-line p-7">
          <h2 className="mb-4 text-lg font-bold tracking-[-.4px]">Account</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted">Name</dt>
              <dd className="mt-1">{user.fullName || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted">Email</dt>
              <dd className="mt-1">{user.email ?? 'Not available'}</dd>
            </div>
          </dl>
        </section>

        <section className="mb-6 rounded-[15px] border border-line p-7">
          <h2 className="mb-2 text-lg font-bold tracking-[-.4px]">Devices</h2>
          <p className="mb-4 text-sm text-muted">
            Your account can be used on up to two devices. Removing a device signs it out.
          </p>
          <DeviceList devices={devices} />
        </section>

        <div className="flex justify-end">
          <SignOutButton />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
