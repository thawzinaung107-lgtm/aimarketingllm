'use client'
import { ErrorState } from '@/components/states'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="wrap w-full space-y-5 py-12"><ErrorState /><button className="btn" onClick={reset}>Try again</button></main>
}
