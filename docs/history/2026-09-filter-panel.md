# Spec — filter panel: grouping, sort control, count, and five new tags

> **Status: built 2026-09-10.** Moved here from `docs/specs/` per §8.
>
> **Diverged the same day, at Beck's ask: the toolbar row is right-aligned,
> not left.** §2.2 below argues for a left edge running down the whole panel
> and puts `reset` last under `ml-auto`; the row now carries `justify-end`
> and `reset` is back at the head of the cluster, for the reason §2.2's own
> deleted comment gave — a control that comes and goes must not sit on the
> side everything else is pinned to. Everything else in §2.2 stands: four
> `h-8` controls, and `reset` holding its box when inactive rather than
> unmounting. The panel's border carries the grouping that edge alignment
> was standing in for.
>
> **Also diverged: `color` is gone, and §1.4 is closed.** §1.4 flagged the
> `color`-on-`april-colors-24` gap and said explicitly not to fix it during
> the build, which held — it shipped untouched. Beck then answered it the same
> day by retiring `color` altogether rather than extending it to a second
> item, so `theme` is five tags (`animals`, `identity`, `politics`,
> `heartbreak`, `language`), not the six §1.1 lists, and `april-colors-19`'s
> array is `['art', 'animals', 'series']`. See TODO.md §24.
>
> **Also diverged: `VennMode`'s mode label is `hidden` below `sm`.** §7 put
> the venn out of scope beyond its `h-8`, and that held through the build.
> The right-alignment above then exposed a pre-existing bug — the label was
> `opacity-0` rather than hidden at phone widths, so on a device with no
> hover it occupied a word's width of permanently invisible space, which the
> old left alignment had made invisible too.
>
> **Also diverged: the toolbar row was tightened and the tier toggle now
> merges adjacent selections into one shape.** Beck's ask, live on the
> narrow-width toolbar right alignment created: below ~350px the row split
> onto two lines, and the largest single cause — measured, not guessed — was
> the invisible `reset` button's own reserved box (87px of the row's ~320px
> budget). Three changes, verified against a live Playwright render rather
> than estimated:
>
> - `ResetButton` and `SortToggle` both tightened (`px-3` → `px-2.5`), and
>   `reset`'s label moved off `text-sm lowercase` onto the same
>   `text-[0.7rem] uppercase tracking-wider` idiom `SortToggle` and
>   `VennMode`'s label already use — what Beck called "small caps" turns out
>   to already be this site's vocabulary for it (`eyebrow` in
>   `lib/heading-styles.ts`), not literal CSS `font-variant: small-caps`.
> - `TierRow`'s three buttons shrank from `p-1.5` (≈26px boxes) to a fixed
>   `h-6 w-6` (24px), still touching with no gap, same as before.
> - The toolbar now fits one line down to ~350px (was ~370, worse before
>   that since `reset`'s invisible box hadn't shrunk yet), and never exceeds
>   two lines above ~210px of available width — below real device range, so
>   no explicit "reshuffle beyond two lines" mechanism was built. Recorded as
>   a finding, not silently assumed.
>
> **`TierRow` also gained a real gooey merge**, not the segmented-control
> "shared flat edge" look — an SVG `feGaussianBlur` + steep `feColorMatrix`
> contrast filter (`TierGoo`) applied to a second, invisible copy of the row
> that carries only fill color; the real buttons sit on top, transparent,
> carrying the icons. Two *adjacent* selected tiers blur together and the
> contrast snaps the blurred seam back to a hard edge, so they read as one
> continuous blob; a lone selection, or two selections with an unselected one
> between them, still render as plain circles — confirmed against
> screenshots of all three cases, not just the adjacent-pair case that
> prompted the ask.
>
> **Also diverged, and the largest one: the chip block's reservation moved
> outside the panel border, which now needs one small measurement hook.**
> §2.4 specifically argued for zero measurement ("no breakpoints and no
> measurement") — true of the mechanism it describes, and that held for a
> while. But packing both chip rows together (an earlier divergence, above)
> and reserving for the *global* widest state (§1.2's `MAX_DISCIPLINE_CHIPS`,
> unchanged) compound: with 0–1 disciplines selected — the common case, and
> the default — the gap between what's reserved and what's shown is often a
> full extra line, rendered as blank space *inside* the bordered panel. Beck
> saw it at 451px and it reads exactly like a missing row of chips, not
> breathing room.
>
> The fix keeps the zero-shift guarantee exactly as specified (verified: the
> count/grid's position is bit-for-bit identical across every toggle
> sequence, at every width tested) but relocates *where* the reserved space
> renders. The ghost (`chipGhostRef`) is now `absolute`, so it measures the
> widest state without inflating anything; the real content (`chipRealRef`)
> is normal flow, so the panel's own border now hugs it exactly. The gap
> between the two heights (`chipSlack`, a `useLayoutEffect` + `ResizeObserver`
> pair) becomes ordinary margin *between* the panel and the count instead of
> blank space *inside* it — same pixels, same total reserved height, but
> legible as panel spacing rather than as absent content.
>
> This is the one piece of this build that touches §2.4's "no measurement"
> claim. It's client-only measurement of two elements' own rendered heights
> (not a hardcoded guess, and not measuring anything outside this component),
> and it settles in `useLayoutEffect` before the browser's first paint of
> this block — `WorkGallery` is `'use client'` behind a bare-placeholder
> `<Suspense>` (`app/work/page.tsx`), so there's no server-rendered version of
> this content to flash before the measurement corrects it. Verified, not
> assumed: no flash was visible in any of the screenshots taken while
> checking this.
>
> **One more pass the same day: the reservation splits down the middle**
> (`chipSlackInside` / `chipSlackOutside`), rather than sitting entirely
> outside the border. All-outside made the border cut off flush against the
> last chip row — correct, but tight enough to look slightly abrupt on that
> one edge versus the panel's own padding on the other three. Half stays
> inside as the panel's own bottom padding (so the border reads as generous,
> not clipped); half stays outside as margin before the count, same as
> before. Both numbers derive from the same `chipSlack` measurement and
> always sum back to it exactly, so the zero-shift guarantee is unaffected —
> verified again after the split, same method as above (the count's position
> is bit-for-bit identical across every toggle sequence, at every width
> tested).
>
> **Also the same day, unrelated to any of the above: the page's `work`
> eyebrow (the `LayoutGrid` icon + tracked-uppercase label above the panel)
> was removed on Beck's ask** — `app/work/page.tsx` now renders only the
> `sr-only` `<h1>` and drops straight into the gallery, no separate header
> row. Not part of this spec's scope; noted here only because it's the same
> file family and the same day.
>
> **Also diverged: the §2.4 height reservation wraps both chip rows, not just
> the discipline row.** The mechanism is unchanged — an inert ghost of the
> widest possible state, real rows absolutely positioned over it — but it now
> covers the discipline row *and* the universal row together. Reserving only
> the first row, as §2.4 specifies, puts the slack between the two: at phone
> widths the ten-chip maximum needs four lines, so three empty lines opened
> under three visible discipline chips. §2.5's "needs no reservation — it is
> already its own maximum" is still true of the universal row on its own; it
> is included in the ghost so the ghost measures the whole block.
>
> *Originally filed as: designed 2026-09-10 with Beck, not built.*
>
> The `/work` filter area reads as three unrelated things stacked on top of
> each other: a search field, a loose row of tag chips, and — below a
> horizontal rule, stranded at the opposite end of a `justify-between` row
> from the count — a cluster of wordless toolbar glyphs. Everything in it
> filters, but nothing about the layout says so.
>
> This spec puts the whole apparatus inside one bordered panel, reorders it
> (toolbar, then search, then chips), moves `28 of 28 entries` out of the
> panel to sit directly above the grid as the caption for the results,
> replaces the `↓↑ newest first` button with a down arrow beside a stacked
> `NEW`/`OLD` pair that flips on click, and adds five tags to the vocabulary
> (`animals`, `identity`, `politics`, `heartbreak`, `series`) with the
> per-item assignments Beck approved.
>
> Touches `lib/work.ts` (vocabulary + item tags) and
> `components/work-gallery.tsx` (the panel). No new files, no new route, no
> CSS file changes, no changes to `lib/work.sample.ts`.
>
> **Picks up what
> [2026-09-gallery-chrome-declutter.md](../specs/2026-09-gallery-chrome-declutter.md)
> §6 explicitly deferred** ("the filter bar — `TagChip`/`TagRow`, `TierRow`,
> `VennMode`, the sort and reset buttons"). That spec's card/corner work is
> untouched here.
>
> **Explicitly out of scope** (see §7): card chrome, collection-page tiles,
> a column-width toggle, any flip *animation* on the sort control, the
> `and`/`or`/`not` venn's own behaviour, and the `color`-on-`april-colors-24`
> tagging gap (§1.4 — flagged, deliberately not fixed).

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| Are the tag chips and the toolbar glyphs grouped? | **Yes — one bordered panel holds all of it** | Beck, 2026-09-10 |
| What order, inside the panel | **Toolbar, then search, then chips.** The toolbar moves from below the rule to the very top; the rule stops existing as a rule and becomes the panel's bottom border | Beck, 2026-09-10 |
| Does the panel have a fill? | **No — border only.** The three discipline wash gradients (`WASH_TONE`, rendered at `z-0` behind the content) must stay visible through the panel; a fill would occlude them. The search field keeps its `bg-card`, which is what makes it read as an inset field against the unfilled panel | This spec |
| Where `28 of 28 entries` goes | **Below the panel, above the masonry, left-aligned.** It stops being a control and becomes the caption for the grid | Beck, 2026-09-10 |
| Sort control shape | **A down arrow with `NEW` and `OLD` stacked to its right; the words swap on click** | Beck, 2026-09-10 |
| Sort control emphasis | **Top word is foreground/semibold, lower word is `text-muted-foreground`.** The arrow never changes direction — it is the reading direction of the stack, not a state | Beck, 2026-09-10 |
| Sort control casing | **Both words uppercase.** The option Beck picked was labelled "uppercase"; its ASCII preview rendered the dimmed word lowercase, which was a slip in the preview, and the adjacent option existed specifically to offer all-lowercase and was not chosen. Uppercase both, dimming carries the state | Beck, 2026-09-10 (ambiguity resolved by this spec) |
| New tags | **`animals`, `identity`, `politics`, `heartbreak`, `series`** | Beck, 2026-09-10 |
| Tags proposed and declined | **`the body`, `nature`, `faith`** — offered with item lists, not chosen. Do not re-add without a fresh decision | Beck, 2026-09-10 |
| Where `series` lives | **A new `format` universal facet, not `theme`** — it describes how a project was made (a prompt list, one a day), not what it is about | This spec, from Beck's note that it's a format |
| What stops the panel from shuffling | **Nothing in it ever moves.** Beck's existing reserved-height rule for the chip row is extended to the whole panel: the chip row reserves its maximum via an inert ghost row, and `reset` holds its space when inactive instead of unmounting | Beck's stated rationale, extended by this spec |
| `color` on `april-colors-24` | **Flagged, not fixed.** A month of watercolor colour prompts carries `watercolor` but not `color`, while `april-colors-19` carries `color`. That looks like a gap, but tagging is Beck's call and it wasn't among the five approved. See §1.4 | This spec |

---

## 1. Vocabulary — `lib/work.ts`

### 1.1 Facets

`UNIVERSAL_FACETS` gains four theme tags and one new facet. Ordering inside
`theme` is deliberately most-populated first, so the always-visible row reads
big-to-small rather than in the order tags happened to be added.

```ts
/** Categories that apply to every piece regardless of discipline. */
export const UNIVERSAL_FACETS: Facet[] = [
  { name: 'theme', tags: ['animals', 'identity', 'politics', 'heartbreak', 'color', 'language'] },
  // `series` is a *format*, not a theme: a prompt list answered one a day.
  // Five of the eight collections are one; the other three (eye-studies,
  // i-think-that-im, love-worth-heartbreak) are not, so this is an authored
  // distinction rather than something derivable from `isCollection`.
  { name: 'format', tags: ['series'] },
]
```

`ALL_TAGS` derives from `DISCIPLINES` + `DISCIPLINE_FACETS` + `UNIVERSAL_FACETS`
and needs **no edit** — it picks all five up automatically, which is what gates
both the chip list and the `?tags=` parser.

`DISCIPLINE_FACETS` is **unchanged**. No new medium, form, or field.

### 1.2 New export: the chip row's maximum set

The chip row reserves height by rendering an invisible copy of its widest
possible content (§2.4). Both the real row and the ghost must derive from one
source or they will silently drift apart:

```ts
/**
 * Every discipline chip plus every discipline-only subtag, in the order the
 * filter panel lays them out — i.e. exactly what the chip row shows when all
 * three disciplines are selected at once, which is its widest possible state.
 * The panel renders this inertly as an invisible height reservation, so the
 * row never grows or shrinks as disciplines are toggled. Deriving it here
 * rather than in the component keeps the reservation and the real row from
 * drifting apart.
 */
export const MAX_DISCIPLINE_CHIPS: readonly string[] = DISCIPLINES.flatMap(
  (d) => [d as string, ...DISCIPLINE_FACETS[d].tags],
)
```

Currently 10 entries: `art, watercolor, digital, ink, writing, poem, essay,
science, biology, code`.

### 1.3 Item data edits

Twenty-three top-level items gain tags. Nothing is removed. Line numbers are
against the tree as of 2026-09-10; match on `slug` if they have drifted.

| line | slug | tier | tags become |
| --- | --- | --- | --- |
| 678 | `hthtpw` | general | `['art', 'animals', 'politics', 'series']` |
| 745 | `april-colors-19` | favorite | `['art', 'color', 'animals', 'series']` |
| 1059 | `april-colors-24` | favorite | `['art', 'watercolor', 'animals', 'identity', 'series']` |
| 1376 | `inktober-17` | general | `['art', 'ink', 'animals', 'heartbreak', 'series']` |
| 1463 | `i-think-that-im` | general | `['art', 'digital', 'identity']` |
| 1507 | `one-flesh` | favorite | `['art', 'animals']` |
| 1519 | `rabbit-in-the-moon` | general | `['art', 'digital', 'animals']` |
| 1544 | `transparent-eyeball` | general | `['art', 'digital', 'identity']` |
| 1566 | `honey` | general | `['art', 'digital', 'identity']` |
| 1658 | `mindtober-21` | general | `['art', 'ink', 'series']` |
| 1952 | `womens-history-month` | general | `['art', 'politics']` |
| 1963 | `protest-sign` | general | `['art', 'politics']` |
| 1973 | `painted-mug` | archive | `['art', 'politics']` |
| 1985 | `adoption-minizine` | general | `['art', 'writing', 'identity']` |
| 1996 | `presidential-pardon` | general | `['art', 'digital', 'animals', 'politics']` |
| 2006 | `child-not-adult` | general | `['art', 'digital', 'identity']` |
| 2026 | `why-be-afraid` | archive | `['art', 'politics']` |
| 2051 | `equanimity-or-apathy` | general | `['art', 'digital', 'heartbreak']` |
| 2062 | `security-camera` | archive | `['art', 'politics']` |
| 2073 | `desire-and-distance` | general | `['art', 'digital', 'heartbreak']` |
| 2089 | `projection` | general | `['art', 'digital', 'identity']` |
| 2101 | `love-worth-heartbreak` | general | `['writing', 'poem', 'identity', 'heartbreak']` |
| 2348 | `delirium` | general | `['art', 'science', 'code', 'animals']` |

**Deliberately unchanged:** `rex-materialistarum`, `eye-studies`, `lady-bird`,
`chinese-emoji-poetry`, `first-art-fair`, `note-systems`, `transformation`,
`colony-selection`, `designing-dna`.

Only top-level items are tagged. Nested `WorkPiece.tags` are **not** touched —
`itemTags()` already unions a collection's children into it, so tagging the
collection is sufficient and tagging 163 pieces individually is not.

**Resulting counts** (non-archive, the default browse), which double as the
acceptance check:

| tag | non-archive | incl. archive |
| --- | --- | --- |
| `animals` | 8 | 8 |
| `identity` | 8 | 8 |
| `series` | 5 | 5 |
| `politics` | 4 | 7 |
| `heartbreak` | 4 | 4 |

Every new tag matches at least four items, which keeps
[ARCHITECTURE.md](../ARCHITECTURE.md)'s "the vocabulary matches the data" rule
intact — no tag is added ahead of work that carries it.

### 1.4 Open, deliberately unfixed: `color` on `april-colors-24`

`april-colors-19` carries `color`; `april-colors-24` — a month of watercolour
*colour* prompts, whose piece captions are about palettes, neutrals, viridis,
and least-favourite colours — does not. `color` therefore reads as a 1-item
tag when it is plausibly a 2-item one.

**Do not fix this as part of the build.** Beck approved five specific tags and
this was not one of them; tagging is authorial. Raise it, don't patch it.

### 1.5 Ripples

- **Piece pages get more tag links, for free.** `app/work/[slug]/page.tsx:118`
  renders `<TagLinks tags={Array.from(itemTags(item))}>`, so e.g.
  `/work/inktober-17` now shows five chips instead of two, each linking to
  `/work?tags=<tag>`. Intended. `TagLinks` (`work-visuals.tsx:892`) styles any
  non-discipline tag neutrally via `tagTone()` returning `null`, so no new
  colour work is needed.
- **`categoryLabel()`** (`work-visuals.tsx:69`) reads `DISCIPLINE_FACETS`
  only. Unaffected.
- **`mediumFor` / `formFor` / `toneFor` / `tagTone`** — all read disciplines
  or discipline facets. Unaffected.
- **`?tags=` URLs already in the wild** keep working; this is purely additive.

---

## 2. The panel — `components/work-gallery.tsx`

Replaces the current render block (`work-gallery.tsx:1071–1153`): the bare
search `<div>`, the `TagRow` with `mt-4 min-h-[4.75rem]`, and the
`mt-8 … border-t … justify-between` summary row.

### 2.1 Structure

```
<div className="relative z-10">
  ┌─ FILTER PANEL ─────────────────────────────────────────┐
  │  §2.2  toolbar row   [tiers] [sort] [venn] ···· [reset] │
  │  §2.3  search row    ⌕ search titles, descriptions…     │
  │  §2.4  chip row 1    disciplines (+ subtags), reserved  │
  │  §2.5  chip row 2    universal tags, fixed              │
  └────────────────────────────────────────────────────────┘
  §4     count           28 of 28 entries
         MasonryGrid / empty state
</div>
```

The panel element:

```tsx
<div className="rounded-2xl border border-border p-3 sm:p-4">
  {/* §2.2 toolbar, §2.3 search, §2.4/§2.5 chips */}
</div>
```

- `rounded-2xl` matches the empty state's shell (`work-gallery.tsx:1165`).
- **No background.** See §0 — the discipline wash must show through.
- **No internal rules.** The panel already groups; a divider inside it would
  re-fragment what this spec exists to join. Vertical rhythm is spacing only:
  `space-y-3 sm:space-y-4` on the panel, and `gap-1.5` between the two chip
  rows so they read as one block rather than two.

### 2.2 Toolbar row

```tsx
<div className="flex flex-wrap items-center gap-3">
  <TierRow tiers={tiers} onToggleTier={toggleTier} />
  <SortToggle sort={sort} onToggle={cycleSort} />
  <VennMode mode={mode} onCycle={cycleMode} />
  <ResetButton active={activeCount > 0} onClick={reset} className="ml-auto" />
</div>
```

**`reset` moves from first to last, and stops unmounting.** The existing
comment at `work-gallery.tsx:1126` explains that `reset` sits *left* of
`TierRow` so that its appearing and disappearing shifts nothing to its right —
which only worked because the cluster was right-aligned. The cluster is now
left-aligned (one clean left edge runs down the whole panel through the chips
and the count), so that trick inverts: `reset` goes last, pinned right by
`ml-auto`, where nothing follows it to be pushed.

That is not sufficient on its own — at narrow widths, adding a button can
force the row to wrap and push the search field down. So `reset` **always
occupies its space** and only changes visibility:

```tsx
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
        'font-brand inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-sm lowercase text-muted-foreground transition-colors hover:border-goldenrod hover:text-foreground',
        !active && 'invisible',
        className,
      )}
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      reset
    </button>
  )
}
```

**All four controls are exactly `h-8` (2rem)** so the row is optically even.
`TierRow` already computes to 2rem (`p-0.5` shell + `p-1.5` buttons + `h-3.5`
icons + border) — add an explicit `h-8` anyway so a future padding change
can't silently break the alignment. `VennMode` gains `h-8`. `ResetButton` and
`SortToggle` swap `py-1.5` for `h-8`.

The empty-state `reset everything` link (`work-gallery.tsx:1185–1190`) is untouched
and keeps calling the same `reset` callback.

### 2.3 Search row

Unchanged from `work-gallery.tsx:1071–1096` — same `<input>`, same `Search`
icon, same clear `<X>` button, same `bg-card` fill, same 250 ms debounce. It
simply moves below the toolbar row and loses its `relative` wrapper's outer
margin (spacing comes from the panel's `space-y-*`).

Keep `bg-card`: against the unfilled panel over `--background`, `--card` is
the lighter of the two in both themes (`#f3f4f0`/`#e7eae4` light,
`#0c1a3a`/`#080b24` dark), which is what makes the field read as a field.

### 2.4 Chip row 1 — disciplines, height reserved

`filterTags` (currently `work-gallery.tsx:1021–1029`) narrows to disciplines
and their subtags only; the universal tags move to row 2:

```ts
const disciplineChips = useMemo(() => {
  const tags: string[] = []
  for (const d of DISCIPLINES) {
    tags.push(d)
    if (selectedTags.has(d)) tags.push(...DISCIPLINE_FACETS[d].tags)
  }
  return tags
}, [selectedTags])
```

Beck's reason for the reserved space stands — toggling a discipline must not
shuffle anything below it — but the current `min-h-[4.75rem]` is a hardcoded
guess at two lines that is wrong at most widths: at `max-w-6xl` the ten-chip
maximum fits on one line (dead air), and on a 375 px phone it needs four
(the row grows anyway, and things shuffle).

**Replace the magic number with a ghost row.** An inert, invisible copy of
`MAX_DISCIPLINE_CHIPS` sits in flow and sets the wrapper's height; the real
row is absolutely positioned over it. The reservation is then correct at every
viewport with no breakpoints and no measurement:

```tsx
<div className="relative">
  {/*
    Height reservation, not content. Renders the chip row's widest possible
    state — every discipline selected, so every subtag showing — so the
    wrapper is always as tall as the row can ever get and the real row,
    absolutely positioned on top, can grow and shrink inside it without
    moving anything below. Replaces a hardcoded `min-h`, which could only
    ever be right at one viewport width.

    This holds only while active and inactive `TagChip`s are the same size —
    they share every box class today and differ only in colour. If that ever
    stops being true, the reservation stops being an upper bound.
  */}
  <div inert aria-hidden="true" className="invisible" >
    <TagRow tags={MAX_DISCIPLINE_CHIPS} selectedTags={EMPTY_TAG_SET} onToggleTag={noop} />
  </div>
  <TagRow
    tags={disciplineChips}
    selectedTags={selectedTags}
    onToggleTag={toggleTag}
    chipTone={(tag) => subtagTone.get(tag)}
    className="absolute inset-0 content-start"
  />
</div>
```

with module-level constants beside the component, so neither identity changes
between renders:

```ts
const EMPTY_TAG_SET: Set<string> = new Set()
const noop = () => {}
```

`TagRow` itself is **unchanged** — same signature, same `flex flex-wrap
gap-1.5`.

### 2.5 Chip row 2 — universal tags, fixed

```tsx
<TagRow
  tags={universalChips}
  selectedTags={selectedTags}
  onToggleTag={toggleTag}
  className="content-start"
/>
```

```ts
// Every universal tag, theme facet then format facet. Never changes, so
// unlike row 1 this needs no reservation — it is already its own maximum.
const universalChips = useMemo(() => UNIVERSAL_FACETS.flatMap((f) => f.tags), [])
```

Seven chips today: `animals, identity, politics, heartbreak, color, language,
series`. They render flat, in facet order, with no label and no separator —
the panel has never labelled its facets and this spec does not start.

`chipTone` is deliberately **not** passed: universal tags are neutral, and
`subtagTone` only ever holds discipline subtags.

---

## 3. `SortToggle` — `components/work-gallery.tsx`

Replaces the `ArrowDownUp` + `SORT_LABEL[sort]` button at
`work-gallery.tsx:1142–1150`. Lives inline in `work-gallery.tsx` beside
`TagChip`, `TierRow`, and `VennMode`, matching where every other small gallery
control lives.

```tsx
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
        'font-brand inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-muted-foreground transition-colors hover:border-goldenrod hover:text-foreground',
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
```

- **Import change:** `ArrowDownUp` → `ArrowDown` in the `lucide-react` import
  at `work-gallery.tsx:18`. `ArrowDownUp` has no other use in the file.
- `text-[0.7rem] uppercase tracking-wider` is lifted verbatim from
  `VennMode`'s mode caption (`work-gallery.tsx:206`), so the two wordless
  controls beside each other use one type treatment. `leading-[1.15]` puts
  two lines at ≈1.61 rem inside the button's 1.875 rem of interior height.
- **No transition on the swap.** `transition-colors` covers the hover border
  only. See §7.
- `SORT_LABEL` and `SORT_MODES` in `lib/work.ts` are **unchanged** —
  `SORT_LABEL` still supplies the accessible name, and `cycleSort`
  (`work-gallery.tsx:860`) still works unmodified as a two-element cycle.

---

## 4. The count

Moves out of the panel and sits directly above the grid. Same text, same
tokens, same `selectedTags` suffix — only its position and its wrapper change.

```tsx
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
```

Then `MasonryGrid` / the empty state drop from `mt-6` to `mt-3`, since the
count now sits between them and the panel.

The old `border-t border-border/70` is **deleted, not moved** — the panel's
bottom border is the rule now.

---

## 5. File/module structure summary

| File | Change |
| --- | --- |
| `lib/work.ts` | `UNIVERSAL_FACETS` gains 4 theme tags + a `format` facet (§1.1); new `MAX_DISCIPLINE_CHIPS` export (§1.2); 23 item `tags` arrays edited (§1.3). `ALL_TAGS`, `DISCIPLINE_FACETS`, `SORT_MODES`, `SORT_LABEL`, `FILTER_MODES`, every filter/sort function: unchanged |
| `components/work-gallery.tsx` | New `SortToggle` (§3) and `ResetButton` (§2.2); `ArrowDownUp` → `ArrowDown` import; `filterTags` → `disciplineChips` + `universalChips`; render block rebuilt as the panel (§2); count relocated (§4); `TierRow`/`VennMode` gain `h-8` |
| `components/work-visuals.tsx` | **None.** `TagLinks` and `categoryLabel` absorb the new tags with no edit (§1.5) |
| `app/work/[slug]/page.tsx` | **None.** More tag links appear automatically (§1.5) |
| `lib/work.sample.ts` | **None.** Dev-only scaffolding; its unknown tags are already dropped by the `ALL_TAGS` gate |

New files: none. Deleted: none.

---

## 6. Edge cases

| Case | Behaviour |
| --- | --- |
| **All three disciplines selected at once** | Chip row 1 shows all 10 of `MAX_DISCIPLINE_CHIPS` — exactly the ghost's content, so the real row fills the reservation exactly and nothing overflows. This is the reservation's upper bound by construction |
| **No disciplines selected** | Chip row 1 shows 3 chips pinned to the top of the reserved box by `content-start`; the rest is empty space, which is the point |
| **Viewport narrow enough that row 1 wraps to 4 lines** | The ghost wraps identically at the same width, so the reservation is still exact. This is the whole reason it replaced `min-h-[4.75rem]` |
| **Toolbar row wraps at very narrow widths** | `flex-wrap` handles it; `reset` keeps `ml-auto` and lands right-aligned on its own line. Stable, because `reset` occupies its space whether or not it is active — the wrap point never changes with `activeCount` |
| **`activeCount === 0`** | `reset` is `invisible` + `inert` + `aria-hidden` + `tabIndex={-1}`: not clickable, not tabbable, not announced, still occupying its box |
| **Every tier switched off (`?tiers=`)** | Unchanged. `results.length` is 0, the count reads `0 of 28 entries`, and the empty state's tiers-first copy (`work-gallery.tsx:1176`) still wins. The count now sits above that empty state rather than beside the controls |
| **`?tags=` naming an unknown tag** | Unchanged — `ALL_TAGS.includes` filters it out at parse time (`work-gallery.tsx:738`). The five new tags simply become known |
| **`?tags=animals` deep link** | Works with no code change. Default `mode` is `and` with one tag, so it behaves as a plain "show me these 8" |
| **Turning a discipline off while its subtag is selected** | Unchanged — `toggleTag` still clears that discipline's subtags (`work-gallery.tsx:846`). Universal tags are never cleared this way, and none of the five new tags belongs to a discipline facet |
| **A `series` chip combined with `not` mode** | Behaves like any other tag: `filterWork`'s `!tags.some(has)` excludes the 5 series collections. No special case |
| **`active` vs inactive `TagChip` sizing** | They must stay identical, or the ghost stops being an upper bound. They share every box class today (`px-3 py-1 text-sm`, same border width) and differ only in colour — see the comment required in §2.4 |
| **A collection whose child carries a tag the collection does not** | Unchanged — `itemTags()` unions children in, so the collection still matches. §1.3 tags collections only, relying on this |
| **`prefers-reduced-motion`** | Nothing new to honour: the sort flip is instant and the panel has no entrance animation |
| **Screen-reader pass over the toolbar** | Four controls, four accessible names: `Which work to show` (the `TierRow` group), `Sort: newest first. Activate to change.`, `Tag combine mode: and…`, `reset`. Every glyph inside them is `aria-hidden` |

---

## 7. Out of scope

- **Any animation on the sort flip.** "Flip on click" describes the swap, not
  a rotation. The words change instantly. Do not add a `rotateX` transition,
  a crossfade, or a slide.
- **The venn's behaviour.** `VennMode` gains `h-8` for row alignment and
  nothing else — the and/or/not cycle, the SVG, and the hover-revealed label
  are untouched.
- **The `color`-on-`april-colors-24` gap.** Flagged in §1.4. Not fixed.
- **`the body`, `nature`, `faith`.** Proposed with item lists and declined.
- **Nested `WorkPiece.tags`.** Only the 23 top-level items in §1.3 change.
- **Card chrome** — `StatusRail`, the title/medium panel, `TagPill`, the
  speedpaint glyph. All of that is
  [2026-09-gallery-chrome-declutter.md](../specs/2026-09-gallery-chrome-declutter.md)'s
  and is finished or in flight there.
- **Collection-page tiles**, the chapbook stack, and a column-width toggle —
  still deferred, as in that spec's §6.
- **The empty state.** Its copy, its icon, and its inline `reset everything`
  link are unchanged; only its top margin moves (§4).
- **Sort modes themselves.** Still exactly `newest | oldest`. The retired
  `curated` mode stays retired.

---

## 8. Docs to update on landing

- **[ARCHITECTURE.md](../ARCHITECTURE.md)** — the "Content model" section
  states `theme` is down to `color` and `language` and `field` to `biology`
  and `code`, as the record of the 2026-09-02 pruning. That is now stale for
  `theme`. Amend it in place rather than deleting the pruning note: the rule
  it established ("the vocabulary matches the data") is *upheld* here — five
  tags go in alongside the twenty-three items that carry them, which is
  exactly "a new one goes in when the piece that needs it does." Record that
  `theme` is now six tags and that a `format` facet exists.
- Also in ARCHITECTURE.md: the `work-gallery.tsx` line in the component
  inventory ("the `/work` client island: filter panel, URL state, …") stays
  accurate; no edit needed.
- **[TODO.md](../TODO.md)** — close whatever tracked the filter bar, and open
  a line for §1.4 (`color` on `april-colors-24`, Beck's call).
- Move this file to `docs/history/` once built, following the convention the
  other shipped specs use.
