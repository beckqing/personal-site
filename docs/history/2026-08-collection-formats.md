# Collection formats — the as-designed spec (archived)

> **This is history, not current documentation.** It is the design spec that
> `2dc8324` ("Implement the collection-cards redesign") was built from,
> recovered on 2026-08-27 from a session transcript after it was deleted
> without ever being committed. It is written in the future tense about work
> that has since shipped, and parts of it were superseded during the build.
>
> **Current documentation is [../ARCHITECTURE.md](../ARCHITECTURE.md).** When
> the two disagree, ARCHITECTURE.md is right. Read this only for the
> derivations ARCHITECTURE.md deliberately doesn't carry — the measurements,
> the per-case tables, and the reasoning behind numbers that otherwise look
> arbitrary.
>
> **Known places where what shipped differs from what's below:**
>
> - **§12j / §12k — card 4's strip.** The spec sizes it as a percentage
>   (`56.5%`, an 11%-of-width strip) and warns "don't reduce card 4's 11%
>   strip." That is exactly what shipped instead: a fixed `40px`, because the
>   11% strip cleared the count pill by only 1.4px at a 320px phone (the
>   spec's own table, bottom row, shows the margin it was running on). The
>   shipped `DECK` table uses `y: 45.5, px: 40` for card 4 and derives its
>   hover offset. See "Collection stack geometry" in ARCHITECTURE.md.
> - **§12k — the CSS property.** The spec drives the deck from `margin-top`;
>   the shipped `.deck-card` uses a negative `margin-bottom` on
>   bottom-anchored cards, which is what makes a peek exact regardless of the
>   card behind it.
> - **§12l — the transform caveat.** The spec says a `transform` on an
>   ancestor "would make that ancestor the containing block and re-anchor the
>   sticky constraint." §13e already doubted this ("a transform on an ancestor
>   shouldn't break a sticky descendant, but it's cheap to confirm"). It was
>   confirmed in a browser on 2026-08-27: it does **not** break sticky.
>   `ImageCard` ships with `hover:-translate-y-0.5` on the article and its
>   sticky chrome works. Only `overflow: hidden` genuinely disables it.
> - **§12l — the count pill.** The spec left this open and recommended leaving
>   it in card 4. It shipped in card 4.
>
> Six code comments cite this document under a name it never had
> (`COLLECTION-CARDS.md`); that file has never existed. See TODO §9.

---

## Collection formats — design spec *(original title and text follow, unaltered)*

**Status: designed, not built.** Everything below is a specification for work
to be done. Decisions live in [ARCHITECTURE.md](../ARCHITECTURE.md); open work
lives in [TODO.md](../TODO.md). When this is built, fold the decisions into
ARCHITECTURE.md and delete this file.

This resolves **TODO §4** ("the hybrid card path is dead — needs a decision").
The decision is: **hybrids are real**, and one of them is already in the tree.

---

## 1. What's wrong today

Three separate failures, all downstream of one thing: `/work/[slug]` has
exactly two modes — chapbook or image grid — and a piece has exactly two
modes — words or picture. Work that is both has nowhere to go.

### 1a. The chapbook reads like a menu, not a book

`love-worth-heartbreak` is 22 poems. Measured against the real data:

| Symptom | Evidence |
|---|---|
| Contents is a thin ribbon | 22 rows in `max-w-md` (28rem) centered on a `max-w-5xl` page — over half the width is empty |
| The reading column is too narrow | `max-w-md` holds ~47 characters at `text-base` in a mono face, and the longest genuine verse line is **51** — so verse wraps today that shouldn't need to |
| Stanza breaks are `<br><br>`, not spacing | `whitespace-pre-line` on one `<p>`; a `\n\n` renders as two line breaks, so stanza gaps can't be tuned and don't scale with leading |
| The prose poems are unreadable | `uncertainly overthinking` (1,160 chars) and `temptation` (1,202 chars) render as one unbroken slanted-mono `<p>` in a 28rem column |
| Every page repeats the same three chrome lines | `poem · 2021` and a `writing / poem` tag row appear identically on all 22 pages |
| Page turns wrap around | `(index - 1 + n) % n` — poem 01's "previous" is poem 22. A book's first page has no previous page |
| `description` is dead data | all 22 have a hand-written editorial gloss; it renders **nowhere** (contents shows titles, the page shows `excerpt`), surviving only in `generateMetadata` |

One thing that is **not** on this list, though an earlier draft of this spec
had it there: the chapbook's gallery tile being tall. `metaphorical safety
blanket`'s 287-character preview is a deliberate editorial choice — masonry
gives more room to taller tiles, and the chapbook is meant to claim it. The
field's own doc comment ("a short pull-quote (1-3 lines)") is what's out of
date, not the data. See §3d.

What the tall cover *does* do is expose a real bug behind it: `ChapbookStack`
reserves a fixed `mb-16` under a deck whose offsets are percentages, so the
taller the cover the worse it overruns the tile below. That's §12 — and it is
a bug at every cover height, not a consequence of this one.

### 1b. Image collections bury the writing in a caption slot

**`mindtober-21` is the case that proves hybrids exist.** All 31 pieces pair
an ink-and-colored-pencil drawing with a rhyming tercet — and all 31 tercets
are stored in `description` with ` / ` standing in for the line breaks:

```
description: 'memory improves, edits out the bad / in love with what i
              remember of you / lost in the lie of what we could have had'
```

That renders as `<p class="text-sm text-muted-foreground">` under the tile —
a poem set as a caption, in the caption's size and color, with its lineation
replaced by slashes. Verse is in the tree; nothing in the model knows it.

Contrast `inktober-17`: 31 one-line captions, correctly a caption. Same slot,
two different kinds of content, no way to tell them apart.

### 1c. The collection page's tiles are a fork of the gallery's cards

`app/work/[slug]/page.tsx` inlines ~60 lines of card JSX rather than reusing
`work-gallery.tsx`'s cards. The same piece therefore looks like two different
things inside and outside its collection (inside: title + full description
paragraph, always visible; outside: title only, in a hover scrim). Any fix
applied to one silently misses the other.

---

## 2. The data model

### 2a. Add `text`; retire `excerpt`

`excerpt` is doing two unrelated jobs. On the 22 chapbook poems it holds the
**complete poem** — nothing is excerpted. On the three standalone essays
(`chinese-emoji-poetry`, `first-art-fair`, `note-systems`) it really is an
excerpt: a 113–191 character pull quote from a blog post that lives elsewhere.

One field covers both honestly, if it's named for its *role on the page*
rather than for its completeness:

```ts
/**
 * The written work this page shows — a whole poem, or the passage quoted
 * from an essay that lives elsewhere. Line breaks are real line breaks; a
 * blank line separates stanzas or paragraphs. Distinct from `description`
 * (an editorial gloss about the piece) and `writeup` (process notes around
 * it). A piece carrying both `text` and `image` is a hybrid.
 */
text?: string
```

- `excerpt` → `text` on all 25 pieces that have it. Mechanical; 6 call sites.
- `preview` keeps its job unchanged: a hand-set 1–3 line pull quote for
  compact contexts, falling back to `text` then `description`.

The three essays are **not** a problem case for §2c: their `text` is set and
they carry no image, so they stay text-forward exactly as they are today.
They do change appearance — see §3c.

### 2b. `description` becomes optional

Mindtober's `description` is about to be emptied out (its contents are verse
and move to `text`), and there is no gloss to replace it with. Make the field
optional rather than inventing one:

```ts
/** An editorial gloss — what the piece is about. Optional: not every piece has one. */
description?: string
```

Six sites render it directly and need a guard or a fallback. They are:

| File | Site | Fix |
|---|---|---|
| `app/work/[slug]/page.tsx` | `CollectionView` header | collections keep it required in practice; render conditionally |
| `app/work/[slug]/page.tsx` | piece tile caption | conditional |
| `app/work/[slug]/page.tsx` | `PieceView` blurb | conditional |
| `app/work/[slug]/[pieceSlug]/page.tsx` | chapbook `excerpt` fallback | drops out — see §5a |
| `app/work/[slug]/[pieceSlug]/page.tsx` | non-chapbook blurb | conditional |
| `components/work-gallery.tsx` | `CollectionTile` | conditional |

Both `generateMetadata` functions fall back: `description ?? preview ?? text`
(first line, truncated to ~160 chars).

**Search must be updated too.** `filterWork`'s haystack currently reads
`item.pieces.flatMap((p) => [p.title, p.description])`. Add `p.text` and
`p.preview`, or moving the tercets out of `description` silently makes all 31
Mindtober poems unsearchable.

### 2c. Derived predicates

`hasImage` is deleted — it's set on zero real pieces and `isHybrid` keys off
it, which is why `HybridCard` never renders. Both predicates derive from what
the piece actually carries:

```ts
/** Words and a picture, both load-bearing. */
export function isHybrid(item: WorkItem): boolean {
  return !isCollection(item) && Boolean(item.text) && Boolean(item.image)
}

/** Words, no picture — the words are the piece. */
export function isTextForward(item: WorkItem): boolean {
  if (isCollection(item)) return false
  return Boolean(item.text) && !item.image
}
```

This is a real behavioural change: `isTextForward` stops keying off the
`poem`/`essay` tags. That's the point — tags say what a piece *is about*,
fields say what it *has*. A poem that gains an image stops being text-forward
and becomes a hybrid, automatically, which is exactly the transition the
current model can't express.

`isTextOnly` keeps its current definition (a text-forward piece, or a
collection made entirely of them) and keeps its current job: choosing the
quote watermark over the missing-image one.

### 2d. Collection layout

```ts
export type CollectionLayout = 'book' | 'illustrated' | 'gallery'

/**
 * How a collection's page is laid out. Derived from what its pieces carry,
 * with an explicit override for the cases the rule reads wrong — the same
 * escape-hatch shape as `stackPieces` and `stackAccent`.
 */
export function collectionLayout(c: WorkCollection): CollectionLayout {
  if (c.layout) return c.layout
  if (c.pieces.length === 0) return 'gallery'
  if (c.pieces.every(isTextForward)) return 'book'
  if (c.pieces.every(isHybrid)) return 'illustrated'
  return 'gallery'
}

/** A collection read as a book: contents page, one piece per page. */
export function isChapbook(item: WorkItem): boolean {
  return isCollection(item) && collectionLayout(item) === 'book'
}
```

`layout?: CollectionLayout` goes on `WorkCollection` next to `stackAccent`.
Keep `isChapbook` — four call sites read better as `chapbook ? … : …` than as
a string comparison.

Against today's data this yields: `love-worth-heartbreak` → `book`,
`mindtober-21` → `illustrated`, everything else → `gallery`. Nothing needs an
override yet. **Do not add one preemptively.**

---

## 3. `VerseBlock` — the primitive everything else is built on

One component renders written work everywhere it appears. Get this right and
§4 and §5 are mostly assembly.

```tsx
// components/work-visuals.tsx
export function VerseBlock({
  text,
  context = 'reading',
  className,
}: {
  text: string
  /** 'card' keeps everything slanted — see §3c. */
  context?: 'reading' | 'card'
  className?: string
})
```

### 3a. Every line is its own block

Not `whitespace-pre-line` on one paragraph. Split the text into stanzas on
`\n\n`, split each stanza into lines on `\n`, and render **each line as its
own block-level element**:

```tsx
<div className={cn('font-brand-italic max-w-[58ch] text-pretty leading-relaxed', className)}>
  {text.split('\n\n').map((stanza, s) =>
    isProseRun(stanza) ? (
      <p key={s} className="font-brand not-italic [&+*]:mt-[1lh]">{stanza}</p>
    ) : (
      <p key={s} className="[&+*]:mt-[1lh]">
        {stanza.split('\n').map((line, i) => (
          <span key={i} className="block [text-indent:-1ch] pl-[1ch]">
            {line || ' '}
          </span>
        ))}
      </p>
    ),
  )}
</div>
```

Three things this buys, all of which the current renderer gets wrong:

1. **A wrapped line is quietly marked as a wrap.** `text-indent: -1ch` +
   `padding-left: 1ch` on each line-block hangs the continuation in by exactly
   one character while the true line start sits flush.

   **Keep this subtle — one character, no more.** Beck's poems read
   comfortably without a hard visual distinction between a wrap and a line
   break, so this is a quiet safety net, not a feature to make legible. `ch`
   rather than `em` because the face is monospace: a one-character hang lands
   on the character grid and reads as deliberate, where a sub-character value
   (0.5ch) just looks like a rendering wobble. On the reading page it will
   barely ever fire at all — see §3b.

   It *must* be per line-block: `text-indent` applies only to a block's first
   formatted line, so it does nothing useful on a `pre-line` paragraph where
   `\n` is a forced break rather than a new block.
2. **Stanza gaps are margin.** `mt-[1lh]` is one line-height, so the gap
   tracks the type size instead of being two hard-coded `<br>`s. (If `lh`
   support is a concern, `1.625em` matches `leading-relaxed`.)
3. **Nothing depends on `white-space`**, so the block is safe to nest inside
   cards, flex, and grid without a `pre` context leaking.

### 3b. The measure is derived, not guessed

`max-w-[58ch]`, up from today's `max-w-md` (~47 characters). It's a
comfortable reading measure first — 45–75 characters is the usual range for
sustained prose, and the three prose poems are the pieces that most need it.
The face is Recursive **Mono** (`MONO 1`), so `ch` is exact rather than
approximate and the number means what it says.

It also happens to clear the longest genuine verse line in the chapbook (51
characters) with ~6 to spare after the 1ch hanging indent, so on the reading
page **verse essentially never wraps and the hanging indent essentially never
fires**. That's a side effect of a comfortable measure, not the reason for it —
worth knowing mainly so nobody tunes the indent by staring at a page where it
isn't visible. The places it does show up are a handful of over-long lines
inside `haunted`, `surrender` and `temptation`, and cards, where the column is
~28 characters and wrapping is unavoidable at any type size.

### 3c. Prose runs set upright

```ts
/** A stanza that is one unbroken run, too long to be a verse line. */
const PROSE_RUN_MIN = 90
function isProseRun(stanza: string) {
  return !stanza.includes('\n') && stanza.length > PROSE_RUN_MIN
}
```

Measured against `love-worth-heartbreak`: **15 prose stanzas, 92 verse
stanzas**, and four pieces that are genuinely *mixed* — `gluttony`,
`surrender`, `temptation`, `spring-cleaning` each interleave lineated stanzas
with prose blocks. That mix is why this is decided **per stanza and not per
piece**: no piece-level `form: 'verse' | 'prose'` field can describe
`spring-cleaning`, which is a two-line verse stanza followed by a 660-character
paragraph.

**The exception only applies at reading size.** In a card — `TextCard`,
`HybridCard`, `TextCardFace`, `IllustratedTile` — everything stays slanted,
because there the quote glyph and the tint already frame the text as a
quotation and the slant is part of that voice. Hence `context='card'`, which
skips the `isProseRun` branch entirely.

> **This exception is a proposal layered on Beck's decision, not the decision
> itself.** Beck's call was *italic for poems and songs* — the slanted casual
> mono is a deliberate style choice, a little typewriter and a little
> practical — so **italic is the default and stays the default**. The
> upright-prose-run exception exists only because slanted mono stops being
> cute at 660 unbroken characters. If it reads wrong, delete the
> `isProseRun` branch; everything else in this spec still stands.

Where this is visible beyond the chapbook: the three standalone essays are
each a single unbroken run of 113–191 characters, so their reading pages go
from slanted to upright while their gallery cards stay slanted. That happens
to land exactly on Beck's own line — *poems and songs* get the slant, essays
don't — which is a good sign the 90-character rule is measuring the right
thing. Check those three pages look right; they're the cheapest test of
whether the exception is worth keeping.

### 3d. Card contexts render `preview` in full — never clamped

**Do not clamp, cap, or truncate `preview` anywhere.** A preview's length is an
editorial lever on how much room the tile claims in the masonry, and it is
being used as one: `love-worth-heartbreak`'s cover runs 13 lines on purpose.
Tile height *should* follow content here.

That makes the field's doc comment wrong rather than the data. Rewrite it:

```ts
/**
 * The pull quote shown on cards — a collection stack's faces, a gallery
 * TextCard, a piece tile. Falls back to `text`, then `description`.
 *
 * Its length is deliberate, not incidental: the cover card is sized by this
 * string, and a masonry column gives a taller tile more room. A long preview
 * is how a piece claims that room. Never clamp it.
 */
preview?: string
```

Two mechanical consequences:

- **No `line-clamp`.** It relies on `-webkit-box`, which breaks against
  `VerseBlock`'s nested line-blocks anyway — so the constraint and the
  intent agree.
- **`TextCardFace` should render `preview` through
  `<VerseBlock context="card">`**, not a raw `<p>`. This matters more the
  longer the preview is: the card's text column is ~302px, which at `text-lg`
  in Recursive Mono holds about **28 characters**, while the chapbook's
  preview lines run to 51. Today those wrap into an unmarked second line and
  a long preview wraps on most of its lines. `VerseBlock` gives those wraps
  the same quiet 1ch hang as everywhere else, and — more importantly here —
  real margin between stanzas instead of a doubled line break.

If a tall cover still feels too loose after that, the lever to reach for is the
card's type size (`text-lg` → `text-base` fits ~31 characters, `text-sm` ~36),
not a cap on the string.

---

## 4. The three collection layouts

Common header for all three (unchanged from today): eyebrow, title,
description, `N pieces · year`, `TagLinks`, optional `writeup`.

### 4a. `book` — `/work/love-worth-heartbreak`

**Front matter, then a real contents page.** Widen the whole route to a
book-ish `max-w-3xl` and centre the front matter.

Contents becomes two columns via CSS `columns-2` — and here CSS columns is the
*correct* tool, unlike in `MasonryGrid`, because a contents list *should* read
down column one then down column two:

```tsx
<ol className="mt-8 columns-1 gap-x-10 sm:columns-2">
  {collection.pieces.map((piece, i) => (
    <li key={piece.slug} className="break-inside-avoid">
      {/* folio · title, as today */}
    </li>
  ))}
</ol>
```

Drop the `rounded-2xl border bg-card divide-y` box. A contents page is a list
on the page, not a widget: folio numbers in the tone color, titles in
`font-brand` lowercase, generous `py`, hairline separators at most.

Titles only — **no first lines, no glosses**. The taste of the writing is
carried by the epigraph and the two entry points below it. The gloss in
`description` stays where it already earns its keep: `generateMetadata` and
card previews.

Two buttons under the front matter, not one:

- `start reading` → `piecePath(collection, pieces[0])` (today's, restyled)
- `read straight through` → `/work/[slug]/read` (new, §4b)

### 4b. `/work/[slug]/read` — the whole chapbook on one page

New route: `app/work/[slug]/read/page.tsx`.

```ts
export function generateStaticParams() {
  return WORK.filter(isCollection).filter(isChapbook).map((c) => ({ slug: c.slug }))
}
```

One `max-w-3xl` page: front matter, then every piece in order as
`<article>` — folio, title, `VerseBlock`, and a hairline rule between pieces.
No per-piece tags, no per-piece meta line, no prev/next. Ends with a link back
to contents.

**Routing note:** a static segment beats a dynamic sibling, so `/work/x/read`
resolves to this route rather than `[pieceSlug]`. That is only safe while no
piece is slugged `read`. Nothing is today. Worth a one-line comment at the
top of the file, because the failure mode — a poem silently becoming
unreachable — is invisible.

### 4c. `illustrated` — `/work/mindtober-21`

The hybrid layout: **image and words as one unit, at equal weight.** Neither
is a caption for the other.

Two columns rather than three — the verse needs its measure, and 58ch does not
fit in a third of a 5xl page. Give `MasonryGrid` a `columns` prop
(`{ lg: 3 }` default, `{ lg: 2 }` here) rather than forking it; today its
`COLUMN_QUERIES` are a module constant.

Each cell is a new `IllustratedTile`:

```
┌─────────────────────────┐
│                         │
│         image           │  ← ImageLightbox + MediaBadges, aspectStyleFor
│                         │
├─────────────────────────┤
│ 30 · memory             │  ← folio + title, font-brand lowercase
│                         │
│ memory improves,        │  ← VerseBlock, italic, real line breaks
│ edits out the bad       │
│ in love with what i     │
│ remember of you         │
│ lost in the lie of      │
│ what we could have had  │
│                    →    │  ← link to the piece page
└─────────────────────────┘
```

The card body sits on the discipline tint
(`color-mix(in srgb, ${tone} 8%, var(--card))`), matching `TextCard`, so the
writing half reads as writing rather than as chrome under a picture.

### 4d. `gallery` — unchanged behaviour, shared code

Everything else keeps today's masonry of image tiles. The change is
structural: **extract the inlined tile JSX out of `app/work/[slug]/page.tsx`**
into `components/work-visuals.tsx` as `PieceTile`, which dispatches on the
piece the same way `WorkCard` does:

```tsx
export function PieceTile({ collection, piece, index }: …) {
  if (isHybrid(piece)) return <IllustratedTile … />
  if (isTextForward(piece)) return <TextTile … />
  return <ImageTile … />
}
```

A `gallery` collection holding one hybrid piece then gets that piece rendered
as a hybrid, without the collection changing layout. That's the whole reason
the tile layer dispatches per piece and the page layer dispatches per
collection.

---

## 5. Piece pages

### 5a. Chapbook reading page

- **Widen** the article's inner column from `max-w-md` to `VerseBlock`'s own
  `58ch`, centred in the `max-w-3xl` page.
- **Body** becomes `<VerseBlock text={piece.text} />`. The
  `piece.excerpt ? … : <p>{piece.description}</p>` fallback goes away: after
  §2 a book page always has `text`.
- **Strip the repeated chrome.** Remove the `categoryLabel · year` line and
  the `TagLinks` row — identical on all 22 pages. Tags live on the collection
  page. Keep the collection name above the title and the `BookFolio` below.
- **Ends stop wrapping.** `prev` is `undefined` at index 0, `next` is
  `undefined` at the last index. Render the arrows disabled/absent at the
  ends; the last page's forward affordance becomes **"back to contents"**.
  `BookPageNav` takes `prevHref?: string | null` and no-ops on the missing
  side.
- Keep `writeup` where it is (below the poem, smaller) — it's process notes
  about the poem, correctly subordinate.

### 5b. Hybrid piece page

The fix TODO §4 asks for. Both halves must render:

- **`PieceMedia`'s opening guard is the bug.** `if (isTextForward(piece))
  return null` means a hybrid — text-forward *and* carrying media — shows no
  media at all. Replace it with a guard on what's actually there:

  ```ts
  if (!piece.image && !piece.animationSrc && !piece.speedpaintSrc) return null
  ```

  With §2c's redefinition, a hybrid is no longer `isTextForward` anyway, but
  fix the guard regardless: it should test for media, not for genre.
- **`app/work/[slug]/[pieceSlug]/page.tsx`'s `{!textForward && <PieceMedia>}`
  wrapper comes out** (TODO §7 — it was already redundant, and after this it's
  wrong). `PieceMedia` decides for itself.
- Page order: media → title → meta → `VerseBlock` → `description` gloss (if
  any) → `writeup` → tags.

### 5c. Standalone text piece page

`PieceView`'s text-forward branch swaps `ExcerptBlock` for `VerseBlock`
inside the same left-rule treatment. `ExcerptBlock` is then deleted — it has
no remaining callers.

---

## 6. Gallery tiles

- `HybridCard` starts rendering, for the first time, once §2c lands. Two fixes
  while you're there: it renders **no `MediaBadges`**, so a hybrid with a
  speedpaint shows no indicator; and its body should be
  `preview ?? text ?? description` through `<VerseBlock context="card">`, not
  `excerpt ?? description` through a raw `<p>`.
- `TextCard` takes the same chain and the same `VerseBlock`. Note it currently
  reaches for `item.excerpt` *before* `preview`, unlike `TextCardFace` — so a
  standalone writing piece's card shows the whole `text` where a chapbook's
  stack card shows the short pull quote. Align it on `preview` first. The
  three essays have no `preview` and their `text` is 113–191 characters, so
  they fall through to `text` and look the same as today; nothing needs
  writing to make this land.
- **`ImageCard`'s gradient band becomes a sticky chrome panel — §13**, matching
  the collection tile's, and requiring the article's `overflow-hidden` to move
  down to the image wrapper first.
- **Both stacks' geometry is respecified in §12**, on one width-relative
  basis — the reserve that leaves 25px of dead space under every collection
  tile, the taper that runs backwards on the chapbook, and the fixed `mb-16`
  that lets the chapbook tile overrun its neighbour by ~163px at its current
  cover height.
- `CollectionStack` keeps its role unchanged — `mindtober-21` has images, so
  an `illustrated` collection still gets the image stack in the gallery.

---

## 7. Bugs to fix on the way

Independent of the redesign; all in the blast radius.

1. **Lightbox paging lands on pieces with no image.**
   `app/work/[slug]/page.tsx` passes `items={item.pieces}` — every piece,
   including text-only ones. In a mixed collection, paging through the
   lightbox hits tinted placeholders. Filter to `pieces.filter(p => p.image)`
   and map `initialIndex` into the filtered array.
2. **`WriteupMark` collides with the quote icon.** It's positioned
   `absolute left-3 top-3` on the tile wrapper, which is where `TextTile`'s
   `Quote` glyph sits. Move it to `right-3` on text tiles, or into the tile's
   own header row.
3. **Page-turn wraparound** — §5a.
4. **`speedpaintAspect` is set nowhere** (TODO §3) — while `VerseBlock` work
   is open in the same files, either delete the field and its fallback branch
   or write down why it stays.

---

## 8. Data migration

All in `lib/work.ts`.

| # | Change | Scope |
|---|---|---|
| 1 | `excerpt:` → `text:` | 25 pieces — 22 chapbook poems + 3 standalone essays |
| 2 | Mindtober tercets: `description` → `text`, ` / ` → `\n` | 31 pieces |
| 3 | Delete `hasImage` from the type and from `work.sample.ts` | type + sample only; zero real pieces |

No `preview` is edited. An earlier draft proposed trimming two long ones; that
was a misread of a deliberate choice — see §3d.

Change 2 is the one with judgment in it. The tercets are stored as
`'line one / line two / line three'`; a mechanical `.replaceAll(' / ', '\n')`
inside the collection's existing `.map()` is safer than editing 31 string
literals by hand, and keeps Beck's text **verbatim** — which is a standing
rule for anything taken from Instagram (see ARCHITECTURE §Conventions).
Check the output for tercets containing a slash for reasons other than
lineation before committing.

Mindtober pieces have **no `writeup`** and, after change 2, no `description`.
That's correct — the tercet *is* the caption. Don't invent glosses.

---

## 9. Order of work

Each step should build clean on its own.

1. **Model** — §2. Add `text`, loosen `description`, rewrite `isHybrid` /
   `isTextForward`, add `collectionLayout` + `layout`, fix the search
   haystack, fix the metadata fallbacks. Migration 1 + 4.
2. **`VerseBlock`** — §3. Swap it into today's `ExcerptBlock` call sites and
   confirm the chapbook still renders before changing any layout.
3. **Chapbook** — §4a, §4b, §5a. Front matter, two-column contents,
   `/read`, reading-page chrome and end-of-book nav.
4. **Tile extraction** — §4d. `PieceTile` out of the route file, gallery
   collections rendering identically to before. Pure refactor; diff the
   rendered HTML of an untouched collection like `inktober-17`.
5. **Hybrid** — §2c wiring, §4c, §5b, §6. Migration 2 + 3. This is the step
   where `mindtober-21` changes shape.
6. **Bugs** — §7.
7. **Stack geometry** — §12. Fully independent of steps 1–6; do it whenever.
   Nothing in the data needs to change first — the reserve is fixed in the
   formula, and the tall cover it currently breaks against stays exactly as it
   is, as the test case.

## 10. Verification

- `pnpm exec tsc --noEmit` clean.
- `next build` clean. Page count goes **198 → 199** (one new `/read` page).
  Any other delta means a route's `generateStaticParams` changed by accident.
- `/work/love-worth-heartbreak` — two-column contents, both entry points.
- `/work/love-worth-heartbreak/spring-cleaning` — the mixed case: a two-line
  italic verse stanza above an upright prose paragraph, no wrapped verse
  lines, no tag row.
- `/work/love-worth-heartbreak/metaphorical-safety-blanket` — first page, no
  "previous".
- `/work/love-worth-heartbreak/spring-cleaning` is also the last page — its
  forward affordance is "back to contents".
- `/work/mindtober-21` — two columns, tercets lineated at reading weight.
- `/work/mindtober-21/30-memory` — image *and* verse both present.
- `/work/note-systems` — the essay case: upright on the page, still slanted on
  its gallery card.
- `/work/inktober-17` — visually unchanged. This is the regression canary for
  step 4.
- `/work?q=memory` — still finds `mindtober-21`, proving the search haystack
  followed the tercets into `text`.

---

## 11. Decisions recorded

| Topic | Decision |
|---|---|
| **Hybrids** | Real. `mindtober-21` is one and always was; the model just couldn't say so. |
| **Voice** | *Beck:* italic for poems and songs — the slanted casual mono is a deliberate style choice, part typewriter, part practical. Italic is the default and stays it. |
| **Prose runs** | *Proposed, not Beck's:* an unbroken stanza over 90 characters sets upright. Delete the branch if it reads wrong. |
| **Verse vs. prose granularity** | Per **stanza**, not per piece — four pieces in the chapbook are genuinely mixed, so no piece-level field can describe them. |
| **Reading measure** | `58ch` (from `max-w-md`'s ~47), chosen as a comfortable measure for the prose poems. Clearing the 51-character longest verse line is a side effect, not the goal. |
| **Hanging indent** | *Beck:* keep it subtle. One character (`1ch`), on the character grid because the face is mono. Wraps don't need to be obviously distinct from line breaks. |
| **Contents** | Two columns, folio + title only. No first lines, no glosses. |
| **Read-through** | Yes — `/work/[slug]/read`, one static page. |
| **Layout selection** | Derived from what the pieces carry, with an explicit `layout` override available and **currently unused**. |
| **Tag rows on book pages** | Removed. Identical on all 22 pages; they belong to the collection. |
| **Tile height follows content** | *Beck:* a masonry column gives taller tiles more room, and a long `preview` is how a piece claims it. `love-worth-heartbreak`'s 13-line cover is deliberate. Previews are never clamped, capped, or trimmed. |
| **Stack reserve** | Sized to **rest**, not hover — rest sets the grid's rhythm. Hover opens by flattening rotation, so the tile's bottom edge never moves. |
| **Stack taper** | One table for both stacks: strips of 28% / 17.5% / 11% of column width, ratio ~0.63, monotonic tilts. Replaces a 0.33-then-0.87 cliff and, on the chapbook, an inverted taper. |
| **One chrome idiom** | Collection tiles and standalone cards both use the same sticky `bg-card` panel. `ImageCard`'s gradient band goes; its `overflow-hidden` moves to the image wrapper, since a clipping ancestor disables sticky. |
| **Title chrome** | `position: sticky` inside a tile-spanning wrapper, not `absolute bottom-6`. On a ~911px chapbook tile the hover label would otherwise fade in off-screen. May ride as high as the cover; 1rem margins on all sides. |
| **Anchoring** | *Beck:* position by how much shows — from the bottoms — and fall back to an offset from the tops when that fails. Implemented as bottom-anchoring plus `max-h-full`, which makes the two modes converge at the clamp rather than switching between them. |
| **Cover-height floor** | Each card must be at least as tall as its own peek (98 / 61 / 38px) — not the cumulative offset, since a card hides behind the one in front, not behind the cover. Unreachable for text cards; images clear it until 3.6:1. |
| **Peek content** | `TextCardFace`'s excerpt takes `flex-1 min-h-0`, so the title stays in the peek whether the card has slack or is clamped. |
| **Deck geometry basis** | Percentages of the **column width** — never card height, `em`, or px. Width is the one dimension that is constant across aspect ratios, cover heights, and breakpoints, and it is the unit the corner dip is already in. |
| **`excerpt` → `text`** | Renamed. It held two different things — a complete poem on 22 pieces, a real pull quote on 3 — and `text` ("the words this page shows") is true of both. |
| **Slant in cards** | Always italic in a card, regardless of prose. The quote glyph and tint make it a quotation there; the slant is that voice. |

---

## 12. Collection stack geometry

The fanned deck behind a collection tile — `CollectionStack` (images) and
`ChapbookStack` (text), both in `components/work-visuals.tsx`. Two problems:
the **reserve** (why the margins read wrong) and the **taper** (why the
offsets read wrong). Both are fixed by putting the whole deck on one
resolution-independent basis.

### 12a. Everything is a percentage of the column width

**The deck's geometry must not depend on any card's height.** Card height
varies three ways — a collection's `imageAspect`, a chapbook cover's text
length, and the breakpoint — and any offset expressed against height inherits
all three. Card *width* varies none of those ways: every tile in the masonry
is exactly one column wide, so a width-relative deck is identical for a square
collection, a 4/5 collection, and a 22-poem chapbook.

Three things fall out of that choice, and each one deletes a problem:

1. **Percentage vertical margins resolve against the containing block's
   width**, not its height. That's the standard box-model rule (unlike
   `translate-y`, which resolves against the element's own height), and it's
   what makes this expressible in plain CSS with no measurement.
2. **The corner dip is already a width.** Rotating about `origin-bottom`
   (bottom *centre*) swings a bottom corner down by `(cardWidth / 2)·sin θ` —
   an absolute length with no height term at all. As a percentage of width it
   is exactly `50·sin θ` %. In the same unit as the offsets, for free.
3. **`CollectionStack` stops needing to know the aspect ratio.** The current
   reserve parses `item.imageAspect` and divides by `hRatio` to convert the dip
   into height units. All of that goes: no `wRatio`/`hRatio`, no `'5/4'`
   fallback, no `containerAspect`.

For reference when reading the pixel figures below: the column is **350px**
wide at every breakpoint — `max-w-6xl` (1152) − `px-8` (64) − two `gap-5`
gutters (40), over three columns = 349px at `lg`; ~358px at `sm`; ~350px on a
390px phone. Those pixels are *illustrations of* the ratios, never inputs to
them.

### 12b. The reserve is sized to hover, so every tile carries dead space

`CollectionStack` builds its container height from `CARD4_HOVER_PEEK` /
`CARD4_HOVER_TILT` — the **hover** state. The existing comment calls this "the
correct trade". Measured, it isn't:

| State | Deepest card-4 ink | Container |
|---|---|---|
| rest | `74% + dip(3°)` = 76.62% | 183.87% |
| hover | `83% + dip(1°)` = 83.87% | 183.87% |

**7.25% of a card height of dead space under every collection tile, always** —
25px at a 350px square card. With `gap-5` that's a 45px gutter below a
collection and a 20px gutter below everything else in the same column. That is
the rhythm break.

Rest is the state that sets the grid's rhythm and is on screen essentially
always. It should be the exact one.

**Fix: pin the deepest point across both states.** Hover still opens, but it
opens by *flattening rotation* rather than pushing the deck down — card 4
moves down a hair and un-tilts by just enough to cancel it. With the ratios in
12d, rest and hover agree to **0.03% of the column width** (0.1px), so the
tile's bottom edge does not move at all.

Keep card 1's hover lift at `-translate-y-0.5`. That 2px deliberately matches
`ImageCard`'s `hover:-translate-y-0.5` so a collection answers the cursor like
its neighbours; don't raise it to compensate for the smaller fan.

### 12c. The taper isn't a taper

A card's visible strip is the difference between consecutive offsets. Today:

| | card 2 | card 3 | card 4 |
|---|---|---|---|
| offset (% of height) | 46% | 61% | 74% |
| **strip** | **161px** | **52px** | **46px** |
| ratio to previous | — | 0.33 | **0.87** |

A cliff, then a plateau. Card 2 shows *46% of a whole image*, so the tile reads
as two overlapping cards with two slivers under them rather than as a deck;
then cards 3 and 4 land within 6px of each other and the last step doesn't
taper at all.

`ChapbookStack` runs **backwards**:

| | card 2 | card 3 | card 4 |
|---|---|---|---|
| offset | 8% | 16% | 26% |
| **strip** (212px cover) | **17px** | **17px** | **21px** |

Flat, then growing. Its own comment says "each card's peek and tilt smaller
than the one in front", which is the opposite of what it does. (That comment
also claims text boxes need "a bigger percentage here than the image stack
used" — the code uses 26% against 74%. The comment is backwards from the code;
it gets rewritten anyway.)

Tilts wobble too: 4° / −4.5° / 3° is non-monotonic, so the lean doesn't settle.

### 12d. One table, both stacks

Strips in geometric decay at ratio ≈ 0.63, tilts monotonic, all values
**percentages of the column width**:

| Card | strip | rest | hover |
|---|---|---|---|
| 1 (cover) | — | in flow, `rotate-0` | `-translate-y-0.5` |
| 2 | 28% | `mt-[28%] rotate-[3.5deg]` | `mt-[30%] rotate-[1deg]` |
| 3 | 17.5% | `mt-[45.5%] rotate-[-2.5deg]` | `mt-[46.8%] rotate-[-1deg]` |
| 4 | 11% | `mt-[56.5%] rotate-[1.5deg]` | `mt-[57.4%] rotate-[0.5deg]` |

Reserve on the outer container, `deepest offset + 50·sin(tilt)`:

```ts
// dip(θ) as a percentage of the card's width — no height term, no aspect ratio
const dip = (deg: number) => 50 * Math.sin((deg * Math.PI) / 180)

const RESERVE_WITH_CARD4 = 56.5 + dip(1.5)  // 57.81%
const RESERVE_CARD3_ONLY = 45.5 + dip(2.5)  // 47.68%
```

Both agree with their hover counterparts — `57.4 + dip(0.5) = 57.84%` and
`46.8 + dip(1) = 47.67%` — to within 0.03% of the column width.

**Every collection in the tree today renders identically to these numbers
under the old height basis**, because all nine are `imageAspect: '1/1'` and a
square card's width equals its height. The change is entirely about what
happens the first time one isn't square. At 350px: strips of **98 / 61 / 38px**
at rest, ratios 0.62 and 0.63.

### 12e. The markup: bottom-anchored cards

Both stacks take the same shape. The cover sits in normal flow and sizes the
inner box. The backing cards are absolutely positioned and **anchored to that
box's bottom edge**, pushed further down by a negative `margin-bottom` — which,
like every percentage margin, resolves against the containing block's
**width**.

```tsx
<div className="relative pb-[57.81%]">      {/* reserve — % of column width */}
  <div className="relative">                 {/* sized by the cover alone */}
    {hasMore && <div className="deck-card absolute inset-x-0 bottom-0 h-full   mb-[-56.5%]" />}
    <div className="deck-card absolute inset-x-0 bottom-0 max-h-full mb-[-45.5%]" />
    <div className="deck-card absolute inset-x-0 bottom-0 max-h-full mb-[-28%]" />
    <Cover className="relative ..." />       {/* card 1, in flow */}
  </div>
</div>
```

The `mb` values are the **cumulative** offsets from §12d — 28 / 45.5 / 56.5 —
because every card anchors to the same bottom edge. Consecutive differences are
the peeks: 28, 17.5, 11.

Notes that are easy to get wrong and expensive to debug:

- **`bottom-0` with `top` left auto, never `inset-0`.** With `inset-0` the box
  is over-constrained — `top`, `bottom` and `height: auto` resolve together, so
  a margin is absorbed by *resizing* the card rather than moving it, and the
  deck collapses. Anchoring from one edge only is what lets the margin do what
  it looks like it does.
- **`max-h-full` on cards 2 and 3.** This is the whole fallback mechanism; see
  §12h. It is not a safety net, it is load-bearing.
- **`h-full` (not `max-h-full`) on card 4** in `ChapbookStack`. That card is
  deliberately blank, so its natural height is **zero** and it would sit
  entirely below the deck with nothing behind it. It needs the cover's height
  handed to it outright.
- **Image backing cards keep `aspect-[5/4]` + `style={aspect}`.** They contain
  `<Image fill>`, which needs a definite height, and with `height: auto` they
  would collapse. The aspect is what gives them their height; `max-h-full` then
  clamps it. (For every collection today the two agree exactly, since all are
  `1/1` — the clamp is a no-op and only matters for a future non-square one.)
- The cover must be `relative`, not the flow default `static`. Positioned
  elements paint above static ones as a group regardless of DOM order, so
  without it the backing cards paint over the cover.
- **No `overflow-hidden` on the inner box**, and no horizontal padding or
  border on either box — the offsets and the reserve are percentages of two
  different elements' widths, and they are only the same number while both
  boxes are exactly the column width.
- `CollectionStack`'s card 1 changes from `absolute inset-x-0 top-0` to
  `relative`, and its container loses `style={{ aspectRatio: containerAspect }}`
  entirely. `containerAspect`, `cornerDip`'s aspect arithmetic, and the
  `imageAspect` parsing all delete.
- `ChapbookStack` loses `mb-16` / `mb-10`. It was a fixed pixel margin against
  percentage-of-height offsets, which can only be correct at one cover height —
  at `love-worth-heartbreak`'s current cover (~709px) it under-reserves by
  roughly 163px and the tile overruns the next one in its column. The
  width-relative reserve is correct at *every* cover height, so the tall cover
  needs no adjustment: it is supported, not tolerated.

### 12f. Why width and not height, in one line each

Worth writing into the comment, because both alternatives look reasonable:

- **Not % of card height.** A deck's thickness shouldn't change because the
  sheets are taller. A 3/4 collection would get a 30% fatter deck than a square
  one and a 5/4 collection a 20% thinner one, for no reason a reader could
  name — and a chapbook's deck would swell with how much text is on its cover,
  which at `love-worth-heartbreak`'s ~709px cover means a **410px** deck, twice
  the height of an ordinary tile, all of it blank card edge.
- **Not `em` or `px`.** Fixed against a fluid card: the deck would look right
  at one column width and wrong at the others, and it wouldn't scale with the
  artwork the way every other measurement on the tile does.
- **Width.** Constant per breakpoint, identical across aspect ratios and cover
  heights, and the same unit the corner dip is already in.

**This does not flatten tile heights, and isn't meant to.** The cover stays in
normal flow and still sizes the tile, so a 13-line preview still makes a tall
tile and a square collection still makes a short one — the masonry variation in
§3d is fully intact. What becomes constant is only the *deck*: the strip of
card edges below the cover. Those two are independent, and separating them is
what lets a cover grow without dragging a proportionally absurd fan along
behind it.

### 12g. Mixed aspect ratios inside one collection

Beck's case: pieces in the same collection with different `imageAspect`s.

The deck already normalizes this and should keep doing so — `CollectionStack`
applies the **collection's** `aspectStyleFor(item)` to all four cards, and
`WorkPlaceholder` draws them `object-cover`, so a portrait piece is
centre-cropped into the collection's card shape. That's correct: four cards of
different shapes stacked at an offset reads as broken, not as varied. Record it
as a decision rather than leaving it to look accidental.

What changes is that this normalization can no longer desync anything. Under
the old formula the reserve was computed from `item.imageAspect` while the
cards were drawn at their own; now the reserve consults no aspect at all, so a
per-card shape override can never leave the container the wrong height.

Varied aspects still show where they belong: `aspectStyleFor(p)` on the
collection page's piece grid and on the gallery's standalone `ImageCard`, both
per piece, both untouched by this.

### 12h. Anchoring: bottoms by default, tops as the fallback

**Beck's rule, and it's the right one.** Position each backing card by *how
much of it shows* — the distance from the previous card's bottom edge to its
own — and fall back to an offset from the tops when that doesn't work.

Why the default has to be bottoms: a peek shows the strip between two bottom
edges, so bottom-anchoring makes the peek **exactly** its target no matter how
tall the card behind happens to be. Top-anchoring makes the peek
`offset + Hₙ − coverH`, which drifts with every card's own content and goes
*negative* — the card vanishes entirely behind the cover — whenever a backing
card is shorter than the cover by more than its offset. With a 709px cover and
a 329px card 2, top-anchoring hides card 2 completely.

When bottoms don't work: a card much **taller** than the cover, bottom-anchored,
has its top pushed up past the container's top edge and pokes out above the
deck. Unclamped, a 329px card behind a 183px cover overhangs by 48px; a 709px
card behind a 153px cover overhangs by 458px.

**The fallback is `max-height`, and it lands exactly where you said it should.**
Clamp each backing card to the cover's height and the arithmetic collapses:

```
tₙ = (coverH + cumₙ) − min(Hₙ, coverH)
   = cumₙ                                when Hₙ ≥ coverH
```

A card at the clamp sits at `cumₙ` from the container top — **precisely the
top-anchored position**. So the clamp isn't a branch between two modes; it's
the point where the two modes meet. Bottom-anchoring governs while the card is
shorter than the cover (where it's the mode that works), top-anchoring governs
once it's taller (likewise), and the handover is continuous. No measurement, no
JS, no conditional.

Verified against every combination that can occur:

| | card 2 | card 3 | card 4 |
|---|---|---|---|
| square image, uniform 350px | ok | ok | ok |
| chapbook, 709px cover | ok | ok | ok |
| chapbook, 183px cover, 329px backers | ok | ok | ok |
| chapbook, 153px cover, 709px backers | ok | ok | ok |

Two floors remain, and both are stated as invariants rather than defended
against:

- **No poke-out is now structural.** A clamped card can never exceed the
  cover's height, and the condition is `Hₙ ≤ coverH + cumₙ₋₁`. Always true.
- **No detach needs `Hₙ ≥ peekₙ`** — each card at least as tall as its own
  strip: **98 / 61 / 38px**. Note this is each card's *own* peek, not the
  cumulative offset: card 4 hides behind card 3, not behind the cover. A
  `TextCardFace` is 124px of chrome before any text, so the chapbook clears it
  unconditionally. An image cover clears it until it is wider than **3.6:1**.

> An earlier draft of this section put that floor at 198px — the cumulative
> offset — and concluded chapbook covers needed ≥3 rendered lines. That was
> wrong: it tested each card against the *cover's* bottom instead of against
> the card actually in front of it. The real floor is 98px, roughly half, and
> nothing in the tree or plausibly near it comes close.

### 12i. `TextCardFace` must keep its title in the peek

A peek shows the **bottom** strip of the card behind it, but `TextCardFace` is
`flex h-full w-full flex-col p-6` with everything top-aligned. Under §12e a
backing card is sized between its own content and the cover, so the peek lands
in whatever space is left over — which, with a tall cover, is empty card.

At `love-worth-heartbreak`'s 709px cover, a backing card with four rendered
lines has ~241px of content and **468px of blank tinted card below it**. The
98px peek shows no poem, no title, no arrow. Just colour. This is live in the
tree today, it gets worse exactly as the cover gets taller, and it works
directly against the tall-cover choice in §3d.

**Fix: make the excerpt the flexible element, not the title row.**

```tsx
<p className="... flex-1 min-h-0 overflow-hidden">{excerpt}</p>
```

`flex-1` absorbs slack so the title is pushed to the bottom, and `min-h-0`
lets the paragraph shrink below its content height so that when the card is
clamped instead the *excerpt* clips and the title survives. Both cases, one
declaration.

`mt-auto` on the title row is the obvious alternative and it only handles half
of it: with no free space to distribute — the clamped case — an `auto` margin
resolves to zero and the title clips off the bottom, which is the case that
matters most.

### 12j. The count pill sets a floor on card 4's strip

`CollectionMark` is `px-2.5 py-1 text-xs` ≈ 24px tall at `bottom-2` (8px), so
its top is **32px** above card 4's bottom edge. If card 4's visible strip is
under 32px the count disappears behind card 3 — and this floor is genuinely
absolute, since it's a pill of fixed-size text.

Tilt helps on the right-hand side, where the pill sits: card 3's bottom-right
corner swings *up* and card 4's swings *down*, adding
`(W/2)·(sin|θ₃| + sin θ₄)`. Checking the two widths that matter — 350px
(every real breakpoint) and 280px (a 320px phone, the narrowest plausible):

| | strip | + tilt | vs 32px floor |
|---|---|---|---|
| W=350, rest | 38.5px | +12.2 = 50.7px | ✓ |
| W=350, hover | 37.1px | +4.6 = 41.7px | ✓ |
| W=280, rest | 30.8px | +9.8 = 40.6px | ✓ |
| W=280, hover | 29.7px | +3.7 = 33.4px | ✓ (tightest, 1.4px spare) |

It holds everywhere, but only just at the narrow end. **Don't reduce card 4's
11% strip or flatten its rest tilt below 1.5° without redoing this table.**
Put the floor in a comment beside the constants — it is not recoverable from
reading them.

### 12k. Put the numbers in one place

The current code carries this hazard in its own words: *"Tailwind only picks up
arbitrary values written out as literal class strings, so these can't drive the
classes directly — keep the two in sync by hand."* Four offsets exist twice, as
a literal class and as a JS constant, and the reserve is silently wrong if they
drift.

Drive the transforms from inline custom properties so JS is the only source of
truth for both the styles and the reserve:

```tsx
const DECK = {
  card2: { y: '28%',   r: '3.5deg',  hy: '30%',   hr: '1deg' },
  card3: { y: '45.5%', r: '-2.5deg', hy: '46.8%', hr: '-1deg' },
  card4: { y: '56.5%', r: '1.5deg',  hy: '57.4%', hr: '0.5deg' },
} as const
```

```css
/* globals.css */
.deck-card { margin-top: var(--y); transform: rotate(var(--r)); }
.group:hover .deck-card { margin-top: var(--hy); transform: rotate(var(--hr)); }
```

Transition `margin-top` and `transform` together
(`transition-[margin,transform,box-shadow]`). Note this replaces Tailwind v4's
individual `translate`/`rotate` properties, so `CollectionStack`'s
`transition-[translate,rotate,box-shadow]` changes — and `ChapbookStack`
already transitions `transform`, so this also removes an existing
inconsistency between the two.

The reserve is then derived from the same table rather than restated:

```ts
const deepest = hasMore ? DECK.card4 : DECK.card3
const reserve = parseFloat(deepest.y) + dip(parseFloat(deepest.r))
```

### 12l. The title chrome must stay in view — `sticky`, not `absolute`

`CollectionTile`'s title card is `absolute inset-x-4 bottom-6`, pinned to the
bottom of the tile. That was fine when every tile was ~640px. It isn't now: the
chapbook tile is roughly **911px** (a 709px cover plus a 202px deck), taller
than many viewports.

The failure is specifically a *hover* failure, which is what makes it bad. The
card is `opacity-0` until `group-hover`, so the sequence is: you point at the
part of the tile you can see, the label fades in at the bottom of the
tile — off-screen — and nothing appears to happen. The tile looks inert.

**Requirement (Beck's):** if any part of the collection is in the viewport, its
chrome is in the viewport, with margins; and it may ride as high as the cover
if the cover is all that's showing.

That is `position: sticky` almost exactly. Sticky needs a flow position, so the
chrome moves into a tile-spanning wrapper and stops being absolutely positioned
itself:

```tsx
{/* wrapper spans the tile: it is the sticky containing block, so the chrome
    can travel anywhere over the deck but never past the cover's top edge */}
<div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end p-4">
  <div className="sticky bottom-4 mx-auto w-full max-w-[min(85%,20rem)] rounded-xl border border-border bg-card p-4 opacity-0 shadow-lg transition-all duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
    …title, description…
  </div>
</div>
```

How each case resolves, which is worth checking against the requirement one by
one:

| Scroll state | Behaviour |
|---|---|
| whole tile in view | chrome sits at its flow position, the tile's bottom — unchanged from today |
| tile taller than the viewport, viewing its top | flow position is below the scrollport, so sticky lifts the chrome to 1rem above the viewport bottom |
| tile entering from the bottom, only its top sliver showing | the sticky offset is clamped to the containing block, so the chrome rides up into the cover — "as high as the top card" |
| scrolled past, only the tile's bottom showing | chrome is at the tile's bottom, in view |

`justify-end` gives it the same resting place it has today, `bottom-4` is the
viewport margin, and the wrapper's `p-4` is what stops it reaching the very top
edge — that's the other margin.

Two things that will silently break it:

- **`overflow: hidden` on any ancestor** disables sticky entirely. Nothing
  between the chrome and the scrollport may clip: not `CollectionTile`'s
  wrapper, not the `Link`, not the stack's outer or inner box. §12e already
  forbids it on the inner box for a different reason; this makes it
  load-bearing twice over.
- **A `transform` on an ancestor** would make that ancestor the containing
  block and re-anchor the sticky constraint. The deck's cards carry transforms,
  but the chrome is a sibling of the stack, not a child of a card — keep it
  that way.

The existing `translate-y-2 → group-hover:translate-y-0` rise-in is safe: a
transform on the sticky element itself is purely visual and doesn't affect
where sticky places it.

**Open, and deliberately not decided here: the count pill.** `CollectionMark`
sits inside card 4 at `bottom-2 right-2`, so it has exactly the same visibility
problem — on a tall tile the count is off-screen whenever the chrome is. But it
is seated in card 4 on purpose: the current comment explains that the blank
fourth card exists *to carry the total*, so it reads as an honest "and N more"
rather than an open-ended tease. Moving it into the sticky chrome would make it
reliably visible and undo that.

Recommendation: **leave it in card 4.** The chrome's job is identifying the
collection while scanning, which is the title and the blurb; the count is
secondary and fine to see only when the deck's bottom is in view. Duplicating
it into the chrome would put "22 pieces" on screen twice at once for every
short image collection, which is the common case. If Beck would rather have it
always readable, the move is to take it *out* of card 4 rather than duplicate
it — and card 4 then needs a new reason to exist.

### 12n. Note — standalone cards get the same chrome

`ImageCard` has the same problem and the same fix. Because it also requires
undoing an `overflow-hidden` that would disable sticky outright, it's written
up separately as **§13**.

### 12m. Verification

- Screenshot `/work` at ≥1024px. Measure the gap under `inktober-17` and under
  a plain card like `protest-sign` in the same column: both must be **20px**.
  Today the collection's is 45px. This is the single check that matters.
- Hover any collection: the tile's bottom edge must not move.
- **The aspect-independence check.** Temporarily set `imageAspect: '3/4'` on
  `eye-studies` and reload. The cards change shape; the deck's depth below the
  cover and the gap to the next tile must be **unchanged**. Under the current
  code they aren't. Revert after.
- `love-worth-heartbreak`'s tile must not overlap the tile below it, with its
  13-line preview left exactly as it is. Then temporarily swap the cover for a
  2-line preview (`stackPieces: ['lost']` is the quickest way) and confirm the
  gap below is still one clean gutter. Correct at both extremes is what proves
  the reserve is structural rather than tuned to one cover. Revert after.
- Card 4's count pill fully visible on `inktober-17` at rest and on hover, and
  again with the window narrowed to ~320px (12j's tightest case).
- `i-think-that-im` and `philosophy-animation` (3 pieces, no card 4) — card 3
  becomes the deepest layer and the reserve drops to 47.68%. They are the only
  exercise of that branch.
- **Peek content, at two cover heights.** On `love-worth-heartbreak` as it
  stands, cards 2 and 3 must show their poem's title and arrow in the peek, not
  blank card (12i). Then set `stackPieces: ['lost', 'gluttony', 'puzzle-pieces']`
  to give it a short cover with taller cards behind it, and confirm the peeks
  still show titles, the strips are still 98 / 61 / 38px, and nothing pokes out
  above the cover (12h's clamp). Revert after.
- Deck offsets must move the cards **down**, not resize them. If a backing
  card's bottom edge lines up with the cover's, the markup regressed to
  `inset-0` (12e).
- `ChapbookStack`'s card 4 must be visible at all. It is blank, so with
  `max-h-full` instead of `h-full` its natural height is zero and it drops out
  of the deck entirely (12e).
- **Sticky chrome, in a short window.** Narrow the browser to ~600px tall,
  scroll `love-worth-heartbreak`'s tile so only its top third is showing, and
  hover it. The title card must appear *in the viewport*, not at the tile's
  bottom. Then scroll until only a sliver of the tile's top is at the bottom of
  the screen — the chrome should ride up over the cover rather than disappear
  (12l). Repeat on `inktober-17`, where the tile is short enough that the
  chrome should never move from its resting place at all.

---

## 13. Standalone card chrome

`ImageCard`'s label is a full-bleed gradient band —
`absolute inset-x-0 bottom-0 … bg-gradient-to-t from-card via-card/85
to-transparent`, holding the title and the medium pill, `opacity-0` until
`group-hover`. Replace it with the same sticky panel the collection tile gets
in §12l.

### 13a. Why it has the same problem

Standalone cards are shorter than the chapbook tile but not short enough to be
safe. At the 350px column, the tallest aspects in the tree come out around
**437px** (`4/5`, and `1440/1777` at 432px) — comfortably able to have their
bottom edge off-screen on a laptop viewport mid-scroll. The failure is the same
hover failure: you point at the visible part, the label fades in below the fold,
and the card reads as inert.

The consistency argument matters as much as the mechanics. Once collections
have a chrome panel and standalone pieces have a gradient band, two things that
sit side by side in the same masonry answer the cursor in two different visual
languages.

### 13b. The blocker: `overflow-hidden` on the `<article>`

**This has to be undone first, or sticky silently does nothing.** The article
carries `overflow-hidden rounded-2xl border`, and any clipping ancestor
disables a sticky descendant.

That `overflow-hidden` is there to round the image's corners, so the clipping
moves down to the image wrapper — which already has `overflow-hidden` and only
needs the radius:

```tsx
<article className="group relative rounded-2xl border border-border bg-card …">
  {/* was: aspect-[5/4] overflow-hidden */}
  <div className="aspect-[5/4] overflow-hidden rounded-[calc(1rem-1px)]" style={aspectStyleFor(item)}>
```

`rounded-2xl` is `1rem` and the border is `1px`, so the inner radius is
`calc(1rem - 1px)` — the wrapper sits inside the border, and inheriting the
outer radius directly would leave a hairline of square corner showing at each
edge.

`WorkPlaceholder` renders its own square-cornered `overflow-hidden` div inside,
which is why the radius has to land on this wrapper specifically rather than
anywhere further in.

### 13c. The panel

Same construction as §12l, same visual treatment as the collection chrome, so
the two read as one idiom:

```tsx
<div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end p-4">
  <div className="sticky bottom-4 mx-auto flex w-full max-w-[min(85%,20rem)] items-end justify-between gap-3 rounded-xl border border-border bg-card p-4 opacity-0 shadow-lg transition-all duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
    <Link href={workHref(item)} className="pointer-events-auto …">
      <h3 …>{item.title}</h3>
    </Link>
    {medium && <TagPill className="pointer-events-auto">{medium}</TagPill>}
  </div>
</div>
```

- **Content is unchanged** — title on the left, medium pill on the right. Only
  the container changes. The collection chrome also carries a two-line
  description; adding one here would be a content change rather than a chrome
  change, so it isn't proposed. It's available if wanted.
- `rounded-b-[inherit]` goes away with the gradient, and so does the
  `translate-y-1 → group-hover:translate-y-0` rise, which existed to make the
  band slide up out of the card edge. A panel that isn't attached to the edge
  doesn't need it; keep the opacity fade alone, matching §12l.
- The `from-card via-card/85 to-transparent` scrim existed to keep the label
  legible over artwork. A solid `bg-card` panel does that on its own, so
  nothing is lost.

### 13d. What stays put

- **`MediaBadges`.** The speedpaint dot is `absolute right-2.5 top-2.5` and the
  animation triangle is centred — both anchored to the image, both visible
  whenever the card's *top* is in view, which is the case that matters. They
  are indicators about the artwork, not chrome about the card. Leave them
  absolute.
- **`TextCard` and `HybridCard`.** Their text is in normal flow inside the
  card body, not overlaid, so there is nothing to keep in view. No change.
- **The collection page's piece tiles.** Same — title and description are in
  flow beneath the image.

### 13e. Verification

- `protest-sign` or `desire-and-distance` (the tall `4/5` pieces) in a ~600px
  window, scrolled so only the top of the card shows: hovering must bring the
  panel into the viewport, not to the card's bottom edge.
- The image's corners must still be round. If they've gone square, the radius
  didn't make it onto the image wrapper (13b).
- Sticky must survive the article's `hover:-translate-y-0.5`. A transform on an
  ancestor shouldn't break a sticky descendant, but it's cheap to confirm — and
  if it does, the 2px lift moves to an inner wrapper rather than the article.
- A short landscape card (`1087/763`, ~246px tall) must look **exactly** as it
  does today apart from the panel shape: sticky never engages on a card that
  fits the viewport.
