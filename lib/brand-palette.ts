/**
 * Beck's 11 hand-picked brand colours, named on the deck's own "palette"
 * slide (docs/specs/2026-09-deck-visual-fidelity.md §8.1). A literal const
 * array, **duplicated from `app/globals.css` on purpose** — the live tokens
 * are theme roles (`--foreground` is two different colours), and this slide
 * documents fixed brand facts, not whichever colour a role currently
 * resolves to.
 *
 * Promoted out of `components/brand-palette.tsx` so slides 0, 3, 5 and 6 of
 * `/work/personal-branding` share one source (§5).
 */
export const BRAND_PALETTE: { name: string; hex: string }[] = [
  { name: 'white', hex: '#FFFFFF' },
  { name: 'summer storm', hex: '#69635E' },
  { name: 'midnight', hex: '#080B24' },
  { name: 'terra cotta', hex: '#8C3623' },
  { name: 'pumpkin pie', hex: '#BF712C' },
  { name: 'satin nickel', hex: '#A79F99' },
  { name: 'indigo', hex: '#0C3559' },
  { name: 'goldenrod', hex: '#D9AA52' },
  { name: 'pale slate', hex: '#CED2CD' },
  { name: 'denim', hex: '#305789' },
  { name: 'emerald', hex: '#4BA661' },
]
