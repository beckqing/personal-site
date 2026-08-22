'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { BRAND_ICONS, type IconCategory } from '@/lib/brand-icons'
import { cn } from '@/lib/utils'

type CollageContextValue = {
  hovered: IconCategory | null
  setHovered: (category: IconCategory | null) => void
}

const CollageContext = createContext<CollageContextValue | null>(null)

function useCollage() {
  const ctx = useContext(CollageContext)
  if (!ctx) {
    throw new Error('CategoryWord/IconScatterField must be used inside HeroWordScatter')
  }
  return ctx
}

/** Wraps the hero content and shares hover state between the copy and the icon field. */
export function HeroWordScatter({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState<IconCategory | null>(null)
  const value = useMemo(() => ({ hovered, setHovered }), [hovered])
  return <CollageContext.Provider value={value}>{children}</CollageContext.Provider>
}

const CATEGORY_VAR: Record<IconCategory, string> = {
  art: 'var(--art)',
  hu: 'var(--writing)',
  sci: 'var(--science)',
}

// Deterministic PRNG so the "random" scatter renders identically on server and client.
function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DONUT_CENTER_X = 50
const DONUT_CENTER_Y = 50
// Inner/outer bounds of the ring band — icons are distributed across this
// range (3-4 icons deep) rather than sitting on one thin circle.
const DONUT_RADIUS_X_INNER = 30
const DONUT_RADIUS_X_OUTER = 48
const DONUT_RADIUS_Y_INNER = 28
const DONUT_RADIUS_Y_OUTER = 46

type PlacedIcon = {
  slug: string
  path: string
  viewBox: string
  categories: IconCategory[]
  top: number
  left: number
  size: number
  rotate: number
}

// Icons are distributed across a wide elliptical band (3-4 icons deep, not a
// single thin ring) so the copy keeps a quiet center. Placement uses
// blue-noise-style rejection sampling — each candidate spot is checked against
// already-placed icons and re-rolled if it's too close — so spacing stays
// generous and even while still reading as a loose, hand-scattered cloud.
const MIN_GAP_PERCENT = 8.5

const PLACED_ICONS: PlacedIcon[] = (() => {
  const rand = mulberry32(20240817)
  const icons = [...BRAND_ICONS]
  for (let i = icons.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[icons[i], icons[j]] = [icons[j], icons[i]]
  }

  const placed: { top: number; left: number }[] = []

  return icons.map((icon, i) => {
    // Spread base angles evenly around the ring, then let each icon wander
    // within its own slice so neighbors don't line up radially either.
    const baseAngle = (i / icons.length) * Math.PI * 2 - Math.PI / 2
    const size = 28 + rand() * 16
    const rotate = (rand() - 0.5) * 44

    let top = 50
    let left = 50
    const maxAttempts = 24
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = baseAngle + (rand() - 0.5) * ((Math.PI * 2) / icons.length) * 1.3
      const radiusT = rand() // 0 = inner edge of band, 1 = outer edge
      const rx = DONUT_RADIUS_X_INNER + radiusT * (DONUT_RADIUS_X_OUTER - DONUT_RADIUS_X_INNER)
      const ry = DONUT_RADIUS_Y_INNER + radiusT * (DONUT_RADIUS_Y_OUTER - DONUT_RADIUS_Y_INNER)
      const candidateTop = DONUT_CENTER_Y + Math.sin(angle) * ry
      const candidateLeft = DONUT_CENTER_X + Math.cos(angle) * rx

      const tooClose = placed.some(
        (p) => Math.hypot(p.top - candidateTop, p.left - candidateLeft) < MIN_GAP_PERCENT,
      )

      if (!tooClose || attempt === maxAttempts - 1) {
        top = candidateTop
        left = candidateLeft
        break
      }
    }

    placed.push({ top, left })

    return {
      slug: icon.slug,
      path: icon.path,
      viewBox: icon.viewBox,
      categories: icon.categories,
      top,
      left,
      size,
      rotate,
    }
  })
})()

export function IconScatterField({ className }: { className?: string }) {
  const { hovered } = useCollage()

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {PLACED_ICONS.map((icon) => {
        const isActive = hovered !== null && icon.categories.includes(hovered)
        const isDimmed = hovered !== null && !isActive

        return (
          <svg
            key={icon.slug}
            viewBox={icon.viewBox}
            className="absolute text-foreground/80 transition-all duration-500 ease-out"
            style={{
              top: `${icon.top}%`,
              left: `${icon.left}%`,
              width: icon.size,
              height: icon.size,
              transform: `translate(-50%, -50%) rotate(${icon.rotate}deg)`,
              opacity: isActive ? 0.95 : isDimmed ? 0.06 : 0.2,
              fill: isActive ? CATEGORY_VAR[hovered!] : 'currentColor',
            }}
          >
            <path d={icon.path} />
          </svg>
        )
      })}
    </div>
  )
}

export function CategoryWord({
  category,
  children,
}: {
  category: IconCategory
  children: ReactNode
}) {
  const { hovered, setHovered } = useCollage()
  const active = hovered === category

  return (
    <span
      onMouseEnter={() => setHovered(category)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(category)}
      onBlur={() => setHovered(null)}
      tabIndex={0}
      className="cursor-default underline decoration-dotted decoration-2 underline-offset-4 outline-none transition-colors duration-300"
      style={{
        textDecorationColor: CATEGORY_VAR[category],
        color: active ? CATEGORY_VAR[category] : undefined,
      }}
    >
      {children}
    </span>
  )
}
