'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useTheme } from 'next-themes'

type ThemeTransitionContextValue = {
  flip: () => void
}

const ThemeTransitionContext = createContext<ThemeTransitionContextValue | null>(null)

export function useThemeTransition() {
  const ctx = useContext(ThemeTransitionContext)
  if (!ctx) {
    throw new Error('useThemeTransition must be used inside ThemeTransitionProvider')
  }
  return ctx
}

// The orange wash fades in, holds a beat, then fades back out — like a
// horizon glow — layered on top of the actual page cross-fade, which the
// View Transitions API handles on its own (see globals.css'
// ::view-transition-old/new(root) rule for its duration).
const FADE_IN_MS = 400
const HOLD_MS = 120
const FADE_OUT_MS = 840

// Linear, bottom-heavy: strongest along the bottom edge, fading to nothing
// near the top, like sunlight glowing up from the horizon — works the same
// for sunrise (dark -> light) and sunset (light -> dark). Low peak opacity
// and a long, gradual falloff so it reads as a soft diffuse glow rather
// than a distinct band of color.
const WASH_GRADIENT =
  'linear-gradient(to top, rgba(247,158,73,0.3) 0%, rgba(217,108,45,0.14) 45%, rgba(217,108,45,0.03) 75%, transparent 100%)'

export function ThemeTransitionProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [active, setActive] = useState(false)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  const flip = useCallback(() => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []

    setActive(true)
    timeouts.current.push(setTimeout(() => setActive(false), FADE_IN_MS + HOLD_MS))

    const isDark = resolvedTheme === 'dark'
    const next = isDark ? 'light' : 'dark'

    // View Transitions snapshots the before/after DOM as images and
    // cross-fades those — it doesn't rely on per-element CSS transitions
    // at all, so it isn't susceptible to the Chromium bug that made a
    // plain transition-property approach stutter (see globals.css).
    // flushSync forces the theme's DOM update to commit synchronously
    // inside the callback, so the "after" snapshot is actually the new
    // theme rather than a frame still mid-React-render.
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        flushSync(() => setTheme(next))
      })
    } else {
      setTheme(next)
    }
  }, [resolvedTheme, setTheme])

  return (
    <ThemeTransitionContext.Provider value={{ flip }}>
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[999] transition-opacity ease-in-out"
        style={{
          opacity: active ? 1 : 0,
          transitionDuration: `${active ? FADE_IN_MS : FADE_OUT_MS}ms`,
          background: WASH_GRADIENT,
        }}
      />
    </ThemeTransitionContext.Provider>
  )
}
