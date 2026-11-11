import { HowLearningWorks } from '@/components/how-learning-works'
import { SiteFooter, SiteHeader } from '@/components/site-chrome'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: 'How it works · AI Marketing Academy' }

export default async function HowItWorksPage() {
  const user = await getCurrentUser()
  return (
    <>
      <SiteHeader user={user} />
      <main className="wrap min-h-[70vh] pb-[72px]">
        <HowLearningWorks headingLevel="h1" />
      </main>
      <SiteFooter />
    </>
  )
}
