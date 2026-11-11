import { SignOutButton, SiteFooter, SiteHeader } from '@/components/site-chrome'
import { requireUser } from '@/lib/auth'
import { getMyDevices } from '@/lib/db-helpers'
import { DeviceList } from '@/components/device-list'

export default async function DeviceLimitPage() {
  const user = await requireUser()
  const devices = await getMyDevices(user.id)

  return (
    <>
    <SiteHeader user={user} />
    <main className="wrap min-h-[70vh] max-w-[640px] pt-[35px] pb-[72px]">
      <span className="eyebrow">Account</span>
      <h1 className="mt-2 mb-2 text-[clamp(31px,4vw,49px)] leading-[1.13] font-bold tracking-[-1.8px]">Device limit reached</h1>
      <p className="mb-6 text-muted">
        Your account can be used on up to two devices. To use this device, remove one of the devices below, then sign in
        again on this device.
      </p>
      <DeviceList devices={devices} />
      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
    <SiteFooter />
    </>
  )
}
