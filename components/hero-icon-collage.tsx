'use client'

import Link from 'next/link'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { BRAND_ICONS, type IconCategory } from '@/lib/brand-icons'
import { cn } from '@/lib/utils'

type CollageContextValue = {
  hovered: IconCategory | null
  setHovered: (category: IconCategory | null) => void
}

const CollageContext = createContext<CollageContextValue | null>(null)

/** Shared hover state between the hero copy, the icon field, and (via the
 *  panels below the hero) any other element that wants to react to the same
 *  discipline being hovered. Must be used inside a HeroWordScatter. */
export function useCollage() {
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

// Matches the discipline tag each work item is filtered by on /work.
const CATEGORY_WORK_TAG: Record<IconCategory, string> = {
  art: 'art',
  hu: 'writing',
  sci: 'science',
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
const MIN_GAP_PERCENT = 7

// The hero is much wider than it is tall (roughly 1280x660 on a typical
// laptop, and wider still on bigger monitors), but icon positions are stored
// as top/left percentages of the container. A "7% gap" is far more physical
// pixels horizontally than vertically at that aspect, so comparing raw
// percentage distance under-spaces icons vertically (reads as clustered/
// overlapping) and over-spaces them horizontally (reads as gappy). Scaling
// the vertical delta by this reference aspect before measuring distance
// corrects for that skew.
const REFERENCE_ASPECT = 1.5

// Bigger icons need more clearance than the flat per-pair gap allows for, or
// two large icons placed right at the minimum distance visibly touch. This
// converts an icon's pixel size into roughly the same percent units as the
// gap check (assuming a ~1200px-wide hero, in line with the page's max-w-6xl
// content column), so each icon contributes its own radius to the required
// spacing.
function sizeToPercent(size: number) {
  return size / 24
}

function spacingDistance(
  a: { top: number; left: number },
  b: { top: number; left: number },
) {
  const dTop = (a.top - b.top) / REFERENCE_ASPECT
  const dLeft = a.left - b.left
  return Math.hypot(dTop, dLeft)
}

const PLACED_ICONS: PlacedIcon[] = (() => {
  const rand = mulberry32(20240817)
  const icons = [...BRAND_ICONS]
  for (let i = icons.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[icons[i], icons[j]] = [icons[j], icons[i]]
  }

  const placed: { top: number; left: number; size: number }[] = []

  return icons.map((icon, i) => {
    // Spread base angles evenly around the ring, then let each icon wander
    // within its own slice so neighbors don't line up radially either.
    const baseAngle = (i / icons.length) * Math.PI * 2 - Math.PI / 2
    const size = 28 + rand() * 16
    const rotate = (rand() - 0.5) * 44

    let top = 50
    let left = 50
    let bestTop = 50
    let bestLeft = 50
    let bestSlack = -Infinity
    const maxAttempts = 40
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = baseAngle + (rand() - 0.5) * ((Math.PI * 2) / icons.length) * 1.3
      const radiusT = rand() // 0 = inner edge of band, 1 = outer edge
      const rx = DONUT_RADIUS_X_INNER + radiusT * (DONUT_RADIUS_X_OUTER - DONUT_RADIUS_X_INNER)
      const ry = DONUT_RADIUS_Y_INNER + radiusT * (DONUT_RADIUS_Y_OUTER - DONUT_RADIUS_Y_INNER)
      const candidateTop = DONUT_CENTER_Y + Math.sin(angle) * ry
      const candidateLeft = DONUT_CENTER_X + Math.cos(angle) * rx
      const candidate = { top: candidateTop, left: candidateLeft }

      // Slack = how much spare room this spot has over the minimum required
      // gap to its closest already-placed neighbor (negative = overlapping).
      const slack =
        placed.length === 0
          ? Infinity
          : Math.min(
              ...placed.map(
                (p) =>
                  spacingDistance(candidate, p) -
                  (MIN_GAP_PERCENT + sizeToPercent(size) + sizeToPercent(p.size)),
              ),
            )

      if (slack > bestSlack) {
        bestSlack = slack
        bestTop = candidateTop
        bestLeft = candidateLeft
      }

      if (slack >= 0) {
        top = candidateTop
        left = candidateLeft
        break
      }

      if (attempt === maxAttempts - 1) {
        // Nothing cleared the minimum gap — use the least-bad candidate seen
        // rather than whatever the final random roll happened to be.
        top = bestTop
        left = bestLeft
      }
    }

    placed.push({ top, left, size })

    // Rounded to a few decimals so the value the browser stores after
    // parsing the server-rendered style attribute (which itself rounds)
    // matches what the client recomputes on hydration — full float precision
    // here caused a benign but noisy hydration mismatch warning.
    const round = (n: number) => Math.round(n * 1000) / 1000

    return {
      slug: icon.slug,
      path: icon.path,
      viewBox: icon.viewBox,
      categories: icon.categories,
      top: round(top),
      left: round(left),
      size: round(size),
      rotate: round(rotate),
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
    <Link
      href={`/work?tags=${CATEGORY_WORK_TAG[category]}`}
      onMouseEnter={() => setHovered(category)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(category)}
      onBlur={() => setHovered(null)}
      className="underline decoration-dotted decoration-2 underline-offset-4 outline-none transition-colors duration-300"
      style={{
        textDecorationColor: CATEGORY_VAR[category],
        color: active ? CATEGORY_VAR[category] : undefined,
      }}
    >
      {children}
    </Link>
  )
}
