# Spec — essay restoration, viewer modes, and gallery sort

**Status: as-designed, not yet built.** Written 2026-08-28. Move this file to
[../history/](../history/) once it ships, stamped with where the build
diverged — per the `docs/history/` rule in
[ARCHITECTURE.md](../ARCHITECTURE.md#conventions).

Covers [TODO.md](../TODO.md) §9 (workstream A), §10 (B), a new §12 (C), and
records §11 as explicitly deferred (D). Every decision below is settled — an
engineer should be able to build A, B, and C without asking anything.

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| How rich essay bodies are authored | **MDX files** under `content/essays/`, rendered by site components | Beck, 2026-08-28 |
| Lightbox vs. single view | **Two states.** The lightbox becomes genuinely immersive; scrolling down inside it flies the image back to its in-page position | Beck, 2026-08-28 |
| The art fair essay's missing images | **Ship without them.** Structure and text restored now; booth/setup/flyer photos recorded as content for Beck | Beck, 2026-08-28 |
| Gallery ordering | **Add a sort control.** Hand-authored order stays the default | Beck, 2026-08-28 |
| WIP/duplicate art (§11) | **Deferred.** Direction is process-stills, details unsettled — see D | Beck, 2026-08-28 |

**The governing constraint for workstream A** is the Conventions rule added
2026-08-28: *imported content is never rewritten.* Read it before touching an
essay. The whole reason A exists is that this rule didn't exist the first time.

---

# A. Rich essay bodies (TODO §9)

## A.1 The problem, in one paragraph

`writeup` is `string`, and `Prose` (`components/work-visuals.tsx:619`) is
`text.split('\n\n').map(p => <p>)`. There is nowhere for a heading, list,
blockquote, display block, link, or image to live, so when three
structure-heavy essays were imported from the archived 11ty site their
structure was flattened and their prose re-worded to suit the flattening. The
originals survive as Markdown at `github.com/beckqing/archived-personal-site`
under `posts/`.

## A.2 Dependencies and configuration

```bash
pnpm add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

`next.config.mjs` — wrap the existing (empty) config:

```js
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {}

const withMDX = createMDX({})

export default withMDX(nextConfig)
```

**Do not add `md`/`mdx` to `pageExtensions`.** That option exists to make MDX
files *routes*; our essays are imports living outside `app/`, and adding it
would turn any stray Markdown under `app/` into a live page. `createMDX` on its
own installs the loader that makes `import Essay from './x.mdx'` work.

`mdx-components.tsx` at the **repo root** (required by `@next/mdx` under the App
Router — without it, nothing renders). Note the breaking change in this Next:
**`useMDXComponents` takes no arguments.** Older examples pass a `components`
parameter and merge it; that signature is wrong here.

```tsx
// mdx-components.tsx
import type { MDXComponents } from 'mdx/types'
import { essayComponents } from '@/components/essay'

const components: MDXComponents = essayComponents

export function useMDXComponents(): MDXComponents {
  return components
}
```

Notes:
- `@types/mdx` supplies the `*.mdx` module declarations; `tsconfig.json`'s
  `include` already covers a root `mdx-components.tsx` via `**/*.tsx`.
- Turbopack (the default for `next dev`/`next build` in 16.x) only constrains
  **remark/rehype plugins**, which must be named by string because functions
  can't cross into Rust. This spec uses no plugins, so there is nothing to do —
  but if one is added later, use the string form.
- Acceptance: `pnpm exec tsc --noEmit` clean and `next build` clean, with the
  static page count unchanged (203 today — MDX bodies add no routes).

## A.3 File and module layout

```
content/essays/
  chinese-emoji-poetry.mdx     ← restored from archive posts/chinese-emoji-poetry.md
  first-art-fair.mdx           ← restored from archive posts/first-art-fair.md
  note-systems.mdx             ← restored from archive posts/note-systems.md
components/essay.tsx           ← the block components + essayComponents map
lib/essay-bodies.ts            ← SERVER ONLY: slug → MDX component
mdx-components.tsx             ← root, required by @next/mdx
scripts/check-essay-fidelity.mjs
```

### `lib/essay-bodies.ts` — server only

`lib/work.ts` is imported by three **client** components (`work-gallery`,
`image-lightbox`, `media-player`), so a component reference must never be added
to `WorkPiece`. Essay bodies live in their own module, imported only by the two
server page files.

```ts
// lib/essay-bodies.ts
//
// SERVER ONLY. Importing this from a 'use client' module pulls the whole MDX
// runtime into the browser bundle. Only app/work/[slug]/page.tsx and
// app/work/[slug]/[pieceSlug]/page.tsx may import it.
import type { ComponentType } from 'react'
import ChineseEmojiPoetry from '@/content/essays/chinese-emoji-poetry.mdx'
import FirstArtFair from '@/content/essays/first-art-fair.mdx'
import NoteSystems from '@/content/essays/note-systems.mdx'

const BODIES: Record<string, ComponentType> = {
  'chinese-emoji-poetry': ChineseEmojiPoetry,
  'first-art-fair': FirstArtFair,
  'note-systems': NoteSystems,
}

/** The MDX body for a piece, if it has one. Slugs match MDX_ESSAY_SLUGS in lib/work.ts. */
export function essayBody(slug: string): ComponentType | undefined {
  return BODIES[slug]
}
```

### `lib/work.ts` — one client-safe addition

`hasWriteup()` drives the writeup badge on three card faces
(`components/work-visuals.tsx:697,733,780`) and runs in client components, so it
cannot see `BODIES`. Add a plain string array — data, not components — and keep
the two in sync:

```ts
/**
 * Pieces whose write-up is an MDX body in content/essays/ rather than the
 * plain `writeup` string. Kept here (as plain strings) because hasWriteup()
 * runs in client components and must not import the MDX map. The keys of
 * lib/essay-bodies.ts must match this list exactly.
 */
export const MDX_ESSAY_SLUGS = [
  'chinese-emoji-poetry',
  'first-art-fair',
  'note-systems',
] as const

export function hasWriteup(item: WorkPiece): boolean {
  return Boolean(item.writeup) || (MDX_ESSAY_SLUGS as readonly string[]).includes(item.slug)
}
```

**Delete the `writeup` string from those three entries in `lib/work.ts`** once
the MDX ships. Two sources of truth for the same body is exactly the trap that
produced this workstream. Their `text` (the pull quote) and every other field
stay untouched.

### Page wiring

Both server pages get the same three-line change. In
`app/work/[slug]/page.tsx`'s `PieceView` (two call sites — the text-forward
branch at ~:174 and the image branch at ~:192) and the collection-piece page:

```tsx
const Body = essayBody(piece.slug)
…
{Body ? (
  <EssayBody className="mt-8">
    <Body />
  </EssayBody>
) : (
  piece.writeup && <Prose text={piece.writeup} className="mt-8" />
)}
```

`Prose` stays exactly as it is — ~20 short process notes still use it, and it is
correct for them.

## A.4 The component set (`components/essay.tsx`)

All of these are server components (no `'use client'`). All colours come from
existing tokens — no literals; `#080b24` in particular is light mode's
`--foreground` *and* dark mode's `--background`.

```tsx
/** Wraps a rendered MDX body: sets the measure, vertical rhythm, and base type. */
export function EssayBody({ children, className }: { children: ReactNode; className?: string })

/**
 * A centred display block for verse — the emoji stanzas and their Chinese
 * sources. Upright, never italic: italic CJK is a synthesized oblique and
 * emoji ignore slant entirely, so VerseBlock's slanted default is wrong here.
 * Line breaks inside are preserved. `lang` sets the `lang` attribute so the
 * right font stack and line-breaking rules apply.
 */
export function Verse({
  lang,
  children,
}: {
  lang?: 'zh' | 'en'
  children: ReactNode
})

/** The emoji-bullet list. Renders <ul role="list"> with the marker removed. */
export function EmojiList({ children }: { children: ReactNode })

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
})

/** A market's header block: name over hours-and-date. Art fair essay only. */
export function MarketHeader({ name, when }: { name: string; when: string })

/** A quiet, small-type closing note — the archive's <small> asides. */
export function Aside({ children }: { children: ReactNode })

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
})

/** A row of PieceLinks or images with one shared caption underneath. */
export function FigureRow({ caption, children }: { caption?: string; children: ReactNode })

/** The base-element map handed to MDX. */
export const essayComponents: MDXComponents
```

`essayComponents` maps `h2`/`h3`/`h4` to the site's `font-brand` lowercase
heading treatment at descending sizes, `p` to `Prose`'s paragraph styling, `a`
to a `--goldenrod` underline-on-hover link, `ul`/`ol`/`li` to plain lists,
`blockquote` to a left-rule quote using the piece's tone, `hr`, `strong`, `em`.

**Links open in the same tab.** The codebase has no `target="_blank"` anywhere
and the archive's links were plain anchors; keep it that way, and skip `rel`
attributes that only matter with a target.

## A.5 Restoration procedure (applies to all three essays)

1. Clone the archive: `git clone --depth 1 https://github.com/beckqing/archived-personal-site`.
2. Copy the post's body (everything below the YAML front matter) into
   `content/essays/<slug>.mdx` **unchanged**.
3. Replace only the raw HTML wrappers with components — `<center>…</center>` →
   `<Verse>`, `<ul class="emoji-bullet">` → `<EmojiList>`/`<Item>`, `<small>` →
   `<Aside>`, `<a href>` → Markdown links. Markdown headings, blockquotes,
   lists, emphasis, and links stay as Markdown.
4. Escape what MDX would otherwise eat: `{` and `}` become `\{` `\}`, and any
   stray `<` that isn't a tag becomes `&lt;`.
5. Omit only whole bracketed image placeholders whose asset does not exist, and
   record each omission in TODO §9.
6. Run `node scripts/check-essay-fidelity.mjs` (A.7) and resolve every diff.

**Do not** re-punctuate, expand contractions, remove exclamation points, merge
or split sentences, "tighten" asides, or drop a link because its target may
have moved. Beck's typographic quotes (’ “ ”) and em-dashes are Beck's.

## A.6 Per-essay notes

### `chinese-emoji-poetry`

- Two `<Verse>` blocks. Each is, in order: the emoji title glyph, a blank line,
  the emoji stanza, a blank line, the Chinese title, a blank line, the Chinese
  source poem. The second poem's emoji lines contain a ` / ` caesura that is
  part of the line — keep it.
- **Delete the `→` arrows.** They were the importer's invention to squash the
  two-column layout into a sentence; they appear nowhere in the source.
- The Google Translate output is a **blockquote** of four lines.
- Four links to restore: *19 Ways of Looking at Wang Wei* (Google Books), the
  MDBG dictionary query URL (long, percent-encoded — copy it whole), the
  Unicode CLDR emoji list, and the full-emoji-list link on "varies from
  platform to platform".
- Restore the aside "(currently building this)" and the closing `<small>` line.
- Book titles are italic.
- **Overflow:** the emoji stanzas are long single lines that must not force the
  page to scroll sideways. `Verse` puts its content in an `overflow-x: auto`
  container per the site's wide-content rule.

### `first-art-fair`

- Three `##` sections: "How it started", "Type II Fun", "Third time's the
  charm?".
- `####` pairs per market: "+ things that went well" / "Δ things to change for
  next time" for stART, then "+ good" / "Δ for next time" for the other two.
  **Keep the exact heading text per market** — the shortening is Beck's.
- Every `<ul class="emoji-bullet">` becomes `<EmojiList>`. Labels repeat
  deliberately across markets (🎯 profit, 📌 layout, 🚗 transport, ⌛ setup
  time, 🏷 labels, 💳 pos, 🥤 food, 👋 me); that repetition is how the season
  compares. Label-only rows render with no `children`.
- Note the archive's own typos in class attributes (`class ="mono"`) — an
  artifact of hand-written HTML, irrelevant once these are components.
- `<MarketHeader>` for each of the three name/date blocks. Those dates (18 Sept
  2022, 23 Oct 2022, 4 Dec 2022) are absent from the current text entirely.
- The Brighton Bazaar application pitch is a **blockquote** (it contains a
  `<br>` mid-quote; a hard line break is fine).
- Links: StART on the Street, StART at the Station, Brighton Bazaar
  (Instagram), Hassle Flea. Keep them even if a URL now 404s.
- Restore the name *delirium* for the interactive piece demoed at Hassle Flea.
- **Images.** Per Beck's decision, ship without the photos:
  - `[ mother earth ]` → `<PieceLink slug="hthtpw" pieceSlug="01-mama-earth" />`
  - `[ fire protection ]` → `<PieceLink slug="april-colors-19" pieceSlug="10-fire-protection" />`
  - Both inside one `<FigureRow caption="The three works I submitted with my application.">` — the caption is the archive's `<small>`, verbatim.
  - `[ when a woman ]`, `[ photos of setup sketch and practice ]`, `[ photos of
    actual setup ]`, `[ photos of my sketched setup ]`, `[ photos of my setup ]`,
    `[ flyer contest ]` — **omit, and record each in TODO §9.2** as content for
    Beck to source. Do not invent placeholder art, and do not write a caption
    for a figure that isn't there.

### `note-systems`

- Three `#` sections — ANALOG, DIGITAL TOOLS, THE GOAL — in that capitalisation.
  They are `#` (h1) in the source; render them through the `h2` treatment since
  the page's `<h1>` is the piece title, and note the demotion in the fidelity
  script's allowlist.
- Two `##` subsections: "handwriting", "non-handwriting".
- The opening summary is a **blockquote containing two `#####` headings
  (`Digital:`, `Analog:`) each over a bulleted list**. This is the single block
  most damaged by the flattening — it is an at-a-glance setup summary, not a
  sentence.
- Eleven links to restore: TickTick (×3 in the source — keep all three),
  Google Calendar, Samsung Notes (×2), OneNote, Nebo, Squid, Bamboo Paper,
  Infinite Painter, Todoist, Notion, Trello.

## A.7 `scripts/check-essay-fidelity.mjs`

Makes the verbatim rule enforceable instead of aspirational. Node only, no
dependencies, not wired into the build.

```
node scripts/check-essay-fidelity.mjs --archive ../archived-personal-site
```

Algorithm, per essay:
1. Read the archive `.md`, strip YAML front matter, and the repo `.mdx`.
2. From both, strip all markup — HTML/JSX tags, Markdown link syntax (keeping
   the link *text*), heading markers, list markers, blockquote markers,
   emphasis markers.
3. Normalise: collapse all whitespace runs to a single space, trim.
4. Split into words and diff. Report the first 20 differing runs with context.
5. Exit non-zero on any difference outside the allowlist.

Allowlist (documented in the script's header, applied as skips):
- Text inside omitted image placeholders (`[ … ]` rows listed per essay).
- The `→` arrows in the current flattened text (irrelevant once restored, but
  the script also runs against the *pre-restoration* state to demonstrate the
  gap — expect it to fail loudly there, and keep that output in the PR).

The script compares **prose only**. Structure is verified by eye against the
per-essay notes above.

## A.8 Edge cases

| Case | Handling |
| --- | --- |
| Essay bodies aren't searchable | `filterWork` searches `title`/`description`/`text`/`preview`/tags — it never searched `writeup`, so removing the string is **not** a regression. Accepted; record in TODO if it ever matters. Do not add MDX to the search haystack (it would pull the body into the client bundle). |
| `metaDescription()` | Unchanged — reads `description` → `preview` → `text`, none of which move. |
| The essay pull quote | Essays are text-forward (`text` set, no `image`), so they render title → meta → `text` in the left-ruled box → body. Only the body changes. |
| A chapbook piece with a writeup | Stays a plain `writeup` string through `Prose`. MDX is top-level essays only. |
| `MDX_ESSAY_SLUGS` drifting from `BODIES` | `lib/essay-bodies.ts` asserts at module load that its keys and `MDX_ESSAY_SLUGS` match, throwing at build time. |
| A slug in `MDX_ESSAY_SLUGS` with no matching `WorkPiece` | Same assertion; build fails. |
| `<PieceLink>` with a bad slug | Throws at build time (server component, static render) rather than rendering an empty box. |
| Emoji in the mono label | The brand mono face has no emoji coverage; emoji fall through to the system emoji font. Do not set a `font-family` that blocks that fallback. |
| Long emoji/CJK lines | `Verse` uses an `overflow-x: auto` inner container; the page body must never scroll horizontally. |
| Dark mode | Every colour a token. Verify both themes, and the `data-theme` override as well as `prefers-color-scheme`. |
| Reduced motion | No animation in this workstream. |

---

# B. Immersive lightbox with scroll-to-dismiss (TODO §10)

## B.1 Why they look the same today

The lightbox only ever opens from a page that already shows the image large —
`PieceMedia` is its only trigger, and `PieceMedia` renders on the piece's own
page. The dialog then paints `bg-background/96` (near-opaque, same colour as
the page), sizes the image `max-h-[65vh]` (comparable to the in-page
`max-w-3xl`), and repeats the same caption fields underneath. Nothing signals a
mode change because almost nothing changes.

## B.2 Target behaviour

**Open** is full-bleed and quiet: opaque `--background` backdrop, image at
`max-h-[92vh] max-w-[92vw]`, no border or rounding, caption and controls
overlaid at the edges and faded to `opacity-0` after 2.5s of no pointer/key
activity (any movement brings them back). Prev/next and the counter behave as
they do now.

**Scrolling down dismisses it**, and the image flies from its lightbox rect
back to its in-page rect rather than cross-fading.

## B.3 Implementation

All in `components/image-lightbox.tsx`; no other component's API changes.

**Dismiss gesture.** Base UI's `Dialog` locks body scroll while open, so no
scroll event fires naturally — listen directly on the popup:

- `wheel` (passive): accumulate `deltaY`. Reset the accumulator to 0 after
  400ms of no events, so trackpad momentum from a previous flick doesn't leak
  into the next gesture. Fire when the accumulator exceeds **120px downward**.
- `touchstart` / `touchmove`: fire on a downward drag exceeding **80px**.
- Upward scroll does nothing — it is not "go back up a mode", it is simply
  ignored (and it resets the accumulator).
- `Escape` and the close button keep working unchanged. `ArrowLeft`/`ArrowRight`
  keep browsing.

**The flight.** Both rects are measurable, one DOM node is involved, and there
is no reparenting, so this is a plain FLIP with the Web Animations API — not
View Transitions. §8 already records why View Transitions are awkward against
React 19's async transitions here, and none of that complexity is needed:

1. On dismiss, `getBoundingClientRect()` the lightbox `<img>` (First).
2. `getBoundingClientRect()` the trigger element, held in a ref (Last).
3. If the trigger is outside the viewport, `scrollIntoView({ block: 'nearest' })`
   first, then re-measure.
4. `img.animate()` from the identity transform to the
   `translate(dx, dy) scale(s)` that maps First onto Last, 260ms,
   `cubic-bezier(0.22, 1, 0.36, 1)` — the site's existing ease-out expo.
5. Fade the backdrop and overlay chrome over the same duration.
6. Close the dialog on `finished`.

**Reduced motion.** Under `prefers-reduced-motion: reduce`, skip steps 1–5 and
close with the existing fade.

## B.4 Edge cases

| Case | Handling |
| --- | --- |
| The user browsed to a different image with the arrows | The on-screen image no longer corresponds to the trigger. Detect via `index !== initialIndex` and skip the flight — fade instead. Documented, not fixed: flying to an unrelated tile would be worse than a fade. |
| Trigger unmounted or scrolled far off-screen | `scrollIntoView` first; if the ref is null, fade. |
| The `bare` trigger (the "view still image" pill next to a video) | Its rect is a small pill, not an image — flying a full-bleed image into a pill looks broken. `bare` triggers always fade. |
| Aspect mismatch between First and Last | Both render the same source with `object-fit: contain`; scale from the *width* ratio and let `contain` absorb the rest. |
| Touch: a slow drag that never reaches 80px | Snaps back — animate the accumulated offset to 0 on `touchend`. |
| Rapid repeat gestures | Guard with an `isDismissing` ref so the animation can't be started twice. |
| Keyboard-only users | Unaffected: Escape, the close button, and arrow browsing all remain. The gesture is an enhancement, never the only way out. |
| Page scroll position after close | Restored by Base UI's own scroll lock; only `scrollIntoView` in step 3 may change it, and only when the trigger was off-screen. |
| Idle-fade chrome and accessibility | Fade `opacity` only — never `visibility: hidden` or `pointer-events: none` on the close button, so it stays reachable and focusable while invisible. Focus always brings chrome back. |

---

# C. Gallery sort (new — file as TODO §12)

## C.1 Findings

**There is no sort.** `filterWork` filters and returns items in array order;
`WorkGallery` renders that straight into `MasonryGrid`. The order is whatever
`REAL_WORK` in `lib/work.ts` happens to be, which is only loosely
chronological: collections first (2020, 2019, 2024, 2017, 2019, 2019…), then
standalone art roughly ascending 2019 → 2024, then all four writing items last
(2021, 2022, 2023, 2023). `april-colors-24` sits third; `inktober-17` fourth.

**There is no upload date anywhere.** `year` is the only temporal field — a
4-character string for when the *work* was made, not when it reached the site.
Sorting "by upload date" is therefore impossible without new data, which is why
`added` below is specced but not surfaced.

## C.2 `lib/work.ts`

```ts
export type SortMode = 'curated' | 'newest' | 'oldest'

export const SORT_MODES: SortMode[] = ['curated', 'newest', 'oldest']

export const SORT_LABEL: Record<SortMode, string> = {
  curated: 'in my order',
  newest: 'newest first',
  oldest: 'oldest first',
}

/** Authored position, so sorts stay stable and ties fall back to Beck's order. */
const CURATED_INDEX = new Map(WORK.map((item, i) => [item.slug, i]))

/**
 * Order a filtered result set. Never mutates its input. 'curated' is identity:
 * the hand-authored order in this file is a real editorial choice, so it stays
 * the default and the URL says nothing when it's active.
 */
export function sortWork(items: WorkItem[], mode: SortMode): WorkItem[] {
  if (mode === 'curated') return items
  const dir = mode === 'newest' ? -1 : 1
  return [...items].sort((a, b) => {
    const ya = Number.parseInt(a.year, 10)
    const yb = Number.parseInt(b.year, 10)
    // An unparseable year sorts last in either direction rather than poisoning
    // the comparator with NaN.
    if (Number.isNaN(ya) && Number.isNaN(yb)) return tie(a, b)
    if (Number.isNaN(ya)) return 1
    if (Number.isNaN(yb)) return -1
    if (ya !== yb) return (ya - yb) * dir
    return tie(a, b)
  })
}

function tie(a: WorkItem, b: WorkItem): number {
  return (CURATED_INDEX.get(a.slug) ?? 0) - (CURATED_INDEX.get(b.slug) ?? 0)
}
```

Also document, but **do not surface**, the future field:

```ts
/**
 * When the piece went on the site, ISO YYYY-MM-DD — distinct from `year`,
 * which is when the work was made. No item carries this yet; a 'recently
 * added' sort mode should only appear once at least one does.
 */
added?: string
```

## C.3 `components/work-gallery.tsx`

- Read it from the URL alongside the others, with the same
  unknown-value-falls-back shape as `mode`:
  ```ts
  const sort = useMemo<SortMode>(() => {
    const s = searchParams.get('sort')
    return SORT_MODES.includes(s as SortMode) ? (s as SortMode) : 'curated'
  }, [searchParams])
  ```
- Extend `commit()`'s `changes` with `sort?: SortMode | null`, following the
  `mode` precedent exactly: **`'curated'` is the default, so it never appears in
  the URL.**
- `results` becomes
  `sortWork(filterWork(WORK, { query, tags, mode }), sort)` in the same memo,
  with `sort` added to the dependency array.
- `reset()` clears it: `commit({ q: null, tags: null, mode: null, sort: null }, 'push')`.
- Control: a small button beside `VennMode` in the summary row, styled like the
  existing `reset` button, cycling curated → newest → oldest → curated on click,
  labelled with `SORT_LABEL[sort]` and an `ArrowDownUp` lucide icon.
  `aria-label={`Sort: ${SORT_LABEL[sort]}. Activate to change.`}`. Use `'push'`
  so back/forward step through sort changes, matching `cycleMode`.
- `activeCount` (which gates the reset button's visibility) should **not**
  count sort — sort is a view preference, not a filter, and the entry count
  line shouldn't imply results were removed.

## C.4 Edge cases

| Case | Handling |
| --- | --- |
| `?sort=banana` | Falls back to `curated`, exactly as `?mode=` does. |
| Ties within a year | Resolved by authored position, so Beck's order survives inside each year. Deterministic; no visual shuffling between renders. |
| Collections | Sort by the collection's own `year`, never by its children's. A 2017 collection sorts as 2017 even if a piece inside says otherwise. |
| Empty result set | Untouched — the empty state renders as it does now. |
| Server render / no JS | `?sort=` is read from `useSearchParams` in a client component, same as every other filter. No SSR change. |
| Re-sorting snaps rather than animates | Same root cause as TODO §8 (round-robin column assignment reparents cards). **Explicitly out of scope** — do not attempt FLIP here. |
| Piece pages and collection stacks | Unaffected. Sorting is a `/work` gallery concern only; prev/next inside a collection stays authored order. |

---

# D. WIP and duplicate art (TODO §11) — DEFERRED

**Do not implement.** Beck chose the process-stills direction but wants to talk
through the details. Recorded here so that conversation starts from something
concrete.

Confirmed by opening the files, 2026-08-28:
- `hand-study` is an in-app screenshot (tool palette, layer panel) of the hand
  that ships finished in `desire-and-distance`.
- `waterfowl-and-motherhood` is the same, reference photos included, of the
  duck that ships finished in `child-not-adult`.
- `security-camera` is **also** an in-app screenshot — toolbar, perspective-grid
  guides, red construction lines, canvas cropped at the right edge. Found in a
  sweep of all 24 standalone images; those three are the only ones with app
  chrome.

Sketched but unsettled:

```ts
/** Process shots for a finished piece — WIP captures, sketches, references. */
process?: { src: string; aspect?: string; caption?: string }[]
```

rendered as a small labelled strip under the finished image on the piece's page.

Open questions for Beck:
1. Does `security-camera` belong to `why-be-afraid` (shared surveillance/halftone
   subject, different composition), or is it its own unfinished piece?
2. Do the standalone entries get deleted? That removes two or three `/work/…`
   URLs and shrinks the gallery from 30 top-level items to 27.
3. Both confirmed pairs already ship a speedpaint video, which shows process
   better than one screenshot does. Is the still worth keeping at all?

---

# Out of scope (all workstreams)

- The `MasonryGrid` rewrite and any FLIP/view-transition animation of filter or
  sort changes (TODO §8, deliberately deferred).
- TODO §11 — see D above.
- Science content and `lib/content.ts` deletion (§1, §2), lint/tests (§3), the
  media and correctness loose ends (§4–§6), the tab glyph illustrations (§7).
- Sourcing any photograph from Instagram.
- Making essay bodies searchable.
- Migrating other content out of `lib/work.ts`; it stays the single source of
  truth for everything on `/work`.
- Changing `writeup` or `Prose` for the ~20 pieces carrying short process notes.
- Rendering MDX anywhere other than a top-level essay's own page.

# Acceptance

- `pnpm exec tsc --noEmit` clean; `next build` clean; static page count still
  203.
- `node scripts/check-essay-fidelity.mjs --archive <path>` exits 0 for all three
  essays.
- All three essays render their headings, lists, blockquotes, display blocks,
  and links in both themes, with no horizontal page scroll at 360px wide.
- The lightbox is visibly a different mode from the page; scrolling down inside
  it returns the image to its place; Escape and the close button still work;
  reduced motion degrades to a fade.
- `/work?sort=newest` and `?sort=oldest` reorder the gallery; `?sort=curated`
  and `?sort=` nonsense both render the authored order; reset clears sort along
  with everything else.

---

# Appendix — ARCHITECTURE.md entry to add **on ship**

ARCHITECTURE.md documents what is built, not what is planned (its own
Conventions rule: it is always the answer to "how does this work today"). So
this entry is drafted here and moves into that file when workstream A lands —
not before. Insert it in the **Content model** section, after the "`text` is the
written work; `description` is optional" paragraph.

> ### Essay bodies are MDX; everything else is a string
>
> `writeup` holds a plain string rendered as paragraphs by `Prose` — right for
> the ~20 short process notes that make up almost every write-up on the site.
> Three essays needed more than paragraphs: headings, emoji-bullet lists,
> blockquotes, centred verse blocks, and external links. Rather than grow
> `writeup` into a markup dialect, those bodies live as MDX in
> `content/essays/<slug>.mdx` and render through the components in
> `components/essay.tsx`.
>
> **Why MDX and not a richer string or a typed block union:** the source of
> truth for all three is Markdown in the archived 11ty site, so MDX keeps the
> import close to a copy, which is the whole point — these essays were flattened
> and re-worded once already because the target couldn't hold the source (see
> the "imported content is never rewritten" rule below). Hand-transcribing them
> into a TS block union would have reintroduced exactly that transcription step.
>
> **The server/client boundary is load-bearing.** `lib/work.ts` is imported by
> three client components (`work-gallery`, `image-lightbox`, `media-player`), so
> it stays plain serializable data — no component references, ever. The MDX map
> lives in `lib/essay-bodies.ts`, imported only by the two server page files.
> `lib/work.ts` carries `MDX_ESSAY_SLUGS`, a list of plain strings, so the
> client-side `hasWriteup()` can still badge an essay without importing the MDX
> runtime; `lib/essay-bodies.ts` asserts the two agree at build time.
>
> `mdx-components.tsx` at the repo root is required by `@next/mdx` under the App
> Router, and in Next 16 its `useMDXComponents` **takes no arguments** — older
> examples pass and merge a `components` parameter. `md`/`mdx` are deliberately
> absent from `pageExtensions`: essays are imports, not routes.

And in the **Content model** section, one line alongside the filter vocabulary
notes, once workstream C lands:

> **The gallery's default order is editorial.** `/work` renders `lib/work.ts`'s
> authored array order, and `sortWork`'s `curated` mode is identity — it is a
> real choice, not an accident, so it is the default and stays out of the URL.
> `newest`/`oldest` sort on `year` (when the work was made — there is no upload
> date in the data) and break ties by authored position, so Beck's order
> survives inside each year.
