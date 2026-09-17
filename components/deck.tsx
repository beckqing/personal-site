'use client'

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, Presentation, X } from 'lucide-react'
import { EssayBody } from '@/components/essay'
import { headingStyles } from '@/lib/heading-styles'
import { cn } from '@/lib/utils'

type SlideLayout = 'prose' | 'figure' | 'split' | 'full'

type SlideProps = {
  id: string
  title: string
  layout?: SlideLayout
  children: ReactNode
}

/** True only for the copy of a `<Slide>` rendered inside present mode — see `Slide`'s doc comment. */
const PresentingContext = createContext(false)

/**
 * A single slide's own image, distinguished from ordinary MDX content so
 * `Slide` can pull it out of the flow and place it per `layout` (see
 * docs/specs/2026-09-branding-deck.md §5, §6.3).
 */
export function SlideFigure({
  src,
  aspect,
  alt,
  caption,
}: {
  src: string
  aspect: string
  alt: string
  caption?: string
}) {
  return (
    <figure className="w-full">
      <div className="relative w-full overflow-hidden rounded-2xl border border-border" style={{ aspectRatio: aspect }}>
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
      </div>
      {caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}

const LAYOUT_WRAP: Record<SlideLayout, string> = {
  prose: 'mx-auto',
  figure: 'flex flex-col items-center gap-8',
  split: 'flex flex-col gap-8 sm:flex-row sm:items-center',
  full: '',
}

/**
 * One slide of the deck — one source, two presentations (see §5). Renders as
 * a `<section>` in scroll mode; `Deck`'s present mode renders a second copy
 * of the same element with `PresentingContext` set, so this is the one place
 * that copy's duplicate-id bug (§6.4) is guarded: `id` goes on the DOM only
 * when this isn't the presenting copy.
 */
export function Slide({ id, title, layout = 'prose', children }: SlideProps) {
  const presenting = useContext(PresentingContext)
  const headingId = useId()

  const items = Children.toArray(children)
  const figure = items.find((c) => isValidElement(c) && c.type === SlideFigure) as ReactElement | undefined
  const rest = items.filter((c) => c !== figure)

  const prose = layout === 'full' ? <>{rest}</> : <EssayBody>{rest}</EssayBody>

  let content: ReactNode
  if ((layout === 'split' || layout === 'figure') && figure) {
    content = (
      <div className={LAYOUT_WRAP[layout]}>
        <div className={layout === 'split' ? 'sm:w-[40%] sm:shrink-0' : 'w-full max-w-md'}>{figure}</div>
        {prose}
      </div>
    )
  } else if (layout === 'full') {
    content = prose
  } else {
    content = <div className={LAYOUT_WRAP.prose}>{prose}</div>
  }

  return (
    <section
      id={presenting ? undefined : id}
      aria-labelledby={headingId}
      className={cn(
        presenting
          ? 'flex h-full w-full flex-col overflow-y-auto px-6 py-12 sm:px-16'
          : 'mt-16 scroll-mt-8 first:mt-8',
      )}
    >
      <h2 id={headingId} className={cn(headingStyles.h2, 'mt-0', presenting && 'text-balance')}>
        {title}
      </h2>
      {content}
    </section>
  )
}

type DeckSlide = ReactElement<SlideProps>

function slideList(children: ReactNode): DeckSlide[] {
  return Children.toArray(children).filter(
    (c): c is DeckSlide => isValidElement(c) && c.type === Slide,
  )
}

/**
 * The deck's own present-mode dialog — see §7. Dialog first, then fullscreen
 * on the popup (§7.2): the deck has no iframe, so unlike CodeDemoFrame there
 * is nothing that a reparent would reboot, and Base UI's Dialog buys focus
 * trapping, Escape, scroll lock, and focus restoration for free.
 */
function PresentDialog({
  slides,
  index,
  open,
  onClose,
  onGoTo,
}: {
  slides: DeckSlide[]
  index: number
  open: boolean
  onClose: () => void
  onGoTo: (index: number) => void
}) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [chromeVisible, setChromeVisible] = useState(true)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const last = slides.length - 1
  const goTo = useCallback((next: number) => onGoTo(Math.max(0, Math.min(last, next))), [last, onGoTo])

  // Fullscreen the popup once it's mounted and open. The catch is load-
  // bearing: iOS Safari has no requestFullscreen, and the overlay alone is
  // the experience there since the Dialog already covers the viewport.
  useEffect(() => {
    if (!open) return
    popupRef.current?.requestFullscreen().catch(() => {})
  }, [open])

  // Idle-fade for the on-screen controls, same pattern as ImageLightbox:
  // any pointer/key/focus activity brings them back, including focusin so a
  // keyboard user tabbing through the controls doesn't watch them fade out.
  useEffect(() => {
    if (!open) return
    const el = popupRef.current
    if (!el) return
    function resetIdle() {
      setChromeVisible(true)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => setChromeVisible(false), 2500)
    }
    resetIdle()
    el.addEventListener('pointermove', resetIdle)
    el.addEventListener('keydown', resetIdle)
    el.addEventListener('focusin', resetIdle)
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      el.removeEventListener('pointermove', resetIdle)
      el.removeEventListener('keydown', resetIdle)
      el.removeEventListener('focusin', resetIdle)
    }
  }, [open])

  // Paging keys. Clamps at both ends — a deck that loops back to slide one
  // reads as a bug mid-presentation (§7.4).
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) {
        e.preventDefault()
        goTo(index + 1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        goTo(index - 1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        goTo(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goTo(last)
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [open, index, last, goTo])

  // Horizontal swipe, ≥50px, ignoring gestures that start inside a
  // scrollable element (§7.6's overflow case) so reading a long slide
  // doesn't accidentally page the deck.
  useEffect(() => {
    if (!open) return
    const el = popupRef.current
    if (!el) return
    function startsInScrollable(target: EventTarget | null): boolean {
      let node = target instanceof HTMLElement ? target : null
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight && getComputedStyle(node).overflowY !== 'visible') return true
        node = node.parentElement
      }
      return false
    }
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0]
      if (!t || startsInScrollable(e.target)) {
        touchStartRef.current = null
        return
      }
      touchStartRef.current = { x: t.clientX, y: t.clientY }
    }
    function onTouchEnd(e: TouchEvent) {
      const start = touchStartRef.current
      touchStartRef.current = null
      if (!start) return
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
      goTo(dx < 0 ? index + 1 : index - 1)
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [open, index, goTo])

  const current = slides[index]
  const chromeClass = cn('transition-opacity duration-300', chromeVisible ? 'opacity-100' : 'opacity-0')

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-background duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          ref={popupRef}
          className="fixed inset-0 z-50 bg-background outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          {current && <DialogPrimitive.Title className="sr-only">{current.props.title}</DialogPrimitive.Title>}

          <div
            key={current?.props.id}
            className="h-full w-full motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300"
          >
            <PresentingContext.Provider value={true}>{current}</PresentingContext.Provider>
          </div>

          {slides.length > 1 && (
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous slide"
              className={cn(
                'absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card disabled:pointer-events-none disabled:opacity-30 sm:left-6',
                chromeClass,
              )}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
          )}
          {slides.length > 1 && (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === last}
              aria-label="Next slide"
              className={cn(
                'absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card disabled:pointer-events-none disabled:opacity-30 sm:right-6',
                chromeClass,
              )}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          )}

          <DialogPrimitive.Close
            aria-label="Close present mode"
            className={cn(
              'absolute right-4 top-4 z-10 inline-flex items-center justify-center rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card',
              chromeClass,
            )}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </DialogPrimitive.Close>

          {slides.length > 1 && (
            <p
              className={cn(
                'font-brand absolute inset-x-0 bottom-4 z-10 mx-auto w-fit rounded-full border border-border bg-background/85 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm',
                chromeClass,
              )}
            >
              {index + 1} / {slides.length}
            </p>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * The deck root — one source, two presentations. Reads its slide list
 * straight off `children`'s `id`/`title`/`layout` props (§5): plain
 * elements, no registry needed for the list itself.
 *
 * `?slide=<id>` is the single source of truth for present mode, the same
 * pattern the gallery uses for `?view=<slug>` — so the header's present
 * button and this component agree on state with no context between them.
 * Present mode's own trigger renders here, at the top of the deck's content
 * (immediately under the page's real header), rather than inside the
 * server-rendered header itself — the header has no way to reach into the
 * MDX body's slide list, which is exactly what present mode needs to open on
 * the first slide.
 */
export function Deck({ children }: { children: ReactNode }) {
  const slides = useMemo(() => slideList(children), [children])

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const urlIndex = slides.findIndex((s) => s.props.id === searchParams.get('slide'))
  const open = urlIndex !== -1
  const [index, setIndex] = useState(Math.max(urlIndex, 0))
  useEffect(() => {
    if (urlIndex !== -1) setIndex(urlIndex)
  }, [urlIndex])

  const setSlideParam = useCallback(
    (id: string | null) => {
      const sp = new URLSearchParams(Array.from(searchParams.entries()))
      if (id) sp.set('slide', id)
      else sp.delete('slide')
      const qs = sp.toString()
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      })
    },
    [searchParams, pathname, router],
  )

  const openPresent = useCallback(() => {
    setSlideParam(slides[0]?.props.id ?? null)
  }, [setSlideParam, slides])

  const close = useCallback(() => setSlideParam(null), [setSlideParam])

  const goTo = useCallback(
    (next: number) => {
      setIndex(next)
      setSlideParam(slides[next]?.props.id ?? null)
    },
    [slides, setSlideParam],
  )

  return (
    <PresentingContext.Provider value={false}>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={openPresent}
          className="font-brand inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm lowercase text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Presentation className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          present
        </button>
      </div>

      {slides}

      <PresentDialog slides={slides} index={index} open={open} onClose={close} onGoTo={goTo} />
    </PresentingContext.Provider>
  )
}
