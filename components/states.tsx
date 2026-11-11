import { AlertCircle, LoaderCircle, BookOpen } from 'lucide-react'
export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return <div className="panel flex items-center gap-3" role="status"><LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{message}</div>
}
export function EmptyState({ title = 'Nothing here yet', children }: { title?: string; children?: React.ReactNode }) {
  return <div className="panel space-y-3 text-center"><BookOpen className="mx-auto text-muted" aria-hidden="true" /><h2 className="text-xl font-semibold">{title}</h2><div className="text-muted">{children}</div></div>
}
export function ErrorState({ message = 'We could not load this information. Please try again.' }: { message?: string }) {
  return <div className="panel flex items-start gap-3" role="alert"><AlertCircle className="shrink-0" aria-hidden="true" /><p>{message}</p></div>
}
