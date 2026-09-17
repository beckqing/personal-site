/**
 * The palette named on the deck's own "palette" slide — Beck's 11 hand-picked
 * brand colours, shown next to the site's actual token names. See
 * docs/specs/2026-09-branding-deck.md §8.1.
 *
 * Hexes are a literal const array, **duplicated from `app/globals.css` on
 * purpose** — the live tokens are theme roles (`--foreground` is two
 * different colours), and this slide documents fixed brand facts, not
 * whichever colour a role currently resolves to. `token` names the closest
 * live token for reference; where light and dark mode deepen a colour
 * differently for contrast (pumpkin pie, goldenrod — see "Palette
 * provenance"), `token` names the mode it matches exactly.
 */
const SWATCHES: { name: string; hex: string; token: string }[] = [
  { name: 'white', hex: '#FFFFFF', token: '—' },
  { name: 'summer storm', hex: '#69635E', token: '--muted-foreground (light)' },
  { name: 'midnight', hex: '#080B24', token: '--foreground (light) / --background (dark)' },
  { name: 'terra cotta', hex: '#8C3623', token: '--terracotta' },
  { name: 'pumpkin pie', hex: '#BF712C', token: '--writing (dark)' },
  { name: 'satin nickel', hex: '#A79F99', token: '--muted-foreground (dark)' },
  { name: 'indigo', hex: '#0C3559', token: '--indigo' },
  { name: 'goldenrod', hex: '#D9AA52', token: '--goldenrod (dark)' },
  { name: 'pale slate', hex: '#CED2CD', token: '--moon (dark)' },
  { name: 'denim', hex: '#305789', token: '--denim / --art' },
  { name: 'emerald', hex: '#4BA661', token: '--science (dark)' },
]

export function BrandPalette() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {SWATCHES.map((s) => (
        <div key={s.hex} className="flex flex-col gap-2">
          <div
            className="aspect-square w-full rounded-xl border border-border"
            style={{ backgroundColor: s.hex }}
            role="img"
            aria-label={`${s.name}, ${s.hex}`}
          />
          <div>
            <p className="font-brand text-sm lowercase text-foreground">{s.name}</p>
            <p className="font-brand text-xs text-muted-foreground">{s.hex}</p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">{s.token}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
