'use client'

import { useEffect, useId, useState, useRef } from 'react'

/** Desktop: inline nav. ≤800px: "☰" toggles a drop-down panel (Option 2 V3). */
export function MobileNavigation({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        ref={toggle}
        type="button"
        className="ml-auto rounded-lg border border-[#ddd] bg-white px-[11px] py-[7px] min-[1101px]:hidden"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>
      <nav
        id={id}
        aria-label="Main navigation"
        // Close the panel when any link inside it is followed.
        onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}
        className={`ml-auto items-center gap-[27px] min-[1101px]:flex max-[1100px]:absolute max-[1100px]:top-[68px] max-[1100px]:right-0 max-[1100px]:left-0 max-[1100px]:z-10 max-[1100px]:flex-col max-[1100px]:items-start max-[1100px]:border-b max-[1100px]:border-line max-[1100px]:bg-white max-[1100px]:p-5 max-[1100px]:shadow-[0_15px_20px_#0001] ${
          open ? 'max-[1100px]:flex' : 'max-[1100px]:hidden'
        }`}
      >
        {children}
      </nav>
    </>
  )
}

export const MobileNavToggle = MobileNavigation
