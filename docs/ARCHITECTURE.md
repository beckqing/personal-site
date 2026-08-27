# Architecture

How this site is put together and why. Decisions live here; **what's left to
do lives in [TODO.md](TODO.md)**.

Next.js 16.3, App Router, Turbopack. Fully static — every route prerenders
(199 pages at last build). No database, no CMS, no API routes: content is
TypeScript, images are files in `public/`.

---

## Content model

`lib/work.ts` is the single source of truth for everything on `/work`. It
holds both the data (~30 top-level items, ~163 pieces inside collections) and
the vocabulary that describes it.

**One shape for pieces and collections.** `WorkCollection` is just
`WorkPiece & { pieces: WorkPiece[] }`. A collection and a standalone piece
share a type, which is what lets the same card components, the same detail
layout, and the same lightbox serve both. `isCollection()` narrows between
them.

**Tags are non-exclusive and overlapping.** There are exactly three
disciplines — art, writing, science — and nothing is required to pick one.
Facets subdivide them (`medium` for art, `form` for writing, `field` for
science) and stay hidden in the filter UI until their discipline is selected;
a `theme` facet applies universally. Filtering combines selected tags with
and/or/not, plus free text over title, description, tags, and — for
collections — their children's titles, text, and previews.

**`text` is the written work; `description` is optional.** `text` holds
whatever words the page shows — a whole poem, or the passage quoted from an
essay that lives elsewhere. `description` is an editorial gloss and isn't
guaranteed (e.g. the Mindtober tercets have none — the tercet *is* the
caption). `preview` is a hand-set, 1–3 line pull quote for compact contexts,
falling back to `text` then `description`; its length is deliberate, since a
masonry column gives a taller `preview` more room, and it's never clamped.

**Behaviour is derived, not stored.** How a piece renders is computed from
its tags and fields rather than set by a `type` column:

| Predicate | Means |
|---|---|
| `isTextForward` | carries `text` and no `image` — renders as a quote card, leads with words |
| `isHybrid` | carries both `text` and `image` — both load-bearing, neither a caption for the other |
| `isTextOnly` | a text-forward piece, or a collection made entirely of them |
| `isChapbook` | `collectionLayout` resolves to `'book'` — the page becomes a table of contents and pieces are read as book pages |
| `collectionLayout` | `'book'` (every piece text-forward), `'illustrated'` (every piece hybrid), or `'gallery'` (mixed/other) — overridable per collection via `layout` |
| `hasSpeedpaint` / `hasAnimation` | carries the corresponding video |

Adding a poem to a collection can therefore turn it into a chapbook, and
adding an image to a poem turns it into a hybrid, automatically. That's
intended — tags say what a piece is *about*, fields say what it *has*.

**Images carry their own aspect ratio.** `imageAspect` is applied as an inline
style that overrides a card's default shape, so real artwork renders uncropped
instead of being forced into a grid cell. Where no image exists, a tinted
placeholder is drawn from the piece's discipline tone, watermarked with its
most specific category tag. `thumb` points at a heavily compressed copy, used
only where an image is barely visible (the back cards of a collection stack).

`aspectFor()` hashes a slug into one of four aspect classes — deterministic
pseudo-randomness, so masonry grids look varied but never reshuffle between
renders.

**`VerseBlock`** (`components/work-visuals.tsx`) is the single primitive that
renders written work everywhere it appears — the chapbook reading page, a
hybrid piece's page, and every card face. It splits text into stanzas on a
blank line and each stanza into its own line-blocks, so a wrapped line gets a
quiet 1ch hanging indent and a stanza gap is real margin (`1lh`) rather than a
doubled `<br>`. A stanza over 90 characters with no line break (prose, not
verse) sets upright instead of slanted — but only at reading size;
`context="card"` keeps everything italic, since the quote glyph and tint
already frame a card's text as a quotation.

---

## Routes

| Route | Renders |
|---|---|
| `/` | hero, icon collage, three discipline panels |
| `/about` | tabbed bio (`lib/about-content.ts`) |
| `/work` | the filterable gallery |
| `/work/[slug]` | a collection **or** a standalone piece — branches on `isCollection`, and on `collectionLayout` for the three collection layouts (`book`/`illustrated`/`gallery`) |
| `/work/[slug]/[pieceSlug]` | a piece inside a collection — branches on `isChapbook` |
| `/work/[slug]/read` | a chapbook's every piece on one page, front matter to last poem — only generated for chapbooks. A static segment beats a dynamic sibling, so this resolves ahead of `[pieceSlug]`; safe only while no piece is slugged `read` |

Both detail routes are generated from `generateStaticParams` over `WORK`.
Filter state on `/work` lives in the URL (`?tags=…`), which is why the footer
and the home page's discipline panels can deep-link straight into a filtered
view.

---

## Component layers

- **`work-gallery.tsx`** — the `/work` client island: filter panel, URL state,
  and `WorkCard`, which dispatches to `HybridCard` / `TextCard` / `ImageCard`
  / `CollectionTile`.
- **`work-visuals.tsx`** — the shared pieces those cards (and a collection
  page's own tiles) are built from: `VerseBlock`, placeholders, aspect
  helpers, tag links, prose blocks, the collection stack, chapbook contents,
  and `PieceTile` (dispatching to `TextTile` / `ImageTile` / `IllustratedTile`
  for a collection page's own grid, the same way `WorkCard` dispatches at the
  top level).
- **`media-player.tsx`** — everything video (below).
- **`image-lightbox.tsx`** — full-screen viewing with prev/next across a
  supplied list, so a piece opened from a collection can be paged through in
  place.
- **`masonry-grid.tsx`** — JS column distribution rather than CSS
  `columns`, so tiles can keep DOM order per column. Starts at the widest
  layout so server and first client render agree, then corrects on mount.
  Takes an optional `columns` prop (`{ lg: 3 }` default, `{ lg: 2 }` for an
  `illustrated` collection, whose verse needs more measure than a third of
  the page).

`MasonryGrid` and the gallery are client components; the detail pages are
server components that hand data to small client islands.

---

## Collection stack geometry

The fanned deck behind a collection tile (`CollectionStack` / `ChapbookStack`
in `work-visuals.tsx`) is built mostly on **percentages of the column
width** — never card height, `em`, or px. Card height varies three ways (a
collection's `imageAspect`, a chapbook cover's text length, the breakpoint),
and any offset expressed against height inherits all of them; width is
constant across all three. This is also why the deck uses **percentage
margins, not `translate`** — percentage vertical margins resolve against the
containing block's *width* (the standard box-model rule), where `translate-y`
would resolve against the element's own height.

Each backing card is `position: absolute; bottom: 0`, pushed further down by
a *negative* margin-bottom (`.deck-card` in `globals.css`, driven by inline
`--y`/`--r`/`--hy`/`--hr` custom properties from the `DECK` table in
`work-visuals.tsx` — one source of truth for both the CSS and the
container's reserve, so the two can't drift apart). Anchoring from the
bottom, not the top, is deliberate: a peek is the strip between two bottom
edges, so it comes out exactly its target offset regardless of how tall the
card behind it happens to be. `max-h-full` (`h-full` for a chapbook's
deliberately-blank card 4, which otherwise has zero natural height) clamps a
card taller than the cover, which is what keeps a much-taller backing card
from poking out above the deck.

**Card 4's strip is one fixed exception to the percentage rule: 40px,
always.** Cards 2 and 3 show a proportion of something that scales (artwork
or a poem's own text), so a proportion is the right unit for them. Card 4 is
deliberately blank — it exists only to carry the collection's count pill
(`CollectionMark`, `bottom-2 right-2`) — so its strip is sized to the pill,
not to the deck: `0.5rem` margin + the pill's own `24px` (`px-2.5 py-1
text-xs` → a 16px line box + 4px padding top/bottom) + `0.5rem` margin =
`8 + 24 + 8 = 40px`. Changing `CollectionMark`'s padding, text size, or
inset invalidates this number; it doesn't recompute from anywhere. `DECK`
carries it as a separate `px`/`hpx` field alongside the percentage `y`/`hy`
(`deckLength()` emits `calc(45.5% + 40px)`-style values), so the reserve
calculation can still do arithmetic on the percentage half. Card 4's hover
offset (`hy`) is *derived* — `CARD3_Y + dip(1.5) - dip(0.5)` — rather than a
hand-picked number, so the rest/hover reserve pin stays exact rather than
drifting by a fraction of a percent.

This replaced an 11%-of-width strip, which cleared the pill by only 1.4px at
a 320px phone (and only because tilt happened to swing extra room in on the
right — a standing trap for anyone who flattened the tilts later). The fixed
strip clears by a true 8px at every width, at the cost of the deck no longer
being perfectly scale-invariant: at the 350px column every real breakpoint
renders at, the taper is 98/61/40 (ratio 0.66, indistinguishable from the
11% strip's 38.5px); narrowed to a 320px phone's 280px column it's 78/49/40
(ratio 0.82) — card 4 stops tapering. That's the accepted trade; the
alternative is a clipped pill. The 8px reads exactly at the card's own
centre line; at the pill's corner, where cards 3 and 4's opposed tilts swing
the gap open, clearance runs 10–20px depending on state and width — a wedge,
not a measurement error, and not something to close by flattening card 4's
tilt.

The chrome — a collection tile's title card, and (matching idiom) a
standalone `ImageCard`'s label — is `position: sticky` inside a
tile-spanning wrapper, not `absolute bottom-N`. A collection tile can run
past 900px (a tall chapbook cover plus its deck), taller than many
viewports, so a flow-positioned label can sit off-screen the whole time its
tile is hovered. Sticky keeps it within a margin of the viewport for as long
as any part of the tile is visible. Two things silently disable it: any
`overflow: hidden` between the chrome and the scrollport, and a `transform`
on an ancestor of the chrome (re-anchors the sticky containing block) — the
chrome is a sibling of the image/stack, never a descendant of a card that
carries either.

---

## Media: speedpaints and animations

Two different kinds of video, deliberately presented differently. A
**speedpaint** is a process timelapse you drag through; an **animation** is a
finished piece you press play on and watch.

### Why speedpaints are real video

They were first built as ten extracted still "stages" driven by a custom frame
scrubber. That was reversed: sampling 10 frames throws away ~99% of the
strokes, and "stage N/11" claimed an editorial intent that evenly-spaced
samples don't have. Much of the pleasure of a speedpaint is seeing every
stroke.

**The fix that made real video viable — and it is load-bearing:** every source
had keyframes exactly 5.0s apart. Browsers fast-seek to keyframes while
dragging, so scrubbing the untouched files would have resolved to ~8 distinct
images — no better than the stages, and laggier. Everything was re-encoded
with dense keyframes (`-g` ≈ half the source framerate), measured at
**0.48–0.50s apart on all five clips**, plus `-movflags +faststart` (`moov` at
head on all six files).

CRF was tuned empirically to **33**. An initial pass at CRF 27 produced files
*larger* than the raw sources, because dense keyframes cost real bitrate.
Don't assume a lower CRF is smaller — check the output.

If these files are ever re-encoded, keyframe density is the setting that must
survive.

### Decisions

| Topic | Decision |
|---|---|
| Speedpaint medium | Real video, all five |
| Optimisation | Compress; size matters |
| Animation audio | Kept, muted by default |
| Speedpaint audio | Stripped — zero audio streams on all five |
| Tile indicators | Record-dot corner (speedpaint), play-triangle centre (animation); both can coexist |
| **D1 — speedpaint controls** | Custom, with a scrubber that is **always visible**. Native `controls` auto-hide during playback, which defeats the point. |
| **D2 — Verdant** | **Cropped to a centered square**, matching its `1/1` `imageAspect`, so no aspect override is needed. |
| **D3 — looping** | No `loop` attribute. Loopable via the browser's native right-click menu — implemented by *not blocking it*: no `controlsList`, no full-bleed click-catcher over the video. |

> **On D2's history.** An earlier version of the build log recorded D2 as
> "ship uncropped, full 9:16, downscaled to 540px wide, 50.5s" and described a
> resulting poster/aspect mismatch as an inherent consequence. None of that
> matched what shipped; the decision was reversed during the build and the log
> was never corrected — the wrong text and the square-cropped file landed in
> the *same commit* (`c8e1c51`). Recorded here so it isn't rediscovered as a
> regression. The `object-contain` rule it motivated is still in the code and
> still reasonable as a general guard; only its stated reason is obsolete
> (TODO §3).

### What ships

Six clips, **10.8MB total**.

| Clip | Dimensions | Duration | Size |
|---|---|---|---|
| `portfolio-22/child-not-adult` | 720×896 | 42.13s | 2.1MB |
| `portfolio-22/presidential-pardon` | 720×896 | 38.90s | 1.7MB |
| `portfolio-22/lady-bird` | 592×736 | 43.00s | 1.4MB |
| `portfolio-22/projection` | 720×720 | 40.48s | 1.4MB |
| `april-colors-24/17-verdant` | 720×720 | 49.47s | 3.6MB |
| `2019/i-think-about-god` (animation) | 640×640 | 15.08s | 796KB |

The four screen-recorded portfolio pieces are cropped to their app-canvas
rects, verified stable across each clip's full duration (not spot-checked) via
5-frame drift strips. Verdant is the outdoor, handheld one — the camera is
locked off through the painting, then lifts and pans to the real artichoke —
so it got a loose centered square that holds for the whole clip instead of a
tight page-only rect that the pan would break.

### Components

- **`SpeedpaintPlayer`** — a real `<video>` with no `controls`; an
  always-visible play/pause button and a persistent tone-colored timeline.
  The timeline is driven by `requestAnimationFrame`, not the `timeupdate`
  event, which fires in ~4 coarse steps a second — too choppy for a bar meant
  to read as continuous. The element is deliberately left unrestricted so the
  native context menu keeps working on top of the custom controls; that is the
  entire implementation of D3.
- **`AnimationPlayer`** — native `controls`, muted by default. A portfolio
  page shouldn't start making noise because someone pressed play; unmuting is
  one click away.
- **`PieceMedia`** — the single entry point both detail routes call. Renders
  animation and speedpaint **additively** (each labeled when a piece has both)
  rather than as an either/or, which is what made "both" an unreachable case
  before. Always ends with a "view still image" trigger, since neither video
  substitutes for seeing the finished image full-screen.
- **`MediaBadges`** — the gallery-tile indicators.
- **`ImageLightbox`** takes a `bare` prop that drops the full-bleed hover scrim
  and "view" pill, so it can be triggered from a compact link.

`PlayerFrame` is shared by both players so they can't drift apart visually.

### The hydration race worth knowing about

The browser can finish loading video metadata **before React hydrates** and
attaches `onLoadedMetadata`. That native event never replays for a listener
attached after it fired, so `duration` stayed `0` and the scrubber's `max` was
stuck — confirmed with Playwright, where `video.duration` read `40.48` at the
DOM level while React state read `0`.

`SpeedpaintPlayer` therefore reads `videoRef.current.duration` directly in a
mount-time effect as a fallback, and also listens for `onDurationChange` as a
second event-based path. Don't remove either; each covers a case the other
misses.

---

## Theming

`next-themes` with `attribute="data-theme"`, dark by default, system detection
off. `enableColorScheme` is off because `color-scheme` is declared per theme in
`globals.css` instead of being set via JS on every toggle.

The toggle animation runs on the **View Transitions API**
(`ThemeTransitionProvider`), not CSS transitions — an orange wash fades in,
holds, and fades out over the page cross-fade the API handles itself.

Colors are CSS custom properties in `app/globals.css`, defined per theme. Two
families matter:

- `--art` / `--writing` / `--science` — the discipline tones that tint cards,
  chips, and accents.
- `--hero-icon-*` and `--hero-accent-*` — separate values for the homepage
  collage and panels. These exist because the tag colors read dull or muddy
  against the hero's background; e.g. `--hero-icon-writing` is a goldenrod
  rather than a lighter pumpkin, and `--hero-accent-art` brightens to sky in
  dark mode where denim disappears. The gallery's discipline wash reuses the
  `--hero-icon-*` set so it reads as the same light source as the hero.

Tailwind classes must appear **literally** in source — its scanner can't see
`text-${name}`, so accent classes are written out in full (see the `PANELS`
array in `app/page.tsx`).

Fonts: Recursive (variable, with `CASL`/`MONO`/`slnt` axes — the `font-brand`
and `font-brand-italic` utilities) and Noto Sans, both via `next/font/google`.

---

## Homepage icon collage

`data/icons-raw.json` holds raw SVG path data for the scattered brand icons;
`lib/brand-icons.ts` normalizes it into `BrandIcon[]`. Each icon is tagged
with one or more categories (`art` / `hu` / `sci`). Hovering a discipline word
in the hero copy lights the matching icons and brings the matching panel
forward — shared through `HeroWordScatter`'s context, so the words, the
icons, and the panels stay in sync without prop-drilling.

---

## Conventions

- Path alias `@/*` → repo root.
- shadcn (`base-nova`, neutral base, CSS variables) with lucide icons. Only
  `button` and `dialog` are vendored into `components/ui/`.
- Comments explain **why**, not what — several of them record decisions that
  look wrong without the context (the rAF polling, the hydration fallback, the
  literal Tailwind classes). Keep that habit.
- Copy taken from Instagram posts is used **verbatim**, never paraphrased.
