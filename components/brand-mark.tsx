import { useId } from 'react'
import { cn } from '@/lib/utils'

// Geometry lifted verbatim from docs/brand/variants/ (Beck's own artboard,
// docs/brand/bq-logo-artboard.svg) — one drawing, reused at every detail
// level. See "The brand mark" in docs/ARCHITECTURE.md.
const B_ASCENDER = 'M31.1806 15C30.8667 75.9223 32.6191 98.4807 36.8125 132.291'
const Q_STEM = 'M121.769 28.3859C116.444 73.0819 115.31 115.719 117.712 131.807'
const BOWL =
  'M95.79 102.469C94.9327 125.453 80.2802 133.913 62.6194 133.254C44.9586 132.595 33.6739 117.838 34.3327 100.177C34.9915 82.5159 47.5492 63.1436 65.21 63.8023C82.8708 64.4611 96.4487 84.8082 95.79 102.469Z'
const WEDGE =
  'M102.475 84.2056C95.1815 97.5274 84.518 109.554 71.5271 109.069C57.2192 108.536 56.5038 96.0002 61.0042 82.6587C65.5046 69.3172 97.3067 34.9787 121.57 28.3785C118.825 48.29 106.234 77.3409 102.475 84.2056Z'

/**
 * The bq monogram — Beck's own mark, restored from the archived site
 * (github.com/beckqing/archived-personal-site). Replaces the retired
 * MoonLogo crescent everywhere; see "The brand mark" in docs/ARCHITECTURE.md
 * for the full palette and construction rationale.
 *
 * One geometry, two levels of detail:
 * - `'stroke'` (32px, nav/footer) — outline only, `currentColor`, no fill.
 * - `'filled'` (64px, hero) — masked+filled crescent: the bowl path is a
 *   full teardrop, and the crescent is only what's left after the wedge
 *   path subtracts from it via an SVG `<mask>` (not overpainted — see
 *   "Construction" in ARCHITECTURE.md for why overpaint silently breaks).
 *   Ink and crescent colour both theme automatically: ink follows
 *   `--foreground`, crescent follows `--brand-crescent` (globals.css).
 */
export function BrandMark({
  className,
  detail = 'stroke',
}: {
  className?: string
  detail?: 'stroke' | 'filled'
}) {
  const maskId = useId()
  const ink = detail === 'filled' ? 'var(--foreground)' : 'currentColor'

  return (
    <svg
      viewBox="0 0 150 150"
      fill="none"
      className={cn('h-8 w-8', className)}
      role="img"
      aria-label="beck qing logo"
    >
      {detail === 'filled' && (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="150" height="150">
            <path d={BOWL} fill="white" />
            <path d={WEDGE} fill="black" stroke="black" strokeWidth={11} strokeLinejoin="round" />
          </mask>
        </defs>
      )}
      <path d={B_ASCENDER} stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d={Q_STEM} stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      {detail === 'filled' && <path d={BOWL} fill="var(--brand-crescent)" mask={`url(#${maskId})`} />}
      <path d={BOWL} stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d={WEDGE} stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
