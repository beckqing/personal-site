import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Layers } from 'lucide-react'
import {
  getWorkItem,
  hasWriteup,
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
  categoryLabel,
  ExcerptBlock,
  Prose,
  TagLinks,
  WorkPlaceholder,
  WriteupMark,
} from '@/components/work-visuals'

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
  return (
    <>
      <header className="mt-6">
        <div className="flex items-center gap-2" style={{ color: tone }}>
          <Layers className="h-4 w-4" aria-hidden="true" />
          <span className="font-brand text-xs uppercase tracking-[0.3em]">collection</span>
        </div>
        <h1 className="font-brand mt-2 text-4xl font-bold lowercase text-foreground text-balance sm:text-5xl">
          {item.title}
        </h1>
        <p className="font-brand-italic mt-3 max-w-xl text-pretty text-lg text-muted-foreground">
          {item.description}
        </p>
        <p className="font-brand mt-2 text-sm lowercase text-muted-foreground">
          {item.pieces.length} pieces · {item.year}
        </p>
        <TagLinks tags={Array.from(itemTags(item))} className="mt-5" />
      </header>

      {item.writeup && <Prose text={item.writeup} className="mt-8" />}

      <h2 className="font-brand mt-12 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        in this collection
      </h2>

      <div className="mt-6 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {item.pieces.map((p) => (
          <Link
            key={p.slug}
            href={piecePath(item, p)}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-xl border border-border text-left transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className={aspectFor(p.slug)}>
              <WorkPlaceholder item={p} />
            </div>
            <div className="p-4">
              <p className="font-brand text-base font-bold lowercase leading-tight text-foreground text-balance">
                {p.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </div>
            {/* Bottom-left, matching the gallery — the year badge owns top-right. */}
            {hasWriteup(p) && (
              <div className="absolute left-3 top-3">
                <WriteupMark />
              </div>
            )}
          </Link>
        ))}
      </div>
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
        <h1 className="font-brand text-4xl font-bold lowercase text-foreground text-balance sm:text-5xl">
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
    <article className="mt-6 grid gap-8 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-start">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border">
        <WorkPlaceholder item={piece} showYear={false} />
      </div>
      <div>
        <h1 className="font-brand text-4xl font-bold lowercase text-foreground text-balance sm:text-5xl">
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
