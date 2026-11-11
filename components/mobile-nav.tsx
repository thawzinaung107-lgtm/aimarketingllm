'use client'

import { useEffect, useId, useState } from 'react'

/** Desktop: inline nav. ≤800px: "☰" toggles a drop-down panel (Option 2 V3). */
export function MobileNavToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="ml-auto rounded-lg border border-[#ddd] bg-white px-[11px] py-[7px] min-[801px]:hidden"
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
        className={`ml-auto items-center gap-[27px] min-[801px]:flex max-[800px]:absolute max-[800px]:top-[68px] max-[800px]:right-0 max-[800px]:left-0 max-[800px]:z-10 max-[800px]:flex-col max-[800px]:items-start max-[800px]:border-b max-[800px]:border-line max-[800px]:bg-white max-[800px]:p-5 max-[800px]:shadow-[0_15px_20px_#0001] ${
          open ? 'max-[800px]:flex' : 'max-[800px]:hidden'
        }`}
      >
        {children}
      </nav>
    </>
  )
}
