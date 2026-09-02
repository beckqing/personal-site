# TODO

Open work only. Design decisions, structure, and the record of what's already
built live in [ARCHITECTURE.md](ARCHITECTURE.md).

Last reconciled against the tree 2026-08-29, after the code-demo build and
the first real code demo landing (`tsc --noEmit` clean; `next build` clean,
203 static pages — 202 plus `/work/delirium`; a scratch `/excerpt-preview`
route makes it 204 until that folder is deleted).

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
shape — live runnable things filed under `science` with a new piece-page
layout. (Called "coding explorations" at this point; renamed to **code demos**
later the same day — see the last entry.) Fully specced in
[specs/2026-08-coding-explorations.md](specs/2026-08-coding-explorations.md);
both sections stay open until the first one is actually in `lib/work.ts`,
since the spec is design, not content.

**2026-08-29, later still: §4, §5, §6, §11, and the inktober-17 half of §9
shipped** — `tsc --noEmit` clean, `next build` clean, 202 static pages (down
from 204: `hand-study` and `waterfowl-and-motherhood` no longer get their own
route). §7's bounce easing turned out to already be shipped (found while
touching an adjacent file) — the description below was stale, not the code.

**2026-08-29, last: the code-demo machinery shipped**, §2–§7 and §9 of
[specs/2026-08-coding-explorations.md](specs/2026-08-coding-explorations.md)
— the `code` field tag, `CodeDemo` / `isCodeDemo`, `CodeDemoFrame`, the
runnable badge, the `mdx-bodies` rename, and `<Excerpt>`. **These are called
"code demos"**, decided by Beck 2026-08-29; the spec drafted them as "coding
explorations" with a "sketch" field, and both names are retired ("sketch"
collided with Beck's own writeups about pencil sketches).

**§8 (the home page's science panel) is deliberately not built**: it needs a
real code demo to point at and replacement caption copy, both of which are
Beck's to supply. `tsc --noEmit` clean, `next build` clean, 203 static pages —
202 plus `/work/delirium`. (An earlier version of this paragraph said "still
202 — a code demo adds no route of its own." Corrected 2026-08-30: what adds
no route is the demo's HTML, which is a `public/` file. The piece wrapping it
is an ordinary `WorkPiece` and gets `/work/<slug>` like any other.)

**2026-09-02, with Beck: five things this file never knew about, added as
§13–§17. Nothing was closed by this pass, though §17 corrects §9 — one of the
art fair essay's six "omitted" image slots turns out not to be omitted at
all.** §13 is not new work: the lightbox follow-on has been fully specified
since 2026-08-31 and sat untracked, referenced by no other document, which is
the only reason it isn't built. §14 splits "video" into the solved case and
the unsolved one — performances (readings, talks, music) are **decided as
embeds** rather than files. §15 and §16 are both typography, both raised by
Beck, and both land in `components/essay.tsx`: bullet alignment and emoji
size, and heading levels being picked by how large they render. §17 is three
small findings on four lines of `first-art-fair.mdx`, one of which is a wrong
title in `lib/work.ts`.

**2026-09-02, later: §15, §16, and two of §17's three findings shipped** —
`tsc --noEmit` clean, `next build` clean, still 204 static pages (unchanged;
none of this touched routes). §13 (the lightbox rebuild) and §17's sub-gallery
paging stayed deliberately deferred, per Beck's "small items now, lightbox
later." Highlights: `lib/heading-styles.ts` is the new single heading scale;
the art-fair essay's emoji render through a self-hosted 19-glyph, 7KB
monochrome webfont — the site's first `@font-face` — guarded by
`scripts/check-emoji-subset.mjs`; `<EmojiList>` rows now align on a fixed
marker column. Full build record and reasoning for each in §15/§16/§17 below
and in ARCHITECTURE.md's new "Headings" and "Emoji: a subsetted monochrome
web font" sections.

**2026-09-02, later still: the heading scale went through three live
iterations once Beck could actually see it.** First, `h1` and `h2` were
backwards — Beck's "whatever size H3 is should become H1" was built
literally; seeing it live, Beck clarified the actual mapping — a title is
`h1`, an essay's own top-level `##` section is `h2`, one level below it, and
it's `h2` that wants the old `h3`'s size. `h1` (the title) took a real
display size (`text-2xl`) instead; `h2` carries what was briefly on `h1`.
Then, `h2` and `h3` both got bigger again — `text-xl` and `text-base` — once
the whole scale was visible together and read as too compressed. Current
shape: `h1` 24px / `h2` 20px / `h3` 16px / `h4` 14px / `h5` 12px, a real
staircase again rather than two sizes doing five levels of work. Also: the
art-fair emoji now center vertically on the whole item (`items-center`, was
`items-baseline`), per Beck after seeing the larger emoji live. See §16's
"in three passes" and §15's centering note below.

---

## 1. The home page's science panel still shows fabricated content — **blocked on Beck**

`app/page.tsx`'s art and writing discipline panels now point at real
`lib/work.ts` content (`rabbit-in-the-moon`, and the poem `lost` from
`love-worth-heartbreak`). The science panel still promotes `lib/content.ts`'s
invented `PROJECTS` — a talk titled "Designing Color-Blind-Friendly Data
Visualizations" with a made-up "Contrast passing AA: 100%" stat — because
there is no real science work in `lib/work.ts` to promote in its place. Same
root cause as §2.

**Decided 2026-08-29:** the panel becomes a **live code-demo miniature** — a
fourth object type on the corkboard, replacing the `stat` treatment that only
ever existed to make invented metrics look substantial. See
[specs/2026-08-coding-explorations.md](specs/2026-08-coding-explorations.md) §8.

The machinery for the panel exists as of 2026-08-29 — `CodeDemoFrame` is
built and verified — but the panel itself was **deliberately left unbuilt**,
because a `kind: 'code-demo'` card with no demo to point at would be a
fallback branch the spec doesn't describe, and the replacement caption is
Beck's to write.

- [x] ~~**Beck:** the first code demo itself~~ — `delirium` landed 2026-08-29.
- [ ] **Beck:** replacement copy for the panel's caption ("Talks and studies
      where design meets research — curiosity, made presentable" was written
      for fabricated content). **This is now the only thing blocking §8** —
      there is real work to point the panel at.
- [ ] Then build spec §8: swap the science panel's `kind: 'stat'` for
      `kind: 'code-demo'`, reusing `CodeDemoFrame`'s autorun policy (one iframe on
      the home page, and only one). **Verify in a browser** that booting it
      doesn't disturb `HeroWordScatter`'s hover sync or the tilt transitions —
      the panel is inside a tilted `overflow-hidden` card in the hover-collage
      context, and the spec flags this as the part most likely to need
      adjusting on contact. Fallback if it does: poster plus badge, no boot.
- [ ] Once that lands, delete `lib/content.ts` entirely (it's down to just
      `PROJECTS` now — `ARTWORKS`, `POEMS`, and `ESSAYS` were fabricated
      scaffold content and are gone, along with the orphaned PNGs they
      referenced).

## 2. `science` is a discipline with zero work in it — **mostly closed**

*As originally filed (2026-08-27), for the reasoning below — the state it
describes is no longer current; see "Built 2026-08-29" further down.* The
hero copy's `science` word and the homepage's third discipline panel both go
to `/work?tags=science` (the footer's copy of this link was removed
2026-08-28, when the footer was simplified to three icon links and a
disclosure), and no item anywhere in `lib/work.ts` carries the `science` tag —
the gallery renders its empty state. Ten tags in the filter vocabulary have
zero matching items (`science`, `oil`, all four `field` tags, and four of the
six `theme` tags).

**Decided (2026-08-27): Beck fills it.** Science is core to Beck's identity;
the work just hasn't been uploaded yet. The vocabulary stays exactly as it
is — don't prune the dead tags, don't hide zero-count chips, don't re-frame
the homepage's three-discipline structure around a temporarily
two-discipline dataset. See "Content model" in ARCHITECTURE.md.

**Decided 2026-08-29: the first science work is code demos** — live runnable
things, tagged `science` + a new `code` field tag, rendered by a new code-demo
layout inside `/work`. Fully specced in
[specs/2026-08-coding-explorations.md](specs/2026-08-coding-explorations.md).

**Built 2026-08-29:** the `code` tag is now in the `field` facet, and the
whole code-demo layout exists and is verified — so adding one is now six
lines in `lib/work.ts` plus a folder in `public/code-demos/`. Eleven tags
match nothing today rather than ten; that is expected and stays.

- [x] ~~**Beck:** add science work to `lib/work.ts`~~ — **done 2026-08-29.**
      `delirium` (`art` + `science` + `code`) is the first, so
      `/work?tags=science` renders real work instead of the empty state and
      `code` has a non-zero count. Nine tags still match nothing; that is
      expected and stays.

### Still open on `delirium` itself

- [x] ~~**Beck:** a `description` (the editorial gloss) and a `writeup`~~ —
      **not required. Decided 2026-08-30 (Beck): a piece may ship with
      neither.** Words are optional; the site already has work that is just
      the thing itself. Spec §9's "never the only path to the content" rule is
      amended to match — what it actually asks for is that *something*
      survives the demo not running, and `delirium`'s poster is Beck's own
      illustration, so a reduced-motion reader gets the artwork rather than an
      empty box. Don't reopen this as a gap.
- [ ] One consequence of the above worth closing on its own terms:
      `metaDescription()` falls through `description` → `preview` → `text` and
      returns `''`, so `/work/delirium` ships an **empty meta description** —
      what a search result or a shared link renders from. Either give the
      piece a one-line `description`, or make `metaDescription()` fall back to
      the title. A write-up is not what fixes this.
- [ ] **Beck:** confirm `year: '2022'`. It was taken from the commit that
      created `delirium.html` in `github.com/beckqing/whims` (2022-05-21), not
      stated by Beck — and the underlying illustration may well predate the
      interactive version, in which case `year` should be the older one.
- [ ] **Decide for real: vendored libraries vs CDN.** d3 v6 (264 KB) and p5
      0.9.0 (461 KB) are currently copied into
      `public/code-demos/delirium/`, chosen provisionally 2026-08-29 so the
      piece is self-contained and survives d3js.org reorganising (which
      already moved this pen from v3 to v6). The alternative is loading both
      from a CDN as the original pen does. Either works — `sandbox=
      "allow-scripts"` does not block subresource loads, only `fetch`,
      storage, and same-origin access.
- [x] ~~The frame's mono label reads `index.html`~~ — fixed 2026-08-29
      (Beck): `entryName()` falls back to the containing folder when the entry
      is an `index.*`, so the rail reads `delirium`.
- [ ] `delirium` is appended at the end of `REAL_WORK`, so it sorts last under
      "in my order". Move it wherever Beck actually wants it.

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

## 6. Leftover assets

`placeholder.svg` turned out to be the dead one (§5's fallback now points at
`placeholder.jpg` instead) and has been deleted; `placeholder.jpg` is
referenced again. That part is resolved (2026-08-29).

The code-demo build left two scratch fixtures, tracked here 2026-08-30
rather than in §2 — they are development furniture, not part of `delirium`:

- [ ] **Delete `app/excerpt-preview/`** once the `<Excerpt>` palette is
      settled. It is a real seventh app route, which is the whole reason the
      build reports 204 pages rather than 203. It gates itself —
      `notFound()` once `NODE_ENV` is `production`, firing at prerender, so
      the shipped HTML is the 404 page — but the route still exists, and the
      file's own header says to delete it when done.
- [ ] **Decide whether `public/code-demos/_preview/` stays.** It is the
      reference implementation of the spec's §5 contract and the file to copy
      when starting a real demo, which is a good reason to keep it. Worth
      knowing that it is the one fixture with **no gate**: `public/` is
      copied verbatim into every build, so `/code-demos/_preview/index.html`
      is reachable in production even though its `lib/work.sample.ts` entry
      is not. Harmless, but "dev-only" isn't true of the file itself. If it
      stays, it stays as a deliberate choice.

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
      archive): ~~`[ when a woman ]`~~ (**this one is not a gap — corrected
      2026-09-02, see §17**), `[ photos of setup sketch and practice ]`,
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

Two complaints survived that build — the lightbox is often *smaller* than the
piece's own page, and reaching it from `/work` costs two clicks. Both closed
in §13's build.

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

## 13. The lightbox follow-on — **shipped 2026-09-02**

Built as specified in
[history/2026-08-lightbox-sizing-and-gallery-entry.md](history/2026-08-lightbox-sizing-and-gallery-entry.md)
(moved from `specs/` at ship time, per its own §8 instruction). Closes both
complaints §10's build left open: the lightbox showing an image **smaller
than the piece's own page**, and reaching it from `/work` costing two clicks
for a standalone image whose page adds nothing in between. `/work` now opens
one URL-addressable (`?view=<slug>`), controlled `ImageLightbox` straight
from a card; every other lightbox (collection pages, piece pages, process
stills) is unchanged, ephemeral, per-tile state.

Two things surfaced during the build that the spec didn't anticipate, both
found by testing in a real browser rather than by reading the code — see the
spec's own divergence note and the new entries under ARCHITECTURE.md's
Component layers section:

- Base UI 1.5's `DialogPopup` calls `stopPropagation()` on every arrow key,
  which silently broke arrow-*key* paging (the prev/next *buttons* still
  worked) — fixed by registering the paging listener on `window` with
  `{ capture: true }`.
- The natural-size clamp's effect needed `popupNode`, not just `index`, in
  its dependency array — the same async-Popup-mount timing the file already
  documents for the wheel/touch and idle-fade effects (`imgRef.current` can
  still be null on the render where an index-keyed effect first runs).

- [x] ~~Open, and deliberately left for the running build rather than decided
      from a description: whether the caption pill overlaying the bottom of a
      tall portrait reads as acceptable, or wants a ~72px reserved inset~~ —
      shipped as the plain pill, unreserved. Cheap to switch either way if
      Beck finds it wanting in practice.

## 14. Video is two problems, and only one of them is solved

This file has treated "video" as settled since the speedpaint work. It isn't.
ARCHITECTURE's "Media: speedpaints and animations" covers **two** kinds — a
timelapse you scrub, a finished clip you press play on — both self-hosted
single files under `public/art/`, both declared as a bare `src` string on
`WorkPiece`. Neither describes a third kind Beck actually has.

### 14a. More animations — the path exists, the recipe doesn't

Adding another animation is `animationSrc` plus a file. What is undocumented
is how to **encode** one. ARCHITECTURE records CRF 33, keyframes ~0.5s apart,
and `+faststart` as load-bearing findings — but all of those were tuned for
**scrubbing**, where dense keyframes are the entire point and cost real
bitrate. An animation is played start to finish and wants neither setting.

- [ ] Write the animation encoding recipe alongside the speedpaint one, and
      say plainly that the keyframe rule does **not** carry over. As it
      stands, the only settings recorded on this site are the wrong ones for
      this case, and they are recorded emphatically.

### 14b. Performances are a third kind — **decided 2026-09-02: embedded**

**What they are (Beck, 2026-09-02):** readings and talks, and music. Not live
art-making. So a performance is Beck *doing* something in front of people,
where the audio is load-bearing and the run time is minutes rather than the
15–50 seconds every clip in the tree runs today.

**Decided: performances are embedded (YouTube/Vimeo), not files in `public/`.**
The arithmetic is why. Six clips totalling 10.8MB buy about 3.7 minutes at
720p; `public/art/` is already 41MB, committed to git. A ten-minute reading at
that rate is ~30MB before anything is shot in landscape or kept in stereo.
This is the first third-party embed on the site, and that is the trade taken
knowingly.

*Read as scoped to performances.* The existing six self-hosted clips stay
self-hosted — the decision was taken about performance video, and nothing
about speedpaint scrubbing survives a YouTube player. Correct this if the
reading is wrong, because migrating them is a different and much larger job.

Three things in the current design break on contact with a performance, all
found 2026-09-02 by reading the code rather than by hitting them:

- [ ] **`AnimationPlayer` mutes by default.** Deliberately — "a portfolio page
      shouldn't start making noise because someone pressed play." For a
      reading or a ukulele piece the audio *is* the work, so a viewer who
      presses play and hears silence is hitting a bug, not a courtesy.
      Whatever renders a performance needs the opposite default.
- [ ] **`PieceMedia` always ends with a "view still image" trigger**, on the
      reasoning that no video substitutes for seeing the finished image. A
      performance has no finished image — a poster frame at best. Decide what
      that trigger does; most likely it simply isn't rendered.
- [ ] **`MediaBadges` has two indicators** (record dot for speedpaint, play
      triangle for animation) and would need a third.

Two design notes worth having before anything is built:

- [ ] **Use a facade, not a bare iframe** — poster image, reserved aspect box,
      third-party iframe injected only on click. This is not a new pattern
      here: it is what `CodeDemoFrame` already does, for the same two reasons
      (reserve the box so starting the thing shifts nothing on the page; don't
      run the expensive thing unasked). A YouTube iframe pulls on the order of
      a megabyte of script onto a site whose entire six-clip video budget is
      10.8MB, and a facade also means no third-party request until a viewer
      asks for one. `youtube-nocookie.com`, or Vimeo's `dnt=1`, for the same
      reason.
- [ ] **Keep the poster local.** A remote YouTube thumbnail would be the first
      thing on this site to need `images.remotePatterns` in `next.config.mjs`,
      which is an empty config object today. A poster frame in `public/` costs
      a few KB, matches every other image here, and keeps that file empty.

**Open — Beck:**

- [ ] **Where does music go in the tag vocabulary?** There are exactly three
      disciplines. Readings and talks land cleanly (`writing`, `science`);
      ukulele lands in none of them. ARCHITECTURE says not to re-frame the
      three-discipline structure around a dataset that happens to be narrow —
      but this is the opposite case, data that genuinely doesn't fit rather
      than a vocabulary waiting to be filled. Options, none decided here: a
      `music` tag in the `medium` facet under `art`; a fourth discipline; or
      performance as its own facet cutting across all three. This wants a call
      before any field is added to `WorkPiece`.
- [ ] **Does a performance carry a transcript, or point at a piece?** Words
      are optional on any piece (decided 2026-08-30), so a transcript can't be
      required. But a reading is usually a reading *of something the site
      already holds* — a poem from `love-worth-heartbreak`, say. Pointing at
      that `WorkPiece` beats duplicating its text, and `PieceLink` in
      `components/essay.tsx` is already the shape that does it.
- [ ] Whether a performance is a **field on an existing piece** (the way
      `speedpaintSrc` documents one) or a **`WorkPiece` in its own right**. A
      reading of an existing poem argues for the first; a set of three songs
      argues for the second. Probably both, eventually — decide which one
      first.

Whatever shape it takes, it stays **plain serializable data** on `WorkPiece`:
`lib/work.ts` is imported by four client components and may never hold a
component reference. That constraint is exactly why `codeDemo` is
`{ src, aspect }` over an iframe, and a performance is the same situation.

## 15. The art fair essay's emoji bullets don't align — **shipped 2026-09-02**

`EmojiList` / `Item` (`components/essay.tsx`) rendered each row as an `<li>`
with the emoji, the label, and the prose all **inline**, inside a
`list-none … pl-0` list. There was no hanging indent, so a wrapped line ran
back underneath the emoji and the marker stopped reading as a marker — in
exactly the long items where it would help most. Several of
`first-art-fair`'s bullets run five sentences.

**This was the complaint, confirmed with Beck 2026-09-02: alignment.** Not
the label-only rows, not the emoji themselves, not the `+` / `Δ` section
headings — those stayed as they are.

- [x] ~~Give the row a fixed marker column and align every line of prose to
      one left edge~~ — `Item` now renders a `grid grid-cols-[1.75rem_1fr]
      items-center` row: a fixed emoji column, then a column holding the
      label and prose together (so a label-only row like `<Item
      emoji="🎯" label="profit." />` still reads as one line — nothing about
      the "same as last market" shorthand needed to change).
- [x] ~~A fixed-width slot closes a second problem for free~~ — done, and by
      a stronger route than a fixed-width slot alone: every emoji in the
      essay now renders through a dedicated subsetted webfont (below) instead
      of whatever font the reader's platform substitutes, so there's no
      per-platform width variance left for the slot to absorb in the first
      place.
- [x] ~~Watch vertical alignment~~ — first shipped as `items-baseline`
      (lining the emoji up with the label's baseline); changed to
      `items-center` the same day once Beck saw it live and asked for the
      emoji centered on the whole item rather than pinned to the first
      line — see the note further down.

Scope is small: `EmojiList` appears in exactly one file — 13 lists in
`content/essays/first-art-fair.mdx` — and nowhere else in the tree.

Seen while reading, recorded but **not** proposed as work: the emoji are doing
categorical rather than decorative work, though `Item` marks them
`aria-hidden` as decoration. 🎯 💳 🏷 👁 🚗 recur across all three markets, and
the essay's actual arc is `labels` and `pos` migrating out of the "Δ things to
change" list into the "+ good" list by the third one. Flat lists bury that.
Any comparative view would have to be an **addition alongside** the essay,
never a regrouping of it — imported content is transcribed, not
restructured — and it would first need the emoji normalised (🎪 vs 📌 for
layout, ⌛ vs ⌚ for setup time, 🥣 / 🥤 / 🍽 for food), which is Beck's
authoring call and not a formatting fix.

### Size, and the monochrome question — decided and shipped 2026-09-02

**Beck chose Option B: all monochrome, self-hosted Noto Emoji**, over
guaranteeing colour via a platform emoji font stack. Reasoning recorded at
the time this was still open, since it's the reasoning that would need to be
overturned to revisit it:

- **It matches the site.** Everything else here is single-colour ink — the 50
  brand doodles, `TabGlyph`, the brand mark. §7 already records the rule that
  ink is a token and not a literal. Monochrome emoji join that system; colour
  emoji would have imported someone else's illustration style into the
  middle of an essay.
- **It renders in `currentColor`**, so it inherits the essay's
  `text-foreground/85` and dark mode works with no second decision — the exact
  trap §7 documents (`#080b24` is light's foreground *and* dark's background).
- **Everyone sees the same glyphs** — the thing a colour-font-stack approach
  structurally cannot offer, since Apple, Google, and Windows draw the same
  codepoint differently.
- **It improves at the larger size** the emoji also got: big colour emoji in
  body text read as chat stickers; big monochrome line glyphs read as a
  designed marker set.

**Built:** a **19-glyph, 7KB subsetted webfont**,
`public/fonts/noto-emoji-subset.woff2` — the site's first `@font-face`. Full
build and regeneration steps are in ARCHITECTURE.md's "Emoji: a subsetted
monochrome web font". `Item`'s emoji span now renders through `.font-emoji`
(`app/globals.css`) at `text-xl` (1.25× the `text-base` body — the low end
of the 1.25–1.5× range this section originally proposed; can go bigger, this
was a starting pick, not a measured one) with `font-variant-emoji: text` as
a fallback safety net if the font ever fails to load.

**The build-time guard exists**: `scripts/check-emoji-subset.mjs`, run by
hand (`node scripts/check-emoji-subset.mjs`), matching
`check-essay-fidelity.mjs`'s pattern rather than a build-time gate. It reads
the font's `unicode-range` out of `globals.css` and diffs it against every
`emoji="…"` actually used in `content/essays/*.mdx`, so a future essay adding
a 20th emoji fails loudly here instead of silently falling back to a colour
glyph.

**Known, accepted cost:** two glyph pairs are weaker without colour —
⌛ vs ⌚ (setup time) and 🥣 / 🥤 / 🍽 (food) — silhouette alone carries the
rest (target, card, tag, eye, car all read cleanly monochrome). Not treated
as a gap; it's the trade this decision knowingly makes.

## 16. Heading levels are chosen by how big they look, not by what they mean — **shipped 2026-09-02**

**Raised by Beck 2026-09-02:** "I generally bias towards smaller heading sizes
out of a visual preference… I often use heading three instead of what should
actually be heading one or two because it is smaller, but we should just make
one smaller."

That was exactly what the tree showed. Every heading on the site carried its
own ad-hoc size classes at the call site — 19 of them, no shared scale — so
the only way to get a smaller heading had been to drop a level. The audit,
2026-09-02, and how each finding closed:

- [x] ~~**`/work` has no `<h1>`. It has no `<h2>` either.**~~ Fixed — the
      page now has `<h1 className="sr-only">Work</h1>`, and the gallery card
      titles (`components/work-gallery.tsx`, both occurrences) moved from
      `h3` to `h2`, since nothing else on the page claims that level.
- [x] ~~**There are four different `h1` scales.**~~ Fixed — every non-nameplate
      `h1` on the site now renders `headingStyles.h1`
      (`lib/heading-styles.ts`).
- [x] ~~**That last `h1` is smaller than the `h2` rendered beside it.**~~ No
      longer describes a bug: `h1` (18px) is deliberately the top of the new
      scale and `h2` (16px) sits below it everywhere, by construction.
- [x] ~~**`h2` currently means two unrelated things, told apart only by
      size.**~~ Fixed — the eyebrow is now `headingStyles.eyebrow`, decoupled
      from the numbered scale; the two "in this collection" / "table of
      contents" / "process" eyebrows still render `<h2>` (a correct sibling of
      the essay body's own `<h2>`s) but no longer share a class string with
      them by coincidence.
- [x] ~~**`content/essays/first-art-fair.mdx` jumps `##` straight to
      `####`.**~~ Fixed without touching the `.mdx` file at all — see the next
      finding.
- [x] ~~**`MarketHeader` isn't a heading.**~~ Fixed — it's a real `<h3>` now
      (`headingStyles.h3`), which is what closes the level-skip above: `##` →
      `MarketHeader`'s new `h3` → `####` is a correct, unbroken sequence.
- [x] ~~`components/about-tabs.tsx` panels carry no headings at all.~~
      **Investigated, no change made.** The tabs already use a complete
      `role="tablist"` / `role="tab"` (`aria-selected`) / `role="tabpanel"`
      (`aria-labelledby`) pattern — the tab itself is the accessible name for
      its panel, per the WAI-ARIA APG. A heading inside the panel would be
      redundant with what the tab role already provides, not a gap. Not
      re-opening this; flagging so it isn't rediscovered as unaddressed.

### The shape of the fix — done

- [x] ~~Define one heading scale in one place~~ — `lib/heading-styles.ts`
      exports `headingStyles.{eyebrow,h1,h2,h3,h4,h5}`, imported everywhere a
      heading renders. Lives in `lib/`, not `components/essay.tsx`, because
      `essay.tsx` already imports from `work-visuals.tsx` (for
      `WorkPlaceholder`) and `work-visuals.tsx` needed the scale too (for the
      "process" eyebrow) — putting it in either component file would have
      created an import cycle.
- [x] ~~**Beck sets the sizes.**~~ Done, see below.
- [x] ~~Pull the eyebrow out of the heading scale.~~ Done — `headingStyles.eyebrow`.
- [x] ~~Give `/work` a real `h1`, and demote the card titles under it.~~ Done,
      `sr-only`, as this item anticipated.

**Re-leveling the essays turned out to be unnecessary.** The fix for the
`##` → `####` skip didn't touch a single heading marker in any `.mdx` file —
`MarketHeader` becoming an `h3` closed it structurally. The "imported content
is never rewritten" question this section raised (governs prose, not markup)
never actually came up in the build.

### The scale, decided 2026-09-02 — in three passes

**First pass, misread:** "whatever size H3 is should become the formatting
for H1" was built literally — `h1` took `text-lg font-bold lowercase
text-foreground/80` wholesale, on the reading that "the top of the scale"
meant the `<h1>` tag.

**Corrected the same day, once it was visible in the browser.** A piece's
title is `h1`; an essay's own top-level `##` section is properly *one level
below it* — `h2`, not `h1`. At `text-lg` (18px), `h1` sat only 2px above its
own `h2` section heads — a title needs to read as clearly dominant over the
content beneath it, not just technically bigger. Final shape:

- **`h1` (the title) keeps a real display size — `text-2xl`** — distinct
  from the compressed scale below it, not folded into it.
- **`h2` (an essay's top-level section) carries the old `h3` formatting** —
  `text-lg font-bold lowercase text-foreground/80` — since that's what was
  actually being asked for: the thing one level below the title, sized like
  the old, smaller `h3`.
- **The eyebrow became the bottom of the scale.** `headingStyles.eyebrow` is
  a named, standalone token now, not a literal shared by coincidence with
  whatever level happened to also want small caps.

**Third pass, later the same day: `h2` and `h3` both got bigger again**, once
Beck had the whole scale live and wanted more size differentiation between
levels than the second pass gave. `h2`: `text-lg` → `text-xl`. `h3`:
`text-sm` → `text-base`. `h4` stayed `text-sm`, so it's now told apart from
`h3` by size *and* weight/colour (`font-bold` vs. `font-semibold
text-foreground/70`) rather than weight/colour alone — it's a subsection of
`h3`, not a peer. The scale is a real staircase again: `h1` 24px / `h2` 20px
/ `h3` 16px / `h4` 14px / `h5` 12px. Margins (`mt-8` on `h3`, `mt-6` on `h4`)
are unchanged and still load-bearing for the rhythm between sections.

**Nameplates stayed exempt, as planned.** `beck qing` (`app/page.tsx`) and
"Hi, I'm Beck." (`app/about/page.tsx`) were not touched — both keep their
original large sizes under their existing eyebrows, per this section's
original reasoning: they're display type, not document titles, and pulling
them into the scale would have taken away the site's only two large
headlines along with the small ones.

Full writeup, including the two-pass correction: "Headings" in
ARCHITECTURE.md.

### Emoji centered on the row, not the baseline — added 2026-09-02

**Beck, after seeing §15 live:** the marker should center vertically on the
whole item, not align to the label's baseline. `Item`'s grid row
(`components/essay.tsx`) changed `items-baseline` → `items-center`, so a
wrapped multi-line item centers the emoji on the full paragraph block rather
than pinning it to the first line.

## 17. The art fair essay's application gallery is missing a piece, and can't be paged

Three findings from Beck, 2026-09-02, all on the same four lines of
`content/essays/first-art-fair.mdx`. First two shipped same day; the third is
deliberately deferred.

- [x] ~~**The caption says three, the row has two.**~~ Fixed —
      `<FigureRow caption="The three works I submitted with my application.">`
      now has a third `<PieceLink slug="womens-history-month" />`, in the
      order Beck described (Mama Earth → Fire Protection → this one).
- [x] ~~**The missing third is `womens-history-month`, and §9 had it
      wrong.**~~ §9's "omitted" list is corrected — the piece was in
      `lib/work.ts` all along and needed no upload, exactly like `mother
      earth` and `fire protection` before it. One omitted slot down, five to
      go.
- [x] ~~**`womens-history-month` is titled wrong.**~~ Fixed — `lib/work.ts`'s
      `title` is now `'when a woman...'` (Beck's confirmed exact form: three
      literal periods, not a unicode ellipsis). The `description` field
      ("Made for Women's History Month, supplies courtesy of a work event…")
      was deliberately left alone — it's naming the actual occasion the piece
      was made for, not repeating the old (wrong) title. The slug stays
      `womens-history-month`, per this item's original note: nothing ties a
      slug to a title, and changing it would move a live URL for no reason.
- [ ] **The row should be a sub-gallery you can page through** — open
      `mama earth`, then arrow right to `fire protection` and on to the third,
      without going back to the essay in between. Today each `PieceLink`
      navigates away to its own piece page, so seeing all three is three round
      trips. **Deliberately not built in this pass** — Beck chose "small items
      now, lightbox later" 2026-09-02, and the reasoning below still applies:
      building this now means a second paging implementation to reconcile
      with §13's later, rather than one.

**Sequence this after §13.** The lightbox spec builds paging, a tile registry,
and the "where does the reading path go" answer for a card that opens a
lightbox instead of navigating — which is the same question `PieceLink` is
about to ask. Its §7 puts collection-page tiles out of scope but says nothing
about essay `FigureRow`s, so this is a new consumer of that machinery rather
than something it already covers. Building it first means one paging
implementation instead of two; building it now means inventing a second one
and reconciling them later.
