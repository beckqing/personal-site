import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import {
  getCollectionPiece,
  isChapbook,
  isCollection,
  isTextForward,
  piecePath,
  primaryDiscipline,
  toneFor,
  WORK,
} from '@/lib/work'
import { BookFolio, categoryLabel, ExcerptBlock, Prose, TagLinks } from '@/components/work-visuals'
import { PieceMedia } from '@/components/media-player'
import { BookPageNav } from '@/components/book-page-nav'
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
  const chapbook = isChapbook(collection)

  if (chapbook) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <BookPageNav prevHref={piecePath(collection, prev)} nextHref={piecePath(collection, next)} />

        <Link
          href={`/work/${collection.slug}`}
          className="font-brand inline-flex items-center gap-1.5 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {collection.title}
          <span className="text-muted-foreground/50">·</span>
          contents
        </Link>

        <div className="relative">
          {collection.pieces.length > 1 && (
            <>
              <Link
                href={piecePath(collection, prev)}
                aria-label={`Previous: ${prev.title}`}
                className="absolute left-0 top-1/2 z-10 hidden -translate-x-14 -translate-y-1/2 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card min-[900px]:inline-flex"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href={piecePath(collection, next)}
                aria-label={`Next: ${next.title}`}
                className="absolute right-0 top-1/2 z-10 hidden translate-x-14 -translate-y-1/2 rounded-full border border-border bg-background/85 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-card min-[900px]:inline-flex"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </>
          )}

          <article className="mt-6 rounded-2xl border border-border bg-card px-6 py-10 shadow-sm sm:px-14 sm:py-14">
            <p
              className="font-brand text-center text-xs uppercase tracking-[0.3em]"
              style={{ color: tone }}
            >
              {collection.title}
            </p>
            <h1 className="font-brand mt-3 text-center text-lg font-bold lowercase text-foreground/80 text-balance sm:text-xl">
              {piece.title}
            </h1>
            <p className="font-brand mt-2 text-center text-xs lowercase text-muted-foreground">
              {categoryLabel(piece)} · {piece.year}
            </p>

            <div className="mx-auto mt-6 h-px w-12" style={{ backgroundColor: `color-mix(in srgb, ${tone} 45%, transparent)` }} />

            <div className="mx-auto mt-8 max-w-md">
              {piece.excerpt ? (
                <ExcerptBlock item={piece} className="text-base" />
              ) : (
                <p className="font-brand-italic text-pretty text-base leading-relaxed text-muted-foreground">
                  {piece.description}
                </p>
              )}
            </div>

            {piece.writeup && <Prose text={piece.writeup} className="mx-auto mt-8 max-w-md text-sm" />}

            <TagLinks tags={piece.tags} className="mt-10 justify-center" />
          </article>
        </div>

        <BookFolio index={index} total={collection.pieces.length} />

        {collection.pieces.length > 1 && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <Link
              href={piecePath(collection, prev)}
              className="font-brand group flex min-w-0 items-center gap-1.5 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span className="truncate">{prev.title}</span>
            </Link>
            <Link
              href={piecePath(collection, next)}
              className="font-brand group flex min-w-0 items-center justify-end gap-1.5 text-right text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="truncate">{next.title}</span>
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </main>
    )
  }

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
          <PieceMedia
            piece={piece}
            lightboxItems={collection.pieces}
            lightboxIndex={index}
            className="mx-auto max-w-3xl shadow-sm"
          />
        )}
        <div className={cn(!textForward && 'mx-auto mt-8 max-w-2xl')}>
          <h1 className="font-brand text-3xl font-bold lowercase text-foreground/80 text-balance sm:text-4xl">
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
