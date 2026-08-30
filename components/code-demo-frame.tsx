'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { ExternalLink, Maximize2, Minimize2, Pause, Play, RotateCw } from 'lucide-react'
import { toneFor, type CodeDemo, type WorkPiece } from '@/lib/work'
import { WorkPlaceholder } from '@/components/work-visuals'
import { cn } from '@/lib/utils'

/**
 * How long to wait for a code demo's `code-demo:ready` before revealing the frame
 * anyway. The handshake is an optimisation against a flash of empty canvas,
 * not a requirement — a code demo that never says `ready` still works.
 */
const READY_TIMEOUT_MS = 2000

/** How much of the frame has to be on screen before a code demo starts itself. */
const AUTORUN_THRESHOLD = 0.25

/** Page → code demo. See docs/specs/2026-08-coding-explorations.md §5. */
type CodeDemoMessage =
  | { type: 'code-demo:theme'; theme: 'light' | 'dark' }
  | { type: 'code-demo:pause' }
  | { type: 'code-demo:resume' }
  | { type: 'code-demo:reseed' }

/** Code demo → page. One message: "I can accept messages now." */
type CodeDemoReply = { type: 'code-demo:ready' }

/**
 * The small honest label that says "this is a program" — the entry filename,
 * falling back to the containing folder when that filename is `index.html`.
 * A bare `index.html` names nothing: every demo's entry is called that, so the
 * rail on `delirium` read `index.html` and told you less than the title above
 * it did. The folder is the demo's real name.
 */
function entryName(src: string): string {
  const segments = src.split('?')[0].split('#')[0].split('/').filter(Boolean)
  const file = segments.pop()
  if (!file) return src
  if (!/^index\.[a-z0-9]+$/i.test(file)) return file
  return segments.pop() ?? file
}

/**
 * `src` with the current theme attached. Read by the code demo at boot, before
 * it has a message listener attached — and it is what makes the standalone
 * URL themed correctly with no page around it. Deliberately computed once at
 * boot and never again: changing the iframe's `src` would reboot the demo,
 * and a theme toggle must not throw away what it has drawn (that is what the
 * `code-demo:theme` message is for).
 */
function themedSrc(src: string, theme: 'light' | 'dark'): string {
  const url = new URL(src, 'https://placeholder.invalid')
  url.searchParams.set('theme', theme)
  return `${url.pathname}${url.search}${url.hash}`
}

/**
 * A rail button. Real `<button>`s, in the rails, never overlaid on the
 * surface — the surface belongs to the demo, and an overlay would swallow
 * its own interactions.
 */
function RailButton({
  onClick,
  label,
  children,
  pressed,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  pressed?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="font-brand inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs lowercase text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  )
}

/**
 * The workbench a code demo runs in — `PlayerFrame`'s sibling in the media
 * family, different instrument. A video is a recording you watch; a code demo is
 * a machine you switch on, so the chrome is a state rail above, a control
 * rail below, and the surface between them.
 *
 * The surface reserves its box from `codeDemo.aspect` before anything loads, so
 * booting never shifts the page. The iframe element does not exist until the
 * code demo actually runs — a `manual` demo (or a reduced-motion visit)
 * fetches nothing until asked.
 *
 * See docs/specs/2026-08-coding-explorations.md §4 and §5 for the layout and
 * the page/code-demo message contract.
 */
export function CodeDemoFrame({
  piece,
  codeDemo,
  className,
}: {
  piece: WorkPiece
  codeDemo: CodeDemo
  className?: string
}) {
  const { resolvedTheme } = useTheme()
  const theme: 'light' | 'dark' = resolvedTheme === 'light' ? 'light' : 'dark'

  const wrapperRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [mounted, setMounted] = useState(false)
  // The src is frozen at boot: see themedSrc.
  const [bootSrc, setBootSrc] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // A deliberate press wins over the intersection observer: scrolling back to
  // a code demo you paused on purpose must not silently restart it.
  const userPausedRef = useRef(false)
  const inViewRef = useRef(false)
  const bootedRef = useRef(false)
  // Read by `start`, so a theme toggle doesn't churn the effects that depend
  // on it — the running demo is kept in step by message, not by re-booting.
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => setMounted(true), [])

  const post = useCallback((message: CodeDemoMessage) => {
    // targetOrigin '*' is required, not lazy: the sandboxed frame's origin is
    // opaque ("null"), so a specific origin would never match.
    iframeRef.current?.contentWindow?.postMessage(message, '*')
  }, [])

  const start = useCallback(() => {
    userPausedRef.current = false
    setRunning(true)
    if (bootedRef.current) {
      post({ type: 'code-demo:resume' })
      return
    }
    bootedRef.current = true
    setBootSrc(themedSrc(codeDemo.src, themeRef.current))
  }, [post, codeDemo.src])

  const pause = useCallback(() => {
    setRunning(false)
    if (bootedRef.current) post({ type: 'code-demo:pause' })
  }, [post])

  /** Pause because the page said so (scrolled away, tab hidden) — not a press. */
  const suspend = useCallback(() => {
    if (!bootedRef.current) return
    setRunning(false)
    post({ type: 'code-demo:pause' })
  }, [post])

  // The handshake, plus its timeout. `event.source` is the only usable check:
  // the sandboxed frame's origin is opaque, so `event.origin` is "null".
  useEffect(() => {
    if (!bootSrc) return

    function onMessage(event: MessageEvent) {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      if ((event.data as CodeDemoReply | undefined)?.type !== 'code-demo:ready') return
      setRevealed(true)
      post({ type: 'code-demo:theme', theme })
    }

    window.addEventListener('message', onMessage)
    const timer = window.setTimeout(() => setRevealed(true), READY_TIMEOUT_MS)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timer)
    }
  }, [bootSrc, post, theme])

  // Keep a running demo in step with the site's toggle. The `?theme=` param
  // only covers boot; a listener attached afterwards never sees it.
  useEffect(() => {
    if (!bootSrc) return
    post({ type: 'code-demo:theme', theme })
  }, [bootSrc, post, theme])

  // Autorun policy: run on first intersection, pause on leaving. Never
  // autorun for `manual`, and never autorun under prefers-reduced-motion
  // regardless of `manual` — generative motion is exactly what that query is
  // about. The poster stays and the run control is still there.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mayAutorun = !codeDemo.manual && !reduced

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting
        if (entry.isIntersecting) {
          if (userPausedRef.current || document.hidden) return
          if (bootedRef.current) start()
          else if (mayAutorun) start()
        } else {
          suspend()
        }
      },
      { threshold: AUTORUN_THRESHOLD },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [codeDemo.manual, start, suspend])

  // A backgrounded tab spinning a rAF loop is the worst thing this feature
  // can do to someone's battery, and scroll position says nothing about it.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) suspend()
      else if (inViewRef.current && !userPausedRef.current && bootedRef.current) start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [start, suspend])

  // Fullscreen on the existing wrapper, not a dialog: reparenting an iframe
  // into a portal reboots the demo, throwing away whatever it has drawn.
  useEffect(() => {
    function onChange() {
      setFullscreen(document.fullscreenElement === wrapperRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement === wrapperRef.current) void document.exitFullscreen()
    else void wrapperRef.current?.requestFullscreen()
  }, [])

  const tone = toneFor(piece)
  const name = entryName(codeDemo.src)
  const standaloneHref = mounted ? themedSrc(codeDemo.src, theme) : codeDemo.src

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card',
        // In fullscreen the wrapper *is* the viewport, so the rails pin to
        // the edges and the surface takes whatever is left.
        fullscreen && 'flex h-full w-full flex-col rounded-none border-0',
        className,
      )}
    >
      {/* State rail */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full transition-colors"
          style={{ backgroundColor: running ? tone : 'var(--muted-foreground)' }}
        />
        <span className="font-brand text-xs lowercase text-muted-foreground">
          {running ? 'running' : 'paused'}
        </span>
        <span className="font-brand min-w-0 flex-1 truncate text-center text-xs text-muted-foreground/70">
          {name}
        </span>
        <a
          href={standaloneHref}
          target="_blank"
          rel="noreferrer"
          title="Open this code demo on its own"
          className="inline-flex shrink-0 items-center rounded-full p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">Open {piece.title} standalone</span>
        </a>
      </div>

      {/* The surface. Its box is reserved from codeDemo.aspect before anything
          loads, so booting a code demo never shifts the page. */}
      <div
        className={cn('relative w-full overflow-hidden bg-black', fullscreen && 'min-h-0 flex-1')}
        style={fullscreen ? undefined : { aspectRatio: codeDemo.aspect }}
      >
        {bootSrc && (
          <iframe
            ref={iframeRef}
            src={bootSrc}
            title={`${piece.title} — interactive code demo`}
            // allow-scripts and nothing else. Deliberately without
            // allow-same-origin: with both, a same-origin iframe can reach
            // parent.document and the boundary is fiction. The cost is that
            // the code demo runs in an opaque origin — no localStorage, and no
            // fetching its own data files. A code demo needing data inlines it.
            sandbox="allow-scripts"
            loading="lazy"
            className="h-full w-full border-0"
          />
        )}

        {/* The poster, over the iframe until the code demo says it's ready.
            Crossfades out rather than popping, and stays put entirely for a
            demo that hasn't been started. */}
        <div
          aria-hidden={revealed ? 'true' : undefined}
          className={cn(
            'absolute inset-0 transition-opacity duration-500',
            revealed ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
        >
          <div className={cn('h-full w-full', !bootSrc && 'opacity-70')}>
            <WorkPlaceholder item={piece} />
          </div>
          {!bootSrc && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={start}
                className="font-brand inline-flex items-center gap-2 rounded-full border border-border bg-background/85 px-4 py-2 text-sm lowercase text-foreground shadow-lg outline-none backdrop-blur-sm transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Play className="h-4 w-4 translate-x-[1px]" strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
                run demo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control rail */}
      <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <RailButton
          onClick={() => {
            if (running) {
              userPausedRef.current = true
              pause()
            } else {
              start()
            }
          }}
          label={running ? `Pause ${piece.title}` : `Run ${piece.title}`}
          pressed={running}
        >
          {running ? (
            <Pause className="h-3.5 w-3.5" strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
          )}
          {running ? 'pause' : 'run'}
        </RailButton>

        {codeDemo.seedable && (
          <RailButton
            onClick={() => {
              if (!bootedRef.current) start()
              else post({ type: 'code-demo:reseed' })
            }}
            label={`Reseed ${piece.title}`}
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            reseed
          </RailButton>
        )}

        <span className="flex-1" />

        <RailButton onClick={toggleFullscreen} label={fullscreen ? 'Exit full screen' : 'Full screen'}>
          {fullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          )}
          {fullscreen ? 'exit' : 'full'}
        </RailButton>
      </div>
    </div>
  )
}
