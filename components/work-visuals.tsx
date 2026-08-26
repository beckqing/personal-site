import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, ImageOff, Layers, Quote } from 'lucide-react'
import {
  DISCIPLINE_FACETS,
  DISCIPLINES,
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
      {count} pieces
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
 * A collection's placeholder as a tapered stack of cards, full column width
 * like a standalone piece's image (no shrinking to fit diagonal spill — the
 * cards only spread downward, not sideways, so they never bleed into the
 * next column). The cover sits flat on top, fully visible; each card behind
 * it peeks out from lower down by a shrinking amount. The 4th and lowest
 * card is permanently blank and neutral — never a real piece, since with
 * only two real backing pieces there's nothing else to show there — and
 * carries a small pill at its own bottom-right corner with the collection's
 * real total, so it reads as an honest "and N more" rather than an
 * open-ended tease. At rest the stack tapers inward (each card's peek and
 * tilt smaller than the one in front) so it reads as a slightly squeezed
 * pile; on hover every card eases toward flatter rotation and a touch more
 * peek — a gentle un-tapering, not a full fan-open. Rotation pivots around
 * each card's own bottom-CENTER rather than a corner, so the tilt reads as
 * a lean in place instead of dragging the card visibly left/right
 * off-center. The two real pieces get low-quality thumbnails since only a
 * thin strip of each is ever visible.
 *
 * The container reserves its true height via an explicit aspect-ratio
 * computed from the cover's own aspect — the back cards are all
 * `position: absolute` and so contribute nothing to normal document flow
 * on their own, and this grid is CSS columns, which needs a real (not
 * faked-with-margin) height to lay out the next item.
 */
export function CollectionStack({ item, className }: { item: WorkCollection; className?: string }) {
  const tone = toneFor(item)
  const aspect = aspectStyleFor(item)
  const [back, mid] = item.pieces.filter((p) => p.image && p.image !== item.image)

  // How far down the lowest card (card 4) sits at its deepest, plus a
  // little extra for its own rotation: rotating around a fixed pivot makes
  // one bottom corner dip below the un-rotated edge, by more at rest (3deg)
  // than on hover (1deg) — so without this, rest would eat further into
  // the gap below the stack than hover does, making the two look
  // inconsistent even though translateY itself doesn't change on hover.
  const maxPeek = 0.75
  const [wRatio, hRatio] = (item.imageAspect ?? '5/4').split('/').map(Number)
  const containerAspect = `${wRatio} / ${hRatio * (1 + maxPeek)}`

  const cardBase =
    'absolute inset-x-0 top-0 aspect-[5/4] origin-bottom overflow-hidden rounded-xl border shadow-sm transition-transform duration-300 ease-out'

  return (
    <div className={cn('relative', className)} style={{ aspectRatio: containerAspect }}>
      {/* Card 4: permanently blank and neutral — never a real piece. Not
          aria-hidden (unlike the others) since the count pill living inside
          it carries real information; not clipped either
          (overflow-visible), so the pill can poke past its corner instead
          of being cut off by it. */}
      <div
        className={cn(
          cardBase,
          // Already flush with the container's bottom edge at rest (see
          // maxPeek above), so it doesn't move any further on hover — only
          // its rotation still eases flatter.
          'overflow-visible translate-y-[71%] rotate-[3deg]',
          'group-hover:rotate-[1deg]',
        )}
        style={{
          background: item.stackAccent ?? 'color-mix(in srgb, var(--foreground) 18%, var(--card))',
          borderColor: item.stackAccent
            ? `color-mix(in srgb, ${item.stackAccent} 60%, var(--foreground))`
            : 'color-mix(in srgb, var(--foreground) 16%, var(--card))',
          ...aspect,
        }}
      >
        <CollectionMark count={item.pieces.length} className="absolute -bottom-2 -right-2 z-10" />
      </div>
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
      {/* Card 1: the cover — flat, 100% visible, on top. Sits nudged down
          at rest (matching the rest of the stack shifting down to close the
          gap at the bottom of the reserved space) and rises back to the
          very top on hover — so the "opening up" reads as the whole stack
          loosening symmetrically, not just the back cards sinking further
          while the top stays put. */}
      <div
        className="absolute inset-x-0 top-0 aspect-[5/4] origin-bottom translate-y-[6%] overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--foreground)_14%,var(--card))] shadow-sm transition-transform duration-300 ease-out group-hover:translate-y-0"
        style={aspect}
      >
        <WorkPlaceholder item={item} />
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
