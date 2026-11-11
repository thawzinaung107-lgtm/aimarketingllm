import type { PromoSlide } from '@/components/promotional-carousel'

/**
 * Fallback slides shown only when no banners are configured in the CMS.
 * Copy and photos are taken verbatim from the Option 2 V3 design file.
 * They make no offers or price claims ("confirmed offers will appear here").
 */
export const DEFAULT_PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'default-1',
    eyebrow: 'Deals & updates',
    title: 'Find your next opportunity',
    description: 'Course news and confirmed offers will appear here.',
    image_url: '/images/design/learners-collaborating.jpg',
    link_url: '/courses',
  },
  {
    id: 'default-2',
    eyebrow: 'Learn at your pace',
    title: 'Build practical AI skills',
    description: 'Explore clear lessons and tools for real-world marketing work.',
    image_url: '/images/design/content-creator.jpg',
    link_url: '/courses',
  },
  {
    id: 'default-3',
    eyebrow: 'New course highlights',
    title: 'Create with confidence',
    description: 'Learn AI-powered content workflows through focused lessons.',
    image_url: '/images/design/learners-collaborating.jpg',
    link_url: '/courses',
  },
]

/** Steps shown in "How learning works" (Option 2 V3 copy). */
export const LEARNING_STEPS: { title: string; body: string }[] = [
  { title: 'Sign in with Google', body: 'Use your Google account to enter the academy.' },
  { title: 'Complete manual payment', body: 'Follow the official payment instructions.' },
  { title: 'Redeem a code', body: 'Use your approved code to unlock learning.' },
  { title: 'Learn at your pace', body: 'Track your progress and resume where you left off.' },
]
