import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, Layers, Quote } from 'lucide-react'
import {
  getWorkItem,
  hasWriteup,
  isChapbook,
  isCollection,
  isTextForward,
  itemTags,
  piecePath,
  primaryDiscipline,
  toneFor,
  WORK,
  type WorkCollection,
  type WorkPiece,
} from '@/lib/work'
import {
  aspectFor,
  aspectStyleFor,
  categoryLabel,
  ChapbookContents,
  ExcerptBlock,
  Prose,
  TagLinks,
  WorkPlaceholder,
  WriteupMark,
} from '@/components/work-visuals'
import { ImageLightbox } from '@/components/image-lightbox'
import { MasonryGrid } from '@/components/masonry-grid'
import { cn } from '@/lib/utils'

export function generateStaticParams() {
  return WORK.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const item = getWorkItem(slug)
  if (!item) return {}
  return {
    title: `${item.title} · work · beck qing`,
    description: item.description,
  }
}

export default async function WorkItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getWorkItem(slug)
  if (!item) notFound()

  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
      <Link
        href="/work"
        className="font-brand inline-flex items-center gap-1.5 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        all work
      </Link>

      {isCollection(item) ? <CollectionView item={item} /> : <PieceView piece={item} />}
    </main>
  )
}

function CollectionView({ item }: { item: WorkCollection }) {
  const tone = toneFor(item)
  const chapbook = isChapbook(item)
  return (
    <>
      <header className="mt-6">
        <div className="flex items-center gap-2" style={{ color: tone }}>
          {chapbook ? (
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Layers className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="font-brand text-xs uppercase tracking-[0.3em]">
            {chapbook ? 'chapbook' : 'collection'}
          </span>
        </div>
        <h1 className="font-brand mt-2 text-3xl font-bold lowercase text-foreground/80 text-balance sm:text-4xl">
          {item.title}
        </h1>
        <p className="font-brand-italic mt-3 max-w-xl text-pretty text-lg text-muted-foreground">
          {item.description}
        </p>
        <p className="font-brand mt-2 text-sm lowercase text-muted-foreground">
          {item.pieces.length} pieces · {item.year}
        </p>
        <TagLinks tags={Array.from(itemTags(item))} className="mt-5" />
        {chapbook && item.pieces.length > 0 && (
          <Link
            href={piecePath(item, item.pieces[0])}
            className="font-brand mt-6 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm lowercase transition-opacity hover:opacity-80"
            style={{ backgroundColor: tone, color: 'var(--background)' }}
          >
            start reading
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
          </Link>
        )}
      </header>

      {item.writeup && <Prose text={item.writeup} className="mt-8" />}

      <h2 className="font-brand mt-12 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        {chapbook ? 'table of contents' : 'in this collection'}
      </h2>

      {chapbook ? (
        <ChapbookContents collection={item} />
      ) : (
        <MasonryGrid className="mt-6">
        {item.pieces.map((p, i) => {
          const textForward = isTextForward(p)
          return (
            <div
              key={p.slug}
              className="relative w-full overflow-hidden rounded-xl border border-border transition-transform hover:-translate-y-1"
            >
              {textForward ? (
                <Link
                  href={piecePath(item, p)}
                  className="block p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Quote
                    className="h-6 w-6 shrink-0 -scale-x-100"
                    style={{ color: `color-mix(in srgb, ${toneFor(p)} 70%, transparent)` }}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <p
                    className={cn(
                      'font-brand-italic mt-3 text-pretty text-base leading-relaxed text-foreground',
                      p.tags.includes('poem') && 'whitespace-pre-line',
                    )}
                  >
                    {p.preview ?? p.excerpt ?? p.description}
                  </p>
                  <p className="mt-3 font-brand text-sm lowercase tracking-wide text-muted-foreground">
                    {p.title}
                  </p>
                </Link>
              ) : (
                <>
                  <ImageLightbox items={item.pieces} initialIndex={i} className="rounded-none border-none">
                    <div className={aspectFor(p.slug)} style={aspectStyleFor(p)}>
                      <WorkPlaceholder item={p} />
                    </div>
                  </ImageLightbox>
                  <Link
                    href={piecePath(item, p)}
                    className="block p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="font-brand text-sm font-bold lowercase leading-tight text-foreground/80 text-balance">
                      {p.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  </Link>
                </>
              )}
              {hasWriteup(p) && (
                <div className="absolute left-3 top-3">
                  <WriteupMark />
                </div>
              )}
            </div>
          )
        })}
        </MasonryGrid>
      )}
    </>
  )
}

function PieceView({ piece }: { piece: WorkPiece }) {
  const tone = toneFor(piece)
  const textForward = isTextForward(piece)

  const meta = (
    <p className="font-brand mt-2 flex flex-wrap items-center gap-2 text-sm lowercase" style={{ color: tone }}>
      <span>{categoryLabel(piece)}</span>
      <span className="text-muted-foreground/50">·</span>
      <span>{primaryDiscipline(piece) ?? 'work'}</span>
      <span className="text-muted-foreground/50">·</span>
      <span>{piece.year}</span>
    </p>
  )

  // Text-forward pieces lead with the words; everything else leads with the image.
  if (textForward) {
    return (
      <article className="mt-6">
        <h1 className="font-brand text-3xl font-bold lowercase text-foreground/80 text-balance sm:text-4xl">
          {piece.title}
        </h1>
        {meta}
        <div
          className="mt-8 max-w-2xl rounded-2xl border-l-2 py-1 pl-6"
          style={{ borderColor: `color-mix(in srgb, ${tone} 55%, transparent)` }}
        >
          <ExcerptBlock item={piece} />
        </div>
        {piece.writeup && <Prose text={piece.writeup} className="mt-8" />}
        <TagLinks tags={piece.tags} className="mt-10" />
      </article>
    )
  }

  return (
    <article className="mt-6">
      <ImageLightbox items={[piece]} className="mx-auto max-w-3xl shadow-sm">
        <div className="aspect-[16/10] w-full overflow-hidden" style={aspectStyleFor(piece)}>
          <WorkPlaceholder item={piece} />
        </div>
      </ImageLightbox>
      <div className="mx-auto mt-8 max-w-2xl">
        <h1 className="font-brand text-3xl font-bold lowercase text-foreground/80 text-balance sm:text-4xl">
          {piece.title}
        </h1>
        {meta}
        <p className="font-brand-italic mt-4 text-pretty text-lg text-muted-foreground">
          {piece.description}
        </p>
        {piece.writeup && <Prose text={piece.writeup} className="mt-6" />}
        <TagLinks tags={piece.tags} className="mt-8" />
      </div>
    </article>
  )
}
