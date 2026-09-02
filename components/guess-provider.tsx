'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  EMPTY_GUESS_PROGRESS,
  GUESS_STORAGE_KEY,
  markGuessPiece,
  readGuessProgress,
  resetGuessProgress,
  takeGuessHint,
  type GuessProgress,
} from '@/lib/guess-storage'

export type GuessProgressApi = {
  progress: GuessProgress
  /**
   * False until the post-hydration effect has read storage. Pages are
   * statically prerendered and the server has no idea what the visitor has
   * solved, so every consumer must render the neutral/unsolved state until
   * this flips — reading storage during render would be a hydration
   * mismatch (see docs/specs/2026-09-guessing-game.md §5, following
   * next-themes' pattern).
   */
  mounted: boolean
  solve: (collectionSlug: string, pieceSlug: string) => void
  reveal: (collectionSlug: string, pieceSlug: string) => void
  takeHint: (collectionSlug: string, count: number) => void
  reset: () => void
}

function useGuessProgressState(): GuessProgressApi {
  const [progress, setProgress] = useState<GuessProgress>(EMPTY_GUESS_PROGRESS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setProgress(readGuessProgress())
    setMounted(true)
  }, [])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === GUESS_STORAGE_KEY || e.key === null) setProgress(readGuessProgress())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const solve = useCallback((collectionSlug: string, pieceSlug: string) => {
    setProgress(markGuessPiece(collectionSlug, pieceSlug, 'solved'))
  }, [])
  const reveal = useCallback((collectionSlug: string, pieceSlug: string) => {
    setProgress(markGuessPiece(collectionSlug, pieceSlug, 'revealed'))
  }, [])
  const takeHint = useCallback((collectionSlug: string, count: number) => {
    setProgress(takeGuessHint(collectionSlug, count))
  }, [])
  const reset = useCallback(() => {
    setProgress(resetGuessProgress())
  }, [])

  return { progress, mounted, solve, reveal, takeHint, reset }
}

/**
 * Shared instance for one collection page, so the header scorecard/hint
 * ladder and the eight grid tiles read the same state — e.g. a reset click
 * in the header updates every tile mark immediately. The piece page is a
 * separate route with no shared context to build; `GuessPanel` there calls
 * `useGuessProgressStandalone` directly instead.
 */
const GuessProgressContext = createContext<GuessProgressApi | null>(null)

export function GuessProgressProvider({ children }: { children: ReactNode }) {
  const api = useGuessProgressState()
  return <GuessProgressContext.Provider value={api}>{children}</GuessProgressContext.Provider>
}

/** For components that only render inside `GuessProgressProvider` (the collection page's scorecard and tile marks). */
export function useGuessProgressContext(): GuessProgressApi {
  const ctx = useContext(GuessProgressContext)
  if (!ctx) throw new Error('useGuessProgressContext must be used within a GuessProgressProvider')
  return ctx
}

/** For a standalone consumer with no provider ancestor — the piece page's `GuessPanel`. */
export function useGuessProgressStandalone(): GuessProgressApi {
  return useGuessProgressState()
}
