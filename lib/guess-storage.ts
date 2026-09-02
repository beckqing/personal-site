/**
 * Progress for the guessing game (see docs/specs/2026-09-guessing-game.md
 * §5), the site's first use of browser storage. One key for the whole
 * site, so a future guessable piece outside eye-studies needs no migration.
 */
export type GuessProgress = {
  /** Key: `${collection}/${piece}`. 'solved' and 'revealed' are distinct — only 'solved' counts on the scorecard. */
  pieces: Record<string, 'solved' | 'revealed'>
  /** Key: collection slug. How many hint rungs have been taken for the whole set — NOT per piece. */
  hints: Record<string, number>
}

export const GUESS_STORAGE_KEY = 'bq:guesses:v1'

export const EMPTY_GUESS_PROGRESS: GuessProgress = { pieces: {}, hints: {} }

export function guessPieceKey(collectionSlug: string, pieceSlug: string): string {
  return `${collectionSlug}/${pieceSlug}`
}

export function guessStatusFor(
  progress: GuessProgress,
  collectionSlug: string,
  pieceSlug: string,
): 'solved' | 'revealed' | undefined {
  return progress.pieces[guessPieceKey(collectionSlug, pieceSlug)]
}

/** Every read is wrapped: private windows, disabled site data, and quota errors all throw on access. */
export function readGuessProgress(): GuessProgress {
  if (typeof window === 'undefined') return EMPTY_GUESS_PROGRESS
  try {
    const raw = window.localStorage.getItem(GUESS_STORAGE_KEY)
    if (!raw) return EMPTY_GUESS_PROGRESS
    const parsed = JSON.parse(raw)
    return {
      pieces: parsed && typeof parsed.pieces === 'object' ? parsed.pieces : {},
      hints: parsed && typeof parsed.hints === 'object' ? parsed.hints : {},
    }
  } catch {
    return EMPTY_GUESS_PROGRESS
  }
}

function writeGuessProgress(progress: GuessProgress): void {
  try {
    window.localStorage.setItem(GUESS_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Best-effort: a session that forgets, never a crash.
  }
}

/** Marks a piece solved or revealed. Never downgrades an existing solve. */
export function markGuessPiece(
  collectionSlug: string,
  pieceSlug: string,
  status: 'solved' | 'revealed',
): GuessProgress {
  const progress = readGuessProgress()
  const key = guessPieceKey(collectionSlug, pieceSlug)
  if (progress.pieces[key] === 'solved') return progress
  const next: GuessProgress = { ...progress, pieces: { ...progress.pieces, [key]: status } }
  writeGuessProgress(next)
  return next
}

/** Advances the collection's shared hint ladder to (at least) `count` rungs taken. */
export function takeGuessHint(collectionSlug: string, count: number): GuessProgress {
  const progress = readGuessProgress()
  const current = progress.hints[collectionSlug] ?? 0
  if (count <= current) return progress
  const next: GuessProgress = { ...progress, hints: { ...progress.hints, [collectionSlug]: count } }
  writeGuessProgress(next)
  return next
}

/** Clears the whole key, not one piece — there is no other copy of this progress. */
export function resetGuessProgress(): GuessProgress {
  writeGuessProgress(EMPTY_GUESS_PROGRESS)
  return EMPTY_GUESS_PROGRESS
}
