import Link from 'next/link'
import { Check, Play } from 'lucide-react'
export function LessonNavigation({ courseId, lessons, current, completed = [] }: { courseId: string; lessons: { id: string; title: string }[]; current?: string; completed?: string[] }) {
  return <nav className="panel" aria-label="Course lessons"><h2 className="mb-4 text-lg font-bold">Course lessons</h2><ol className="space-y-3">{lessons.map((l,i) => <li key={l.id}><Link href={`/learn/${courseId}/${l.id}`} aria-current={current === l.id ? 'page' : undefined} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${current === l.id ? 'border-black bg-soft' : 'border-line'}`}><span>{String(i+1).padStart(2,'0')} · {l.title}</span>{completed.includes(l.id) ? <Check size={16} aria-label="Completed" /> : <Play size={16} aria-hidden="true" />}</Link></li>)}</ol></nav>
}
