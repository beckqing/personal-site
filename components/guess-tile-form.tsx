'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Check, Eye } from 'lucide-react'
import { isCorrectGuess, type Guess, type WorkPiece } from '@/lib/work'
import { guessStatusFor } from '@/lib/guess-storage'
import { useGuessProgressContext } from '@/components/guess-provider'
import { cn } from '@/lib/utils'

/**
 * The guess row that grows every guessable `PieceTile` by one row — see
 * docs/specs/2026-09-guessing-game.md §3, "Guessing from the tile". Mounted
 * as a sibling *after* the caption `<Link>`, never inside it (HTML forbids
 * interactive content inside `<a>`). Only ever rendered inside a
 * `GuessProgressProvider` — guaranteed because a guessable piece implies
 * `hasGuessablePieces(collection)`, which is what gates the provider on the
 * collection page.
 *
 * `min-h-[3.875rem]` is load-bearing: it's what makes the no-JS-link → form →
 * solved-answer swap a swap inside a stable box instead of a reflow that
 * shifts tiles below it in the same masonry column. The value is the form
 * row's own rendered height (28px of `px-4 pb-4 pt-3` padding plus the
 * 34px-tall input) — the tallest of the three states — so the shorter link
 * and solved-answer rows are pinned up to match it instead of the box
 * shrinking to fit them.
 */
export function GuessTileForm({
  piece,
  collectionSlug,
  tone,
  pieceHref,
}: {
  piece: WorkPiece & { guess: Guess }
  collectionSlug: string
  tone: string
  pieceHref: string
}) {
  const { progress, mounted, solve } = useGuessProgressContext()
  const status = mounted ? guessStatusFor(progress, collectionSlug, piece.slug) : undefined
  const solvedOrRevealed = Boolean(status)

  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (solvedOrRevealed) answerRef.current?.focus()
  }, [solvedOrRevealed])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // A mis-press is an empty *box*, not input that merely normalizes to
    // nothing — typing symbols/digits alone ("!!!") is a real (wrong)
    // guess, not a no-op, so this checks the raw trimmed value rather than
    // `normalizeGuess(value)`, which would strip it down to '' and get
    // silently swallowed here before ever reaching the wrong-guess path.
    if (!value.trim()) return
    if (isCorrectGuess(piece.guess, value)) {
      setWrong(false)
      solve(collectionSlug, piece.slug)
    } else {
      setWrong(true)
      // Restart the shake on every wrong guess, including consecutive ones
      // where `wrong` was already true and a className change alone
      // wouldn't retrigger the CSS animation. Toggling the class directly
      // (rather than remounting via a `key`) keeps this node — and the
      // input inside it — mounted, so focus survives the shake.
      const el = shakeRef.current
      if (el) {
        el.classList.remove('guess-shake')
        void el.offsetWidth
        el.classList.add('guess-shake')
      }
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }

  const inputId = `guess-tile-${collectionSlug}-${piece.slug}`

  // No-JS state (also the first client render, before hydration reconciles
  // storage): a link to the piece page, not a disabled input — the tile has
  // no <details> behind it, so a permanently disabled input would be a dead
  // end with nothing behind it. See spec §3/§6.
  if (!mounted) {
    return (
      <Link
        href={pieceHref}
        className="flex min-h-[3.875rem] items-center px-4 pb-4 pt-3 text-sm text-muted-foreground underline decoration-transparent underline-offset-2 hover:text-foreground hover:decoration-current"
      >
        ▸ name this one
      </Link>
    )
  }

  if (solvedOrRevealed) {
    const reference = piece.guess.reference
    return (
      <div
        ref={answerRef}
        tabIndex={-1}
        className="flex min-h-[3.875rem] items-center gap-1.5 px-4 pb-4 pt-3 text-sm font-bold lowercase outline-none"
        style={{ color: tone }}
      >
        {status === 'solved' ? (
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        {piece.guess.accepts[0]}
        {reference && (
          <Link
            href={pieceHref}
            className="font-normal normal-case text-muted-foreground underline decoration-transparent underline-offset-2 hover:decoration-current"
          >
            see the photo
          </Link>
        )}
      </div>
    )
  }

  const prompt = piece.guess.prompt ?? 'what animal is this?'

  return (
    <div className="min-h-[3.875rem] px-4 pb-4 pt-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          {prompt}
        </label>
        <div ref={shakeRef} className="flex flex-1 gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setWrong(false)
            }}
            placeholder="what animal?"
            autoComplete="off"
            className={cn(
              'min-w-0 flex-1 rounded-lg border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
              wrong ? 'border-destructive text-destructive' : 'border-border',
            )}
          />
          <button
            type="submit"
            className="font-brand shrink-0 rounded-lg px-3 py-1.5 text-sm lowercase text-primary-foreground transition-opacity hover:opacity-90"
            style={{ backgroundColor: tone }}
          >
            guess
          </button>
        </div>
      </form>
      <div aria-live="polite" className="sr-only">
        {wrong && 'not quite'}
      </div>
    </div>
  )
}
