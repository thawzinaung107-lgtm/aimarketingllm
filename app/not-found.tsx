import Link from 'next/link'
export default function NotFound() {
  return <main className="wrap py-20"><span className="eyebrow">Page not found</span><h1 className="page-title">We couldn’t find that page.</h1><p className="mb-6 text-muted">The course may not be published, or the link may have changed.</p><Link className="btn" href="/courses">Browse courses</Link></main>
}
