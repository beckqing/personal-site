import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import type { MDXComponents } from 'mdx/types'
import { getWorkItem, isCollection, piecePath, workHref, type WorkPiece } from '@/lib/work'
import { WorkPlaceholder } from '@/components/work-visuals'
import { cn } from '@/lib/utils'

/** Wraps a rendered MDX body: sets the measure, vertical rhythm, and base type. */
export function EssayBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-2xl text-pretty text-base leading-relaxed text-foreground/85', className)}>
      {children}
    </div>
  )
}

/**
 * A centred display block for verse — the emoji stanzas and their Chinese
 * sources. Upright, never italic: italic CJK is a synthesized oblique and
 * emoji ignore slant entirely, so VerseBlock's slanted default is wrong here.
 * Line breaks inside are preserved via `white-space: pre-line`, an inherited
 * property, so MDX's own paragraph-per-stanza splitting still lands each
 * stanza's internal newlines correctly without any string parsing here.
 * `lang` sets the `lang` attribute so the right font stack and line-breaking
 * rules apply. Long single lines (the emoji stanzas) sit in their own
 * `overflow-x: auto` container so they scroll in place instead of forcing
 * the page itself to scroll sideways.
 */
export function Verse({ lang, children }: { lang?: 'zh' | 'en'; children: ReactNode }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <div
        lang={lang}
        className="mx-auto w-max min-w-full whitespace-pre-line text-center font-brand not-italic text-foreground [&>*:first-child]:mt-0"
      >
        {children}
      </div>
    </div>
  )
}

/** The emoji-bullet list. Renders <ul role="list"> with the marker removed. */
export function EmojiList({ children }: { children: ReactNode }) {
  return (
    <ul role="list" className="mt-4 list-none space-y-3 pl-0">
      {children}
    </ul>
  )
}

/**
 * One emoji bullet: emoji + mono italic label, then the explanation.
 * The emoji is decorative (the label carries the meaning), so it is
 * aria-hidden — a screen reader announcing "direct hit, I did it!" is noise.
 * `children` is optional: several rows in the art fair essay are label-only
 * shorthand meaning "same as last market, no notes".
 */
export function Item({
  emoji,
  label,
  children,
}: {
  emoji: string
  label: string
  children?: ReactNode
}) {
  return (
    <li>
      <span aria-hidden="true">{emoji}</span> <span className="font-brand-italic">{label}</span>
      {children ? <> {children}</> : null}
    </li>
  )
}

/** A market's header block: name over hours-and-date. Art fair essay only. */
export function MarketHeader({ name, when }: { name: string; when: string }) {
  return (
    <div className="mt-8">
      <p className="font-brand text-lg font-bold lowercase text-foreground/80">{name}</p>
      <p className="text-sm text-muted-foreground">{when}</p>
    </div>
  )
}

/** A quiet, small-type closing note — the archive's <small> asides. */
export function Aside({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-xs text-muted-foreground">{children}</p>
}

/**
 * A cross-link to a piece that already exists in lib/work.ts, rendered as its
 * thumbnail plus title. Throws at build time if the slug doesn't resolve, so a
 * typo fails the build rather than rendering a hole.
 */
export function PieceLink({
  slug,
  pieceSlug,
  caption,
}: {
  slug: string
  pieceSlug?: string
  caption?: string
}) {
  const item = getWorkItem(slug)
  if (!item) throw new Error(`PieceLink: no work item found for slug "${slug}"`)

  let piece: WorkPiece = item
  let href = workHref(item)

  if (pieceSlug) {
    if (!isCollection(item)) {
      throw new Error(`PieceLink: "${slug}" is not a collection, cannot resolve pieceSlug "${pieceSlug}"`)
    }
    const found = item.pieces.find((p) => p.slug === pieceSlug)
    if (!found) throw new Error(`PieceLink: no piece "${pieceSlug}" in collection "${slug}"`)
    piece = found
    href = piecePath(item, found)
  }

  return (
    <Link href={href} className="group inline-block w-40 align-top">
      <span className="block aspect-square w-full overflow-hidden rounded-lg border border-border">
        <WorkPlaceholder item={piece} />
      </span>
      <span className="mt-2 block font-brand text-sm lowercase text-foreground/80 transition-colors group-hover:text-foreground">
        {piece.title}
      </span>
      {caption && <span className="mt-1 block text-xs text-muted-foreground">{caption}</span>}
    </Link>
  )
}

/** A row of PieceLinks or images with one shared caption underneath. */
export function FigureRow({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="mt-8">
      <div className="flex flex-wrap gap-4">{children}</div>
      {caption && <figcaption className="mt-2 text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}

/** The base-element map handed to MDX. */
export const essayComponents: MDXComponents = {
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-brand mt-10 text-xl font-bold lowercase text-foreground/80" {...props} />
  ),
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-brand mt-8 text-lg font-bold lowercase text-foreground/80" {...props} />
  ),
  h4: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="font-brand mt-6 text-base font-bold lowercase text-foreground/80" {...props} />
  ),
  h5: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className="font-brand mt-4 text-sm font-bold lowercase text-foreground/80" {...props} />
  ),
  p: (props: HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mt-4 text-pretty leading-relaxed text-foreground/85" {...props} />
  ),
  a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
      style={{ color: 'var(--goldenrod)' }}
      {...props}
    />
  ),
  ul: (props: HTMLAttributes<HTMLUListElement>) => <ul className="mt-4 list-disc space-y-1 pl-5" {...props} />,
  ol: (props: HTMLAttributes<HTMLOListElement>) => <ol className="mt-4 list-decimal space-y-1 pl-5" {...props} />,
  li: (props: HTMLAttributes<HTMLLIElement>) => <li {...props} />,
  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="mt-6 border-l-2 py-1 pl-5 text-foreground/85"
      style={{ borderColor: 'color-mix(in srgb, var(--writing) 55%, transparent)' }}
      {...props}
    />
  ),
  hr: () => <hr className="mt-10 border-border" />,
  strong: (props: HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-foreground" {...props} />,
  em: (props: HTMLAttributes<HTMLElement>) => <em className="italic" {...props} />,
}
