import { forwardRef, type ComponentType, type CSSProperties, type SVGProps } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Archive, ArrowRight, FileText, Hourglass, ImageOff, Layers, Quote } from 'lucide-react'
import { HeartIcon } from '@/components/heart-icon'
import { SpeedpaintIcon } from '@/components/speedpaint-icon'
import {
  animationPosterFor,
  DISCIPLINE_FACETS,
  DISCIPLINES,
  formFor,
  hasWriteup,
  imageLightboxSlice,
  isChapbook,
  isCollection,
  isGuessable,
  isHybrid,
  isTextForward,
  isTextOnly,
  piecePath,
  posterAspectFor,
  primaryDiscipline,
  tagTone,
  toneFor,
  type ProcessStill,
  type StatusFlag,
  type WorkCollection,
  type WorkItem,
  type WorkPiece,
} from '@/lib/work'
import { GuessTileMark } from '@/components/guess-mark'
import { GuessTileForm } from '@/components/guess-tile-form'
import { ImageLightbox } from '@/components/image-lightbox'
import { MediaBadges } from '@/components/media-player'
import { cn } from '@/lib/utils'
import { headingStyles } from '@/lib/heading-styles'

const ASPECTS = ['aspect-square', 'aspect-[4/5]', 'aspect-[5/4]', 'aspect-[3/4]']

function hashSlug(slug: string) {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return h
}

/** Deterministic pseudo-random aspect ratio so masonry grids feel varied but stable. */
export function aspectFor(slug: string) {
  return ASPECTS[hashSlug(slug) % ASPECTS.length]
}

/**
 * The aspect ratio of whatever picture will actually fill this box, as an
 * inline style — takes priority over a card's default/hashed aspect class so
 * real artwork renders uncropped instead of forced into a shape it wasn't
 * made for. Reads `posterAspectFor`, not `imageAspect` directly, so a piece
 * whose card shows its embed's 16:9 thumbnail gets a 16:9 box rather than one
 * sized for a still it isn't showing. Undefined when nothing is known,
 * leaving the caller's class in charge.
 */
export function aspectStyleFor(item: WorkItem): CSSProperties | undefined {
  const aspect = posterAspectFor(item)
  return aspect ? { aspectRatio: aspect } : undefined
}

/**
 * The most specific category tag an item carries (medium/form/field), used as
 * the big watermark on placeholder art. Falls back to the discipline itself.
 */
export function categoryLabel(item: WorkItem): string {
  for (const d of DISCIPLINES) {
    const hit = DISCIPLINE_FACETS[d].tags.find((t) => item.tags.includes(t))
    if (hit) return hit
  }
  return primaryDiscipline(item) ?? 'work'
}

/** Small badge flagging that a piece or collection has a write-up worth reading. */
export function WriteupMark({ className }: { className?: string }) {
  return (
    <span
      title="includes a write-up"
      aria-label="Includes a write-up"
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-sm',
        className,
      )}
    >
      <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
    </span>
  )
}

/** Badge flagging a piece as still in progress rather than finished — see `WorkPiece.unfinished`. */
export function UnfinishedMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-brand inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs lowercase text-foreground backdrop-blur-sm',
        className,
      )}
    >
      <Hourglass className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      in progress
    </span>
  )
}

const STATUS_ICON: Record<
  StatusFlag,
  {
    Icon: ComponentType<SVGProps<SVGSVGElement>>
    label: string
    /** Size override for this glyph. Default (unset) is `h-3.5 w-3.5`. */
    size?: string
    /** Narrow-column companion to `size`, for CollectionMark's `@max-3xs/card` step. Default (unset) is `h-3 w-3`. */
    sizeNarrow?: string
  }
> = {
  favorite: { Icon: HeartIcon, label: "Favorite — one of Beck's favorites" },
  archive: {
    Icon: Archive,
    label: 'Archived — out of the default browse, still published',
    // Archive's box shape fills its viewBox more than the other glyphs do,
    // so at the shared default size it reads visibly bigger — sized down a
    // touch to sit closer to CollectionMark's Layers icon beside it.
    size: 'h-3 w-3',
    sizeNarrow: 'h-2.5 w-2.5',
  },
  unfinished: { Icon: Hourglass, label: 'In progress' },
  speedpaint: { Icon: SpeedpaintIcon, label: 'Includes a speedpaint video' },
}

/**
 * The single home for every status glyph that used to be its own
 * absolutely-positioned corner pill (`FavoriteMark`, `ArchiveMark`,
 * `UnfinishedMark`, and `MediaBadges`' speedpaint dot) — one shared pill
 * holding up to three small icons instead of up to three separately
 * blurred/backgrounded pills competing for the same corner(s). A future
 * status flag joins `StatusFlag` + `STATUS_ICON` + `statusFlagsFor()`; it
 * does not get its own corner pill.
 *
 * `favorite` is the only flag that takes `tone` — the rest stay neutral
 * `text-muted-foreground`, matching what the three deleted mark components
 * did individually. The heart renders filled with no stroke at all —
 * `fill="currentColor"` and `stroke="none"` — unlike the old `FavoriteMark`,
 * which stroked it in the page background to cut a seam between the two
 * lobes; at this pill's tightened size that seam read as more outline than
 * heart, so it's a plain silhouette now.
 */
export function StatusRail({
  flags,
  tone,
  className,
}: {
  flags: StatusFlag[]
  /** Tint for the favorite glyph specifically. Ignored for the other flags. */
  tone?: string
  className?: string
}) {
  if (flags.length === 0) return null
  return (
    <div
      role="group"
      aria-label="Status"
      className={cn(
        // Uniform p-1 (not px/py split) so a single-icon rail is a true
        // circle — square content box, rounded-full — rather than an oval;
        // multiple icons still read as a pill since the row itself is wider
        // than it is tall.
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-background/80 p-1 backdrop-blur-sm',
        className,
      )}
    >
      {flags.map((flag) => {
        const { Icon, label, size = 'h-3.5 w-3.5' } = STATUS_ICON[flag]
        const isFavorite = flag === 'favorite'
        return (
          <span
            key={flag}
            title={label}
            aria-label={label}
            className={cn('inline-flex items-center justify-center', !isFavorite && 'text-muted-foreground')}
            style={isFavorite ? { color: tone } : undefined}
          >
            <Icon
              className={size}
              strokeWidth={1.75}
              aria-hidden="true"
              {...(isFavorite ? { fill: 'currentColor', stroke: 'none' } : {})}
            />
          </span>
        )
      })}
    </div>
  )
}

/**
 * Badge showing how many pieces a collection holds. Two sizes, wide by
 * default and narrow under the card's own column width (`@max-3xs/card`,
 * 256px — narrow-screen-columns spec §9.3, superseding §9.1's `sm` media
 * query so this moves in lockstep with the deck below, which keys off the
 * same container): narrow shrinks the deck's card 4 strip along with the
 * pill, so the pill shrinks too, dropping the word `pieces` —
 * `not-sr-only @max-3xs/card:sr-only`, not `hidden`/`inline`, so the count
 * keeps its noun in the accessible name at every width even though it's
 * dropped visually. The narrow line-height is set explicitly
 * (`leading-[14px]`, not inherited): `CARD4_STRIP_PX_NARROW` is measured
 * from this pill's exact rendered height, and an inherited line-height would
 * throw that measurement off.
 *
 * `statusFlags` folds a collection's own status glyphs into this same pill
 * — an experiment in place of a separate `StatusRail` corner badge fighting
 * this one for the same bottom-right spot. Icons render at the same size
 * (and same wide/narrow split) as the `Layers` glyph beside them, so this
 * pill's height — the thing `CARD4_STRIP_PX_WIDE`/`_NARROW` are measured
 * against — doesn't move; only its width grows.
 */
export function CollectionMark({
  count,
  statusFlags,
  tone,
  className,
}: {
  count: number
  statusFlags?: StatusFlag[]
  /** Tint for the favorite glyph specifically. Ignored for the other flags. */
  tone?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-brand inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs leading-normal lowercase text-foreground backdrop-blur-sm @max-3xs/card:gap-1 @max-3xs/card:px-2 @max-3xs/card:py-0.5 @max-3xs/card:text-[10px] @max-3xs/card:leading-[14px]',
        className,
      )}
    >
      {statusFlags?.map((flag) => {
        const { Icon, label, size = 'h-3.5 w-3.5', sizeNarrow = 'h-3 w-3' } = STATUS_ICON[flag]
        const isFavorite = flag === 'favorite'
        return (
          <span
            key={flag}
            title={label}
            aria-label={label}
            className={cn('inline-flex items-center justify-center', !isFavorite && 'text-muted-foreground')}
            style={isFavorite ? { color: tone } : undefined}
          >
            <Icon
              className={cn(size, sizeNarrow.split(' ').map((c) => `@max-3xs/card:${c}`))}
              strokeWidth={1.75}
              aria-hidden="true"
              {...(isFavorite ? { fill: 'currentColor', stroke: 'none' } : {})}
            />
          </span>
        )
      })}
      <Layers className="h-3.5 w-3.5 @max-3xs/card:h-3 @max-3xs/card:w-3" strokeWidth={1.75} aria-hidden="true" />
      <span className="text-muted-foreground">
        {count}
        <span className="not-sr-only @max-3xs/card:sr-only"> pieces</span>
      </span>
    </span>
  )
}

/**
 * The real image for a piece when it has one; otherwise a tinted placeholder
 * standing in for it — no fabricated images, just the item's category as a
 * watermark over its discipline tone.
 */
export const WorkPlaceholder = forwardRef<
  HTMLImageElement,
  {
    item: WorkItem
    className?: string
    /** 'thumb' prefers the heavily compressed stand-in (see WorkPiece.thumb) — for spots where the image is barely visible, like a collection stack's back cards. Falls back to the full image when there's no thumb. */
    quality?: 'full' | 'thumb'
    /** 'contain' shows the whole image uncropped (letterboxing if the box doesn't match its ratio) — for a lightbox/detail view where seeing the full piece matters more than filling the box. Grid tiles want the 'cover' default. */
    fit?: 'cover' | 'contain'
  }
>(function WorkPlaceholder({ item, className, quality = 'full', fit = 'cover' }, ref) {
  const tone = toneFor(item)
  const src = quality === 'thumb' ? (item.thumb ?? animationPosterFor(item)) : animationPosterFor(item)

  if (src && fit === 'contain') {
    // A plain (non-`fill`) image is a real replaced element with intrinsic
    // size, so height:auto + max-height/max-width scale it down without
    // cropping — and any border/shadow in `className` lands on the actual
    // rendered picture instead of a differently-shaped bounding box.
    const [wRatio, hRatio] = (item.imageAspect ?? '16/10').split('/').map(Number)
    // 2000, not the source ceiling of 1800: the lightbox's naturalWidth
    // clamp (see ImageLightbox) needs headroom above every current source,
    // or the cap becomes the candidate width instead of the source width.
    const width = 2000
    const height = Math.round(width * (hRatio / wRatio))
    return (
      <Image
        ref={ref}
        src={src}
        alt={item.title}
        width={width}
        height={height}
        className={cn('h-auto w-auto object-contain', className)}
      />
    )
  }

  if (src) {
    return (
      <div className={cn('relative h-full w-full overflow-hidden', className)}>
        <Image
          src={src}
          alt={item.title}
          fill
          sizes="(max-width: 31.25rem) 50vw, 33vw"
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col justify-end overflow-hidden p-4',
        fit === 'contain' && 'aspect-[16/10] h-auto w-full',
        className,
      )}
      style={{ background: `color-mix(in srgb, ${tone} 16%, var(--card))` }}
    >
      {isTextOnly(item) ? (
        <Quote
          className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 -scale-x-100 opacity-25"
          style={{ color: tone }}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ) : (
        <ImageOff
          className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 opacity-25"
          style={{ color: tone }}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
      <span
        aria-hidden="true"
        className="font-brand pointer-events-none absolute bottom-2 right-3 max-w-[calc(100%-1.5rem)] truncate text-right text-4xl font-bold lowercase leading-none tracking-tight @max-3xs/card:text-3xl"
        style={{ color: tone, opacity: 0.26 }}
      >
        {categoryLabel(item)}
      </span>
    </div>
  )
})

/** A stanza that is one unbroken run, too long to be a verse line. */
const PROSE_RUN_MIN = 90
function isProseRun(stanza: string) {
  return !stanza.includes('\n') && stanza.length > PROSE_RUN_MIN
}

/**
 * The primitive that renders written work everywhere it appears — the
 * chapbook reading page, a hybrid piece's page, and every card face (stack,
 * TextCard, HybridCard, piece tile). Splits on blank lines into stanzas, each
 * stanza into lines, and renders each line as its own block: a wrapped line
 * gets a quiet 1ch hanging indent (marking it as a wrap without shouting
 * about it — `ch` because the face is monospace, so it lands on the
 * character grid), and a stanza gap is `1lh` of margin so it scales with type
 * size instead of a hard-coded double `<br>`.
 *
 * A long unbroken stanza (prose, not verse) sets upright instead of slanted
 * — but only at reading size. In a card the quote glyph and tint already
 * frame the text as a quotation, so everything there stays italic
 * regardless of form; `context="card"` skips the prose-run check entirely.
 */
export function VerseBlock({
  text,
  context = 'reading',
  className,
}: {
  text: string
  /** 'card' keeps everything slanted — see the prose-run note above. */
  context?: 'reading' | 'card'
  className?: string
}) {
  // The hanging indent marks a wrapped line as a wrap, not a new one — in a
  // card's own narrow column (`@max-3xs/card`, 256px — §9.3 of
  // narrow-screen-columns, superseding §12.1's `sm` media query) a 1ch
  // indent eats a disproportionate share of the already-tight measure, so
  // 'card' drops it there and picks it back up once the column has the room
  // again. 'reading' keeps it unconditionally — that context never renders
  // inside a narrow column.
  const wrapIndent =
    context === 'card'
      ? '[text-indent:-1ch] pl-[1ch] @max-3xs/card:[text-indent:0] @max-3xs/card:pl-0'
      : '[text-indent:-1ch] pl-[1ch]'
  return (
    <div className={cn('font-brand-italic max-w-[58ch] text-pretty leading-relaxed', className)}>
      {text.split('\n\n').map((stanza, s) =>
        context === 'reading' && isProseRun(stanza) ? (
          <p key={s} className="font-brand not-italic [&+*]:mt-[1lh]">
            {stanza}
          </p>
        ) : (
          <p key={s} className="[&+*]:mt-[1lh]">
            {stanza.split('\n').map((line, i) => (
              <span key={i} className={cn('block', wrapIndent)}>
                {line || ' '}
              </span>
            ))}
          </p>
        ),
      )}
    </div>
  )
}

/**
 * A stacked card's face for a chapbook — the exact same quote-icon,
 * excerpt, and title treatment as a standalone TextCard (same type sizes
 * too), so a chapbook's stack reads as the same kind of card as
 * the writing pieces beside it. Each of the three visible layers gets its
 * own piece from the chapbook (its first three), rather than all three
 * repeating the collection's own blurb, so the stack itself hints at the
 * range of what's inside. Leads with `preview` rather than the full `text`
 * — a hand-set, short pull-quote meant for exactly this kind of compact
 * spot, so nothing needs clipping to fit. Used in place of WorkPlaceholder
 * for chapbook stacks, which have no images to show.
 */
function TextCardFace({
  piece,
  className,
  style,
}: {
  piece: WorkPiece
  className?: string
  style?: CSSProperties
}) {
  const tone = toneFor(piece)
  const excerpt = piece.preview ?? piece.text ?? piece.description ?? ''
  return (
    <div
      className={cn('flex h-full w-full flex-col p-6 @max-3xs/card:p-3', className)}
      style={{ background: `color-mix(in srgb, ${tone} 8%, var(--card))`, ...style }}
    >
      <div className="flex items-start justify-between gap-3">
        <Quote
          className="h-7 w-7 shrink-0 -scale-x-100"
          style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span className="font-brand inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-[0.7rem] lowercase text-muted-foreground">
          {formFor(piece)}
        </span>
      </div>

      {/* flex-1 + min-h-0 (not mt-auto on the title row) keeps the title in
          the visible peek whether the card has slack or is clamped — see
          "Collection stack geometry" in docs/ARCHITECTURE.md. text-lg by
          default, line-clamp-4 text-sm under the card's own column width
          (`@max-3xs/card` — §9.3 of narrow-screen-columns): the cover card
          (card 1 in ChapbookStack) is `h-auto`, so unlike cards 2/3 (bounded
          by `max-h-96`, where flex-1/overflow-hidden alone already clipped
          it) nothing caps its height before this — same excerpt-towers-the-
          card bug as WorkGallery's TextCard/HybridCard, fixed the same way. */}
      <VerseBlock
        text={excerpt}
        context="card"
        className="mt-3 min-h-0 flex-1 overflow-hidden text-lg text-foreground @max-3xs/card:line-clamp-4 @max-3xs/card:text-sm"
      />

      <p className="mt-4 truncate font-brand text-sm lowercase tracking-wide text-muted-foreground">
        {piece.title}
      </p>
    </div>
  )
}

/**
 * A collection's placeholder as a tapered stack of cards, full column width
 * like a standalone piece's image (no shrinking to fit diagonal spill — the
 * cards only spread downward, not sideways, so they never bleed into the
 * next column). The cover sits flat on top, fully visible; each card behind
 * it peeks out from lower down by a shrinking amount. The 4th and lowest
 * card is permanently blank and neutral — never a real piece, since with
 * only two real backing pieces there's nothing else to show there — and
 * carries the collection's real total on a pill seated in its own
 * bottom-right corner, so it reads as an honest "and N more" rather than an
 * open-ended tease. At rest the stack tapers inward (each card's peek and
 * tilt smaller than the one in front) so it reads as a slightly squeezed
 * pile; on hover cards 2-4 ease toward flatter rotation and a touch more
 * peek — a gentle un-tapering, not a full fan-open — while card 1 takes the
 * same small lift a plain gallery card does, and every card deepens its
 * shadow together. Rotation pivots around each card's
 * own bottom-CENTER rather than a corner, so the tilt reads as a lean in
 * place instead of dragging the card visibly left/right off-center. The two
 * real pieces get low-quality thumbnails since only a thin strip of each is
 * ever visible.
 *
 * The container reserves its true height with bottom padding from
 * `deckReserve` — the back cards are all `position: absolute` and so
 * contribute nothing to normal document flow on their own, and this grid is
 * CSS columns, which needs a real (not faked-with-margin) height to lay out
 * the next item. That reserve is sized to REST, the state that sets the
 * grid's rhythm; hover opens by flattening rotation rather than pushing the
 * deck down, so the tile's bottom edge never moves.
 */
/** A tilted card's bottom corner dips below its own bottom edge by 50*sin(deg)% of its width. */
const dip = (deg: number) => 50 * Math.sin((deg * Math.PI) / 180)

/**
 * Card 3's cumulative offset, which card 4's is measured from rather than
 * restated — two values now, split at `sm` (narrow-screen-columns spec
 * §9.1). Card 4's strip is a fixed pixel length while cards 2/3 are
 * percentages of the column width, so as the gallery pairs into two columns
 * below `sm` the fixed strip stops shrinking with everything else and the
 * taper **inverts** — the blank counting card ends up deeper than the real
 * card in front of it. Widening card 3 below `sm` keeps the taper
 * descending at every real width; `_WIDE` is untouched, so the desktop deck
 * (98/61/40 at a 350px column) is byte-for-byte what it always was.
 */
const CARD3_Y_WIDE = 45.5
const CARD3_Y_NARROW = 50

/**
 * Card 4's strip is the count pill plus an equal 0.5rem margin on the three
 * sides that show. `CollectionMark` is fixed-size text sitting at
 * `bottom-2 right-2`, so this is the one absolute length in the deck, and
 * card 4 is the only card it could be: cards 2 and 3 show a proportion of
 * something that scales, while card 4 is deliberately blank and exists only
 * to carry the total. Change `CollectionMark`'s padding, text size or inset
 * and these numbers change with them — nothing recomputes them.
 *
 * Two values, split at `sm` along with `CollectionMark` itself and
 * `CARD3_Y_NARROW` above (§9.1): wide is `px-2.5 py-1 text-xs` (a 16px line
 * box plus 4px padding top and bottom, the `h-3.5` icon fitting inside it) —
 * 8 + 24 + 8. Narrow is the mark's smaller `px-2 py-0.5 text-[10px]/[14px]`
 * form — 4 + 18 + 4.
 *
 * The 8px (wide) / 4px (narrow) above the pill is measured at the card's
 * centre line, where rotation has no effect; at the pill's own corner the
 * opposed tilts of cards 3 and 4 open the gap further. That wedge is
 * intended — don't flatten card 4's tilt to even it out.
 */
const CARD4_STRIP_PX_WIDE = 40
const CARD4_STRIP_PX_NARROW = 26

type DeckCard = { y: number; px: number; r: number; hy: number; hpx: number; hr: number }

/**
 * The deck's geometry, one pair of tables for both stacks — cards 2 and 3 in
 * geometric decay (ratio ~0.63 wide) as percentages of the COLUMN WIDTH
 * (never card height or `em`), card 4 at the fixed pill strip above; tilts
 * monotonic throughout. See "Collection stack geometry" in
 * docs/ARCHITECTURE.md. `y`/`hy` are cumulative offsets from the cover's
 * bottom edge (rest/hover) and `px`/`hpx` the fixed part of the same offset;
 * `r`/`hr` are the matching tilts. The only source of truth for both the
 * `.deck-card` CSS custom properties and the container's reserve below.
 *
 * Card 4's hover offset is derived, not chosen: it is whatever keeps
 * `y + dip(r)` equal across rest and hover, so the reserve — and with it the
 * tile's bottom edge — doesn't move when the deck flattens.
 *
 * `DECK_NARROW` (< `sm`, §9.1 of the narrow-screen-columns spec): card 2 and
 * every tilt are unchanged from `DECK_WIDE` — only card 3's `y` (and the
 * `hy` derived from it, by the same rule) and card 4's strip move, so the
 * taper stays descending in a paired ~130px column instead of inverting.
 * `DECK_WIDE` itself is untouched by this split — it's exactly what shipped
 * before this spec, verified against a regression there being as much a
 * failure as an inverted taper on a phone.
 */
const DECK_WIDE = {
  card2: { y: 28, px: 0, r: 3.5, hy: 30, hpx: 0, hr: 1 },
  card3: { y: CARD3_Y_WIDE, px: 0, r: -2.5, hy: 46.8, hpx: 0, hr: -1 },
  card4: {
    y: CARD3_Y_WIDE,
    px: CARD4_STRIP_PX_WIDE,
    r: 1.5,
    hy: CARD3_Y_WIDE + dip(1.5) - dip(0.5),
    hpx: CARD4_STRIP_PX_WIDE,
    hr: 0.5,
  },
} as const satisfies Record<'card2' | 'card3' | 'card4', DeckCard>

const DECK_NARROW = {
  card2: DECK_WIDE.card2,
  card3: {
    y: CARD3_Y_NARROW,
    px: 0,
    r: -2.5,
    hy: CARD3_Y_NARROW + dip(2.5) - dip(1),
    hpx: 0,
    hr: -1,
  },
  card4: {
    y: CARD3_Y_NARROW,
    px: CARD4_STRIP_PX_NARROW,
    r: 1.5,
    hy: CARD3_Y_NARROW + dip(1.5) - dip(0.5),
    hpx: CARD4_STRIP_PX_NARROW,
    hr: 0.5,
  },
} as const satisfies Record<'card2' | 'card3' | 'card4', DeckCard>

/**
 * A deck offset as a CSS length: `28%`, or `calc(45.5% + 40px)` for the one
 * card carrying a fixed strip. Mixing the units is safe here for the same
 * reason a bare percentage is — it still resolves against the containing
 * block's width, and the px term simply doesn't participate.
 */
function deckLength(pct: number, px: number, sign: 1 | -1 = 1): string {
  const p = `${sign * pct}%`
  return px ? `calc(${p} ${sign > 0 ? '+' : '-'} ${px}px)` : p
}

/**
 * The CSS custom properties `.deck-card` (globals.css) reads. `y`/`hy` go on
 * `margin-bottom` negated, which is what pushes a `bottom-0` card down below
 * the sized box behind it; percentage margins resolve against the containing
 * block's WIDTH, which is the whole reason this works out to a
 * resolution-independent deck.
 *
 * Two geometries in, four vars out (§9.1): inline styles beat media
 * queries, so a `@media (max-width: 639px)` block in globals.css setting
 * `--y` directly would do nothing — the inline declaration always wins
 * regardless of the query. Emitting `--y-wide`/`--y-narrow` (and the `hy`
 * pair) under different names lets `.deck-card`'s own media query pick
 * between them instead. Tilts don't differ between the two geometries, so
 * `--r`/`--hr` stay single-valued.
 */
function deckVars(wide: DeckCard, narrow: DeckCard): CSSProperties {
  return {
    '--y-wide': deckLength(wide.y, wide.px, -1),
    '--y-narrow': deckLength(narrow.y, narrow.px, -1),
    '--r': `${wide.r}deg`,
    '--hy-wide': deckLength(wide.hy, wide.hpx, -1),
    '--hy-narrow': deckLength(narrow.hy, narrow.hpx, -1),
    '--hr': `${wide.hr}deg`,
  } as CSSProperties
}

/**
 * The outer container's reserve: the deepest card's offset plus how far its
 * tilt dips its corner below that, for both geometries — read by
 * `.deck-reserve`'s own `sm` media query in globals.css, the same
 * inline-beats-media-query trap `deckVars` works around.
 */
function deckReserveVars(hasMore: boolean): CSSProperties {
  const deepWide = hasMore ? DECK_WIDE.card4 : DECK_WIDE.card3
  const deepNarrow = hasMore ? DECK_NARROW.card4 : DECK_NARROW.card3
  return {
    '--reserve-wide': deckLength(deepWide.y + dip(Math.abs(deepWide.r)), deepWide.px),
    '--reserve-narrow': deckLength(deepNarrow.y + dip(Math.abs(deepNarrow.r)), deepNarrow.px),
  } as CSSProperties
}

const deckCardBase =
  'deck-card absolute inset-x-0 bottom-0 origin-bottom overflow-hidden rounded-xl border shadow-sm group-hover:shadow-lg'

/**
 * A chapbook's version of the stack: same fanned-cards idea, but sized to
 * its own text instead of borrowed from an image's aspect ratio. The cover
 * (card 1) is the only layer left in normal document flow — `position:
 * relative` with no explicit height — so the container's real size comes
 * straight from its own content, the way a plain TextCard's does. The three
 * cards behind it are bottom-anchored and absolutely positioned, so their
 * peek is exactly their target offset regardless of how tall their own text
 * happens to be (see "Collection stack geometry" in docs/ARCHITECTURE.md) — being absolutely positioned
 * also takes them out of the normal painting order, where positioned
 * elements paint above static ones as a group regardless of DOM order, so
 * card 1 needs `relative` (not the default `static`) to count as positioned
 * too and paint on top. Card 4 is deliberately blank, so it has no natural
 * height and needs `h-full` (not `max-h-full`, cards 2/3's clamp) to take
 * the cover's height outright.
 */
function ChapbookStack({
  item,
  className,
  statusFlags,
}: {
  item: WorkCollection
  className?: string
  /** Folded into card 4's `CollectionMark` when it renders — see CollectionMark. */
  statusFlags?: StatusFlag[]
}) {
  const tone = toneFor(item)
  // `stackPieces` (1-3 slugs) hand-picks which pieces front the stack;
  // any slot left unset falls back to the collection's first three pieces.
  const [coverSlug, secondSlug, thirdSlug] = item.stackPieces ?? []
  const findPiece = (slug: string | undefined) => (slug ? item.pieces.find((p) => p.slug === slug) : undefined)
  const cover = findPiece(coverSlug) ?? item.pieces[0]
  const second = findPiece(secondSlug) ?? item.pieces[1]
  const third = findPiece(thirdSlug) ?? item.pieces[2]
  // With exactly (or fewer than) three pieces, cards 1-3 already show
  // everything the collection has — a 4th "and N more" card would be
  // showing nothing more, so it and its count pill drop out entirely, and
  // card 3 becomes the deepest layer, needing less reserved peek room.
  const hasMore = item.pieces.length > 3

  return (
    <div className={cn('relative deck-reserve', className)} style={deckReserveVars(hasMore)}>
      <div className="relative">
        {/* Card 4: permanently blank and neutral — never a real piece, just the
            bed the count sits on. Not aria-hidden like the other backing
            cards, since the count inside it is real information. */}
        {hasMore && (
          <div
            className={cn(deckCardBase, 'h-full')}
            style={{
              background: item.stackAccent ?? 'color-mix(in srgb, var(--foreground) 18%, var(--card))',
              borderColor: item.stackAccent
                ? `color-mix(in srgb, ${item.stackAccent} 60%, var(--foreground))`
                : 'color-mix(in srgb, var(--foreground) 16%, var(--card))',
              ...deckVars(DECK_WIDE.card4, DECK_NARROW.card4),
            }}
          >
            <CollectionMark
              count={item.pieces.length}
              statusFlags={statusFlags}
              tone={tone}
              className="absolute bottom-2 right-2"
            />
          </div>
        )}
        {/* Card 3 — max-h-96 (not max-h-full, which is unbounded here: the
            deck's own height comes from the cover, and `h-auto` doesn't cap
            anything): an un-clamped VerseBlock sizes to its excerpt's full
            text, and at a narrow paired gallery column a real multi-stanza
            poem reflows to many lines — tall enough that this card's own
            rotation (`--r` in deckVars) swings its bounding box wide of the
            column, overflowing the page. Only a thin strip of this card is
            ever visible at rest anyway (the rest sits behind the cards in
            front of it), so capping the box changes nothing on screen. */}
        {third && (
          <TextCardFace
            piece={third}
            className={cn(deckCardBase, 'max-h-96')}
            style={{
              background: `color-mix(in srgb, ${tone} 9%, var(--card))`,
              ...deckVars(DECK_WIDE.card3, DECK_NARROW.card3),
            }}
          />
        )}
        {/* Card 2 — same reasoning as card 3. */}
        {second && (
          <TextCardFace
            piece={second}
            className={cn(deckCardBase, 'max-h-96')}
            style={{
              background: `color-mix(in srgb, ${tone} 11%, var(--card))`,
              ...deckVars(DECK_WIDE.card2, DECK_NARROW.card2),
            }}
          />
        )}
        {/* Card 1: the cover — normal flow, sized to its own text, and
            `relative` (not the flow default `static`) so it paints above the
            absolutely positioned cards behind it. */}
        {cover && (
          <TextCardFace
            piece={cover}
            className="relative h-auto w-full origin-bottom rounded-xl border border-[color-mix(in_srgb,var(--foreground)_14%,var(--card))] shadow-sm transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg"
          />
        )}
      </div>
    </div>
  )
}

/**
 * A collection's placeholder as a tapered stack of cards, full column width
 * like a standalone piece's image. The cover sits flat on top, fully
 * visible; each card behind it peeks out below by a shrinking, bottom-
 * anchored amount (see "Collection stack geometry" in docs/ARCHITECTURE.md), so the peek is exact regardless of the mix of
 * aspect ratios inside the collection. The 4th and lowest card is
 * permanently blank and neutral — never a real piece — and carries the
 * collection's real total on a pill in its own bottom-right corner, so it
 * reads as an honest "and N more" rather than an open-ended tease. Rotation
 * pivots around each card's own bottom-center, so the tilt reads as a lean
 * in place. The two real backing pieces get low-quality thumbnails since
 * only a thin strip of each is ever visible.
 */
export function CollectionStack({
  item,
  className,
  statusFlags,
}: {
  item: WorkCollection
  className?: string
  /** Folded into card 4's `CollectionMark` when it renders — see CollectionMark. */
  statusFlags?: StatusFlag[]
}) {
  const tone = toneFor(item)
  const chapbook = isChapbook(item)

  if (chapbook) return <ChapbookStack item={item} className={className} statusFlags={statusFlags} />

  const aspect = aspectStyleFor(item)
  // `stackPieces` (1-3 slugs) hand-picks which pieces front the stack,
  // overriding that many slots front-to-back; any slot left unset keeps the
  // default (the collection's own cover image for the front card, then the
  // first pieces with a distinct image behind it).
  const [coverSlug, backSlug, midSlug] = item.stackPieces ?? []
  const cover = coverSlug ? item.pieces.find((p) => p.slug === coverSlug) : undefined
  const [defaultBack, defaultMid] = item.pieces.filter((p) => p.image && p.image !== item.image)
  const back = (backSlug ? item.pieces.find((p) => p.slug === backSlug) : undefined) ?? defaultBack
  const mid = (midSlug ? item.pieces.find((p) => p.slug === midSlug) : undefined) ?? defaultMid
  // With exactly (or fewer than) three pieces, cards 1-3 already show
  // everything the collection has — a 4th "and N more" card would be
  // showing nothing more, so it and its count pill drop out entirely, and
  // card 3 becomes the deepest layer the container needs to reserve for.
  const hasMore = item.pieces.length > 3

  return (
    <div className={cn('relative deck-reserve', className)} style={deckReserveVars(hasMore)}>
      <div className="relative">
        {/* Card 4: permanently blank and neutral — never a real piece, just the
            bed the count sits on. Not aria-hidden like the other backing
            cards, since the count inside it is real information. */}
        {hasMore && (
          <div
            className={cn(deckCardBase, 'max-h-full aspect-[5/4]')}
            style={{
              background: item.stackAccent ?? 'color-mix(in srgb, var(--foreground) 18%, var(--card))',
              borderColor: item.stackAccent
                ? `color-mix(in srgb, ${item.stackAccent} 60%, var(--foreground))`
                : 'color-mix(in srgb, var(--foreground) 16%, var(--card))',
              ...aspect,
              ...deckVars(DECK_WIDE.card4, DECK_NARROW.card4),
            }}
          >
            <CollectionMark
              count={item.pieces.length}
              statusFlags={statusFlags}
              tone={tone}
              className="absolute bottom-2 right-2"
            />
          </div>
        )}
        {/* Card 3 */}
        <div
          aria-hidden="true"
          className={cn(
            deckCardBase,
            'max-h-full aspect-[5/4] border-[color-mix(in_srgb,var(--foreground)_10%,var(--card))]',
          )}
          style={{
            background: `color-mix(in srgb, ${tone} 9%, var(--card))`,
            ...aspect,
            ...deckVars(DECK_WIDE.card3, DECK_NARROW.card3),
          }}
        >
          {mid && <WorkPlaceholder item={mid} quality="thumb" />}
        </div>
        {/* Card 2 */}
        <div
          aria-hidden="true"
          className={cn(
            deckCardBase,
            'max-h-full aspect-[5/4] border-[color-mix(in_srgb,var(--foreground)_10%,var(--card))]',
          )}
          style={{
            background: `color-mix(in srgb, ${tone} 11%, var(--card))`,
            ...aspect,
            ...deckVars(DECK_WIDE.card2, DECK_NARROW.card2),
          }}
        >
          {back && <WorkPlaceholder item={back} quality="thumb" />}
        </div>
        {/* Card 1: the cover — flat, 100% visible, in normal flow (so it
            sizes the container), on top. On hover it takes the same 2px lift
            a plain gallery card gets (hover:-translate-y-0.5 there), so a
            collection answers the cursor exactly like its neighbours do. */}
        <div
          className="relative aspect-[5/4] overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--foreground)_14%,var(--card))] shadow-sm transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg"
          style={aspect}
        >
          <WorkPlaceholder item={cover ?? item} />
        </div>
      </div>
    </div>
  )
}

/**
 * Tag row for detail pages. Each chip links back into the gallery pre-filtered
 * on that tag, so a page is a way back into the collection, not a dead end.
 */
export function TagLinks({ tags, className }: { tags: string[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag) => {
        const tone = tagTone(tag)
        return (
          <li key={tag}>
            <Link
              href={`/work?tags=${encodeURIComponent(tag)}`}
              className="font-brand inline-block rounded-full border px-2.5 py-0.5 text-xs lowercase transition-colors hover:text-foreground"
              style={
                tone
                  ? { color: tone, borderColor: `color-mix(in srgb, ${tone} 45%, transparent)` }
                  : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
              }
            >
              {tag}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Renders a write-up's paragraphs with comfortable measure. */
export function Prose({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('max-w-2xl space-y-4 text-pretty leading-relaxed text-foreground/85', className)}>
      {text.split('\n\n').map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  )
}

/** Ephemeral WorkPiece stand-in for a still, for ImageLightbox/WorkPlaceholder. Never added to WORK, never routed to. keyPrefix keeps process/scenes lightbox identities distinct if a piece ever carries both. */
function stillLightboxItem(piece: WorkPiece, still: ProcessStill, index: number, keyPrefix: string): WorkPiece {
  return {
    slug: `${piece.slug}-${keyPrefix}-${index}`,
    title: still.alt ?? piece.title,
    year: piece.year,
    tags: piece.tags,
    image: still.src,
  }
}

/** Shared rendering for `process` and `scenes` — a heading, then each still as its own captioned figure opening in the ordinary lightbox. Not exported; ProcessSection and SceneSection are the public entry points. */
function StillsSection({
  piece,
  stills,
  heading,
  keyPrefix,
}: {
  piece: WorkPiece
  stills: ProcessStill[] | undefined
  heading: string
  keyPrefix: string
}) {
  if (!stills || stills.length === 0) return null
  const items = stills.map((still, i) => stillLightboxItem(piece, still, i, keyPrefix))
  return (
    <section className="mt-10 max-w-2xl">
      <h2 className={headingStyles.eyebrow}>{heading}</h2>
      <div className="mt-4 space-y-8">
        {stills.map((still, i) => (
          <figure key={still.src}>
            <ImageLightbox items={items} initialIndex={i} className="rounded-xl">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <WorkPlaceholder item={items[i]} />
              </div>
            </ImageLightbox>
            {still.caption && (
              <figcaption className="mt-3 space-y-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                {still.caption.split('\n\n').map((para, p) => (
                  <p key={p}>{para}</p>
                ))}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  )
}

/**
 * A piece's "how this got made" section — WIP screenshots, each its own
 * `<figure>` with the image opening in the ordinary lightbox and an authored
 * caption underneath (see `WorkPiece.process`). Placed below the writeup,
 * under its own heading, deliberately not inside `PieceMedia`: a WIP
 * screenshot is a different register from the finished-image media there,
 * and sitting directly under the finished image would invite reading it as
 * another artwork rather than "here's how this got made."
 */
export function ProcessSection({ piece }: { piece: WorkPiece }) {
  return <StillsSection piece={piece} stills={piece.process} heading="process" keyPrefix="process" />
}

/** A piece's finished-scene stills — see WorkPiece.scenes. Same rendering as ProcessSection, its own heading and field. */
export function SceneSection({ piece }: { piece: WorkPiece }) {
  return <StillsSection piece={piece} stills={piece.scenes} heading="scenes" keyPrefix="scene" />
}

/**
 * A chapbook's table of contents: each poem/essay as a numbered row, the way
 * a printed book's contents page works — titles only, no first lines, no
 * glosses (the taste of the writing is carried by the epigraph and the two
 * entry points below it). Two columns, read down the first then down the
 * second, the way a real contents page reads; a book's real page numbers
 * live on the reading page itself (see BookFolio), so a second number here
 * would just be noise.
 */
export function ChapbookContents({ collection }: { collection: WorkCollection }) {
  const tone = toneFor(collection)
  return (
    <ol className="mt-8 columns-1 gap-x-10 sm:columns-2">
      {collection.pieces.map((piece, i) => (
        <li key={piece.slug} className="break-inside-avoid border-b border-border/70 last:border-b-0">
          <Link href={piecePath(collection, piece)} className="group flex items-baseline gap-3 py-3">
            <span
              className="font-brand shrink-0 text-xs tabular-nums text-muted-foreground transition-colors group-hover:text-foreground"
              style={{ color: `color-mix(in srgb, ${tone} 55%, var(--muted-foreground))` }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="font-brand truncate text-base font-bold lowercase text-foreground text-balance transition-colors group-hover:text-foreground">
              {piece.title}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/**
 * The page-number footer under a chapbook's reading page — a folio, in
 * printer's terms. Small and centered, like the bottom of a real book page.
 */
export function BookFolio({ index, total }: { index: number; total: number }) {
  return (
    <p className="font-brand mt-8 text-center text-xs tabular-nums text-muted-foreground">
      {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </p>
  )
}

/**
 * A text-forward piece's tile inside a gallery-layout collection grid — the
 * same quote-card idiom as a standalone TextCard, sized for a grid cell.
 * WriteupMark sits at `right-3` here (not `left-3`, ImageTile's spot) so it
 * doesn't collide with the Quote glyph.
 */
function TextTile({ collection, piece }: { collection: WorkCollection; piece: WorkPiece }) {
  const tone = toneFor(piece)
  const excerpt = piece.preview ?? piece.text ?? piece.description ?? ''
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border transition-transform hover:-translate-y-1">
      <Link
        href={piecePath(collection, piece)}
        className={cn(
          'block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isGuessable(piece) ? 'px-4 pt-4' : 'p-4',
        )}
      >
        <Quote
          className="h-6 w-6 shrink-0 -scale-x-100"
          style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <VerseBlock text={excerpt} context="card" className="mt-3 text-base text-foreground" />
        <p className="mt-3 font-brand text-sm lowercase tracking-wide text-muted-foreground">{piece.title}</p>
      </Link>
      {isGuessable(piece) && (
        <GuessTileForm
          piece={piece}
          collectionSlug={collection.slug}
          tone={toneFor(collection)}
          pieceHref={piecePath(collection, piece)}
        />
      )}
      {hasWriteup(piece) && (
        <div className="absolute right-3 top-3">
          <WriteupMark />
        </div>
      )}
      {isGuessable(piece) && (
        <div className="absolute left-3 top-3">
          <GuessTileMark piece={piece} collectionSlug={collection.slug} tone={toneFor(collection)} />
        </div>
      )}
    </div>
  )
}

/**
 * A plain image piece's tile inside a gallery-layout collection grid.
 * Lightbox paging is scoped to pieces that actually carry an image — a
 * mixed collection otherwise pages through text-only pieces onto tinted
 * placeholders.
 */
function ImageTile({ collection, piece }: { collection: WorkCollection; piece: WorkPiece }) {
  const { items: withImage, index: lightboxIndex } = imageLightboxSlice(collection, piece)
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border transition-transform hover:-translate-y-1">
      <ImageLightbox items={withImage} initialIndex={lightboxIndex} className="rounded-none border-none">
        <div className={aspectFor(piece.slug)} style={aspectStyleFor(piece)}>
          <WorkPlaceholder item={piece} />
        </div>
        <MediaBadges item={piece} />
      </ImageLightbox>
      <Link
        href={piecePath(collection, piece)}
        className={cn(
          'block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isGuessable(piece) ? 'px-4 pt-4' : 'p-4',
        )}
      >
        <p className="font-brand text-sm font-bold lowercase leading-tight text-foreground/80 text-balance">
          {piece.title}
        </p>
        {piece.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{piece.description}</p>
        )}
      </Link>
      {isGuessable(piece) && (
        <GuessTileForm
          piece={piece}
          collectionSlug={collection.slug}
          tone={toneFor(collection)}
          pieceHref={piecePath(collection, piece)}
        />
      )}
      {hasWriteup(piece) && (
        <div className="absolute left-3 top-3">
          <WriteupMark />
        </div>
      )}
      {isGuessable(piece) && (
        <div className="absolute right-3 top-3">
          <GuessTileMark piece={piece} collectionSlug={collection.slug} tone={toneFor(collection)} />
        </div>
      )}
    </div>
  )
}

/**
 * A hybrid piece's cell: image and words as one unit, neither a caption for
 * the other — the `illustrated` collection layout's tile, and the same card
 * landing inside an otherwise-`gallery` collection that happens to hold one
 * hybrid piece (see the collection-layouts table in docs/ARCHITECTURE.md).
 * Folio number is the piece's position in the collection, not parsed from
 * its slug.
 */
export function IllustratedTile({
  collection,
  piece,
  index,
}: {
  collection: WorkCollection
  piece: WorkPiece
  index: number
}) {
  const tone = toneFor(piece)
  const { items: withImage, index: lightboxIndex } = imageLightboxSlice(collection, piece)
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border transition-transform hover:-translate-y-1">
      <ImageLightbox items={withImage} initialIndex={lightboxIndex} className="rounded-none border-none">
        <div className={aspectFor(piece.slug)} style={aspectStyleFor(piece)}>
          <WorkPlaceholder item={piece} />
        </div>
        <MediaBadges item={piece} />
      </ImageLightbox>
      <Link
        href={piecePath(collection, piece)}
        className={cn(
          'block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isGuessable(piece) ? 'px-4 pt-4' : 'p-4',
        )}
        style={{ background: `color-mix(in srgb, ${tone} 8%, var(--card))` }}
      >
        <p className="font-brand text-sm font-bold lowercase leading-tight text-foreground/80 text-balance">
          {String(index + 1).padStart(2, '0')} · {piece.title}
        </p>
        <VerseBlock text={piece.text ?? ''} context="card" className="mt-2 text-sm text-foreground" />
        <ArrowRight className="ml-auto mt-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </Link>
      {isGuessable(piece) && (
        <GuessTileForm
          piece={piece}
          collectionSlug={collection.slug}
          tone={toneFor(collection)}
          pieceHref={piecePath(collection, piece)}
        />
      )}
      {hasWriteup(piece) && (
        <div className="absolute left-3 top-3">
          <WriteupMark />
        </div>
      )}
      {isGuessable(piece) && (
        <div className="absolute right-3 top-3">
          <GuessTileMark piece={piece} collectionSlug={collection.slug} tone={toneFor(collection)} />
        </div>
      )}
    </div>
  )
}

/**
 * A collection-page tile, dispatching per piece the same way `WorkCard`
 * dispatches for the top-level gallery — a `gallery` collection holding one
 * hybrid piece gets that piece rendered as a hybrid, without the collection
 * itself changing layout.
 */
export function PieceTile({
  collection,
  piece,
  index,
}: {
  collection: WorkCollection
  piece: WorkPiece
  index: number
}) {
  if (isHybrid(piece)) return <IllustratedTile collection={collection} piece={piece} index={index} />
  if (isTextForward(piece)) return <TextTile collection={collection} piece={piece} />
  return <ImageTile collection={collection} piece={piece} />
}

/** Convenience guard re-export so pages don't import from two places. */
export { isCollection }
