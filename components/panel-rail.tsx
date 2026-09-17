'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PanelRef } from '@/components/panels'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The dot rail — position, not contents (§7). One `IntersectionObserver`,
 * created once, watching every panel; ties in the ~10% centre band resolve
 * to the last panel in document order so scrolling down always advances
 * (§7.3). `scrollIntoView`'s `behavior` is read from `matchMedia` at click
 * time rather than left to CSS `scroll-behavior`, which the explicit
 * `behavior` argument overrides anyway (§7.4).
 */
export function PanelRail({ panels }: { panels: PanelRef[] }) {
  const [activeId, setActiveId] = useState<string | null>(panels[0]?.id ?? null)

  useEffect(() => {
    if (panels.length === 0) return
    const elements = panels
      .map((p) => document.getElementById(p.id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const intersecting = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id)
          else intersecting.delete(entry.target.id)
        }
        if (intersecting.size === 0) return
        let last: string | null = null
        for (const p of panels) {
          if (intersecting.has(p.id)) last = p.id
        }
        if (last) setActiveId(last)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [panels])

  if (panels.length === 0) return null

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="Panel progress"
      className="fixed right-7 top-1/2 z-40 hidden -translate-y-1/2 xl:flex xl:flex-col xl:items-center xl:gap-3"
    >
      {panels.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => goTo(p.id)}
          aria-label={p.title}
          aria-current={activeId === p.id ? 'true' : undefined}
          className="group relative flex h-10 w-10 items-center justify-center outline-none"
        >
          <span
            className="h-2 w-2 rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring"
            style={{ backgroundColor: activeId === p.id ? 'var(--essay-accent, var(--foreground))' : 'var(--border)' }}
            aria-hidden="true"
          />
          <span
            className={cn(
              'pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md border border-border bg-background/90 px-2 py-1 font-brand text-xs lowercase text-foreground opacity-0 backdrop-blur-sm transition-opacity',
              'group-hover:opacity-100 group-focus-visible:opacity-100',
            )}
          >
            {p.title}
          </span>
        </button>
      ))}
    </nav>
  )
}
