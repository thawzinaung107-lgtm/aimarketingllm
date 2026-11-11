import { expect, it } from 'vitest'
import { DEFAULT_PROMO_SLIDES, homepageSlides } from '@/lib/promotions'
it('always supplies exactly three slides using CMS entries first and neutral fallbacks only',()=>{
  expect(homepageSlides([])).toHaveLength(3)
  const cms={...DEFAULT_PROMO_SLIDES[0],id:'cms',title:'Confirmed announcement'}
  expect(homepageSlides([cms])).toHaveLength(3)
  expect(homepageSlides([cms])[0]).toBe(cms)
  expect(homepageSlides([cms])[1].title).toBe(DEFAULT_PROMO_SLIDES[1].title)
  expect(homepageSlides([cms,cms,cms,cms])).toHaveLength(3)
})
