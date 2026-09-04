'use client'

import Link from 'next/link'
import { ArrowRight, Palette, Feather, FlaskConical } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { StampBadge } from '@/components/collage'
import { HeroWordScatter, IconScatterField, CategoryWord, useCollage } from '@/components/hero-icon-collage'
import { PieceColumn } from '@/components/piece-column'
import type { IconCategory } from '@/lib/brand-icons'
import { getWorkItem, getCollectionPiece, type WorkPiece } from '@/lib/work'
import { NOW_PREFIX, NOW_ENTRIES } from '@/lib/now'
import { cn } from '@/lib/utils'

/** A hand-picked slug (§7 of the discipline-columns spec): a bare string
 *  looks up a top-level item, a `[collection, piece]` tuple looks up a
 *  piece nested inside a collection. */
type PieceRef = string | readonly [collection: string, piece: string]

/** Resolves a `PieceRef` through the site's own accessors, so a typo in
 *  `CARDS` below is a build-time failure rather than a blank rung (§7).
 *  A collection slug resolves to the collection itself, standing in for
 *  its own cover — the same fallback `CollectionStack`'s cover card uses. */
function resolvePiece(ref: PieceRef): WorkPiece {
  if (typeof ref === 'string') {
    const item = getWorkItem(ref)
    if (!item) throw new Error(`app/page.tsx CARDS: unknown work slug "${ref}"`)
    return item
  }
  const [collection, piece] = ref
  const found = getCollectionPiece(collection, piece)
  if (!found) throw new Error(`app/page.tsx CARDS: unknown piece "${piece}" in collection "${collection}"`)
  return found.piece
}

type Card = {
  href: string
  label: string
  Icon: typeof Palette
  accentClass: string
  category: IconCategory
  pieces: PieceRef[]
  copy: string
  cta: string
}

// accentClass holds the full Tailwind class (not just a color name plugged
// into a template) since Tailwind's scanner only generates classes it can
// see literally in source — a `text-${name}` interpolation wouldn't work
// for a class that doesn't also appear literally somewhere else.
//
// Each card's `pieces` is hand-picked by slug, ordered top to bottom, not
// derived by filtering — the column is a composition no predicate
// expresses, and hand-picking means adding work never silently changes the
// home page (§7). No piece may appear on more than one card: the science
// card below claims both of the site's original two science pieces
// (`transformation`, `delirium`) plus both in-progress drafts, so none of
// the four may also be picked for the art or writing column.
const CARDS: Card[] = [
  {
    href: '/work?tags=art',
    label: 'art',
    Icon: Palette,
    // Brighter than --art in dark mode (denim reads dark/muted against the
    // hero's sky-colored icons and midnight background) — see
    // --hero-accent-art in globals.css. Same as --art in light mode.
    accentClass: 'text-hero-accent-art',
    category: 'art' as IconCategory,
    // Nearly uniform shape (1/1, 1/1, 4/5, 1/1) on purpose — an even run
    // reads through the offsets and rotations, not the aspect ratios.
    // `lady-bird` breaks the rhythm, which is why it isn't rung 1.
    pieces: ['rabbit-in-the-moon', 'april-colors-24', 'lady-bird', 'projection'],
    copy: 'Paintings made mostly after dark — moons, plants, and the anatomy of feeling.',
    cta: 'look around',
  },
  {
    href: '/work?tags=writing',
    label: 'writing',
    Icon: Feather,
    accentClass: 'text-writing',
    category: 'hu' as IconCategory,
    // Poem, essay, poem, essay — the alternation is the column's claim to
    // two forms, made visible in the shape of the type.
    pieces: [
      ['love-worth-heartbreak', 'lost'],
      'note-systems',
      ['love-worth-heartbreak', 'back-to-nature'],
      'chinese-emoji-poetry',
    ],
    copy: 'Short poems and longer essays about what it means to live in the world.',
    cta: 'start reading',
  },
  {
    href: '/work?tags=science',
    label: 'science',
    Icon: FlaskConical,
    accentClass: 'text-science',
    category: 'sci' as IconCategory,
    // Order descends in strength: the finished essay leads, delirium's
    // code-demo rail gives the column its visual break, and the two
    // in-progress essays trail off toward the fade — unfinished work
    // literally fading out. Both drafts are flagged `unfinished` in
    // lib/work.ts; PieceColumn renders UnfinishedMark on them itself.
    pieces: ['transformation', 'delirium', 'colony-selection', 'designing-dna'],
    copy: 'Semi-technical experiments and explanations of phenomena, mostly biology and code.',
    cta: 'discover more',
  },
]

/** One discipline's header + column, as one `<Link>` (§6) — hovering
 *  anywhere in it squares up its column (§8), whether the pointer is over
 *  the header or a rung. The focus ring lives on the header block, not the
 *  link itself: a ring around a group whose height is set by a
 *  several-hundred-pixel decorative column would mostly circle nothing. */
function DisciplineColumn({ href, label, Icon, accentClass, category, pieces, copy, cta }: Card) {
  const { hovered } = useCollage()
  const active = hovered === category
  const columnPieces = pieces.map(resolvePiece)

  return (
    <Link
      href={href}
      className={cn(
        'discipline-column group flex w-full max-w-md flex-col outline-none',
        active && 'discipline-column-active',
      )}
    >
      <div className="rounded-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="flex justify-center">
          <StampBadge className={accentClass} tilt={0}>
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </StampBadge>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{copy}</p>

        <span className="font-brand mt-3 flex items-center gap-1.5 text-sm font-medium lowercase text-foreground/70 transition-colors group-hover:text-foreground">
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>

      <div className="mt-6">
        <PieceColumn pieces={columnPieces} />
      </div>
    </Link>
  )
}

/** The three discipline columns — no card behind them (§6): each is a
 *  header plus a loose run of 2–4 unrelated pieces standing directly on the
 *  page, squaring up on its own hover/focus, or when the matching word in
 *  the hero copy above is hovered (shared via HeroWordScatter's context).
 *  `md:items-start`: each column's own height is honest (science, with
 *  four pieces including two drafts, still isn't forced to match the
 *  others). Below `md` the three stack and each fades individually
 *  (`.column-fade` inside `PieceColumn`); at `md` and up they sit side by
 *  side inside one shared fade (`.columns-fade-shared`) instead — see §5
 *  and the comment on `.column-fade` in globals.css. */
function DisciplinePanels() {
  return (
    <div className="columns-fade-shared flex flex-col items-center gap-10 sm:gap-12 md:flex-row md:items-start md:justify-center md:gap-6">
      {CARDS.map((card) => (
        <DisciplineColumn key={card.href} {...card} />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      <HeroWordScatter>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <IconScatterField />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
            <BrandMark detail="filled" className="h-16 w-16" />
            <p className="font-brand mt-8 text-sm uppercase tracking-[0.35em] text-secondary-foreground/70">
              personal home of
            </p>
            <h1 className="font-brand mt-3 text-5xl font-bold lowercase tracking-tight text-foreground sm:text-7xl">
              beck qing
            </h1>
            <p className="mt-8 max-w-xl text-pretty text-base leading-relaxed text-foreground/80 sm:text-lg">
              forever a student of <CategoryWord category="art">art</CategoryWord>,{' '}
              <CategoryWord category="sci">science</CategoryWord>, and{' '}
              <CategoryWord category="hu">humanity</CategoryWord>
              <br />
              <Link href="/now">
                <span className="underline decoration-dotted decoration-2 underline-offset-4">
                  {NOW_PREFIX}
                </span>{' '}
                {NOW_ENTRIES.at(-1)!.text}
              </Link>
              <br />
              open to roles in automation, biotech, and food
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/work"
                className="font-brand inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold lowercase text-primary-foreground transition-transform hover:-translate-y-0.5 hover:rotate-1"
              >
                see the work
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="font-brand inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold lowercase text-foreground transition-colors hover:bg-muted hover:-rotate-1"
              >
                about me
              </Link>
            </div>
          </div>
        </section>

        {/* Pathways — three loose columns standing on the page, dissolving
            together into the gallery link below (§2/§5 of the
            discipline-columns spec). No card, no overlap: DisciplinePanels
            is the masked block; the gallery CTA is its sibling, pulled up
            by a negative margin so it sits inside the same dissolving band
            rather than starting below it. */}
        <section className="mx-auto max-w-7xl px-5 pt-4 sm:px-8">
          <DisciplinePanels />

          {/* relative + z-10: a following sibling with a negative margin
              doesn't reliably paint over the previous block's own content
              otherwise, and this has to stay fully opaque while the
              columns above it fade away (§5). */}
          <div className="relative z-10 -mt-8 pb-20 text-center sm:pb-28">
            <Link
              href="/work"
              className="font-brand inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold lowercase text-primary-foreground transition-transform hover:-translate-y-0.5 hover:rotate-1"
            >
              see all work
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </HeroWordScatter>
    </main>
  )
}
