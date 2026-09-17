import { BrandMark, B_ASCENDER, Q_STEM, BOWL, WEDGE } from '@/components/brand-mark'

/** One labeled stroke in the construction diagram below. */
const PARTS: { label: string; path: string; color: string }[] = [
  { label: 'b ascender', path: B_ASCENDER, color: 'var(--denim)' },
  { label: 'q stem', path: Q_STEM, color: 'var(--indigo)' },
  { label: 'bowl', path: BOWL, color: 'var(--terracotta)' },
  { label: 'wedge', path: WEDGE, color: 'var(--goldenrod)' },
]

/**
 * The mark at display size, plus a construction figure built from the same
 * four paths `BrandMark` draws from — reused, not re-pasted, so this can't
 * drift from the shipped geometry. See docs/specs/2026-09-branding-deck.md
 * §8.3.
 *
 * Does not reach into `docs/brand/` — that's source assets; this imports the
 * app's own component, built from them, per ARCHITECTURE's standing rule.
 */
export function MarkConstruction() {
  return (
    <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-border bg-card">
          <BrandMark detail="filled" className="h-20 w-20" />
        </div>
        <p className="font-brand text-xs uppercase tracking-[0.3em] text-muted-foreground">the mark</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 150 150" fill="none" className="h-32 w-32" role="img" aria-label="Construction: four strokes">
          {PARTS.map((p) => (
            <path key={p.label} d={p.path} stroke={p.color} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {PARTS.map((p) => (
            <li key={p.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label}
            </li>
          ))}
        </ul>
        <p className="max-w-xs text-center text-xs text-muted-foreground/80">
          The crescent is masked, not overpainted: the bowl is a full teardrop, and the wedge subtracts from it via an
          SVG mask — painting over it would leave a seam where the two strokes meet.
        </p>
      </div>
    </div>
  )
}
