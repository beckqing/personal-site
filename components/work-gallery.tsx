'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
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
  hasWriteup,
  isCollection,
  isDiscipline,
  isTextForward,
  itemTags,
  MODE_LABEL,
  nextMode,
  tagTone,
  toneFor,
  UNIVERSAL_FACETS,
  WORK,
  workHref,
  type Discipline,
  type FilterMode,
  type WorkItem,
} from '@/lib/work'
import {
  CollectionMark,
  CollectionStack,
  WorkPlaceholder,
  WriteupMark,
} from '@/components/work-visuals'
import { cn } from '@/lib/utils'

/** Where each discipline's glow sits, so blends read as distinct light sources. */
const GRADIENT_ORIGIN: Record<Discipline, string> = {
  art: '12% 0%',
  writing: '88% 8%',
  science: '50% 100%',
}

/** A colored/neutral tag pill, used both in the filter panel and on cards. */
function TagChip({
  tag,
  active,
  onClick,
  size = 'md',
}: {
  tag: string
  active: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}) {
  const tone = tagTone(tag)
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

/**
 * Shared footer of tag chips, used by both card variants. These stay outside
 * the card's link so they can remain real filter buttons — a button nested in
 * an anchor is invalid, and would swallow the click either way.
 */
function CardTags({
  item,
  activeTags,
  onToggleTag,
}: {
  item: WorkItem
  activeTags: Set<string>
  onToggleTag: (tag: string) => void
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {Array.from(itemTags(item)).map((tag) => (
        <TagChip
          key={tag}
          tag={tag}
          size="sm"
          active={activeTags.has(tag)}
          onClick={() => onToggleTag(tag)}
        />
      ))}
    </div>
  )
}

/** Text-forward pieces (poems, essays) — a quote-style preview, no image. */
function TextCard({
  item,
  activeTags,
  onToggleTag,
}: {
  item: WorkItem
  activeTags: Set<string>
  onToggleTag: (tag: string) => void
}) {
  const tone = toneFor(item)
  const isPoem = item.tags.includes('poem')
  const excerpt = item.excerpt ?? item.description
  return (
    <article
      className="group flex flex-col rounded-2xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: `color-mix(in srgb, ${tone} 8%, var(--card))` }}
    >
      <Link href={workHref(item)} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-center justify-between">
          <Quote
            className="h-7 w-7 -scale-x-100"
            style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="font-brand flex items-center gap-2 text-xs lowercase text-muted-foreground">
            {isPoem ? 'poem' : 'essay'} · {item.year}
            {hasWriteup(item) && <WriteupMark />}
          </span>
        </div>

        <p
          className={cn(
            'font-brand-italic mt-3 text-pretty text-lg leading-relaxed text-foreground',
            isPoem && 'whitespace-pre-line',
          )}
        >
          {excerpt}
        </p>

        <p className="font-brand mt-4 flex items-center gap-1.5 text-sm lowercase tracking-wide text-muted-foreground transition-colors group-hover:text-foreground">
          — from &ldquo;{item.title}&rdquo;
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </Link>

      <CardTags item={item} activeTags={activeTags} onToggleTag={onToggleTag} />
    </article>
  )
}

/**
 * Visual/other pieces — a tinted blank placeholder panel above the metadata.
 * Standalone pieces split into two treatments so it's clear at a glance
 * which discipline is driving the piece: a piece with no "writing" tag is
 * primarily visual, so its image gets the space and the description drops
 * out entirely; a piece tagged "writing" that still carries an image (e.g.
 * an illustrated blog post, as opposed to the quote-only TextCard used for
 * poems/essays) stays text-led, with a shorter image strip and its full
 * description kept.
 *
 * The caption block borrows TextCard's sense of hierarchy: the image is the
 * content, so the title reads like a small gray attribution line (à la
 * TextCard's "— from ...") rather than competing with the image as a bold
 * headline, set apart by space alone rather than a rule.
 */
function ImageCard({
  item,
  activeTags,
  onToggleTag,
}: {
  item: WorkItem
  activeTags: Set<string>
  onToggleTag: (tag: string) => void
}) {
  const collection = isCollection(item)
  const writingWithImage = !collection && item.tags.includes('writing')
  return (
    <article
      className={cn(
        'group flex flex-col rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg',
        // Collections need extra room for the tilted stack to spill past the card.
        collection ? 'mt-4 p-4' : 'overflow-hidden',
      )}
    >
      <Link
        href={workHref(item)}
        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative">
          {collection ? (
            <CollectionStack item={item} />
          ) : (
            /* Blank placeholder image — no fabricated artwork, just a tinted panel. */
            <div
              className={cn('overflow-hidden', writingWithImage ? 'aspect-[16/9]' : 'aspect-[5/4]')}
            >
              <WorkPlaceholder item={item} />
            </div>
          )}

          {collection && (
            <div className="absolute left-3 top-3 z-20">
              <CollectionMark count={item.pieces.length} />
            </div>
          )}
          {hasWriteup(item) && (
            <div className="absolute bottom-3 left-3 z-20">
              <WriteupMark />
            </div>
          )}
        </div>

        <div className={cn('relative z-10 mt-5 flex flex-col', collection ? 'px-2' : 'px-5')}>
          <h3 className="font-brand text-sm lowercase tracking-[0.08em] text-muted-foreground transition-colors text-balance group-hover:text-foreground">
            {item.title}
          </h3>
          {(collection || writingWithImage) && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground/90">{item.description}</p>
          )}
        </div>
      </Link>

      <div className={cn(collection ? 'px-2 pb-1' : 'px-5 pb-5')}>
        <CardTags item={item} activeTags={activeTags} onToggleTag={onToggleTag} />
      </div>
    </article>
  )
}

function WorkCard(props: {
  item: WorkItem
  activeTags: Set<string>
  onToggleTag: (tag: string) => void
}) {
  return isTextForward(props.item) ? <TextCard {...props} /> : <ImageCard {...props} />
}

/** One labeled row of chips in the filter panel. */
function FacetRow({
  label,
  tags,
  selectedTags,
  onToggleTag,
  tint,
}: {
  label: string
  tags: readonly string[]
  selectedTags: Set<string>
  onToggleTag: (tag: string) => void
  tint?: string
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <span
        className="font-brand w-28 shrink-0 pt-1 text-xs uppercase tracking-[0.2em]"
        style={{ color: tint ?? 'var(--muted-foreground)' }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <TagChip
            key={tag}
            tag={tag}
            active={selectedTags.has(tag)}
            onClick={() => onToggleTag(tag)}
          />
        ))}
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

  // Blended page wash: one soft glow per selected discipline, layered together.
  // Skipped in 'not' mode, where a discipline means "exclude" rather than "show".
  const showWash = activeDisciplines.length > 0 && mode !== 'not'
  const wash = activeDisciplines
    .map(
      (d) =>
        `radial-gradient(58% 52% at ${GRADIENT_ORIGIN[d]}, color-mix(in srgb, ${DISCIPLINE_TONE[d]} 24%, transparent) 0%, transparent 72%)`,
    )
    .join(', ')

  return (
    <>
      {/*
        Sits at z-0 as a sibling of the content rather than a negative z-index
        child: the opaque body background paints after negative-index children,
        which would hide the wash entirely.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{ background: wash || undefined, opacity: showWash ? 1 : 0 }}
      />

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

      {/* Filters: three disciplines, their sub-categories, then universal ones */}
      <div className="mt-6 flex flex-col gap-4">
        <FacetRow
          label="discipline"
          tags={DISCIPLINES}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
        />

        {/* Discipline-specific categories appear only for selected disciplines. */}
        {activeDisciplines.map((d) => (
          <FacetRow
            key={d}
            label={`${d} ${DISCIPLINE_FACETS[d].name}`}
            tags={DISCIPLINE_FACETS[d].tags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            tint={DISCIPLINE_TONE[d]}
          />
        ))}

        {UNIVERSAL_FACETS.map((facet) => (
          <FacetRow
            key={facet.name}
            label={facet.name}
            tags={facet.tags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
          />
        ))}
      </div>

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
            <div key={item.slug} className="mb-5 break-inside-avoid">
              <WorkCard item={item} activeTags={selectedTags} onToggleTag={toggleTag} />
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
