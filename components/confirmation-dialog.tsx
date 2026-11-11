'use client'
import { useId, useRef } from 'react'
export function ConfirmationDialog({ label, message, onConfirm, disabled = false }: { label: string; message: string; onConfirm: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  return <><button className="btn btn-alt" type="button" disabled={disabled} onClick={() => ref.current?.showModal()}>{label}</button><dialog ref={ref} aria-labelledby={id} className="m-auto w-[min(440px,90vw)] rounded-2xl border border-line p-7 backdrop:bg-black/50"><h2 id={id} className="text-xl font-bold">Confirm action</h2><p className="my-4 text-muted">{message}</p><div className="flex flex-wrap gap-3"><button className="btn btn-alt" type="button" autoFocus onClick={() => ref.current?.close()}>Cancel</button><button className="btn" type="button" onClick={() => { ref.current?.close(); onConfirm() }}>{label}</button></div></dialog></>
}
