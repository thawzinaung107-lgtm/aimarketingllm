'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ConfirmationDialog } from '@/components/confirmation-dialog'

interface Device {
  id: string
  device_name: string | null
  last_used_at: string
}

export function DeviceList({ devices }: { devices: Device[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function remove(id: string) {
    setError(null)
    setPendingId(id)
    let res: Response
    try { res = await fetch(`/api/devices/${id}`, { method: 'DELETE' }) } catch { setPendingId(null); setError('Network error. Please try again.'); return }
    setPendingId(null)
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? 'Could not remove the device.')
      return
    }
    startTransition(() => router.refresh())
  }

  if (devices.length === 0) return <p className="text-sm text-muted">No devices registered yet.</p>

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {devices.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-lg border border-[#e6e8eb] px-[15px] py-[13px]">
          <div>
            <p className="font-medium">{d.device_name || 'Unknown device'}</p>
            <p className="text-sm text-muted">Last used {new Date(d.last_used_at).toLocaleString('en')}</p>
          </div>
          <ConfirmationDialog label={pendingId === d.id ? 'Removing…' : 'Remove'} message="Remove this device? It will be signed out." disabled={pendingId !== null} onConfirm={() => { void remove(d.id) }} />
        </div>
      ))}
    </div>
  )
}
