'use client'

import { Check, Eye } from 'lucide-react'
import type { WorkPiece } from '@/lib/work'
import { guessStatusFor } from '@/lib/guess-storage'
import { useGuessProgressContext } from '@/components/guess-provider'
import { cn } from '@/lib/utils'

/**
 * A guessable piece's corner mark on the collection grid — see
 * docs/specs/2026-09-guessing-game.md §3. Only ever rendered by a caller
 * that has already checked `isGuessable(piece)`, inside a
 * `GuessProgressProvider` (guaranteed by `hasGuessablePieces` gating the
 * provider on the collection page). Takes the piece plus the collection's
 * slug and tone rather than the whole `WorkCollection` — the tile already
 * has `piece`, and the caller's `WorkCollection` carries all eight pieces,
 * payload weight this component has no use for.
 */
export function GuessTileMark({
  piece,
  collectionSlug,
  tone,
  className,
}: {
  piece: WorkPiece
  collectionSlug: string
  tone: string
  className?: string
}) {
  const { progress, mounted } = useGuessProgressContext()
  const status = mounted ? guessStatusFor(progress, collectionSlug, piece.slug) : undefined

  return (
    <span
      title={status === 'solved' ? 'named' : status === 'revealed' ? 'revealed' : 'guess below'}
      aria-hidden="true"
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm',
        className,
      )}
    >
      {status === 'solved' && <Check className="h-3.5 w-3.5" style={{ color: tone }} strokeWidth={2} />}
      {status === 'revealed' && <Eye className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />}
      {!status && <span className="text-xs text-muted-foreground">?</span>}
    </span>
  )
}
