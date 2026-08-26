import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, FileText, ImageOff, Layers, Quote } from 'lucide-react'
import {
  DISCIPLINE_FACETS,
  DISCIPLINES,
  isChapbook,
  isCollection,
  isTextOnly,
  piecePath,
  primaryDiscipline,
  tagTone,
  toneFor,
  type WorkCollection,
  type WorkItem,
  type WorkPiece,
} from '@/lib/work'
import { cn } from '@/lib/utils'

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
 * A real image's own aspect ratio, as an inline style — takes priority over
 * a card's default/hashed aspect class so real artwork renders uncropped
 * instead of forced into a shape it wasn't made for. Undefined when the
 * piece has no real image or no known aspect, leaving the caller's class
 * in charge.
 */
export function aspectStyleFor(item: WorkItem): CSSProperties | undefined {
  return item.imageAspect ? { aspectRatio: item.imageAspect } : undefined
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

/** Badge showing how many pieces a collection holds. */
export function CollectionMark({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        'font-brand inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs lowercase text-foreground backdrop-blur-sm',
        className,
      )}
    >
      <Layers className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      <span className="text-muted-foreground">{count} pieces</span>
    </span>
  )
}

/**
 * The real image for a piece when it has one; otherwise a tinted placeholder
 * standing in for it — no fabricated images, just the item's category as a
 * watermark over its discipline tone.
 */
export function WorkPlaceholder({
  item,
  className,
  quality = 'full',
  fit = 'cover',
}: {
  item: WorkItem
  className?: string
  /** 'thumb' prefers the heavily compressed stand-in (see WorkPiece.thumb) — for spots where the image is barely visible, like a collection stack's back cards. Falls back to the full image when there's no thumb. */
  quality?: 'full' | 'thumb'
  /** 'contain' shows the whole image uncropped (letterboxing if the box doesn't match its ratio) — for a lightbox/detail view where seeing the full piece matters more than filling the box. Grid tiles want the 'cover' default. */
  fit?: 'cover' | 'contain'
}) {
  const tone = toneFor(item)
  const src = quality === 'thumb' ? (item.thumb ?? item.image) : item.image

  if (src && fit === 'contain') {
    // A plain (non-`fill`) image is a real replaced element with intrinsic
    // size, so height:auto + max-height/max-width scale it down without
    // cropping — and any border/shadow in `className` lands on the actual
    // rendered picture instead of a differently-shaped bounding box.
    const [wRatio, hRatio] = (item.imageAspect ?? '16/10').split('/').map(Number)
    const width = 1600
    const height = Math.round(width * (hRatio / wRatio))
    return (
      <Image
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
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
        className="font-brand pointer-events-none absolute bottom-2 right-3 max-w-[calc(100%-1.5rem)] truncate text-right text-3xl font-bold lowercase leading-none tracking-tight sm:text-4xl"
        style={{ color: tone, opacity: 0.26 }}
      >
        {categoryLabel(item)}
      </span>
    </div>
  )
}

/**
 * A stacked card's face for a chapbook — the exact same quote-icon,
 * excerpt, and title-plus-arrow treatment as a standalone TextCard (same
 * type sizes too), so a chapbook's stack reads as the same kind of card as
 * the writing pieces beside it. Each of the three visible layers gets its
 * own piece from the chapbook (its first three), rather than all three
 * repeating the collection's own blurb, so the stack itself hints at the
 * range of what's inside. Leads with `preview` rather than the full
 * `excerpt` — a hand-set, short pull-quote meant for exactly this kind of
 * compact spot, so nothing needs clipping to fit. Used in place of
 * WorkPlaceholder for chapbook stacks, which have no images to show.
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
  const isPoem = piece.tags.includes('poem')
  const excerpt = piece.preview ?? piece.excerpt ?? piece.description
  return (
    <div
      className={cn('flex h-full w-full flex-col p-6', className)}
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
          {isPoem ? 'poem' : 'essay'}
        </span>
      </div>

      <p
        className={cn(
          'font-brand-italic mt-3 text-pretty text-lg leading-relaxed text-foreground',
          isPoem && 'whitespace-pre-line',
        )}
      >
        {excerpt}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-brand truncate text-sm lowercase tracking-wide text-muted-foreground">
          {piece.title}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
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
 * The container reserves its true height via an explicit aspect-ratio
 * computed from the cover's own aspect — the back cards are all
 * `position: absolute` and so contribute nothing to normal document flow
 * on their own, and this grid is CSS columns, which needs a real (not
 * faked-with-margin) height to lay out the next item. That height is sized
 * to the hovered stack, the taller of the two states; see maxPeek below.
 */
/**
 * Card 4's hovered peek and tilt, mirrored from its `group-hover:` classes
 * below so the container can reserve the right height. Tailwind only picks up
 * arbitrary values written out as literal class strings, so these can't drive
 * the classes directly — keep the two in sync by hand.
 */
const CARD4_HOVER_PEEK = 0.83
const CARD4_HOVER_TILT = 1
/** Same idea for card 3, used instead when there's no card 4 to reserve for. */
const CARD3_HOVER_PEEK = 0.68
const CARD3_HOVER_TILT = -1

/**
 * A chapbook's version of the stack: same fanned-cards idea, but sized to
 * its own text instead of borrowed from an image's aspect ratio. The cover
 * (card 1) is the only layer left in normal document flow — `position:
 * relative` with no explicit height — so the container's real size comes
 * straight from its own content, the way a plain TextCard's does. The
 * three cards behind it are `position: absolute; inset: 0`, which stretches
 * each to match that same resolved box without pulling their own (possibly
 * longer) text into the sizing calculation the way a CSS-grid stack would —
 * a grid's auto-sized track still asks every same-cell item for its natural
 * content height even when that item is stretched to 100%, so the tallest
 * excerpt among the four would end up setting the height instead of the
 * cover. Each layer's `translate-y-[N%]` resolves against its OWN box,
 * which is why this still peeks correctly at any cover height. Being
 * absolutely positioned also takes cards 2-4 out of the normal painting
 * order, where positioned elements paint above static ones as a group
 * regardless of DOM order — card 1 needs `relative` (not the default
 * `static`) so it counts as positioned too and its later DOM position wins,
 * putting it on top where it belongs. The fixed `mb-10` reserves room in
 * the masonry column for the peek riding below the cover's own bottom edge,
 * which the absolute cards' transforms don't otherwise account for.
 */
function ChapbookStack({ item, className }: { item: WorkCollection; className?: string }) {
  const tone = toneFor(item)
  // `stackPieces` (1-3 slugs) hand-picks which pieces front the stack;
  // any slot left unset falls back to the collection's first three pieces.
  const [coverSlug, secondSlug, thirdSlug] = item.stackPieces ?? []
  const findPiece = (slug: string | undefined) => (slug ? item.pieces.find((p) => p.slug === slug) : undefined)
  const cover = findPiece(coverSlug) ?? item.pieces[0]
  const second = findPiece(secondSlug) ?? item.pieces[1]
  const third = findPiece(thirdSlug) ?? item.pieces[2]
  const peekBase =
    'absolute inset-0 origin-bottom overflow-hidden rounded-xl border shadow-sm transition-[transform,box-shadow] duration-300 ease-out group-hover:shadow-lg'
  // With exactly (or fewer than) three pieces, cards 1-3 already show
  // everything the collection has — a 4th "and N more" card would be
  // showing nothing more, so it and its count pill drop out entirely, and
  // card 3 becomes the deepest layer, needing less reserved peek room.
  const hasMore = item.pieces.length > 3

  return (
    <div className={cn('relative', hasMore ? 'mb-16' : 'mb-10', className)}>
      {/* Card 4: permanently blank and neutral — never a real piece, just the
          bed the count sits on. Text boxes run much taller than the old
          fixed-aspect image boxes, so reaching the same size peek needs a
          bigger percentage here than the image stack used. */}
      {hasMore && (
        <div
          aria-hidden="true"
          className={cn(peekBase, 'translate-y-[26%] rotate-[2deg] group-hover:translate-y-[32%] group-hover:rotate-[1deg]')}
          style={{
            background: item.stackAccent ?? 'color-mix(in srgb, var(--foreground) 18%, var(--card))',
            borderColor: item.stackAccent
              ? `color-mix(in srgb, ${item.stackAccent} 60%, var(--foreground))`
              : 'color-mix(in srgb, var(--foreground) 16%, var(--card))',
          }}
        >
          <CollectionMark count={item.pieces.length} className="absolute bottom-2 right-2" />
        </div>
      )}
      {/* Card 3 */}
      {third && (
        <TextCardFace
          piece={third}
          className={cn(
            peekBase,
            'translate-y-[16%] rotate-[-2deg] group-hover:translate-y-[20%] group-hover:rotate-[-1deg]',
          )}
          style={{ background: `color-mix(in srgb, ${tone} 9%, var(--card))` }}
        />
      )}
      {/* Card 2 */}
      {second && (
        <TextCardFace
          piece={second}
          className={cn(
            peekBase,
            'translate-y-[8%] rotate-[1.5deg] group-hover:translate-y-[10%] group-hover:rotate-[1deg]',
          )}
          style={{ background: `color-mix(in srgb, ${tone} 11%, var(--card))` }}
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
  )
}

export function CollectionStack({ item, className }: { item: WorkCollection; className?: string }) {
  const tone = toneFor(item)
  const chapbook = isChapbook(item)

  if (chapbook) return <ChapbookStack item={item} className={className} />

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

  // The reserved height is sized to the HOVER state, which is the stack at
  // its tallest — so a hovered stack's bottom edge lands exactly one gallery
  // gutter above the next card, same as every other tile. At rest the stack
  // tucks up and leaves a little slack below; that's the correct trade, since
  // rest is the state that sits next to un-hovered neighbours and hover is
  // the one that would otherwise collide with them.
  //
  // The lowest point isn't the deepest card's bottom edge but its lowest
  // corner, which its own tilt swings below that edge: rotating about the
  // bottom centre moves a corner (width/2)·sin(theta) down, which as a
  // fraction of the card's own height is (w/h)·0.5·sin(theta). Card 3
  // rotates the opposite direction from card 4 (negative vs. positive), but
  // that only swaps which corner dips — the magnitude only depends on the
  // angle, so passing its absolute value still gives the right reserve.
  const [wRatio, hRatio] = (item.imageAspect ?? '5/4').split('/').map(Number)
  const cornerDip = (deg: number) => (0.5 * Math.sin((deg * Math.PI) / 180) * wRatio) / hRatio
  const maxPeek = hasMore
    ? CARD4_HOVER_PEEK + cornerDip(CARD4_HOVER_TILT)
    : CARD3_HOVER_PEEK + cornerDip(Math.abs(CARD3_HOVER_TILT))
  const containerAspect = `${wRatio} / ${hRatio * (1 + maxPeek)}`

  // Every card deepens its shadow together on hover, the way a plain gallery
  // card does (hover:shadow-lg there) — because the cards overlap, each one's
  // shadow only really shows in the sliver of the card below it, so deepening
  // them all reads as the layers separating rather than as four stacked
  // drop-shadows.
  const cardBase =
    'absolute inset-x-0 top-0 aspect-[5/4] origin-bottom overflow-hidden rounded-xl border shadow-sm transition-[translate,rotate,box-shadow] duration-300 ease-out group-hover:shadow-lg'

  return (
    <div className={cn('relative', className)} style={{ aspectRatio: containerAspect }}>
      {/* Card 4: permanently blank and neutral — never a real piece, just the
          bed the count sits on. It travels further on hover than card 3 does
          (+9% against card 3's +7%) rather than holding still: card 3 easing
          down toward it would otherwise close over the strip of it that's
          visible, taking the pill under card 3's edge with it. Overshooting
          keeps that strip about the same depth in both states. Not
          aria-hidden like the other backing cards, since the count inside it
          is real information. Skipped entirely once there's nothing left for
          it to represent (see hasMore above). */}
      {hasMore && (
        <div
          className={cn(
            cardBase,
            'translate-y-[74%] rotate-[3deg]',
            'group-hover:translate-y-[83%] group-hover:rotate-[1deg]',
          )}
          style={{
            background: item.stackAccent ?? 'color-mix(in srgb, var(--foreground) 18%, var(--card))',
            borderColor: item.stackAccent
              ? `color-mix(in srgb, ${item.stackAccent} 60%, var(--foreground))`
              : 'color-mix(in srgb, var(--foreground) 16%, var(--card))',
            ...aspect,
          }}
        >
          {/* Inside card 4 so it inherits the card's tilt and rides its corner,
              with matching bottom/right insets so it reads as seated in that
              corner rather than floating near it. */}
          <CollectionMark count={item.pieces.length} className="absolute bottom-2 right-2" />
        </div>
      )}
      {/* Card 3 */}
      <div
        aria-hidden="true"
        className={cn(
          cardBase,
          'translate-y-[61%] rotate-[-4.5deg] border-[color-mix(in_srgb,var(--foreground)_10%,var(--card))]',
          'group-hover:translate-y-[68%] group-hover:rotate-[-1deg]',
        )}
        style={{ background: `color-mix(in srgb, ${tone} 9%, var(--card))`, ...aspect }}
      >
        {mid && <WorkPlaceholder item={mid} quality="thumb" />}
      </div>
      {/* Card 2 */}
      <div
        aria-hidden="true"
        className={cn(
          cardBase,
          'translate-y-[46%] rotate-[4deg] border-[color-mix(in_srgb,var(--foreground)_10%,var(--card))]',
          'group-hover:translate-y-[52%] group-hover:rotate-[1deg]',
        )}
        style={{ background: `color-mix(in srgb, ${tone} 11%, var(--card))`, ...aspect }}
      >
        {back && <WorkPlaceholder item={back} quality="thumb" />}
      </div>
      {/* Card 1: the cover — flat, 100% visible, on top, and sitting at the
          container's top edge at rest. On hover it takes the same 2px lift a
          plain gallery card gets (hover:-translate-y-0.5 there), so a
          collection answers the cursor exactly like its neighbours do; the
          rest of the stack fanning out underneath is the extra on top of
          that, not a substitute for it. Deliberately a fixed 2px rather than
          a percentage — matching the neighbours matters more here than
          scaling with the card. */}
      <div
        className="absolute inset-x-0 top-0 aspect-[5/4] origin-bottom overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--foreground)_14%,var(--card))] shadow-sm transition-[translate,rotate,box-shadow] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg"
        style={aspect}
      >
        <WorkPlaceholder item={cover ?? item} />
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

/** The pull-quote block for text-forward pieces, shared by cards and pages. */
export function ExcerptBlock({ item, className }: { item: WorkPiece; className?: string }) {
  const tone = toneFor(item)
  const isPoem = item.tags.includes('poem')
  return (
    <p
      className={cn(
        'font-brand-italic text-pretty text-xl leading-relaxed text-foreground',
        isPoem && 'whitespace-pre-line',
        className,
      )}
      style={{ borderColor: `color-mix(in srgb, ${tone} 45%, transparent)` }}
    >
      {item.excerpt ?? item.description}
    </p>
  )
}

/**
 * A chapbook's table of contents: each poem/essay as a numbered row, the
 * way a printed book's contents page works. Kept narrow rather than
 * stretched across the page — it's a list of titles, not a grid — and
 * folio numbers only run down the left; a book's real page numbers live on
 * the reading page itself (see BookFolio), so a second number here would
 * just be noise. Replaces the usual image-grid treatment, since a chapbook
 * has no images to show.
 */
export function ChapbookContents({ collection }: { collection: WorkCollection }) {
  const tone = toneFor(collection)
  return (
    <ol className="mt-6 max-w-md divide-y divide-border rounded-2xl border border-border bg-card">
      {collection.pieces.map((piece, i) => (
        <li key={piece.slug}>
          <Link
            href={piecePath(collection, piece)}
            className="group flex items-baseline gap-3 px-5 py-3"
          >
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

/** Convenience guard re-export so pages don't import from two places. */
export { isCollection }
