'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Archive, ArrowDownUp, Circle, Maximize2, Play, Quote, RotateCcw, RotateCw, Search, X } from 'lucide-react'
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
}: {
  tag: string
  active: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  tone?: string
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
      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground"
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
      <span className="font-brand text-[0.7rem] uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-60">
        {mode}
      </span>
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
  className,
}: {
  tags: readonly string[]
  selectedTags: Set<string>
  onToggleTag: (tag: string) => void
  chipTone?: (tag: string) => string | undefined
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag) => (
        <TagChip
          key={tag}
          tag={tag}
          tone={chipTone?.(tag)}
          active={selectedTags.has(tag)}
          onClick={() => onToggleTag(tag)}
        />
      ))}
    </div>
  )
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
      className={cn('inline-flex items-center rounded-full border border-border p-0.5', className)}
    >
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
            // On/off is a solid accent pill against a bare one — TagChip's
            // exact active idiom, so a wordless control still reads as "the
            // selected ones" on sight. Deliberately not a filled-vs-outline
            // *glyph*: `HeartIcon` and `Circle` fill into legible solids but
            // `Archive` is a container shape, and filling it turns the box
            // into an unreadable blob.
            className={cn(
              'inline-flex cursor-pointer items-center justify-center rounded-full transition-colors',
              // p-1.5 either way so the row's width never shifts on toggle.
              'p-1.5',
              on
                ? 'bg-goldenrod text-[var(--card)]'
                : 'text-muted-foreground/50 hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )
      })}
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

  // One flat, inline chip list: each discipline immediately followed by its
  // own subtags (if active), then the universal tags. A selected discipline's
  // subtags slot in right where they are instead of a separate row, so the
  // row's reserved two-line height (see className below) absorbs them
  // without shifting anything beneath it.
  const filterTags = useMemo(() => {
    const tags: string[] = []
    for (const d of DISCIPLINES) {
      tags.push(d)
      if (selectedTags.has(d)) tags.push(...DISCIPLINE_FACETS[d].tags)
    }
    tags.push(...UNIVERSAL_FACETS.flatMap((f) => f.tags))
    return tags
  }, [selectedTags])

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

      <div className="relative z-10">
      {/* Search — text-sm/py-2/a smaller icon, matching TagChip's own size
          rather than the larger, separately-chosen scale this had before. */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="search titles, descriptions, text, tags…"
          aria-label="Search all work"
          className="font-brand w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm lowercase text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-goldenrod"
        />
        {queryInput && (
          <button
            type="button"
            onClick={() => setQueryInput('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters: one inline, unlabeled chip row. A selected discipline's
          subtags slot in right after it instead of a separate row; the row
          reserves two lines' worth of height up front (content-start keeps
          a short row pinned to the top rather than stretching to fill it),
          so going from one line to two never shifts the summary or results
          below. */}
      <TagRow
        tags={filterTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        chipTone={(tag) => subtagTone.get(tag)}
        className="mt-4 min-h-[4.75rem] content-start"
      />

      {/* Summary + mode + reset */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
        <p className="font-brand text-sm lowercase text-muted-foreground">
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
        <div className="flex items-center gap-3">
          {/* reset sits left of the tier control specifically so its own
              appear/disappear (driven by `activeCount`, which a tier toggle
              changes) shifts nothing to its right — TierRow, sort, and the
              venn stay put relative to each other; only the whole cluster's
              left edge moves. */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="font-brand inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm lowercase text-muted-foreground transition-colors hover:border-goldenrod hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              reset
            </button>
          )}
          <TierRow tiers={tiers} onToggleTier={toggleTier} />
          <button
            type="button"
            onClick={cycleSort}
            aria-label={`Sort: ${SORT_LABEL[sort]}. Activate to change.`}
            className="font-brand inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm lowercase text-muted-foreground transition-colors hover:border-goldenrod hover:text-foreground"
          >
            <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
            {SORT_LABEL[sort]}
          </button>
          <VennMode mode={mode} onCycle={cycleMode} />
        </div>
      </div>

      {/* Masonry (reads left-to-right, top-to-bottom) or empty state */}
      {pins.length + rest.length > 0 ? (
        <GalleryLightboxContext.Provider value={lightboxApi}>
          <MasonryGrid className="mt-6" pinned={pins.map((item) => <WorkCard key={item.slug} item={item} />)}>
            {rest.map((item) => (
              <WorkCard key={item.slug} item={item} />
            ))}
          </MasonryGrid>
        </GalleryLightboxContext.Provider>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
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
