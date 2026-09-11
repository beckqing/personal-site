'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentType,
  type ReactNode,
  type RefObject,
  type SVGProps,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Archive,
  ArrowDown,
  ChevronDown,
  Circle,
  Maximize2,
  Play,
  Quote,
  RotateCcw,
  RotateCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { HeartIcon } from '@/components/heart-icon'
import {
  ALL_TAGS,
  DEFAULT_TIERS,
  DISCIPLINE_FACETS,
  DISCIPLINE_TONE,
  DISCIPLINES,
  FILTER_MODES,
  filterWork,
  formFor,
  galleryLightboxItems,
  hasAnimation,
  isCollection,
  isDiscipline,
  isHybrid,
  isTextForward,
  MAX_DISCIPLINE_CHIPS,
  mediumFor,
  MODE_LABEL,
  nextMode,
  opensInGalleryLightbox,
  posterAspectFor,
  SORT_LABEL,
  statusFlagsFor,
  tierOf,
  SORT_MODES,
  sortWork,
  splitPinned,
  tagTone,
  toneFor,
  UNIVERSAL_FACETS,
  WORK,
  WORK_TIERS,
  workHref,
  type Discipline,
  type FilterMode,
  type SortMode,
  type WorkCollection,
  type WorkItem,
  type WorkPiece,
  type WorkTier,
} from '@/lib/work'
import {
  aspectStyleFor,
  CollectionStack,
  StatusRail,
  VerseBlock,
  WorkPlaceholder,
} from '@/components/work-visuals'
import { entryName } from '@/components/code-demo-frame'
import { ImageLightbox } from '@/components/image-lightbox'
import { MediaBadges } from '@/components/media-player'
import { MasonryGrid, useMasonryColumns } from '@/components/masonry-grid'
import { cn } from '@/lib/utils'

/**
 * The gallery's lightbox is URL state; every other lightbox is not (see
 * ARCHITECTURE.md's Component layers section). `WorkGallery` renders one
 * `ImageLightbox` in controlled, triggerless mode, opened by `?view=<slug>`.
 * `ImageCard` reaches this to become a lightbox trigger instead of a plain
 * link, and to register its image wrapper as a flight-dismiss target — see
 * `resolveTrigger` on `ImageLightbox`. Null outside a `WorkGallery` (or once
 * a gallery's tags/query filters a card's item out of the lightbox domain),
 * which keeps `ImageCard` usable standalone and makes this opt-in rather
 * than load-bearing.
 */
type GalleryLightboxApi = {
  open: (slug: string) => void
  registerTile: (slug: string, node: HTMLElement | null) => void
}
const GalleryLightboxContext = createContext<GalleryLightboxApi | null>(null)

/** Where each discipline's glow sits, so blends read as distinct light sources. */
const GRADIENT_ORIGIN: Record<Discipline, string> = {
  art: '12% 0%',
  writing: '88% 8%',
  science: '50% 100%',
}

// Same --hero-icon-* colors as the homepage's icon collage (sky/spring-green/
// goldenrod in light mode, denim/emerald/pumpkin in dark — see globals.css),
// rather than the standard --art/--writing/--science tag color, so the wash
// reads as the same light source as the hero rather than a duller re-tinted
// version of the tag color.
const WASH_TONE: Record<Discipline, string> = {
  art: 'var(--hero-icon-art)',
  writing: 'var(--hero-icon-writing)',
  science: 'var(--hero-icon-science)',
}

/**
 * A colored/neutral tag pill, used both in the filter panel and on cards.
 * `tone` overrides the tag's own color (tagTone only colors discipline tags)
 * — used to tint a discipline's subtags with its parent's color so they
 * still read as grouped once the row label is gone.
 */
function TagChip({
  tag,
  active,
  onClick,
  size = 'md',
  tone: toneOverride,
  className,
}: {
  tag: string
  active: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  tone?: string
  className?: string
}) {
  const tone = toneOverride ?? tagTone(tag)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'font-brand inline-flex cursor-pointer items-center rounded-full border lowercase transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[0.7rem]' : 'px-3 py-1 text-sm',
        active ? 'text-[var(--card)]' : 'bg-transparent text-muted-foreground hover:text-foreground',
        className,
      )}
      style={
        active
          ? { background: tone ?? 'var(--foreground)', borderColor: tone ?? 'var(--foreground)' }
          : tone
            ? { color: tone, borderColor: `color-mix(in srgb, ${tone} 45%, transparent)` }
            : { borderColor: 'var(--border)' }
      }
    >
      {tag}
    </button>
  )
}

/**
 * A tiny two-circle Venn diagram that doubles as the tag-combine mode toggle.
 * Meant to read as a quiet detail — tap to cycle and/or/not. The circles' fill
 * encodes the mode: intersection lens (and), both circles (or), or an x (not).
 */
function VennMode({ mode, onCycle }: { mode: FilterMode; onCycle: () => void }) {
  const accent = 'var(--goldenrod)'
  return (
    <button
      type="button"
      onClick={onCycle}
      title={`${mode}: ${MODE_LABEL[mode]} — tap to change`}
      aria-label={`Tag combine mode: ${mode}. ${MODE_LABEL[mode]}. Activate to cycle.`}
      className="group inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground"
    >
      <svg viewBox="0 0 30 20" className="h-5 w-[30px]" aria-hidden="true">
        <defs>
          <clipPath id="work-venn-left">
            <circle cx="12" cy="10" r="7.5" />
          </clipPath>
        </defs>

        {mode === 'or' && (
          <g fill={accent} opacity={0.28}>
            <circle cx="12" cy="10" r="7.5" />
            <circle cx="18" cy="10" r="7.5" />
          </g>
        )}

        {mode === 'and' && (
          <g clipPath="url(#work-venn-left)">
            <circle cx="18" cy="10" r="7.5" fill={accent} opacity={0.55} />
          </g>
        )}

        {[12, 18].map((cx) => (
          <circle
            key={cx}
            cx={cx}
            cy="10"
            r="7.5"
            fill="none"
            stroke={mode === 'not' ? 'currentColor' : accent}
            strokeWidth={1.4}
            opacity={mode === 'not' ? 0.5 : 0.9}
          />
        ))}

        {mode === 'not' && (
          <g stroke={accent} strokeWidth={1.6} strokeLinecap="round">
            <line x1="12.5" y1="6.5" x2="17.5" y2="13.5" />
            <line x1="17.5" y1="6.5" x2="12.5" y2="13.5" />
          </g>
        )}
      </svg>
      {/*
        `hidden` below `sm`, not just transparent. It used to be `opacity-0`
        at every width, brightening on hover — but a phone has no hover, so
        below `sm` the word was permanently invisible *and* permanently
        occupying its width plus the flex gap. That dead space went unnoticed
        while the toolbar was left-aligned; with the row right-aligned it
        pushes the venn a word's width clear of the panel edge. `display:none`
        drops the box and collapses the gap with it, and nothing visible is
        lost — the `title` and `aria-label` carry the mode either way.
      */}
      <span className="font-brand hidden text-[0.7rem] uppercase tracking-wider transition-opacity group-hover:opacity-100 sm:inline sm:opacity-60">
        {mode}
      </span>
    </button>
  )
}

/**
 * The sort toggle: one down arrow, and `NEW`/`OLD` stacked beside it in the
 * order the results actually come out. Clicking swaps the two words.
 *
 * The arrow never changes direction — it is the reading direction of the
 * stack ("start at the top word, work down"), not a second encoding of the
 * state. Only the word order and the emphasis carry the state, so there is
 * exactly one thing to read.
 *
 * Both words are always rendered, and both are uppercase; the lower one is
 * muted. Rendering both in every state is also what keeps the control's
 * width from changing when it flips.
 */
function SortToggle({
  sort,
  onToggle,
  className,
}: {
  sort: SortMode
  onToggle: () => void
  className?: string
}) {
  const [top, bottom] = sort === 'newest' ? (['new', 'old'] as const) : (['old', 'new'] as const)
  return (
    <button
      type="button"
      onClick={onToggle}
      // The glyphs are decorative; the accessible name carries the whole
      // meaning, exactly as `TierRow` and `VennMode` do for theirs.
      aria-label={`Sort: ${SORT_LABEL[sort]}. Activate to change.`}
      className={cn(
        'font-brand inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 text-muted-foreground transition-colors hover:border-goldenrod hover:text-foreground',
        className,
      )}
    >
      <ArrowDown className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      <span
        aria-hidden="true"
        className="flex flex-col text-[0.7rem] uppercase leading-[1.15] tracking-wider"
      >
        <span className="font-bold text-foreground">{top}</span>
        <span className="text-muted-foreground">{bottom}</span>
      </span>
    </button>
  )
}

/** Clears every filter. Heads the toolbar row, which is right-aligned. */
function ResetButton({
  active,
  onClick,
  className,
}: {
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    // Held in the layout even when there's nothing to reset, rather than
    // unmounted: at narrow widths its arrival could otherwise wrap the
    // toolbar onto a second line and shove the search field down. `invisible`
    // takes it out of the a11y tree and `inert` (React 19 supports the bare
    // boolean attribute) makes doubly sure it can't be tabbed to or clicked.
    <button
      type="button"
      onClick={onClick}
      inert={!active || undefined}
      aria-hidden={!active || undefined}
      tabIndex={active ? undefined : -1}
      className={cn(
        'font-brand inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-border px-2.5 text-[0.7rem] uppercase tracking-wider text-muted-foreground transition-colors hover:border-goldenrod hover:text-foreground',
        !active && 'invisible',
        className,
      )}
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      reset
    </button>
  )
}

/** A small static pill labeling a piece — not a filter control, just a tag-styled caption. */
function TagPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'font-brand inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-[0.7rem] lowercase text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A card's bottom title line, shared by TextCard and HybridCard. */
function CardTitleRow({ title }: { title: string }) {
  return (
    <p className="mt-4 break-words font-brand text-sm lowercase tracking-wide text-muted-foreground transition-colors group-hover:text-foreground">
      {title}
    </p>
  )
}

/**
 * Text-forward pieces (poems, essays) — a quote-style preview, no image.
 * The form (poem/essay) reads as a small tag up top rather than folded
 * into the attribution line, so the title at the bottom can stay a plain
 * "— 'x'" instead of "— from the poem/essay 'x'".
 */
function TextCard({ item }: { item: WorkItem }) {
  const tone = toneFor(item)
  const excerpt = item.preview ?? item.text ?? item.description ?? ''
  return (
    <article
      className="group relative flex flex-col rounded-2xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg @max-3xs/card:p-3"
      style={{ background: `color-mix(in srgb, ${tone} 8%, var(--card))` }}
    >
      <Link href={workHref(item)} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-start gap-3">
          <Quote
            className="h-7 w-7 shrink-0 -scale-x-100"
            style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <TagPill className="ml-auto">{formFor(item)}</TagPill>
        </div>

        {/* text-lg by default, dropping to line-clamp-4 text-sm under the
            card's own column width (§9.3 of narrow-screen-columns —
            `@max-3xs/card`, 256px): `excerpt` falls back to a piece's full
            `text` when it has no hand-set `preview`, and in a narrow column
            that can tower over every image card beside it even clamped at
            the wide text size — reported directly against this build, not
            spec-driven. Keyed to the card's own width rather than the
            viewport since the column count no longer maps to one viewport
            band. */}
        <VerseBlock
          text={excerpt}
          context="card"
          className="mt-3 pl-3 text-lg text-foreground @max-3xs/card:line-clamp-4 @max-3xs/card:text-sm"
        />

        <CardTitleRow title={item.title} />
      </Link>
      {/* Status glyphs alone stay bottom-right, matching ImageCard/
          CollectionTile's badge placement — self-hides when empty. */}
      <div className="absolute bottom-3 right-3 z-20">
        <StatusRail flags={statusFlagsFor(item)} tone={tone} />
      </div>
    </article>
  )
}

/**
 * A piece that's genuinely both — text-forward work (an essay, typically)
 * written around a specific image, so it keeps TextCard's excerpt-led
 * caption pattern but leads with a short image strip instead of going
 * without one. A piece is a hybrid when it carries both `text` and `image`
 * (see `isHybrid` in lib/work.ts), not inferred from tags.
 */
function HybridCard({ item }: { item: WorkItem }) {
  const tone = toneFor(item)
  const excerpt = item.preview ?? item.text ?? item.description ?? ''
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={workHref(item)} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="aspect-[16/9] overflow-hidden" style={aspectStyleFor(item)}>
          <WorkPlaceholder item={item} />
        </div>

        <div className="p-6 @max-3xs/card:p-3" style={{ background: `color-mix(in srgb, ${tone} 8%, var(--card))` }}>
          <div className="flex items-start gap-3">
            <Quote
              className="h-7 w-7 shrink-0 -scale-x-100"
              style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <TagPill className="ml-auto">{formFor(item)}</TagPill>
          </div>

          {/* text-lg by default, line-clamp-4 text-sm under the card's own
              column width — same reasoning as TextCard's identical excerpt
              above. */}
          <VerseBlock
            text={excerpt}
            context="card"
            className="mt-3 pl-3 text-lg text-foreground @max-3xs/card:line-clamp-4 @max-3xs/card:text-sm"
          />

          <CardTitleRow title={item.title} />
        </div>
      </Link>
      {/* Status glyphs alone stay bottom-right — same pattern as TextCard. */}
      <div className="absolute bottom-3 right-3 z-20">
        <StatusRail flags={statusFlagsFor(item)} tone={tone} />
      </div>
    </article>
  )
}

/**
 * A collection's card: the fanned image stack (see CollectionStack) sits
 * directly on the page background with no card chrome of its own — each
 * image in the fan is the same size as a standalone piece's image. The
 * title lives in a separate, smaller card that only reveals on hover/focus,
 * so the images stay the thing you actually look at. The chrome is
 * `position: sticky` inside a tile-spanning wrapper (not `absolute
 * bottom-6`) — on a tall chapbook tile the flow position can be off-screen,
 * so sticky keeps it in the viewport (up to 1rem of margin) for as long as
 * any part of the tile is visible, riding up over the cover rather than
 * disappearing. Nothing between this wrapper and the scrollport may use
 * `overflow: hidden` or a `transform` — either disables sticky outright.
 */
function CollectionTile({ item }: { item: WorkCollection }) {
  const statusFlags = statusFlagsFor(item)
  // Same rule CollectionStack/ChapbookStack use internally to decide
  // whether their own count pill (CollectionMark) renders — when it does,
  // the flags fold into that pill instead of getting a second one here.
  const hasCountPill = item.pieces.length > 3
  const landscape = isLandscapeAspect(item)
  return (
    <div className="group relative">
      <Link
        href={workHref(item)}
        className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CollectionStack item={item} statusFlags={statusFlags} />
      </Link>

      {statusFlags.length > 0 && !hasCountPill && (
        <div className="absolute bottom-3 right-3 z-20">
          <StatusRail flags={statusFlags} tone={toneFor(item)} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end p-4">
        <div className="sticky bottom-4 mx-auto w-full max-w-[28rem] rounded-xl border border-border/60 bg-card/75 px-3 py-2 opacity-0 shadow-sm backdrop-blur-md transition-all duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
          <Link
            href={workHref(item)}
            className="pointer-events-auto rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* break-words: a single long/unbroken word (no space to wrap
                at) otherwise overflows this box rather than shrinking with
                it — the same §9.2 min-content bug, just outside the grid's
                own sizing since this chrome is `position: absolute`. Landscape
                covers truncate instead — see ImageCard's identical rule. */}
            <h2
              className={cn(
                'font-brand text-sm lowercase tracking-[0.08em] text-muted-foreground',
                landscape ? 'truncate' : 'break-words text-balance',
              )}
            >
              {item.title}
            </h2>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * One static, non-interactive rail pill — the gallery tile's control rail
 * echoes `CodeDemoFrame`'s real `RailButton` (components/code-demo-frame.tsx)
 * so a code demo reads as the same instrument everywhere, but a tile never
 * boots an iframe (thirty of them would be thirty rAF loops), so its rail
 * has nothing to actually run and is a plain `<span>`, not a `<button>`.
 */
function RailPill({ children }: { children: ReactNode }) {
  return (
    <span className="font-brand inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs lowercase text-muted-foreground/60">
      {children}
    </span>
  )
}

/** Wider than tall. Used to keep a long title from wrapping to a second line on a card that's short to begin with. */
function isLandscapeAspect(item: WorkItem): boolean {
  const aspect = posterAspectFor(item)
  if (!aspect) return false
  const [w, h] = aspect.split('/').map(Number)
  return w > h
}

/**
 * Visual/other standalone pieces — a tinted blank placeholder panel above
 * the metadata. Title disappears entirely at rest, leaving just the image,
 * and surfaces as a sticky chrome panel on hover/focus, matching
 * CollectionTile's idiom rather than a full-bleed gradient band — a tall
 * piece (up to ~437px at this column width) can have its bottom edge
 * off-screen mid-scroll, and a gradient band anchored to that edge shares
 * the same off-screen-on-hover failure the collection tile's chrome had.
 * The clipping that used to round the image's bottom corners moves down to
 * the image wrapper, since `overflow-hidden` on this article would disable
 * the sticky chrome entirely. An art piece's medium (oil, ink, etc.) rides
 * along in the same panel, pinned to its right edge.
 */
function ImageCard({ item }: { item: WorkItem }) {
  // Called unconditionally, ahead of the collection early-return below, so
  // hook order stays fixed regardless of which branch a given instance ends
  // up taking (isCollection(item) is stable for the lifetime of one mounted
  // ImageCard, but the rule is enforced statically).
  const lightbox = useContext(GalleryLightboxContext)
  const registerTile = useCallback(
    (node: HTMLDivElement | null) => lightbox?.registerTile(item.slug, node),
    [lightbox, item.slug],
  )

  if (isCollection(item)) {
    return <CollectionTile item={item} />
  }

  const statusFlags = statusFlagsFor(item)
  const landscape = isLandscapeAspect(item)
  // An animation's own poster + Play overlay (MediaBadges) already say what
  // this card is — the title panel is redundant chrome on top of it, so
  // it's dropped here. The medium pill stays, but reads "animation" rather
  // than the piece's own material tag (if any) — what matters on this card
  // is that it's a video, not what it was drawn with.
  const isAnimation = hasAnimation(item)
  const medium = isAnimation ? 'animation' : mediumFor(item)
  // Code demos are the one visual card excluded even when the gallery's
  // lightbox is live: their `image` is only a poster still, and the thing
  // they advertise runs on their own page.
  const opensLightbox = Boolean(lightbox) && opensInGalleryLightbox(item)
  const codeDemo = item.codeDemo

  return (
    <article className="group relative rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
      {opensLightbox ? (
        <button
          type="button"
          onClick={() => lightbox!.open(item.slug)}
          aria-label={`${item.title} — view full screen`}
          className="block w-full appearance-none rounded-lg bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Blank placeholder image — no fabricated artwork, just a tinted panel.
              Rounded to `1rem - 1px` so it sits inside the article's border
              rather than leaving a hairline of square corner outside it. */}
          <div
            ref={registerTile}
            className="aspect-[5/4] overflow-hidden rounded-[calc(1rem-1px)]"
            style={aspectStyleFor(item)}
          >
            <WorkPlaceholder item={item} />
          </div>
        </button>
      ) : (
        <Link
          href={workHref(item)}
          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* A code demo's tile is chrome, not a plain image — the same
              state rail + control rail as `CodeDemoFrame` and `PieceColumn`
              (components/code-demo-frame.tsx, components/piece-column.tsx),
              so the same piece reads as the same kind of thing everywhere.
              It's the rounded container here instead of the image alone,
              rounded to `1rem - 1px` for the same reason the plain image
              below is. Static and "paused": a tile never boots an iframe,
              so the control rail has nothing to actually run — see
              `RailPill` — and there's no "open standalone" link, since the
              whole tile already opens the piece's own page. */}
          {codeDemo ? (
            <div className="flex flex-col overflow-hidden rounded-[calc(1rem-1px)]">
              <div aria-hidden="true" className="flex items-center gap-3 border-b border-foreground/10 px-3 py-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
                <span className="font-brand text-xs lowercase text-muted-foreground">paused</span>
                <span className="font-brand min-w-0 flex-1 truncate text-center text-xs text-muted-foreground/70">
                  {entryName(codeDemo.src)}
                </span>
              </div>
              <div className="aspect-[5/4] overflow-hidden" style={aspectStyleFor(item)}>
                <WorkPlaceholder item={item} />
              </div>
              <div aria-hidden="true" className="flex items-center gap-1 border-t border-foreground/10 px-2 py-1.5">
                <RailPill>
                  <Play className="h-3.5 w-3.5" strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
                  run
                </RailPill>
                {codeDemo.seedable && (
                  <RailPill>
                    <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    reseed
                  </RailPill>
                )}
                <span className="flex-1" />
                <RailPill>
                  <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  full
                </RailPill>
              </div>
            </div>
          ) : (
            <div className="aspect-[5/4] overflow-hidden rounded-[calc(1rem-1px)]" style={aspectStyleFor(item)}>
              <WorkPlaceholder item={item} />
            </div>
          )}
        </Link>
      )}

      <MediaBadges item={item} showSpeedpaintBadge={false} />
      {statusFlags.length > 0 && (
        <div
          className={cn(
            'absolute right-3 z-20',
            // A code demo's control rail sits below the poster, in normal
            // flow — bottom-3 alone would land inside it. Mirrors the old
            // top offset for the state rail above.
            codeDemo ? 'bottom-[calc(0.75rem+2rem)]' : 'bottom-3',
          )}
        >
          <StatusRail flags={statusFlags} tone={toneFor(item)} />
        </div>
      )}
      {/* Medium pill, tried living in its own top-right hover-reveal corner
          instead of riding along in the title chrome panel at the bottom —
          pointer-events-none throughout since it's decorative text with
          nothing to click, unlike the panel below it. */}
      {medium && (
        <div
          className={cn(
            'pointer-events-none absolute right-3 z-20 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100',
            codeDemo ? 'top-[calc(0.75rem+2rem)]' : 'top-3',
          )}
        >
          {/* bg/blur override — floating loose over the image (unlike
              TagPill's other callers, which all sit on a flat card
              background already), so it needs the same backdrop treatment
              StatusRail's pill uses to stay legible over any artwork. */}
          <TagPill className="bg-background/80 backdrop-blur-sm">{medium}</TagPill>
        </div>
      )}
      {/* Duration badge, YouTube-thumbnail style — a solid dark pill with
          white text regardless of site theme, since that's the convention
          being borrowed. Bottom-right, same corner as StatusRail — fine
          today since no animation piece also carries a status flag, but the
          two would sit on top of each other if one ever does. Only renders
          when `duration` is hand-set — see WorkPiece.duration for why this
          isn't fetched automatically. */}
      {isAnimation && item.duration && (
        <span
          title={`Duration: ${item.duration}`}
          aria-label={`Duration: ${item.duration}`}
          className={cn(
            'pointer-events-none absolute right-3 z-20 rounded bg-black/75 px-1 py-0.5 font-brand text-[0.7rem] tabular-nums text-white',
            codeDemo ? 'bottom-[calc(0.75rem+2rem)]' : 'bottom-3',
          )}
        >
          {item.duration}
        </span>
      )}

      {!isAnimation && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end p-4">
          <div className="sticky bottom-4 mx-auto w-full max-w-[28rem] rounded-xl border border-border/60 bg-card/75 px-3 py-2 opacity-0 shadow-sm backdrop-blur-md transition-all duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
            <Link
              href={workHref(item)}
              className="rounded pointer-events-auto outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* Landscape cards are short to begin with — truncate
                  (instead of break-words/text-balance's wrap) so a long
                  title can't grow this panel to two lines and eat further
                  into a card that has little height to spare. Portrait/
                  square cards keep the taller wrapped title; they have the
                  height for it. */}
              <h2
                className={cn(
                  'font-brand text-sm lowercase tracking-[0.08em] text-muted-foreground',
                  landscape ? 'truncate' : 'break-words text-balance',
                )}
              >
                {item.title}
              </h2>
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}

function WorkCard({ item }: { item: WorkItem }) {
  if (isHybrid(item)) return <HybridCard item={item} />
  return isTextForward(item) ? <TextCard item={item} /> : <ImageCard item={item} />
}

/** An unlabeled row of chips in the filter panel. */
function TagRow({
  tags,
  selectedTags,
  onToggleTag,
  chipTone,
  chipClassName,
  before,
  after,
  className,
  bare,
}: {
  tags: readonly string[]
  selectedTags: Set<string>
  onToggleTag: (tag: string) => void
  chipTone?: (tag: string) => string | undefined
  /** Per-chip class override — used to CSS-hide specific chips (e.g. the
   *  mobile "collapse unselected universal tags" treatment) without
   *  changing which tags are in the array, so a ghost mirroring this row
   *  can apply the exact same function and stay in sync automatically. */
  chipClassName?: (tag: string) => string | undefined
  /** A leading, non-tag element in the same flex-wrap flow as the chips —
   *  e.g. the inline search pill that heads the discipline row. */
  before?: ReactNode
  /** An extra, non-tag element in the same flex-wrap flow as the chips —
   *  e.g. a trailing "more tags" affordance that should wrap naturally
   *  alongside them rather than sit outside the row. */
  after?: ReactNode
  className?: string
  /** Skip the wrapping flex div and return the chips as a fragment instead,
   *  so a caller that needs several tag groups (plus other controls) to
   *  co-wrap in one shared flex-wrap container can supply that container
   *  itself — used by the docked bar's compact row. */
  bare?: boolean
}) {
  const content = (
    <>
      {before}
      {tags.map((tag) => (
        <TagChip
          key={tag}
          tag={tag}
          tone={chipTone?.(tag)}
          active={selectedTags.has(tag)}
          onClick={() => onToggleTag(tag)}
          className={chipClassName?.(tag)}
        />
      ))}
      {after}
    </>
  )
  if (bare) return content
  return <div className={cn('flex flex-wrap items-center gap-1.5', className)}>{content}</div>
}

/**
 * The glyph and accessible name for each tier's toggle. `general` has no
 * badge of its own on a card (§2.2 — the unmarked default is silent), so it
 * gets a plain circle: neutral by construction, and the one shape that
 * can't be read as a rank. `favorite` and `archive` reuse the exact icons
 * their card badges use, so the control inherits a vocabulary the cards
 * already taught rather than inventing a second one.
 */
const TIER_CONTROL: Record<WorkTier, { Icon: ComponentType<SVGProps<SVGSVGElement>>; label: string }> = {
  favorite: { Icon: HeartIcon, label: 'favorites' },
  general: { Icon: Circle, label: 'general' },
  archive: { Icon: Archive, label: 'archive' },
}

/**
 * Which shelves the gallery is drawing from — one independent toggle per
 * tier, symbols only. Deliberately its own control rather than three more
 * chips in `TagRow`: a tag says what a piece is *about*, a tier says where
 * it *sits*, and the Venn's and/or/not applies only to the former. Folding
 * them together would make "not archive" and "and archive" ask questions
 * the two axes don't share an answer to.
 *
 * Wordless by request, so the accessible name carries the whole label
 * (`title` + `aria-label`, the same treatment `StatusRail`'s icons use for
 * their own glyphs). Grouped inside one bordered shell so three loose glyphs
 * read as a single control.
 */
// Shared by both of TierRow's layers (the blob and the real buttons) so
// their boxes stay pixel-identical — same idiom as MAX_DISCIPLINE_CHIPS:
// deriving one source rather than keeping two class strings in sync by hand.
const TIER_BUTTON_BOX = 'flex h-6 w-6 items-center justify-center rounded-full'

/**
 * Two stacked copies of the same three-item row: an invisible blur+contrast
 * "goo" layer behind carrying only fill color, and the real buttons on top,
 * transparent, carrying the icons and all interactivity. `feGaussianBlur`
 * softens each filled circle into its neighbor when they're close enough to
 * overlap, and the steep `feColorMatrix` contrast snaps every blurred edge
 * back to fully opaque or fully transparent — so two *adjacent* selected
 * tiers fuse into one continuous shape instead of two circles with a gap
 * between them, while an isolated selection still reads as a plain circle
 * (nothing nearby to fuse with). `favorite`/`archive` fusing with `general`
 * between them is what "adjacent" means here — there's no case where the
 * two ends fuse without it.
 *
 * A single instance is safe: `id="tier-goo"` collides if `TierRow` ever
 * renders twice on one page, which it doesn't today (one gallery, one
 * toolbar) — same fixed-id precedent as `VennMode`'s `work-venn-left`
 * clipPath just above.
 */
function TierGoo() {
  return (
    <svg aria-hidden="true" className="absolute h-0 w-0">
      <filter id="tier-goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -10" />
      </filter>
    </svg>
  )
}

function TierRow({
  tiers,
  onToggleTier,
  className,
}: {
  tiers: Set<WorkTier>
  onToggleTier: (tier: WorkTier) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Which work to show"
      // `h-8` is redundant with what p-0.5 + h-6 buttons already compute
      // to — stated anyway so a future padding change here can't silently
      // break the toolbar row's optical alignment. `relative` makes this
      // the goo layer's containing block.
      className={cn(
        'relative inline-flex h-8 items-center rounded-full border border-border p-0.5',
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0.5 flex items-center" style={{ filter: 'url(#tier-goo)' }}>
        {WORK_TIERS.map((tier) => (
          <div key={tier} className={cn(TIER_BUTTON_BOX, tiers.has(tier) ? 'bg-goldenrod' : 'bg-transparent')} />
        ))}
      </div>
      {WORK_TIERS.map((tier) => {
        const { Icon, label } = TIER_CONTROL[tier]
        const on = tiers.has(tier)
        return (
          <button
            key={tier}
            type="button"
            onClick={() => onToggleTier(tier)}
            aria-pressed={on}
            title={label}
            aria-label={label}
            // On/off is solid-icon-on-goo against a bare glyph — the goo
            // layer behind carries the "selected" fill now, so the button
            // itself only ever changes icon color. Deliberately not a
            // filled-vs-outline *glyph*: `HeartIcon` and `Circle` fill into
            // legible solids but `Archive` is a container shape, and filling
            // it turns the box into an unreadable blob.
            //
            // `relative` (z-index: auto, same as the goo layer) plus coming
            // later in the DOM is what paints these above the goo layer —
            // both are "positioned" elements, and among those, tree order
            // decides. See TierGoo's doc comment for the filter itself.
            className={cn(
              TIER_BUTTON_BOX,
              'relative cursor-pointer transition-colors',
              on ? 'text-[var(--card)]' : 'text-muted-foreground/50 hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )
      })}
      <TierGoo />
    </div>
  )
}

// The chip row's height reservation renders a real `TagRow` it never
// interacts with. Module-level so neither identity changes between renders.
const EMPTY_TAG_SET: Set<string> = new Set()
const noop = () => {}

/**
 * Everything the filter controls need, passed as one object so multiple call
 * sites can mount the same controls without a fifteen-prop signature. Every
 * field is computed once in `WorkGallery`; nothing here is derived again.
 */
type FilterControls = {
  queryInput: string
  setQueryInput: (value: string) => void
  selectedTags: Set<string>
  toggleTag: (tag: string) => void
  subtagTone: Map<string, string>
  disciplineChips: string[]
  universalChips: string[]
  tiers: Set<WorkTier>
  toggleTier: (tier: WorkTier) => void
  sort: SortMode
  cycleSort: () => void
  mode: FilterMode
  cycleMode: () => void
  reset: () => void
  activeCount: number
}

/**
 * The search control: an icon-only pill that heads the discipline chip row
 * (and the docked bar's compact row), rather than a separate full-width bar.
 * Collapsed, it's a plain 32px circle matching the toolbar controls' height;
 * focusing it expands to a 240px input, animated over the container's own
 * width so the chips beside it reflow rather than jump. `expanded` is driven
 * entirely by focus-or-has-a-value — no separate click handler — so the
 * stated collapse rule ("empty on blur collapses, a query stays expanded")
 * falls out of that derivation for free rather than needing its own effect.
 *
 * The input itself never resizes: it's laid out at its full 240px width
 * inside an `overflow-hidden` wrapper that animates instead, with the search
 * icon absolutely positioned on top so it stays put (and visible) through
 * the transition. Pulled out of the panel so the in-flow row and the docked
 * bar's compact row can each mount their own without drifting apart — both
 * read and write the same `queryInput` state, so there is still exactly one
 * debounce effect and typing in either updates both.
 */
function InlineSearch({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (value: string) => void
  /** Distinct per mount, so a screen reader moving between the two can tell
   *  which one it landed on. */
  label: string
}) {
  const [focused, setFocused] = useState(false)
  const expanded = focused || value.length > 0
  return (
    <div
      className={cn(
        'relative h-8 shrink-0 rounded-full border border-border bg-card transition-[width] duration-200 ease-out focus-within:border-goldenrod',
        expanded ? 'w-60' : 'w-8',
      )}
    >
      <Search
        className="pointer-events-none absolute left-[7px] top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      {/* `w-full`, not a fixed width: the input's own box tracks the
          wrapper's animated width every frame (percentage sizing recomputes
          continuously during a CSS transition), so it's never wider than
          what's visible — a fixed-width input clipped by `overflow-hidden`
          measured correctly on screen but left its real layout box 208px
          wider than the visible circle while collapsed, which is invisible
          to a pointer but broke hit-testing/tooling that reads the actual
          box. The native WebKit cancel button is suppressed since it would
          otherwise render as a second "×" beside the custom clear button
          below.

          Only the *right* padding is conditional on `expanded` — `pl-7`
          stays on permanently, both to keep the placeholder text tucked
          behind the icon rather than peeking out from under it at 0
          left-padding, and because 28px alone is well under the collapsed
          box's 32px width, so it never trips the padding-exceeds-width
          problem below. `pr-7` can't stay on the same way: 28px+28px is
          *more* than 32px, and Chromium refuses to shrink an `<input>`
          below what its own padding needs — with both paddings always on,
          it silently ignored `w-full` and rendered at the padding sum
          (56px) regardless of the wrapper's actual size. Collapsed, `value`
          is always empty (that's what "collapsed" means here), so there's
          no clear button to leave room for on the right — zero right
          padding is correct, not just convenient. */}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="search…"
        aria-label={label}
        className={cn(
          'font-brand h-full w-full appearance-none bg-transparent pl-7 text-sm lowercase text-foreground outline-none transition-[padding] duration-200 ease-out placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none',
          expanded ? 'pr-7' : 'pr-0',
        )}
      />
      {expanded && value && (
        <button
          type="button"
          // Keeps focus on the input through the click, so clearing doesn't
          // blur-and-collapse the box out from under the pointer mid-click.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

/**
 * Reset / tiers / sort / venn — right-aligned to this content's inner edge,
 * the same edge the search pill's clear button sits on. All four controls
 * are exactly h-8 so the row is optically even.
 *
 * `reset` goes first, not last. Against a right edge the *trailing* control
 * is the one flush to it, and reset is the only one of the four that isn't
 * always live — trailing it would leave the visible cluster floating a
 * button's width short of the edge whenever there's nothing to reset. At the
 * head of the cluster its reserved box eats left-hand space that was empty
 * anyway, so tiers/sort/venn stay pinned to the edge in both states. It
 * still occupies that box when inactive rather than unmounting, so the wrap
 * point doesn't move with `activeCount` either.
 *
 * Pulled out of `FilterPanelContent` so the docked bar's expansion — which
 * no longer mounts that whole component — can render the same row on its
 * own, alongside the universal chip row, without duplicating this JSX.
 */
function ToolbarRow({ controls, className }: { controls: FilterControls; className?: string }) {
  const { activeCount, reset, tiers, toggleTier, sort, cycleSort, mode, cycleMode } = controls
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-3', className)}>
      <ResetButton active={activeCount > 0} onClick={reset} />
      <TierRow tiers={tiers} onToggleTier={toggleTier} />
      <SortToggle sort={sort} onToggle={cycleSort} />
      <VennMode mode={mode} onCycle={cycleMode} />
    </div>
  )
}

/**
 * The panel's interior — toolbar row, then the two chip rows — with no
 * border/fill/padding of its own, so the in-flow panel can wrap it in its
 * own shell while `FilterPanelContent` owns the row-to-row rhythm
 * (`space-y-3 sm:space-y-4`). Lifted out of `WorkGallery` verbatim; every
 * comment about the h-8 row and the chip-block reservation moves with it
 * unchanged.
 *
 * Search is no longer a row of its own — it's `InlineSearch`, the leading
 * chip in the discipline row (see the `before` prop below), collapsed to an
 * icon by default and expanding in place. The docked bar builds its own
 * compact row out of the same pieces (`InlineSearch`, `TagRow`) rather than
 * mounting this component, since its collapsed state needs only the search
 * pill and the discipline chips, not the toolbar or the universal row —
 * this component stays the in-flow panel's alone.
 */
function FilterPanelContent({
  controls,
  onChipSlackChange,
}: {
  controls: FilterControls
  /** Reports the *outside* half of this mount's chip-block reservation (see
   *  below) to the caller. */
  onChipSlackChange?: (outsideSlack: number) => void
}): ReactNode {
  const { queryInput, setQueryInput, selectedTags, toggleTag, subtagTone, disciplineChips, universalChips } =
    controls

  // The chip block's height reservation. Two unlabeled chip rows —
  // disciplines (+ their subtags) above, universal tags below — sized to
  // their own real content (`chipRealRef`, normal flow — this is what the
  // wrapping panel's border hugs).
  //
  // Toggling a discipline must never shift whatever comes after this
  // mount, so the widest-possible state (every discipline selected, every
  // subtag showing) is measured via an inert `chipGhostRef` ghost — that
  // ghost is `absolute`, so it's out of flow and can't inflate this block.
  // `chipSlack`, the gap between its height and the real content's, splits
  // in half: `chipSlackInside` renders here as this mount's own trailing
  // padding (so a wrapping border doesn't cut off flush against the last
  // chip); the other half is reported to `onChipSlackChange`, for a caller
  // that wants it spent as margin *outside* its own shell instead of blank
  // room inside it — reserving the whole thing as blank room inside a
  // border read as a stray empty row of chips at most widths with 0–1
  // disciplines selected, which is the common case.
  //
  // It holds only while active and inactive `TagChip`s are the same size —
  // they share every box class today and differ only in colour. If that
  // ever stops being true, the measurement stops being a faithful upper
  // bound.
  const chipRealRef = useRef<HTMLDivElement>(null)
  const chipGhostRef = useRef<HTMLDivElement>(null)
  const [chipSlack, setChipSlack] = useState(0)
  // `useLayoutEffect`, not `useEffect`, so it settles before the browser's
  // first paint of this block — every mount of this component only ever
  // exists client-side (`WorkGallery` is `'use client'`, and either renders
  // behind a bare-placeholder `<Suspense>` or, for the docked expansion,
  // only mounts once `open` is already true), so there is no
  // server-rendered version of this content to flash before the measurement
  // corrects it.
  useLayoutEffect(() => {
    const measure = () => {
      const realH = chipRealRef.current?.getBoundingClientRect().height ?? 0
      const ghostH = chipGhostRef.current?.getBoundingClientRect().height ?? 0
      setChipSlack((prev) => {
        const next = Math.max(0, ghostH - realH)
        return prev === next ? prev : next
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (chipRealRef.current) ro.observe(chipRealRef.current)
    if (chipGhostRef.current) ro.observe(chipGhostRef.current)
    return () => ro.disconnect()
  }, [])
  // Rounding the inside half and letting the outside half absorb the
  // remainder keeps the two exactly summing to `chipSlack` regardless of
  // odd-pixel measurements, so the zero-shift guarantee (the *total*
  // reserved height) never drifts by a stray half-pixel.
  const chipSlackInside = Math.round(chipSlack / 2)
  const chipSlackOutside = chipSlack - chipSlackInside
  useEffect(() => {
    onChipSlackChange?.(chipSlackOutside)
  }, [chipSlackOutside, onChipSlackChange])

  // Below `sm`, the universal row collapses to just the selected tags plus
  // a "more tags" affordance, so the panel takes less of the fold on a
  // phone and the masonry starts sooner. `sm:` and up always show the full
  // row regardless of this state — `universalChipClassName` only hides a
  // chip below that breakpoint (`sm:inline-flex` wins it back), so there's
  // no JS viewport check anywhere here; the collapse simply has no visible
  // effect once the CSS breakpoint takes over.
  //
  // Expanding is a peek, not a commitment: the moment the reader scrolls —
  // either direction, they're reading rather than still filtering — it
  // collapses back to the same selected-plus-more state rather than staying
  // open indefinitely. A selected tag is never hidden regardless of expand
  // state, so an active filter stays visible and removable throughout.
  const [universalExpanded, setUniversalExpanded] = useState(false)
  useEffect(() => {
    if (!universalExpanded) return
    const startY = window.scrollY
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 24) setUniversalExpanded(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [universalExpanded])

  const hiddenUniversalCount = universalChips.filter((t) => !selectedTags.has(t)).length
  const universalChipClassName = (tag: string) =>
    selectedTags.has(tag) || universalExpanded ? undefined : 'hidden sm:inline-flex'
  // Rendered identically in the real row and its ghost (see below), under
  // the exact same condition, so the ghost's measured height always matches
  // whether or not this is showing — no separate reservation needed for it.
  const moreTagsButton =
    !universalExpanded && hiddenUniversalCount > 0 ? (
      <button
        type="button"
        onClick={() => setUniversalExpanded(true)}
        className="font-brand inline-flex cursor-pointer items-center gap-1 rounded-full border border-border px-3 py-1 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground sm:hidden"
      >
        more tags
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    ) : null

  return (
    <div className="space-y-3 sm:space-y-4">
      <ToolbarRow controls={controls} />

      {/*
        Two unlabeled chip rows, gapped tighter than this content's own
        rhythm so they read as one block. Row 1 leads with `InlineSearch` —
        expanding it reflows/wraps the discipline chips beside it, which is a
        self-caused shift (the reader just clicked into the row being
        resized) rather than the discipline-toggle shift the reservation
        below guards against, so the ghost's leading placeholder stays fixed
        at the collapsed width regardless of the real search's state — same
        precedent as the mobile "more tags" affordance in row 2.
      */}
      <div className="relative">
        <div ref={chipRealRef} className="flex flex-col gap-1.5">
          <TagRow
            tags={disciplineChips}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            chipTone={(tag) => subtagTone.get(tag)}
            before={<InlineSearch value={queryInput} onChange={setQueryInput} label="Search all work" />}
          />
          {/* `chipTone` deliberately not passed: universal tags are
              neutral, and `subtagTone` only ever holds discipline subtags. */}
          <TagRow
            tags={universalChips}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            chipClassName={universalChipClassName}
            after={moreTagsButton}
          />
        </div>
        {/* Measurement only — `absolute` takes it out of flow, so it can't
            affect `chipRealRef`'s height or this content's own. Same
            horizontal extent as the real content (`inset-x-0`), so it wraps
            at exactly the same width.

            Row 2's ghost passes the *real* `selectedTags`, `chipClassName`,
            and `after` — unlike row 1's, which stays at its hardcoded
            absolute worst case regardless of selection. Row 2 has no
            "worst case wider than what's currently possible": mirroring
            exactly what the real row 2 shows, collapsed or not, is already
            its own maximum, the same property §2.5 originally relied on
            when the row couldn't change shape at all. */}
        <div
          ref={chipGhostRef}
          inert
          aria-hidden="true"
          className="invisible absolute inset-x-0 top-0 flex flex-col gap-1.5"
        >
          <TagRow
            tags={MAX_DISCIPLINE_CHIPS}
            selectedTags={EMPTY_TAG_SET}
            onToggleTag={noop}
            before={<div className="h-8 w-8 shrink-0" />}
          />
          <TagRow
            tags={universalChips}
            selectedTags={selectedTags}
            onToggleTag={noop}
            chipClassName={universalChipClassName}
            after={moreTagsButton}
          />
        </div>
      </div>
      {/* The inside half of the reservation — see the comment above. Zero on
          every render where the real content already matches the
          widest-possible state (e.g. all 3 disciplines selected). */}
      <div aria-hidden="true" style={{ height: chipSlackInside }} />
    </div>
  )
}

// Fallback only — matches the `var(--nav-h, 4rem)` fallback already used
// everywhere else this custom property is read, for whatever instant the
// property hasn't been published yet (see `site-nav.tsx`).
const DEFAULT_NAV_H = 64

/**
 * How revealed the docked bar should be, as a continuous 0–1 rather than a
 * boolean: 0 while any part of `ref`'s element (the in-flow panel) is still
 * visibly above the nav's bottom edge, ramping up to 1 over the next `range`
 * pixels of further scroll, and back down the same way on the way back up.
 *
 * The threshold is `el.bottom <= navH`, not `el.bottom <= 0` — the nav is
 * `position: sticky`, so the panel is already hidden behind it well before
 * its bottom edge would cross the actual viewport top. Triggering off the
 * viewport instead of the nav left a dead zone where the panel had already
 * disappeared but the bar hadn't started appearing yet. `--nav-h` is read
 * fresh on every measurement rather than cached once, since the nav's own
 * height isn't constant (it wraps to two lines below ~363px).
 *
 * A plain rAF-throttled scroll listener rather than `IntersectionObserver`:
 * a boolean observer can only ever report "in or out" against the viewport
 * specifically, but a continuous reveal against an arbitrary (and moving)
 * threshold needs the actual distance past it on every frame, which means
 * reading `getBoundingClientRect()` ourselves. Also listens for resize (the
 * viewport, or `--nav-h` changing the layout above the fold) and a
 * `ResizeObserver` on the panel itself (its own height can change — e.g.
 * the mobile "more tags" expansion — without any scroll happening at all,
 * which a scroll-only listener would otherwise miss).
 *
 * Collapses `range` to a single pixel under `prefers-reduced-motion`, so
 * the reveal is still driven by the same code path but reads as an instant
 * step rather than a scroll-tied animation — the sort of motion most likely
 * to bother someone who's asked for less of it.
 */
function useDockedReveal(ref: RefObject<HTMLElement | null>, range = 64): number {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const effectiveRange = reducedMotion ? 1 : range
    let frame = 0
    const measure = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const navH =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) ||
        DEFAULT_NAV_H
      const bottom = el.getBoundingClientRect().bottom
      const next = Math.min(1, Math.max(0, (navH - bottom) / effectiveRange))
      setProgress((prev) => (prev === next ? prev : next))
    }
    const onScrollOrResize = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    const ro = new ResizeObserver(onScrollOrResize)
    if (ref.current) ro.observe(ref.current)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      ro.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref, range])
  return progress
}

/** e.g. "Filters, 3 tags selected. Activate to open." */
function dockedGlyphLabel({ selectedTags, activeCount }: FilterControls): string {
  if (selectedTags.size > 0) {
    const n = selectedTags.size
    return `Filters, ${n} ${n === 1 ? 'tag' : 'tags'} selected. Activate to open.`
  }
  return activeCount > 0 ? 'Filters, active. Activate to open.' : 'Filters. Activate to open.'
}

/**
 * The slim bar that docks directly beneath the site nav once the in-flow
 * panel has scrolled out of view. Its always-visible compact row mirrors the
 * in-flow panel's own row 1: the search pill first, then discipline chips
 * (with active subtags), then — collapsed only — any selected universal tags
 * that wouldn't otherwise be visible, so an active filter stays removable
 * without opening anything. A trailing glyph, badged with the selected tag
 * count, expands the rest — the toolbar and the full universal row — in
 * place, without losing scroll position.
 *
 * Built from the same pieces (`InlineSearch`, `TagRow`, `ToolbarRow`) rather
 * than mounting `FilterPanelContent` wholesale: that component's chip block
 * is a single reservation across both rows, sized for the in-flow panel's
 * zero-shift guarantee, and this bar has no such guarantee to keep — it's
 * `position: fixed`, so a discipline toggle growing its compact row just
 * grows the bar itself and never pushes page content.
 *
 * Non-modal disclosure, not a dialog: no focus trap, no scroll lock, no
 * scrim. The grid behind stays scrollable and clickable; the bar's own
 * translucent-blurred fill is what dims and blurs whatever sits directly
 * behind the expansion — the visual effect of a scrim, without the
 * semantics of one.
 *
 * `progress` (0–1, from `useDockedReveal`) drives the slide/fade directly as
 * inline style rather than toggling a Tailwind class pair — the reveal
 * tracks scroll position continuously, not a boolean, so there's no fixed
 * "revealed" state to hang a CSS transition class off. The short
 * `transition-[transform,opacity]` in the className is only there to smooth
 * over the gaps *between* scroll/rAF ticks (a chunky mouse-wheel can jump in
 * coarser steps than a touch/trackpad scroll) — it's a polish layer on top
 * of the scroll-driven motion, not the thing driving it.
 */
// Matched to the expansion's own `duration-150` class below — see the
// `mounted`/`entered` state inside the component for why the two have to
// agree.
const EXPANSION_TRANSITION_MS = 150

function DockedFilterBar({
  controls,
  progress,
  open,
  onOpenChange,
}: {
  controls: FilterControls
  progress: number
  open: boolean
  onOpenChange: (open: boolean) => void
}): ReactNode {
  const barRef = useRef<HTMLDivElement>(null)
  const glyphRef = useRef<HTMLButtonElement>(null)
  const expansionRef = useRef<HTMLDivElement>(null)
  // Same threshold `useDockedReveal` uses as its own 0-point (`el.bottom <=
  // 0`) — everything that isn't the visual slide/fade itself (a11y tree
  // membership, tab order, closing the expansion when the panel scrolls
  // back into view) still wants a boolean, not a float.
  const revealed = progress > 0

  // Selected universal tags — the only tags row 1 doesn't already show
  // (discipline selections are already visible as active chips in
  // `disciplineChips`). Only rendered while collapsed: once the expansion is
  // open, the full universal row below already carries this same
  // information, and showing both would just be the same chips twice.
  const activeUniversalTags = controls.universalChips.filter((t) => controls.selectedTags.has(t))

  // The expansion fades/slides in and out rather than popping, matching the
  // compact bar's own scroll-driven fade — but it can't just toggle opacity
  // on an always-mounted element the way the bar does: this content sits in
  // normal flow (below the compact row), so an always-mounted copy would
  // hold its full height at all times, leaving a permanent dead gap under
  // the bar whenever it's "closed." So it's mounted only across the
  // transition (`mounted`) and driven to its entered state a frame later
  // (`entered`), the standard hand-rolled enter/exit pattern: paint the
  // closed frame first, *then* flip to the open state so the browser has
  // something to transition from, rather than snapping straight to it.
  // `EXPANSION_TRANSITION_MS` has to match the CSS transition duration
  // below, since nothing else tells this effect when the animation is
  // actually done. Collapsed to 0 under `prefers-reduced-motion`, so a
  // closed panel is removed immediately rather than lingering, invisible,
  // for a duration whose CSS transition never runs.
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(open)
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (open) {
      setMounted(true)
      // Double rAF, not one: a single `requestAnimationFrame` after
      // `setMounted(true)` isn't a reliable enough delay — React can (and,
      // measured live, reliably did) commit *both* the mount and the
      // `setEntered(true)` that follows before the browser's next actual
      // paint, so the closed frame never painted and the "transition"
      // silently snapped straight to open. Waiting for a first rAF (queued
      // for the frame after the mount commits) and then scheduling the real
      // flip from *inside* that callback (for the frame after that) forces
      // a genuine paint of the closed state in between — the standard
      // workaround for this exact gap.
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setEntered(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }
    setEntered(false)
    const timeout = setTimeout(() => setMounted(false), reducedMotion ? 0 : EXPANSION_TRANSITION_MS)
    return () => clearTimeout(timeout)
  }, [open])

  // Move focus into the expansion once it's actually mounted and entered —
  // not just once `open` flips true, which happens a render (and, for
  // `entered`, a frame) before the element exists to focus.
  useEffect(() => {
    if (entered) expansionRef.current?.focus()
  }, [entered])

  // Escape closes and returns focus to the glyph. A pointerdown outside the
  // bar closes without redirecting focus — whatever was clicked already
  // gets it, which is the browser's own default and correct here. Attached
  // only while open, and on `pointerdown` rather than `click`, so a drag
  // that starts inside the bar and ends outside it doesn't close things
  // mid-drag.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onOpenChange(false)
      glyphRef.current?.focus()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) onOpenChange(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, onOpenChange])

  return (
    <div
      ref={barRef}
      // z-40, deliberately under both the nav (z-50) and the gallery
      // lightbox (`image-lightbox.tsx`'s two `z-50` layers), so a bar that
      // happened to be revealed when a lightbox opened sits behind the
      // overlay rather than punching through it.
      //
      // Same translucent-blurred treatment as the nav (`site-nav.tsx`),
      // which is what makes this read as an extension of the header rather
      // than a floating widget. Unlike the in-flow panel it must have a
      // fill: it overlays the masonry, so there is no discipline wash to
      // let through here, only cards to cover.
      className={cn(
        'fixed inset-x-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md',
        'transition-[transform,opacity] duration-75 ease-out motion-reduce:transition-none',
        // Held in the DOM rather than unmounted so it can animate, but taken
        // out of the a11y tree and out of the tab order while retracted —
        // the same treatment `ResetButton` gets, for the same reason.
        !revealed && 'invisible',
      )}
      style={{ top: 'var(--nav-h, 4rem)', transform: `translateY(${(progress - 1) * 100}%)`, opacity: progress }}
      inert={!revealed || undefined}
    >
      <div className="mx-auto max-w-6xl px-3 py-2 xs:px-5 sm:px-8">
        {/* Compact row: search pill, then disciplines, then (collapsed only)
            any selected universal tags — the glyph trails via `ml-auto`,
            which resolves per flex line, so it stays pinned to the right
            edge even once the row has wrapped to two or three lines. */}
        <div className="flex flex-wrap items-center gap-1.5">
          <TagRow
            bare
            tags={controls.disciplineChips}
            selectedTags={controls.selectedTags}
            onToggleTag={controls.toggleTag}
            chipTone={(tag) => controls.subtagTone.get(tag)}
            before={
              <InlineSearch
                value={controls.queryInput}
                onChange={controls.setQueryInput}
                label="Search all work (docked)"
              />
            }
          />
          {!open && activeUniversalTags.length > 0 && (
            <TagRow bare tags={activeUniversalTags} selectedTags={controls.selectedTags} onToggleTag={controls.toggleTag} />
          )}
          <button
            ref={glyphRef}
            type="button"
            onClick={() => onOpenChange(!open)}
            aria-expanded={open}
            aria-controls="docked-filter-panel"
            aria-label={dockedGlyphLabel(controls)}
            className={cn(
              'relative ml-auto inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors',
              // Goldenrod whenever anything at all is narrowing the view,
              // not just when tags are selected: the badge counts tags
              // only, so a non-default tier selection or an active query
              // would otherwise leave no trace here. Reuses the panel's own
              // active idiom rather than inventing a second one.
              controls.activeCount > 0
                ? 'border-goldenrod text-goldenrod'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {controls.selectedTags.size > 0 && (
              <span
                aria-hidden="true"
                className="font-brand absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-goldenrod px-1 text-[0.6rem] font-bold text-[var(--card)]"
              >
                {controls.selectedTags.size}
              </span>
            )}
          </button>
        </div>
        {mounted && (
          <div
            id="docked-filter-panel"
            ref={expansionRef}
            tabIndex={-1}
            // Capped and scrollable: with every discipline open at phone
            // widths the compact row alone can run several lines, and the
            // toolbar wraps too — unbounded, the expansion would run off the
            // bottom of the screen with no way to reach the last row.
            // `100dvh`, not `100vh`, so mobile browser chrome collapsing
            // doesn't leave the last chip row unreachable.
            //
            // `entered` (not `open`) drives the fade/slide — see the state
            // above for why they're briefly out of sync across a mount.
            // `duration-150` has to match `EXPANSION_TRANSITION_MS`.
            className={cn(
              'mt-2 max-h-[calc(100dvh-var(--nav-h,4rem)-7rem)] space-y-3 overflow-y-auto outline-none',
              // `translate`, not `transform`: Tailwind's `translate-y-*`
              // utilities animate the native CSS `translate` property, and
              // listing `transform` here (which nothing actually sets)
              // silently transitioned nothing but opacity — caught by
              // sampling `getComputedStyle` mid-transition, not by eye.
              'transition-[opacity,translate] duration-150 ease-out motion-reduce:transition-none',
              entered ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
            )}
          >
            <ToolbarRow controls={controls} />
            {/* The full universal row — row 1 (disciplines + search) is
                already showing above, in the always-visible compact row. */}
            <TagRow tags={controls.universalChips} selectedTags={controls.selectedTags} onToggleTag={controls.toggleTag} />
          </div>
        )}
      </div>
    </div>
  )
}

export function WorkGallery() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // URL is the source of truth so refresh + back/forward always restore state.
  const urlQuery = searchParams.get('q') ?? ''
  const selectedTags = useMemo(
    () =>
      new Set(
        (searchParams.get('tags')?.split(',').filter(Boolean) ?? []).filter((t) =>
          ALL_TAGS.includes(t),
        ),
      ),
    [searchParams],
  )
  const mode = useMemo<FilterMode>(() => {
    const m = searchParams.get('mode')
    return FILTER_MODES.includes(m as FilterMode) ? (m as FilterMode) : 'and'
  }, [searchParams])
  const sort = useMemo<SortMode>(() => {
    const s = searchParams.get('sort')
    return SORT_MODES.includes(s as SortMode) ? (s as SortMode) : 'newest'
  }, [searchParams])
  // Absent means `DEFAULT_TIERS`. An explicit empty list is legal and means
  // exactly what it says — every shelf switched off, so nothing matches —
  // which is why this checks for the param's presence rather than treating
  // an empty result as "unset".
  const tiers = useMemo<Set<WorkTier>>(() => {
    const raw = searchParams.get('tiers')
    if (raw === null) return new Set(DEFAULT_TIERS)
    return new Set(raw.split(',').filter((t): t is WorkTier => WORK_TIERS.includes(t as WorkTier)))
  }, [searchParams])

  // Local mirror of the search box for instant typing feedback.
  const [queryInput, setQueryInput] = useState(urlQuery)
  useEffect(() => {
    setQueryInput(urlQuery)
  }, [urlQuery])

  const commit = useCallback(
    (
      changes: {
        q?: string | null
        tags?: string[] | null
        mode?: FilterMode | null
        sort?: SortMode | null
        view?: string | null
        tiers?: WorkTier[] | null
      },
      historyMode: 'push' | 'replace',
    ) => {
      const sp = new URLSearchParams(Array.from(searchParams.entries()))
      if ('q' in changes) {
        if (changes.q) sp.set('q', changes.q)
        else sp.delete('q')
      }
      if ('tags' in changes) {
        if (changes.tags && changes.tags.length) sp.set('tags', changes.tags.join(','))
        else sp.delete('tags')
      }
      if ('mode' in changes) {
        // 'and' is the default, so it stays out of the URL for clean links.
        if (changes.mode && changes.mode !== 'and') sp.set('mode', changes.mode)
        else sp.delete('mode')
      }
      if ('sort' in changes) {
        // 'newest' is the default, so it stays out of the URL for clean links.
        if (changes.sort && changes.sort !== 'newest') sp.set('sort', changes.sort)
        else sp.delete('sort')
      }
      // No default to omit: `view` is simply present or absent.
      if ('view' in changes) {
        if (changes.view) sp.set('view', changes.view)
        else sp.delete('view')
      }
      // `DEFAULT_TIERS` is the default, so it stays out of the URL for clean
      // links. Compared as a set, not a joined string, so the param is
      // omitted whatever order the toggles were clicked in. An explicit
      // empty selection has to survive as `tiers=`, since dropping the param
      // would silently restore the default instead of showing nothing.
      if ('tiers' in changes) {
        const next = changes.tiers
        const isDefault =
          next !== null &&
          next !== undefined &&
          next.length === DEFAULT_TIERS.length &&
          next.every((t) => DEFAULT_TIERS.includes(t))
        // `[].join(',')` is `''`, which round-trips as `?tiers=` — present
        // but empty, which is the distinction this needs to preserve.
        if (next && !isDefault) sp.set('tiers', next.join(','))
        else sp.delete('tiers')
      }
      const qs = sp.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      startTransition(() => {
        if (historyMode === 'push') router.push(url, { scroll: false })
        else router.replace(url, { scroll: false })
      })
    },
    [searchParams, pathname, router],
  )

  // Debounce search typing into the URL (replace, so we don't spam history).
  useEffect(() => {
    const t = setTimeout(() => {
      if (queryInput !== urlQuery) commit({ q: queryInput }, 'replace')
    }, 250)
    return () => clearTimeout(t)
  }, [queryInput, urlQuery, commit])

  const toggleTag = useCallback(
    (tag: string) => {
      const next = new Set(selectedTags)
      if (next.has(tag)) {
        next.delete(tag)
        // Turning a discipline off also retires its discipline-only filters,
        // so nothing keeps filtering from a panel you can no longer see.
        if (isDiscipline(tag)) {
          for (const sub of DISCIPLINE_FACETS[tag].tags) next.delete(sub)
        }
      } else {
        next.add(tag)
      }
      commit({ tags: Array.from(next) }, 'push')
    },
    [selectedTags, commit],
  )

  const cycleMode = useCallback(() => {
    commit({ mode: nextMode(mode) }, 'push')
  }, [mode, commit])

  const cycleSort = useCallback(() => {
    const i = SORT_MODES.indexOf(sort)
    commit({ sort: SORT_MODES[(i + 1) % SORT_MODES.length] }, 'push')
  }, [sort, commit])

  const reset = useCallback(() => {
    setQueryInput('')
    commit({ q: null, tags: null, mode: null, sort: null, tiers: null }, 'push')
  }, [commit])

  // Each tier is an independent shelf, so this is a plain add/remove — no
  // tier's state implies another's. Unchecking the last one is allowed and
  // shows the empty state; it's a legible thing to have done, and `reset`
  // is right there.
  const toggleTier = useCallback(
    (tier: WorkTier) => {
      const next = new Set(tiers)
      if (next.has(tier)) next.delete(tier)
      else next.add(tier)
      // Emitted in `WORK_TIERS` order, not click order, so the same
      // selection always produces the same URL.
      commit({ tiers: WORK_TIERS.filter((t) => next.has(t)) }, 'push')
    },
    [tiers, commit],
  )

  const tiersAreDefault =
    tiers.size === DEFAULT_TIERS.length && DEFAULT_TIERS.every((t) => tiers.has(t))

  // Searching, filtering, or changing which shelves are shown is all
  // digging (§4.1 of the tiers-and-pins spec) — each is reason enough to
  // drop pins (§3.3): a filtered view answers the question asked, not
  // Beck's picks first.
  const digging = Boolean(queryInput.trim()) || selectedTags.size > 0 || !tiersAreDefault

  const tierList = useMemo(() => WORK_TIERS.filter((t) => tiers.has(t)), [tiers])

  const results = useMemo(
    () =>
      sortWork(
        filterWork(WORK, {
          query: queryInput,
          tags: Array.from(selectedTags),
          mode,
          tiers: tierList,
        }),
        sort,
      ),
    [queryInput, selectedTags, mode, sort, tierList],
  )

  // The denominator is what the current shelves hold, so it never invites
  // the question the archive exists to avoid (§4.4) — and it stays honest
  // when the shelves change rather than only tracking the archive.
  const total = useMemo(() => WORK.filter((item) => tiers.has(tierOf(item))).length, [tiers])

  // Pins hold only in the default view — no search, no tags, chronological
  // order (§3.3) — and only up to as many as the live masonry can seat
  // (§3.1); a narrower viewport demotes the surplus back into `rest` rather
  // than crowding the head row.
  const pinsActive = !digging && sort === 'newest'
  const columnCount = useMasonryColumns()
  const { pins, rest } = useMemo(
    () => (pinsActive ? splitPinned(results, columnCount) : { pins: [], rest: results }),
    [results, columnCount, pinsActive],
  )

  // The lightbox's domain: the subset of the rendered results that open it,
  // in the same order they're rendered — pins first, then the rest, matching
  // the masonry's head-of-column placement. `?view=<slug>` is the single
  // source of truth for *which* piece is open — ImageLightbox's internal
  // index is a fast local mirror (see its own doc comment).
  const renderedItems = useMemo(() => [...pins, ...rest], [pins, rest])
  const lightboxItems = useMemo(() => galleryLightboxItems(renderedItems), [renderedItems])
  const viewSlug = searchParams.get('view')
  const viewIndex = lightboxItems.findIndex((p) => p.slug === viewSlug)
  const lightboxOpen = viewIndex >= 0

  // Whether *this* session pushed the history entry currently open — set the
  // moment a card is clicked, so Back/the mobile back-swipe can consume it.
  // A deep link that lands directly on `?view=` never sets this, so closing
  // it replaces instead of trying to pop an entry this session never pushed.
  const pushedViewRef = useRef(false)
  // Every visible tile's image wrapper, keyed by slug, so the dismiss flight
  // can land on whichever tile the lightbox is currently showing rather than
  // only the one that opened it.
  const tilesRef = useRef(new Map<string, HTMLElement>())

  const lightboxApi = useMemo<GalleryLightboxApi>(
    () => ({
      open: (slug) => {
        pushedViewRef.current = true
        commit({ view: slug }, 'push')
      },
      registerTile: (slug, node) => {
        if (node) tilesRef.current.set(slug, node)
        else tilesRef.current.delete(slug)
      },
    }),
    [commit],
  )

  const handleLightboxOpenChange = useCallback(
    (o: boolean) => {
      if (o) return
      if (pushedViewRef.current) router.back()
      else commit({ view: null }, 'replace')
      pushedViewRef.current = false
    },
    [router, commit],
  )

  const handleLightboxIndexChange = useCallback(
    (i: number) => {
      const p = lightboxItems[i]
      if (p) commit({ view: p.slug }, 'replace')
    },
    [lightboxItems, commit],
  )

  const resolveLightboxTrigger = useCallback(
    (piece: WorkPiece) => tilesRef.current.get(piece.slug) ?? null,
    [],
  )

  // `?view=` naming a slug not in the domain — filtered out, a collection,
  // an essay, a code demo, a typo, a deleted slug — closes the lightbox and
  // strips the param. One rule covers every variant, including the filters
  // changing out from under an open lightbox via Back/Forward. Runs after
  // `lightboxItems` is computed above, so a valid deep link on first load is
  // never stripped before it's had a chance to match.
  useEffect(() => {
    if (viewSlug != null && viewIndex === -1) {
      commit({ view: null }, 'replace')
    }
  }, [viewSlug, viewIndex, commit])

  const activeDisciplines = useMemo(
    () => DISCIPLINES.filter((d) => selectedTags.has(d)),
    [selectedTags],
  )
  // A non-default tier selection counts too: it isn't a tag or a query, but
  // it's still a real departure from the default view, and `reset` should
  // visibly offer to clear it same as everything else.
  const activeCount = selectedTags.size + (queryInput.trim() ? 1 : 0) + (tiersAreDefault ? 0 : 1)

  // Tags active disciplines' subtags with their parent's color, so they still
  // read as grouped with no label once they're inline among everything else.
  const subtagTone = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of activeDisciplines) {
      for (const tag of DISCIPLINE_FACETS[d].tags) map.set(tag, DISCIPLINE_TONE[d])
    }
    return map
  }, [activeDisciplines])

  // Chip row 1: each discipline immediately followed by its own subtags (if
  // active). A selected discipline's subtags slot in right where they are
  // instead of a separate row, and the row's height reservation (§2.4)
  // absorbs them without shifting anything beneath it.
  const disciplineChips = useMemo(() => {
    const tags: string[] = []
    for (const d of DISCIPLINES) {
      tags.push(d)
      if (selectedTags.has(d)) tags.push(...DISCIPLINE_FACETS[d].tags)
    }
    return tags
  }, [selectedTags])

  // Chip row 2: every universal tag, theme facet then format facet. Never
  // changes, so unlike row 1 this needs no reservation — it is already its
  // own maximum.
  const universalChips = useMemo(() => UNIVERSAL_FACETS.flatMap((f) => f.tags), [])

  // The chip-block height measurement (the ghost/real split that keeps
  // toggling a discipline from ever shifting the count/grid below) now lives
  // inside `FilterPanelContent` itself, since that component mounts twice —
  // once in-flow, once in the docked bar's expansion — and each mount has
  // its own independent layout to measure. Only the *outside* half of the
  // in-flow mount's reservation (`chipSlackOutside`, rendered as margin
  // between the panel and the count below) needs to live up here, reported
  // via the `onChipSlackChange` callback passed to that one mount. The
  // docked mount doesn't pass the callback — its expansion is a capped,
  // scrolling overlay with nothing positioned relative to its bottom edge,
  // so it has no zero-shift guarantee to keep and needs no outside half.
  const [chipSlackOutside, setChipSlackOutside] = useState(0)

  // The docked filter bar: eased in continuously (`dockedProgress`, 0–1) as
  // the in-flow panel (`panelRef`) scrolls behind the nav, rather than
  // popping in — see `useDockedReveal`'s own comment. No scroll-direction
  // gate: it used to hide itself while scrolling down and only reappear
  // scrolling back up, but that made it disappear right when a reader
  // mid-scroll might want it. Scrolling back up far enough to see the real
  // panel again closes the docked copy, so there are never two open panels.
  const panelRef = useRef<HTMLDivElement>(null)
  const dockedProgress = useDockedReveal(panelRef)
  const [dockedOpen, setDockedOpen] = useState(false)
  useEffect(() => {
    if (dockedProgress === 0) setDockedOpen(false)
  }, [dockedProgress])

  // Everything the filter controls need, passed as one object so the two
  // mounts of `FilterPanelContent` (in-flow panel, docked expansion) and
  // `DockedFilterBar`'s own compact row share one signature instead of each
  // needing a growing, independently-drifting prop list.
  const controls: FilterControls = {
    queryInput,
    setQueryInput,
    selectedTags,
    toggleTag,
    subtagTone,
    disciplineChips,
    universalChips,
    tiers,
    toggleTier,
    sort,
    cycleSort,
    mode,
    cycleMode,
    reset,
    activeCount,
  }

  // Blended page wash: one soft glow per discipline. Each gets its own
  // always-mounted layer with a fixed background and only toggles opacity —
  // a single div whose background string changes with the active set can't
  // cross-fade (CSS can't interpolate between two different gradients), so
  // switching disciplines mid-wash would snap instead of fading.
  // Skipped in 'not' mode, where a discipline means "exclude" not "show".
  //
  // Sized to stay fairly contained around each origin corner rather than
  // flooding the whole screen: with 2-3 disciplines active, letting them
  // all reach full-screen strength left every combination reading as the
  // same muddy blend, with no area where any one color actually won out.
  return (
    <>
      {/*
        Sits at z-0 as a sibling of the content rather than a negative z-index
        child: the opaque body background paints after negative-index children,
        which would hide the wash entirely.
      */}
      {DISCIPLINES.map((d) => (
        <div
          key={d}
          aria-hidden="true"
          // Screen blending only in dark mode: with 2-3 disciplines active,
          // overlapping translucent layers otherwise average toward a muddy
          // gray/brown (a property of mixing roughly-primary hues via normal
          // alpha compositing, not just how much they overlap) — screen
          // combines per-channel intensity instead, keeping overlaps
          // brighter and each color identifiable near its own origin. Screen
          // against light mode's already-bright page background does the
          // opposite: it washes everything toward white instead, so light
          // mode keeps the default (normal) blending.
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-[1800ms] ease-in-out dark:mix-blend-screen"
          style={{
            background: `radial-gradient(90% 140% at ${GRADIENT_ORIGIN[d]}, color-mix(in srgb, ${WASH_TONE[d]} 34%, transparent) 0%, transparent 92%)`,
            opacity: selectedTags.has(d) && mode !== 'not' ? 1 : 0,
          }}
        />
      ))}

      <DockedFilterBar
        controls={controls}
        progress={dockedProgress}
        open={dockedOpen}
        onOpenChange={setDockedOpen}
      />

      <div className="relative z-10">
      {/* One bordered panel holds the whole filter apparatus: toolbar, then
          search, then chips. Everything in here filters, and the border is
          what says so — before this it read as three unrelated things stacked
          on each other.

          No fill. The three discipline wash gradients render at z-0 behind
          this and have to stay visible through it; the search field keeps its
          own `bg-card`, which is what makes it read as an inset field against
          an unfilled panel.

          No internal rules either. The panel already groups; a divider inside
          would re-fragment exactly what it exists to join — `FilterPanelContent`
          owns its own row-to-row rhythm for that reason, rather than this
          wrapper supplying it, since the docked bar's expansion below needs
          the same rhythm with no border/padding of its own to hang it on.

          `panelRef` is how the docked bar knows to appear — `useDockedReveal`
          below watches this exact element. */}
      <div ref={panelRef} className="rounded-2xl border border-border p-3 sm:p-4">
        <FilterPanelContent controls={controls} onChipSlackChange={setChipSlackOutside} />
      </div>

      {/* Half the chip block's reservation was spent as the panel's own
          bottom padding (inside `FilterPanelContent`); this is the other
          half, spent as ordinary margin before the count instead of blank
          space inside the panel — see that component's own comment. */}
      <div aria-hidden="true" style={{ height: chipSlackOutside }} />

      {/* The count is the caption for the grid, not a control — so it sits
          below the panel and directly above the results. */}
      <p className="font-brand mt-5 text-sm lowercase text-muted-foreground">
        <span className="font-bold text-foreground">{results.length}</span> of {total}{' '}
        {total === 1 ? 'entry' : 'entries'}
        {selectedTags.size > 0 && (
          <span>
            {' '}
            · {selectedTags.size} {selectedTags.size === 1 ? 'tag' : 'tags'}
            {mode === 'not' ? ' excluded' : ''}
          </span>
        )}
      </p>

      {/* Masonry (reads left-to-right, top-to-bottom) or empty state */}
      {pins.length + rest.length > 0 ? (
        <GalleryLightboxContext.Provider value={lightboxApi}>
          <MasonryGrid className="mt-3" pinned={pins.map((item) => <WorkCard key={item.slug} item={item} />)}>
            {rest.map((item) => (
              <WorkCard key={item.slug} item={item} />
            ))}
          </MasonryGrid>
        </GalleryLightboxContext.Provider>
      ) : (
        <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--goldenrod) 18%, var(--card))' }}
          >
            <Search className="h-6 w-6 text-goldenrod" strokeWidth={1.75} />
          </div>
          <p className="font-brand mt-5 text-xl font-bold lowercase text-foreground">
            nothing matches yet
          </p>
          <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            {/* Tiers first: with every shelf switched off there is nothing
                to match against, so blaming the tags or the query would
                point at the wrong control. */}
            {tiers.size === 0
              ? 'Every shelf is switched off, so there’s nothing left to show. Turn one back on, or '
              : selectedTags.size > 1 && mode === 'and'
                ? 'These tags combine with “and”, so every result has to carry all of them at once. Try the little venn diagram to switch, or '
                : 'No piece fits that combination. Try a different word, or '}
            <button
              type="button"
              onClick={reset}
              className="cursor-pointer font-bold text-goldenrod underline-offset-4 hover:underline"
            >
              reset everything
            </button>
            .
          </p>
        </div>
      )}

      <ImageLightbox
        items={lightboxItems}
        initialIndex={Math.max(0, viewIndex)}
        open={lightboxOpen}
        onOpenChange={handleLightboxOpenChange}
        onIndexChange={handleLightboxIndexChange}
        resolveTrigger={resolveLightboxTrigger}
        titleHref={workHref}
      />
      </div>
    </>
  )
}
