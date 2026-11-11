import { describe, expect, it } from 'vitest'
import { http, serviceClient } from './helpers'

/** Text a visitor sees: strip scripts (React flight data uses "$1" tokens), styles and tags. */
function visibleText(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
}

describe('homepage (Option 2 V3)', () => {
  it('renders the default promotion slides, catalogue and steps when the CMS is empty', async () => {
    const res = await http('/')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Find your next opportunity')
    expect(html).toContain('Courses built for real-world skills')
    expect(html).toContain('A simple path to better skills.')
    expect(html).toContain('aria-label="Pause autoplay"')
    expect(html).toContain('aria-label="Previous slide"')
    expect(html).toContain('aria-label="Next slide"')
    expect(visibleText(html)).not.toMatch(/\$\s?\d/) // no invented USD prices
  })

  it('shows CMS banners instead of defaults, and only published courses with configured prices', async () => {
    const admin = serviceClient()
    const tag = `IT-${Date.now()}`
    const { data: banner } = await admin
      .from('homepage_banners')
      .insert({ title: `${tag} banner`, eyebrow: 'Test', image_url: '/images/design/content-creator.jpg', link_url: '/courses' })
      .select('id').single()
    const { data: pub } = await admin
      .from('courses')
      .insert({ title: `${tag} published`, slug: `${tag}-pub`.toLowerCase(), price: 1000, currency: 'MMK', access_duration_days: 30, is_published: true, category: 'AI Marketing' })
      .select('id').single()
    const { data: draft } = await admin
      .from('courses').insert({ title: `${tag} draft`, slug: `${tag}-draft`.toLowerCase() }).select('id').single()
    try {
      const html = await (await http('/')).text()
      expect(html).toContain(`${tag} banner`)
      expect(html).not.toContain('Find your next opportunity')
      expect(html).toContain(`${tag} published`)
      expect(html).toMatch(/MMK\s?1,000/)
      expect(html).not.toContain(`${tag} draft`)
      const catalog = await (await http('/courses')).text()
      expect(catalog).toContain(`${tag} published`)
    } finally {
      await admin.from('homepage_banners').delete().eq('id', banner!.id)
      await admin.from('courses').delete().in('id', [pub!.id, draft!.id])
    }
  })
})
