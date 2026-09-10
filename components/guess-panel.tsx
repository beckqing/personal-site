'use client'

import { useEffect, useRef, useState, type FormEvent, type SyntheticEvent } from 'react'
import Image from 'next/image'
import { Check, Eye, HelpCircle, Image as ImageIcon } from 'lucide-react'
import {
  hintsFor,
  isCorrectGuess,
  toneFor,
  type Guess,
  type WorkCollection,
  type WorkPiece,
} from '@/lib/work'
import { guessStatusFor } from '@/lib/guess-storage'
import { useGuessProgressStandalone } from '@/components/guess-provider'
import { WorkPlaceholder, Prose } from '@/components/work-visuals'
import { cn } from '@/lib/utils'

/**
 * The reveal content: answer, the study repeated beside its reference photo,
 * credit, and the note — shared between the closed `<details>` a no-JS
 * visitor can spoiler themselves with, and the always-visible solved panel
 * once JS has mounted and the piece is solved/revealed. Must read as
 * finished with no `reference` and no `note` (both postponed for every
 * eye-studies piece today) — see docs/specs/2026-09-guessing-game.md §3.
 */
function GuessReveal({
  piece,
  status,
}: {
  piece: WorkPiece & { guess: Guess }
  status?: 'solved' | 'revealed'
}) {
  const answer = piece.guess.accepts[0]
  const reference = piece.guess.reference
  return (
    <div className="mt-4 space-y-4">
      <p className="flex items-center gap-2 text-2xl font-bold lowercase text-foreground">
        {status === 'solved' && <Check className="h-5 w-5 shrink-0" aria-hidden="true" />}
        {status === 'revealed' && <Eye className="h-5 w-5 shrink-0" aria-hidden="true" />}
        {answer}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl border border-border">
          <WorkPlaceholder item={piece} />
        </div>
        <div className="aspect-square overflow-hidden rounded-xl border border-border">
          {reference ? (
            <div className="relative h-full w-full">
              <Image
                src={reference.src}
                alt={reference.alt}
                fill
                sizes="(min-width: 640px) 320px, 90vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted p-4 text-center text-xs text-muted-foreground">
              <ImageIcon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
              reference image coming soon
            </div>
          )}
        </div>
      </div>
      {reference && (
        <p className="text-xs text-muted-foreground">
          Reference: photo by{' '}
          <a
            href={reference.photographerUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-transparent underline-offset-2 hover:decoration-current"
          >
            {reference.photographer}
          </a>{' '}
          on{' '}
          <a
            href={reference.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-transparent underline-offset-2 hover:decoration-current"
          >
            Unsplash
          </a>
        </p>
      )}
      {piece.guess.note && <Prose text={piece.guess.note} className="text-sm" />}
    </div>
  )
}

/**
 * A guessable piece's panel on its own page — see
 * docs/specs/2026-09-guessing-game.md §3. One component for both levels: the
 * server-rendered `<form>`/`<details>` is the whole no-JS experience, and
 * JS enhances it in place rather than swapping it for something else.
 */
export function GuessPanel({
  collection,
  piece,
}: {
  collection: WorkCollection
  piece: WorkPiece & { guess: Guess }
}) {
  const { progress, mounted, solve, reveal, takeHint } = useGuessProgressStandalone()
  const tone = toneFor(collection)

  const status = mounted ? guessStatusFor(progress, collection.slug, piece.slug) : undefined
  const solvedOrRevealed = Boolean(status)

  const hints = hintsFor(collection, piece)
  const takenHints = mounted ? Math.min(progress.hints[collection.slug] ?? 0, hints.length) : 0

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
      solve(collection.slug, piece.slug)
    } else {
      setWrong(true)
      // Restart the shake without remounting this node via a `key` — a
      // remount would unmount and recreate the <input> inside it, losing
      // focus at exactly the moment the visitor is meant to retry in one
      // keystroke.
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

  // Deliberately uncontrolled (no `open` prop): the moment this fires
  // reveal() and progress updates, this whole <details> unmounts in favor of
  // the solvedOrRevealed branch below, so there's nothing to keep in sync.
  // A controlled `open` here previously caused a real bug — an external
  // reset (from another tab) flips solvedOrRevealed back to false, this
  // element remounts, and React setting a stale `open={true}` on the fresh
  // node fires a native toggle event that looked exactly like a genuine
  // give-up click, silently undoing the reset. Letting the browser own the
  // open state avoids that class of false toggle entirely.
  function handleRevealToggle(e: SyntheticEvent<HTMLDetailsElement>) {
    if (e.currentTarget.open && !solvedOrRevealed) reveal(collection.slug, piece.slug)
  }

  function handleHintToggle(rung: number) {
    return (e: SyntheticEvent<HTMLDetailsElement>) => {
      if (e.currentTarget.open) takeHint(collection.slug, rung)
    }
  }

  const prompt = piece.guess.prompt ?? 'what animal is this?'
  const inputId = `guess-${collection.slug}-${piece.slug}`

  return (
    <div
      className={cn('mt-8 max-w-2xl rounded-2xl border-2 p-5', solvedOrRevealed ? 'border-solid' : 'border-dashed')}
      style={
        solvedOrRevealed
          ? { borderColor: tone, background: `color-mix(in srgb, ${tone} 6%, var(--card))` }
          : { borderColor: 'var(--border)' }
      }
    >
      {!solvedOrRevealed && (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor={inputId} className="font-brand-italic flex shrink-0 items-center gap-2 text-base text-foreground">
              <HelpCircle className="h-4 w-4 shrink-0" style={{ color: tone }} aria-hidden="true" />
              {prompt}
            </label>
            <div ref={shakeRef} className="flex flex-1 gap-2">
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                disabled={!mounted}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setWrong(false)
                }}
                placeholder="your guess"
                autoComplete="off"
                className={cn(
                  'min-w-0 flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  wrong ? 'border-destructive text-destructive' : 'border-border',
                )}
              />
              <button
                type="submit"
                className="font-brand shrink-0 rounded-lg px-4 py-1.5 text-sm lowercase text-primary-foreground transition-opacity hover:opacity-90"
                style={{ backgroundColor: tone }}
              >
                guess
              </button>
            </div>
          </form>
          <div aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-destructive">
            {wrong && 'not quite — try again'}
          </div>
        </>
      )}

      <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-sm', !solvedOrRevealed && 'mt-3')}>
        {takenHints < hints.length && !solvedOrRevealed && (
          <details onToggle={handleHintToggle(takenHints + 1)}>
            <summary className="cursor-pointer list-none text-muted-foreground [&::-webkit-details-marker]:hidden hover:text-foreground">
              ▸ hint ({takenHints + 1} of {hints.length})
            </summary>
          </details>
        )}
        {!solvedOrRevealed && (
          <details onToggle={handleRevealToggle}>
            <summary className="cursor-pointer list-none text-muted-foreground [&::-webkit-details-marker]:hidden hover:text-foreground">
              ▸ reveal
            </summary>
            <div ref={answerRef} tabIndex={-1} className="outline-none">
              <GuessReveal piece={piece} />
            </div>
          </details>
        )}
      </div>

      {takenHints > 0 && (
        <div className="mt-3 space-y-1.5">
          {hints.slice(0, takenHints).map((hint, i) => (
            <p key={i} className="font-brand-italic text-sm text-muted-foreground">
              {hint}
            </p>
          ))}
        </div>
      )}

      {solvedOrRevealed && (
        <div ref={answerRef} tabIndex={-1} className="outline-none" aria-live="polite">
          <GuessReveal piece={piece} status={status} />
        </div>
      )}
    </div>
  )
}
