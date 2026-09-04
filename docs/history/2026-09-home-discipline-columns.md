# Spec — the home page's three discipline columns (archived)

> **This is history, not current documentation. Status: shipped 2026-09-03.**
> All of §2–§10 built as specced, including the second-pass rewrite in this
> file's own intro (no card, one shared fade, header-mounted CTAs,
> rotate-to-vertical hover, fixed-aspect text rungs). **Current documentation
> is [../ARCHITECTURE.md](../ARCHITECTURE.md)**, under "Discipline columns."
>
> **Where the build diverged, or filled in a value the spec left to tune:**
>
> - **`TEXT_RUNG_ASPECT` is `1` (square), not the `3/2` this file suggests as
>   a starting point.** At `3/2` the all-text writing column landed 36%
>   shorter than the art column — nowhere near §4's "~15%" target — so its
>   last rung sat entirely above the shared fade line with a hard, undissolved
>   edge, and science (also mostly text) fell short of the fade too. Verified
>   by measuring each column's actual rendered height and the fade's start
>   point against every column's last rung, in a real browser, before and
>   after the change. At `1`, art/writing land within ~4.5%, and all three
>   columns' last rungs sit 70–85% of the way into their own height before
>   the fade begins — comfortably past the "begins inside" floor, not at it.
> - **`UnfinishedMark` could not go where §3 implies ("the mark").** A corner
>   badge (`absolute`, top *or* bottom) only survives on the column's very
>   *last* rung — every earlier rung has its bottom portion physically
>   covered by the rung below it (that's the whole mechanism, §4's `show`),
>   so a bottom-corner mark on `colony-selection` (not the last rung) was
>   invisible, hidden under `designing-dna`. Top-corner instead collided
>   with the top-set excerpt text on both drafts, since the badge (~119px)
>   is wider than half of a rung at this size. Shipped as: the mark sits in
>   normal flow directly under the excerpt, inside the same top band the
>   text itself occupies — visible on every rung regardless of position,
>   never overlapping the type. Image/code-demo rungs keep a corner mark
>   (`top-2 right-2`, safely inside the visible top band on any rung); no
>   current piece exercises that branch.
> - **The gallery CTA's pull-up is `-mt-16` (4rem)**, matching the fade
>   length exactly — not specified as a number anywhere in this file, just
>   "pulled up by a negative margin." Verified by screenshot that it lands
>   inside the dissolve without covering still-opaque content above it.
>
> Every other rule — the derived overlap (including the code-demo rail's
> mixed-unit `calc()`), the `x + w ≤ 90` guard, §8's rotation-only open state
> with no `hr`, §3's `preview ?? description` chain, the responsive split
> between one shared fade (`md` and up, side by side) and each column fading
> individually below it (stacked — genuinely necessary and not discussed in
> this file, since a single mask spanning three *stacked* columns' full
> height would only ever dissolve the last one) — shipped exactly as
> specced and was verified in a real browser at 320px and desktop, at rest
> and on hover, and under `prefers-reduced-motion: reduce`.
>
> Shipped [TODO.md](../TODO.md) **§1**. Supersedes
> [2026-09-home-discipline-cards.md](2026-09-home-discipline-cards.md) (the
> tucked-under peek, rejected before it was ever committed) and, through it,
> **§8 of [2026-08-coding-explorations.md](2026-08-coding-explorations.md)**.

Supersedes [2026-09-home-discipline-cards.md](2026-09-home-discipline-cards.md),
whose tucked-under peek was built in full and then rejected on sight. That
build was never committed, so this is a replacement, not a migration.

The job is unchanged and is still the only thing this section has to do:
**imply that there is more here than one thing.** What carries it is **three
loose columns of work, standing directly on the page**, hanging from their own
headers and dissolving together into a single fade that hands off to the
gallery.

> **Second pass, 2026-09-03.** A first version of this spec put the columns
> inside the existing cards, faded each column separately, and kept the whole
> card rotating flat as one object. Beck rejected all three. What changed:
>
> | was | is | §|
> | --- | --- | --- |
> | column lives inside a `.tilt-card` | **no card at all** — columns stand on the page | §6 |
> | each column fades at its own bottom | **one shared fade line** across the section | §5 |
> | each card's CTA sits under its own fade | **CTAs move up into the headers**; only the gallery CTA is in the fade | §5, §6 |
> | the card rotates flat as a unit on hover | **each rung rotates itself to vertical** | §8 |
> | text rungs sized by their own type | **text rungs take a fixed aspect**, so the three columns are comparable | §3 |
>
> The already-built `components/piece-column.tsx` and `app/page.tsx` need all
> five. `COLUMN`'s `hr` field and the `-0.5rem` text-overlap special case both
> disappear entirely.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| The mechanism | **A loose column** — pieces stacked down the page, offset and rotated | Beck, 2026-09-03 |
| Whether one piece leads | **No.** Even run, every piece the same weight | Beck, 2026-09-03 |
| What ends a column | **A fade.** No crop anywhere | Beck, 2026-09-03 |
| Where the fade sits | **One shared line across the whole section**, not per column | Beck, 2026-09-03 |
| Whether there's a card behind the column | **No.** The columns stand alone on the page | Beck, 2026-09-03 |
| Where each discipline's CTA goes | **Up in the header**, above its column | Beck, 2026-09-03 |
| What's in the fade | **Only the gallery CTA** — "see the full gallery" | Beck, 2026-09-03 |
| What hover does | **Each rung rotates itself to vertical**, not the group as a unit | Beck, 2026-09-03 |
| Whether the category becomes chrome | **No** — `StampBadge` stays | Beck, 2026-09-03 |
| Whether the columns match heights | **No.** Different lengths, one shared fade line | Beck, 2026-09-03 |
| Science's two-piece column | **Filled with drafts**, flagged `unfinished` — not left at two | Beck, 2026-09-03 |
| How `delirium` renders | **In the code-demo rail**, static — never as an art piece | Beck, 2026-09-03 |
| Whether pieces are hand-picked or derived | **Hand-picked**, by slug, in `app/page.tsx` | §7 |
| What drives the open state | **The JS-toggled active class, not `:hover` alone** | §8 — still the trap |

---

## 1. What went wrong with the peek, and what each failure demands

The peek was not badly built; it was built exactly as specced. The spec was
wrong. Each failure below maps to a rule later in this document, so the same
thing cannot happen twice.

1. **The geometry radiated into space the layout did not have.** Peeks offset
   up, left, and right, but the cards overlapped by `md:-ml-12` and clipped at
   `overflow-hidden`. The archived spec's own banner flags peek 0 landing
   under the neighbouring card at rest. A mechanism that wants four directions
   inside a container with one free edge. → **§6 removes the container and the
   overlap entirely; §4's column only ever travels down.**

2. **The clip was asked to carry the whole message, and could not.** "At least
   one peek clipped" was *the* signal for "there's more." But the card was also
   clipped by its neighbour, and `rounded-[1.75rem]` meant a corner dying at a
   curved edge read as a rendering mistake rather than a promise. → **§5:
   nothing clips. One fade, shared, pointing at one link.**

3. **It was sold as medium-agnostic and was really image-only.** All three
   writing peeks are type. Two lines of `text-xs` in a 62%-wide square, rotated
   −9°, dimmed, behind the feature, is not an excerpt — it is grey texture. →
   **§3's text rung, sized and set to be read.**

4. **`excerptLines` broke on exactly the pieces the writing card picked.** It
   read `preview ?? text ?? description` and kept the first *source* lines.
   `note-systems` and `chinese-emoji-poetry` carry no `preview`, so it fell to
   `text`, whose first line is a whole paragraph. Two paragraphs in a
   `justify-center overflow-hidden` square clipped at both top and bottom,
   mid-word. → **§3: `preview ?? description`, never `text`, and a line clamp
   instead of a crop.**

5. **The pile could not be composed, because peek sizes were not knowable.**
   Each peek took its native aspect at 62% of the feature's width, so a
   1440/1723 piece was a very different object from a 1/1. → **§4's table sets
   each rung's width explicitly and derives overlap from the piece's own
   aspect.**

6. **The feature was normalised, which the spec forbade.** `PieceFace` hard-
   coded `aspect-[4/3]` with `object-cover`, so `rabbit-in-the-moon` — the
   site's own icon — was centre-cropped on the home page. → **§3: an image
   renders at its own `imageAspect`, always.**

7. **The open state spent motion nobody could see.** A few percent of loosening
   on an already-clipped corner, while the card unrotated, lifted, and scaled.
   → **§8: one legible gesture — the column squares up.**

8. **The square-wrapper existed to work around a unit trap.** `translate(x%,
   y%)` resolves its arguments against the transformed element's own width and
   height, not one shared axis, so every peek was wrapped in a
   `width:100%; aspect-ratio:1` box to make `--y` a percentage of width. →
   **§4: normal flow and percentage margins, which already resolve against the
   containing block's width on every side. §8: no `translate()` at all.**

Findings 1 and 2 are what actually killed it. The rest would have been
survivable.

---

## 2. The mechanism: three loose columns on the page

**Each discipline is a header and a column.** The header carries the
`StampBadge`, the descriptive line, and that discipline's own call to action.
Under it, two to four pieces run down the page — each at its own width,
horizontal offset, and small rotation, each riding up under the one above so
only a band shows. A stack of papers seen from above, splayed down the page.

**There is nothing behind them.** No card, no border, no panel — the rungs are
objects lying on the page, and the page is the desk. The three columns hang
side by side, reach different depths, and **all dissolve at one shared line**
near the bottom of the section. The gallery link sits in that dissolve.

Why this works:

- **It puts the offsets on the axis that has room.** Left and right were
  contested. Down is free.
- **It shows faces, not corners.** A band of a piece is legible as a piece;
  a corner is legible as a corner. This is what makes the writing column
  possible at all.
- **The fade is a better promise than a crop.** A hard edge is ambiguous — it
  could be a mistake. A dissolve is unambiguous, and it points somewhere.
- **One shared fade line makes the three columns one gesture.** Three separate
  fades would read as three independent widgets that happen to be adjacent.
  One line reads as a horizon the whole section runs into — and it gives the
  page exactly one place to go next.
- **It degrades honestly.** A column works at any length, so a thin discipline
  is allowed to look thin rather than being padded. Science was two pieces when
  this spec started and is filled out with flagged drafts rather than
  inventions — §7.

### Not a collection stack

Distinguished from `CollectionStack` (`work-visuals.tsx:530`), which this spec
does **not** reuse:

| | collection stack | loose column |
| --- | --- | --- |
| what it is | a deck seen edge-on, bottom-anchored | a run of pieces in normal flow |
| offsets | vertical only, all cards the same width | width, offset, and rotation vary per rung |
| positioning | `absolute`, with a `paddingBottom` reserve | plain flow, negative percentage top margins |
| overlap | a fixed table of offsets | derived from the piece above's own aspect (§4) |
| count | an explicit "and N more" pill | none — the fade is the signal |
| source | one collection's own `pieces` | unrelated work across a discipline |
| ends | on a blank card carrying the total | in a shared fade, in mid-piece |

They answer different questions. Do not generalise one into the other.

---

## 3. What a rung renders

One component, two branches, derived from what the piece carries — per
ARCHITECTURE's "Behaviour is derived, not stored." No `kind` field, and no
`variant` prop: there is no feature, so there is only one size of thing.

| piece has | rung shows |
| --- | --- |
| `codeDemo` | the poster inside the **code-demo rail** — static, `paused` |
| `image`, no `codeDemo` | the image at **its own `imageAspect`**, `object-cover` inside that box |
| neither | two lines of type in a box of **fixed aspect** (`TEXT_RUNG_ASPECT`) |

Checked in that order. `isCodeDemo()` already exists (`lib/work.ts:315`); no
`kind` field is added for any of the three.

**Rules:**

- **An image is never normalised.** No fallback aspect, no `aspect-[4/3]`, no
  default shape — finding 6. A piece with an `image` and no `imageAspect` is a
  data problem, not a layout problem; every piece picked in §7 has one.
- **A text rung *is* normalised, and that is not the same thing.** It has no
  native aspect to preserve, so it takes a fixed one. This is what makes the
  writing column comparable in height to the art column, which the shared fade
  line (§5) requires: three columns that reach wildly different depths make the
  line read as "the tallest one got cut" rather than as a horizon.
  - Start at **`3/2`** and tune. The target is stated in §4: the writing
    column lands within roughly 15% of the art column's height.
  - Set the type at the **top** of the box, not centred. The band that stays
    visible under the rung below is the top band (§4), so top-set type is
    always the type that shows.
- **A text rung reads `preview ?? description`, and never `text`.** `text` is
  the whole work and its first source line can be an entire paragraph — finding
  4. `preview` is written to be a card-sized pull quote; `description` is a
  single editorial sentence; both are bounded by authorship. Fall back to
  `title` if a piece has neither. This departs from the site-wide
  `preview → text → description` chain on purpose — say so in a comment,
  because it looks like a mistake.
- **The line clamp is what makes the fixed aspect safe.** Two lines, clamped,
  cut on a line boundary. Because the excerpt provably cannot exceed two lines
  and the box is far taller than two lines, the box can carry a fixed
  `aspect-ratio` without ever cropping its own content. That interlock is the
  whole reason this is not a repeat of finding 4 — **if the clamp is ever
  removed, the fixed aspect has to go with it.**
- **Text is set at the section's reading size**, not `text-xs`. The column is
  claiming that Beck writes; an illegible excerpt argues the opposite.
- **A rung is decorative.** `aria-hidden="true"`, `alt=""`, not focusable, no
  tab stop — §9.
- **A code demo renders in its own rail, statically.** `delirium` is filed
  under science and is a code demo; drawn as a plain image rung it reads as a
  painting, which is the one thing it is not. Reuse `CodeDemoFrame`'s **state
  rail** (`components/code-demo-frame.tsx:260`) — the status dot, the state
  word, and the centred `entryName(codeDemo.src)` — sitting above the poster
  (`piece.image`, boxed at `codeDemo.aspect`). That rail is what makes a code
  demo legible as a running thing at a glance, and it costs one bar of chrome.
  - **The rail reads `paused`, with the dot in its muted colour.** It *is*
    paused: the rung is a still. It must never read `running` — the column
    would be claiming something executes when nothing does.
  - **No iframe and no "open standalone" link.** The real frame's anchor is a
    tab stop, and rungs may not add any (§9). Nothing here boots, so nothing
    here needs to be interactive. This is chrome quoted for recognition, not a
    demo miniature — the live-miniature idea was dropped once already
    (archived spec §7) and this does not revive it.
- **A draft rung carries `UnfinishedMark`.** Science's column is filled out
  with essays Beck has in progress (§7), and a column that shows drafts as
  though they were finished work is `lib/content.ts`'s `PROJECTS` wearing a
  better coat. The badge already exists (`work-visuals.tsx:84`) and the gallery
  already uses it; the rung uses the same one. **A piece flagged `unfinished`
  may appear in a column only while it is visibly flagged there.**
- **A rung carries its own ground.** With no card behind it (§6), each rung
  needs its own background, border, and shadow to read as an object lying on
  the page rather than a floating crop.

---

## 4. Geometry

One table, in the manner of `DECK` (`work-visuals.tsx:385`) and for the same
reason: a single source of truth that both the inline custom properties and the
derived offsets read from.

```ts
/** One rung of the loose column. `w` is the rung's width and `x` its offset
 *  from the column's left edge, both percentages of the column's own width.
 *  `r` is its rotation at rest — every rung's open state is 0deg, so there is
 *  no `hr` (§8). `show` is the fraction of this rung left uncovered by the
 *  rung below it: the band you actually see. The last rung's `show` is 1 —
 *  nothing covers it; the fade takes it, or it simply ends (§5). */
const COLUMN = [
  { w: 72, x:  2, r: -2.5, show: 0.52 },
  { w: 76, x: 12, r:  2.0, show: 0.55 },
  { w: 70, x:  6, r: -1.5, show: 0.50 },
  { w: 74, x: 14, r:  3.0, show: 1 },
] as const
```

### Flow, not absolute positioning

Every rung is a block in normal flow. `w` becomes `width`, `x` becomes
`margin-left`, and the overlap becomes a negative `margin-top` — **all
percentages, all resolving against the column's width**, because percentage
margins resolve against the containing block's *width* on every side, including
the vertical ones. This is the same fact `CollectionStack` depends on
("Collection stack geometry" in ARCHITECTURE.md); here it comes for free
instead of needing a wrapper.

`transform` carries rotation and **nothing else**. It does not participate in
layout, so a rotated rung cannot push the column around. Do not put
`translate()` in it — that is finding 8.

### Overlap is derived, not tabled

The negative top margin on rung *i* comes from rung *i−1*'s own height, which is
knowable because **every** rung now has an aspect — an image's `imageAspect`, or
`TEXT_RUNG_ASPECT` for type (§3):

```
aspect(p)   = p.imageAspect ?? TEXT_RUNG_ASPECT          // '4/5' → 0.8
overlap(i)  = -(1 - COLUMN[i-1].show) × COLUMN[i-1].w / aspect(i-1)
```

in percent-of-column-width units. The first pass needed a `-0.5rem` special
case for text rungs because they had no aspect; **that special case is gone**,
and one formula now covers both branches.

**A code-demo rung is taller than `w / aspect`** by the height of its rail
(§3), which is fixed in `rem` and does not scale with the column. Its
successor's overlap therefore mixes units:

```
overlap(i) = calc(-(1-show) × w/aspect % - (1-show) × RAIL_HEIGHT)
```

This is not a hack — `deckLength()` (`work-visuals.tsx:406`) already emits
`calc(45.5% + 40px)` for the one deck card carrying a fixed strip, and its
comment explains why mixing is safe: the percentage still resolves against
width, and the fixed term simply does not participate. Reuse that reasoning,
and ideally that helper.

**Overlap must never cover a text rung's type**, nor a code-demo rung's rail.
A rail buried under the next rung is worse than no rail — the rung then reads
as an image with a mysterious sliver above it. With type set at the top of its
box (§3) and every `show` at or above 0.5, the visible band is always the top
half or better, so the type is always clear. That is an interlock between three
rules, not a coincidence — if `show` ever drops below the fraction of the box
the type occupies, the type gets buried.

### Rungs stay in their own track

`x + w` must not exceed **90** on any rung.

With the cards gone there is no neighbour to hide under (finding 1 is dead), but
the three columns still sit side by side and a rotated rung bleeds past `x + w`
by roughly `h·sin(r)/2` — about 2–3% at these angles. The 10% margin plus the
grid gap keeps every rung inside its own column's track, so the three columns
never tangle.

### Column height

The art and writing columns should land **within roughly 15% of each other**.
This is what `TEXT_RUNG_ASPECT` is tuned against, and it is the condition that
makes §5's shared fade line read as a horizon rather than as an accident. Verify
by looking; it is not a computed constant. If a column runs long, raise its
`show` values rather than shrinking `w` — rungs that get small stop reading as
work.

All three columns should now clear the fade band (§5). Science reaching it
depends on its drafts landing — until they do, its column is short and the band
touches only art and writing.

---

## 5. The shared fade, and the handoff to the gallery

**One fade, at one height, across the whole section.** Not per column.

```
   ⟨ art ⟩              ⟨ writing ⟩           ⟨ science ⟩
   Paintings made…      Short poems and…      Semi-technical…
   look around  →       start reading  →      discover more  →

     ▭                    ▭                     ▭
       ▭                    ▭                     ▭
     ▭                    ▭                     ↑ ends here, unfaded
       ▭                    ▭
  ░░░░░░░░░░░░░░░░ shared fade, one y ░░░░░░░░░░░░░░░░░
            more where that came from
            see the full gallery  →
```

- **The mask goes on one container wrapping all three columns**, not on each
  column. `mask-image: linear-gradient(to bottom, #000 calc(100% - <len>),
  transparent 100%)`, with `-webkit-mask-image` alongside. The container's
  height is the tallest column's, so the band sits at one y by construction and
  no column needs to know about any other. This is the entire implementation of
  "the same height along the bottom" — do not try to synchronise three separate
  masks.
- **A mask, not an overlay gradient — and this is now forced, not preferred.**
  `.night-vignette` is on `<body>` with `background-attachment: fixed` radial
  gradients (`globals.css:251`). With the card gone, the ground under these
  columns is that vignette, not a flat token, so an overlay painted in
  `var(--background)` would be visibly wrong wherever the vignette is doing
  anything. A mask needs no colour knowledge and is correct in both themes for
  free.
- **Fade over a fixed length**, not a percentage — a percentage of a container
  whose height depends on the tallest column would drift every time a pick
  changes.
- **The gallery CTA sits in the fade.** "more where that came from" and "see
  the full gallery" move up out of their own section and into the band, pulled
  up by a negative margin so the columns dissolve *behind* them. The CTA block
  is a sibling of the masked container, never inside it — it must stay fully
  opaque while everything behind it goes. Give it `position: relative` and a
  `z-index`: a following sibling with a negative margin does not reliably paint
  over the earlier block's inline content otherwise.
- **The per-discipline CTAs are not in the fade** and never touch it. They are
  up in the headers (§6). The section has exactly one link at the bottom, and
  the columns all point at it.
- **All three columns reach the fade.** This is new: the first pass had
  science ending short of the band with a clean bottom edge, because science
  had exactly two pieces. Beck's in-progress essays (§7) give it a full column,
  so the band now cuts every column and the horizon reads as one deliberate
  line rather than as a rule that happens to touch only the tallest.
  - *If a column still falls short of the band,* the lever is its own `show`
    values — separating its rungs lengthens it without inventing a piece. Do
    not pad a column with a piece that does not exist, and do not stretch its
    rungs.
- There is **no count**, no "and N more", and no pill anywhere.
- If `mask-image` is unavailable, the columns render whole with clean bottom
  edges. Acceptable, precisely because nothing else depends on clipping.

---

## 6. No card: what the columns stand on

**The `.tilt-card` panel is deleted.** Its border, `bg-card`, `shadow-lg`,
`rounded-[1.75rem]`, `overflow-hidden`, `p-6`/`sm:p-7`, `md:-ml-12`, the
`z-10`/`z-20`/`z-30` ladder and `hover:z-40` all go with it. `.tilt-card` and
`.tilt-card-active` come out of `globals.css` entirely — **verified: nothing
else in the codebase uses them.**

Each discipline becomes a header block and a column, side by side in a plain
three-track row with a gap. No overlap between them.

**The header block**, in order:

1. `StampBadge` — unchanged, still carrying the discipline icon and word, still
   tilted by the card's own `tilt` value. That field survives in `CARDS` for
   this and nothing else. The chrome idea was considered and dropped: the badge
   already is the label, and replacing it would have been a second redesign
   riding along on this one.
2. The descriptive line, unchanged — including the science line Beck wrote,
   "Semi-technical experiments and explanations of phenomena, mostly biology
   and code."
3. **That discipline's CTA** — `look around`, `start reading`, `discover more`.
   Moved up from the foot. With one shared fade at the bottom of the section
   pointing at one gallery link, three more links down there would compete with
   it; up here each one belongs to its own header.

**The whole group — header and column together — remains one `<Link>`**, so
hovering anywhere in a discipline's territory squares up its column (§8). The
CTA inside stays a `<span>` styled as a link, not a nested `<a>`.

**The focus ring goes on the header block, not the whole link.** A ring drawn
around a group whose height is set by a several-hundred-pixel decorative column
is a ring around mostly nothing. The header is the compact, meaningful part.

---

## 7. What each column holds

Hand-picked by slug in `app/page.tsx`, for the same reason as before: the column
is a composition, no predicate expresses it, and adding work should never
silently change the home page. Every slug resolves through `getWorkItem` /
`getCollectionPiece`, so a typo is a build-time failure.

**Order matters:** rung 1 is fully visible and the last rung is the one that
dissolves, so the run descends in strength.

| column | rungs, top to bottom | shapes |
| --- | --- | --- |
| art | `rabbit-in-the-moon`, `april-colors-24`, `lady-bird`, `projection` | `1/1`, `1/1`, `4/5`, `1/1` |
| writing | `lost`, `note-systems`, `back-to-nature`, `chinese-emoji-poetry` | all type |
| science | `transformation`, `delirium`, `colony-selection`, `designing-dna` | type, rail, type, type |

- **The art column is nearly uniform in shape**, which is what makes an even run
  legible — three squares and one `4/5`, so the offsets and rotations do the
  work rather than the aspect ratios. `lady-bird` breaks the rhythm, which is
  why it is not rung 1.
- **The writing column alternates poem, essay, poem, essay.** `lost` and
  `back-to-nature` carry short ragged `preview` lines; `note-systems` and
  `chinese-emoji-poetry` carry a single `description` sentence each — they have
  no `preview` (finding 4). The alternation is the column's claim to two forms,
  made visible in the shape of the type.
- **Both `love-worth-heartbreak` poems resolve through slugs generated at
  `lib/work.ts:2072`**, where the chapbook's pieces get `slug` from a `.map()`
  over their titles. `['love-worth-heartbreak', 'lost']` is correct; there is no
  literal `slug:` line to grep for.
### Science's drafts

Science had exactly two pieces, and the first pass accepted a two-rung column
as honest. Beck has **essays in progress**, so the column is filled out with
them instead — which is what lets every column reach the shared fade (§5).

- **They go into `lib/work.ts` flagged `unfinished: true`**, the field the site
  already has for precisely this (`lib/work.ts:80`: "surfaced honestly in the
  gallery and on the piece page rather than hidden until done"). One piece
  already uses it. This is the difference between a draft and a fabrication,
  and it is the whole reason `lib/content.ts`'s `PROJECTS` had to die: a draft
  declares itself, an invention does not.
- **Beck writes them.** Titles, descriptions, and text are Beck's; nothing here
  invents an essay, a title, or a blurb. Beck supplied `colony selection` and
  `designing dna` on 2026-09-03, and both are in `lib/work.ts` **carrying a
  title and nothing else** — no `description`, no `preview`, no `text`. A rung,
  a gallery card, and a piece page all fall back to the title, so they render as
  exactly what they are. Fill in prose as the essays finish; drop `unfinished`
  when they land.
- **The drafts trail the column, and that is deliberate.** Order descends in
  strength (rung 1 fully visible, the last dissolving), so the finished essay
  leads, `delirium`'s rail gives the column its visual break, and the
  in-progress work fades out at the bottom. Unfinished work literally trailing
  off is the most honest arrangement available, and it costs nothing.
- **Every draft rung shows `UnfinishedMark`** — §3. A column that shows drafts
  as finished work is `PROJECTS` in better clothes.
- **Adding them is not a home-page-only change.** They become real gallery
  items, appear in search and filters, and get their own `/work/[slug]` routes,
  so `next build`'s page count goes up by one per draft. That is correct
  behaviour, not a side effect to suppress — but it means §13 no longer expects
  an unchanged count.
- **They will likely be tagged `writing` as well as `science`**, exactly like
  `transformation`. The no-piece-in-two-columns rule below then claims them for
  science, so none of them may also be picked as a writing rung.
- "Honest at 2" is retired as a decision. It was right while science had two
  pieces; it does not survive science having five.
- **No piece appears in two columns.** Both science pieces are also claimed by
  another discipline — `transformation` is `writing`, `delirium` is `art` — so
  the same face could legitimately turn up twice across three adjacent columns
  and would read as thin rather than as connected. Science holds both, so
  neither may be picked for art or writing. Keep the comment at the `CARDS`
  declaration; this is the rule most likely to be broken later by someone
  picking a nice-looking piece.
- **Beck's science illustration**, whenever it is drawn, becomes rung 1 of the
  science column and pushes the other two down — a change to one `CARDS` entry.
  Not a blocker; don't design around its absence.

---

## 8. Hover: the column squares up

**Each rung rotates itself to vertical. The group does not move.**

At rest the column is a scatter of tilted objects. On hover it snaps into an
ordered vertical stack, every rung turning around its own centre back to 0°.
That is the whole gesture — the group no longer rotates flat, lifts, or scales
as one rigid object, because there is no longer an object to be rigid.

```css
.column-rung {
  transform: rotate(var(--r));
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.discipline-column:hover .column-rung,
.discipline-column:focus-visible .column-rung,
.discipline-column.discipline-column-active .column-rung {
  transform: rotate(0deg);
}
```

`COLUMN`'s `hr` field is deleted. The open state is a constant.

### The trap, restated, because it survives the redesign

The third selector is the one that matters, and it is the easiest thing here to
get wrong. Hovering the word "art" in the hero copy squares up the art column
*with the pointer nowhere near it* — `CategoryWord` writes into
`HeroWordScatter`'s context, and `DisciplinePanels` reads it back through
`useCollage()` and toggles the class. `CollectionStack`'s deck opens on
`.group:hover .deck-card`; **copying that pattern gives a column that stays
scattered when you hover its own hero word.** The JS-toggled class must be in
the selector set.

The class is renamed `.discipline-column` / `.discipline-column-active`, since
`.tilt-card` described a card that no longer exists (§6).

Verify by hovering each of the three `CategoryWord`s in the hero copy and
watching the matching column. This is not visible in a component-level test.

### Rotation only

- **No `translate()`.** `translateX(%)` resolves against the rung's own width,
  not the column's, so any horizontal open-state offset would silently be in
  different units from `x`. Finding 8 in miniature, avoidable by not doing it.
  - *Aligning the rungs' left edges on hover would make the squaring-up
    stronger, and would need exactly that translate — computable per rung as
    `(targetX − x) / w`. Deliberately not specced. If it's wanted later, it is
    a considered addition with a known trap, not a tweak.*
- **No change to `width` or any margin.** Those are layout: animating them
  reflows the column, changes the section's height mid-gesture, and shoves the
  page around.

---

## 9. Accessibility

- **The column is decorative in its entirety.** `aria-hidden="true"`, `alt=""`,
  no focusable descendants, no second tab stop. The group is one link; the
  badge, the copy line, and the CTA are its accessible name and they already say
  everything the column implies. A screen reader hearing four piece titles
  inside one link gets a worse gallery, not a better header.
- **`prefers-reduced-motion: reduce` pins every rung to its rest rotation** and
  drops the transition. The columns and the fade stay fully present — they are
  layout, not animation, and the implication of more is not a motion effect. A
  reduced-motion reader gets the complete section.
- **The focus ring is on the header block** — §6.
- **Text rungs must meet contrast at their rest opacity.** If a rung is dimmed
  to sit back in the stack, dim it with `opacity` on a decorative element rather
  than by reaching for a low-contrast colour token. Note that rungs near the
  fade are *already* partially transparent by design; do not compound that with
  a dim colour.

---

## 10. Images and weight

Up to four real images in the art column and one in science, at roughly 70–75%
of a column track.

- **Every image rung gets its own `sizes`**, in the shape of
  `(max-width: 640px) 75vw, 280px`. Inheriting a full-width `sizes` fetches a
  large derivative for a small box — the one performance mistake here that is
  easy to make and invisible in review.
- **`thumb` is still unset on every piece in `REAL_WORK`**, and this spec does
  not block on generating any. `next/image` with an honest `sizes` is most of
  the win. If a real thumb pipeline ever lands, column rungs and the collection
  stack's back cards adopt it together — they want the same thing.

---

## 11. What this replaces, and the doc trail

- **`components/piece-column.tsx`** exists and implements the first pass. It
  needs: `COLUMN`'s `hr` field removed, the open state changed to `0deg`, the
  `-0.5rem` text special case in `overlapAbove` removed in favour of
  `TEXT_RUNG_ASPECT`, the text branch given that fixed aspect with top-set type,
  and `.column-fade` moved off the column onto the section container (§5).
- **`components/piece-pile.tsx`** — the peek build — is deleted if it is still
  present.
- **`app/globals.css`**: `.tilt-card` and `.tilt-card-active` deleted;
  `.column-rung`'s open state rewritten; the shared fade added as a section-level
  class.
- **`app/page.tsx`**: the `<Link>` loses its card classes and gains
  `.discipline-column`; the CTA moves above `PieceColumn`; `z`/`md:-ml-12` go;
  the three columns wrap in the masked container; the "see the full gallery"
  section moves up into the fade. `resolvePiece` and `PeekRef` stay verbatim —
  both are good and neither was peek-specific, though `PeekRef` should be
  renamed now that no peek exists.
- **`lib/work.ts`** gains Beck's in-progress science essays, each with
  `unfinished: true` — §7. This also advances TODO §2 (`science` as a
  discipline with almost nothing in it).
- **`lib/content.ts` stays deleted**, along with `PROJECTS` and
  `featuredProject`. That was right regardless of mechanism, and after it **no
  fabricated content remains anywhere in the site's data** — worth stating
  plainly in ARCHITECTURE.md.
- **`docs/history/2026-09-home-discipline-cards.md`** already carries a
  superseded banner pointing here. Its §1 — why three cards each showing one
  work is the actual defect — is still the reason either mechanism exists.
- **`docs/ARCHITECTURE.md`** describes the tucked-under peek and must be
  rewritten for the columns, not amended.
- **`docs/TODO.md` §1 is not shipped** and its 2026-09-03 entry must say so.

---

## 12. Out of scope

- Any change to `/work`, the gallery, the filter panel, or the collection
  stacks.
- The hero copy, the icon collage, `HeroWordScatter`, and the `?tags=` deep
  links. All three discipline words still link where they link.
- `StampBadge` itself, and the chrome treatments considered against it.
- Aligning rungs horizontally on hover — §8.
- Generating real `thumb` assets — §10.
- A fourth column, a count pill, or making rungs individually clickable,
  hoverable, or cycling.

---

## 13. Acceptance

- [ ] Each discipline renders a header (badge, copy, CTA) and an even column of
      2–4 rungs. No rung is visibly the "feature."
- [ ] **There is no card.** No panel background, border, shadow, or overlap
      behind any column; `grep tilt-card` finds nothing — §6.
- [ ] **One fade, at one y, across all three columns**, from a single mask on a
      single container — §5.
- [ ] The art and writing columns land within ~15% of each other in height, and
      the fade band falls inside the last rung of each — §4, §5.
- [ ] All three columns reach the fade band, and no column claims a count —
      §5, §7.
- [ ] `delirium` renders in the code-demo rail, reading `paused`, with no
      iframe and no tab stop — §3.
- [ ] Every `unfinished` rung shows `UnfinishedMark`; no draft is presented as
      finished work — §3, §7.
- [ ] The overlap under a code-demo rung accounts for its rail's fixed height —
      §4.
- [ ] "see the full gallery" sits in the fade, fully opaque, with the columns
      dissolving behind it. No per-discipline CTA is anywhere near the band —
      §5, §6.
- [ ] Hovering a column rotates every rung to 0° individually; the group itself
      does not rotate, lift, or scale — §8.
- [ ] Hovering each `CategoryWord` in the hero copy squares up the matching
      column — §8.
- [ ] Opening a column changes rotation only. No height changes, no reflow — §8.
- [ ] `x + w ≤ 90` on every rung, and no rung crosses into a neighbouring
      column's track — §4.
- [ ] No overlap covers any part of a text rung's type — §4.
- [ ] No image rung is cropped to a shape it does not have; there is no default
      image aspect in the component — §3.
- [ ] Text rungs read `preview ?? description` and are clamped to two lines.
      `grep` finds no `.text` in the column component — §3.
- [ ] No piece appears in more than one column — §7.
- [ ] Rungs are `aria-hidden`, not focusable, and add no tab stops; the focus
      ring is on the header block — §6, §9.
- [ ] Under `prefers-reduced-motion: reduce`, the columns and the fade are fully
      present and static — §9.
- [ ] Every image rung has its own `sizes` — §10.
- [ ] `lib/content.ts` is gone and `grep -r PROJECTS` finds nothing.
- [ ] ARCHITECTURE.md describes the columns and TODO §1 is open again — §11.
- [ ] `tsc --noEmit` clean; `next build` clean. **Page count rises by one per
      draft essay added** — §7.
