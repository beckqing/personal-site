# Spec — narrow-screen columns: home tabs, and the gallery's second column

> **Status: designed 2026-09-09 with Beck, not built.**
>
> Two changes that share one motive and one breakpoint. Below `sm` (640px)
> the site currently shows **one thing at a time** — one discipline column,
> one gallery card — and in both places that single column is the whole
> screen. The home page's three-ness, which is the only thing its middle
> section exists to say, survives on desktop and dies on a phone.
>
> Depends on nothing. Touches `app/page.tsx`, `components/piece-column.tsx`
> (unchanged, verified only), `components/masonry-grid.tsx`,
> `components/work-visuals.tsx`, and `app/work/[slug]/page.tsx`. **No CSS
> change is needed in `app/globals.css`** — see §2.
>
> Supersedes nothing. Extends the shipped
> [history/2026-09-home-discipline-columns.md](../history/2026-09-home-discipline-columns.md)
> into a width that spec never addressed: it was written throughout for the
> side-by-side arrangement, and says so.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| What replaces the stack on phones | **Pills become control tabs over a single column** | Beck, 2026-09-09 |
| Which tab is default | **`all work`** | Beck, 2026-09-09 |
| What's in the `all` column | **One rung from each discipline — three total** | Beck, 2026-09-09 |
| How wide the tab regime reaches | **Below ~500px only.** Three-across from 500 up — the stacked band is deleted, §2 | Beck, 2026-09-09 (revised) |
| Gallery columns below 640 | **Two, not one** | Beck, 2026-09-09 |
| Whether the tab row keeps its icons | **Yes** — which forces two rows, §3 | Beck, 2026-09-09 |
| The default tab's label | **`all work`**, not `all` | Beck, 2026-09-09 |
| What a hero word does | **Hover latches the tab; tap still navigates** | Beck, 2026-09-09 |
| Whether the `all` panel has its own CTA | **No** — the section's bottom CTA is it | Beck, 2026-09-09 |
| Tab semantics | **Toggle buttons (`aria-pressed`), not the ARIA tabs pattern** | §7 |
| How the regime switch happens | **CSS visibility over one DOM**, not a JS layout switch | §6 |
| Whether `illustrated` collections get 2 columns | **No** — verse keeps its measure, `base: 1` | §9 |
| The `all` column's half-dissolved third rung | **Accepted for now**, not re-tabled | Beck, 2026-09-09 |
| Collection stacks below 640 | **They pair, deck and all.** Two geometries split at `sm`: desktop unchanged, narrow shrinks the mark and widens card 3, §9.1 | Beck, 2026-09-09 (revised) |
| `all` and `art` tab copy | **Written**, §5 and §4a | Beck, 2026-09-09 |
| Excerpt type size in a rung | **Smaller at narrow widths**, §12.1 | Beck, 2026-09-09 |
| Gutter between rungs | **Closed by widening `x`, not by shrinking `gap`**, §12.2 | §12.2 |
| Rungs overhanging their column | **Yes**, bounded by the page's own padding | Beck, 2026-09-09 |
| The narrow-viewport page overflow | **Fixed** — `min-w-0` + `break-words`. Residual ~290px floor is `SiteNav`'s own minimum, below any real device: leave it, §9.2 | Beck, 2026-09-09 |

---

## 1. Why this exists

At a 375px viewport (335px of content after `px-5`), the home page's middle
section measures roughly:

| | |
| --- | --- |
| header — badge, three-line copy, CTA | ~140px |
| column of four rungs (art is ~197% of its own width; writing ~188%) | ~630–660px |
| × 3, plus `gap-10` twice | **~2,550px** |

That is 3.8 screenfuls. You see the `art` pill, scroll a screen and a half,
and meet `writing` with no memory of what preceded it. The columns are
decorative — every rung is `aria-hidden` — and the pills are the payload, so
the stacking trades away the only part that carries the message in order to
preserve the part that doesn't.

The gallery has the same shape of problem for the same reason:
`MasonryGrid` drops to one column below 640, and one card at ~335px wide is
a card-shaped page. A gallery that shows one thing does not read as a
gallery.

**Both fixes are the same instinct**: at the narrowest widths, breadth beats
size.

---

## 2. Two regimes, and the breakpoint that has to move

**Revised 2026-09-09 (Beck).** The original plan kept today's stacked band
at 640–767 and put tabs below 640. That band is now deleted: three columns
go side by side from **~500px** up, and the tab row is the only thing below
it.

| width | layout | fade |
| --- | --- | --- |
| **< 500** (`base`) | **tab row + one panel** (new) | `.column-fade`, per column |
| **≥ 500** (`xs`) | three columns side by side | `.columns-fade-shared` |

This is the better shape of the two. §1's ~2,550px measurement was never
really about phones — a stacked column is ~630–660px tall whatever the
viewport, so 640–767 was carrying the same three-screenful problem with more
room to waste on it. One regime boundary, and the stack exists nowhere.

**500px is not a Tailwind breakpoint.** It needs declaring, Tailwind v4
style, in the `@theme` block of [globals.css](../../app/globals.css):

```
--breakpoint-xs: 31.25rem;   /* 500px */
```

`sm` (640) and `md` (768) stop appearing in this section entirely; every
`md:` in `DisciplinePanels` becomes `xs:`, and the `sm:gap-12` on the
stacked axis has nothing left to space.

**The mask block does change now**, which reverses this section's earlier
instruction. `.column-fade` turns itself off at `min-width: 768px` and
`.columns-fade-shared` turns on at the same line; both move to
`min-width: 31.25rem`. Nothing else in that block moves — the long comment
explaining why the two rules are genuinely two is still accurate, and the
66.67% gradient stop is untouched. Change the two queries, not the
reasoning.

**Check the header, not the rungs, at 500px.** The columns get narrow enough
that the discipline header is the binding constraint: at `px-5` and
`gap-6`, a column is `(500 − 40 − 48) / 3 ≈ 137px`, and `science`'s
`StampBadge` measures ~96px of that. The badge fits; the three-to-five-line
copy blocks are what to look at, and §4a's rule that the three copy lines
stay within a line of each other gets much harder to hold at 137px than at
389px. If 500 turns out to be a line too far, the fix is to raise the
breakpoint, not to cut the copy.

The section's own ending is also unchanged: the bottom `see all work` CTA
keeps its `-mt-8` pull-up into the dissolve at every width.

`PieceColumn`'s `sizes="(max-width: 640px) 75vw, 280px"` is likewise already
right for this layout — the panel's rungs are 70–76% of a full-width column
below 640, which is what that query already claims. Nothing to change.

---

## 3. The tab row

Four controls, always all four visible, **keeping the `StampBadge` icon**
(Beck, 2026-09-09 — the shipped section's §0 refusal to let the category
become chrome holds at this width too).

Keeping the icon and keeping `all work` as the default's label are jointly
unsatisfiable in one row, which is why this section is two rows.
At `text-xs` bold with `tracking-wide`, a pill costs `border-2` + `px-3` +
a 14px icon + `gap-1.5` = 48px of chrome before any text:

| | `all work` | `art` | `writing` | `science` | total |
| --- | --- | --- | --- | --- | --- |
| pill width | ~102px | ~68px | ~96px | ~96px | **~362px** |

against **280px** of content at a 320px viewport and 335px at 375px. Even
shortening `all work` to `all` only reaches ~328px. Dropping the icon was
the previous answer; with the icon kept, the row has to break. So:

```
        [ ◆ all work ]

[ ◆ art ] [ ◆ writing ] [ ◆ science ]
```

The default sits alone on the first row; the three disciplines share the
second. This is better than an arbitrary 2×2 wrap for a reason beyond fit —
it says what's true: `all work` is the root and the three are siblings of
each other, and the second row is the same three-across arrangement the
section uses from `md` up. Second row: 68 + 96 + 96 + two 6px gaps =
**~272px**, inside 280px.

**Natural widths, centred — not equal-flex.** Equal thirds of 280px is 89px
each, and `science` needs ~96px, so flexing them to match would clip the
longest label. The two-row split already does the work equal widths were
there to do (making the group read as one control), so the pills can keep
their own sizes.

Styling:

- **Selected** — the discipline's `accentClass` (`text-hero-accent-art`,
  `text-writing`, `text-science`; `text-foreground` for `all work`), border
  in `current`, and a `bg-current/10` fill. The fill is what marks it, not
  the colour alone: colour alone fails for anyone who can't separate three
  accents, and the row has to be readable as "one of these is on."
- **Unselected** — `text-muted-foreground`, border in `current`, no fill.
- `tilt={0}`, as the shipped headers already use.

The rows sit where the three headers' badges sit today, above the panel, and
are hidden at `sm` and up (§6).

> **The 272px figure is a knife-edge and the pill widths above are
> arithmetic on an estimated ~6.8px average character, not measurement.**
> If the real advance runs nearer 7.5px, `science` reaches ~100px and the
> second row overflows 320px. Measure before building; the fallback in order
> is `px-2` (−8px per pill, ~248px), then `text-[11px]`. Do not solve it by
> dropping the icon — that was the decision this section reverses.

---

## 4. The panel

Below 640, the selected panel is the existing `DisciplineColumn` with its
`StampBadge` suppressed — the tab row now carries the label, and showing it
twice is the duplication the shipped §0 already refused. Everything else
stays: the copy line, the discipline's own CTA (`look around` / `start
reading` / `discover more`, linking to `/work?tags=…`), and the column.
The whole panel remains one `<Link>`, exactly as it is today.

So the badge's wrapper becomes hidden below `sm` and visible from `sm` up.
No other part of `DisciplineColumn` is width-dependent.

**The panel does not reserve height.** The `all` column is three rungs and a
discipline column is four, so switching tabs changes the panel's height and
moves the CTA below it. Reserving the tallest height would mean ~160px of
dead space under the default tab, which is worse than a reflow that is
normal tab behaviour anyway. The fade is a percentage mask, so it rescales
to whichever column is showing without any help.

Resulting section height at 375px: **~680px on the default tab**, ~840px on
a discipline tab — down from ~2,550px. (Both include §3's two-row tab block,
~34px more than a single row would have cost.)

---

## 4a. Copy changes

Two of the four copy lines are rewritten (Beck, 2026-09-09). These are
content edits to `CARDS` in `app/page.tsx` and **apply at every width**, not
just below 640 — they are bundled here because they were decided here, not
because they are narrow-screen behaviour.

**`art`** — replacing *"Paintings made mostly after dark — moons, plants,
and the anatomy of feeling."*:

> Visual art made with a variety of media, but predominantly pixels and
> acrylic.

**`all work`** — new, see §5.

The replacement runs 77 characters against the old 76, so it sets the same
number of lines at every width and the desktop layout is untouched. (An
earlier draft carried a second sentence — *"Some watercolor, some
animation."* — which pushed the line to 110 characters and one row taller
than its neighbours; since the copy isn't clamped, that would have dropped
the art column's rungs ~22px and dragged the shared fade line down with it,
leaving writing and science less dissolved than the shipped build tuned
them to be. Cut 2026-09-09. Recorded because it is the trap any future copy
edit here walks into: **the discipline copy lines have to stay within a
line of each other**, and nothing in the code enforces it.)

---

## 5. The `all work` tab

**Three rungs: the first pick of each discipline, in `CARDS` order** —
`rabbit-in-the-moon`, `lost`, `transformation`. Derived from the existing
`CARDS` entries rather than hand-picked into a fourth list, so re-picking a
discipline's column updates this one and there is no fourth list to drift.
Taking index 0 is not arbitrary: those lists are already ordered
deliberately (art's comment in `app/page.tsx` explains why `lady-bird`
isn't rung 1, and science's explains its descent in strength), so index 0 is
each discipline's own lead.

Three rungs needs no change to `piece-column.tsx`: `PieceColumn` reads
`COLUMN[i]` for each rung, and a rung's `show` is only ever consumed by the
rung *below* it — the last rung's `show` is never read — so `COLUMN[0..2]`
composes a valid three-rung column with no new table. The shipped component
already documents itself as handling "2–4" pieces.

**But three rungs does not sit correctly under a mask tuned for four**, and
this has to be resolved before building. `.column-fade` holds opacity to
`66.67%` of the column's height and dissolves over the last third. Working
in percent-of-column-width units:

| | art (4 rungs) | `all` (3 rungs) |
| --- | --- | --- |
| column height | 197% | 149% |
| last rung's top edge | 123% — **62%** of the column | 118% — **79%** of the column |
| opacity where the last rung starts | **100%** (fade hasn't begun) | **~62%** |

Dropping a rung concentrates the column's height in the one that remains:
the last rung is 38% of the art column but 47% of the `all` column, so its
top edge crosses the fade line and **the third rung is never fully opaque
— it arrives already half-dissolved.** The shipped build's own tuning note
records checking exactly this ("all three columns' last rungs sit … before
the fade begins"), for four-rung columns only.

Three ways out, in order of preference:

1. **Loosen the `all` column's overlap.** `show` at ~0.8/0.8 instead of
   0.52/0.55 gives a 188% column whose last rung starts at 118% — above the
   125% fade line, so it starts opaque. Costs a new three-entry geometry
   table, and the `all` column reads as a looser stack than the discipline
   ones — arguably right, since it's a sampler rather than a run.
2. **Accept it.** A third rung that starts at ~62% and dissolves may read
   fine at the bottom of a section that is dissolving anyway. Free, and only
   a browser can settle it.
3. **A separate mask percentage for the `all` panel.** Rejected unless the
   other two fail: it forks `.column-fade`, and the globals.css comment
   explaining why there are exactly two fade rules is load-bearing.

**Decided: option 2, accept it** (Beck, 2026-09-09). The third rung arrives
at ~62% opacity and dissolves from there; no new geometry table, no fork of
`.column-fade`. If it reads as washed out rather than dissolving once it's
on a screen, option 1 is the fallback and option 3 stays rejected.

**The `all` panel has no CTA of its own.** Its copy line stands alone and
the section's bottom `see all work` — which is already pulled up into the
fade and already points at `/work` — serves as its CTA. Giving the panel its
own would put two identical links to `/work` about 200px apart. The
discipline tabs keep their CTAs, because theirs are filtered and the bottom
one is not, so there is a real escape to the unfiltered gallery from every
tab either way.

Copy line (Beck, 2026-09-09):

> Art, essays, and experiments, ranging from biology to puppetry.

The `all` panel wraps to `/work`, unfiltered.

---

## 6. One DOM, switched by CSS — and the trap this avoids

`MasonryGrid` establishes the site's existing answer to "render a different
layout per width": start at the widest layout so server and first client
render agree, then correct in an effect. That is the right call *there*,
because the column count is a number that can't be expressed in a class.
**It is the wrong call here**, because it would flash the 2,550px stack on
every phone load before collapsing it.

Instead: render the tab row and all four panels once, and let CSS decide
which regime is showing.

- **tab row** — shown below `sm`, `display: none` from `sm` up.
- **the three discipline panels** — below `sm`, shown only when selected;
  from `sm` up, always shown (today's stack, then today's row).
- **the `all` panel** — below `sm`, shown only when selected; from `sm` up,
  never shown.

Selection is client state defaulting to `all`, which is the same on the
server and on the first client render, so there is no mismatch to correct
and no flash. `app/page.tsx` is already `'use client'`.

The one thing this costs: the `all` panel's three rungs also exist inside
the discipline panels. That is invisible to assistive technology — every
rung is `aria-hidden` — and the `all` panel's only real element, its link,
is `display: none` at every width where a discipline panel's link is
exposed, so no duplicate link is ever reachable.

---

## 7. Semantics: toggle buttons, not the tabs pattern

Use four `<button>`s with `aria-pressed`, not `role="tablist"` /
`role="tab"` / `role="tabpanel"`.

The reason is §6's single DOM. Under the ARIA tabs pattern, the panels carry
`role="tabpanel"` and `aria-labelledby` pointing at their tabs — but from
`sm` up the tabs are `display: none` and therefore out of the accessibility
tree, leaving three tabpanels labelled by nothing, in a document with no
tablist. Attaching the roles conditionally means a JS media query, which
reintroduces exactly the hydration flash §6 exists to avoid.

Toggle buttons have no such coupling: they are natural tab stops below 640,
they vanish cleanly from the tab order when hidden, and the panels need no
role at all — they are just content. The loss is arrow-key navigation
between tabs, which the tabs pattern would give. For four adjacent controls
reachable directly by <kbd>Tab</kbd>, that is an acceptable trade and
arguably the more predictable one.

Each button gets an accessible name that stands alone out of context —
`show art`, not `art` — since the row is no longer adjacent to a heading
that supplies the noun.

---

## 8. Two things that follow from touch

**A hero word's hover latches the tab; its tap still navigates** (Beck,
2026-09-09). `CategoryWord` is already a `<Link>` to `/work?tags=…`, so the
tap half is current behaviour and does not change. The addition is that when
`HeroWordScatter`'s shared `hovered` category goes non-null, the selected
tab follows it.

**Only on the transition to non-null.** `CategoryWord` sets `hovered` back
to `null` on mouse-out, and a selection that followed that would snap the
panel back to `all work` the moment the pointer left the word — a flicker,
not a gesture. Selection latches: it changes on hover onto a word, and
thereafter only another hover or a tab press moves it.

Worth being honest about the scope: hover doesn't fire on a phone and the
tabs don't exist from `sm` up, so **the only place this gesture is ever
exercised is a narrowed desktop window.** It costs about two lines and makes
the two selection mechanisms consistent, which is why it's in — but nobody
should spend time on it if it turns out to be awkward.

**The rungs stay at rest rotation.** Nothing hovers, so
`.discipline-column-active` never fires and the column sits scattered — the
same state `prefers-reduced-motion` pins it to, and the state the shipped
CSS comment already argues is the honest one ("the column is layout, not a
motion effect"). Do not add a tap-to-square gesture; the panel is a link and
a tap should navigate.

Tab switching itself is an instant swap. If a crossfade is added later it is
opacity only, and disabled under `prefers-reduced-motion`.

---

## 9. The gallery's second column

`MasonryGrid`'s narrow default becomes **2**, not 1.

`useColumnCount` falls through to `1` when no query matches; `columnQueries`
covers `≥1024` and `≥640`. The fallback becomes the new base, and the grid
template classes — which exist so a pre-hydration render is still laid out
correctly — change with it.

**`MasonryColumns` needs a second field.** Today it is `{ lg: number }`, and
a single global base of 2 would be wrong for one caller:
`app/work/[slug]/page.tsx` passes `{ lg: 2 }` for `illustrated` collections
specifically because "verse needs more measure than a third of the page
gives it" — and half of a 375px phone is 157px, which is less measure than a
third of a desktop page, not more. So:

```
type MasonryColumns = { lg: number; base?: number }   // base defaults to 2
```

with the `illustrated` caller passing `{ lg: 2, base: 1 }`. The `useEffect`
dependency comment in `masonry-grid.tsx` is explicit that callers pass fresh
object literals every render, so the new field must join `columns.lg` in
that dependency array as a primitive, not as the object.

Non-`illustrated` collection detail pages get two columns along with the
main gallery. That is consistent and wanted — they are grids of images.

### 9.1. Collection stacks in a paired column — resolved

**Decided (Beck, 2026-09-09): the deck stays, in two columns.** This
reverses the earlier decision that collection stacks would render
single-column below 640 while everything else paired.

**The earlier "`MasonryGrid` can't express that" was about that decision,
not about the deck.** What the component cannot say is *"one child spans
both columns while its siblings pair"* — it deals children round-robin into
sibling flex columns, which is what makes the grid read left→right rather
than down-then-across, and no child of a flex column can span its siblings.
With the decision reversed there is nothing to express: a collection is a
card like any other, and the deck draws in whatever width the track gives
it. The blocker is gone, and no `col-span`, dense flow or narrow deck
variant is needed.

**What actually breaks is one number.** `CARD4_STRIP_PX = 40` is the only
absolute length in an otherwise fully proportional deck — it exists because
`CollectionMark` is fixed-size text (`px-2.5 py-1 text-xs`, an 8 + 24 + 8
strip). Cards 2 and 3 are percentages of the column width, so as the card
narrows they shrink past the fixed one and the taper **inverts**:

| column | card 2 | card 3 | card 4 |
| --- | --- | --- | --- |
| 350px | 98px | 61px | 40px |
| 158px (375 viewport) | 44px | **28px** | 40px |
| 128px (315 viewport) | 36px | **22px** | **40px** |

Card 4 passes card 3 below a 229px column and card 2 as well below 143px —
both inside the paired phone range, which is why it reads as compacted
rather than merely small (§10.6 has the full measurement).

**Fix (Beck, 2026-09-09): two geometries, split at `sm`.** Desktop keeps
today's deck and today's mark exactly — the ~0.63 decay, the 98/61/40 taper
at a 350px column, and the word `pieces`. Only below 640 does anything
change. The count stays on card 4 at every width; the badge never goes over
artwork.

**The trap, first: inline styles beat media queries.** `deckVars()` writes
`--y`/`--r`/`--hy`/`--hr` inline and `deckReserve()` writes `padding-bottom`
inline, so a `@media (max-width: 639px) { .deck-card { --y: … } }` block in
globals.css does nothing at all — the inline declaration wins regardless of
the query. Emit **both** values inline under different names and let the
stylesheet choose:

```
style={{ '--y-narrow': …, '--y-wide': …, '--hy-narrow': …, '--hy-wide': … }}

.deck-card { margin-bottom: var(--y-narrow); }
@media (min-width: 640px) { .deck-card { margin-bottom: var(--y-wide); } }
```

The container's reserve needs the same treatment and a class of its own,
since it is a bare inline `paddingBottom` today. Tilts don't differ between
the two geometries, so `--r`/`--hr` stay single-valued.

**The narrow table.** Cards 2's offsets and every tilt are unchanged; card 3
widens and card 4's strip shrinks with the mark:

| card | wide (`sm`+, today) | narrow (< 640) |
| --- | --- | --- |
| 2 | `y: 28` | `y: 28` |
| 3 | `y: 45.5` (strip 17.5%) | **`y: 50`** (strip 22%) |
| 4 | `y: 45.5 + 40px` | **`y: 50 + 26px`** |

`hy` stays derived, not chosen — whatever keeps `y + dip(r)` equal across
rest and hover so the tile's bottom edge doesn't move when the deck
flattens. For narrow card 3 that is `50 + dip(2.5) − dip(1) = 51.31`; card
4 follows the same rule it already does.

Resulting taper, descending at every real width:

| column | card 2 | card 3 | card 4 |
| --- | --- | --- | --- |
| 350px (wide geometry) | 98px | 61px | 40px |
| 158px (375 viewport) | 44px | 35px | 26px |
| 130px (320 viewport) | 36px | 29px | 26px |

The inversion threshold moves from a 229px column to **118px** — a 296px
viewport, below every device in use.

**The mark, responsive.** Below `sm` it drops the word and most of its size;
at `sm`+ it is exactly what ships today.

| | wide (`sm`+) | narrow |
| --- | --- | --- |
| text | `text-xs` | `text-[10px]` |
| padding | `px-2.5 py-1` | `px-2 py-0.5` |
| gap / icon | `gap-1.5` / `h-3.5` | `gap-1` / `h-3` |
| label | `30 pieces` | `30` |
| measured | ~105 × 24px | ~44 × 18px |

Two details that decide whether the arithmetic holds:

- **Set the narrow line-height explicitly** (`text-[10px]/[0.875rem]` or
  `leading-[14px]`). An arbitrary Tailwind font size sets only `font-size`
  and inherits `line-height`, and the pill's height — `max(icon, line box)`
  + padding — is what `CARD4_STRIP_PX` is measured from. Inherit a 1.5
  line-height and the 18px pill becomes 19px and the strip is wrong.
- **Hide the word with `sr-only sm:not-sr-only`, not `hidden sm:inline`.**
  `hidden` drops it from the accessibility tree, leaving a bare "30" beside
  an `aria-hidden` icon. The count needs its noun in the accessible name at
  every width.

**`CARD4_STRIP_PX` becomes two constants**, and its doc comment already
warns that changing the mark's padding, text size or inset changes this
number with nothing recomputing it. That comment now governs two values
instead of one, and both are derived from the table above: 8 + 24 + 8 wide,
4 + 18 + 4 narrow.

**What this costs.** Two geometries to keep in sync instead of one, against
the deck's original design of a single table resolving against the column
width. That is the price of leaving desktop untouched, and it was taken
deliberately (Beck, 2026-09-09) over the two alternatives below.

**Rejected: one table, card 3 widened to 22% everywhere.** Simpler, but it
changes the cards 2→3 decay from ~0.63 to ~0.79 at every width, growing
card 3's strip from 61px to 77px at a desktop column — a visible change to
every collection card in service of a phone-only problem.

**Rejected: move the count to the cover** (Beck, 2026-09-09). It would have
made the deck fully proportional by removing the only absolute length, but
it puts a badge over artwork. Recorded so a future reader knows the
proportional option was available and declined, not overlooked.

### 9.2. The two-column grid overflowed the page — fixed

**Resolved 2026-09-09.** At 315px the whole site rendered at ~70% scale
with dead background down the right-hand side, the full-width sticky nav
included. It was never an inset: the document was wider than the viewport
and the browser was shrinking the whole page to fit, with `<html>`'s
`bg-background` painting the leftover strip — which it does across the full
viewport regardless of how wide the root box is. The viewport meta was
correct (`width=device-width, initial-scale=1`, verified in the served
HTML), so this was real overflow.

**Cause: grid and flex items default to `min-width: auto`.** Neither a grid
track nor a flex row shrinks below its content's min-content width, and
min-content is set by the longest unbreakable run. `.font-brand` is
Recursive **Mono**, so every label is wider per character than it looks. §9
introduced it: at one column the grid was never asked to fit two
min-contents side by side.

**Fix, applied — and it needed both halves:**

1. `min-w-0` on `MasonryGrid`'s column wrappers, which is what actually lets
   a grid track go below min-content.
2. `min-w-0` + `break-words` on the card title spans. Without this, step 1
   converts a page-wide overflow into a word spilling out of every card —
   the same bug relocated.

`CollectionTile`'s `<h2>` already carried `break-words` inside an
`<a class="min-w-0">` before any of this; the pattern existed in the
codebase, just not everywhere.

**What remains is a floor at ~290px**, and it is `SiteNav` — measured, not
inferred. At a 239px client width the elements crossing the edge are led by
the nav's right-hand group and the theme toggle, both ending at exactly
290px, which is the `scrollWidth`:

| | measured |
| --- | --- |
| `work` pill | 65px |
| `gap-1` | 4px |
| `about` pill | 73px |
| **`<ul>`** | **142px** |
| `gap-2` + `ThemeToggle` | 8 + 36px |
| **right-hand group** | **186px** |

Plus the brand link (32px mark + `gap-2.5` + `qing`, the longest word it can
break to) and the page's `px-5`. None of that is reducible by `min-w-0` —
it is the nav's honest minimum, and shrinking it means redesigning the nav.
The narrowest viewport in real use is 320px, so **this is below every actual
device and should be left alone.** Record it, don't chase it. Verified at
320px on `/`: `innerWidth`, `clientWidth` and `scrollWidth` all read 320.
§13's `flex-wrap` lowers the floor further, to ~240px, as a side effect.

**One thing the overflow snippet reports that is not a bug.** At 320px on
`/` it lists three `position: absolute` SVGs with right edges of 324–331 —
`IconScatterField`'s scattered hero icons. The hero section is
`relative overflow-hidden`, so they are clipped and never reach
`scrollWidth`, which is why it still reads 320. Decorative overflow inside a
clipping ancestor is expected here; the assertion to trust is
`scrollWidth === clientWidth`, not the element list.

Two things in that measurement worth not misreading. The
`fixed inset-0 z-[999]` overlay reported at 290px wide is
`ThemeTransitionProvider`'s — it is sized *to* the layout viewport, so it is
a consequence of the overflow, not a cause. And the 260px-wide
`flex items-center gap-1.5` is the gallery's sort/mode control row, which
wants more than a 239px viewport gives it but stays under the nav's 290 —
the runner-up, not the binding constraint.

**Recursive Mono's advance is ~0.6em — confirmed.** The `about` pill
measures 73px; less its `px-4`, that is 41px for five characters = 8.2px at
`text-sm`, which with `.font-brand`'s own `-0.01em` letter-spacing is
**0.596em**. An earlier revision of this section inferred "nearer 0.5em"
from the 290px floor and was wrong — the inference assumed the floor was all
text, when 182px of it is fixed chrome. §12.1's table was computed at 0.6em
and needs no change; verify item 10 is discharged by this measurement rather
than still outstanding.

**`sizes` must move with it.** `work-visuals.tsx:163` claims
`(max-width: 640px) 100vw, …`; a card is now half the viewport below 640,
so that becomes `50vw` or every phone downloads four times the pixels it
shows. This is the one change that is a straightforward bug the moment the
column count lands, rather than a judgement call.

---

## 10. What to verify, and the one thing likely to break

Measured in a real browser at **320px and 375px**, not derived:

1. §3's second row — `art` / `writing` / `science` with icons — fits 320px
   without wrapping. This is a knife-edge (~272px estimated against 280px
   available) and is the single most likely thing in this spec to be wrong
   on first render. Fallbacks in order: `px-2`, then `text-[11px]`.
2. Tap targets on the tab row clear 44px including padding.
3. The `all` panel's third rung — which §5 accepts as starting at ~62%
   opacity — reads as *dissolving*, not as *washed out*. This is the one
   accepted-on-paper compromise in the spec; if it looks wrong, §5's option
   1 (a looser three-entry geometry table) is the agreed fallback.
4. Switching tabs moves the bottom CTA and nothing else; no horizontal
   overflow at any tab at 320px.
5. Reduced motion: rungs scattered, tab switch instant, section still
   legible.
6. **A collection deck in a paired column tapers the right way** — cards
   2, 3 and any deeper card in descending order, at 320, 375 and 639. The
   measurement that forced §9.1's fix, kept because it is what regression
   here would look like: with card 4 present the taper inverts, since its
   strip is a fixed 40px while cards 2 and 3 are percentages of the column
   width. At `px-5` + `gap-5` a column is `(vw − 60) / 2`:

   | viewport | column | card 2 | card 3 | card 4 |
   | --- | --- | --- | --- | --- |
   | 1024 (3-up) | 315px | 88px | 55px | 40px |
   | 639 | 290px | 81px | 51px | 40px |
   | 375 | 158px | 44px | **28px** | 40px |
   | 315 | 128px | 36px | **22px** | **40px** |

   Card 4 passed card 3 below a **229px column** (viewport ~517px) and card
   2 as well below a **143px column** (viewport ~346px) — both inside the
   paired phone range. §9.1's fix shrinks the strip to 26px and widens card
   3 to 22% **below `sm` only**, moving the threshold to a **118px column**
   (~296px viewport). So the checks are: the taper descends at 320 and 375,
   the mark still reads at `text-[10px]`, and — because §9.1 now maintains
   two geometries — **the desktop deck is byte-for-byte unchanged**, 98/61/40
   at a 350px column with the word `pieces` intact. A regression there is as
   much a failure as an inverted taper on a phone.

   Second half of the same effect, and the other thing to watch: the narrow
   reserve is `51.31% + 26px`, ~70% of a square cover at a 130px column
   against desktop's ~57%. It cannot be made constant while the strip
   carries a fixed-size badge — that was the trade taken when the count
   stayed on card 4. If the deck still reads as compacted, this ratio, not
   the strip order, is where to look.

   Verify against `inktober-17` (30 pieces) and `hthtpw` (5), the two in
   Beck's 2026-09-09 screenshot.
7. Gallery card titles, `TagPill`s and medium labels at a 130px card — wrap
   is fine, overflow is not.
8. `tsc --noEmit` and `next build` clean; page count unchanged.
9. **`document.documentElement.scrollWidth === window.innerWidth`** at 320,
   375 and 500 — on `/work` *and* `/`. §9.2 is the gallery's version of
   this; §12.2's overhang is the home page's, and both fail the same way
   (the whole document shrinks to fit) rather than by showing a scrollbar.
10. ~~Measure Recursive Mono's advance at `MONO: 1`.~~ **Done** — ~0.596em,
   from the nav's `about` pill at a 239px viewport (§9.2). §12.1's table was
   computed at 0.6em and holds.
11. At 500px: the three discipline copy blocks still set within a line of
   each other (§4a), and `science`'s badge doesn't wrap. This is what
   decides whether 500 is the right number or whether it has to rise.

---

## 11. Out of scope

- `lg`'s column count in the gallery. Three at 1024px+ stays.
- `COLUMN`'s `w` and `show` columns. §12.2 retables `x` only; `w` is the
  entry that rescales every column's height and drags §5's fade tuning with
  it, and nothing here has established what it should become.
- The `TEXT_RUNG_ASPECT = 1` square. §12.1 spends the vertical room it
  already leaves unused; it doesn't re-derive the aspect itself.

Two items were removed from this list on 2026-09-09, and are recorded here
so the reversal is visible rather than silent:

- *"The 640–767 band keeps today's stack."* Void — §2 deletes that band.
- *"Any change to `piece-column.tsx`."* Void — §12 changes both the rung
  type scale and `COLUMN`'s `x` entries, which live there.

---

## 12. Rung geometry and type at narrow widths

**Revised 2026-09-09 (Beck):** the excerpt type should get smaller so more
of it survives at small sizes, and the rungs should sit closer to their
neighbours — up to and including overhanging their own column — while the
spacing between the *header copy* blocks stays as it is.

### 12.1. The excerpt is monospaced, which is the number everything turns on

`.font-brand-italic` sets `font-variation-settings: 'MONO' 1` — the text
rung is **Recursive Mono**, advance ≈0.6em. Every figure below scales
linearly with that, and it is estimated, not measured: **measure it first.**

A rung's text width is `w × column − px-4`. At today's `w: 74` and
`text-base`:

| viewport | column | rung | text box | chars/line |
| --- | --- | --- | --- | --- |
| 1280 | 389px | 288px | 256px | ~27 |
| 768 | 219px | 162px | 130px | ~14 |
| 500 | 137px | 101px | 70px | **~7** |

Seven characters is not an excerpt, it is a word. But the table also says
something about the current build: `lost`'s preview is 66 characters, and
two lines at 27 chars/line is 54 — **the desktop rung is already clipping
it.** `PieceRung`'s comment claims "the excerpt provably can't exceed
[two lines], which is what makes a fixed aspect safe here" — that claim is
false at a mono 0.6em advance, and the comment should be corrected whichever
way the measurement goes.

**There is room to spend.** `TEXT_RUNG_ASPECT = 1` exists to hold the
writing column's *height* near the art column's (§5's shared fade), not
because type needs a square. At a 288px desktop rung that box is 232px tall
inside its padding and two lines of `text-base` use 52px of it. The rung is
~78% empty. So the fix is not only smaller type — it is smaller type **and
a taller clamp**, which costs nothing the layout was using.

At `text-xs` (12px → ~7.2px/char) with `px-2` instead of `px-4`:

| viewport | text box | chars/line | 4 lines |
| --- | --- | --- | --- |
| 500 | ~86px | ~12 | ~48 chars |
| 500, with §12.2's overhang | ~127px | ~18 | **~70 chars** |

Four lines fit vertically: a 143px square rung has ~87px inside its `py-3`
and the quote glyph, and `text-xs` at `leading-relaxed` sets 19.5px lines.
So `line-clamp-2 xs:line-clamp-3 md:line-clamp-2` and a responsive size are
enough to carry the whole of `lost` at 500px — but only in combination.
Neither lever alone gets there; that is the finding.

### 12.2. `x` is free, `w` is not

`overlapAbove()` derives every rung's tuck from `prevRung.w` and the
piece's aspect. **`x` does not appear in it**, and appears nowhere else that
affects height — it is a bare `margin-left`. So:

- Changing **`x`** costs nothing. No column-height change, no §5 fade
  retuning, no shared-fade drift.
- Changing **`w`** rescales every column's height proportionally. Art is
  197% of its column width at `w ≈ 74`; at `w ≈ 104` it becomes ~277%,
  which at a 389px desktop column is a 1,077px column against today's 766px.

**The marooned-card problem is an `x` problem.** Today `x` spans 2–14 and
`w` 70–76, so `x + w` never exceeds 90 — every rung hugs the left of its
column and the right 10–26% is always empty. The gutter the eye actually
sees between two neighbouring rungs is therefore
`(100 − x − w)% + gap-6 + x%` — at a desktop column, ~18px + 24px + 9px ≈
**51px**, against the 24px the header copy blocks get. That asymmetry is
exactly what Beck is describing, and **shrinking `gap` is the wrong fix**:
the gap is what sets the text spacing that is already right.

Widen the `x` range instead so rungs alternately reach the left and right
edges of their column, and cross them:

```
x: −4 … 26   (from 2 … 14),  w unchanged
```

**The `x + w ≤ 90` invariant can go.** It reserved 10% of the column for
rotation jitter; the real figure is smaller. A rung rotated 3° widens by
`h × sin(3°)` — about 5% of its own width, so ~4% of the column at
`w: 74`. Ten percent was ~2.5× the need.

**Overhang is bounded by the page's own padding, not by the column.**
Nothing clips: `.column-fade` and `.columns-fade-shared` are `mask-image`,
which doesn't clip horizontally, and no ancestor sets `overflow`. So the
outer columns' overhang has to stay inside `px-5` (20px) at base and `px-8`
(32px) at `sm`+, or it becomes §9.2's bug on the home page. At 8% of a
389px desktop column that is 31px against 32px available — a knife-edge, so
cap the overhang nearer 4–6%.

**Two consequences worth stating before they surprise someone.** Rungs from
adjacent columns can now come within a few pixels of each other, so (a)
paint order across columns becomes visible — sibling flex items paint in
order, so `science` overlaps `writing` overlaps `art`, an arbitrary but
consistent bias; and (b) an overhanging rung belongs to its own column's
`<Link>`, so hovering the part of it that visually sits over the neighbour
squares up the *other* column than the one under the pointer. Neither is
fatal. Both are the price of the look.

---

## 13. The nav at very small sizes

**Beck, 2026-09-09.** Two changes, both firing at the same widths.

**Where the nav breaks.** Measured from the 239px reading in §9.2, the nav's
comfortable one-line width is:

| | |
| --- | --- |
| brand mark + `gap-2.5` + `beck qing` on one line | ~133px |
| `work` + `gap-1` + `about` | 146px |
| `gap-2` + `ThemeToggle` | 44px |
| `px-5` | 40px |
| **one-line nav** | **~363px** |

That number sits between the common Android 360 and the iPhone 375, so the
wrapped state is a real device state rather than a synthetic one. Below it,
the flex row shrinks both children proportionally — so the brand wraps to
two lines and the pill row runs out of space **together**, which is why
these two changes belong in one edit.

**1. `leading-none` on the brand.** The wrapped `beck / qing` sets at the
default 1.5 today, which reads as two separate words rather than a stacked
lockup. This is safe at every width: the nav's height is set by the 36px
toggle, and the brand's line box is 27px at 1.5 and 18px at 1.0 — under it
either way, so nothing above 363px moves.

**2. `flex-wrap` on the `<ul>`, not a breakpoint.** `work` and `about`
stack when they don't fit and sit side by side when they do, with no width
to guess and nothing to keep in sync with `--breakpoint-xs`. Give it
`gap-y-2` for the space Beck asked for between them when stacked; the
existing `items-center` on the nav row already centres the stacked pair
against the toggle.

**Side effect, in the right direction.** A wrapping flex container's
min-content is its widest *item*, not its whole row, so the `<ul>` floor
falls from 146px to 73px and the nav's own min-content goes from ~310px to
**~240px**. §9.2's residual nav floor drops well clear of every real device.
It is a margin-of-safety improvement, not a bug fix: §9.2 confirms the page
already fits at 320px.
