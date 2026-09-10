'use client'

import { Children, useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Column count at `lg`, now reached at the `xs` breakpoint (~500px) — narrow-screen-columns spec §9.3. `base` (default 2) is the count below it. */
export type MasonryColumns = { lg: number; base?: number }

const DEFAULT_COLUMNS: MasonryColumns = { lg: 3 }

/** One boundary — `xs` (31.25rem/500px), the same width the home page's own regimes split on (§9.3 of narrow-screen-columns: "the site would carry exactly one narrow-screen boundary instead of two"). */
function columnQueries(columns: MasonryColumns) {
  return [{ query: '(min-width: 31.25rem)', columns: columns.lg }] as const
}

/** The live column count for a given `columns` config — exported so a caller (the gallery, for `PINNED`) can size itself to the same value the grid renders with. */
export function useMasonryColumns(columns: MasonryColumns = DEFAULT_COLUMNS): number {
  const base = columns.base ?? 2
  // Starts at the widest layout so the server render and the first client
  // render agree; the effect corrects it on mount for narrower viewports.
  const [count, setCount] = useState<number>(columns.lg)

  useEffect(() => {
    const queries = columnQueries(columns).map((c) => ({ columns: c.columns, mql: window.matchMedia(c.query) }))
    const sync = () => setCount(queries.find((q) => q.mql.matches)?.columns ?? base)
    sync()
    for (const { mql } of queries) mql.addEventListener('change', sync)
    return () => {
      for (const { mql } of queries) mql.removeEventListener('change', sync)
    }
    // Depend on primitives, not `columns` itself — callers often pass a fresh
    // object literal (e.g. `{ lg: 2 }`) on every render, which would
    // otherwise tear down and re-add these listeners on every parent render.
  }, [columns.lg, base])

  return count
}

/**
 * Masonry that reads left → right, top → bottom.
 *
 * CSS `columns` fills each column all the way down before starting the next,
 * so reading down the left edge gets you the first third of the list and the
 * item visually beside it is a third of the way in. Dealing items round-robin
 * into flex columns instead puts 1,2,3 across the top, 4,5,6 under them, and
 * so on. Columns no longer end at matched heights — that's the trade for the
 * order matching how the page actually reads.
 */
export function MasonryGrid({
  children,
  className,
  columns = DEFAULT_COLUMNS,
  pinned,
}: {
  children: ReactNode
  className?: string
  /** Column count at `lg` — 3 for image grids, 2 for `illustrated` collections, whose verse needs more measure than a third of the page gives it. */
  columns?: MasonryColumns
  /** One child per column, head-of-column, left to right — see docs/specs/2026-09-tiers-and-pins.md §3.5. Optional; unset (the home page's and collection pages' calls) behaves exactly as before. */
  pinned?: ReactNode
}) {
  const columnCount = useMasonryColumns(columns)
  const base = columns.base ?? 2

  const cols: ReactNode[][] = Array.from({ length: columnCount }, () => [])
  Children.toArray(children).forEach((child, i) => {
    cols[i % columnCount].push(child)
  })

  // `slice` is defensive — callers are expected to already cap at
  // columnCount, but this component must not be the one that trusts a
  // caller and then writes past the end of `cols`.
  const heads = Children.toArray(pinned).slice(0, columnCount)
  heads.forEach((child, i) => cols[i].unshift(child))

  return (
    // Widths come from the responsive template rather than columnCount, so a
    // pre-hydration render is still laid out correctly for its viewport.
    // Tailwind's scanner needs literal classes, so both column counts are
    // written out in full rather than interpolated.
    <div
      className={cn(
        // gap-2/xs:gap-4/sm:gap-6, a step tighter than the page's own
        // px-3/xs:px-5/sm:px-8 gutter at each step, so the gap between cards
        // stays narrower than the gap between a card and the page edge.
        // Kept on its own viewport scale (§9.3 of narrow-screen-columns):
        // it's tuned to the *page's* gutter, not a fact about a column, so
        // it doesn't move with the column-count breakpoint below.
        'grid gap-2 xs:gap-4 sm:gap-6',
        base === 1 ? 'grid-cols-1' : 'grid-cols-2',
        columns.lg === 2 ? 'xs:grid-cols-2' : 'xs:grid-cols-3',
        className,
      )}
    >
      {cols.map((column, i) => (
        // @container/card (§9.3): names this column so a card inside it can
        // dress itself by its own width instead of the viewport's — see
        // work-gallery.tsx's TextCard/HybridCard, work-visuals.tsx's
        // CollectionMark/WorkPlaceholder/VerseBlock/TextCardFace, and
        // globals.css's .deck-card/.deck-reserve. min-w-0: a grid track
        // can't shrink below its content's min-content width by default,
        // and a card's title row (WorkCard, work-gallery.tsx) can
        // out-measure a narrow column — §9.2 of the narrow-screen-columns
        // spec. `container-type: inline-size` (from @container/card) already
        // zeroes this column's min-content contribution, but min-w-0 stays
        // anyway: it costs one class and keeps working if the container is
        // ever removed. Without it the whole grid (and with it the page)
        // overflows its viewport and gets scaled down to fit, rather than
        // showing a scrollbar.
        <div key={i} className="@container/card flex min-w-0 flex-col gap-2 xs:gap-4 sm:gap-6">
          {column}
        </div>
      ))}
    </div>
  )
}
