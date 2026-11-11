'use client'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { initialActionState, type ActionState } from '@/lib/validation'
export function ActionForm({ action, children, submit = 'Save', disabled = false }: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>; children: React.ReactNode; submit?: string; disabled?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState)
  return <form action={formAction} className="space-y-3"><fieldset disabled={pending || disabled} className="min-w-0 space-y-3">{children}<Button type="submit">{pending ? 'Saving…' : submit}</Button></fieldset>{state.message && <p role={state.ok ? 'status' : 'alert'} className="rounded-lg border border-line bg-soft p-3">{state.message}</p>}{state.codes && <div className="rounded-lg border border-line p-3"><p>Copy these codes now. They cannot be retrieved again.</p><pre className="overflow-x-auto">{state.codes.join('\n')}</pre></div>}</form>
}
