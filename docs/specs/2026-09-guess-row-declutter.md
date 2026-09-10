# Spec — decluttering the guess row

The guessing game shipped and works. This is a correction pass on its two
pieces of chrome: **the submit button, which is squeezed to the point of
uselessness on narrow tiles, and the `?` corner badge, which sits on the
artwork.** Both go. One layout change — a wider grid — pays for the room the
remaining input needs.

Amends [2026-09-guessing-game.md](2026-09-guessing-game.md); §11 below lists
exactly which of its claims this supersedes. Nothing here changes the data
model, the storage shape, the matching rules, the hint ladder, or the reveal.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| The tile's `guess` button | **Gone.** Enter submits; a small `↵` icon button sits *inside* the input's right edge | Beck, 2026-09-10 |
| The `?` corner badge | **Gone entirely** — all three states, not just the `?`. `GuessTileMark` is deleted | Beck, 2026-09-10 |
| The piece page's panel | **Mirrors the tile** — same in-input submit, and the `HelpCircle` beside the prompt goes too | Beck, 2026-09-10 |
| How the narrow tile gets room | **Widen the grid**, not degrade the form: a guessable collection lays out 2-up, 1-up on phones | Beck, 2026-09-10 |
| Where per-tile state lives now | **The guess row, and only the guess row** | Beck, 2026-09-10 |

---

## 1. The problem, measured

The guess row is `[input flex-1] [gap-2] [button "guess"]` inside a tile
with `px-4`. `MasonryGrid`'s default is `{ lg: 3 }` with `base: 2`, and its
one breakpoint is `xs` (31.25rem/500px). The tightest tile on the site is
therefore the *first* 3-column layout, immediately above `xs`:

| Viewport | Gutter | Gap | Cols | Tile | Row inside `px-4` |
| --- | --- | --- | --- | --- | --- |
| 375px | `px-3` = 24 | `gap-2` = 8 | 2 | 171px | 139px |
| **500px** | `px-5` = 40 | `gap-4` = 16×2 | **3** | **143px** | **111px** |
| 639px | `px-5` = 40 | `gap-4` = 16×2 | 3 | 189px | 157px |
| 1024px+ | `px-8` = 64 | `gap-6` = 24×2 | 3 | 304px | 272px |

The `guess` button is `px-3 text-sm` — 24px of padding plus about 38px of
lowercase label, so ~62px, and the `gap-2` before it is 8 more. At 500px that
leaves the input **~41px**, narrower than its own placeholder and narrower
than most of the words being typed into it. It is not clipped by
`overflow-hidden`; it is squeezed by its neighbour. The button is the widest
thing in the row and the least necessary — Enter already submits, and the
input is the only control anyone actually uses.

The badge is a separate complaint with a separate fix: it is an overlay on
the painting, and the paintings are the point.

---

## 2. File-by-file

| File | Change |
| --- | --- |
| `components/guess-mark.tsx` | **Deleted.** |
| `components/guess-tile-form.tsx` | Submit button moves inside the input (§3). |
| `components/guess-panel.tsx` | Same submit treatment; `HelpCircle` removed (§5). |
| `components/work-visuals.tsx` | Three `GuessTileMark` blocks and its import removed (§4); new `collectionGridColumns` export (§6). |
| `app/work/[slug]/page.tsx` | `MasonryGrid columns=` reads `collectionGridColumns` (§6). |
| `lib/work.ts` | Unchanged. |
| `lib/guess-storage.ts`, `components/guess-provider.tsx` | Unchanged. |
| `components/guess-scorecard.tsx` | Unchanged. |
| `app/globals.css` | Unchanged — `guess-shake` still applies to the same wrapper. |

No new files. No new dependencies; `CornerDownLeft` is already in
`lucide-react`.

---

## 3. The tile's guess row

### Shape

```
  ┌───────────────────────────────┐     ┌───────────────────────────────┐
  │  ┌───────────────────────┐    │     │  ┌───────────────────────┐    │
  │  │       the eye         │    │     │  │       the eye         │    │
  │  │      [lightbox]       │    │     │  │      [lightbox]       │    │
  │  └───────────────────────┘    │     │  └───────────────────────┘    │
  │  03                  ← link   │     │  03                  ← link   │
  │  The lashes on this one are   │     │  The lashes on this one are   │
  │  so lovely.                   │     │  so lovely.                   │
  │  ┌─────────────────────────┐  │     │  ✓ cow                        │
  │  │ what animal?       (↵)  │  │     │                               │
  │  └─────────────────────────┘  │     │                               │
  └───────────────────────────────┘     └───────────────────────────────┘
          unsolved                              solved
       no corner badge                     no corner badge
```

### Markup

Replace the current sibling `<input>` + `<button>` pair (lines 134–157) with
a positioned pair. Everything outside the `shakeRef` wrapper — the outer
`min-h-[3.875rem] px-4 pb-4 pt-3` box, the `<form onSubmit>`, the sr-only
`<label>`, the `aria-live` region — is unchanged.

```tsx
<div ref={shakeRef} className="relative flex-1">
  <input
    ref={inputRef}
    id={inputId}
    type="text"
    value={value}
    onChange={…}                       // unchanged
    placeholder="what animal?"
    autoComplete="off"
    className={cn(
      'w-full min-w-0 rounded-lg border bg-background py-1.5 pl-2.5 pr-9 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
      wrong ? 'border-destructive text-destructive' : 'border-border',
    )}
  />
  <button
    type="submit"
    aria-label="submit guess"
    className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    style={{ color: value.trim() ? tone : undefined }}
  >
    <CornerDownLeft className="h-4 w-4 text-current" strokeWidth={1.75} aria-hidden="true" />
  </button>
</div>
```

### The rules behind that markup

- **`pr-9` is load-bearing.** 4px offset + 28px button + 4px clearance = 36px.
  Typed text must never run under the icon.
- **The button is absolutely positioned, so it costs the row zero width.**
  This is the whole point: the input is now `w-full` of the row at every
  viewport, and the affordance is free.
- **It is a real `<button type="submit">`,** so Enter still submits natively
  through the same `handleSubmit` — the icon is a second door to one
  mechanism, not a second mechanism.
- **`CornerDownLeft` (↵), not an arrow.** Enter is the primary gesture now;
  the glyph should teach it rather than compete with it. Same glyph on both
  surfaces.
- **Muted when empty, tone when not.** The icon inherits `currentColor`; the
  button's colour is the collection tone once `value.trim()` is non-empty and
  the inherited muted colour otherwise. Give the button a base
  `text-muted-foreground` class so the `undefined` inline colour falls back
  to something deliberate. It is never hidden and never `disabled` — a
  control that appears mid-typing is noise, and a disabled one is worse to
  reach by keyboard.
- **28px square, not 24.** `h-7 w-7` clears the 24×24 minimum target with
  room, and still fits inside a 34px-tall input.
- **`shakeRef` moves to the new `relative` wrapper**, so the input and its
  icon shake as one unit. The shake is ±4px inside 16px of `px-4` padding, so
  the tile's `overflow-hidden` still never clips it. `guess-shake` and its
  `prefers-reduced-motion` no-op are untouched.
- **Height is unchanged.** `py-1.5 text-sm` + border is still 34px; `pt-3` +
  `pb-4` is still 28px; `min-h-[3.875rem]` (62px) is still exactly the form
  row's rendered height and still the value that pins the link and
  solved-answer states so the swap doesn't reflow the column. Do not
  recompute it and do not remove it.

### Empty submit

Currently `handleSubmit` returns early on `!value.trim()` with no feedback,
which was invisible when the only way to submit was a keypress. A visible
button makes a silent no-op feel broken. Change the early return to:

```ts
if (!value.trim()) {
  inputRef.current?.focus()
  return
}
```

Still not a wrong guess: no shake, no `not quite`, no state written. The
existing comment about why this checks the raw trimmed value rather than
`normalizeGuess(value)` stays — `!!!` is a real (wrong) guess and must reach
the wrong-guess path.

### Unchanged on the tile

The three regions (image → lightbox, caption → piece page, row → guess), the
no-JS/pre-hydration `▸ name this one` link, the solved/revealed answer line
with its `✓`/eye icon and optional `see the photo` link, focus moving to
`answerRef` on solve, the sr-only prompt label, the tile-scoped
`aria-live="polite"` region, and the absence of hint and reveal controls.

**Tab stops are unchanged: four per unsolved tile** (image, caption, input,
submit), two per solved one. The submit moved inside the input; it did not
leave the tab order. Stated plainly so §11's note against the old acceptance
list isn't mistaken for a regression.

---

## 4. Deleting the corner badge

Delete `components/guess-mark.tsx` and, in `components/work-visuals.tsx`:

- the import at line 31;
- the `{isGuessable(piece) && <div className="absolute left-3 top-3">…}` block
  in `TextTile` (1081–1084);
- the `absolute right-3 top-3` blocks in `ImageTile` (1133–1136) and
  `IllustratedTile` (1196–1199).

**`WriteupMark` does not move.** It keeps `right-3` in `TextTile` (where it
sits opposite the `Quote` glyph, for the reason its own comment gives) and
`left-3` in `ImageTile` and `IllustratedTile`. Removing the guess badge frees
a corner; leave it free. Do not re-centre, re-balance, or consolidate the
remaining marks — that is `StatusRail`'s job on the top-level gallery and is
not in scope here.

**What now asks the question.** The old spec justified having no printed
prompt on the row by pointing at the badge: "the corner `?` mark already asks
the question." With the badge gone, the question is asked by the input's
`placeholder` (`what animal?`) and, for assistive tech, by the sr-only
`<label>` carrying the piece's full `prompt`. That is sufficient and it is
also why nothing new gets printed above the row: an input that says "what
animal?" directly under the title does not need a heading telling you it is a
question. Do not add a visible prompt line to the tile.

**Solved state is unaffected.** The answer row already prints `✓ cow` /
eye + `cow` in the collection tone. It keeps its icon; there is no longer a
second copy of that icon anywhere on the tile.

**Losses, accepted.** The badge's `title` tooltips (`guess below` / `named` /
`revealed`) go with it, and an unplayed tile no longer advertises at a glance
that it is playable — the input does that instead, one line lower, without
covering the painting.

---

## 5. The piece page's panel

`GuessPanel` gets the same treatment, for consistency rather than for space —
it is `max-w-2xl` and was never squeezed.

- **Same in-input submit.** Replace the `guess` button (lines 210–214) with
  the §3 markup. The panel's input keeps `px-3`, so it becomes `pl-3 pr-9`.
- **`HelpCircle` goes** — the import on line 5 and the icon on line 188. The
  visible `<label>` text stays: the prompt sentence is not the `?` chrome, it
  is the question, and this surface has room to ask it in words. The label
  keeps `font-brand-italic … text-foreground` and loses only `gap-2`'s icon.
- **Fix the no-JS gap while you are here.** The panel's input is
  `disabled={!mounted}` but its submit never was — with JS off, that leaves an
  enabled control on a `<form>` with no `action`, which is exactly the dead
  end §6 of the old spec forbids. The new submit takes `disabled={!mounted}`
  alongside the input, and styles the disabled state as muted (no tone).
- **Empty submit** behaves as in §3: focus the input, no shake.
- Everything else on the panel is untouched — the two-rung hint ladder, the
  `<details>` reveal and its uncontrolled `open`, `GuessReveal`, the
  side-by-side reference pair, the credit line, the `min-h-[1.25rem]`
  wrong-guess line, and the shake.

---

## 6. Widening the grid

A guessable collection lays out `{ lg: 2, base: 1 }` — the same config the
`illustrated` layout already uses, and for the same kind of reason: a tile
that has to hold a text input needs more measure than a third of the page.

In `components/work-visuals.tsx`:

```ts
import type { MasonryColumns } from '@/components/masonry-grid'

/**
 * A collection grid's column config. `illustrated` collections and
 * guessable ones land on the same answer for different reasons — verse
 * needs measure, and a guess input needs a row wide enough to type in.
 * Anything else takes MasonryGrid's default ({ lg: 3 }, base 2).
 */
export function collectionGridColumns(collection: WorkCollection): MasonryColumns | undefined {
  if (collectionLayout(collection) === 'illustrated' || hasGuessablePieces(collection)) {
    return { lg: 2, base: 1 }
  }
  return undefined
}
```

In `app/work/[slug]/page.tsx`, line 148 becomes:

```tsx
<MasonryGrid className="mt-6" columns={collectionGridColumns(item)}>
```

The `layout` local stays — `chapbook` still reads it.

**Why a helper rather than a second ternary.** The page already computes
`layout` and `guessable`; a two-condition ternary inline reads as a
coincidence. The helper names the fact that these two collections want the
same shape, and gives the next collection type that needs room one place to
say so. It lives in `work-visuals.tsx` rather than `lib/work.ts` because
`MasonryColumns` is defined in a client component and `lib/work.ts` must not
import from `components/`.

**No conflict to resolve.** No collection is both `illustrated` and
guessable today, and if one were, both branches return the same object.
`book` collections never reach `MasonryGrid` (they render
`ChapbookContents`).

### What this buys

| Viewport | Cols before → after | Row width before → after |
| --- | --- | --- |
| 375px | 2 → **1** | 139px → **319px** |
| 500px | 3 → **2** | 111px → **190px** |
| 639px | 3 → **2** | 157px → **262px** |
| 1024px+ | 3 → **2** | 272px → **436px** |

The worst case improves by 71%, and the desktop tile goes from 304px to
468px wide — eight 1:1 paintings at nearly half the page each, which is a
better showing for the work independent of the game.

### What it costs

**A longer collection page on phones.** Eight `1/1` tiles at full width on a
375px screen is roughly 8 × (351px image + ~110px caption) ≈ **3.7k pixels**
of scroll, up from about half that. This is the accepted trade: Beck chose
widening over degrading the form. Do not add a "compact on phones" branch to
win it back.

**Nothing else.** `useMasonryColumns` already handles `base: 1`; the
responsive template already writes both `grid-cols-1` and `xs:grid-cols-2`
literally for Tailwind's scanner; the `@container/card` container on each
column wrapper is unchanged, so `.deck-card` geometry and any other
width-keyed rule adapt on their own.

**Pre-existing quirk, explicitly not fixed here.** With `base: 1`,
`MasonryGrid` deals children into `columns.lg` (2) arrays for the server and
first client render while the container is `grid-cols-1`, so a phone visitor
sees `1,3,5,7` then `2,4,6,8` for one frame until the effect corrects the
count. This is how every `illustrated` collection already behaves and is a
property of `MasonryGrid`, not of this change. Leave it alone.

---

## 7. Edge cases

| Case | Handling |
| --- | --- |
| Submit clicked with an empty input | Focus the input, return. No shake, no `not quite`, no state written. |
| Submit clicked with whitespace only | Same as empty — `value.trim()` is the test. |
| Submit clicked with symbols/digits (`!!!`) | A real wrong guess: shake, `not quite`, text kept and selected. Unchanged; do not route it through `normalizeGuess` first. |
| Typed text long enough to scroll under the icon | Cannot happen — `pr-9` reserves the icon's box, and the input scrolls its own content inside that padding. |
| Pointer clicks the icon (input blurs, then submits) | Wrong guess re-focuses via the existing `inputRef.current?.focus()`; correct guess unmounts the form and focus moves to `answerRef`. Both paths already exist. |
| Keyboard reaches the icon | It is in the natural tab order after the input, has `aria-label="submit guess"`, and shows a `focus-visible` ring against the input's fill. |
| `prefers-reduced-motion` | Unchanged: `guess-shake`'s keyframes live under `@media (prefers-no-preference)`, so the border/text colour change is the whole wrong-guess signal. The icon's `transition-colors` is a colour transition and is fine to keep. |
| No JS / pre-hydration, tile | Unchanged: the row is the `▸ name this one` link. The form — and therefore the icon — never renders. |
| No JS / pre-hydration, panel | Input **and** submit are `disabled`; the hint and reveal `<details>` still work. This is the §5 fix. |
| Storage blocked (private window, site data off) | Unchanged: `readGuessProgress`/`writeGuessProgress` already swallow throws; the session plays and forgets. |
| A solve in another tab | Unchanged: the `storage` listener in `GuessProgressProvider` still updates every tile and the scorecard. |
| A revealed (given-up) piece seen on the grid | Row shows the eye icon + the bare word, no `✓`. Unchanged — and now the only place that distinction appears on the collection page. |
| A guessable `TextTile` or `IllustratedTile` | Both still mount `GuessTileForm` at the same position and now both lose their badge too. No guessable customer exists in either today; keep them wired. |
| A collection with one guessable piece among many | Still gets `{ lg: 2, base: 1 }` for the whole grid — `hasGuessablePieces` is a collection-level fact, and a grid cannot lay two column counts side by side. |
| `tone` unreadable against the input fill | Not a new risk: the same tone already backed a filled button and now only tints a 16px glyph on `bg-background`. If a specific collection's tone proves too pale, that is a data fix, not a component branch. |

---

## 8. Acceptance

- [ ] `tsc --noEmit` clean; `next build` clean; **still 204 static pages**.
- [ ] `rg 'GuessTileMark|guess-mark' .` returns nothing outside this spec and
      the amended older one.
- [ ] `/work/eye-studies` at 500px wide: two columns, and the guess input is
      the full width of the row with the `↵` at its right edge — **no
      horizontal squeeze, no clipped control.**
- [ ] The same page at 375px: one column, full-width tiles.
- [ ] The same page at 1440px: two columns, not three.
- [ ] `/work/april-colors-24` (not guessable, not illustrated) is **still
      three columns** — the widening is scoped, not global.
- [ ] `/work/mindtober-21` (illustrated) is unchanged by the refactor.
- [ ] No eye-studies tile has any badge over its artwork. The `WriteupMark`
      corner on tiles that carry a writeup is exactly where it was.
- [ ] Typing `cow` into tile `03` and pressing **Enter** solves it: the row
      becomes `✓ cow` and the header ring advances to `1 of 8` in the same
      frame.
- [ ] Doing the same and **clicking the `↵` icon** solves it identically.
- [ ] The icon is muted with the input empty and takes the collection tone
      once a character is typed.
- [ ] Clicking the icon with an empty input focuses the input and does
      nothing else — no shake, no announcement, scorecard unmoved.
- [ ] Typing `!!!` and submitting shakes once and keeps the text selected.
- [ ] Solving a tile mid-column does **not** shift the tile below it — the
      62px reserve still absorbs the swap, and so does hydration for a
      returning visitor with solves stored.
- [ ] After a solve from the grid, Tab moves to the *next tile*.
- [ ] Clicking a tile's image still opens the lightbox; clicking its title
      still opens the piece page.
- [ ] `/work/eye-studies/03` shows no `?` icon beside the prompt, the prompt
      sentence still reads, and the `↵` sits inside the input.
- [ ] With JavaScript disabled on `/work/eye-studies/03`, **both** the input
      and the submit render disabled, and the hint and reveal `<details>`
      still open.
- [ ] With JavaScript disabled on `/work/eye-studies`, each tile still shows
      `▸ name this one`.
- [ ] A screen reader on an unsolved piece still cannot reach the answer, and
      the submit announces as `submit guess`.
- [ ] Under `prefers-reduced-motion`, a wrong guess changes colour and
      announces, and nothing moves.
- [ ] Hints, reveal, reset, cross-tab sync, and cross-surface state all behave
      exactly as the original acceptance list says.

---

## 9. Documentation to update in the same change

- **[2026-09-guessing-game.md](2026-09-guessing-game.md)** — amend in place in
  the style that spec already uses for its own reversals (a dated note, not a
  silent edit). §11 below is the list.
- **[../TODO.md](../TODO.md) §18** still reads *"specced 2026-09-02, not
  built."* The game is built and shipped; the item's heading and body are
  stale. Reconcile it — that is what this branch is for — and record this
  declutter pass as a follow-up rather than reopening the item.
- **[../ARCHITECTURE.md](../ARCHITECTURE.md)** — the `eye-studies` titles note
  (~line 193) is still correct and needs no change. If the collection-layouts
  table gains a row, it is for `collectionGridColumns`, not for a new layout:
  no new `CollectionLayout` value is introduced.

---

## 10. Out of scope

- **Any change to the data model.** `Guess`, `guessHints`, `hintsFor`,
  `isGuessable`, `hasGuessablePieces`, `normalizeGuess`, `isCorrectGuess`, and
  the eight `accepts` arrays are all untouched.
- **Any change to storage.** `bq:guesses:v1`, its shape, the provider, the
  `storage` listener, and the reset flow stay as they are.
- **The reveal, the reference photos, and their spoiler rules.** Every rule in
  §6 of the original spec still stands, including numbered filenames, no
  `priority`, no prefetch, and answers never reaching metadata.
- **Hints or a reveal control on the tile.** Still deliberately absent, for
  the reasons the original spec gives.
- **Guessing inside the lightbox.** Still no.
- **Converting `april-colors-24/05-colors-from-a-bird`.** Still the second
  customer, still not converted here.
- **Consolidating `WriteupMark`/`UnfinishedMark` into a `StatusRail` on piece
  tiles.** `StatusRail` is the top-level gallery's; the collection grid keeps
  its individual corner marks. Freeing a corner is not an invitation to
  restructure the other one.
- **A compact or degraded form at narrow widths.** Rejected explicitly in §6 —
  the grid widens instead, and there is one form behaviour at every viewport.
- **Fixing `MasonryGrid`'s pre-hydration ordering under `base: 1`** (§6).
- **The eight reveal notes.** Still postponed, still not cancelled.

---

## 11. What this supersedes in the original spec

Amend [2026-09-guessing-game.md](2026-09-guessing-game.md) at these points.
Each is a reversal by Beck on 2026-09-10, not a correction of a mistake —
they were right for a 3-column grid with a badge, and the grid and badge are
what changed.

| Location | Claim | Now |
| --- | --- | --- |
| §3, "The collection page" | "Each `PieceTile` for a guessable piece gets a corner mark… unsolved → a `?` mark… solved → a ✓ mark… revealed → the open-eye mark" | **Reversed.** No corner mark in any state; the guess row carries all three. |
| §3, "Guessing from the tile", ASCII diagram | Shows `(?)` and `(✓)` in the tile's top-right | Redraw without them; see §3 above. |
| §3, "The row is one row" | "the corner `?` mark already asks the question" | The placeholder and the sr-only label ask it. |
| §3, "The row is one row" | "the submit is a real `<button type="submit">` reading `guess`, sized to the row" | Still a real submit button, now an `↵` icon inside the input. |
| §3, "Solved, on the tile" | "the corner mark flips to ✓" | The row's own `✓` is the only one. |
| §3, "Tab stops" | "four (image, caption, input, submit)" | Still four — the submit moved, it did not leave. |
| §3, "Payload, stated plainly" | Describes `GuessTileMark` receiving whole objects | The component no longer exists; the payload argument still holds for `GuessTileForm`. |
| §6, final bullet | "The submit button is a real `<button type="submit">`; Enter submits." | Unchanged in substance; the button is now an icon. |
| §6 | Panel renders `disabled` when JS hasn't mounted | Extended to the submit, which was never disabled. See §5. |
| §8 acceptance | "with a `?` mark on all eight tiles" | Void — no marks. |
| §8 acceptance | "the form becomes `✓ cow`, the corner mark flips" | The corner-mark half is void. |
| §8 acceptance | "tile `03` shows ✓" | Read as: the tile's *row* shows `✓ cow`. |
| §10 out of scope | (nothing about grid width) | Add: the collection grid's column count is now derived per collection — see §6 above. |
