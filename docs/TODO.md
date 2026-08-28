# TODO

Open work only. Design decisions, structure, and the record of what's already
built live in [ARCHITECTURE.md](ARCHITECTURE.md).

Last reconciled against the tree 2026-08-27 (third pass, re-audited after the
implementation landed). `tsc --noEmit` clean; `next build` clean, 203 static
pages, TypeScript now actually validated during the build.

Almost everything from the previous pass is closed. §1 and §2 were always
blocked on Beck rather than on code; §4–§6 are small items that were dropped
from this file during the implementation pass without actually being done, and
are restored here rather than lost.

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

The hero copy's `science` word, the homepage's third discipline panel, and
the footer's `science` link all go to `/work?tags=science`, and no item
anywhere in `lib/work.ts` carries the `science` tag — the gallery renders its
empty state. Ten tags in the filter vocabulary have zero matching items today
(`science`, `oil`, all four `field` tags, and four of the six `theme` tags).

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
