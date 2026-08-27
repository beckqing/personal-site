# Speedpaint + animation media — build log

**Status: built and verified.** All phases from the original task queue are
complete. This document is now a record of what was decided and built, plus
the handful of items intentionally left for later.

## Context (why it's shaped this way)

Speedpaints were first built as **extracted still "stages"** driven by a
custom frame scrubber. That was **reversed by decision**: speedpaints are
**real video**, because much of the pleasure of a speedpaint is seeing every
stroke, which 10 sampled stills can't give you.

**Why the stage approach was abandoned:** sampling 10 frames throws away
~99% of the strokes, and "stage N/11" claimed an editorial intent that
evenly-spaced samples don't have.

**Why naive "just use the source video" would also have failed:** every
source had **keyframes exactly 5.0s apart**. Browsers fast-seek to keyframes
while dragging, so scrubbing the untouched files would have resolved to only
~8 distinct images — no better than the stages, and laggier. **The videos
were re-encoded with dense keyframes** (~0.5s apart, verified on every output
file) — this was the load-bearing fix that made the video route viable.

## Decisions

| Topic | Decision |
|---|---|
| Speedpaint medium | Real video, all five |
| Optimisation | Compress; size matters |
| Animation audio | Kept, muted by default |
| Speedpaint audio | Stripped (no audio in any of the five sources' final use) |
| Tile indicators | Record-dot corner (speedpaint), play-triangle centre (animation), both can coexist |
| **D1 — speedpaint controls** | Custom, with a scrubber that's **always visible** (not native `controls`, which auto-hide) |
| **D2 — Verdant** | Keep the reveal + pan to the real plant; ship **uncropped, full length** (this makes the earlier page-crop rect inapplicable — see below) |
| **D3 — looping** | No `loop` by default; loopable via the **browser's native right-click menu** (Chrome/Firefox both expose "Loop" there for free on a plain, unrestricted `<video>` — no code needed, just don't block it) |

---

## What was built

### Assets
- Removed the stage-based JPEGs (51 files) and their fields/component/CSS.
- Transcoded all 6 videos: dense keyframes (`-g` ≈ half the source framerate),
  `-movflags +faststart`. The four screen-recorded pieces (`projection`,
  `presidential-pardon`, `lady-bird`, `child-not-adult`) are cropped to their
  app-canvas rects, verified stable across each clip's **full duration** (not
  just spot-checked) via 5-frame drift strips per video — worth doing, since
  the earlier pass had only spot-checked one frame each.
- **Verdant is the one exception**: shipped uncropped (full 9:16) and full
  length (50.5s) per D2, since the page-crop rect derived for its locked-off
  painting segment is wrong for the camera pan at the end. Downscaled to
  540px wide (still 1080p+ equivalent for its container size) to offset the
  size cost of keeping the longer, uncropped clip.
- CRF tuned empirically (33) after an initial pass at CRF 27 produced files
  *larger* than the raw sources (dense keyframes cost real bitrate — don't
  assume, verify actual output size).
- Final payload: **9.0MB** (`portfolio-22/speedpaint/`, 4 clips) + **4.0MB**
  (`april-colors-24/speedpaint/`, Verdant) + **796KB** (animation) ≈ **13.8MB**
  total across 6 clips — down from 15.2MB raw despite Verdant being shipped
  whole rather than trimmed.

### Data model (`lib/work.ts`)
- `speedpaintFrames` / `speedpaintFinal` / `frameAspect` → replaced by
  `speedpaintSrc` + `speedpaintAspect` (only set where it actually differs
  from `imageAspect` — true only for Verdant, 9/16 vs. its posted 1/1 photo).
- `hasSpeedpaint`/`hasAnimation` repointed at the new field; `speedpaintStages`
  helper removed, `speedpaintAspect()` helper added.

### Components
- **`SpeedpaintPlayer`** (new) — real `<video>`, no `controls`; a small
  always-visible play/pause button plus a persistent, tone-colored timeline
  (`<input type="range">`, custom-styled, driven by `requestAnimationFrame`
  rather than `timeupdate` for smoothness). Deliberately unrestricted (no
  `controlsList`, no full-bleed click-catcher) so the browser's native
  right-click menu still works on top — that's the entire implementation of
  D3.
- **`AnimationPlayer`** — unchanged in spirit: native `controls`, muted by
  default.
- **`PieceMedia`** (new) — the single place both detail pages call into.
  Renders animation and speedpaint **additively** (both, if a piece has both,
  each labeled) rather than the old either/or ternary that made "both" an
  unreachable case. Always ends with a small "view still image" trigger into
  a `bare`-mode `ImageLightbox`.
- **`ImageLightbox`** gained a `bare` prop — skips the full-bleed hover scrim
  and "view" pill for a compact trigger, used by `PieceMedia`'s still-image
  link.
- Both detail pages (`app/work/[slug]/page.tsx`,
  `app/work/[slug]/[pieceSlug]/page.tsx`) now call `PieceMedia` instead of
  duplicating the branch — fixes the lightbox regression (all 6 media pieces
  can view the still image full-screen again; the Verdant collection page can
  browse to adjacent pieces from it) and the both-players gap in one place.

### Two bugs found during build/verification (not anticipated in the original plan)

1. **Hydration race on `duration`.** The browser can finish loading video
   metadata before React hydrates and attaches `onLoadedMetadata` — confirmed
   via Playwright (`video.duration` was correctly `40.48` at the DOM level
   while React state stayed at the initial `0`, so the scrubber's `max` was
   stuck at `0` and dragging did nothing). Fixed by reading `videoRef.current.duration`
   directly in a mount-time `useEffect` as a fallback, plus added
   `onDurationChange` as a second event-based path.
2. **Poster/aspect mismatch on Verdant.** Its poster is the posted square
   photo; its player box is 9:16 (a direct consequence of D2). Browsers'
   default poster-vs-video-frame rendering isn't consistent, so this was made
   explicit (`object-contain` on the `<video>`) rather than left to chance.
   Confirmed by screenshot: the poster letterboxes at rest (expected — fitting
   a square into a 9:16 box always leaves space), and actual video frames
   fill edge-to-edge once playing (since the real footage genuinely is 9:16).
   This is inherent to shipping Verdant uncropped, not a bug to chase further.

### Accessibility
- `MediaBadges` announces itself via `sr-only` text ("Includes a speedpaint
  video." / "…an animation." / both) — verified present in the DOM.
- Play-triangle hover pulse wrapped in `@media (prefers-reduced-motion: no-preference)`
  — verified the `@keyframes` rule is genuinely absent from the stylesheet
  under `reducedMotion: 'reduce'` emulation (not just spot-checking a computed
  style, which reports the assigned animation-name either way regardless of
  whether it resolves to anything).
- `SpeedpaintPlayer`: play/pause is a real `<button>` with `aria-pressed`;
  the range has `aria-label`, `aria-valuetext` (time-based, not stage-based),
  and `aria-describedby` pointing at the visible `M:SS / M:SS` readout;
  `:focus-visible` ring on the thumb via `--ring`.

### Verified end-to-end (Playwright)
- Play/pause via the custom button actually starts/stops the `<video>`.
- Timeline reflects real playback position and updates smoothly.
- Keyboard seeking (arrow keys, End) moves `currentTime` correctly.
- Native context menu is reachable (no click-catching overlay intercepts it);
  no `loop` or `controlsList` attribute present.
- Animation player: native controls present, starts muted.
- "View still image" opens the full lightbox on both a standalone piece and a
  collection piece (with correct prev/next context preserved).
- `tsc --noEmit` clean throughout.

---

## Left for later (none blocking)

- **Non-null assertions** (`piece.animationSrc!`, `piece.speedpaintSrc!`) —
  down to 2 occurrences total now (both in `PieceMedia`, both immediately
  guarded by `hasAnimation`/`hasSpeedpaint` a few lines above), vs. 4 spread
  across two files before. A typed narrowing helper would remove them
  entirely but isn't load-bearing.
- **`HybridCard` never renders `MediaBadges`** — no such piece exists today;
  add if one ever needs it.
- **The two near-identical Presidential Pardon sources** (reel 39.12s vs.
  carousel-embedded 39.00s) — the reel was used; never diffed against the
  carousel copy to confirm they're frame-identical.
- **Verdant's page-crop rect** (`470:627:0:175`, derived for the locked-off
  0–43s segment) is unused now that D2 shipped the clip uncropped — kept only
  in this doc's history, not in code, in case a cropped cut is wanted later.
