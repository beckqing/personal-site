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
[history/2026-08-coding-explorations.md](history/2026-08-coding-explorations.md);
both sections stay open until the first one is actually in `lib/work.ts`,
since the spec is design, not content.

**2026-08-29, later still: §4, §5, §6, §11, and the inktober-17 half of §9
shipped** — `tsc --noEmit` clean, `next build` clean, 202 static pages (down
from 204: `hand-study` and `waterfowl-and-motherhood` no longer get their own
route). §7's bounce easing turned out to already be shipped (found while
touching an adjacent file) — the description below was stale, not the code.

**2026-08-29, last: the code-demo machinery shipped**, §2–§7 and §9 of
[history/2026-08-coding-explorations.md](history/2026-08-coding-explorations.md)
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

**2026-09-02, last of the day: the heading scale went up one more step, and
collapsible sections are specced as §19.** Beck asked for all headings a
little bigger; raising the whole ladder turned out to *recover* the two levels
the 16px body-text floor had flattened — `h3`/`h4`/`h5` were all sitting at
`text-base`, told apart by weight and colour alone. The scale is now
30/24/20/18/16, five distinct sizes, `h1` responsive (`text-2xl sm:text-3xl`)
so a 46-character title doesn't set three lines on a phone. **Shipped**;
ARCHITECTURE.md's "Headings" section was stale (it still documented the
14px/12px staircase the floor rule had already overridden) and is corrected.
§19 is the design that hangs off it — `<Section>`, `<Fold>`, `<Log>` — specced
with Beck, not built.

**2026-09-02, also: the tag vocabulary was pruned and §1 was respecced.** The
"vocabulary is deliberately wider than the data" rule is **reversed** — eight
dead tags are gone, and every tag now matches at least one item (§2, shipped).
And §1 stopped being a science-panel problem: all three home cards show
exactly one work each, which is the actual defect. Respecced with Beck around
"the implication of more" as
[history/2026-09-home-discipline-cards.md](history/2026-09-home-discipline-cards.md)
— **not built**. Its §8 predecessor (the science panel as a live code-demo
miniature) is dropped, not deferred.

**2026-09-03: the tucked-peek build was rejected on sight, before it was ever
committed, and respecced as a loose column.** The peek build matched its spec
exactly — science caption, art and writing peeks, the dropped polaroid
frame/quote mark, the whole mechanism — and still didn't read as intended
live. Beck's reaction surfaced that peeks clipped by the card's own edge (the
mechanism's central idea) looked like the card was cutting off its own
content, not implying more of it. Respecced same-day as
[history/2026-09-home-discipline-columns.md](history/2026-09-home-discipline-columns.md):
an even column of 2–4 pieces with no featured piece, fading into the CTA
instead of clipping. Its own §1 catalogs eight concrete failures in the peek
build, two of which actually mattered: the geometry needed four free
directions inside a card that only has one, and a hard clip needs to read as
a promise rather than a rendering mistake, which "clipped by a rounded
corner, possibly under a neighboring card" never quite managed.

**2026-09-03, later: the first column build was itself rejected, and
respecced a second time — still same-day.** That build put the column
inside the existing `.tilt-card` panel, faded each card's column at its own
bottom, and kept the whole card rotating flat as one object on hover. Beck
rejected all three. Respecced as
[history/2026-09-home-discipline-columns.md](history/2026-09-home-discipline-columns.md)
(overwriting the first pass's version of that same file — its own intro
banner keeps a diff table of what changed): the card is deleted entirely,
the three columns stand directly on the page, one shared fade spans all
three instead of three separate ones, each discipline's CTA moves up into
its own header (only "see the full gallery" sits in the shared fade), and
hovering rotates every rung to exactly 0° individually rather than the
group settling flat as a unit. Science, previously left at an honest two
pieces, is filled out to four with two of Beck's essays in progress
(`colony-selection`, `designing-dna`), flagged `unfinished` — not invented,
and shown with `UnfinishedMark` — so its column reaches the shared fade
like the other two.

**2026-09-03, last: the second column build shipped.** See §1 below.

---

## 1. The home page's three discipline cards each show one work — **shipped 2026-09-03 (loose columns, no card)**

`app/page.tsx:23` declares three panels, each rendering a different hand-built
object: a `polaroid` (`rabbit-in-the-moon`), a `quote` card (the poem `lost`),
and a `stat` block. Each shows exactly one piece of work.

The `stat` block is also still fabricated — it promotes `lib/content.ts`'s
invented `PROJECTS`, a talk titled "Designing Color-Blind-Friendly Data
Visualizations" with a made-up "Contrast passing AA: 100%" metric. That was
this section's original complaint (2026-08-27), and it was blocked on §2 —
there was no real science work to promote instead. **§2 closed**; `delirium`
and `transformation` are both real science work. The fabricated stat is now
just the loudest symptom of the larger problem below, and it goes either way.

~~**Decided 2026-08-29:** the panel becomes a **live code-demo miniature** — a
fourth object type on the corkboard, replacing the `stat` treatment that only
ever existed to make invented metrics look substantial. See
[history/2026-08-coding-explorations.md](history/2026-08-coding-explorations.md)
§8.~~ **Dropped 2026-09-02** — see the new spec below. The `CodeDemoFrame`
machinery stays exactly where it is and keeps serving `/work/delirium`;
nothing is deleted, §8 is just not built.

**Respecced 2026-09-02, with Beck — and the scope grew.** Working on the
science panel surfaced that this was never only a science problem: *all
three* cards show exactly one piece of work, so a reader who never scrolls
past the fold sees one painting, one poem, and one statistic and concludes
that is the site. Behind them sit 26 top-level art items (112 pieces, 97 with
images), 6 writing items, and 2 science items.

Beck's framing: **"I just want the implication of more."** Not an inventory —
the implication. First decided mechanism was a **tucked-under peek**: one
piece on top, two to four others poking out from behind it at loose angles,
clipped by the card's existing `overflow-hidden` so the crop does as much
work as the count. Collection stacks and a bleeding contact sheet were both
considered and dropped before that (reasons recorded in
[history/2026-09-home-discipline-cards.md](history/2026-09-home-discipline-cards.md)'s
own §1) — **and the peek itself was considered and dropped too**, after being
built in full and rejected on sight; see the 2026-09-03 log entry above and
that file's own status banner.

**The peek was rejected once; the first column build (still inside a card)
was rejected too.** Both same-day, both before ever being committed. **What
actually shipped, on the second try, is a card-free loose column**, fully
specced in
[history/2026-09-home-discipline-columns.md](history/2026-09-home-discipline-columns.md):
no panel, no border, no overlap — each discipline is a header (badge, copy,
and that discipline's own CTA) plus 2–4 unrelated pieces standing directly on
the page in normal flow, each tucked under the one above it. All three
columns dissolve into **one shared fade** near the bottom of the section
rather than three separate ones, and "see the full gallery" — not any
per-discipline CTA — sits inside that dissolve. Hovering (or hovering the
matching word in the hero copy, via the same `.discipline-column-active`
trap both specs called out) rotates every rung to exactly 0° on its own; the
group itself never moves, since there's no card left to move as a unit.

Science is now four pieces, not two: `transformation` and `delirium` as
before, plus two of Beck's essays in progress (`colony-selection`,
`designing-dna`), flagged `unfinished` and shown with `UnfinishedMark` rather
than invented — this is what lets science's column reach the shared fade
like the other two, since "honest at two" stopped being viable once the
fade became something every column has to reach together. No piece is
picked for more than one column. `lib/content.ts` and its fabricated
`PROJECTS` are deleted — **no fabricated content remains anywhere in the
site's data**, worth saying in ARCHITECTURE.md next time it's touched.
[history/2026-08-coding-explorations.md](history/2026-08-coding-explorations.md)
moved to `docs/history/` in the same change as the peek build, its §8 having
been the only thing keeping it in `specs/`.

Three build-time divergences, all verified by measuring the actual rendered
page rather than by eye, and all recorded in the columns spec's own status
banner and in ARCHITECTURE.md:

- **`TEXT_RUNG_ASPECT` is `1` (square), not the spec's `3/2` starting
  point.** At `3/2` the all-text writing column landed 36% shorter than the
  art column, nowhere near the "~15%" target — its last rung sat entirely
  above the shared fade line with a hard, undissolved edge, and mostly-text
  science fell short too.
- **The bottom fade is `4rem`.** Same number the first (in-card) column
  build had already landed on for the same reason (a shorter all-text
  column's last rung needs the fade starting well inside it, not at its very
  edge) — re-verified after the redesign since the fade moved from
  per-column to shared.
- **`UnfinishedMark` sits in normal flow under the excerpt, not as an
  absolutely-positioned corner.** A corner badge is only ever guaranteed
  visible on a column's *last* rung — every earlier rung has its bottom
  covered by the one below it, which hid the mark entirely on
  `colony-selection` (not the last rung) when it was first placed at a
  bottom corner, and collided with the top-set excerpt text when moved to a
  top corner instead.

- [ ] **Beck:** the science illustration, whenever it's drawn. It becomes
      rung 1 of the science column and pushes the other four down — a
      change to one `CARDS` entry in `app/page.tsx`, nothing structural. Not
      a blocker; the column is honest and complete without it.

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
*(The no-pruning half of this was **reversed 2026-09-02** once science had
work in it — see the last checkbox in this section. The rest still holds.)*

**Decided 2026-08-29: the first science work is code demos** — live runnable
things, tagged `science` + a new `code` field tag, rendered by a new code-demo
layout inside `/work`. Fully specced in
[history/2026-08-coding-explorations.md](history/2026-08-coding-explorations.md).

**Built 2026-08-29:** the `code` tag is now in the `field` facet, and the
whole code-demo layout exists and is verified — so adding one is now six
lines in `lib/work.ts` plus a folder in `public/code-demos/`. Eleven tags
match nothing today rather than ten; that is expected and stays.
*(Superseded 2026-09-02: eight of them were pruned.)*

- [x] ~~**Beck:** add science work to `lib/work.ts`~~ — **done 2026-08-29.**
      `delirium` (`art` + `science` + `code`) is the first, so
      `/work?tags=science` renders real work instead of the empty state and
      `code` has a non-zero count. `transformation` (`writing` + `science` +
      `biology`) followed 2026-09-02.
- [x] ~~Nine tags still match nothing; that is expected and stays.~~ —
      **reversed and closed 2026-09-02 (Beck): the dead tags were pruned.**
      The "vocabulary stays wider than the data" rule quoted above was written
      while `science` was empty, and it did its job — it held the space
      `delirium` and `transformation` landed in. With that gap closed, the
      remaining eight dead tags were headroom for work nobody had imagined,
      so they came out: `oil` from `medium`; `neuroscience`,
      `material science`, and `dataviz` from `field`; `nature`, `the body`,
      `memory`, and `food` from `theme`. Every tag in `ALL_TAGS` now matches
      at least one item; a new one goes back in when the piece needing it
      does. See the rewritten "Content model" in ARCHITECTURE.md, and the
      decision comment above `DISCIPLINE_FACETS` in `lib/work.ts`.
      `lib/work.sample.ts` still carries the pruned words and was left alone
      (dev-only scaffolding; unknown tags are dropped, not errors).

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
      `isPoem ? 'poem' : 'essay'` into `lib/work.ts` was the right move — but
      the edge case that motivated the item survives:
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
`placeholder.jpg` instead) and has been deleted. **Correction, 2026-09-09:**
this entry previously claimed `placeholder.jpg` was "referenced again" —
that was true in 2026-08-29 but stopped being true when the discipline-
columns rewrite deleted the `app/page.tsx` fallback that referenced it.
Checked by grepping `app/`, `components/`, `lib/`, `content/`, and
`scripts/`: zero hits. `public/placeholder.jpg` is itself orphaned now.

- [ ] **Delete `public/placeholder.jpg`**, or find it a new reference if one
      is wanted.

The code-demo build left two scratch fixtures, tracked here 2026-08-30
rather than in §2 — they are development furniture, not part of `delirium`.
A third joined them 2026-09-09:

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
- [ ] **Delete `app/about-next/`** once the landing-page exploration for
      `/about` resolves — either it graduates and replaces `/about`, or the
      direction is dropped. Same gate as `excerpt-preview`:
      `notFound()` once `NODE_ENV` is `production`. Source material for the
      draft (Beck's branding deck) lives outside the repo at
      `~/Downloads/personal branding slides/`; the deck itself won't survive
      forever, so anything worth keeping from it belongs in the repo before
      that folder is cleaned up.

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

**2026-09-09, with Beck:** the animations this section is missing — the
`philosophy-animation` collection and `i-think-that-im-human`, whose
writeups end `[ link to animation in bio ]` / "link is in my bio" — are
**YouTube links only**, no local files to source. That collapses 14a and 14b
into one build: whatever renders a performance (14b, decided 2026-09-02) is
the same embed facade these four pointers need. 14a's encoding recipe is
moot for this case but still worth writing down, since the settings
currently on record are wrong for it (see 14a below).

Also confirmed 2026-09-09: **the six existing speedpaint clips stay
self-hosted.** 14b's scoping already said this; it's now measured rather
than assumed. The split is by what the viewer does with the clip, not by
where the file lives — scrub (speedpaint) wants `SpeedpaintPlayer`'s
always-visible scrubber and the native right-click menu (loop/PiP/save)
`media-player.tsx:154-160` deliberately keeps working, which a YouTube
iframe forfeits; watch (animation, performance) is what the iframe is for.
Migrating the speedpaints would also **cost more bytes, not fewer** — a
YouTube embed pulls ~1MB of script against clips that are mostly
1.3–2.1MB — and YouTube re-encodes on upload, destroying the dense-keyframe
tuning scrubbing depends on. No budget pressure either: all six clips total
10.8MB against a 41MB `public/art` and 63MB `.git`; revisit only if the repo
approaches 150–200MB.

**Built, 2026-09-09.** `EmbeddedVideo` (`lib/work.ts`, next to `CodeDemo`) —
a bare `{ youtubeId, aspect }` — and `animationEmbed?: EmbeddedVideo` on
`WorkPiece`, alongside the existing self-hosted `animationSrc`. `hasAnimation()`
now checks either. `AnimationEmbed` (`components/media-player.tsx`, next to
`AnimationPlayer`) is the facade: local poster in the same reserved-aspect
box every player here uses, a plain `<button>` overlay until pressed, and
only then an iframe on `youtube-nocookie.com` with `autoplay=1` — no
sandbox attribute (YouTube's own player needs same-origin access to itself;
sandboxing it breaks playback rather than adding a real boundary, unlike
`CodeDemoFrame`'s local, genuinely untrusted code). `PieceMedia` renders
`AnimationPlayer` or `AnimationEmbed` depending on which field the piece
carries. Verified end to end with a real click in a headless browser: the
poster shows, pressing play mounts `youtube-nocookie.com/embed/RTGjy1jDMyM`,
the real player boots and plays, zero console errors, and the box never
shifts on either side of the click.

**Wired onto `philosophy-animation`'s three pieces** (`privilege`,
`reidentification`, `origins`) — all three share the one clip, matching the
collection's "three scenes from an animation" framing. The video Beck gave
for this is titled **"Honey | Personal Animation feat. Luca Schmidt"** on
YouTube (`RTGjy1jDMyM`), not anything matching "philosophy animation" —
flagged to Beck before wiring it in, given the piece's own subject
(adoption, identity, trauma) and the mismatch was stark enough to be worth a
check rather than a guess. **Confirmed correct by Beck 2026-09-09** — it was
retitled since the piece's 2019 caption was written. The three writeups
themselves (`[ link to animation in bio ]` etc.) are untouched, per the
site's standing rule that imported captions aren't rewritten — only the
`animationEmbed` field was added.

**Still open: `i-think-that-im-human`.** Its writeup ("You can see the final
on YouTube. The link is in my bio!") is still a dead pointer — the video
Beck gave in this pass doesn't match it (see below). Needs its own link from
Beck before it can be wired up the same way.

**New, found in this pass, not yet on the site at all:** Beck also sent
`BM0LXL10B7k`, titled **"Eine Vorstellung | Slam Poem"** on YouTube — real,
on `youtube.com/@beckqing`, but matching no existing piece (it isn't
`i-think-that-im-human`, which is described as an animation, not a poem
reading). Beck confirmed this is a **new piece that doesn't exist on the
site yet**, not a pointer to fill in. It's exactly the "performance" content
TODO's older notes below (readings/talks, audio load-bearing) describe as
unbuilt — a new `WorkPiece` needs a title, description, and tags authored
before this has anywhere to go, and the open questions below (tag
vocabulary, transcript-or-pointer, field-vs-own-piece) are still unresolved.
Deliberately not built in this pass — new authoring, not facade-wiring.

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

---

## 18. `eye-studies` promises a guessing game that doesn't exist — **specced 2026-09-02, not built**

The collection's own `description` has said "a guessing game is coming; for
now, titles are placeholders" since 2026-08-27. Eight paintings withhold their
subjects, four captions are deliberately blank because the original Instagram
text named the animal, and the answer key exists only as a code comment at
[lib/work.ts:1285](../lib/work.ts#L1285). Nothing renders any of it.

**Fully specced in [specs/2026-09-guessing-game.md](specs/2026-09-guessing-game.md).**
Both levels Beck described — spoilered text, and a checked textbox with
hints — ship as one component: the spoiler is the native
`<details>`/`<form>` substrate the enhanced version is built on, so level 1
is what the page *is* with JavaScript off rather than a second thing to
write.

Decided with Beck 2026-09-02: the game lives on the collection page **and**
the piece pages sharing one state; answers are stored **plaintext** (the site
is statically exported, so hashing buys obscurity, not secrecy); a solve
reveals the animal's name plus **a new note Beck writes**, not the withheld
archive caption. The mechanism is a `guess` field any `WorkPiece` can carry —
`april-colors-24/05-colors-from-a-bird` is already a hand-written guessing
game in its own description and is the second customer, deliberately not
converted in this pass.

**2026-09-02, later: the hints and `08`'s answer are settled.** Hints are
**per collection, not per piece** — one two-rung ladder shared by all eight,
because they're about the set. Rung 1 is itself a question, deliberately
unanswered ("what do all these animals have in common?"); rung 2 answers it
("all of these are farmed animals"). That makes rung 2 a *thematic* spoiler,
not just an answer aid — it's what turns eight studies into an argument, and
it's why the ladder renders in the collection header and not only inside a
piece page. `08` is a **tuna**, with `fish` also accepted; it's the one piece
where a class word passes, which is safe only because it's the one fish (three
of the eight are birds, so `bird` could never work the same way).

**2026-09-02, last: the answer table is reviewed, the reveal notes are
postponed, and the reveal gains the reference photos.** Each eye reveals the
Unsplash photograph Beck painted it from, shown beside the study so you can
see the distance between them — which is what makes postponing the notes
safe: the photo *is* the payoff, and the panel is specced to read as finished
without any prose. Credit is required (photographer + Unsplash links), not
because the licence demands it but because `lib/work.ts:827` shows Beck
already crediting photographers by hand, and a reference photo is provenance.

- [ ] **Blocked on Beck for content**, and only on that — the design is
      settled. Needed: **eight reference photos** (1:1 `.webp`, at
      `public/art/eye-studies/reference/`, **filenames numbered not named** —
      spec §6 explains why), **a credit per photo** collected at download
      time, a `prompt`, and replacement copy for the collection description.
      The hints, the answers, and the notes are all off this list.
- [ ] Note this would be the site's **first use of `localStorage`** — spec §5
      has the hydration and failure rules, since there's no existing pattern
      to copy.
- [ ] ARCHITECTURE's "titles stay `01`–`08`" decision is **not** superseded
      by this; spec §7 explains why the game vindicates it.

## 19. Long writing pieces have no way to fold or reorder sections — **specced 2026-09-02, not built**

Fully specced in
[specs/2026-09-sections-folding-logs.md](specs/2026-09-sections-folding-logs.md).
Three primitives: `<Section>` (owns its heading, derives its level from
nesting depth, optionally folds), `<Fold>` (a "read more" tail inside content,
no heading, always starts closed), and `<Log>` (reverses dated entries).

The spec is **deliberately split, and the halves have different blockers**:

- [ ] **`<Section>` and `<Fold>` (spec §2–§4) are blocked on nothing.** They
      close the last of §16's root cause — §16 fixed the *sizes*, but authors
      can still pick a heading level by hand and still do (`first-art-fair.mdx`
      has four author-chosen levels; `note-systems.mdx` uses `#####` as a bold
      label inside a blockquote). A level derived from nesting depth cannot be
      mistyped. `MarketHeader` is deleted in this pass and becomes a `Section`.
- [ ] **`<Log>` (spec §5) is blocked on content** — it exists for Beck's
      costume-design piece (faun, v1 2016 → v4 2023), which is unfinished and
      not in `lib/work.ts`. **The art fair essay is explicitly not
      reorderable** (Beck, 2026-09-02); it folds, its order stays fixed, and
      its narrative interludes stay between markets.
- [ ] **Beck:** whether `note-systems.mdx`'s `##### Digital:` / `##### Analog:`
      become `<strong>` labels or a definition list. Post-scale-change they
      render at body size inside a blockquote, so the distinction is weak now
      as well as semantically wrong.
- [ ] Watch for: 🐐 in the costume piece's title would slip past
      `scripts/check-emoji-subset.mjs`, which only scans `<Item emoji="…">`
      attributes, and fall back to platform colour emoji. Spec §6.

## 20. The hero's "currently" line has no history — **built 2026-09-02**

Specced in [specs/2026-09-now-page.md](specs/2026-09-now-page.md) and built
the same day. `/now` holds that line's present tense and its past;
`lib/now.ts` is the single source of truth that `app/page.tsx` also renders
from, so the hero is no longer a second copy of copy that had been rewritten
for four years with no record kept.

**The backfill is complete** — ten entries, 2022-04 → 2026-08, recovered from
the archived 11ty site plus Beck's own recollection. Worth knowing why that
mattered: the archive's copy trailed the truth by up to **fifteen months**
(the line it shipped in 2024-04 was Beck's 2023-01 state), which is the entire
reason `since` records when a thing was true rather than when it was
published. Spec §1 and §3.

**Scope narrowed 2026-09-02:** the hero's `open to …` line is **not** tracked
(Beck) — it stays hardcoded in `app/page.tsx`. That removed the spec's
snapshot machinery along with it; §5 records what went and when to bring it
back, so a later session recovers the design rather than reinventing it.

**Three live decisions from Beck, after the spec was written:**

- **Footer (§11.G): no.** `/now` is not in `MORE_LINKS` — the hero line is
  the only door in.
- **G3: the `2022-04` entry is real.** Kept as written; not a stale-launch
  artifact to drop.
- **Line 1 dropped from `/now`, on the day of build** — a live call from
  Beck that reverses §0/§5/§11.F's "yes, as the page's h1." The page's `h1`
  is just `now`; `forever a student of art, science, and humanity` does not
  appear there. `STUDENT_OF`'s two-rendering plan in §11.C is moot as a
  result — the export still exists in `lib/now.ts` for the hero, unused by
  `/now`.

**Two more asks, both outside the spec's "what not to build" (§10), taken
live from Beck rather than re-litigated:**

- A `since {month year}` label above the current entry, styled like the
  history rows' date labels. §10 rejected a "last updated" badge on the
  premise it conflicts with §3 (`since` means when it became true, not when
  the site said so) — this reuses `since` itself rather than adding
  publish-date framing, so it doesn't reopen that conflict.
- A subtle "this is a /now page" link to nownownow.com at the foot of the
  page. §10 also rejected this outright ("nobody asked") — asked for
  2026-09-02.

- [x] **Beck, G4 — threads (spec §6).** Beck asked whether repeating and
      continuing focuses can be highlighted; they can, but **not by string
      matching** — exact equality finds three of the nine real continuities
      and would mark `rock climbing` across two adjacent months while showing
      `partner dancing` → `partner acrobatics` as unrelated. So threads are
      Beck's editorial judgment, recorded as substring annotations over the
      verbatim `text`. Needed: a thread id for ~20 of the ~29 items. §6 has a
      six-thread proposal to react to. **Still deferred — the page shipped
      without it.**
- [x] Backfilled text is **transcribed verbatim** — `the Chinese vegan scene`
      keeps its capital, `gaining experience in` is not normalized to today's
      `focused on`, and short entries are not padded to match long ones. The
      one live edit is the current (`2026-08`) entry, updated in place at
      Beck's request to add `vibe coding`.
- [x] Watch for: do not dedupe items that recur (`partner acrobatics` returns
      at `2024-11` after three entries without it), and do not space rows
      proportionally to elapsed time — the seventeen-month 2025 stretch is
      content, not a gap to dramatise. Spec §4 and §10.
- [x] **Audited against the tree 2026-09-02 — spec §11** has the file-by-file
      touchpoints plus the four traps found: `sitemap.ts` has a hardcoded
      `staticRoutes` array `/now` must be added to; `CategoryWord` throws
      outside `HeroWordScatter` so `/now` can't reuse it; a `lowercase` class
      anywhere near entry text silently breaks the verbatim rule (`the
      Chinese vegan scene`); and `new Date('2024-11')` renders as October
      west of Greenwich. All four addressed.

---

## 21. The home page's discipline columns are unusable on a phone — **specced 2026-09-09, partly built**

At 375px the three stacked columns run **~2,550px** — about 3.8 screenfuls to
scroll past three headers and twelve decorative rungs. The 640–767 band
carries the same stack with more room to waste on it, since a column is
~630–660px tall whatever the viewport.

**Fully specced in
[specs/2026-09-narrow-screen-columns.md](specs/2026-09-narrow-screen-columns.md).**
Below ~500px the three pills become control tabs over a single column with
`all work` as the default; from 500 up the three columns sit side by side and
the stacked band is deleted entirely. One DOM switched by CSS, not a JS layout
swap — a JS switch would flash the 2,550px stack before hydration.

**Decided with Beck 2026-09-09**, in the spec's §0: tabs keep their icons
(which forces the row to break in two — `all work` alone above the three
disciplines); `all work` is the label, not `all`; the `all` column takes one
rung from each discipline; a hero word's hover latches the tab while its tap
still navigates; and the gallery pairs into two columns below 640, with
`illustrated` collections staying single (`base: 1`) so verse keeps its
measure.

**Built.** Every section of the spec is in the tree: the tab row and `xs`
regime switch (§2–§8), the gallery's second column with `MasonryColumns.base`
and the `sizes` correction (§9), the deck's two geometries and the responsive
`CollectionMark` (§9.1), the `min-w-0` + `break-words` overflow fix (§9.2),
the rung type scale and `COLUMN`'s `x` entries (§12), and the nav's
`flex-wrap`/`leading-none` (§13). `tsc --noEmit` and `next build` are clean,
208 static pages (unchanged — nothing here adds or removes a route).

A round of live review past the spec's own scope followed: the gallery's
`TextCard`/`HybridCard`/chapbook-deck excerpts were unclamped (falling
through to a piece's full `text` with no hand-set `preview`, towering over
neighboring cards at the paired column), the title row's arrow squeezed
every wrapped line instead of just the last and has since been dropped
entirely, `SiteNav`'s wrapped `work`/`about` pair sat flush-left instead of
against the toggle, and the gallery's card padding/gaps and page margins
didn't share a single scale. All fixed in the same commit.

**One residual, found by testing rather than by reading the spec:** at
exactly 320px, `/work`'s `document.documentElement.scrollWidth` reads 15px
over the viewport — but every element's own rendered box, checked directly,
sits fully inside its card and the viewport; the phantom width traces to
`TextCard`/`HybridCard`'s icon+tag header row (`flex-wrap` was added there,
which fixed the visible layout but not this specific number — a Chromium
quirk where `flex-wrap`'s intrinsic-size bookkeeping for scrollable overflow
doesn't fully track the final wrapped result). No visible symptom at any
width tested; `/` is clean at 320/375/500 and `/work` is clean at 375/500.
Closing it for real means shrinking the Quote icon or `TagPill` padding in
that one row, which is a visual call left to Beck rather than made here.

**Two findings from measuring rather than reasoning**, both recorded in the
spec because they contradict what the code says about itself:

- The rung excerpt is **monospaced** (`.font-brand-italic` sets `MONO: 1`),
  advance measured at ~0.596em. Two lines hold ~54 characters at a desktop
  column, so `lost`'s 66-character preview is **already clipped today** —
  `PieceRung`'s comment that "the excerpt provably can't exceed two lines" is
  false. §12.1.
- The collection deck's taper **inverts** in a paired column: `CARD4_STRIP_PX`
  is a fixed 40px while cards 2 and 3 are percentages, so at a 130px card the
  blank counting card becomes the deepest band. Fixed by a second geometry
  below `sm` (§9.1) — desktop keeps 98/61/40 and the word `pieces` exactly as
  it ships today, which makes a desktop regression as much a failure as a
  phone one.

**Closed on the way through:** the narrow-viewport page overflow. Grid tracks
default to `min-width: auto`, so `grid-cols-2` couldn't shrink below a card's
min-content and the browser was shrinking the whole document to fit. Fixed
with `min-w-0` on the grid tracks plus `min-w-0 break-words` on the card
titles — both halves needed, since `min-w-0` alone just relocates the overflow
into a word spilling out of its own card. Verified clean at 320px. The
residual ~290px floor is `SiteNav`'s own minimum, below every real device;
§13's `flex-wrap` lowers it to ~240px as a side effect. §9.2.

**Open, specced but not built — the gallery's three-across breakpoint.**
Beck, 2026-09-09: three columns should start at ~500 rather than at `lg`. At
1023px today a two-column card is 463px wide, which is a hero image and not
a gallery tile. Specced as
[§9.3](specs/2026-09-narrow-screen-columns.md) of the same file, and it is
the one section of that spec still unbuilt.

- [ ] Move `MasonryGrid`'s three-column query from `lg` to `xs` (500), **and
      re-key every card's narrow dress from the viewport to its own column**
      with container queries. The second half is not optional: `p-3 sm:p-6`,
      the excerpt clamp, `CollectionMark`'s two sizes and the deck's two
      geometries are all keyed to `sm` (640), so moving the count alone puts
      `text-lg` in a 123px measure and re-inverts the §9.1 deck taper across
      640–815. Tailwind v4 does container queries in core — verified against
      this project's own 4.3.3 by compiling a probe, not from the docs.
- [ ] **Beck:** the consequence to sign off on. At three columns a card
      doesn't reach the 256px dress threshold until a ~896px viewport, so
      500–896 is narrow-dressed — every text card clamped to four lines at
      `text-sm`. §9.3's closing section has the fallback if that's too
      austere (a third dress step, not a different column count).
- [ ] Watch the polarity: a container query with no container **never
      matches**, and `WorkPlaceholder` renders in five places with no grid
      above it, the lightbox included. Wide-by-default, narrow-under-query —
      §9.3's trap list and verify item 15.

## 22. Zine viewing doesn't exist as a type — untracked until now (2026-09-09)

`adoption-minizine` (`lib/work.ts:1813`) is one `.webp` whose `description`
says "swipe to read." There is nothing to swipe. This gap wasn't in this
file before — it surfaced during a 2026-09-09 review of what's left on the
site, and had no home in any existing section.

**The source carousel is found.** Ten slides at
`~/Downloads/instagram-beckqing-2026-08-26-ZvYQacRy/media/posts/202207/`
(all 1440×1440, verbatim caption in the export's `posts.json`). That folder
is outside the repo and won't survive forever — importing before it's
cleaned up matters.

**This is a zine special case, not a general carousel-viewer feature.**
Checked by opening the slides: slide 1 (`17977747231537356`) is a whole
page. Slides 2 and 3 (`17954687875910826`, `18305158546022156`) are the
**left and right halves of one wide photograph** — the binder clip and the
red drawing run continuously across the cut. Instagram's square export cropped
the zine's spreads in half, and the pattern isn't uniform: some slides are
whole pages, some are half-spreads. A generic one-image-per-slide pager would
faithfully reproduce that damage — half a drawing, then the other half — which
is exactly the thing a real viewer needs to undo. The ~50 other multi-slide
carousels across the four `instagram-beckqing-*` exports are ordinary
one-image-per-slide posts and are a different, much smaller problem (or no
problem — they already render fine as single-image pieces).

- [ ] **Reassemble the half-spreads** into the wide photos they were cut
      from, as an asset-prep step before any import — this is restoring
      Beck's existing composition, not composing anything new. Worth asking
      first whether the **original uncropped photos still exist**
      somewhere, which would skip this step and be higher quality.
- [ ] **Beck: confirm the pairing and reading order.** The whole-page vs.
      half-page pattern isn't uniform, and which halves belong together is
      authorial knowledge, not something to infer from image similarity.
- [ ] The content model needs **spreads, not pages** as the unit — most of
      this zine reads two pages wide, unlike every other piece on the site.
- [ ] `ImageLightbox` (`components/image-lightbox.tsx:31`) already has
      keyboard paging, wheel, and touch-swipe — reuse it rather than writing
      a second pager, but expect to extend its zoom/fit behavior for a wide
      spread rather than call it as-is on a square tile.
- [ ] **Beck: how does a spread render on a phone?** A two-page spread at
      375px is unreadable at full width. Candidates: page-at-a-time below a
      breakpoint, or pan/zoom within the spread. Same class of problem as
      §21's narrow-screen columns, and probably the same shape of answer —
      one DOM, switched by CSS, not a JS layout swap.
- [ ] Caption and slide order import **verbatim** once the above is decided,
      per the site's standing rule that imported captions aren't rewritten.
