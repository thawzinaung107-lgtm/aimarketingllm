import { StudentShell } from '@/components/student-shell'
import { DeviceList } from '@/components/device-list'
import { requireUser } from '@/lib/auth'
import { getMyDevices } from '@/lib/db-helpers'
export default async function DevicesPage() {
  const user = await requireUser('/profile/devices')
  return <StudentShell title="Device management" path="/profile/devices"><p className="mb-5 text-muted">Up to two registered devices per account. Removing a device signs out its sessions.</p><DeviceList devices={await getMyDevices(user.id)} /></StudentShell>
}
