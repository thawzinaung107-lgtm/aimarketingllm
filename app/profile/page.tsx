import { requireAuth } from '@/lib/auth'
import { LogoutButton } from '@/components/auth-buttons'
import { getUserDevices } from '@/lib/db-helpers'
import Link from 'next/link'

export default async function ProfilePage() {
  const user = await requireAuth()
  const devices = await getUserDevices(user.id)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                AI Marketing LMS
              </Link>
              <nav className="flex items-center gap-6">
                <Link
                  href="/my-courses"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  My Courses
                </Link>
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Browse Courses
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-lg text-gray-600">Manage your account settings</p>
        </div>

        {/* Profile Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-base text-gray-900 mt-1">
                {user.full_name || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-base text-gray-900 mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="text-base text-gray-900 mt-1 capitalize">
                {user.role}
              </dd>
            </div>
          </dl>
        </div>

        {/* Registered Devices */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Registered Devices
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            You can access your courses on up to 2 devices. Remove a device to
            register a new one.
          </p>
          {devices.length === 0 ? (
            <p className="text-gray-500 text-sm">No devices registered yet.</p>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {device.device_name || 'Unknown Device'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Last used: {new Date(device.last_used_at).toLocaleString()}
                    </p>
                  </div>
                  <form action="/api/devices/remove" method="POST">
                    <input type="hidden" name="device_id" value={device.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-600">
            © 2024 AI Marketing LMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
