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
 *   Ink and crescent colour both theme automatically by default: ink
 *   follows `--foreground`, crescent follows `--brand-crescent`
 *   (globals.css) — but both accept a literal override for the deck's
 *   "alternate palettes" chips (docs/specs/2026-09-deck-visual-fidelity.md
 *   §6.4), which paint the same mark in fixed, non-theme colours.
 *
 *   `wedgeColor` fills the wedge shape itself (the moon's "other half" —
 *   whatever the crescent's mask cuts away from the bowl) as a second
 *   accent, independent of the crescent. It is a fill, not a stroke: the
 *   wedge's own outline is one continuous stroke with the ascender, stem,
 *   and bowl (it draws the thick head of the "q", tapering into
 *   `Q_STEM`'s thin tail), so giving that outline its own colour splits
 *   one letterform stroke into two colours mid-line. Fixed 2026-09-17
 *   (Beck: "the counter fill being used as the stroke for the q").
 */
export function BrandMark({
  className,
  detail = 'stroke',
  ink: inkOverride,
  crescentColor,
  wedgeColor,
}: {
  className?: string
  detail?: 'stroke' | 'filled'
  ink?: string
  crescentColor?: string
  wedgeColor?: string
}) {
  const maskId = useId()
  const ink = inkOverride ?? (detail === 'filled' ? 'var(--foreground)' : 'currentColor')
  const crescent = crescentColor ?? 'var(--brand-crescent)'

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
      {detail === 'filled' && <path d={BOWL} fill={crescent} mask={`url(#${maskId})`} />}
      {detail === 'filled' && wedgeColor && <path d={WEDGE} fill={wedgeColor} />}
      <path d={B_ASCENDER} stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d={Q_STEM} stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d={BOWL} stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d={WEDGE} stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
