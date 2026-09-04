# Spec — the home page's three discipline cards (archived)

> **This is history, not current documentation. Status: superseded
> 2026-09-03, before this spec was ever committed.** It was built in full —
> §2–§11, including §7's science card, with the §11 blockers filled in below
> — then rejected on sight: the tucked-under peek did not read as intended
> live, for reasons its replacement spec,
> [2026-09-home-discipline-columns.md](2026-09-home-discipline-columns.md),
> catalogs in its own §1 (worth reading — several are real geometry traps,
> not taste). The mechanism that shipped instead is a loose column with no
> featured piece; nothing below was ever in `main`. **Current documentation
> is [../ARCHITECTURE.md](../ARCHITECTURE.md)**, which now describes the
> column. This file's own §1 — why three cards each showing one work is the
> actual defect — is still the reason either mechanism exists; that
> reasoning survives even though the peek did not.
>
> **What was filled in before it was rejected (for the record):**
>
> - **The featured face, not just the peeks, was unified onto §5's two
>   derived branches.** §1 called the polaroid frame and the quote mark "fine
>   objects that answer the wrong question" without saying what replaces
>   them; decided with Beck during the build to drop them rather than keep
>   them alongside the new peeks. The art card's white frame, its caption,
>   and its rotate-on-hover are gone; the writing card's quote mark and "—
>   from lost" attribution are gone. Both cards now render exactly the same
>   image-or-type branch a peek does, just larger and not `aria-hidden`.
> - **§11's three blockers, filled in with Beck:** the science line is
>   "Semi-technical experiments and explanations of phenomena, mostly biology
>   and code."; the art peeks are `april-colors-24`, `lady-bird`, and
>   `projection`; the writing peeks are `note-systems`, `chinese-emoji-poetry`,
>   and `love-worth-heartbreak`'s `back-to-nature`.
> - **§3's geometry needed a wrapper the spec doesn't mention.**
>   `transform: translate(x%, y%)` resolves its two percentages against the
>   *transformed element's own* width and height respectively — not a shared
>   axis, and not the parent's width the way the collection stack's
>   percentage margins do. Built each peek as a square wrapper (side equal to
>   the feature's own width, via `aspect-ratio: 1` on a `width: 100%` box) so
>   `--y` scales against that width too, per §3's "never its height" rule;
>   the visible face is centered inside that wrapper. See the comment on
>   `PeekPile` in `components/piece-pile.tsx`.
> - **A peek's own box uses the piece's real `imageAspect` when it has one**
>   (§2's "nothing has to be normalised, nothing is distorted"), falling back
>   to a square only for a text peek, which has no native aspect to keep.
> - **Flagged, not fixed, and this is what got it rejected:** on the two
>   leftmost desktop cards, the topmost peek (index 0, offset up-and-right)
>   sat physically underneath the next card in the corkboard's own overlap —
>   visible again only once that card was hovered to `z-40`, never at rest.
>   The successor spec's finding 1 names this precisely: a geometry that
>   radiates in four directions inside a container with one free edge.
>
> Never closed [TODO.md](../TODO.md) **§1** (the science panel's fabricated
> content) — the column did, once it shipped. Would have superseded **§8 of
> [2026-08-coding-explorations.md](2026-08-coding-explorations.md)**, which
> specified the science panel as a live code-demo miniature; the column
> supersedes it instead, for the same reason given in §7 below.

The three cards under the hero are the site's only pitch for its own breadth.
Each currently shows exactly one piece of work, which makes the site look
like it contains three things. This spec replaces the three ad-hoc treatments
with one mechanism whose entire job is **the implication of more**.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| What's wrong with the cards | **They imply the site has three works in it** | Beck, 2026-09-02 |
| Whether to keep one featured work per card | **No.** Each card shows range | Beck, 2026-09-02 |
| Whether the cards become collection stacks | **No** — considered and dropped | Beck, 2026-09-02 |
| Whether peeked work must be related | **No.** Unrelated work from across the discipline | Beck, 2026-09-02 |
| The mechanism | **Tucked-under peek** — corners of other pieces poking out from behind | Beck, 2026-09-02 |
| Science, with only 2 pieces | **Same mechanism, honest at 2.** Visibly thinner is fine | Beck, 2026-09-02 |
| Whether the science card runs `delirium` | **No** — the code-demo miniature is dropped | §7 below |
| Whether peeks are hand-picked or derived | **Hand-picked**, by slug, in `app/page.tsx` | §5 below |
| What drives the open state | **`.tilt-card-active`, not `:hover`** | §4 below |

---

## 1. Why this exists: three cards, three works

`app/page.tsx:23` declares three panels, each with a hand-written `kind` that
renders a different object:

| card | `kind` | shows | drawn from |
| --- | --- | --- | --- |
| art | `polaroid` | one image in a white frame | `rabbit-in-the-moon` |
| writing | `quote` | three lines of one poem | `lost`, from `love-worth-heartbreak` |
| science | `stat` | a number and a field label | `lib/content.ts`'s invented `PROJECTS[0]` |

Two problems, and only the second one is new.

**The known problem:** the science card is fabricated. `PROJECTS[0]` is a
talk that does not exist, with a made-up "Contrast passing AA: 100%" metric.
This has been TODO §1 since 2026-08-27.

**The problem this spec is actually about:** all three cards show *one thing*.
A reader who never scrolls past the fold sees one painting, one poem, and one
statistic, and reasonably concludes that is the site. Behind those three
cards sit 26 top-level art items (112 pieces inside them, 97 with images),
6 writing items, and 2 science items. None of that reaches the fold.

The `stat` treatment existed only to make invented metrics look substantial,
so it goes regardless. The other two are fine objects that answer the wrong
question — they say *here is a good one*, and the card needs to say *there
are many*.

### What was considered and dropped

- **Collection stacks** (`CollectionStack` / `ChapbookStack`, already built
  and shipped in `components/work-visuals.tsx:530`). Beck's first instinct,
  and nearly free — the geometry, the text variant, and the "and N more"
  count pill all exist. Dropped because a deck shows one face and a number:
  it implies *quantity* but not *range*, and the count pill reads as "and 1
  more" on the science card.
- **A contact sheet bleeding off the card edge.** Shows range directly rather
  than implying it. Dropped on three counts: writing has exactly one image
  across all 6 items so its grid would have to be title cards; science cannot
  fill a grid with 2 pieces; and it would put 9–12 full-size images on the
  home page (see §9).
- **A live code-demo miniature**, per the 2026-08 spec's §8. See §7.

---

## 2. The mechanism: tucked-under peek

**One piece sits on top. Two to four others poke out from behind it at loose
angles**, as if the top one were dropped onto a pile on a desk. The card's
existing `overflow-hidden` clips them, so several run off the edge rather
than resolving — the crop is doing as much work as the count.

Why this one:

- **It implies more without showing much.** Beck's stated requirement is the
  implication, not an inventory. A corner is enough.
- **It is medium-agnostic.** A peek is a corner of *something* — an image
  edge for art, a few lines of type for writing. Same component, same
  geometry, different fill. This is what the contact sheet couldn't do.
- **It is aspect-agnostic.** Real art aspect ratios run `1/1`, `4/5`,
  `1440/1723`, `1087/763`. A peek shows a cropped corner, so nothing has to
  be normalised, and nothing is distorted.
- **It degrades to n=1.** With one thing behind, one thing peeks, and the
  card still reads as a pile rather than a frame. This is what makes §7
  possible.
- **It is already the site's visual language.** The hero is a corkboard of
  tilted, overlapping objects (`.tilt-card`, `globals.css:261`); the cards
  themselves overlap each other by `-ml-12`. Peeks are the same idea one
  level down.

### Not a stack

Deliberately distinguished from `CollectionStack`, which this spec does
**not** reuse:

| | collection stack | tucked-under peek |
| --- | --- | --- |
| offsets | downward only, bottom-anchored | outward in all four directions |
| what shows | a bottom strip of each card | a corner, clipped by the card |
| count | explicit pill, "and N more" | none — the crop is the signal |
| source | one collection's own `pieces` | unrelated work across a discipline |
| lowest card | blank, carries the total | there is no lowest card |

Do not try to generalise one into the other. They answer different questions
and their geometry is anchored differently — the stack's whole trick is that
percentage vertical margins resolve against *width* so a peek is exact
regardless of card height ("Collection stack geometry" in ARCHITECTURE.md).
Peeks have no such constraint because they are never measured against each
other.

---

## 3. Geometry

A table, in the manner of `DECK` (`work-visuals.tsx`) — one source of truth
for both the inline custom properties and anything that needs to reason about
the layout.

```ts
/** Rest and open positions for each tucked piece, as percentages of the
 *  featured face's width. Index 0 is the topmost peek. */
const PEEKS = [
  { x:  34, y: -14, r:   7, hx:  40, hy: -18, hr:  9 },
  { x: -28, y:  20, r:  -9, hx: -34, hy:  25, hr: -12 },
  { x:  26, y:  34, r:   4, hx:  32, hy:  40, hr:  6 },
] as const
```

Rules:

- **Percentages of the featured face's width, never its height**, and never
  `em` — same reasoning as the deck. Card height varies with the featured
  piece's aspect ratio and with the breakpoint; width does not.
- **Each peek is 55–70% of the featured face's width.** Smaller than the top
  piece, so the hierarchy is unambiguous, but not so small it reads as a
  thumbnail grid.
- **`transform: translate() rotate()`, not margins.** The deck uses margins
  because it needs percentage-of-width vertical offsets; peeks are positioned
  absolutely against a known box and can use transforms directly.
- **Rotation pivots on the peek's own centre.** These are objects lying at
  angles, not cards leaning on a pile — the deck's bottom-centre origin is
  wrong here.
- **At least one peek must be clipped by the card on every breakpoint.** If
  all of them resolve fully inside the card, the mechanism has failed: a
  finite arrangement of four objects reads as four objects, and the crop is
  what says "and it keeps going." Check this at 320px, where the card is
  narrowest.
- **The container reserves no extra height.** Unlike the deck, peeks never
  push the card taller — they are `position: absolute` inside the padded
  content box and are allowed to overflow it. The card's height is still set
  by the featured face plus the caption and CTA.

---

## 4. Activation: `.tilt-card-active`, not `:hover`

**This is the part most likely to be got wrong, and it is a real bug in the
obvious implementation.**

The cards already have two ways to become active (`globals.css:265`):

```css
.tilt-card:hover,
.tilt-card:focus-visible,
.tilt-card.tilt-card-active { … }
```

The third is the one that matters. Hovering the word "art" in the hero copy
above settles the art card flat *with the pointer nowhere near it* —
`CategoryWord` writes to `HeroWordScatter`'s context
(`hero-icon-collage.tsx:261`), and `DisciplinePanels` reads it back through
`useCollage()` and toggles the class (`app/page.tsx:65`).

`CollectionStack`'s deck opens on `.group:hover .deck-card`
(`globals.css:308`). **Copying that pattern would produce a card that tilts
flat on hero-word hover but whose peeks stay shut** — the two halves of the
same gesture disagreeing. Drive the peeks from the same selector set the tilt
uses:

```css
.peek-item { transform: translate(var(--x), var(--y)) rotate(var(--r)); }
.tilt-card:hover .peek-item,
.tilt-card:focus-visible .peek-item,
.tilt-card.tilt-card-active .peek-item {
  transform: translate(var(--hx), var(--hy)) rotate(var(--hr));
}
```

Verify by hovering each of the three `CategoryWord`s in the hero copy and
watching the matching card: the tilt and the peeks must move together. This
is not visible in a component-level test.

### Motion budget

The open state is a **loosening, not a fan-out** — a few percent of extra
offset and a couple of degrees. The card is already rotating, lifting, and
scaling on the same trigger (`rotate(0deg) translateY(-0.4rem) scale(1.025)`);
peeks that travel far would compound into noise. Match the existing 300ms and
easing so the whole card reads as one gesture.

---

## 5. What each card holds

Peeked pieces are **hand-picked by slug** in `app/page.tsx`, not derived by
filtering `REAL_WORK`. Derivation would be tempting and wrong: the peeks are
a composition — three corners that want contrasting shape, value, and
subject — and no predicate expresses that. Hand-picking also means adding
work never silently changes the home page.

```ts
const CARDS = [
  { discipline: 'art',     feature: 'rabbit-in-the-moon', peeks: [ … ] },
  …
]
```

Every slug resolves through the existing accessors (`getWorkItem`,
`getCollectionPiece`) so a typo is a build-time failure, not a blank corner.

### A peek renders one of two ways

Derived from what the piece carries, per ARCHITECTURE's "Behaviour is derived,
not stored":

| piece has | peek shows |
| --- | --- |
| `image` | the image, `object-cover`, cropped by the peek's own box |
| no `image` | 2–3 lines from `preview` → `text` → `description`, set in the card's type |

No `kind` field. `delirium` and every art piece take the first branch; every
writing piece and `transformation` take the second.

### The art card

- **Feature:** `rabbit-in-the-moon` (unchanged — it is the site's own icon
  and earns the spot).
- **Peeks:** three, from across the discipline rather than one collection.
  Pick for contrast, not for quality ranking. Candidates with real images and
  visibly different shape: `protest-sign` (`1440/1723`, tall, high-contrast),
  `painted-mug` (`1/1`, an object rather than a drawing), `inktober-17`
  (`1/1`, ink — the only monochrome medium on the card), `womens-history-month`
  (`4/5`), `equanimity-or-apathy` (`1087/763`, the only landscape).
- Beck picks the final three. Vary medium (`digital`, `ink`, `watercolor`)
  rather than taking three digital pieces — the medium range is part of what
  the card is claiming.

### The writing card

- **Feature:** the poem `lost` (unchanged).
- **Peeks:** three, and **all of them are type** — writing carries exactly
  one image across all 6 top-level items, so the image branch never fires
  here. Candidates: `chinese-emoji-poetry`, `first-art-fair`, `note-systems`,
  and any second poem from `love-worth-heartbreak`.
- **A typographic peek needs a different crop from an image peek.** A cropped
  image corner is legible as "an image continues"; three words of a sentence
  cut mid-word is legible as broken. Cut on a **line boundary**, let the
  final line fade or clip at the card edge, and never mid-word within a
  visible line.
- Include **at least one poem and at least one essay**. The card is claiming
  two forms, and the featured piece only covers one.

---

## 6. Copy

Each card's descriptive line survives, and two of the three are unchanged:

| card | line |
| --- | --- |
| art | "Paintings made mostly after dark — moons, plants, and the anatomy of feeling." |
| writing | "Short poems and longer essays about what it means to live in the world." |
| science | **needs rewriting — see §11** |

The science line currently reads "Talks and studies where design meets
research — curiosity, made presentable," which was written to caption
fabricated content. It describes talks that do not exist. It must not be
inherited, and it is Beck's to write, not mine.

The CTAs (`look around`, `start reading`, `discover more`) are unchanged.

---

## 7. The science card

**The 2026-08 spec's §8 is dropped.** That spec decided the science panel
would become a live code-demo miniature — an iframe running `delirium` on the
home page. Two things changed since:

1. `transformation` landed (2026-09-02), so science is no longer a discipline
   whose only work is one code demo, and a running iframe would over-index on
   the demo.
2. Beck chose the tucked-under peek as the mechanism for all three cards.
   A running iframe cannot be one of four objects in a pile.

The autorun machinery (`CodeDemoFrame`, the intersection boot, the
reduced-motion suppression) stays exactly where it is and keeps serving
`/work/delirium`. Nothing is deleted; §8 is simply not built, now for a
decided reason rather than a blocked one. **Move
`2026-08-coding-explorations.md` to `docs/history/` when this ships** — §8 was
the only thing keeping it in `specs/`.

### Honest at 2

Science has two pieces, total:

| piece | tags | has image |
| --- | --- | --- |
| `transformation` | `writing`, `science`, `essay`, `blog`, `biology` | no |
| `delirium` | `art`, `science`, `code` | yes (`1/1`) |

So: **feature `transformation`, peek `delirium`.** One thing on top, one
corner behind it. Beck's call is that a visibly thinner card is true and
therefore fine — the card is not allowed to fake a back catalogue, and a pile
of two is still a pile.

This also gets the two branches of §5 onto one card: a text feature with an
image peek, which is the combination least likely to be exercised elsewhere.
Build it early for that reason.

### Beck's science illustration

Beck is drawing one. When it exists it becomes the **feature**, and
`transformation` and `delirium` both become peeks — three objects, and the
card stops being the thin one. Nothing in the mechanism changes; it is a
change to one `CARDS` entry. Don't design around its absence, and don't wait
for it.

### The overlap nobody has looked at yet

Both science pieces are **also** claimed by another discipline —
`transformation` is `writing`, `delirium` is `art`. So `delirium` could
legitimately peek on the art card, and `transformation` on the writing card,
while both also carry the science card. The same corner appearing twice
across three adjacent cards would read as thin, not as connected.

**Rule: no piece appears on two cards.** With the science card holding both,
neither may be picked for art or writing. This costs nothing today — art has
24 other candidates — but it is exactly the kind of thing that gets violated
later by someone picking a nice-looking peek. Worth a comment at the `CARDS`
declaration.

---

## 8. `lib/content.ts` is deleted

The science card is the file's last consumer. Its own header comment has said
since 2026-08-27 that it can go once this lands, and both `ARTWORKS`/`POEMS`/
`ESSAYS` were already removed. In the same change:

- delete `lib/content.ts`
- delete the `PROJECTS` import at `app/page.tsx:10` and `featuredProject` at
  `app/page.tsx:17`

After this, **no fabricated content remains anywhere in the site's data.**
That is worth stating plainly in ARCHITECTURE.md when it ships; it has been
true of `lib/work.ts` for a while and has never been true of the home page.

---

## 9. Images, weight, and `thumb`

The home page currently loads **one** image. After this it loads up to
**four** on the art card alone, plus one on science.

`WorkPiece` already has a `thumb` field for exactly this — "a small, heavily
compressed stand-in for `image` — used where the image is barely visible"
(`lib/work.ts:39`). **No piece in `REAL_WORK` sets it.** The collection stack
asks for it and silently falls back to the full image.

Peeks are the strongest case for it on the site: a peek shows a cropped
corner at roughly 60% of a 380px card, so it is displaying somewhere around
200px of a 1000px+ original.

- **Do not block this spec on generating thumbs.** `next/image` with an
  honest `sizes` on each peek already fetches an appropriately small
  derivative, which is most of the win.
- **Do give every peek a correct `sizes`.** A peek that inherits the featured
  face's `sizes="(max-width: 640px) 100vw, 380px"` will fetch the large
  derivative for a corner. This is the one performance mistake that is easy
  to make and invisible in review.
- Peeks are decorative: `alt=""` and `aria-hidden`. §10.

If a real thumb pipeline ever lands, peeks and the collection stack's back
cards adopt it together — they want the same thing.

---

## 10. Accessibility

- **Peeks are decorative.** The featured piece and the card's own copy carry
  the meaning; the peeks say "there is more," which the CTA already says in
  words. Give them `aria-hidden="true"` and `alt=""`, and keep them out of
  the accessibility tree entirely. A screen reader hearing four titles per
  card would get a worse version of the gallery.
- **The whole card is one link.** Peeks must not be focusable, must not be
  links, and must not introduce a second tab stop. The card's existing
  `focus-visible:ring-2` is the focus affordance.
- **`prefers-reduced-motion: reduce` pins peeks to their rest offsets** and
  drops the transition. They stay visible — they are layout, not animation,
  and the implication of more is not a motion effect. This matches the site's
  standing rule that a reduced-motion reader gets a complete experience, not
  a degraded one.
- Text peeks must still meet contrast at their rest opacity. If a peek is
  dimmed to sit behind the featured face, dim it with opacity on a decorative
  element rather than by choosing a low-contrast colour token.

---

## 11. What Beck still supplies

- **The science card's caption copy.** The one blocker with no workaround —
  §6. The current line describes talks that do not exist.
- **The three art peeks**, from the candidates in §5. A shortlist is offered;
  the composition is Beck's.
- **The three writing peeks**, including at least one poem and one essay.
- **The science illustration**, whenever it is drawn — §7. Not a blocker.

---

## 12. Out of scope

- Any change to `/work`, the gallery, the filter panel, or the collection
  stacks. This spec touches `app/page.tsx`, one new component, and
  `globals.css`.
- Generating real `thumb` assets — §9.
- The hero copy, the icon collage, `HeroWordScatter`, and the
  `?tags=` deep links. All three discipline words still link where they link.
- A fourth card. Three disciplines, three cards.
- Making peeks clickable, hoverable individually, or cycling.

---

## 13. Acceptance

- [ ] All three cards render a featured piece plus 1–3 tucked peeks; no card
      shows a single object.
- [ ] Hovering each `CategoryWord` in the hero copy opens the matching card's
      peeks *and* flattens its tilt, together, in one gesture — §4.
- [ ] At 320px, at least one peek on each card is clipped by the card edge.
- [ ] The science card shows `transformation` featured with `delirium`
      peeking, and does not claim a count.
- [ ] No piece appears on more than one card — §7.
- [ ] Text peeks cut on line boundaries, never mid-word.
- [ ] Peeks are `aria-hidden`, not focusable, and add no tab stops.
- [ ] Under `prefers-reduced-motion: reduce`, peeks are visible and static.
- [ ] Every peek image has its own `sizes`, not the featured face's.
- [ ] `lib/content.ts` is gone, and `grep -r PROJECTS` finds nothing.
- [ ] `tsc --noEmit` clean; `next build` clean, page count unchanged (this
      adds no routes).
