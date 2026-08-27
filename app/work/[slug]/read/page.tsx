// A static segment beats a dynamic sibling, so /work/[slug]/read resolves
// here rather than to [pieceSlug] — safe only as long as no piece is slugged
// "read" (none are today; that piece would otherwise become unreachable).
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { getWorkItem, isChapbook, isCollection, metaDescription, toneFor, WORK } from '@/lib/work'
import { VerseBlock } from '@/components/work-visuals'
import { cn } from '@/lib/utils'

export function generateStaticParams() {
  return WORK.filter(isCollection)
    .filter(isChapbook)
    .map((c) => ({ slug: c.slug }))
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
    title: `${item.title} · read · beck qing`,
    description: metaDescription(item),
  }
}

export default async function ChapbookReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getWorkItem(slug)
  if (!item || !isCollection(item) || !isChapbook(item)) notFound()
  const collection = item
  const tone = toneFor(collection)

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <Link
        href={`/work/${collection.slug}`}
        className="font-brand inline-flex items-center gap-1.5 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {collection.title}
        <span className="text-muted-foreground/50">·</span>
        contents
      </Link>

      <header className="mx-auto mt-6 max-w-xl text-center">
        <div className="flex items-center justify-center gap-2" style={{ color: tone }}>
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span className="font-brand text-xs uppercase tracking-[0.3em]">chapbook</span>
        </div>
        <h1 className="font-brand mt-2 text-3xl font-bold lowercase text-foreground/80 text-balance sm:text-4xl">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="font-brand-italic mx-auto mt-3 text-pretty text-lg text-muted-foreground">
            {collection.description}
          </p>
        )}
      </header>

      <div className="mt-16 space-y-16">
        {collection.pieces.map((piece, i) => (
          <article key={piece.slug} className={cn(i > 0 && 'border-t border-border pt-16')}>
            <p className="font-brand text-center text-xs tabular-nums text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </p>
            <h2 className="font-brand mt-2 text-center text-lg font-bold lowercase text-foreground/80 text-balance sm:text-xl">
              {piece.title}
            </h2>
            <VerseBlock text={piece.text ?? ''} className="mx-auto mt-8 text-base" />
          </article>
        ))}
      </div>

      <Link
        href={`/work/${collection.slug}`}
        className="font-brand mt-16 inline-flex items-center gap-1.5 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        back to contents
      </Link>
    </main>
  )
}
