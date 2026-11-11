import Link from 'next/link'
import { CourseCatalog } from '@/components/course-catalog'
import { PromotionalCarousel, type PromoSlide } from '@/components/promotional-carousel'
import { SiteFooter, SiteHeader } from '@/components/site-chrome'
import { getCurrentUser } from '@/lib/auth'
import { getActiveHomepageBanners, getPublishedCourses } from '@/lib/db-helpers'
import { DEFAULT_PROMO_SLIDES } from '@/lib/promotions'
import { HowLearningWorks } from '@/components/how-learning-works'

/**
 * Homepage, built from the Option 2 V3 design file
 * (AI_Marketing_LMS_Option2_V3_English_Standalone_Preview.html):
 * promotion banner → course search/cards → how learning works → CTA.
 */
export default async function Home() {
  const [user, banners, courses] = await Promise.all([getCurrentUser(), getActiveHomepageBanners(), getPublishedCourses()])
  const slides: PromoSlide[] = banners.length > 0 ? banners : DEFAULT_PROMO_SLIDES

  return (
    <>
      <SiteHeader user={user} />
      <main className="wrap min-h-[70vh] pt-[35px] pb-[72px]">
        <PromotionalCarousel slides={slides} />

        <section className="pt-[49px] min-[801px]:pt-[74px]" aria-labelledby="browse-heading">
          <div className="mb-[23px]">
            <span className="eyebrow">Browse courses</span>
            <h2 id="browse-heading" className="mt-[7px] mb-2 text-[clamp(24px,3vw,34px)] leading-[1.22] font-bold tracking-[-1.1px]">
              Courses built for real-world skills
            </h2>
            <p className="m-0 max-w-[610px] text-muted">Choose the skills you want to build.</p>
          </div>
          <CourseCatalog courses={courses} />
        </section>

        <HowLearningWorks />

        <div className="mt-[70px] flex items-center justify-between gap-6 rounded-[17px] bg-soft-2 p-7 max-[800px]:block min-[801px]:p-10">
          <div>
            <span className="eyebrow">Start learning</span>
            <h2 className="my-2 text-[clamp(24px,3vw,34px)] leading-[1.22] font-bold tracking-[-1.1px]">A focused place to learn.</h2>
            <p className="text-muted">
              Organized lessons, progress tracking, limited-term access and up to two registered devices.
            </p>
          </div>
          <Link href="/courses" className="btn max-[800px]:mt-2.5">
            Explore courses →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
