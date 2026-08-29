# TODO

Open work only. Design decisions, structure, and the record of what's already
built live in [ARCHITECTURE.md](ARCHITECTURE.md).

Last reconciled against the tree 2026-08-29; the 2026-08-28 pass's build state
still holds (`tsc --noEmit` clean; `next build` clean, 204 static pages).

Almost everything from the previous pass is closed. §1 and §2 were always
blocked on Beck rather than on code; §4–§6 are small items that were dropped
from this file during the implementation pass without actually being done, and
are restored here rather than lost.

**2026-08-28: §9, §10, and §12 shipped**, built from the spec now at
[history/2026-08-essays-viewer-sort.md](history/2026-08-essays-viewer-sort.md)
— see that file for where the build diverged.

**2026-08-29**, with Beck: §7 is now active work rather than a backlog item,
§9's booth/setup gap turns out to be partly fillable, and §11 is unblocked and
specified — it was deferred, and is not any more.

---

## 1. The home page's science panel still shows fabricated content — **blocked on Beck**

`app/page.tsx`'s art and writing discipline panels now point at real
`lib/work.ts` content (`rabbit-in-the-moon`, and the poem `lost` from
`love-worth-heartbreak`). The science panel still promotes `lib/content.ts`'s
invented `PROJECTS` — a talk titled "Designing Color-Blind-Friendly Data
Visualizations" with a made-up "Contrast passing AA: 100%" stat — because
there is no real science work in `lib/work.ts` to promote in its place. Same
root cause as §2.

- [ ] **Beck:** the science panel's real content — a project, a stat, or a
      different framing entirely.
- [ ] Once that lands, delete `lib/content.ts` entirely (it's down to just
      `PROJECTS` now — `ARTWORKS`, `POEMS`, and `ESSAYS` were fabricated
      scaffold content and are gone, along with the orphaned PNGs they
      referenced).

## 2. `science` is a discipline with zero work in it — **content, not design**

The hero copy's `science` word and the homepage's third discipline panel both
go to `/work?tags=science` (the footer's copy of this link was removed
2026-08-28, when the footer was simplified to three icon links and a
disclosure), and no item anywhere in `lib/work.ts` carries the `science` tag —
the gallery renders its empty state. Ten tags in the filter vocabulary have
zero matching items today (`science`, `oil`, all four `field` tags, and four
of the six `theme` tags).

**Decided (2026-08-27): Beck fills it.** Science is core to Beck's identity;
the work just hasn't been uploaded yet. The vocabulary stays exactly as it
is — don't prune the dead tags, don't hide zero-count chips, don't re-frame
the homepage's three-discipline structure around a temporarily
two-discipline dataset. See "Content model" in ARCHITECTURE.md.

- [ ] **Beck:** add science work to `lib/work.ts`. That closes this, and it's
      the same blocker as §1.

## 3. No lint or test setup

`filterWork`, `collectionLayout`, and `getCollectionPiece` are pure and would
be cheap to pin down. Low priority for a personal site; worth it the moment
the tag vocabulary in §2 changes.

## 4. Media loose ends

- [ ] `PieceView` in `app/work/[slug]/page.tsx` returns early for a
      text-forward standalone piece without ever calling `PieceMedia`, so a
      poem that carried an animation or speedpaint would render no media at
      all. No such piece exists today. Recorded so it isn't rediscovered as a
      mystery — the fix is to call `PieceMedia` in that branch too, not to
      special-case it later.
- [ ] The two near-identical Presidential Pardon sources (reel 39.12s vs.
      carousel-embedded 39.00s) were never diffed. The reel is what shipped.

## 5. Small correctness gaps

- [ ] **`formFor` still falls back to `'essay'` for anything without a
      writing-form tag.** Centralising the old hardcoded
      `isPoem ? 'poem' : 'essay'` into `lib/work.ts` was the right move and it
      now honours `blog` — but the edge case that motivated the item survives:
      the first top-level hybrid *art* piece carrying `text` would be labelled
      "essay" by `HybridCard`. Unreachable today (zero top-level hybrids), so
      it lands the moment `HybridCard` becomes reachable.
- [ ] **`app/page.tsx:92`'s `|| '/placeholder.svg'` fallback is now a trap.**
      With image optimization enabled, SVG through `next/image` returns 400
      unless `dangerouslyAllowSVG` is set. Dead today — the featured piece
      always has a real image — but it would fail loudly rather than fall
      back. Drop the fallback, or point it at a raster.
- [ ] `AboutTabs` switched to `useLayoutEffect` to kill the `/about#food` tab
      flash, which is correct — but `useLayoutEffect` can emit a React SSR
      warning in a prerendered client component. The build was silent; worth
      one dev-console check to confirm it's clean at runtime too.

## 6. Leftover asset

- [ ] `public/placeholder.jpg` is referenced by nothing. (`placeholder.svg`
      survives only as the dead fallback in §5 — if that goes, it can go too.)

## 7. About tab glyphs want to become small illustrations — **in progress: Beck is drawing the set**

`TabGlyph` (`components/tab-glyph.tsx`) currently places one or two doodles in
disjoint sub-regions of a 32×32 badge, all in a single `currentColor` accent.
Beck wants them **larger, in several colours, with the outlines overlapping** —
closer to a small illustration or profile icon than an icon.

**Beck is actively drawing this as an illustration set** (2026-08-29) — not a
backlog item waiting on a decision. The visual authoring is Beck's: which
doodles pair, their placement, rotation, and per-doodle colour. Nothing should
be mocked up here; the code side's job is to be ready to render whatever the
set turns out to be.

Mechanism findings from 2026-08-28, so the drawing work isn't blocked on
rediscovering them:

- [ ] **A body fill is nearly free.** The doodles are hand-inked *outlines with
      transparent interiors*, so overlapping them as-is reads as crossed wires —
      nothing occludes anything. But for roughly 70% of the 50 icons the
      **first subpath in the path data is the outer contour**: fill that
      subpath as the body, draw the whole path over it as ink, and the doodle
      becomes an opaque coloured shape that occludes what's behind it. Verified
      on apple, cupcake, beaker, envelope, laptop, flask, uke, globe,
      paint_tube. It does *not* work on crane, whisk, wheat, dna,
      angle_brackets, or flat_brush — their first subpath is an interior flap
      or a handle, so those need a hand-added body path or stay ink-only.
- [ ] **Ink must be a token, not a literal.** `#080b24` is light mode's
      `--foreground` *and* dark mode's `--background` — hardcode it and the
      illustrations disappear in dark mode. Use `var(--foreground)`; coloured
      bodies can stay fixed across themes.
- [ ] A background-coloured halo stroke (`paint-order: stroke`) was tried for
      extra separation between overlapping doodles. **It's worse** — the upper
      doodle's halo covers the lower one's fill and the colour is lost. Filled
      bodies, no halo.
- [ ] Unrelated but adjacent: the key `"whisk "` in `data/icons-raw.json` has a
      trailing space. `lib/brand-icons.ts` already `.trim()`s it so nothing is
      broken — worth cleaning if that file is being edited anyway.

Separable and not blocked on any of the above: the badge's swap easing is
`cubic-bezier(0.22, 1, 0.36, 1)` — ease-out expo, **zero overshoot**. A
back-out curve would give the bounce Beck asked for, as a one-line change.

## 8. Gallery filter changes snap rather than animate — **blocked on a MasonryGrid rewrite**

Filtering `/work` re-renders the grid instantly. A sliding (FLIP) transition
was investigated 2026-08-28 and **is not a small change**, for a structural
reason worth recording:

`MasonryGrid` deals children round-robin into **separate flex-column `<div>`s**
(`cols[i % columnCount].push(child)`). When the filter changes, a card's index
changes and it moves to a *different column* — a different DOM parent. React
can't reparent, so it unmounts the node and mounts a fresh one; stable
`key={item.slug}` doesn't help. FLIP's premise is "same node, measure before
and after," so it cannot work against this layout. Worse, cards that happen to
stay in their own column *would* animate while the rest pop — non-uniform, and
more jarring than a clean snap.

- [ ] Any real fix starts by restructuring `MasonryGrid` — most likely one flat
      relatively-positioned container with cards placed by measured
      `transform: translate(x, y)`, so nothing ever reparents. That needs a
      `ResizeObserver` per card (heights vary, images load async) and an
      explicit container height, and it weakens the file's current
      pre-hydration story, where the responsive grid template lays out
      correctly with no JS.
- [ ] Alternative considered: per-card `view-transition-name`, which survives
      reparenting and would leave `MasonryGrid` alone. The site already uses
      the View Transitions API for the theme toggle. Parked because filter
      state lives in the URL via `router.replace` inside `useTransition`, and
      capturing the correct "after" state through React 19's async transitions
      is fiddly — plus an open question about colliding with the existing
      root-level `::view-transition-*` rules and their 600ms duration.

**Deliberately deferred 2026-08-28** — not worth resolving now.

## 9. The three essays were flattened on import — **shipped 2026-08-28**

Restored as MDX from the archive Markdown (`content/essays/*.mdx`), rendered
through `components/essay.tsx`. `scripts/check-essay-fidelity.mjs` confirms
all three match the archive prose word for word. See
[history/2026-08-essays-viewer-sort.md](history/2026-08-essays-viewer-sort.md)
for the full build record and where it diverged from the spec.

- [ ] **Beck:** source the booth/setup images for `first-art-fair`. Confirmed
      2026-08-29: **the set was partially documented on Instagram** — so some
      of the omitted slots can be filled, but not all of them, and which ones
      survive has to be established by going through the account. Beck also has
      **schematics for the booth setup** to add, which the archive never had at
      all. Slots currently shipping omitted (no asset ever existed in the
      archive): `[ when a woman ]`, `[ photos of setup sketch and practice ]`,
      `[ photos of actual setup ]`, `[ photos of my sketched setup ]`,
      `[ photos of my setup ]`, and `[ flyer contest ]`. `mother earth` and
      `fire protection` needed no new upload — they're cross-linked to
      `hthtpw/01-mama-earth` and `april-colors-19/10-fire-protection`, which
      were already in the tree.
- [ ] Open question once the assets exist: the schematics are a *new* kind of
      content for this essay — decide whether they render inline as more of the
      same image slots, or get their own treatment. Don't design that before
      seeing them.
- [ ] **`inktober-17` is a fourth import worth re-checking**, not covered by
      this workstream. The archive's `projects/inktober-2017.md` carries
      per-image alt text via `{% galleryImage %}` (Swift, Divided, Poison, …)
      and a `<small>` "(Last updated 20 January 2023.)" line, not yet audited
      against `lib/work.ts`.

## 10. Single-piece view and the lightbox look like the same thing — **shipped 2026-08-28**

The lightbox is now genuinely immersive (opaque `--background` backdrop,
image up to `92vh`/`92vw`, no border/rounding, chrome that idle-fades after
2.5s) and scrolling down inside it flies the image back to its in-page rect
via a plain FLIP animation, closing the dialog once the flight finishes. All
in `components/image-lightbox.tsx`. See
[history/2026-08-essays-viewer-sort.md](history/2026-08-essays-viewer-sort.md)
for the full build record.

## 11. Three WIP screenshots are shipping as standalone finished pieces — **decided 2026-08-29, ready to build**

Three files in `public/art/portfolio-22/` are in-progress captures — app chrome,
tool palettes, layer panels, reference photos in frame — but ship as finished
standalone pieces in the gallery. All three confirmed by opening the files
2026-08-28; the sweep across all 24 standalone images is done, so this list is
complete.

**Decided: a WIP is not a collection and not a `WorkPiece`.** It is
documentation tied to one particular art piece. It gets no slug, no page, no
tags, and never enters the gallery, the tag vocabulary, or search. The earlier
idea of pairing a WIP with its finished piece as a two-item `WorkCollection` is
dropped — it promotes a footnote into co-equal work and moves the finished
piece's URL for no gain.

That leaves two genuinely different cases.

### Case 1 — the WIP has a finished parent

- [ ] Add `process?: ProcessStill[]` to `WorkPiece`, where a still is
      `{ src: string; caption?: string; alt?: string }`. Minimal on purpose —
      enough to be documentation, not enough to grow back into a piece.
- [ ] `hand-study` is the WIP for `desire-and-distance`.
      `public/art/portfolio-22/hand-study.webp` is a screenshot of the drawing
      app with the tool palette and layer panel still in frame; the hand in it is
      the same hand, same pose, as the finished `desire-and-distance.webp`.
      Beck's name for it is "the anatomy of a hand".
- [ ] `waterfowl-and-motherhood` is the WIP for `child-not-adult`. Same story:
      app chrome, layer panel, and two mallard reference photos around an
      in-progress duck that is the finished duck at the right of
      `child-not-adult.webp`.
- [ ] Both stop being top-level `WORK` entries when they move.

**Placement: its own labeled `process` section after the writeup**, stills
opening in the existing lightbox — not inline in `PieceMedia`. The reason is
worth keeping: `PieceMedia`'s existing label stack ("finished animation" /
"speedpaint") disambiguates two media that are both *of the finished work*. A
WIP screenshot is a different register, and directly under the finished image it
invites being read as another artwork. Below the words, under its own heading, it
reads as "here's how this got made".

- [ ] Note that `PieceView` currently returns early for text-forward pieces
      without calling `PieceMedia` (§4) — whatever renders the process section
      should not inherit that gap.

#### Captions are real content, not labels

Decided 2026-08-29: **a process still can carry its own caption**, and the
caption is authored content — the note about what stage this is and what
changed after it — not a one-line alt-text stand-in.

- [ ] `caption` is a plain string on the same terms as `writeup`: paragraphs
      split on `\n\n`, rendered through `Prose`. That's the point of choosing
      this rung of the ladder — a caption can start as four words and grow to
      two paragraphs with no schema change and no MDX pipeline. If a process
      story ever outgrows that, the signal is that it belongs in the piece's
      `writeup` or its own essay, **not** that `process` should learn MDX.
- [ ] `alt` is separate from `caption` and stays separate. A caption is
      commentary shown to everyone; alt text describes the image to someone who
      can't see it. They are frequently not the same sentence, and collapsing
      them is the usual way image a11y quietly regresses.
- [ ] Layout follows from captions being prose: the process section is a
      stack of `<figure>`s (image + `<figcaption>`), not a bare thumbnail
      grid. `FigureRow` in `components/essay.tsx` is the existing precedent for
      the markup; the stills still open in the lightbox.
- [ ] **Where the caption text comes from is Beck's call, and it is Beck's
      words** — not generated description of what's visible in the screenshot.
      Two already exist and must not be paraphrased away in the demotion:
      `hand-study` carries "Studying hands, hearts, and progress." and
      `waterfowl-and-motherhood` carries "Apparently I'm on a bird kick." If the
      original Instagram captions for these captures still exist, those are the
      better source; the demoted copy is the floor, not the target.

**Open — Beck:** whether the process section also gets one shared intro note
above the stills, separate from the per-still captions. `FigureRow` already has
that shape (one caption for a row) and `PieceLink` has the per-item shape, so
either is cheap. Not built until a piece actually needs it.

### Case 2 — the WIP has no finished piece yet

`security-camera` is a WIP for a piece **Beck hasn't finished** (confirmed
2026-08-29). It has no parent to attach to, so case 1 cannot hold it.
`why-be-afraid` is a *separate, finished* piece that happens to share the
surveillance/halftone subject — related by theme, **not** its parent. Do not
attach them.

**Decided: keep it visible, marked as in-progress.** Not parked, not hidden —
flagged honestly. Its existing description already reads that way: "Finally
getting around to this project that's been on my to do list for maybe a year
now."

- [ ] Add a way to mark a `WorkPiece` as unfinished, and surface it in the
      gallery and on the piece page. This is a recurring case, not a
      one-off — it's the "still making this" state, and it should be worth
      shipping work in.
- [ ] The two cases must compose: when the finished security-camera piece
      lands, its WIP should migrate from case 2 to case 1 — the piece drops the
      in-progress flag and the still becomes a `process` entry on it. Keeping
      the `process` shape minimal is what makes that a one-line move instead of
      data surgery.

## 12. The gallery has no sort at all — **shipped 2026-08-28**

`sortWork(items, mode)` in `lib/work.ts` (`curated | newest | oldest`,
`curated` the identity default) and a cycle control beside the venn toggle,
with `?sort=` in the URL on the same terms as `?mode=`. See
[history/2026-08-essays-viewer-sort.md](history/2026-08-essays-viewer-sort.md)
for the full build record.

- [ ] **Beck:** if "recently added" is wanted, that needs an `added` date
      backfilled onto items. The field is documented on `WorkPiece`; no item
      carries one, so the mode shouldn't appear until some do.
