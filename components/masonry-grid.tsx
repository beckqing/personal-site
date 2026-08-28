'use client'

import { Children, useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Column count at `lg`; `sm` always gets 2 (or `lg`'s count, if lower), and narrower always gets 1. */
export type MasonryColumns = { lg: number }

const DEFAULT_COLUMNS: MasonryColumns = { lg: 3 }

/** Widest first — the same sm/lg breakpoints the grids used as CSS columns. */
function columnQueries(columns: MasonryColumns) {
  return [
    { query: '(min-width: 1024px)', columns: columns.lg },
    { query: '(min-width: 640px)', columns: Math.min(2, columns.lg) },
  ] as const
}

function useColumnCount(columns: MasonryColumns) {
  // Starts at the widest layout so the server render and the first client
  // render agree; the effect corrects it on mount for narrower viewports.
  const [count, setCount] = useState<number>(columns.lg)

  useEffect(() => {
    const queries = columnQueries(columns).map((c) => ({ columns: c.columns, mql: window.matchMedia(c.query) }))
    const sync = () => setCount(queries.find((q) => q.mql.matches)?.columns ?? 1)
    sync()
    for (const { mql } of queries) mql.addEventListener('change', sync)
    return () => {
      for (const { mql } of queries) mql.removeEventListener('change', sync)
    }
    // Depend on the primitive, not `columns` itself — callers often pass a
    // fresh object literal (e.g. `{ lg: 2 }`) on every render, which would
    // otherwise tear down and re-add these listeners on every parent render.
  }, [columns.lg])

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
}: {
  children: ReactNode
  className?: string
  /** Column count at `lg` — 3 for image grids, 2 for `illustrated` collections, whose verse needs more measure than a third of the page gives it. */
  columns?: MasonryColumns
}) {
  const columnCount = useColumnCount(columns)

  const cols: ReactNode[][] = Array.from({ length: columnCount }, () => [])
  Children.toArray(children).forEach((child, i) => {
    cols[i % columnCount].push(child)
  })

  return (
    // Widths come from the responsive template rather than columnCount, so a
    // pre-hydration render is still laid out correctly for its viewport.
    // Tailwind's scanner needs literal classes, so both column counts are
    // written out in full rather than interpolated.
    <div
      className={cn(
        'grid grid-cols-1 gap-5',
        columns.lg === 2 ? 'sm:grid-cols-2 lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {cols.map((column, i) => (
        <div key={i} className="flex flex-col gap-5">
          {column}
        </div>
      ))}
    </div>
  )
}
