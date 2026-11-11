import { ActionForm } from '@/components/action-form'
import { redeemAction } from '@/app/student-actions'
export function RedeemForm({ enabled }: { enabled: boolean }) {
  return <div className="panel max-w-[600px]"><p className="mb-4 text-muted">Enter the course code provided by the academy.</p><ActionForm action={redeemAction} submit="Activate course →" disabled={!enabled}><label className="block text-xs font-semibold">Redeem code<input className="field" name="code" required maxLength={80} autoComplete="off" autoCapitalize="characters" spellCheck={false} /></label></ActionForm>{!enabled && <p className="mt-4 text-muted">Code activation is awaiting security verification.</p>}</div>
}
