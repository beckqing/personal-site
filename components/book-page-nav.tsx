'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Invisible helper for chapbook pages: left/right arrow keys turn the page,
 * like flipping through a real book. Ignored while typing in a form field.
 * A missing side (the book's first or last page) no-ops instead of turning.
 */
export function BookPageNav({ prevHref, nextHref }: { prevHref?: string | null; nextHref?: string | null }) {
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'ArrowLeft' && prevHref) router.push(prevHref)
      else if (event.key === 'ArrowRight' && nextHref) router.push(nextHref)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [prevHref, nextHref, router])

  return null
}
