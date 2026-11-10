'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

interface Banner {
  id: string
  title: string
  description: string | null
  image_url: string
  link_url: string | null
}

interface CarouselProps {
  banners: Banner[]
  autoplayInterval?: number
}

export function PromotionalCarousel({ banners, autoplayInterval = 6000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
  }, [banners.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length)
  }, [banners.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  // Autoplay functionality
  useEffect(() => {
    if (!isPlaying || isPaused || banners.length <= 1) return

    const interval = setInterval(nextSlide, autoplayInterval)
    return () => clearInterval(interval)
  }, [isPlaying, isPaused, autoplayInterval, nextSlide, banners.length])

  // Pause on hover
  const handleMouseEnter = () => setIsPaused(true)
  const handleMouseLeave = () => setIsPaused(false)

  // Respect reduced motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => {
      if (mediaQuery.matches) {
        setIsPlaying(false)
      }
    }

    // Check initial state
    handleChange()

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  if (banners.length === 0) {
    return null
  }

  if (banners.length === 1) {
    const banner = banners[0]
    return (
      <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden">
        <div className="relative aspect-[21/9]">
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                  {banner.title}
                </h2>
                {banner.description && (
                  <p className="text-lg md:text-xl text-gray-200 mb-6">
                    {banner.description}
                  </p>
                )}
                {banner.link_url && (
                  <a
                    href={banner.link_url}
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Learn More
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative w-full bg-gray-900 rounded-lg overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Promotional carousel"
    >
      {/* Slides */}
      <div className="relative aspect-[21/9]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={index !== currentIndex}
          >
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                <div className="max-w-2xl">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                    {banner.title}
                  </h2>
                  {banner.description && (
                    <p className="text-lg md:text-xl text-gray-200 mb-6">
                      {banner.description}
                    </p>
                  )}
                  {banner.link_url && (
                    <a
                      href={banner.link_url}
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      tabIndex={index === currentIndex ? 0 : -1}
                    >
                      Learn More
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Previous Button */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-900" />
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-900" />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="absolute bottom-4 left-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-gray-900" />
        ) : (
          <Play className="w-5 h-5 text-gray-900" />
        )}
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex}
          />
        ))}
      </div>
    </div>
  )
}
