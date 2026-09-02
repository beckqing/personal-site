'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import Link from 'next/link'
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
 *
 * Also supports a controlled, triggerless mode (pass `open`/`onOpenChange`)
 * for a caller — currently only the top-level gallery — that derives the
 * open state from somewhere else (its URL) instead of owning a per-tile
 * dialog. See `resolveTrigger` and `titleHref` below.
 */
export function ImageLightbox({
  items,
  initialIndex = 0,
  children,
  className,
  bare = false,
  open: controlledOpen,
  onOpenChange,
  onIndexChange,
  resolveTrigger,
  titleHref,
}: {
  items: WorkPiece[]
  initialIndex?: number
  /** Omitted in controlled mode: no Trigger is rendered. */
  children?: ReactNode
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

  /** Controlled open state. When passed, the component renders no Trigger and ignores `children`. */
  open?: boolean
  /** Required whenever `open` is passed. Fires for Escape, the close button, and the dismiss flight. */
  onOpenChange?: (open: boolean) => void
  /** Fires whenever the shown index changes (arrows, ArrowLeft/ArrowRight). Index state stays internal regardless. */
  onIndexChange?: (index: number) => void

  /**
   * Maps the currently-shown piece to the element the dismiss flight should
   * land on. Lets a caller that renders many tiles fly back to the *current*
   * piece's tile rather than the one that opened. Returning null falls back
   * to a fade. When absent, behaviour is exactly as today: the internal
   * trigger, and only while `index === initialIndex`.
   */
  resolveTrigger?: (piece: WorkPiece) => HTMLElement | null

  /** When it returns a path, the caption's title renders as a link to it. */
  titleHref?: (piece: WorkPiece) => string | undefined
}) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = useCallback(
    (v: boolean) => {
      onOpenChange?.(v)
      if (!isControlled) setInternalOpen(v)
    },
    [isControlled, onOpenChange],
  )

  const [index, setIndexState] = useState(initialIndex)
  // Every index mutation routes through here so a future control can't forget
  // to fire onIndexChange. Index itself stays internal state in both modes:
  // the gallery writes `?view=` inside a startTransition, so the URL lags a
  // frame behind a keypress or arrow click.
  const goTo = useCallback(
    (next: number) => {
      setIndexState(next)
      onIndexChange?.(next)
    },
    [onIndexChange],
  )

  const [flying, setFlying] = useState(false)
  const [chromeVisible, setChromeVisible] = useState(true)
  const hasMultiple = items.length > 1

  const triggerRef = useRef<HTMLButtonElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
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
  // Set only when a dismiss had to scroll the page to reach an off-screen
  // flight target (see dismissWithFlight below) — Base UI's scroll lock
  // restores html.scrollTop to its pre-open value on cleanup, which would
  // otherwise undo that scroll the instant the dialog finishes closing.
  const targetScrollYRef = useRef<number | null>(null)

  useEffect(() => {
    if (open) setIndexState(initialIndex)
  }, [open, initialIndex])

  useEffect(() => {
    if (!open || !hasMultiple) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goTo((index + 1) % items.length)
      if (e.key === 'ArrowLeft') goTo((index - 1 + items.length) % items.length)
    }
    // Capture phase, not bubble: Base UI's DialogPopup has its own onKeyDown
    // that calls stopPropagation() for every arrow key (it's meant to keep
    // composite widgets like menus from leaking arrow presses past their
    // own popup) — a bubble-phase listener on window never sees the event.
    // Capture listeners run top-down before that handler gets a chance to
    // stop anything.
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [open, hasMultiple, items.length, index, goTo])

  // Natural-size clamp (never upscale past the source): WorkPlaceholder's
  // `contain` branch hardcodes a 2000px intrinsic size so Next's x-descriptor
  // srcset never softens a smaller source, but that also means the <img>'s
  // laid-out size is 2000px regardless of what the file actually contains.
  // Clamping to naturalWidth on load (with a belt-and-suspenders check for
  // cached images, which may not fire `load`) makes the real rule
  // min(sourceWidth, availableWidth, availableHeight × aspect). Reset first,
  // in the same effect as the listener, so a wide image's cap can't leak
  // onto a narrower one before the next `load` fires.
  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    img.style.maxWidth = ''
    function clamp() {
      if (img) img.style.maxWidth = `${img.naturalWidth}px`
    }
    if (img.complete && img.naturalWidth > 0) clamp()
    img.addEventListener('load', clamp)
    return () => img.removeEventListener('load', clamp)
    // `popupNode`, not just `index`: Base UI mounts the Popup's DOM (and with
    // it, this <img>) asynchronously relative to `open` flipping true (see
    // the note on `popupNode` above), so an effect keyed on `index` alone can
    // stabilize — and stop re-running — before the ref it reads ever goes
    // non-null.
  }, [index, popupNode])

  /**
   * The dismiss gesture's payoff: fly the lightbox <img> to its flight
   * target's current position and only then close the dialog. Falls back to
   * a plain close (Base UI's own fade) whenever the flight wouldn't make
   * sense — reduced motion, a bare trigger, or no resolvable target.
   */
  const dismissWithFlight = useCallback(() => {
    if (isDismissingRef.current) return

    const popup = popupNode
    const img = popup?.querySelector('img') ?? null
    // With no resolveTrigger (every caller but the gallery), behaviour is
    // exactly as before: fly to the internal trigger, and only while still
    // showing the piece that opened it.
    const flightTarget = resolveTrigger
      ? resolveTrigger(items[index])
      : index === initialIndex
        ? triggerRef.current
        : null
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canFly = !bare && !reducedMotion && img && flightTarget

    if (!canFly) {
      setOpen(false)
      return
    }

    isDismissingRef.current = true

    // `scrolledTo`, when set, is the scroll position the page was moved to
    // in order to bring an off-screen target into view (see below) — held
    // until the dialog's own cleanup has run, then re-applied.
    const finish = (scrolledTo?: number) => {
      const dragY = dragYRef.current
      const first = img.getBoundingClientRect()
      const last = flightTarget.getBoundingClientRect()
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
          if (scrolledTo != null) targetScrollYRef.current = scrolledTo
          setOpen(false)
          setFlying(false)
          isDismissingRef.current = false
        })
    }

    // A tile on screen when the lightbox opened measures correctly under
    // Base UI's scroll lock — the page is frozen at the position it will
    // return to (see docs/specs/2026-08-lightbox-sizing-and-gallery-entry.md
    // §5.2). Paging can select a tile that ISN'T on screen, though, and
    // scrollIntoView() under the lock is silently undone by the lock's own
    // cleanup — so an off-screen target needs the locked <body> (the actual
    // overflow container while the lock holds) repositioned directly.
    const targetRect = flightTarget.getBoundingClientRect()
    const fullyWithin =
      targetRect.top >= 0 &&
      targetRect.left >= 0 &&
      targetRect.bottom <= window.innerHeight &&
      targetRect.right <= window.innerWidth

    if (fullyWithin) {
      finish()
    } else {
      const desiredTop = (window.innerHeight - targetRect.height) / 2
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const targetScrollY = Math.min(Math.max(window.scrollY + (targetRect.top - desiredTop), 0), maxScroll)
      document.body.scrollTop = targetScrollY
      requestAnimationFrame(() => finish(targetScrollY))
    }
  }, [bare, index, initialIndex, items, popupNode, resolveTrigger, setOpen])

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

  // Reset on unmount, not only in dismissWithFlight's own cleanup — guards
  // against a stray remount (filters changing mid-flight, say) stranding
  // either ref in a state that blocks the next open.
  useEffect(() => {
    return () => {
      isDismissingRef.current = false
      targetScrollYRef.current = null
    }
  }, [])

  const piece = items[index]
  if (!piece) return null
  const tone = toneFor(piece)
  const chromeClass = cn('transition-opacity duration-300', chromeVisible ? 'opacity-100' : 'opacity-0')
  const href = titleHref?.(piece)

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(o) => {
        // Fires after Base UI's own scroll-lock cleanup has restored
        // html.scrollTop to its pre-open value — override it back to where
        // the off-screen-target flight actually scrolled to. Cleared either
        // way so a later plain close doesn't re-apply a stale scroll.
        if (!o && targetScrollYRef.current != null) {
          window.scrollTo({ top: targetScrollYRef.current, behavior: 'instant' })
          targetScrollYRef.current = null
        }
      }}
    >
      {!isControlled && (
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
      )}

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
          // With no Trigger in controlled mode, Base UI has nothing to
          // restore focus to on close — send it to the tile for whatever
          // piece is currently shown. Left alone (not passed) for every
          // other, uncontrolled caller, which keeps Base UI's own default
          // (trigger or previously focused element).
          finalFocus={isControlled ? () => resolveTrigger?.(items[index]) ?? false : undefined}
          className={cn(
            'fixed inset-0 z-50 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
            !flying && 'data-closed:animate-out data-closed:fade-out-0',
          )}
        >
          <DialogPrimitive.Title className="sr-only">{piece.title}</DialogPrimitive.Title>

          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center p-4 sm:p-6',
              hasMultiple && 'sm:px-20',
            )}
          >
            {/* Sized to the image itself (not a fixed-width row), so the
                arrows sit against its actual rendered edges — a portrait
                piece renders much narrower than the layer, and arrows pinned
                to the layer's edges would end up far from the image. Below
                `sm` the arrows sit inside the image's own edges instead:
                reserving 2 × 48px on a 375px phone would destroy the image. */}
            <div className="relative inline-flex max-h-full max-w-full items-center justify-center">
              {hasMultiple && (
                <button
                  type="button"
                  data-lightbox-chrome
                  onClick={() => goTo((index - 1 + items.length) % items.length)}
                  aria-label={`Previous: ${items[(index - 1 + items.length) % items.length].title}`}
                  className={cn(
                    'absolute left-2 z-10 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card sm:left-0 sm:-translate-x-14',
                    chromeClass,
                  )}
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}

              <WorkPlaceholder
                ref={imgRef}
                item={piece}
                fit="contain"
                className="h-auto max-h-full w-auto max-w-full drop-shadow-2xl"
              />

              {hasMultiple && (
                <button
                  type="button"
                  data-lightbox-chrome
                  onClick={() => goTo((index + 1) % items.length)}
                  aria-label={`Next: ${items[(index + 1) % items.length].title}`}
                  className={cn(
                    'absolute right-2 z-10 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card sm:right-0 sm:translate-x-14',
                    chromeClass,
                  )}
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>

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

          {/* A pill, not a band: covers a small fixed footprint rather than
              tinting the artwork with a gradient scrim. */}
          <div
            data-lightbox-chrome
            className={cn(
              'absolute inset-x-0 bottom-4 z-10 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-col items-center gap-1 rounded-full border border-border bg-background/85 px-5 py-3 text-center backdrop-blur-sm',
              chromeClass,
            )}
          >
            <p className="font-brand text-xs lowercase tracking-[0.15em]" style={{ color: tone }}>
              {categoryLabel(piece)} · {primaryDiscipline(piece) ?? 'work'} · {piece.year}
            </p>
            {href ? (
              <Link
                href={href}
                className="font-brand text-lg font-bold lowercase text-foreground underline-offset-4 hover:underline"
              >
                {piece.title}
              </Link>
            ) : (
              <p className="font-brand text-lg font-bold lowercase text-foreground">{piece.title}</p>
            )}
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
