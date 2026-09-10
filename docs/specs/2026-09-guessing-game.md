# Spec — the guessing game

The eight `eye-studies` paintings are extreme close-ups of animal eyes with
the subjects deliberately withheld. This spec turns that withholding into the
thing it was always meant to be: **a guess, a check, a hint, and a reveal.**

It is written to be general. The mechanism is a `guess` field any `WorkPiece`
can carry, not an `eye-studies` special case — there is already a second
customer in the tree (§9), and the site's whole data model is "behaviour is
derived from what a piece carries" (ARCHITECTURE, "Behaviour is derived, not
stored"). A one-collection hack would be the odd one out.

Closes [TODO.md](../TODO.md) — the promise in `eye-studies`' own description
("a guessing game is coming; for now, titles are placeholders") has been
outstanding since 2026-08-27.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| Where the game lives | **Collection page *and* piece page**, sharing one reveal state | Beck, 2026-09-02 |
| Whether the grid tiles take guesses | **Yes — the grid is where it's played.** Reverses the first draft's "the tiles do not take guesses"; see §3 | Beck, 2026-09-02 |
| What a tile shows on a solve | **The answer word, not the reveal.** The photo pair stays on the piece page | §3 below |
| Hints and give-up on a tile | **Neither.** Hints live in the header, reveal lives on the piece page | §3 below |
| Whether the two levels stage | **No — both ship together.** The spoiler is level 2's no-JS fallback, not a separate milestone | Beck, 2026-09-02 |
| How hidden the answers are | **Plaintext, honor system.** No hashing, no encoding | Beck, 2026-09-02 |
| What a solve reveals | **The name, the Unsplash reference photo Beck painted from, and (later) a written note** | Beck, 2026-09-02 |
| The reveal notes | **Postponed.** The reference photo carries the reveal; `note` ships absent and the panel must read complete without it | Beck, 2026-09-02 |
| Where hints live | **On the collection, not the piece.** One ladder shared by all eight | Beck, 2026-09-02 |
| What hint 1 is | **Another question**, deliberately unanswered — "what do all these animals have in common?" | Beck, 2026-09-02 |
| Whether this is eye-studies-only | **No.** A `guess` field on `WorkPiece` | §1 below |
| Whether the lightbox plays | **No.** It stays a viewer | §6 below |
| Where progress is stored | **`localStorage`, best-effort** — the site's first use of it | §5 below |

---

## 1. What this is, structurally

A guessable piece is an ordinary `WorkPiece` that carries one extra field.
Everything else about it — search, tags, sort, collection membership, the
sitemap, metadata, `?tags=` deep links, the lightbox — keeps working with no
special-casing, exactly as `codeDemo` did.

| Kind | Predicate | Adds |
| --- | --- | --- |
| image piece | has `image`, no `text` | — |
| text-forward | has `text`, no `image` | — |
| hybrid | has both | — |
| code demo | has `codeDemo` | leads with a running thing |
| **guessable** | **has `guess`** | **a question about its own subject** |

Note the difference from every row above it: `guess` does not change what the
page *leads with*. An eye study still leads with the painting. `guess` adds a
section, and tints a card. It composes with the other four rather than
competing with them — a code demo could be guessable, in principle.

**Not a new "game" concept, and not a quiz engine.** There is no scoring
model, no timer, no leaderboard, no server. There is one question attached to
one piece, and eight of them happen to sit in one collection.

---

## 2. Data model

### `Guess` on `WorkPiece`

```ts
/**
 * A guessing game attached to this piece: the subject is deliberately
 * withheld, and the page asks the visitor to name it. Optional on any
 * piece; a collection whose pieces carry it becomes a scorecard.
 *
 * Answers are stored in plaintext on purpose. The site is statically
 * exported with no API, so anything shipped to the browser is readable by
 * anyone who opens devtools; hashing would buy obscurity, not secrecy, at
 * the cost of a build step and an unreadable data file. Decided by Beck,
 * 2026-09-02: it's an honor system, and peeking is the visitor's business.
 */
export type Guess = {
  /**
   * The question, in Beck's voice. Not a generic "what is this?" — the
   * phrasing is content. Falls back to `'what animal is this?'` only if
   * genuinely omitted.
   */
  prompt?: string
  /**
   * Every answer counted correct, most canonical first. `accepts[0]` is
   * what the reveal prints, so it is the *answer*, not merely an alias.
   *
   * Matching is normalized (§4), so don't list case or article variants —
   * `['cow']` already accepts "Cow", "a cow", and "  COW  ". Do list real
   * synonyms and the near-misses you're willing to be generous about:
   * `['cow', 'cattle', 'calf', 'bull', 'ox']`.
   */
  accepts: string[]
  /**
   * Hints for this piece alone, overriding the collection's shared ladder.
   * **Unset on all eight eyes** — their hints are about the set, not about
   * any one painting (see `WorkCollection.guessHints`). Kept as the escape
   * hatch for a guessable piece with no set behind it.
   */
  hints?: string[]
  /**
   * The photograph this painting was studied from, shown on reveal. See
   * `ReferencePhoto` — this is the reveal's payoff while `note` is
   * outstanding, not a decoration.
   */
  reference?: ReferencePhoto
  /**
   * Beck's note, shown once the piece is solved or revealed. New copy, not
   * the archive caption — the four withheld Instagram captions stay
   * withheld (ARCHITECTURE, "eye-studies pieces are titled 01–08 on
   * purpose"). Paragraphs split on \n\n and render through `Prose`, same
   * rung as `writeup`.
   *
   * **Deliberately unset on all eight for now** (Beck, 2026-09-02). The
   * revealed panel must read as finished without it — see §3.
   */
  note?: string
}

/**
 * The photograph a study was painted from, revealed alongside the answer.
 *
 * Not `WorkPiece['image']` and not a `ProcessStill`: it isn't Beck's work
 * and it isn't a screenshot of Beck working. It's someone else's photograph,
 * shown with credit, and the credit fields are required for that reason.
 */
export type ReferencePhoto = {
  /**
   * Self-hosted under `public/art/<collection>/reference/`. **Named by the
   * piece's number, never by its subject** — `03.webp`, never `cow.webp`.
   * The `src` is in the page source whether or not the photo has loaded, so
   * a descriptive filename hands over the answer to anyone who opens
   * view-source. See §6.
   */
  src: string
  /** Describes the photo plainly, subject included. Safe: it lives inside the collapsed reveal (§6). */
  alt: string
  /** The photographer's name as they publish it. */
  photographer: string
  /** Their Unsplash profile URL. */
  photographerUrl: string
  /** The photo's own Unsplash page — not the raw image URL. */
  sourceUrl: string
}
```

And on `WorkPiece`:

```ts
  /**
   * This piece withholds its own subject and asks you to name it. See
   * docs/specs/2026-09-guessing-game.md.
   */
  guess?: Guess
```

### `guessHints` on `WorkCollection`

The hints are **not per piece**, and this is the load-bearing decision of the
whole spec. Decided by Beck, 2026-09-02:

```ts
export type WorkCollection = WorkPiece & {
  pieces: WorkPiece[]
  layout?: CollectionLayout
  /**
   * A hint ladder shared by every guessable piece in this collection, taken
   * in order. Shared because the hints are about the *set* — knowing them
   * helps with all eight at once, so unlocking one on any piece unlocks it
   * everywhere (§5).
   *
   * Hints are allowed to be questions rather than statements; the first one
   * here is, deliberately. See "The ladder" below.
   */
  guessHints?: string[]
}
```

Resolved through one function, so a page never reaches for either field
directly:

```ts
/**
 * The hint ladder for a piece: its own, if it has one, else the set's.
 * Per-piece hints are unset everywhere today — this resolves to the
 * collection's ladder for all eight eyes.
 */
export function hintsFor(collection: WorkCollection | undefined, piece: WorkPiece): string[] {
  return piece.guess?.hints ?? collection?.guessHints ?? []
}
```

### The ladder

Beck's, verbatim, and it is only two rungs:

| # | Text | What it does |
| --- | --- | --- |
| 1 | *"What do all these animals have in common?"* | **Asks, and does not answer.** |
| 2 | *"All of these are farmed animals."* | Answers rung 1. |

**Rung 1 is a question whose answer is never printed anywhere** — not in the
data, not on reveal, not on the scorecard. It is a nudge to reframe: you stop
asking "what animal is this" and start asking "what kind of set is this."
Two consequences for the build:

- **It must not look broken.** A hint that doesn't tell you anything reads as
  a bug unless it's presented as deliberate. Render it in Beck's voice —
  italic, in the prompt's own register, not in a grey "hint:" chip that
  promises information and withholds it. It is a question mark, not a
  truncated sentence.
- **Do not add a second input for it.** The temptation is to make rung 1
  guessable too, with its own textbox. It isn't, and shouldn't be: the answer
  is a sentence, not a word, and `normalizeGuess` (§4) would reject every
  honest phrasing of "they're all animals people eat." Rung 2 is how you find
  out whether you were right. Leaving that unverified is the point — the
  visitor checks their own thought against the answer.

**Rung 2 is a thematic spoiler, not just an answer aid.** "All of these are
farmed animals" tells you what the collection is *about*, and the collection
is making an argument — `08`'s caption is already the Kafka line, *"Now at
last I can look at you in peace, I don't eat you anymore."* Taking rung 2
converts eight drawing studies into a thesis. That's why it's the last rung
and why it is per-set rather than per-piece: it can only land once.

The reveal notes Beck writes (§2, "What Beck supplies") should be aware of
which side of that line the reader is on. They will have taken rung 2 or not.

### Predicate

```ts
/** A piece that asks you to name its subject. */
export function isGuessable(piece: WorkPiece): piece is WorkPiece & { guess: Guess } {
  return Boolean(piece.guess)
}

/** A collection with at least one guessable piece — renders a scorecard. */
export function hasGuessablePieces(item: WorkItem): boolean {
  return isCollection(item) && item.pieces.some(isGuessable)
}
```

`isGuessable` goes next to `isCodeDemo` in `lib/work.ts` and is exported for
the client components; `hasGuessablePieces` is what the collection header
checks. Neither is consulted by any existing branch, so **no existing render
path changes** — this is purely additive to the piece and collection pages.

### The eight answers

The key is already in the tree, as a code comment at `lib/work.ts:1285`:

> `// Order: turkey, pig, cow, sheep, chicken, goose, goat, fish.`

That comment becomes data and should then be **deleted**, not left to drift
out of sync with the field below it.

| # | `accepts[0]` | Also accept, at least |
| --- | --- | --- |
| 01 | turkey | — |
| 02 | pig | hog, boar, piglet, swine |
| 03 | cow | cattle, calf, bull, ox, heifer |
| 04 | sheep | lamb, ewe, ram |
| 05 | chicken | hen, rooster, chick |
| 06 | goose | geese, gosling |
| 07 | goat | kid, billy goat |
| 08 | **tuna** | **fish**, bluefin, bluefin tuna, ahi |

**`08` is a tuna, and `fish` also passes** — Beck, 2026-09-02. It is the one
piece in the set where a class-level answer counts, and that asymmetry is
principled rather than a shrug: **`fish` is unambiguous here and a class word
would not be anywhere else.** Three of the eight are birds, so accepting
`bird` would mean three pieces sharing one answer and no way to tell which
one you'd got right. There is exactly one fish, so there is nothing for
`fish` to be confused with.

Note also that `fish` is only *generous*, never the printed answer:
`accepts[0]` is `tuna`, so the reveal says **tuna** even to a visitor who
typed "fish" — and the specificity is the interesting part. A farmed tuna is
a less obvious thing than a farmed cow, which is exactly why it's `08` and
why it carries the Kafka caption.

`salmon` and `trout` stay **wrong**. So do `duck` for `06` and `chicken` for
`01`. Generosity is for synonyms of the right answer — `ahi` is a tuna,
`bluefin` is a tuna — not for adjacent animals. Getting told "no" is the
game.

### Credit, and why it's required rather than optional

The Unsplash License does not require attribution. **Credit here anyway, and
treat the fields as required** — for two reasons that have nothing to do with
licensing:

- **It's already Beck's practice.** `lib/work.ts:827` credits a photographer
  unprompted, in Beck's own voice: *"which as usual is an image from
  @unsplash, photographer @raw.lord."* A guessing game that dropped the
  credit would be the site getting *less* careful than its own writeups.
- **This is provenance, not decoration.** A reference photo is the thing the
  painting was made from. Showing the two together and naming only one of the
  people involved would be a strange thing for a page about studying to do.

Rendered under the photo, small, in the muted register:

> Reference: photo by **[Name]** on **Unsplash**

with the name linking to `photographerUrl` and "Unsplash" to `sourceUrl`.
Both `target="_blank" rel="noreferrer"`, matching the `codeDemo.repo` link in
`app/work/[slug]/page.tsx`.

**Photos are self-hosted, not hotlinked.** Every other image on this site is,
the CSP-free static build has no reason to reach for a third-party origin at
render time, and a hotlinked reference would break the moment Unsplash
changed a URL. Crop to **1:1** to match the paintings (`imageAspect: '1/1'`
on all eight) so the comparison in §3 lines up, and ship `.webp` — the newer
`april-colors-24` assets already are, and `eye-studies`' own `.jpg`s predate
that.

### What Beck supplies

**Reduced 2026-09-02: the notes are postponed and the hints are settled.**
What's left is the eight photos and their credits.

Everything in this section is content, and none of it can be inferred:

- **Eight reference photos**, cropped 1:1, as `.webp`, at
  `public/art/eye-studies/reference/01.webp` … `08.webp`. Numbered filenames
  only — see §6.
- **A credit per photo**: photographer name, their Unsplash profile URL, and
  the photo's Unsplash page URL. Collect these *while downloading*; they are
  painful to reconstruct afterwards from an image alone.
- **A `prompt` per piece** (or one shared phrasing — say which).
- **Replacement copy for the collection's `description`**, which currently
  says "a guessing game is coming; for now, titles are placeholders." Once
  the game exists, that sentence is wrong in two ways.

Settled, no longer outstanding:

- ~~The `accepts` lists~~ — the table above, reviewed by Beck 2026-09-02.
- ~~Two hints per piece~~ — the ladder is per-set, two rungs, in "The ladder".
- ~~Eight `note` strings~~ — **postponed** 2026-09-02. Ship without them; the
  reference photo is the payoff. Worth writing eventually with rung 2 in
  mind, since the reader has either taken it or hasn't.

---

## 3. The layout

### The piece page

`/work/eye-studies/03`. The panel sits **between the description and the
writeup** — after the image and its gloss, before the process notes, so the
visitor has looked at the painting and read the withheld caption before being
asked. It is not above the fold and it does not interrupt the artwork.

```
  ┌────────────────────────────┐
  │        [ the eye ]         │
  └────────────────────────────┘

  03
  digital · art · 2022

  The lashes on this one are so lovely.

  ┌ ── ── ── ── ── ── ── ── ── ┐
  │  ?  what animal is this?   │
  │                            │
  │  [                ] [guess]│
  │                            │
  │  ▸ hint (1 of 2) · reveal  │
  └ ── ── ── ── ── ── ── ── ── ┘

    ── once rung 1 is taken ──

  │  ▸ hint (2 of 2) · reveal  │
  │                            │
  │  What do all these animals │
  │  have in common?           │
  └ ── ── ── ── ── ── ── ── ── ┘

  [ writeup / process / tags ]
```

Three states, one box:

**Unsolved.** Prompt, text input, submit. Below it, a row of two low-emphasis
controls: `hint (n of 2)` and `reveal`. The dashed border reads as "not
finished yet" and distinguishes the panel from the solid-bordered cards
everywhere else on the site.

Taken hints stay visible below the input, stacked in order, and **stay
visible on every other guessable piece too** — they're the set's, not this
one's (§5). The control disappears when the ladder is exhausted. Because the
hints are shared, a visitor arriving at their fourth eye may find both rungs
already showing, having taken them on their first; that is correct and should
not be re-animated or re-announced as new.

**Wrong.** The input shakes once (`prefers-reduced-motion: reduce` → no
shake, colour change only), keeps its text selected so a retry is one
keystroke, and a line appears below: `not quite — try again`. Wrong guesses
are **not** counted, listed, or held against the visitor. No "3 attempts."

**Solved or revealed.** The box goes solid, takes the piece's tone colour,
and shows the answer big, **the reference photograph**, its credit, and the
note if there is one:

```
  ┌──────────────────────────────────────┐
  │  ✓  cow                              │
  │                                      │
  │  ┌────────────┐  ┌────────────┐      │
  │  │ the study  │  │ the photo  │      │
  │  │  (again)   │  │ it came    │      │
  │  │            │  │ from       │      │
  │  └────────────┘  └────────────┘      │
  │                                      │
  │  Reference: photo by Name on Unsplash│
  └──────────────────────────────────────┘
```

**The painting is repeated here, beside the photo, on purpose.** It is
already at the top of the page — but the interesting thing about a study is
the *distance between* it and its source, and you cannot see a distance by
scrolling back and forth. Two 1:1 boxes side by side is the whole payoff.
Below `sm`, they stack, photo second: on a narrow screen the painting is only
a thumb-flick above, and a stacked pair still reads as a pair.

**The panel must read as finished with no `note`.** All eight ship without
one (§0), so a layout that leaves a gap, a heading, or an empty rule where
the note goes is wrong — the answer, the pair of images, and the credit are a
complete reveal on their own. When notes do land later, they slot in under
the credit with no other change.

A revealed (given-up) piece shows the same content with an open-eye mark
instead of the check, and reads `cow` without the ✓. **Revealed is not
solved** — §5 stores them distinctly, and the scorecard counts only solves.
There is no way to un-reveal a piece short of resetting (§5).

**The reference photo does not open in the lightbox.** The `ProcessSection`
precedent (`components/work-visuals.tsx:656`, which adapts a non-`WorkPiece`
still into one via `processLightboxItem`) makes it easy, and it is still the
wrong call: the lightbox shows one image at a time, and opening it would
destroy the side-by-side comparison that is the reason the photo is here.
Revisit only if the pair proves too small to read at all.

### The collection page

`/work/eye-studies`. Three additions: a scorecard and a per-tile mark in the
header and the grid, and — the one that isn't small — a guess row on every
guessable tile, specced separately below.

**A scorecard in the header**, under the `8 pieces · 2022` line, only when
`hasGuessablePieces(item)`:

```
  Eye Studies
  Extreme close-up digital paintings of eyes. […]
  8 pieces · 2022
  ◔  3 of 8 named      ▸ hint (1 of 2)      reset
```

The ring is a tiny progress arc in the collection's tone. `reset` appears
only once at least one piece is solved or revealed, and asks for confirmation
before clearing (§5) — it throws away the only copy of the visitor's progress.

**The hint ladder belongs here, and this is why the collection page is in
scope at all.** A hint about what the eight animals have in common is a
statement about the set; offering it only from inside a single piece page
would be asking the question in the wrong room. It renders in both places —
header here, panel there — reading from the same state, because a visitor
who works through the collection tile by tile should never have to guess
where the hint went.

**Per-tile state on the masonry grid.** Each `PieceTile` for a guessable
piece gets a corner mark, matching the existing `WriteupMark` /
`UnfinishedMark` / `CollectionMark` family in `components/work-visuals.tsx`:

- unsolved → a `?` mark in muted foreground
- solved → a ✓ mark in the collection tone
- revealed → the open-eye mark, muted

**The tiles take guesses.** *Reversed 2026-09-02, after the first build.*
The first draft of this section said they didn't, on three grounds: a text
input in a masonry cell is a bad target, it fights the lightbox trigger that
owns the same rectangle, and eight simultaneous forms is noise. The first is
answered by putting the input in the caption block instead of over the
artwork; the second by the two never sharing a rectangle at all; the third is
real, and holding the tile to a single row is the job of "Guessing from the
tile" below.

What the first draft got wrong was the traffic. **Clicking an eye opens the
lightbox, not the piece page** (`ImageTile`, `components/work-visuals.tsx:800`
— the image is a lightbox trigger, only the caption is a link). So the
natural way to look at all eight — click one, arrow through the rest, dismiss
— passes the game by completely, and the panel that holds the game sits on
eight pages a browsing visitor never opens. A grid where every image is a
question and none of them can be answered is the wrong shape. The rule this
replaces was written as if the grid were an index; it is the gallery.

**The solved tile prints the answer** — also reversed. The old rule kept a
revisit from being spoiled by tiles the visitor hadn't reached, which only
made sense for a grid that couldn't be played: an unsolved tile still prints
nothing, and a solved one names a piece *this visitor already named*. Hiding
the word back behind a ✓ the moment it's typed correctly is a lie about what
just happened. §7's title decision is untouched — the tile's title is still
`03`, and the answer is a separate line beneath it.

### Guessing from the tile

The grid is what a visitor actually browses, so the grid takes input.
Everything below is subordinate to one constraint: **the tile is still a
tile.** It grows one row, not a panel.

```
  ┌───────────────────────┐     ┌───────────────────────┐
  │  ┌─────────────┐  (?) │     │  ┌─────────────┐  (✓) │
  │  │   the eye   │      │     │  │   the eye   │      │
  │  │  [lightbox] │      │     │  │  [lightbox] │      │
  │  └─────────────┘      │     │  └─────────────┘      │
  │  03           ← link  │     │  03           ← link  │
  │  The lashes on this   │     │  The lashes on this   │
  │  one are so lovely.   │     │  one are so lovely.   │
  │  ┌──────────┐┌──────┐ │     │  ✓ cow                │
  │  │what anim…││guess │ │     │                       │
  │  └──────────┘└──────┘ │     │                       │
  └───────────────────────┘     └───────────────────────┘
        unsolved                        solved
```

**Three targets, stacked, never overlapping.** The old objection was that a
form "fights the lightbox trigger that owns the same rectangle." It doesn't,
because the tile is already two disjoint regions and the form is a third,
below both:

| Region | Does |
| --- | --- |
| the image | opens the lightbox (unchanged) |
| the title/description block | links to the piece page (unchanged) |
| **the guess row** | **takes the guess** |

The card itself must not become clickable, and its `hover:-translate-y-1`
lift stays. A visitor reaching for the input must never risk opening the
lightbox, which is the entire reason the row lives under the caption rather
than as an overlay on the artwork.

**One structural change this forces.** The caption is currently a single
`<Link>` wrapping title *and* description
(`components/work-visuals.tsx:806-816`). HTML forbids interactive content
inside an `<a>`, so the form cannot be nested in it — it is a **sibling**
after the link, and the card's `p-4` splits into `px-4 pt-4` on the link and
`px-4 pb-4 pt-3` on the guess row. The link's own hit area is otherwise
unchanged; do not shrink it to the title alone.

**The row is one row.** No dashed border, no panel background, no heading.
The prompt is not printed as a label — the corner `?` mark already asks the
question, and eight printed prompts down a column is exactly the noise the
first draft was right to fear. Instead:

- the piece's `prompt` (default `what animal is this?`) becomes an **sr-only
  `<label>`** bound to the input, so screen readers get the real question;
- the input's `placeholder` is the short form, `what animal?`, and a
  placeholder is never the only label;
- the submit is a real `<button type="submit">` reading `guess`, sized to the
  row. Enter submits, as on the panel.

**No hints and no reveal on the tile.** Both are deliberate, and for
different reasons.

*Hints* stay in the collection header, one ladder in one place. A hint about
what the eight animals have in common, printed eight times down a grid, is
the same sentence eight times.

*Reveal* — the give-up control — stays on the piece page. Eight of them in a
grid invites one sweep down the column that ends the game in ten seconds, and
a reveal cannot be undone short of a full reset (§5). Giving up should cost a
click through to the piece. The tile therefore has exactly two outcomes:
right, or try again.

**Wrong on a tile behaves as it does on the panel.** One `guess-shake` (a
no-op under `prefers-reduced-motion`, `app/globals.css:283-295`), text kept
and selected, focus held in the input, `not quite` in a tile-scoped
`aria-live="polite"` region. Only one form can be submitted at a time, so
eight live regions announce one thing.

**Solved, on the tile.** The form is replaced in place by `✓ ` +
`accepts[0]`, in the collection tone, and the corner mark flips to ✓ — both
already read from the same provider, so the header ring updates in the same
frame. What the tile does **not** show is the reveal's payoff:

- **no reference photo, and no side-by-side.** The pair of 1:1 images is the
  piece page's job and only reads at that size. It also keeps the collection
  page's network quiet — an unopened `<details>` on eight tiles would
  otherwise become eight photo requests the moment the grid was played
  through (§6).
- when the piece has a `reference`, the answer line gains one muted trailing
  link, `see the photo`, pointing at the piece page. With every `reference`
  absent today it renders nothing — the line reads complete as `✓ cow`, same
  rule as the panel's missing `note`.
- a revealed (given-up) piece shows the open-eye mark and the bare word, no
  ✓ — identical to the panel's distinction.

**Focus after a solve is not optional.** The form unmounts, so a keyboard
visitor's focus would fall to `<body>` and their next Tab would restart at
the top of the document. Focus moves to the answer line (`tabIndex={-1}`),
exactly as `GuessPanel` does with `answerRef`.

**Reserve the row's height.** `MasonryGrid` deals tiles round-robin into
independent flex columns, so a tile that changes height shifts everything
below it *in its own column* — including, on a solve, tiles the visitor is
mid-guess on. The guess row gets a `min-height` equal to the input's, so the
form → answer-line swap is a swap inside a stable box and not a reflow. The
same box absorbs the post-mount swap described next.

**No-JS: a link, not a disabled input.** The panel can render its form
server-side because its `<details>` reveal still works with JS off (§6) — the
tile has no `<details>`, so a permanently `disabled` input there would be a
dead end with nothing behind it. The tile's guess row therefore renders, on
the server and on the first client render, as a **link to the piece page**
styled to the row (`▸ name this one`), and the live form replaces it after
mount. A no-JS visitor is routed to the surface where level 1 works, which is
better than what the panel's own pattern would give them here. This does not
weaken §6: the piece page's markup is unchanged, and it remains the surface
that works without scripts.

**Tab stops.** An unsolved guessable tile costs four (image, caption, input,
submit); a solved one costs two, because the answer line isn't focusable. The
grid gets quieter as it is played, which is the right direction.

**Payload, stated plainly.** All eight answers already ship inside
`/work/eye-studies`'s client payload — `GuessTileMark` receives whole
`piece` and `collection` objects today, so `accepts` is in that document
whether or not the tiles are playable. Making the grid playable requires
`accepts` client-side anyway (no server, §10), so this changes nothing about
what is readable; §0's honor system covers it. One cheap tidy while touching
these components: pass the tile's own `piece` and the collection's `slug` and
tone, not the whole `WorkCollection` — eight copies of all eight pieces is
payload weight with no reader.

**Which tiles.** `guess` is general (§1), so this belongs to the shared
caption region, not to `ImageTile` alone: one `GuessTileForm` component
mounted at the same position in all three `PieceTile` branches. Only
`ImageTile` has a guessable customer today; `IllustratedTile` and `TextTile`
should get it for free rather than needing a second decision later.

---

## 4. Answer matching

One exported pure function, in `lib/work.ts` beside the data it serves, so it
is unit-testable without a DOM and usable from both surfaces:

```ts
/**
 * Normalize a guess for comparison: lowercase, strip accents, drop a leading
 * article, collapse whitespace, drop everything that isn't a letter or an
 * internal space. Deliberately forgiving — the game is "do you recognize the
 * animal," not "can you type."
 */
export function normalizeGuess(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(a|an|the)\s+/, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isCorrectGuess(guess: Guess, input: string): boolean {
  const normalized = normalizeGuess(input)
  if (!normalized) return false
  return guess.accepts.some((a) => normalizeGuess(a) === normalized)
}
```

Rules the implementation must hold to:

- **Exact match after normalization. No fuzzy matching, no edit distance.**
  A Levenshtein threshold that accepts "cow" for "sow" is worse than a
  rejection; `accepts` is the place to be generous, and it is explicit.
- **Empty input is not a wrong answer.** Submitting an empty box does
  nothing — no shake, no message. It's a mis-press, not a guess.
- **Trailing punctuation and plurals are the author's problem.** The
  normalizer strips punctuation but not plural `s` — stemming "geese" is not
  worth a library, and `accepts: ['goose', 'geese']` says it plainly.
- Normalization runs on `accepts` too, at compare time, so a data entry with
  a capital or an article still works.

---

## 5. State: `localStorage`, best-effort

This would be the site's **first use of browser storage** — `grep` finds none
today outside a code-demo comment noting its absence. That makes the rules
worth writing down rather than assuming.

```ts
// One key for the whole site, so a future guessable piece outside
// eye-studies (§9) needs no migration.
type GuessProgress = {
  /** Key: `${collection}/${piece}`. 'solved' and 'revealed' are distinct —
   *  only 'solved' counts on the scorecard. */
  pieces: Record<string, 'solved' | 'revealed'>
  /** Key: collection slug. How many hint rungs have been taken for the
   *  whole set — NOT per piece, because the hints aren't (§2). */
  hints: Record<string, number>
}
const STORAGE_KEY = 'bq:guesses:v1'
```

**`hints` is keyed by collection, and that is the shape the UI depends on.**
Taking rung 1 on `/work/eye-studies/03` must show rung 1 on `/07` — a hint
about the set, unlocked per piece, would mean answering "what do these have
in common?" eight separate times. A per-piece hint counter is the single most
likely way to get this wrong; the type above is what prevents it.

**Hydration.** The pages are statically prerendered. The server has no idea
what the visitor has solved, so the panel **must render its unsolved state on
the server and reconcile after mount** — reading storage during render is a
hydration mismatch. Follow `next-themes`' pattern (`components/theme-provider.tsx`):
render the neutral state, read storage in an effect, then update. Do not add
a blocking inline script for this; a one-frame flash on a guessing panel is
not worth what that costs the rest of the page.

**Every read and write is wrapped in `try`/`catch`.** Private windows,
disabled site data, and quota errors all throw on access, not just on write.
A storage failure degrades to a session that forgets — never to a crash and
never to a visible error. The scorecard simply reads `0 of 8`.

**Shared state across the two surfaces.** The collection page and its eight
piece pages are separate routes, so there is no live shared context to build —
each page reads storage on mount and is correct. This is also what makes the
shared hint ladder cheap: "shared across pieces" and "persisted" are the same
mechanism, not two. Within the collection page,
the scorecard and the eight tiles do need one source of truth: a small
client provider (`GuessProgressProvider`) holding the parsed record, following
the `createContext` pattern already used in `components/work-gallery.tsx`.
A `storage` event listener keeps two open tabs consistent; this is four lines
and prevents a genuinely confusing state.

**Reset is confirmed and total.** It clears the key, not one piece. Progress
has no other copy, and an accidental click would erase the whole game.

---

## 6. Accessibility, no-JS, and the lightbox

**Level 1 is not a fallback we build separately — it is what the markup
already is.** The panel's server-rendered form is a native `<form>`, and the
reveal is a native `<details>`/`<summary>`, the same primitive
`components/site-footer.tsx:51` already uses. With JavaScript off:

- the hint and reveal `<details>` still open, so **the spoiler works** — this
  is level 1, complete, for free;
- the form's submit does nothing (no action, no route to post to), so the
  input is rendered `disabled` with the prompt still readable when JS hasn't
  mounted, rather than sitting there inert and lying about being usable.

That is the whole reason both levels ship together: they are one component,
and the "basic" level is the substrate the enhanced one is built on.

Further rules:

- **The answer must be behind `<details>` in the DOM, not merely visually
  hidden.** `opacity: 0`, `color: transparent`, and blur filters all leave the
  text in the accessibility tree, so a screen-reader user gets the answer
  read aloud and the game is worse for them than for everyone else. Closed
  `<details>` content is correctly hidden from assistive tech and from
  find-in-page.
- The result line (`not quite`, `✓ cow`) lives in an `aria-live="polite"`
  region so a wrong guess is announced, not silently styled.
- **The reference photo's `alt` names the animal, and that is correct.** It
  sits inside the collapsed `<details>` with the answer, so it is out of the
  accessibility tree until reveal — and after reveal, a screen-reader user
  needs the same description everyone else gets by looking. Do not write a
  coy alt (`"a reference photograph"`); that would degrade the reveal for
  exactly one group of visitors.
- The shake honours `prefers-reduced-motion` — colour and text only.
- **The grid tile's no-JS state is a link to the piece page, not a disabled
  input** (§3). The tile has no `<details>` behind it, so the panel's
  "render it disabled" pattern would strand a no-JS visitor with nothing to
  open; routing them to the surface where level 1 works is the honest move.
  The piece page's own markup is unchanged.
- Focus stays in the input after a wrong guess and moves to the revealed
  answer after a correct one.
- The submit button is a real `<button type="submit">`; Enter submits.

### The photo is a second spoiler surface

A photograph of a cow gives the answer away more completely than the word
"cow" does, so the reference photo inherits every rule above — and adds two
of its own.

**Filenames are numbers, never subjects.** `03.webp`, not `cow.webp`. An
`<img src>` (and everything `next/image` puts in `srcset`) is present in the
served HTML whether or not the image has been fetched, so view-source shows
the path for all eight photos on any page that renders them. A numbered path
gives nothing away; a descriptive one hands over the whole collection at
once, from the *collection* page, before a single guess. This is the one
place where "plaintext, honor system" (§0) still demands care: the decision
was not to hash the answers, not to leave them lying in the open.

**Do not set `priority` on the reveal image.** `next/image` is lazy by
default, and a lazy image inside a closed `<details>` is not fetched until
the element opens — so an unrevealed piece makes no network request for its
answer, and the network tab stays as quiet as the DOM. That falls out of the
`<details>` choice made for accessibility rather than being engineered for,
which is the nicest kind of property, but it is one prop away from being
lost. The same goes for any `<link rel="preload">` or prefetch aimed at these
paths.

Consequently there is a **small layout cost on reveal**: the photo is fetched
at open time, so reserve its box (it's 1:1, known ahead) rather than letting
the panel jump when the image lands.

**Answers must never reach metadata.** `metaDescription()` reads
`description` and `text`, neither of which this touches — but a `note` or
`accepts` leaking into an OG description, the sitemap, or a page `<title>`
would put the answer in a search result. **Acceptance requires grepping the
built output** (§8) rather than assuming.

**The lightbox is not part of the game.** It shows the title and nothing
else today, and it was just rebuilt (`e14622e`); adding a form to a
full-screen image viewer with its own scroll-to-dismiss gesture, arrow-key
navigation, and idle-fade is a fight for no gain. Browsing the eyes
full-screen and playing the game are different activities.

---

## 7. What does *not* change

**Titles stay `01`–`08`, solved or not.** ARCHITECTURE's 2026-08-27 decision
("Don't 'fix' these into descriptive titles") is not superseded by this spec —
it is *vindicated* by it. The stored title is the piece's identity and appears
in URLs, metadata, the lightbox, and search; the answer is a separate field
revealed in one place. A solved piece does not retitle itself to "Cow" on the
tile, in the breadcrumb, or in the browser tab.

**The four withheld captions stay withheld.** `02`, `04`, `06`, and `07`
carry no `description` because the original Instagram text named the animal
(`lib/work.ts:1282-1284`). The reveal shows Beck's new `note`, not the archive
caption. This is the decision from §0 and it is also the safe one: restoring
imported content verbatim is a rule on this project, and a caption that names
the answer can't be edited to fit the game without breaking it.

**No new routes.** Eight guessable pieces add zero pages; the build stays at
204 static pages.

---

## 8. Acceptance

- [ ] `tsc --noEmit` clean; `next build` clean; **still 204 static pages**.
- [ ] `/work/eye-studies` shows `0 of 8 named` on a fresh profile, with a `?`
      mark on all eight tiles and no reset control.
- [ ] Typing `cow` on `/work/eye-studies/03` solves it. So do `Cow`,
      ` a cow `, `CATTLE`, and `calf.`
- [ ] `duck` on `06` is wrong; `goose` and `geese` are right.
- [ ] `tuna` and `fish` both solve `08`, and **both reveal the word "tuna"** —
      `accepts[0]` is what prints. `salmon` is wrong.
- [ ] `bird` solves nothing.
- [ ] **Taking hint 1 on `/03` shows it on `/07` and in the collection
      header** — reload included. The counter is per collection, not per
      piece.
- [ ] Hint 1 renders as a question and prints no answer anywhere in the DOM;
      hint 2 answers it. The control disappears after rung 2.
- [ ] Hints are reachable from `/work/eye-studies` itself without opening a
      piece.
- [ ] Taking hints does not change the scorecard — hints aren't a penalty.
- [ ] A solved piece shows the study and the reference photo **side by side**
      above `sm`, stacked below it, both 1:1, with no layout jump when the
      photo lands.
- [ ] The credit renders under the photo and both links work — name →
      photographer profile, "Unsplash" → the photo's page.
- [ ] **With every `note` absent, the revealed panel reads as finished** — no
      gap, no orphan heading, no empty rule.
- [ ] `ls public/art/eye-studies/reference/` lists only numbered files; no
      filename names an animal.
- [ ] On an unrevealed piece, the network tab shows **no request** for
      `/art/eye-studies/reference/*` — open devtools, load `/03`, confirm,
      then reveal and watch it arrive.
- [ ] `view-source` on `/work/eye-studies` and on `/work/eye-studies/03`
      contains no animal name in any image path or `srcset`.
- [ ] A wrong guess shakes once, announces politely, keeps focus and text.
- [ ] After solving `03`, the collection page reads `1 of 8` and tile `03`
      shows ✓ — **on reload, and in a second tab opened before the solve.**
- [ ] **Typing `cow` into tile `03` on `/work/eye-studies` solves it without
      leaving the page**: the form becomes `✓ cow`, the corner mark flips, and
      the header ring advances to `1 of 8` in the same frame.
- [ ] Clicking a tile's *image* still opens the lightbox and clicking its
      *title* still opens the piece page — neither is intercepted by the form,
      and no click lands on the wrong one of the three.
- [ ] A tile solved from the grid shows solved on its piece page, and vice
      versa, after a reload.
- [ ] A wrong guess on a tile shakes that tile's input only, keeps its text
      selected, and announces `not quite` once.
- [ ] Solving a tile mid-column does **not** shift the tile below it — the
      guess row's reserved height absorbs the swap. Same on hydration for a
      returning visitor with solves already stored.
- [ ] After a solve from the grid, Tab moves to the *next tile*, not to the
      top of the document.
- [ ] No tile shows a hint control or a reveal control. Hints appear only in
      the header; give-up only on the piece page.
- [ ] No tile renders a reference photo, and playing the whole grid through
      makes **no** request for `/art/eye-studies/reference/*`.
- [ ] With JavaScript disabled, each guessable tile shows `▸ name this one`
      linking to its piece page — no disabled input, no dead control.
- [ ] `tsc --noEmit` still clean with `GuessTileForm` mounted in all three
      `PieceTile` branches, including the two with no guessable customer.
- [ ] Revealing `05` shows the note, marks it revealed, and the scorecard
      still reads `1 of 8` — reveals don't count.
- [ ] Reset asks first, then returns everything to `0 of 8`.
- [ ] With JavaScript disabled: the prompt renders, the hint and reveal
      `<details>` open, and the input is visibly disabled rather than dead.
- [ ] With storage blocked (private window, site data off): the panel works
      for the session and no error surfaces.
- [ ] A screen reader on an unsolved piece **cannot** reach the answer text.
- [ ] `grep -ri 'turkey\|chicken\|tuna' .next/server/app/work/eye-studies*`
      finds answers only inside the page's client payload — **not** in any
      `<title>`, `<meta>`, `sitemap.xml`, or OG image.
- [ ] The `// Order: turkey, pig, …` comment at `lib/work.ts:1285` is gone,
      its content now living in the `guess` fields — and note it said
      **`fish`**, which is now only the generous answer; the data says `tuna`.
- [ ] The collection `description` no longer promises a game that has shipped.

---

## 9. The second customer, and the ones after

The generality in §1 is not speculative. `april-colors-24/05-colors-from-a-bird`
already carries this in its own `description` (`lib/work.ts:786`):

> "guess the bird? black and (off)white are part of the palette / I tried to
> keep to the rough distribution of the colors also"

That is a guessing game Beck wrote by hand, with a hint already in it, and it
predates this spec. It is the proof that `guess` belongs on `WorkPiece`
rather than inside an `eye-studies` component.

**It is deliberately not converted in this build.** Its answer isn't recorded
anywhere in the tree, the description would need rewriting to stop
double-asking, and it's a single piece rather than a set — so it earns its own
small decision rather than riding along. Convert it once the eight eyes have
shipped and the shape has been used in anger.

---

## 10. Out of scope

- **Any server component.** No API route, no submission collection, no
  aggregate "68% of visitors guessed pig." The site is statically exported.
- **Scoring, streaks, timers, difficulty.** Eight questions, no ceremony.
- **Sharing a result.** No emoji-grid, no "I named 6 of 8" card. Attractive,
  and a genuinely different feature with its own OG-image work.
- **Guessing inside the lightbox** (§6). Guessing *from the tile* was here in
  the first draft and is now in scope — see §3.
- **The reveal on a tile.** The tile names the answer; the study-and-photo
  pair, the credit, and the note stay on the piece page (§3).
- **A cross-collection global scorecard.** The storage shape in §5 permits it
  later; nothing renders it now.
- **Fuzzy or AI-assisted matching** (§4).
- **Opening the reference photo in the lightbox** (§3) — it would break the
  side-by-side comparison it exists for.
- **The eight reveal notes** — postponed by Beck 2026-09-02, not cancelled.
  The `note` field ships in the type and renders when present; nothing else
  is needed when they arrive.
- **Making hint 1's question itself guessable**, with a second input and a
  checked answer. §2 explains why: the answer is a sentence, and the point is
  that the visitor checks their own thought against rung 2 rather than being
  graded on phrasing.
