import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, ImageOff, Layers } from 'lucide-react'
import {
  DISCIPLINE_FACETS,
  DISCIPLINES,
  isCollection,
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
      <ImageOff
        className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 opacity-25"
        style={{ color: tone }}
        strokeWidth={1.5}
        aria-hidden="true"
      />
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
 * A collection's placeholder as a fanned hand of three cards, pivoting from
 * a shared point at the bottom-left corner — the way you'd actually hold and
 * fan a hand of cards pinched at one edge. Every card in the fan is the same
 * size as a standalone piece's image (no card chrome wrapping the group —
 * it sits directly on the page background), so the stack reads as loose
 * photos rather than a bordered tile. The tilt and offsets are kept very
 * small on purpose — full-size cards fan out fast, and each degree of
 * rotation swings the back cards' lower corner further down as well as
 * right, so a wide fan would spill into both the column gutter and the
 * card sitting below it in the same masonry column. The front card leans
 * At rest the three sit unrotated, offset only down and to the right, like
 * a squared-off stack of photos. On hover they fan open from that shared
 * pivot — the front card leans slightly left, the back card mirrors it
 * slightly right, the middle stays put — like the hand is being spread.
 * The middle and back cards sit a touch lower and further right than the
 * front one even at rest, so all three edges stay visible instead of
 * hinging from the exact same point.
 */
export function CollectionStack({ item, className }: { item: WorkCollection; className?: string }) {
  const tone = toneFor(item)
  const aspect = aspectStyleFor(item)
  // Two other real pieces to peek out from behind the cover, at low quality
  // since only a sliver of each is ever visible.
  const [back, mid] = item.pieces.filter((p) => p.image && p.image !== item.image)

  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 aspect-[5/4] origin-bottom-left translate-x-3 translate-y-3 overflow-hidden rotate-0 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,var(--card))] shadow-sm transition-transform duration-300 ease-out group-hover:rotate-[1.5deg]"
        style={{ background: `color-mix(in srgb, ${tone} 9%, var(--card))`, ...aspect }}
      >
        {back && <WorkPlaceholder item={back} quality="thumb" />}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 aspect-[5/4] origin-bottom-left translate-x-1.5 translate-y-1.5 overflow-hidden rotate-0 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,var(--card))] shadow-sm"
        style={{ background: `color-mix(in srgb, ${tone} 11%, var(--card))`, ...aspect }}
      >
        {mid && <WorkPlaceholder item={mid} quality="thumb" />}
      </div>
      <div
        className="relative aspect-[5/4] origin-bottom-left rotate-0 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--foreground)_14%,var(--card))] shadow-sm transition-transform duration-300 ease-out group-hover:-rotate-[1.5deg]"
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

/** Convenience guard re-export so pages don't import from two places. */
export { isCollection }
