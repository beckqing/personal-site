import Image from 'next/image'
import { Quote } from 'lucide-react'
import type { CSSProperties } from 'react'
import { entryName } from '@/components/code-demo-frame'
import { UnfinishedMark } from '@/components/work-visuals'
import { toneFor, type WorkPiece } from '@/lib/work'

/**
 * One rung of the loose column, as percentages of the column's own width
 * (`w`/`x`) and degrees of rotation at rest (`r`) — the open state is a
 * constant `0deg` (§8), so there is no `hr` here. `show` is the fraction of
 * this rung left uncovered by the rung below it — the band you actually
 * see. The last rung's `show` is 1: nothing covers it. `w`/`r`/`show` are
 * verbatim from §4 of docs/specs/2026-09-home-discipline-columns.md; `x` is
 * retabled by §12.2 of docs/specs/2026-09-narrow-screen-columns.md — the
 * old 2–14 range left the right 10–26% of every rung's column empty (an
 * `x + w ≤ 90` invariant sized for rotation jitter that only needs ~4%), so
 * rungs now alternately lean toward their column's left and right edges —
 * matching the alternating sign of `r` — and slightly overhang them. Nothing
 * clips: `.column-fade`/`.columns-fade-shared` are `mask-image`, which
 * doesn't clip horizontally, so the overhang is bounded by the page's own
 * `px-5`/`px-8` padding, not by the column itself.
 */
const COLUMN = [
  { w: 72, x: -4, r: -2.5, show: 0.52 },
  { w: 76, x: 21, r: 2.0, show: 0.55 },
  { w: 70, x: 6, r: -1.5, show: 0.5 },
  { w: 74, x: 26, r: 3.0, show: 1 },
] as const

type Rung = (typeof COLUMN)[number]

/**
 * A text rung's fixed aspect ratio (§3) — the one deliberate normalization
 * in this component. Unlike an image, type has no native shape to preserve,
 * and the shared fade line (§5) needs the writing column's height to land
 * within roughly 15% of the art column's, which an intrinsically-sized text
 * rung can't promise. Tuned by looking, not computed; start here and adjust
 * if the two columns drift apart.
 */
const TEXT_RUNG_ASPECT = 1

/**
 * The code-demo rail's fixed height, mirroring `CodeDemoFrame`'s own rail
 * (components/code-demo-frame.tsx) — a status dot, "paused", and the entry
 * name, all in one `py-2` row. Fixed in `rem` because it's one line of
 * chrome regardless of the column's width. Verified against the rendered
 * rail, not computed.
 */
const RAIL_HEIGHT_REM = 2

function parseAspect(aspect: string): number {
  const [w, h] = aspect.split('/').map(Number)
  return w / h
}

/** `imageAspect` when a piece has one, `TEXT_RUNG_ASPECT` otherwise (§4's `aspect(p)`). */
function aspectOf(piece: WorkPiece): number {
  return piece.imageAspect ? parseAspect(piece.imageAspect) : TEXT_RUNG_ASPECT
}

/**
 * The negative top margin that tucks a rung under the piece above it,
 * derived from that piece rather than tabled (§4, "Overlap is derived, not
 * tabled") — every piece now has an aspect (its own `imageAspect`, or
 * `TEXT_RUNG_ASPECT` for type), so its rendered height in
 * percent-of-column-width units is always knowable, and `show` directly
 * gives how much of it stays uncovered. A code-demo piece is taller than
 * `w / aspect` by its rail's fixed height, so its contribution mixes a
 * percentage and a `rem` term — safe for the same reason `deckLength()`
 * (work-visuals.tsx) mixes them for the collection stack's one fixed-strip
 * card: the percentage still resolves against the column's width, and the
 * `rem` term simply doesn't participate.
 */
function overlapAbove(prevPiece: WorkPiece, prevRung: Rung): string {
  const uncovered = 1 - prevRung.show
  const pctTerm = -uncovered * (prevRung.w / aspectOf(prevPiece))
  if (prevPiece.codeDemo) {
    const remTerm = -uncovered * RAIL_HEIGHT_REM
    return `calc(${pctTerm}% + ${remTerm}rem)`
  }
  return `${pctTerm}%`
}

/**
 * One piece rendered one of three ways, checked in that order and derived
 * from what the piece carries — no `kind` field (§3):
 *
 * - a code demo renders in a static rail + poster, never as a plain image —
 *   drawn any other way it reads as a painting, which it isn't;
 * - an image renders at its own `imageAspect`, never normalized;
 * - anything else renders as up to two lines of type in a fixed-aspect box.
 *
 * Text reads `preview ?? description`, deliberately never `text`: `text` is
 * the whole work, and its first source line can be an entire paragraph —
 * exactly what broke the previous (peek) build. This departs from the
 * site-wide `preview → text → description` chain used elsewhere
 * (work-visuals.tsx) on purpose.
 */
function PieceRung({ piece, geometry, marginTop }: { piece: WorkPiece; geometry: Rung; marginTop?: string }) {
  const style: CSSProperties = {
    width: `${geometry.w}%`,
    marginLeft: `${geometry.x}%`,
    marginTop,
    ['--r' as string]: `${geometry.r}deg`,
  }

  if (piece.codeDemo) {
    return (
      <div
        aria-hidden="true"
        className="column-rung relative flex flex-col overflow-hidden rounded-lg border border-foreground/10 bg-card shadow-sm"
        style={style}
      >
        {piece.unfinished && <UnfinishedMark className="absolute right-2 top-2 z-10" />}
        {/* The rail reads "paused", never "running" — this is a still, and
            claiming otherwise would imply something executes here. No
            iframe, no "open standalone" link: nothing here boots, so
            nothing needs a tab stop (§3, §9). */}
        <div className="flex items-center gap-3 border-b border-foreground/10 px-3 py-2">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
          <span className="font-brand text-xs lowercase text-muted-foreground">paused</span>
          <span className="font-brand min-w-0 flex-1 truncate text-center text-xs text-muted-foreground/70">
            {entryName(piece.codeDemo.src)}
          </span>
        </div>
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: piece.codeDemo.aspect }}>
          {piece.image && (
            <Image
              src={piece.image}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 640px) 75vw, 280px"
              className="object-cover"
            />
          )}
        </div>
      </div>
    )
  }

  if (piece.image) {
    return (
      <div
        aria-hidden="true"
        className="column-rung relative overflow-hidden rounded-lg border border-foreground/10 bg-card shadow-sm"
        style={{ ...style, aspectRatio: piece.imageAspect }}
      >
        {piece.unfinished && <UnfinishedMark className="absolute right-2 top-2 z-10" />}
        <Image src={piece.image} alt="" aria-hidden fill sizes="(max-width: 640px) 75vw, 280px" className="object-cover" />
      </div>
    )
  }

  const excerpt = piece.preview ?? piece.description ?? piece.title
  const tone = toneFor(piece)
  return (
    <div
      aria-hidden="true"
      className="column-rung relative overflow-hidden rounded-lg border border-foreground/10 bg-card px-2 py-3 shadow-sm"
      style={{ ...style, aspectRatio: TEXT_RUNG_ASPECT }}
    >
      {/* The same quote glyph TextCard/HybridCard use to mark an excerpt
          (work-visuals.tsx, work-gallery.tsx) — without it a text rung
          reads as a caption, not a pull from a longer piece. */}
      <Quote
        className="mb-2 h-6 w-6 shrink-0 -scale-x-100"
        style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      {/* Type sets at the top of the box, not centered — the band that
          stays visible under the rung below is the top band (§4), so
          top-set type is always the type that shows.

          §12.1 of the narrow-screen-columns spec: this is Recursive Mono
          (`.font-brand-italic` sets `MONO 1`), whose ~0.6em advance means
          `text-base` was already clipping the longest previews (this rung
          is not "provably" un-croppable at two lines — that was never
          true at a mono advance). `text-xs`/`px-2` buy back the width, and
          the rung has vertical room to spend: at a 288px desktop rung the
          box is ~78% empty at two lines of `text-base`. The clamp count
          varies by width instead of a flat number because the column's
          pixel width (not just its aspect) is what decides how many lines
          a fixed-height box can hold without the mono type looking
          sparse — line-clamp-3 at `xs` uses the room the narrower column
          leaves that `md`'s wider rung doesn't need as badly.

          The mark sits in normal flow right after the excerpt, not
          absolutely overlaid — an overlay corner is only ever guaranteed
          visible on the *last* rung (§4's `show: 1`); every earlier rung
          has its bottom portion covered by the one below it, which is
          exactly where a corner badge would sit. Stacking the mark under
          the text instead keeps both inside the top band every rung
          actually keeps visible, regardless of its position in the
          column. */}
      <p className="font-brand-italic line-clamp-2 xs:line-clamp-3 md:line-clamp-2 text-xs leading-relaxed text-foreground/80">
        {excerpt}
      </p>
      {piece.unfinished && (
        <div className="mt-2 flex justify-end">
          <UnfinishedMark />
        </div>
      )}
    </div>
  )
}

/**
 * A discipline's loose column of 2–4 unrelated pieces — an even run with no
 * featured piece, each rung tucked under the one above it in normal flow
 * (never `translate()` or absolute positioning — see §4/§8's "unit trap"),
 * squaring up to 0° when the column opens. Purely decorative: the
 * discipline's badge, copy, and CTA already say everything it implies.
 *
 * `.column-fade` (globals.css) fades *this* column individually below
 * `md`, where the three columns stack rather than sitting side by side —
 * it turns itself off at `md` and up, where the caller wraps all three
 * columns in one `.columns-fade-shared` container instead (§5). One
 * component, two fade regimes, picked by the same breakpoint the layout
 * itself switches on.
 */
export function PieceColumn({ pieces }: { pieces: WorkPiece[] }) {
  return (
    <div className="column-fade">
      {pieces.map((piece, i) => (
        <PieceRung
          key={piece.slug}
          piece={piece}
          geometry={COLUMN[i]}
          marginTop={i === 0 ? undefined : overlapAbove(pieces[i - 1], COLUMN[i - 1])}
        />
      ))}
    </div>
  )
}
