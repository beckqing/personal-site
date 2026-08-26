'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { categoryLabel, WorkPlaceholder } from '@/components/work-visuals'
import { primaryDiscipline, toneFor, type WorkPiece } from '@/lib/work'
import { cn } from '@/lib/utils'

/**
 * Wraps an image tile so clicking it opens a full-screen, focused view —
 * the way a gallery lightbox works. Pass a single piece for a standalone
 * image, or a full ordered list (a collection's pieces) to get prev/next
 * navigation and arrow-key browsing without leaving the page.
 */
export function ImageLightbox({
  items,
  initialIndex = 0,
  children,
  className,
}: {
  items: WorkPiece[]
  initialIndex?: number
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(initialIndex)
  const hasMultiple = items.length > 1

  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  useEffect(() => {
    if (!open || !hasMultiple) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % items.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hasMultiple, items.length])

  const piece = items[index]
  if (!piece) return null
  const tone = toneFor(piece)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        className={cn(
          'group relative block w-full appearance-none overflow-hidden rounded-2xl border border-border bg-transparent p-0 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        {children}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-foreground/0 transition-colors duration-200 group-hover:bg-foreground/5"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs text-foreground opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <Expand className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          view
        </span>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-background/96 backdrop-blur-sm duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 p-4 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 sm:p-10">
          <DialogPrimitive.Title className="sr-only">{piece.title}</DialogPrimitive.Title>

          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 inline-flex items-center justify-center rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card">
            <X className="h-4 w-4" strokeWidth={1.75} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div className="flex w-full max-w-4xl flex-1 items-center justify-center">
            {/* Sized to the image itself (not the max-w-4xl row), so the
                arrows sit against its actual rendered edges — a portrait
                piece renders much narrower than the row, and arrows pinned
                to the row's edges would end up far from the image. */}
            <div className="relative inline-flex max-w-full items-center justify-center">
              {hasMultiple && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
                  aria-label={`Previous: ${items[(index - 1 + items.length) % items.length].title}`}
                  className="absolute left-0 z-10 -translate-x-12 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card sm:-translate-x-14"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}

              <WorkPlaceholder
                item={piece}
                fit="contain"
                className="max-h-[65vh] max-w-full drop-shadow-2xl"
              />

              {hasMultiple && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % items.length)}
                  aria-label={`Next: ${items[(index + 1) % items.length].title}`}
                  className="absolute right-0 z-10 translate-x-12 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card sm:translate-x-14"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-brand text-xs lowercase tracking-[0.15em]" style={{ color: tone }}>
              {categoryLabel(piece)} · {primaryDiscipline(piece) ?? 'work'} · {piece.year}
            </p>
            <p className="font-brand text-lg font-bold lowercase text-foreground">{piece.title}</p>
            {hasMultiple && (
              <p className="font-brand text-xs text-muted-foreground">
                {index + 1} / {items.length}
              </p>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
