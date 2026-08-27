# Architecture

How this site is put together and why. Decisions live here; **what's left to
do lives in [TODO.md](TODO.md)**.

Next.js 16.3, App Router, Turbopack. Fully static — every route prerenders
(198 pages at last build). No database, no CMS, no API routes: content is
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
collections — their children's titles.

**Behaviour is derived, not stored.** How a piece renders is computed from
its tags and fields rather than set by a `type` column:

| Predicate | Means |
|---|---|
| `isTextForward` | tagged `poem` or `essay` — renders as a quote card, leads with words |
| `isTextOnly` | a text-forward piece, or a collection made entirely of them |
| `isChapbook` | a text-only collection — the page becomes a table of contents and pieces are read as book pages |
| `isHybrid` | `hasImage` on a text-forward piece — see TODO §4, this path is currently dead |
| `hasSpeedpaint` / `hasAnimation` | carries the corresponding video |

Adding a poem to a collection can therefore turn it into a chapbook. That's
intended.

**Images carry their own aspect ratio.** `imageAspect` is applied as an inline
style that overrides a card's default shape, so real artwork renders uncropped
instead of being forced into a grid cell. Where no image exists, a tinted
placeholder is drawn from the piece's discipline tone, watermarked with its
most specific category tag. `thumb` points at a heavily compressed copy, used
only where an image is barely visible (the back cards of a collection stack).

`aspectFor()` hashes a slug into one of four aspect classes — deterministic
pseudo-randomness, so masonry grids look varied but never reshuffle between
renders.

---

## Routes

| Route | Renders |
|---|---|
| `/` | hero, icon collage, three discipline panels |
| `/about` | tabbed bio (`lib/about-content.ts`) |
| `/work` | the filterable gallery |
| `/work/[slug]` | a collection **or** a standalone piece — branches on `isCollection` |
| `/work/[slug]/[pieceSlug]` | a piece inside a collection — branches on `isChapbook` |

Both detail routes are generated from `generateStaticParams` over `WORK`.
Filter state on `/work` lives in the URL (`?tags=…`), which is why the footer
and the home page's discipline panels can deep-link straight into a filtered
view.

---

## Component layers

- **`work-gallery.tsx`** — the `/work` client island: filter panel, URL state,
  and `WorkCard`, which dispatches to `HybridCard` / `TextCard` / `ImageCard`
  / `CollectionTile`.
- **`work-visuals.tsx`** — the shared pieces those cards are built from:
  placeholders, aspect helpers, tag links, prose and excerpt blocks, the
  collection stack, chapbook contents.
- **`media-player.tsx`** — everything video (below).
- **`image-lightbox.tsx`** — full-screen viewing with prev/next across a
  supplied list, so a piece opened from a collection can be paged through in
  place.
- **`masonry-grid.tsx`** — JS column distribution rather than CSS
  `columns`, so tiles can keep DOM order per column. Starts at the widest
  layout so server and first client render agree, then corrects on mount.

`MasonryGrid` and the gallery are client components; the detail pages are
server components that hand data to small client islands.

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
