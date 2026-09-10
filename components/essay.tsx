import type { AnchorHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import type { MDXComponents } from 'mdx/types'
import { getWorkItem, isCollection, piecePath, workHref, type WorkPiece } from '@/lib/work'
import { WorkPlaceholder } from '@/components/work-visuals'
import { cn } from '@/lib/utils'
import { headingStyles } from '@/lib/heading-styles'

/**
 * Wraps a rendered MDX body: sets the measure, vertical rhythm, and base type.
 *
 * `tone` is the piece's accent (`toneFor(piece)`), published to the subtree as
 * `--essay-accent`. `essayComponents` is one global, piece-agnostic map — MDX
 * gives it no way to receive a piece — so a component that wants the tone
 * reads it off the cascade from here rather than being handed it. Optional:
 * without it the accent falls back to `--writing`, which is what the rule was
 * hard-coded to before science essays needed emerald.
 */
export function EssayBody({
  children,
  tone,
  className,
}: {
  children: ReactNode
  tone?: string
  className?: string
}) {
  return (
    <div
      className={cn('max-w-2xl text-pretty text-base leading-relaxed text-foreground/85', className)}
      style={tone ? ({ '--essay-accent': tone } as CSSProperties) : undefined}
    >
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
 *
 * The emoji sits in its own fixed-width grid column so wrapped prose lines
 * up under the label rather than running back underneath the marker —
 * `items-center` centers it on the row's full height, so a multi-line item
 * gets the emoji centered on the whole paragraph rather than pinned to the
 * first line. See `.font-emoji` in globals.css for the subsetted monochrome
 * font this renders through.
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
    <li className="grid grid-cols-[1.75rem_1fr] items-center gap-x-2">
      <span aria-hidden="true" className="font-emoji text-xl leading-none">
        {emoji}
      </span>
      <span>
        <span className="font-brand-italic">{label}</span>
        {children ? <> {children}</> : null}
      </span>
    </li>
  )
}

/**
 * A market's header block: name over hours-and-date. Art fair essay only.
 * `name` is a real `h3` — it sits between the essay's `##` section heads and
 * the `####` "+ good" / "Δ for next time" subsections, which otherwise skip
 * a level.
 */
export function MarketHeader({ name, when }: { name: string; when: string }) {
  return (
    <div className="mt-8">
      <h3 className={cn(headingStyles.h3, 'mt-0')}>{name}</h3>
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

/**
 * A stand-in for an illustration that hasn't been drawn yet — a dashed box
 * describing what will go here, so a writeup can be published before its art
 * is. Distinct from `WorkPlaceholder`'s tinted "this piece has no image"
 * treatment: that one means the image may never come; this one is a
 * to-do marker for a specific planned picture, described by `children`.
 */
export function Illustration({ children }: { children: ReactNode }) {
  return (
    <figure className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/40 p-6 text-center">
      <ImageOff className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} aria-hidden="true" />
      <figcaption className="max-w-md text-sm text-muted-foreground">{children}</figcaption>
    </figure>
  )
}

/** The base-element map handed to MDX. */
export const essayComponents: MDXComponents = {
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => <h2 className={headingStyles.h2} {...props} />,
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => <h3 className={headingStyles.h3} {...props} />,
  h4: (props: HTMLAttributes<HTMLHeadingElement>) => <h4 className={headingStyles.h4} {...props} />,
  h5: (props: HTMLAttributes<HTMLHeadingElement>) => <h5 className={headingStyles.h5} {...props} />,
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
      style={{ borderColor: 'color-mix(in srgb, var(--essay-accent, var(--writing)) 55%, transparent)' }}
      {...props}
    />
  ),
  hr: () => <hr className="mt-10 border-border" />,
  strong: (props: HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-foreground" {...props} />,
  em: (props: HTMLAttributes<HTMLElement>) => <em className="italic" {...props} />,
}
