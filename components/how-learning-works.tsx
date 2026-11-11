import { LEARNING_STEPS } from '@/lib/promotions'

export function HowLearningWorks({ headingLevel = 'h2' }: { headingLevel?: 'h1' | 'h2' }) {
  const Heading = headingLevel
  return (
    <section className="pt-[49px] min-[801px]:pt-[74px]" aria-labelledby="how-heading">
      <span className="eyebrow">How learning works</span>
      <Heading id="how-heading" className="mt-[7px] mb-2 text-[clamp(24px,3vw,34px)] leading-[1.22] font-bold tracking-[-1.1px]">
        A simple path to better skills.
      </Heading>
      <p className="text-muted">Submit payment for review, or redeem a valid code to unlock your course.</p>
      <ol className="mt-4 grid list-none grid-cols-1 gap-3.5 p-0 min-[481px]:grid-cols-2 min-[801px]:grid-cols-4">
        {LEARNING_STEPS.map((s, i) => (
          <li key={s.title} className="rounded-[13px] border border-line p-[22px]">
            <span className="text-xs font-extrabold text-[#a3a8ad]">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-[18px] mb-[7px] text-[15px] font-bold tracking-[-.4px]">{s.title}</h3>
            <p className="m-0 text-xs text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
