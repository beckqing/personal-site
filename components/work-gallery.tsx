'use client'

import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Quote, RotateCcw, Search, X } from 'lucide-react'
import {
  ALL_TAGS,
  DISCIPLINE_FACETS,
  DISCIPLINE_TONE,
  DISCIPLINES,
  FILTER_MODES,
  filterWork,
  isCollection,
  isDiscipline,
  isHybrid,
  isTextForward,
  mediumFor,
  MODE_LABEL,
  nextMode,
  tagTone,
  toneFor,
  UNIVERSAL_FACETS,
  WORK,
  workHref,
  type Discipline,
  type FilterMode,
  type WorkCollection,
  type WorkItem,
} from '@/lib/work'
import { aspectStyleFor, CollectionStack, WorkPlaceholder } from '@/components/work-visuals'
import { cn } from '@/lib/utils'

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
        'font-brand inline-flex items-center rounded-full border lowercase transition-colors',
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
      className="group inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground"
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

/**
 * Text-forward pieces (poems, essays) — a quote-style preview, no image.
 * The form (poem/essay) reads as a small tag up top rather than folded
 * into the attribution line, so the title at the bottom can stay a plain
 * "— 'x'" instead of "— from the poem/essay 'x'".
 */
function TextCard({ item }: { item: WorkItem }) {
  const tone = toneFor(item)
  const isPoem = item.tags.includes('poem')
  const excerpt = item.excerpt ?? item.description
  return (
    <article
      className="group flex flex-col rounded-2xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: `color-mix(in srgb, ${tone} 8%, var(--card))` }}
    >
      <Link href={workHref(item)} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-start justify-between gap-3">
          <Quote
            className="h-7 w-7 shrink-0 -scale-x-100"
            style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <TagPill>{isPoem ? 'poem' : 'essay'}</TagPill>
        </div>

        <p
          className={cn(
            'font-brand-italic mt-3 text-pretty text-lg leading-relaxed text-foreground',
            isPoem && 'whitespace-pre-line',
          )}
        >
          {excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-brand text-sm lowercase tracking-wide text-muted-foreground transition-colors group-hover:text-foreground">
            {item.title}
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
      </Link>
    </article>
  )
}

/**
 * A piece that's genuinely both — text-forward work (an essay, typically)
 * written around a specific image, so it keeps TextCard's excerpt-led
 * caption pattern but leads with a short image strip instead of going
 * without one. Opt-in via a piece's `hasImage` flag (see lib/work.ts),
 * not inferred from tags.
 */
function HybridCard({ item }: { item: WorkItem }) {
  const tone = toneFor(item)
  const isPoem = item.tags.includes('poem')
  const excerpt = item.excerpt ?? item.description
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={workHref(item)} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="aspect-[16/9] overflow-hidden" style={aspectStyleFor(item)}>
          <WorkPlaceholder item={item} />
        </div>

        <div className="p-6" style={{ background: `color-mix(in srgb, ${tone} 8%, var(--card))` }}>
          <div className="flex items-start justify-between gap-3">
            <Quote
              className="h-7 w-7 shrink-0 -scale-x-100"
              style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <TagPill>{isPoem ? 'poem' : 'essay'}</TagPill>
          </div>

          <p
            className={cn(
              'font-brand-italic mt-3 text-pretty text-lg leading-relaxed text-foreground',
              isPoem && 'whitespace-pre-line',
            )}
          >
            {excerpt}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="font-brand text-sm lowercase tracking-wide text-muted-foreground transition-colors group-hover:text-foreground">
              {item.title}
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        </div>
      </Link>
    </article>
  )
}

/**
 * A collection's card: the fanned image stack (see CollectionStack) sits
 * directly on the page background with no card chrome of its own — each
 * image in the fan is the same size as a standalone piece's image. The
 * title lives in a separate, smaller card that hovers, centered, above the
 * bottom of the stack and only reveals on hover/focus, so the images stay
 * the thing you actually look at.
 */
function CollectionTile({ item }: { item: WorkCollection }) {
  return (
    <div className="group relative">
      <Link
        href={workHref(item)}
        className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CollectionStack item={item} />
      </Link>

      <div
        className={cn(
          'pointer-events-none absolute inset-x-4 bottom-6 z-30 mx-auto -translate-x-1 translate-y-2 max-w-[min(85%,20rem)] rounded-xl border border-border bg-card p-4 opacity-0 shadow-lg transition-all duration-300 ease-out',
          'group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100',
        )}
      >
        <Link
          href={workHref(item)}
          className="pointer-events-auto rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="font-brand text-sm lowercase tracking-[0.08em] text-foreground text-balance">
            {item.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </Link>
      </div>
    </div>
  )
}

/**
 * Visual/other standalone pieces — a tinted blank placeholder panel above
 * the metadata. Title disappears entirely at rest, leaving just the image,
 * and surfaces as a scrim overlay on hover/focus — an experiment in
 * treating the image itself as the card. An art piece's medium (oil, ink,
 * etc.) rides along in the same overlay, pinned to the bottom-right corner.
 */
function ImageCard({ item }: { item: WorkItem }) {
  if (isCollection(item)) {
    return <CollectionTile item={item} />
  }

  const medium = mediumFor(item)

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={workHref(item)}
        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Blank placeholder image — no fabricated artwork, just a tinted panel. */}
        <div className="aspect-[5/4] overflow-hidden" style={aspectStyleFor(item)}>
          <WorkPlaceholder item={item} />
        </div>
      </Link>

      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-30 flex translate-y-1 items-end justify-between gap-3 rounded-b-[inherit] bg-gradient-to-t from-card via-card/85 to-transparent px-4 pb-4 pt-10 opacity-0 transition-all duration-300 ease-out',
          'group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100',
        )}
      >
        <Link
          href={workHref(item)}
          className="pointer-events-auto rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="font-brand text-sm lowercase tracking-[0.08em] text-foreground text-balance">
            {item.title}
          </h3>
        </Link>
        {medium && <TagPill className="pointer-events-auto">{medium}</TagPill>}
      </div>
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

  // Local mirror of the search box for instant typing feedback.
  const [queryInput, setQueryInput] = useState(urlQuery)
  useEffect(() => {
    setQueryInput(urlQuery)
  }, [urlQuery])

  const commit = useCallback(
    (
      changes: { q?: string | null; tags?: string[] | null; mode?: FilterMode | null },
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

  const reset = useCallback(() => {
    setQueryInput('')
    commit({ q: null, tags: null, mode: null }, 'push')
  }, [commit])

  const results = useMemo(
    () => filterWork(WORK, { query: queryInput, tags: Array.from(selectedTags), mode }),
    [queryInput, selectedTags, mode],
  )

  const activeDisciplines = useMemo(
    () => DISCIPLINES.filter((d) => selectedTags.has(d)),
    [selectedTags],
  )
  const activeCount = selectedTags.size + (queryInput.trim() ? 1 : 0)

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
      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="search titles, descriptions, tags…"
          aria-label="Search all work"
          className="font-brand w-full rounded-full border border-border bg-card py-3 pl-12 pr-4 text-base lowercase text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-goldenrod"
        />
        {queryInput && (
          <button
            type="button"
            onClick={() => setQueryInput('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          <span className="font-bold text-foreground">{results.length}</span> of {WORK.length}{' '}
          {WORK.length === 1 ? 'entry' : 'entries'}
          {selectedTags.size > 0 && (
            <span>
              {' '}
              · {selectedTags.size} {selectedTags.size === 1 ? 'tag' : 'tags'}
              {mode === 'not' ? ' excluded' : ''}
            </span>
          )}
        </p>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="font-brand inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm lowercase text-muted-foreground transition-colors hover:border-goldenrod hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              reset
            </button>
          )}
          <VennMode mode={mode} onCycle={cycleMode} />
        </div>
      </div>

      {/* Masonry (CSS columns) or empty state */}
      {results.length > 0 ? (
        <div className="mt-6 gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {results.map((item) => (
            <div
              key={item.slug}
              className={cn(
                'break-inside-avoid',
                // The fanned stack's back/middle cards spill a little past its
                // own flow height, so collections get a touch more breathing
                // room below than a flat card needs.
                isCollection(item) ? 'mb-8' : 'mb-5',
              )}
            >
              <WorkCard item={item} />
            </div>
          ))}
        </div>
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
            {selectedTags.size > 1 && mode === 'and'
              ? 'These tags combine with “and”, so every result has to carry all of them at once. Try the little venn diagram to switch, or '
              : 'No piece fits that combination. Try a different word, or '}
            <button
              type="button"
              onClick={reset}
              className="font-bold text-goldenrod underline-offset-4 hover:underline"
            >
              reset everything
            </button>
            .
          </p>
        </div>
      )}
      </div>
    </>
  )
}
