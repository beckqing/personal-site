# Spec — tiers and pins

> **Status: designed 2026-09-09 with Beck, not built.**
>
> Two independent mechanisms for the same complaint: the gallery shows all 32
> entries at one volume, so there is no way to say *start here* and no way to
> let a piece recede without deleting it. **`tier` is a property of the work**
> (favorite / general / archive). **`PINNED` is a scarce position on a page**
> (at most one per masonry column). They are specified together because they
> came out of one conversation and touch the same three files, but they share
> no code and either can ship alone.
>
> Depends on the retired `curated` sort, which **shipped 2026-09-09** — the
> gallery now defaults to `newest` and `SortMode` is `newest | oldest` (see
> TODO §12's amendment and ARCHITECTURE's "The gallery's default order is
> chronological"). §3 relies on chronological order being the default.
>
> Touches `lib/work.ts`, `components/work-gallery.tsx`,
> `components/masonry-grid.tsx`, and `components/work-visuals.tsx`.
> No CSS change. No new route. No new page region — see §9.A.
>
> Supersedes nothing. **§7 is a prerequisite finding, not part of the
> mechanism**: `mindtober-21`'s poems are untagged, and it must not be
> assigned a tier until that is fixed, or it gets archived on the strength of
> a presentation bug.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| The scale's vocabulary | **`favorite` / `general` / `archive`** — not stars, not numbered tiers | Beck, 2026-09-09 |
| Whether pins are the scale's top rung | **No — pins are a separate mechanism.** A cap of three favorites would be wrong, and a rotating pin list must not rewrite what Beck thinks of the work | Beck, 2026-09-09 |
| Which tiers render | **Both named ends — `favorite` and `archive`.** `general`, the unset default, renders nothing — §2.2 | Beck, 2026-09-09 ("useful to mark things archived") |
| How many pins | **One per masonry column** — 3 at `lg`, 2 below it | Beck, 2026-09-09 |
| A separate "start here" band above the grid | **Rejected.** Beck: "I don't like it completely separate / above the grid" | Beck, 2026-09-09 |
| Featured pieces as larger tiles | **Rejected — not expressible.** All tiles are one grid track wide and nothing can span columns; §11.B | §11.B |
| What "only if you dig" means | **Out of the default browse; present in search, tag filters, and by direct link.** Searching *is* digging | Beck, 2026-09-09 + §4 |
| Whether pins survive a filter or a sort change | **No — pins hold only in the default view.** §3.3 | §3.3 |
| Whether `tier` affects the home page | **No.** `app/page.tsx` hand-picks by slug on purpose so that adding work never silently changes the home page | Existing decision, `app/page.tsx:52-58` |
| Which pieces get which tier, and which three are pinned | **Open — Beck's to write.** §10 | — |

---

## 1. Why two mechanisms and not one

The first draft of this design made pinning the top rung of the scale
(`pinned | shown | deep`). Beck rejected it, correctly, and the reason is
worth recording because it is the whole shape of the spec:

- **A favorite is durable and unbounded.** It is a fact about the work. Beck
  may have eight favorites. Nothing about the number three is meaningful to
  it.
- **A pin is scarce and positional.** There are exactly as many pins as there
  are masonry columns, because that is the only count the layout can express
  (§3.1). It is a fact about *this week's front page*, not about the work.

Fusing them forces two false statements: that Beck has at most three
favorites, and that un-pinning a piece is a downgrade. Keeping them separate
also means the pin list can churn freely — a seasonal rotation — without
touching a single piece's data.

They compose without interacting. A pin may be a favorite; a favorite need
not be pinned. The one illegal combination is a pinned `archive` piece, which
§5.3 makes a build error.

---

## 2. `tier`

### 2.1 The field

```ts
export type WorkTier = 'favorite' | 'general' | 'archive'
```

On `WorkPiece`, alongside `unfinished`:

```ts
  /**
   * Where this piece sits in Beck's own regard. `favorite` is work worth
   * leading with; `archive` stays out of the default browse; `general` (the
   * default when unset) is everything else.
   *
   * Both named ends render a badge; `general` renders nothing — see
   * docs/specs/2026-09-tiers-and-pins.md §2.2. An `archive` badge names
   * where a piece sits, not how good it is, and appears only where archived
   * work is actually shown.
   *
   * Distinct from `PINNED`, which is a page position rather than a property
   * of the work.
   */
  tier?: WorkTier
```

Unset means `general`, so **no existing piece needs editing to adopt this.**
That matters: 32 top-level entries and ~134 pieces, and the field is only
worth having if partial adoption is legal.

Helpers, beside `hasWriteup`/`isCodeDemo`:

```ts
export function tierOf(item: WorkItem): WorkTier {
  return item.tier ?? 'general'
}
export function isFavorite(item: WorkItem): boolean {
  return tierOf(item) === 'favorite'
}
export function isArchived(item: WorkItem): boolean {
  return tierOf(item) === 'archive'
}
```

`tier` sits on `WorkPiece`, so a piece *inside* a collection can carry it.
Only the top-level reading is specified here — §10.6 is the open question of
whether a collection's own tier should derive from its children's.

### 2.2 What renders — both named ends, not the middle

| Tier | Mark on the card | In the default grid |
| --- | --- | --- |
| `favorite` | **Yes** — §6 | Yes |
| `general` | **No** | Yes |
| `archive` | **Yes** — §6, and only while archived items are shown | **No** — §4 |

The rule is that **the two named ends are legible and the unmarked default is
silent.** `general` is the bulk of the site and the state every piece starts
in; badging it would put a label on ~30 cards that says nothing.

This spec's first draft rendered only `favorite`, on the argument that
displaying a low rank attaches a self-insult to the work. Beck reversed it
2026-09-09 — "no I think useful to mark things archived tbh" — and the
reversal is right, for a distinction the first draft missed:

> **"Archived" names a placement, not a verdict.** An archive is where things
> are *kept*. That is categorically unlike "1 star," "tier 3," or "minor,"
> which score the work and tell a visitor how to feel about it before they
> have looked. A status can be stated plainly; a grade cannot.

What the earlier argument was actually right about is narrower, and it
survives as the constraint on §10.4's wording: **the badge may name where the
piece sits, never how good it is.** "archived" is in bounds. "lesser,"
"minor," "weak," "low-rated," or any number out of three is not.

Displaying it also does real work rather than merely being permissible:

- **It makes the reveal legible.** Without a mark, turning on §4.3's control
  drops N unexplained cards into a 30-card grid with no way to tell which
  ones just arrived, or why the count jumped.
- **It explains a search result.** An archived piece surfacing from a query
  (§4.1) would otherwise look like it should have been in the browse all
  along.
- **It matches the site's existing habit.** `unfinished` is "surfaced
  honestly in the gallery and on the piece page rather than hidden until
  done" (`WorkPiece.unfinished`), and the guessing-game answers ship in
  plaintext on an explicit honor system. Quiet status disclosure is already
  the house style.

Consistent with `unfinished`, the mark appears both on the gallery card and
on the piece's own page.

---

## 3. `PINNED`

### 3.1 Why one per column, and why that is the only count that works

`MasonryGrid` deals children round-robin into independent flex columns
(`masonry-grid.tsx:65-67`), and those columns explicitly do **not** end at
matched heights — the file documents this as the deliberate trade for
left→right reading order.

The consequence: **all columns start flush at the same `y`; only their
bottoms go ragged.** So

- **Pins == column count** puts the entire top edge of the grid in pins. The
  top of the content is already a real boundary, so the band reads as
  intentional with no separator, no heading, and no extra region.
- **Pins != column count** has a second, ragged row. Item 7 sits under item 4
  in column one while column three still shows item 6 at that height. There
  is no seam, so the pinned set does not read as *chosen* — it reads as *the
  sort is broken*, especially with a control directly above the grid
  asserting "newest first."

This is why the earlier "pin the top N" sketch felt wrong and the separate
band was the only alternative on the table. One-per-column is the third
option, and it is the one the layout can actually express.

The gallery renders `<MasonryGrid className="mt-6">` with no `columns` prop,
so it takes `DEFAULT_COLUMNS = { lg: 3 }` with `base` defaulting to 2. Its
real column counts are therefore:

| Viewport | Columns | Pins honored |
| --- | --- | --- |
| `≥1024px` (`lg`) | 3 | 3 |
| `640–1023px` (`sm`) | 2 | 2 |
| `<640px` | 2 | 2 |

Only ever 3 or 2 — exactly Beck's "3 pins in 3 columns, 2 pins in 2."

### 3.2 The list

```ts
/** The most pins any gallery viewport can seat — `MasonryGrid`'s widest column count. */
export const MAX_PINS = 3

/**
 * Slugs that hold the head of each masonry column in the gallery's default
 * view, left to right. A page position, not a judgement — see
 * docs/specs/2026-09-tiers-and-pins.md §1.
 *
 * Hand-picked rather than derived, the same idiom as `stackPieces` and
 * `app/page.tsx`'s `CARDS[].pieces`: the choice is a composition no predicate
 * expresses, and hand-picking means adding work never silently changes what
 * fronts the gallery.
 *
 * At most `MAX_PINS`. Narrower viewports seat fewer, and the surplus falls
 * back to its chronological position rather than crowding the head row (§3.4).
 */
export const PINNED: readonly string[] = []
```

Ships **empty**, which is a no-op: `splitPinned` returns every item in
`rest`, and the gallery renders exactly as it does today. Beck fills it in
§10.1.

### 3.3 When pins are honored

Pins hold **only in the default view**: no search query, no selected tags,
and `sort === 'newest'`.

Any of those changing drops all pins and returns every item to its sorted
position. The reasoning is the one that killed the covert pin: **the sort
control is a visible promise.** A pinned card sitting above the grid while
the control reads "oldest first" makes the control a liar, which is the exact
defect §3.1 is avoiding. Once a visitor is searching or filtering, they are
asking a question, and the answer should be the results — not Beck's three
picks followed by the results.

> **§10.7 is Beck's to settle:** whether flipping to `oldest` should really
> drop the pins, or whether pins are "what Beck wants you to see first"
> regardless of order. This spec takes the strict reading; it is a one-line
> change either way.

### 3.4 The split

```ts
/**
 * Pull the pinned items out of a sorted result set, in `PINNED` order, up to
 * `limit` (the live column count). Slugs past `limit` — and slugs filtered
 * out of `items` entirely — stay in `rest` at their sorted position, so a
 * narrow viewport demotes a pin rather than dropping or misplacing it.
 */
export function splitPinned(
  items: WorkItem[],
  limit: number,
): { pins: WorkItem[]; rest: WorkItem[] } {
  const wanted = PINNED.slice(0, Math.max(0, Math.min(limit, MAX_PINS)))
  const pins = wanted
    .map((slug) => items.find((item) => item.slug === slug))
    .filter((item): item is WorkItem => Boolean(item))
  const taken = new Set(pins.map((p) => p.slug))
  return { pins, rest: items.filter((item) => !taken.has(item.slug)) }
}
```

Pinned items are **lifted out** of chronological flow, not duplicated. One
card per piece per grid; a piece appearing twice in one masonry is a bug, not
a feature.

### 3.5 `MasonryGrid`'s new prop

```tsx
<MasonryGrid className="mt-6" pinned={pins.map((item) => <WorkCard key={item.slug} item={item} />)}>
  {rest.map((item) => <WorkCard key={item.slug} item={item} />)}
</MasonryGrid>
```

Inside, after the existing round-robin deal, `pinned[i]` goes to the head of
column `i`:

```ts
const heads = Children.toArray(pinned).slice(0, columnCount)
heads.forEach((child, i) => cols[i].unshift(child))
```

`slice` is defensive — the gallery already caps at `columnCount` via
`splitPinned`, but `MasonryGrid` must not be the component that trusts a
caller and then writes past the end of `cols`.

The prop is optional and defaults to nothing, so the home page's and
collection pages' `MasonryGrid` calls are untouched.

**The gallery needs the live column count**, which currently lives privately
in `useColumnCount`. Export it:

```ts
export function useMasonryColumns(columns: MasonryColumns = DEFAULT_COLUMNS): number
```

— the existing `useColumnCount`, renamed and exported. The gallery calls it
with the same default the grid uses. See §9.C for the hydration wrinkle this
inherits.

---

## 4. Archive visibility — what "dig" means

### 4.1 The rule

An `archive` item is absent from the default browse and present everywhere
else. Concretely, archived items are included when **any** of:

1. the reveal control is on (`?archive=1`), or
2. a search query is active, or
3. one or more tags are selected.

(2) and (3) are the substance of Beck's "only see if you dig." Searching for
a piece by its own title and being told it does not exist would be a lie the
site tells about itself. Filtering to `?tags=ink` is a request for everything
ink, not everything ink Beck currently rates highly.

Archived items also keep their own `/work/[slug]` pages, stay in
`generateStaticParams`, and stay in `app/sitemap.ts`. **`tier` is a browse
affordance, not an unpublish.** Nothing about it should be reachable-only-by-
secret; the point is not to hide the work, it is to not lead with it.

### 4.2 Where the rule lives

`filterWork` gains one option:

```ts
export function filterWork(
  items: WorkItem[],
  {
    query,
    tags,
    mode,
    includeArchived = false,
  }: { query: string; tags: string[]; mode: FilterMode; includeArchived?: boolean },
): WorkItem[]
```

with `if (!includeArchived && isArchived(item)) return false` as the first
test in the existing predicate. Defaulting to `false` keeps every other
caller correct without edits.

The **policy** — that a query or a tag selection implies `includeArchived` —
stays in `WorkGallery`, next to the URL state it reads:

```ts
// Searching or filtering *is* digging (§4.1), so either one surfaces the
// archive without the explicit toggle.
const digging = Boolean(queryInput.trim()) || selectedTags.size > 0
const includeArchived = showArchived || digging
```

Keeping it here rather than inside `filterWork` leaves that function a plain
predicate over its arguments, which is what makes it worth the §3-of-TODO
note about being cheap to test.

### 4.3 The reveal control

Lives in the existing controls row beside `reset`, `cycleSort`, and
`VennMode` (`work-gallery.tsx:803-824`) — **not** as a new region, and not at
the bottom of the page.

- Rendered only when there is something to reveal (`archivedCount > 0`) and
  `digging` is false — while digging, the archive is already included and a
  toggle claiming otherwise would be wrong.
- Wording names the place, not a grade — the same constraint §2.2 puts on the
  badge. Now that the tier is visible on the cards, the control can say
  `show archive · +7` directly rather than reaching for a euphemism;
  "show everything" was drafted to avoid naming a thing that had no name on
  screen, and that problem is gone. "show low-rated work" remains out of
  bounds.
- Its exact string is §10.5.

### 4.4 The count line

`work-gallery.tsx:792-802` currently reads `{results.length} of {WORK.length}`.
With archived items hidden by default, `WORK.length` becomes a wrong
denominator — "27 of 32" invites the question the archive exists to avoid.

The denominator becomes the browsable total under the current archive
visibility:

```ts
const archivedCount = useMemo(() => WORK.filter(isArchived).length, [])
const total = includeArchived ? WORK.length : WORK.length - archivedCount
```

---

## 5. Validation

### 5.1 What to assert

1. Every `PINNED` slug matches a top-level item in `WORK`.
2. No duplicates in `PINNED`.
3. `PINNED.length <= MAX_PINS`.
4. No `PINNED` slug is `archive` — pinning a piece to the head of the grid
   while declaring it out of the default browse is contradictory, and silently
   honoring one over the other would hide a data error.

### 5.2 Where

`lib/mdx-bodies.ts:23-34` is the precedent: an unconditional `throw` at
module scope, which `next build` evaluates during prerender, so a bad list
fails the build rather than shipping.

The wrinkle is that `mdx-bodies.ts` is explicitly server-only, and **`work.ts`
is imported by client components** — an unconditional check ships its code
into the browser bundle. Two options:

- **Unconditional throw in `work.ts`** (recommended). Matches the existing
  precedent, caught at build time. Cost is a few hundred bytes of dead check
  in the client bundle.
- **Guarded by `process.env.NODE_ENV !== 'production'`.** Zero client cost
  (Next inlines the constant and eliminates the branch), but `next build`
  stops catching it — protection only while running `next dev`.

Recommended: unconditional. The whole value of the assertion is that a typo
in a hand-maintained slug list fails loudly, and a build is the last place
that can still be true.

### 5.3 What *not* to assert

Do not assert that `PINNED` is non-empty, and do not assert a minimum number
of favorites. Both are legitimate states, and an empty `PINNED` is this
spec's own shipping configuration (§3.2).

---

## 6. The two badges

Both live beside `UnfinishedMark` in `components/work-visuals.tsx`, reusing
its exact pill treatment so all three read as the same class of annotation:

```tsx
/** Badge flagging a piece as one of Beck's favorites — see `WorkPiece.tier`. */
export function FavoriteMark({ className }: { className?: string }) { … }

/**
 * Badge flagging a piece as archived — out of the default browse, still
 * published. Rendered only where archived items are actually being shown
 * (a revealed gallery, a search result, the piece's own page): in the
 * default grid there is nothing to label. See `WorkPiece.tier`.
 */
export function ArchiveMark({ className }: { className?: string }) { … }
```

Same `font-brand … rounded-full bg-background/85 px-2.5 py-1 text-xs
lowercase … backdrop-blur-sm` shell, an icon at `h-3.5 w-3.5
strokeWidth={1.75}`, and a lowercase label.

They should not read as a matched pair of opposites — a green tick against a
red cross would turn the two ends into a scoreboard. `ArchiveMark` wants the
quieter of the two: muted foreground, no accent tone. `FavoriteMark` may
carry the piece's discipline tone (`toneFor`) the way other accented chrome
does.

Icons and labels are §10.4. Two notes for whoever picks:

- **A star on the favorite re-imports the rank semantics** the vocabulary was
  chosen to avoid. A heart reads as affection, which is the axis `favorite`
  actually names.
- **The archive label states a location.** "archived" is in bounds; anything
  that scores the work is not (§2.2).

### 6.2 The three card shapes

`UnfinishedMark` has three call sites, and they are not interchangeable:

| Card | Line | Placement |
| --- | --- | --- |
| `TextCard` | `work-gallery.tsx:249` | in normal flow |
| `HybridCard` | `work-gallery.tsx:299` | in normal flow |
| `ImageCard` | `work-gallery.tsx:430` | `absolute left-3 top-3 z-20` over the image |

Both new badges need a home in each. **Up to two can co-occur** — a piece may
be archived *and* unfinished, or a favorite *and* unfinished; `favorite` and
`archive` are mutually exclusive by construction, since `tier` is one value.
So the badges must sit side by side without overlapping, which in `ImageCard`
means **one absolutely positioned flex row holding whichever marks apply**,
rather than each badge independently claiming `left-3 top-3`. Refactor that
call site into a single row before adding to it.

There is a fourth shape: a collection renders its stack rather than a plain
image (`CollectionStack`, dispatched from `WorkCard` at
`work-gallery.tsx:454`). Card 4 of the stack already carries `CollectionMark`
in its own bottom-right corner. Where these badges go on a stack — and
whether they collide with that pill — needs checking against a real render,
not reasoning; see §9.B.

---

## 7. Prerequisite: `mindtober-21`'s poems are untagged

**Found while auditing this design, and it changes what tier Mindtober
deserves.** Not part of the mechanism; recorded here because assigning tiers
before fixing it would bake in a wrong judgement.

Beck's initial read was "Mindtober '21 is one star." On inspection it is two
different works sharing one card:

- 31 quick ink-and-colored-pencil sticky-note drawings.
- A **single terza rima chain** running through all 31 tercets —
  `alone/own` hands off to `cries/friend/goodbyes` hands off to
  `expend/loom/end` (`lib/work.ts:1541-1568`).

The collection and all 31 pieces are tagged `['art', 'ink']`. There is no
`writing` tag and no `poem` tag anywhere in it. So:

- `/work?tags=poem` and `?tags=writing` return nothing from Mindtober.
- `formFor()` falls back to `'essay'` for every piece in it.
- The collection stack shows drawings only — every piece carries both `text`
  and `image`, so it is `isHybrid`, so `collectionLayout` is `'illustrated'`,
  so `CollectionStack` renders image faces and the tercets have nowhere to
  appear.

The set is filed as 31 ink drawings that happen to have captions. It reads as
the weakest collection because **the site is only showing half of it.**

Beck, 2026-09-09: "I take back what I said about mindtober being one star — I
think you're right that the drawings are, but not the poems / tercet /
collection, and so maybe if those could be visible on the collection stack it
could help."

**Do not assign `mindtober-21` a tier until its tags are fixed.** The tag fix
is correct on its own terms and independent of this spec.

### 7.1 Making the tercets visible on the stack — separate, and not free

`ChapbookStack` (`work-visuals.tsx:534-611`) already renders text faces via
`TextCardFace`, and `WorkCollection.layout` already exists as the escape
hatch. Setting `layout: 'book'` on `mindtober-21` would front three tercets
immediately — but it drags two things with it:

- **`/work/mindtober-21/read` would drop the drawings.** That page renders
  `piece.text` through `VerseBlock` and nothing else
  (`app/work/[slug]/read/page.tsx:72`). For a terza rima chain a
  read-it-straight-through page is genuinely the right idea; silently
  discarding the ink half of an illustrated work is not.
- **Every card's pill would read "essay"** until the `poem` tag lands.

So the honest options are a narrower knob (a stack-face override independent
of page layout) or accepting a poem-only read page. **Out of scope here** —
it is a collection-presentation question, not a tier question. Flagged so it
is not rediscovered from scratch.

---

## 8. URL state

One new parameter, following the established shape (`work-gallery.tsx:520-563`):

| Param | Values | Default | In URL when default |
| --- | --- | --- | --- |
| `archive` | `1` | off | no |

- Read alongside `q`, `tags`, `mode`, `sort`, `view`.
- Added to `commit`'s `changes` type and to the omit-the-default pattern the
  other params already use.
- **Added to `reset`**, which currently clears `q`, `tags`, `mode`, `sort`
  (`work-gallery.tsx:600-603`). A reset that leaves the archive revealed is
  not a reset.
- **Not** added to `activeCount`'s definition without checking: that counter
  drives whether the `reset` button appears at all, and revealing the archive
  arguably is an active state. Decide with the render in front of you.

`PINNED` gets no URL state. It is not a mode; it is the default view's shape.

---

## 9. Traps found in the audit

**A. There is no new page region, by construction.** Everything renders
inside the existing `MasonryGrid` and the existing controls row. If an
implementation finds itself adding a `<section>` above the grid, it has
drifted from the decision at the top of this spec.

**B. The favorite badge on a collection stack is unverified.** §6.1. A stack
is four rotated, absolutely positioned cards with a count pill already in the
bottom-right of card 4. Check it on screen before committing to a position.

**C. Pin count flashes on first paint at narrow viewports.** `useColumnCount`
starts at `columns.lg` so the server render and first client render agree,
then corrects on mount (`masonry-grid.tsx:22-24`). The gallery reading that
same hook therefore believes it can seat 3 pins until mount, then drops to 2
on a phone — so a pin visibly moves. The existing code already accepts this
pattern for column *widths* (which are safe, since widths come from CSS
classes, not the count), but pin *placement* is new exposure. Options: accept
it and note it, or gate the head row until mounted. Worth a look on a real
phone before choosing; the gallery is already inside `<Suspense>` in
`app/work/page.tsx`, so a first-paint correction may be invisible in practice.

**D. `results.length > 0` is the empty-state test** (`work-gallery.tsx:828`).
With pins split out, the test must be on the total (`pins.length +
rest.length`), not on `rest`. A gallery filtered down to nothing but a single
pinned item would otherwise render the "nothing matches yet" panel *and* a
card.

**E. `galleryLightboxItems` must see the rendered order.** The lightbox's
domain is built from `results` and paged in the order shown
(`work-gallery.tsx:614`). Once pins are lifted to the front, the lightbox
must be built from `[...pins, ...rest]`, or arrowing through it will
disagree with the grid.

**F. `AUTHORED_INDEX` still exists and is still load-bearing.** Retiring the
`curated` sort mode did not retire the array order — it breaks ties within a
year, and 2022 alone holds 11 entries. Do not delete it while cleaning up.

**G. Archived items and `SHOW_SAMPLE_WORK`.** `lib/work.sample.ts` items
carry no `tier`, so they read as `general` and are unaffected. Nothing to do;
noted so it is not investigated twice.

---

## 10. Open questions — Beck's to answer

1. **Which slugs are pinned**, in left-to-right order, at most three.
2. **Which pieces are `favorite`.** Unbounded. `eye-studies` is the one Beck
   has named out loud ("eyes are three stars").
3. **Which pieces are `archive`** — with §7's caveat that `mindtober-21`
   should not be judged until its poems are tagged.
4. **Both badges' icons and labels.** For the favorite: heart vs. something
   else, and what the word is (§6 — a star re-imports rank semantics). For
   the archive: confirm "archived" is the word you want on the card, and
   whether it should read plainly or carry a date ("archived · 2019"). The
   one constraint from §2.2 is that it names where the piece sits, not how
   good it is.
5. **The reveal control's wording.** §4.3 suggests `show archive · +7` now
   that the tier is named on the cards.
6. **Whether a collection's tier derives from its children's.** A collection
   of eight favorites is presumably a favorite; a collection holding two
   archived pieces is presumably not archived. Deriving it is `itemTags`'
   pattern; hand-setting it is `stackPieces`'. This spec hand-sets and leaves
   derivation unbuilt.
7. **Whether flipping to `oldest` drops the pins.** §3.3 takes the strict
   reading.

---

## 11. Rejected alternatives

**A. A "start here" band above the grid.** Rejected by Beck, 2026-09-09. It
is the only arrangement that manufactures a seam for an arbitrary number of
featured items, which is why it kept coming up — §3.1's one-per-column rule
is what made it unnecessary.

**B. Featured pieces as larger tiles, inline.** Not expressible in this
layout, and worth recording so it is not re-proposed. `MasonryGrid` deals
children into independent flex columns inside a `grid-cols-2`/`lg:grid-cols-3`
track set, so **every tile is exactly one column wide and nothing can span.**
A featured tile could only be *taller* — and height is already a meaningful
signal spoken for by content (`WorkPiece.preview`: "the cover card is sized
by this string, and a masonry column gives a taller tile more room. A long
preview is how a piece claims that room. Never clamp it"). Making rank a
second claimant on height would put it in conflict with authored copy.
Spanning would mean abandoning round-robin column dealing, which is what buys
the documented left→right reading order.

**C. Pinning the first N items in reading order.** §3.1. Produces a ragged,
invisible boundary and reads as a broken sort rather than a choice.

**D. Stars, 1–3, rendered on the card.** Rejected for the *rendering*, not
the mechanism: a displayed score tells a visitor how to rate the work before
they have looked at it. Note carefully what this does and does not rule out —
§2.2 renders `archive` on the card, because a placement can be stated and a
grade cannot. "archived" is in; "★☆☆" is out. An implementation that reads
this as "never show the low end" has the rule backwards.

**E. Stars, 1–3, editorial-only and never rendered.** Rejected as strictly
worse than `favorite`/`general`/`archive`: identical cost (a judgement on
every entry), and it asks Beck to grade the work rather than place it. The
tier names describe placement, so "Mindtober is archived" is not a verdict on
Mindtober.

**F. A single ordered `FEATURED` list doing both jobs.** §1. Caps favorites
at three and makes un-pinning read as a demotion.

**G. Rating individual pieces and deriving collections' stack faces from the
top-rated ones.** Genuinely delivers Beck's Mindtober instinct — your
favourite tercets become the stack faces automatically, replacing hand-set
`stackPieces`. Deferred, not rejected: it means a judgement on ~134 pieces
rather than 32, and it couples this spec to the collection-presentation
question §7.1 opens. Revisit once §7's tags land.

**H. `tier` driving the home page's discipline columns.** Rejected against an
existing documented decision: `app/page.tsx:52-58` hand-picks each column's
pieces by slug precisely so "adding work never silently changes the home
page." Tier-derived columns would reintroduce exactly that.

**I. Deleting archived pieces.** Considered and dismissed early. `archive` is
a browse affordance; the pages, sitemap entries, and direct links all survive
(§4.1). Nothing here unpublishes anything.
