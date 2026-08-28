'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { categoryLabel, WorkPlaceholder } from '@/components/work-visuals'
import { primaryDiscipline, toneFor, type WorkPiece } from '@/lib/work'
import { cn } from '@/lib/utils'

/** The site's existing ease-out expo, used for both the flight and the touch snap-back. */
const FLIGHT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const FLIGHT_DURATION = 260

/**
 * Wraps an image tile so clicking it opens a full-screen, focused view —
 * the way a gallery lightbox works. Pass a single piece for a standalone
 * image, or a full ordered list (a collection's pieces) to get prev/next
 * navigation and arrow-key browsing without leaving the page.
 *
 * Scrolling down inside the open lightbox dismisses it by flying the image
 * from its lightbox position back to this trigger's in-page position — see
 * the wheel/touch handlers below. Escape and the close button still just
 * close normally, using Base UI's own fade.
 */
export function ImageLightbox({
  items,
  initialIndex = 0,
  children,
  className,
  bare = false,
}: {
  items: WorkPiece[]
  initialIndex?: number
  children: ReactNode
  className?: string
  /**
   * Skips the full-bleed hover scrim and "view" pill, and the default
   * block/w-full/border/rounded chrome — for wrapping a small trigger (like
   * a "view still" pill next to a video player) rather than an image tile
   * that fills its own box. Caller controls layout entirely via `children`
   * and `className`. Also always fades on dismiss rather than flying: a
   * small pill is the wrong shape to fly a full-bleed image into.
   */
  bare?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(initialIndex)
  const [flying, setFlying] = useState(false)
  const [chromeVisible, setChromeVisible] = useState(true)
  const hasMultiple = items.length > 1

  const triggerRef = useRef<HTMLButtonElement>(null)
  // A callback ref (backed by state) rather than a plain useRef: Base UI
  // mounts the Popup's DOM node asynchronously relative to `open` flipping
  // true, so an effect keyed on [open] that reads a plain ref's .current can
  // still see null on the render where it first runs. Keying effects on this
  // state instead means they re-run exactly when the node actually appears.
  const [popupNode, setPopupNode] = useState<HTMLDivElement | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const isDismissingRef = useRef(false)
  const wheelAccumRef = useRef(0)
  const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const dragYRef = useRef(0)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  /**
   * The dismiss gesture's payoff: fly the lightbox <img> to the trigger's
   * current position and only then close the dialog. Falls back to a plain
   * close (Base UI's own fade) whenever the flight wouldn't make sense —
   * reduced motion, a bare trigger, having browsed to a different image than
   * the one that was opened, or the trigger no longer being on the page.
   */
  const dismissWithFlight = useCallback(() => {
    if (isDismissingRef.current) return

    const popup = popupNode
    const trigger = triggerRef.current
    const img = popup?.querySelector('img') ?? null
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canFly = !bare && !reducedMotion && img && trigger && index === initialIndex

    if (!canFly) {
      setOpen(false)
      return
    }

    isDismissingRef.current = true

    const finish = () => {
      const dragY = dragYRef.current
      const first = img.getBoundingClientRect()
      const last = trigger.getBoundingClientRect()
      // Both render the same source with object-fit: contain; scale from the
      // width ratio and let contain absorb the rest of any aspect mismatch.
      const scale = last.width / first.width
      const dx = last.left + last.width / 2 - (first.left + first.width / 2)
      const dy = last.top + last.height / 2 - (first.top + first.height / 2)

      setFlying(true)
      img.style.transform = ''
      const imgAnim = img.animate(
        [
          { transform: `translate(0px, ${dragY}px) scale(1)` },
          { transform: `translate(${dx}px, ${dy + dragY}px) scale(${scale})` },
        ],
        { duration: FLIGHT_DURATION, easing: FLIGHT_EASING, fill: 'forwards' },
      )
      const fadeTargets = [
        backdropRef.current,
        ...(popup ? Array.from(popup.querySelectorAll<HTMLElement>('[data-lightbox-chrome]')) : []),
      ]
      for (const el of fadeTargets) {
        el?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLIGHT_DURATION, easing: FLIGHT_EASING, fill: 'forwards' })
      }

      imgAnim.finished
        .catch(() => {})
        .then(() => {
          dragYRef.current = 0
          setOpen(false)
          setFlying(false)
          isDismissingRef.current = false
        })
    }

    const triggerRect = trigger.getBoundingClientRect()
    const offscreen =
      triggerRect.bottom <= 0 ||
      triggerRect.top >= window.innerHeight ||
      triggerRect.right <= 0 ||
      triggerRect.left >= window.innerWidth

    if (offscreen) {
      trigger.scrollIntoView({ block: 'nearest' })
      requestAnimationFrame(finish)
    } else {
      finish()
    }
  }, [bare, index, initialIndex, popupNode])

  // Dismiss gesture: wheel and touch, listened for directly on the popup —
  // Base UI's Dialog locks body scroll while open, so no scroll event would
  // otherwise fire.
  useEffect(() => {
    if (!open || !popupNode) return
    const popupEl = popupNode

    function onWheel(e: WheelEvent) {
      if (isDismissingRef.current) return
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current)
      if (e.deltaY < 0) {
        // Upward scroll isn't "go back up a mode" — just ignored, and it
        // resets the accumulator so it can't contribute to a later downward flick.
        wheelAccumRef.current = 0
        return
      }
      wheelAccumRef.current += e.deltaY
      // Trackpad momentum from a previous flick shouldn't leak into the next gesture.
      wheelResetTimerRef.current = setTimeout(() => {
        wheelAccumRef.current = 0
      }, 400)
      if (wheelAccumRef.current > 120) {
        wheelAccumRef.current = 0
        dismissWithFlight()
      }
    }

    function onTouchStart(e: TouchEvent) {
      if (isDismissingRef.current) return
      touchStartYRef.current = e.touches[0]?.clientY ?? null
    }

    function onTouchMove(e: TouchEvent) {
      if (isDismissingRef.current || touchStartYRef.current == null) return
      const y = e.touches[0]?.clientY
      if (y == null) return
      const delta = Math.max(0, y - touchStartYRef.current)
      dragYRef.current = delta
      const img = popupEl.querySelector('img')
      if (img) img.style.transform = `translateY(${delta}px)`
      if (delta > 80) {
        touchStartYRef.current = null
        dismissWithFlight()
      }
    }

    function onTouchEnd() {
      if (isDismissingRef.current) {
        touchStartYRef.current = null
        return
      }
      // A drag that never reached the threshold snaps back to its origin.
      if (touchStartYRef.current != null && dragYRef.current > 0) {
        const from = dragYRef.current
        const img = popupEl.querySelector('img')
        if (img) {
          img
            .animate([{ transform: `translateY(${from}px)` }, { transform: 'translateY(0px)' }], {
              duration: 200,
              easing: FLIGHT_EASING,
            })
            .finished.catch(() => {})
            .finally(() => {
              img.style.transform = ''
            })
        }
        dragYRef.current = 0
      }
      touchStartYRef.current = null
    }

    popupEl.addEventListener('wheel', onWheel, { passive: true })
    popupEl.addEventListener('touchstart', onTouchStart, { passive: true })
    popupEl.addEventListener('touchmove', onTouchMove, { passive: true })
    popupEl.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      popupEl.removeEventListener('wheel', onWheel)
      popupEl.removeEventListener('touchstart', onTouchStart)
      popupEl.removeEventListener('touchmove', onTouchMove)
      popupEl.removeEventListener('touchend', onTouchEnd)
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current)
    }
  }, [open, dismissWithFlight, popupNode])

  // Idle-fade: caption and controls fade out after 2.5s of no pointer/key
  // activity, and any activity (including focus, for keyboard users) brings
  // them back. Opacity only — see the chrome elements below, which never go
  // pointer-events-none, so the close button stays reachable while faded.
  useEffect(() => {
    if (!open || !popupNode) return

    function resetIdle() {
      setChromeVisible(true)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => setChromeVisible(false), 2500)
    }

    resetIdle()
    popupNode.addEventListener('pointermove', resetIdle)
    popupNode.addEventListener('keydown', resetIdle)
    popupNode.addEventListener('focusin', resetIdle)
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      popupNode.removeEventListener('pointermove', resetIdle)
      popupNode.removeEventListener('keydown', resetIdle)
      popupNode.removeEventListener('focusin', resetIdle)
    }
  }, [open, popupNode])

  const piece = items[index]
  if (!piece) return null
  const tone = toneFor(piece)
  const chromeClass = cn('transition-opacity duration-300', chromeVisible ? 'opacity-100' : 'opacity-0')

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        ref={triggerRef}
        className={cn(
          bare
            ? 'group appearance-none bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            : 'group relative block w-full appearance-none overflow-hidden rounded-2xl border border-border bg-transparent p-0 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        {children}
        {!bare && (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-foreground/0 transition-colors duration-200 group-hover:bg-foreground/5"
            />
            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs text-foreground opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
              <Expand className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              view
            </span>
          </>
        )}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          ref={backdropRef}
          className={cn(
            'fixed inset-0 z-50 bg-background duration-150 data-open:animate-in data-open:fade-in-0',
            !flying && 'data-closed:animate-out data-closed:fade-out-0',
          )}
        />
        <DialogPrimitive.Popup
          ref={setPopupNode}
          className={cn(
            'fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 p-4 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 sm:p-10',
            !flying && 'data-closed:animate-out data-closed:fade-out-0',
          )}
        >
          <DialogPrimitive.Title className="sr-only">{piece.title}</DialogPrimitive.Title>

          <DialogPrimitive.Close
            data-lightbox-chrome
            className={cn(
              'absolute right-4 top-4 z-10 inline-flex items-center justify-center rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card',
              chromeClass,
            )}
          >
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
                  data-lightbox-chrome
                  onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
                  aria-label={`Previous: ${items[(index - 1 + items.length) % items.length].title}`}
                  className={cn(
                    'absolute left-0 z-10 -translate-x-12 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card sm:-translate-x-14',
                    chromeClass,
                  )}
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}

              <WorkPlaceholder
                item={piece}
                fit="contain"
                className="max-h-[92vh] max-w-[92vw] drop-shadow-2xl"
              />

              {hasMultiple && (
                <button
                  type="button"
                  data-lightbox-chrome
                  onClick={() => setIndex((i) => (i + 1) % items.length)}
                  aria-label={`Next: ${items[(index + 1) % items.length].title}`}
                  className={cn(
                    'absolute right-0 z-10 translate-x-12 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card sm:translate-x-14',
                    chromeClass,
                  )}
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>

          <div data-lightbox-chrome className={cn('flex flex-col items-center gap-1 text-center', chromeClass)}>
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
