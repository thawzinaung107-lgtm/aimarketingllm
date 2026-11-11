import { SignOutButton } from '@/components/site-chrome'
import { requireUser } from '@/lib/auth'
import { getMyDevices } from '@/lib/db-helpers'
import { DeviceList } from '@/components/device-list'

export default async function DeviceLimitPage() {
  const user = await requireUser()
  const devices = await getMyDevices(user.id)

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Device limit reached</h1>
      <p className="mb-6 text-gray-600">
        Your account can be used on up to two devices. To use this device, remove one of the devices below, then sign in
        again on this device.
      </p>
      <DeviceList devices={devices} />
      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  )
}
