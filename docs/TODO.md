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

**2026-08-29, later:** the `science` gap behind §1 and §2 now has a decided
shape — **coding explorations**, live runnable sketches filed under
`science` with a new piece-page layout. Fully specced in
[specs/2026-08-coding-explorations.md](specs/2026-08-coding-explorations.md);
both sections stay open until the first exploration is actually in
`lib/work.ts`, since the spec is design, not content.

**2026-08-29, later still: §4, §5, §6, §11, and the inktober-17 half of §9
shipped** — `tsc --noEmit` clean, `next build` clean, 202 static pages (down
from 204: `hand-study` and `waterfowl-and-motherhood` no longer get their own
route). §7's bounce easing turned out to already be shipped (found while
touching an adjacent file) — the description below was stale, not the code.

---

## 1. The home page's science panel still shows fabricated content — **blocked on Beck**

`app/page.tsx`'s art and writing discipline panels now point at real
`lib/work.ts` content (`rabbit-in-the-moon`, and the poem `lost` from
`love-worth-heartbreak`). The science panel still promotes `lib/content.ts`'s
invented `PROJECTS` — a talk titled "Designing Color-Blind-Friendly Data
Visualizations" with a made-up "Contrast passing AA: 100%" stat — because
there is no real science work in `lib/work.ts` to promote in its place. Same
root cause as §2.

**Decided 2026-08-29:** the panel becomes a **live sketch miniature** — a
fourth object type on the corkboard, replacing the `stat` treatment that only
ever existed to make invented metrics look substantial. See
[specs/2026-08-coding-explorations.md](specs/2026-08-coding-explorations.md) §8.

- [ ] **Beck:** the first coding exploration itself, plus replacement copy for
      the panel's caption ("Talks and studies where design meets research —
      curiosity, made presentable" was written for fabricated content).
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

**Decided 2026-08-29: the first science work is coding explorations** —
live runnable sketches, tagged `science` + a new `code` field tag, rendered
by a new sketch layout inside `/work`. Fully specced in
[specs/2026-08-coding-explorations.md](specs/2026-08-coding-explorations.md);
that spec is buildable now, but this section only closes when real
explorations are in `lib/work.ts`.

- [ ] **Beck:** add science work to `lib/work.ts`. That closes this, and it's
      the same blocker as §1.

## 3. No lint or test setup

`filterWork`, `collectionLayout`, and `getCollectionPiece` are pure and would
be cheap to pin down. Low priority for a personal site; worth it the moment
the tag vocabulary in §2 changes.

## 4. Media loose ends

**`PieceView`'s text-forward branch fixed 2026-08-29** — it now calls
`PieceMedia` (and `ProcessSection`, added alongside it for §11) rather than
returning early, so a poem carrying an animation or speedpaint would render
it.

- [ ] The two near-identical Presidential Pardon sources (reel 39.12s vs.
      carousel-embedded 39.00s) were never diffed. The reel is what shipped.
      Still true: only the reel exists in the tree today, so there's nothing
      local to diff against — this needs the carousel source sourced before
      it's actionable.

## 5. Small correctness gaps

- [ ] **`formFor` still falls back to `'essay'` for anything without a
      writing-form tag.** Centralising the old hardcoded
      `isPoem ? 'poem' : 'essay'` into `lib/work.ts` was the right move and it
      now honours `blog` — but the edge case that motivated the item survives:
      the first top-level hybrid *art* piece carrying `text` would be labelled
      "essay" by `HybridCard`. Unreachable today (zero top-level hybrids), so
      it lands the moment `HybridCard` becomes reachable.

**`app/page.tsx:92`'s fallback fixed 2026-08-29** — repointed at
`/placeholder.jpg` (a raster, so it can't hit the SVG-through-`next/image`
400) instead of dropping it. That leaves `placeholder.svg` with no
references anywhere, so it's deleted — see §6.

**`AboutTabs`'s `useLayoutEffect` checked 2026-08-29** — drove `/about#food`
in a real browser (Puppeteer against local Chrome) and read the devtools
console directly: no SSR warning, no hydration-mismatch warning, nothing
beyond Next's routine LCP-image notices. Confirmed clean at runtime, not just
at build time.

## 6. Leftover asset — **resolved 2026-08-29**

Resolved in the other direction than expected: `placeholder.svg` turned out
to be the dead one (§5's fallback now points at `placeholder.jpg` instead)
and has been deleted. `placeholder.jpg` is referenced again, so nothing here
is leftover any more.

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

**Already shipped, this description was stale:** the badge's swap easing was
described here as `cubic-bezier(0.22, 1, 0.36, 1)` — ease-out expo, zero
overshoot — with a back-out curve proposed as the fix. Checked 2026-08-29:
`components/tab-glyph.tsx` already uses `cubic-bezier(0.34, 1.56, 0.64, 1)`
with a comment explaining the overshoot, landed in `6a430af` before this
pass started. The code was right; this file hadn't caught up to it.

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

**`inktober-17` audited 2026-08-29.** Fetched the archive's
`projects/inktober-2017.md` and compared: its `{% galleryImage %}` per-image
alt text is just each image's word (Swift, Divided, Poison, …), which
`lib/work.ts`'s `inktober-17` already matches — `WorkPlaceholder` renders
`alt={item.title}`, and each piece's `title` is that same word. No gap. The
archive's closing `<small>` "(Last updated 20 January 2023.)" line was
deliberately not carried over, by Beck's call — it's commentary on the old
site's edit history, not meaningful on this one.

## 10. Single-piece view and the lightbox look like the same thing — **shipped 2026-08-28**

The lightbox is now genuinely immersive (opaque `--background` backdrop,
image up to `92vh`/`92vw`, no border/rounding, chrome that idle-fades after
2.5s) and scrolling down inside it flies the image back to its in-page rect
via a plain FLIP animation, closing the dialog once the flight finishes. All
in `components/image-lightbox.tsx`. See
[history/2026-08-essays-viewer-sort.md](history/2026-08-essays-viewer-sort.md)
for the full build record.

## 11. Three WIP screenshots are shipping as standalone finished pieces — **shipped 2026-08-29**

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

That leaves two genuinely different cases, both built as specified.

**Case 1 — the WIP has a finished parent.** `ProcessStill`
(`{ src; caption?; alt? }`) is added to `WorkPiece` as `process?: ProcessStill[]`.
`hand-study` and `waterfowl-and-motherhood` are no longer top-level `WORK`
entries — they're now the sole `process` still on `desire-and-distance` and
`child-not-adult` respectively, each keeping its original caption
("Studying hands, hearts, and progress." / "Apparently I'm on a bird kick.").
`ProcessSection` (`components/work-visuals.tsx`) renders the section: a stack
of `<figure>`s below the writeup, each opening in the ordinary
`ImageLightbox`. The lightbox call needed a `WorkPiece`-shaped item to satisfy
its existing type, so each still gets one built on the fly — never added to
`WORK`, existing only for that call — with `title` set to the still's own
`alt` (falling back to the parent's title) so the opened lightbox announces
the still's accessibility text instead of repeating the parent's title for
every still. `PieceView`'s text-forward branch now calls both `PieceMedia`
and `ProcessSection`, closing the §4 gap in the same pass rather than
inheriting it.

- [ ] **Open — Beck:** whether the process section also gets one shared intro
      note above the stills, separate from the per-still captions.
      `FigureRow`'s shape (one caption for a row) or `PieceLink`'s (per-item)
      would both be cheap to add. Not built until a piece actually needs it.

**Case 2 — the WIP has no finished piece yet.** `security-camera` carries the
new `unfinished: true` flag, surfaced as an "in progress" eyebrow (hourglass
icon) above the title on its own page, and a matching corner badge
(`UnfinishedMark`) on its gallery card — wired into all three top-level card
shapes (`TextCard`, `HybridCard`, `ImageCard`), not just the one
`security-camera` happens to render as today, so a future unfinished
text/hybrid piece doesn't rediscover the same gap §4 recorded. `why-be-afraid`
is a separate, finished piece that happens to share the surveillance/halftone
subject — thematically related, deliberately not attached as `security-camera`'s
parent.

When the finished `security-camera` piece lands: drop its `unfinished` flag
and give it a `process` entry for the WIP still — the one-line move the
minimal `process` shape was chosen to allow.

## 12. The gallery has no sort at all — **shipped 2026-08-28**

`sortWork(items, mode)` in `lib/work.ts` (`curated | newest | oldest`,
`curated` the identity default) and a cycle control beside the venn toggle,
with `?sort=` in the URL on the same terms as `?mode=`. See
[history/2026-08-essays-viewer-sort.md](history/2026-08-essays-viewer-sort.md)
for the full build record.

- [ ] **Beck:** if "recently added" is wanted, that needs an `added` date
      backfilled onto items. The field is documented on `WorkPiece`; no item
      carries one, so the mode shouldn't appear until some do.
