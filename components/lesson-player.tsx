'use client'
import { useEffect, useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
export function LessonPlayer({ lessonId, initialPosition = 0, completed = false }: { lessonId: string; initialPosition?: number; completed?: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const lastSaved = useRef(0)
  const resume = useRef(initialPosition)
  const [position,setPosition] = useState(initialPosition)
  const [grant,setGrant] = useState<{ url: string; expiresAt: string } | null>(null)
  const [status,setStatus] = useState('Ready to play')
  const [busy,setBusy] = useState(false)
  const [done,setDone] = useState(completed)
  const [saveError,setSaveError] = useState('')
  useEffect(() => {
    if (!grant) return
    const timer = setTimeout(() => {
      if (video.current) { resume.current = video.current.currentTime; setPosition(resume.current); video.current.pause() }
      setGrant(null); setStatus('Playback authorization expired. Continue to verify access again.')
    }, Math.max(0, Date.parse(grant.expiresAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [grant])
  async function play() {
    setBusy(true); setStatus('Loading video…')
    try {
      const res = await fetch(`/api/lessons/${lessonId}/playback`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setStatus(data.error || 'Video unavailable'); setGrant(null); return }
      setGrant(data); setStatus('Ready to play')
    } catch { setStatus('Network error. Check your connection and try again.') }
    finally { setBusy(false) }
  }
  async function save(isCompleted = false) {
    const seconds = Math.floor(video.current?.currentTime ?? resume.current)
    resume.current = seconds
    setPosition(seconds)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seconds, completed: isCompleted }) })
      if (!res.ok) { setSaveError('Progress could not be saved. Check your access and connection.'); return }
      setSaveError(''); if (isCompleted) setDone(true)
    } catch { setSaveError('Network error. Progress has not been saved.') }
  }
  return <section aria-label="Lesson player"><div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-[#151719] text-white">
    {grant ? <video ref={video} src={grant.url} controls playsInline preload="metadata" className="h-full w-full" onLoadedMetadata={() => { if (video.current) video.current.currentTime = Math.min(resume.current, Number.isFinite(video.current.duration) ? video.current.duration : resume.current) }} onWaiting={() => setStatus('Loading / buffering…')} onPlaying={() => setStatus('Playing')} onError={() => { setStatus('Network error or playback link expired. Retry to verify access.'); setGrant(null) }} onPause={() => { void save() }} onTimeUpdate={() => { if (Date.now() - lastSaved.current > 15000) { lastSaved.current = Date.now(); void save() } }} onEnded={() => { void save(true) }} /> : <div className="p-5 text-center"><Play className="mx-auto mb-3" size={32} aria-hidden="true" /><p className="mb-4" role="status">{status}</p><button className="btn btn-light" disabled={busy} onClick={play}>{busy ? 'Loading…' : position > 0 ? `Resume watching at ${Math.floor(position / 60)}:${String(Math.floor(position % 60)).padStart(2,'0')}` : 'Play lesson'}</button></div>}
    </div>{grant && <p className="mt-3 text-sm text-muted" role="status">{status}</p>}{done && <p className="mt-3 font-semibold" role="status">Lesson completed</p>}{saveError && <p role="alert" className="mt-3">{saveError} <button className="btn btn-alt" onClick={() => { void save() }}><RotateCcw size={14} aria-hidden="true" />Retry saving</button></p>}</section>
}
