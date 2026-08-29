import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, Hourglass, Layers } from 'lucide-react'
import {
  collectionLayout,
  getWorkItem,
  isChapbook,
  isCollection,
  isHybrid,
  isTextForward,
  itemTags,
  metaDescription,
  piecePath,
  primaryDiscipline,
  toneFor,
  WORK,
  type WorkCollection,
  type WorkPiece,
} from '@/lib/work'
import {
  categoryLabel,
  ChapbookContents,
  PieceTile,
  ProcessSection,
  Prose,
  TagLinks,
  VerseBlock,
} from '@/components/work-visuals'
import { EssayBody } from '@/components/essay'
import { essayBody } from '@/lib/essay-bodies'
import { PieceMedia } from '@/components/media-player'
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
    description: metaDescription(item),
  }
}

export default async function WorkItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getWorkItem(slug)
  if (!item) notFound()
  const chapbook = isCollection(item) && isChapbook(item)

  return (
    <main className={cn('mx-auto px-5 py-16 sm:px-8 sm:py-20', chapbook ? 'max-w-3xl' : 'max-w-5xl')}>
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
  const layout = collectionLayout(item)
  const chapbook = layout === 'book'
  return (
    <>
      <header className={cn('mt-6', chapbook && 'mx-auto max-w-xl text-center')}>
        <div className={cn('flex items-center gap-2', chapbook && 'justify-center')} style={{ color: tone }}>
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
        {item.description && (
          <p
            className={cn(
              'font-brand-italic mt-3 max-w-xl text-pretty text-lg text-muted-foreground',
              chapbook && 'mx-auto',
            )}
          >
            {item.description}
          </p>
        )}
        <p className="font-brand mt-2 text-sm lowercase text-muted-foreground">
          {item.pieces.length} pieces · {item.year}
        </p>
        <TagLinks tags={Array.from(itemTags(item))} className={cn('mt-5', chapbook && 'justify-center')} />
        {chapbook && item.pieces.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={piecePath(item, item.pieces[0])}
              className="font-brand inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm lowercase transition-opacity hover:opacity-80"
              style={{ backgroundColor: tone, color: 'var(--background)' }}
            >
              start reading
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
            </Link>
            <Link
              href={`/work/${item.slug}/read`}
              className="font-brand inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
            >
              read straight through
            </Link>
          </div>
        )}
      </header>

      {item.writeup && <Prose text={item.writeup} className={cn('mt-8', chapbook && 'mx-auto')} />}

      <h2 className="font-brand mt-12 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        {chapbook ? 'table of contents' : 'in this collection'}
      </h2>

      {chapbook ? (
        <ChapbookContents collection={item} />
      ) : (
        <MasonryGrid className="mt-6" columns={layout === 'illustrated' ? { lg: 2 } : undefined}>
          {item.pieces.map((p, i) => (
            <PieceTile key={p.slug} collection={item} piece={p} index={i} />
          ))}
        </MasonryGrid>
      )}
    </>
  )
}

function PieceView({ piece }: { piece: WorkPiece }) {
  const tone = toneFor(piece)
  const textForward = isTextForward(piece)
  const hybrid = isHybrid(piece)
  const Body = essayBody(piece.slug)

  const meta = (
    <p className="font-brand mt-2 flex flex-wrap items-center gap-2 text-sm lowercase" style={{ color: tone }}>
      <span>{categoryLabel(piece)}</span>
      <span className="text-muted-foreground/50">·</span>
      <span>{primaryDiscipline(piece) ?? 'work'}</span>
      <span className="text-muted-foreground/50">·</span>
      <span>{piece.year}</span>
    </p>
  )

  const unfinishedFlag = piece.unfinished && (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Hourglass className="h-4 w-4" aria-hidden="true" />
      <span className="font-brand text-xs uppercase tracking-[0.3em]">in progress</span>
    </div>
  )

  // Text-forward pieces lead with the words; everything else leads with the image.
  if (textForward) {
    return (
      <article className="mt-6">
        {unfinishedFlag}
        <h1 className="font-brand text-3xl font-bold lowercase text-foreground/80 text-balance sm:text-4xl">
          {piece.title}
        </h1>
        {meta}
        <div
          className="mt-8 max-w-2xl rounded-2xl border-l-2 py-1 pl-6"
          style={{ borderColor: `color-mix(in srgb, ${tone} 55%, transparent)` }}
        >
          <VerseBlock text={piece.text ?? ''} className="text-xl text-foreground" />
        </div>
        <PieceMedia piece={piece} lightboxItems={[piece]} className="mx-auto mt-8 max-w-3xl shadow-sm" />
        {Body ? (
          <EssayBody className="mt-8">
            <Body />
          </EssayBody>
        ) : (
          piece.writeup && <Prose text={piece.writeup} className="mt-8" />
        )}
        <ProcessSection piece={piece} />
        <TagLinks tags={piece.tags} className="mt-10" />
      </article>
    )
  }

  return (
    <article className="mt-6">
      <PieceMedia piece={piece} lightboxItems={[piece]} className="mx-auto max-w-3xl shadow-sm" />
      <div className="mx-auto mt-8 max-w-2xl">
        {unfinishedFlag}
        <h1 className="font-brand text-3xl font-bold lowercase text-foreground/80 text-balance sm:text-4xl">
          {piece.title}
        </h1>
        {meta}
        {hybrid && <VerseBlock text={piece.text ?? ''} className="mt-4 text-lg text-foreground" />}
        {piece.description && (
          <p className="font-brand-italic mt-4 text-pretty text-lg text-muted-foreground">{piece.description}</p>
        )}
        {Body ? (
          <EssayBody className="mt-6">
            <Body />
          </EssayBody>
        ) : (
          piece.writeup && <Prose text={piece.writeup} className="mt-6" />
        )}
        <ProcessSection piece={piece} />
        <TagLinks tags={piece.tags} className="mt-8" />
      </div>
    </article>
  )
}
