'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export interface PromoSlide {
  id: string
  eyebrow: string | null
  title: string
  description: string | null
  image_url: string
  link_url: string | null
}

const AUTOPLAY_MS = 6000

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const getReducedMotionServer = () => false

/**
 * Option 2 V3 promotion banner: dark hero card with copy left / photo right,
 * and a control row underneath (counter, dots, autoplay label, pause, prev, next).
 *
 * Autoplay pauses when: the user presses pause, the pointer is over the
 * banner, keyboard focus is inside it, the tab is hidden, or the user prefers
 * reduced motion.
 */
export function PromotionalCarousel({ slides }: { slides: PromoSlide[] }) {
  const count = slides.length
  const [index, setIndex] = useState(0)
  // null = follow the reduced-motion preference; true/false = explicit user choice.
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer)

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count])

  // Reduced-motion users start paused but can explicitly press play.
  const playing = userPlaying ?? !reducedMotion
  const running = playing && !hovered && !focused && !tabHidden && count > 1

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden)
    onVis()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => go(index + 1), AUTOPLAY_MS)
    return () => clearTimeout(t)
  }, [running, index, go])

  if (count === 0) return null
  const slide = slides[index % count]
  const pad = (n: number) => String(n).padStart(2, '0')

  function togglePlay() {
    setUserPlaying(!playing)
  }

  return (
    <section aria-roledescription="carousel" aria-label="Promotions"
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false) }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); go(index + (e.key === 'ArrowLeft' ? -1 : 1)) }
      }}>
      <div
        className="grid min-h-[385px] overflow-hidden rounded-[18px] bg-hero text-white max-[800px]:grid-cols-1 min-[801px]:grid-cols-[1fr_47%]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
        }}
      >
        <div
          className="flex flex-col items-start justify-center px-[25px] py-9 min-[801px]:px-[46px] min-[801px]:py-[55px]"
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${count}`}
          aria-live={running ? 'off' : 'polite'}
        >
          {slide.eyebrow && (
            <span className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#b8bec6]">{slide.eyebrow}</span>
          )}
          <h1 className="mt-3.5 mb-4 max-w-[490px] text-[33px] leading-[1.13] font-bold tracking-[-1.8px] min-[481px]:text-[clamp(31px,3.5vw,48px)]">
            {slide.title}
          </h1>
          {slide.description && <p className="mb-4 max-w-[450px] text-[15px] text-[#c7cbd0]">{slide.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2.5">
            <Link href={slide.link_url ?? '/courses'} className="btn btn-light">
              Browse courses →
            </Link>
            <Link href="/how-it-works" className="btn btn-alt">
              How it works
            </Link>
          </div>
        </div>
        <div className="relative min-h-[230px] min-[801px]:min-h-[350px]">
          {slides.map((s, i) => (
            <Image
              key={s.id}
              src={s.image_url}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 800px) 100vw, 580px"
              className={`object-cover saturate-[.82] transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,#17191c,transparent_40%)] min-[801px]:bg-[linear-gradient(90deg,#17191c_0%,transparent_30%)]"
          />
        </div>
      </div>

      {count > 1 && (
        <div className="flex items-center justify-between px-1 pt-4">
          <div className="flex items-center gap-3">
            <strong className="text-xs text-muted" aria-hidden="true">
              {pad(index + 1)} / {pad(count)}
            </strong>
            <div className="flex gap-[7px]" role="group" aria-label="Choose slide">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}: ${s.title}`}
                  aria-current={i === index}
                  className={`h-[9px] rounded-full p-0 transition-all ${i === index ? 'w-[25px] bg-[#191a1d]' : 'w-[9px] bg-line-strong'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-[9px]">
            <span className="text-xs text-muted max-[480px]:hidden">Autoplay · 6s</span>
            <button type="button" className="icon-btn" onClick={togglePlay} aria-label={playing ? 'Pause autoplay' : 'Resume autoplay'}>
              <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
            </button>
            <button type="button" className="icon-btn" onClick={() => go(index - 1)} aria-label="Previous slide">
              <span aria-hidden="true">‹</span>
            </button>
            <button type="button" className="icon-btn" onClick={() => go(index + 1)} aria-label="Next slide">
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
