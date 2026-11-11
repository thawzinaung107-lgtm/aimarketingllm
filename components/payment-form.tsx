'use client'
import { useState } from 'react'
import Link from 'next/link'
export function PaymentForm({ courseId, enabled }: { courseId: string; enabled: boolean }) {
  const [pending,setPending] = useState(false)
  const [message,setMessage] = useState('')
  const [success,setSuccess] = useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setMessage('')
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/payments', { method: 'POST', body: form })
      const body = await res.json()
      setSuccess(res.ok); setMessage(res.ok ? body.message : body.error)
    } catch { setMessage('Network error. Check Payment review before retrying to avoid duplicate submissions.') }
    finally { setPending(false) }
  }
  return <form onSubmit={submit}><fieldset disabled={!enabled || pending || success}><input type="hidden" name="courseId" value={courseId} /><label className="block text-xs font-semibold">Amount paid<input name="amount" type="number" min="0" max="99999999" step="0.01" className="field" required /></label><label className="block text-xs font-semibold">Transaction reference<input name="reference" maxLength={200} className="field" required /></label><label className="block text-xs font-semibold">Receipt image (JPEG, PNG or WebP; up to 5 MB)<input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" className="field" required /></label><button className="btn" type="submit">{pending ? 'Uploading…' : 'Submit for verification →'}</button></fieldset>{message && <p className="mt-4" role={success ? 'status' : 'alert'}>{message}</p>}{success && <Link className="btn btn-alt mt-4" href="/payments">View payment status</Link>}</form>
}
