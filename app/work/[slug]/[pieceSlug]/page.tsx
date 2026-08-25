import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import {
  getCollectionPiece,
  isCollection,
  isTextForward,
  piecePath,
  primaryDiscipline,
  toneFor,
  WORK,
} from '@/lib/work'
import {
  categoryLabel,
  ExcerptBlock,
  Prose,
  TagLinks,
  WorkPlaceholder,
} from '@/components/work-visuals'
import { ImageLightbox } from '@/components/image-lightbox'
import { cn } from '@/lib/utils'

export function generateStaticParams() {
  return WORK.filter(isCollection).flatMap((item) =>
    item.pieces.map((p) => ({ slug: item.slug, pieceSlug: p.slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pieceSlug: string }>
}): Promise<Metadata> {
  const { slug, pieceSlug } = await params
  const result = getCollectionPiece(slug, pieceSlug)
  if (!result) return {}
  return {
    title: `${result.piece.title} · ${result.collection.title} · beck qing`,
    description: result.piece.description,
  }
}

export default async function CollectionPiecePage({
  params,
}: {
  params: Promise<{ slug: string; pieceSlug: string }>
}) {
  const { slug, pieceSlug } = await params
  const result = getCollectionPiece(slug, pieceSlug)
  if (!result) notFound()
  const { collection, piece, index } = result

  const prev = collection.pieces[(index - 1 + collection.pieces.length) % collection.pieces.length]
  const next = collection.pieces[(index + 1) % collection.pieces.length]
  const tone = toneFor(piece)
  const textForward = isTextForward(piece)

  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-brand flex items-center gap-1.5 text-sm lowercase text-muted-foreground">
          <Link href="/work" className="transition-colors hover:text-foreground">
            all work
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/work/${collection.slug}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Layers className="h-3.5 w-3.5" style={{ color: toneFor(collection) }} />
            {collection.title}
          </Link>
        </div>

        {collection.pieces.length > 1 && (
          <div className="flex items-center gap-2">
            <Link
              href={piecePath(collection, prev)}
              aria-label={`Previous: ${prev.title}`}
              className="rounded-full border border-border p-1.5 text-foreground transition-colors hover:bg-card"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="font-brand text-xs text-muted-foreground">
              {index + 1} / {collection.pieces.length}
            </span>
            <Link
              href={piecePath(collection, next)}
              aria-label={`Next: ${next.title}`}
              className="rounded-full border border-border p-1.5 text-foreground transition-colors hover:bg-card"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      <article className="mt-8">
        {!textForward && (
          <ImageLightbox items={collection.pieces} initialIndex={index} className="mx-auto max-w-3xl shadow-sm">
            <div className="aspect-[16/10] w-full overflow-hidden">
              <WorkPlaceholder item={piece} />
            </div>
          </ImageLightbox>
        )}
        <div className={cn(!textForward && 'mx-auto mt-8 max-w-2xl')}>
          <h1 className="font-brand text-4xl font-bold lowercase text-foreground text-balance sm:text-5xl">
            {piece.title}
          </h1>
          <p
            className="font-brand mt-2 flex flex-wrap items-center gap-2 text-sm lowercase"
            style={{ color: tone }}
          >
            <span>{categoryLabel(piece)}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{primaryDiscipline(piece) ?? 'work'}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{piece.year}</span>
          </p>

          {textForward && piece.excerpt ? (
            <div
              className="mt-6 max-w-2xl border-l-2 py-1 pl-6"
              style={{ borderColor: `color-mix(in srgb, ${tone} 55%, transparent)` }}
            >
              <ExcerptBlock item={piece} />
            </div>
          ) : (
            <p className="font-brand-italic mt-4 text-pretty text-lg text-muted-foreground">
              {piece.description}
            </p>
          )}

          {piece.writeup && <Prose text={piece.writeup} className="mt-6" />}
          <TagLinks tags={piece.tags} className="mt-8" />
        </div>
      </article>

      <Link
        href={`/work/${collection.slug}`}
        className="font-brand mt-12 inline-flex items-center gap-1.5 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        back to {collection.title}
      </Link>
    </main>
  )
}
