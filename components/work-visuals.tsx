import type { CSSProperties } from 'react'
import Link from 'next/link'
import { FileText, ImageOff, Layers } from 'lucide-react'
import {
  DISCIPLINE_FACETS,
  DISCIPLINES,
  isCollection,
  primaryDiscipline,
  tagTone,
  toneFor,
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
 * A tinted placeholder standing in for real artwork — no fabricated images,
 * just the item's category as a watermark over its discipline tone.
 */
export function WorkPlaceholder({
  item,
  className,
  showYear = true,
}: {
  item: WorkItem
  className?: string
  showYear?: boolean
}) {
  const tone = toneFor(item)
  return (
    <div
      className={cn('relative flex h-full w-full flex-col justify-end overflow-hidden p-4', className)}
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
      {showYear && (
        <span className="font-brand absolute right-3 top-3 rounded-full bg-background/70 px-2 py-0.5 text-xs text-foreground backdrop-blur-sm">
          {item.year}
        </span>
      )}
    </div>
  )
}

/**
 * A collection's placeholder as a fanned hand of three cards, pivoting from
 * a shared point at the bottom-left corner — the way you'd actually hold and
 * fan a hand of cards pinched at one edge. The front card leans a few
 * degrees left of that pivot, and the back card mirrors it a few degrees
 * right, so the whole fan reads as one consistent, centered sweep. On hover
 * the fan opens further, tilting front and back a couple more degrees apart
 * in each direction, like the hand is being spread. The middle and back
 * cards sit a touch lower than the front one — a slight downward cascade so
 * the three don't all appear to hinge from the exact same point — and the
 * whole group sits behind this card's title/description text, which uses
 * an explicit z-index so it stays legible over any card that swings low
 * enough (from the pivot rotation) to reach the text underneath.
 */
export function CollectionStack({ item, className }: { item: WorkItem; className?: string }) {
  const tone = toneFor(item)
  return (
    <div className={cn('relative -translate-x-1.5 px-4 pt-3', className)}>
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-0 aspect-[5/4] origin-bottom-left translate-x-6 translate-y-3 rotate-[5deg] rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,var(--card))] shadow-sm transition-transform duration-300 ease-out group-hover:rotate-[7deg]"
        style={{ background: `color-mix(in srgb, ${tone} 9%, var(--card))` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-0 aspect-[5/4] origin-bottom-left translate-x-4 translate-y-3 rotate-[2deg] rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,var(--card))] shadow-sm"
        style={{ background: `color-mix(in srgb, ${tone} 11%, var(--card))` }}
      />
      <div className="relative aspect-[5/4] origin-bottom-left -rotate-3 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--foreground)_14%,var(--card))] shadow-sm transition-transform duration-300 ease-out group-hover:-rotate-[5deg]">
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
