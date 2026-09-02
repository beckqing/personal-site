'use client'

import { useState, type SyntheticEvent } from 'react'
import { RotateCcw } from 'lucide-react'
import { isGuessable, toneFor, type WorkCollection } from '@/lib/work'
import { guessStatusFor } from '@/lib/guess-storage'
import { useGuessProgressContext } from '@/components/guess-provider'

/** A tiny progress arc in the collection's tone — see spec §3, "◔ 3 of 8 named". */
function ProgressRing({ value, tone }: { value: number; tone: string }) {
  const size = 18
  const stroke = 2.5
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - value)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * The collection page's scorecard row — see
 * docs/specs/2026-09-guessing-game.md §3. Only rendered when
 * `hasGuessablePieces(item)`, inside a `GuessProgressProvider`.
 */
export function GuessScorecard({ collection }: { collection: WorkCollection }) {
  const { progress, mounted, takeHint, reset } = useGuessProgressContext()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const tone = toneFor(collection)

  const guessablePieces = collection.pieces.filter(isGuessable)
  if (guessablePieces.length === 0) return null

  const total = guessablePieces.length
  const solvedCount = mounted
    ? guessablePieces.filter((p) => guessStatusFor(progress, collection.slug, p.slug) === 'solved').length
    : 0
  const anyTaken = mounted
    ? guessablePieces.some((p) => Boolean(guessStatusFor(progress, collection.slug, p.slug)))
    : false

  const hints = collection.guessHints ?? []
  const takenHints = mounted ? Math.min(progress.hints[collection.slug] ?? 0, hints.length) : 0

  function handleHintToggle(rung: number) {
    return (e: SyntheticEvent<HTMLDetailsElement>) => {
      if (e.currentTarget.open) takeHint(collection.slug, rung)
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="flex items-center gap-2">
        <ProgressRing value={total > 0 ? solvedCount / total : 0} tone={tone} />
        <span className="font-brand text-sm lowercase text-muted-foreground">
          {solvedCount} of {total} named
        </span>
      </span>

      {takenHints < hints.length && (
        <details onToggle={handleHintToggle(takenHints + 1)}>
          <summary className="cursor-pointer list-none text-sm text-muted-foreground [&::-webkit-details-marker]:hidden hover:text-foreground">
            ▸ hint ({takenHints + 1} of {hints.length})
          </summary>
        </details>
      )}

      {anyTaken &&
        (confirmingReset ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">reset progress?</span>
            <button
              type="button"
              onClick={() => {
                reset()
                setConfirmingReset(false)
              }}
              className="text-foreground underline decoration-transparent underline-offset-2 hover:decoration-current"
            >
              yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="text-muted-foreground underline decoration-transparent underline-offset-2 hover:decoration-current"
            >
              cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="font-brand inline-flex items-center gap-1 text-sm lowercase text-muted-foreground underline decoration-transparent underline-offset-2 hover:text-foreground hover:decoration-current"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            reset
          </button>
        ))}

      {takenHints > 0 && (
        <div className="mt-1 w-full space-y-1.5">
          {hints.slice(0, takenHints).map((hint, i) => (
            <p key={i} className="font-brand-italic text-sm text-muted-foreground">
              {hint}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
