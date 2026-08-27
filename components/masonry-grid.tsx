'use client'

import { Children, useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Widest first — the same sm/lg breakpoints the grids used as CSS columns. */
const COLUMN_QUERIES = [
  { query: '(min-width: 1024px)', columns: 3 },
  { query: '(min-width: 640px)', columns: 2 },
] as const

function useColumnCount() {
  // Starts at the widest layout so the server render and the first client
  // render agree; the effect corrects it on mount for narrower viewports.
  const [columns, setColumns] = useState<number>(COLUMN_QUERIES[0].columns)

  useEffect(() => {
    const queries = COLUMN_QUERIES.map((c) => ({ columns: c.columns, mql: window.matchMedia(c.query) }))
    const sync = () => setColumns(queries.find((q) => q.mql.matches)?.columns ?? 1)
    sync()
    for (const { mql } of queries) mql.addEventListener('change', sync)
    return () => {
      for (const { mql } of queries) mql.removeEventListener('change', sync)
    }
  }, [])

  return columns
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
export function MasonryGrid({ children, className }: { children: ReactNode; className?: string }) {
  const columnCount = useColumnCount()

  const columns: ReactNode[][] = Array.from({ length: columnCount }, () => [])
  Children.toArray(children).forEach((child, i) => {
    columns[i % columnCount].push(child)
  })

  return (
    // Widths come from the responsive template rather than columnCount, so a
    // pre-hydration render is still laid out correctly for its viewport.
    <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {columns.map((column, i) => (
        <div key={i} className="flex flex-col gap-5">
          {column}
        </div>
      ))}
    </div>
  )
}
