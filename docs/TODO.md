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

**Specced 2026-08-28:** §9, §10, and §12 are fully designed in
[specs/2026-08-essays-viewer-sort.md](specs/2026-08-essays-viewer-sort.md) —
decisions taken, interfaces, edge cases, and what's out of scope. Build from
that document, not from the summaries here. §11 is deferred by Beck.

**2026-08-28:** §9–§11 added from Beck's review — the three imported essays
lost their structure and links (§9, checked against the archived originals),
the lightbox and the single-piece view look like the same thing (§10), and two
WIP screenshots are shipping as standalone finished pieces (§11). None are
started.

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

## 7. About tab glyphs want to become small illustrations — **Beck draws this**

`TabGlyph` (`components/tab-glyph.tsx`) currently places one or two doodles in
disjoint sub-regions of a 32×32 badge, all in a single `currentColor` accent.
Beck wants them **larger, in several colours, with the outlines overlapping** —
closer to a small illustration or profile icon than an icon.

**The visual authoring is Beck's** — which doodles pair, their placement,
rotation, and per-doodle colour. Beck drew the set and may draw more. Recorded
here rather than mocked up.

Two mechanism findings from 2026-08-28, so the drawing work isn't blocked on
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

## 9. The three essays were flattened on import — **structure and links lost**

> **Specced:** [specs/2026-08-essays-viewer-sort.md](specs/2026-08-essays-viewer-sort.md)
> workstream A. Format decided: MDX under `content/essays/`.

**Checked against the originals 2026-08-28.** The archive
(`github.com/beckqing/archived-personal-site`, `posts/*.md`) still holds all
three as Markdown. Answering Beck's question directly: **all three were
rewritten, not just the art fair one.** Every one lost its heading structure,
its non-paragraph blocks, and every external link, and the prose itself was
re-worded rather than re-wrapped.

The mechanical cause is one component. `Prose`
(`components/work-visuals.tsx:619`) is `text.split('\n\n').map(p => <p>)` —
paragraphs and nothing else. `writeup` is a plain `string` on `WorkPiece`, so
there is nowhere for a heading, a list, a blockquote, a display block, a link,
or an inline image to *live*, let alone render. **Restoring the essays means
giving `writeup` a richer shape first** — MDX, a small block union
(`{ kind: 'heading' | 'verse' | 'list' | 'quote' | 'image' | 'prose' }`), or
Markdown parsed at build time. That decision gates all three items below.

Note that `VerseBlock` already exists and is the right primitive for
line-preserving display text — it just isn't reachable from a `writeup`.

- [ ] **Decide the `writeup` block format.** Everything else here is blocked
      on it.

### 9.1 `chinese-emoji-poetry`

- [ ] **The poems belong in display blocks, not inline prose.** The original
      has two `<center>` blocks, each: emoji title glyph, the emoji stanza,
      the Chinese title, then the Chinese source poem. The import mashed each
      into one run-on paragraph joined by `→`. Beck's note: the usual poetry
      format is casual/monospace/italic (`VerseBlock`), **but the CJK and
      emoji blocks likely want upright and centred instead of slanted** —
      italic CJK is a synthesized oblique, and emoji ignore the slant
      entirely. Probably a `verse` block with a centred, non-italic variant.
- [ ] The Google Translate output was a **blockquote** of four lines; it is
      now an inline double-quoted sentence run together with the paragraph.
- [ ] **Four links were dropped**: *19 Ways of Looking at Wang Wei* (Google
      Books), the MDBG dictionary query, the Unicode CLDR emoji list, and the
      full-emoji-list link behind "varies from platform to platform".
- [ ] Smaller losses: the closing `(This is a modified version…)` was `<small>`,
      book titles were italicised, and the original's aside "(currently
      building this)" about a platform-comparison tool was cut.

### 9.2 `first-art-fair`

- [ ] **Headings.** Three `##` sections — "How it started", "Type II Fun",
      "Third time's the charm?" — plus an `####` pair repeated per market:
      "+ things that went well" / "Δ things to change for next time" (shortened
      to "+ good" / "Δ for next time" for markets two and three). All three
      markets are now indistinguishable walls of paragraph.
- [ ] **The emoji bullets.** `<ul class="emoji-bullet">`, each item
      `emoji + <i>label.</i>` in a mono span, then the explanation — 🎯 *I did
      it!*, 🎪 *booth layout.*, 🚗 *travel logistics.*, ⌛ *practice & setup
      time.*, 🌬 *wind.*, 🏷 *labels.*, 💳 *pos.*, 🥣 *food.*, 👋 *me.*, and so
      on. Markets two and three reuse the same labels, which is the whole
      point: **the repeated vocabulary is how the three markets compare across
      the season.** Two rows are label-only shorthand (`🎯 profit. 📌 layout.
      🚗 transport.`) meaning "same as before, no notes" — that reads as
      nothing at all once flattened into a sentence.
- [ ] **Blockquote.** The Brighton Bazaar application pitch was a quote block.
- [ ] **Market header blocks.** Each market is introduced by its name, hours,
      and date on their own lines ("stART on the Street / 11-6 Sunday 18
      September 2022"). Those dates are gone entirely from the current text.
- [ ] **Links dropped**: StART on the Street, StART at the Station, Brighton
      Bazaar (Instagram), Hassle Flea. Also lost: *delirium*, the name of the
      interactive piece demoed at Hassle Flea, now just "an interactive art
      piece".
- [ ] **Images — this is new work, not restoration.** The original only ever
      had bracketed placeholders: `[ when a woman ] [ mother earth ] [ fire
      protection ]` (the three works submitted with the application),
      `[ photos of setup sketch and practice ]`, `[ photos of actual setup ]`
      for stART, `[ photos of my sketched setup ]` and `[ photos of my setup ]`
      for Brighton Bazaar, and `[ flyer contest ]` for Hassle Flea. **No image
      files exist in the archive for any of them.** Of the three application
      works, two are already in `lib/work.ts` — `hthtpw/01-mama-earth` and
      `april-colors-19/10-fire-protection` — so those can be cross-linked
      rather than re-uploaded; "when a woman" is not in the tree at all. The
      booth and setup photos are the ones that would have to come from
      Instagram. Note the archive also captions the first row ("The three
      works I submitted with my application") in `<small>` — captions are part
      of the block format decision above.

### 9.3 `note-systems`

Beck asked whether the others were rewritten too. This one is the clearest yes.

- [ ] **Headings.** Three `#` sections — ANALOG, DIGITAL TOOLS, THE GOAL —
      with two `##` subsections under the second (handwriting /
      non-handwriting). All gone.
- [ ] **The opening summary block.** "Current setup as of January 2023 —" is
      followed by a blockquote containing two `#####` headings (Digital: /
      Analog:) each over a bulleted list. The import turned that structured
      at-a-glance summary into one comma-spliced sentence, which is exactly
      the content that most wanted to stay a list.
- [ ] **Every tool link dropped** — TickTick, Google Calendar, Samsung Notes,
      OneNote, Nebo, Squid, Bamboo Paper, Infinite Painter, Todoist, Notion,
      Trello.

### 9.4 Cross-cutting

- [ ] **`inktober-17` is the fourth import worth re-checking.** The archive's
      `projects/inktober-2017.md` carries per-image alt text via
      `{% galleryImage %}` (Swift, Divided, Poison, …) and a `<small>` "(Last
      updated 20 January 2023.)" line. Not audited against `lib/work.ts` yet.
- [ ] **Decide the fidelity rule going forward.** The rewrites smoothed Beck's
      voice — contractions normalised, exclamation points removed, asides
      folded into clauses. Given the standing rule that Instagram captions
      must be Beck's verbatim text, the essays should almost certainly be
      restored from the archive Markdown rather than re-edited from the
      current strings.

## 10. Single-piece view and the lightbox look like the same thing

> **Specced:** [specs/2026-08-essays-viewer-sort.md](specs/2026-08-essays-viewer-sort.md)
> workstream B. Decided: immersive lightbox, scroll down flies the image home.

Opening the lightbox from a piece's own page barely changes what's on screen,
so the interaction doesn't announce itself as a mode change.

The two are genuinely near-identical: the piece page renders the image through
`PieceMedia` at `max-w-3xl` with title, meta line, and text below
(`app/work/[slug]/[pieceSlug]/page.tsx:196`); the lightbox renders the same
image `contain` at `max-h-[65vh]` over a `bg-background/96` backdrop, with a
centred category · discipline · year line, the title, and an `n / total`
counter under it (`components/image-lightbox.tsx:110`). Same background
colour, same caption fields, similar image size — the scrim is 96% opaque, so
even the page behind it doesn't read as "still there".

**Beck's ask: make scrolling down inside the lightbox return to the regular
single-image page view** — YouTube's theater mode, where the scroll gesture
demotes the immersive view back into the page rather than trapping you in a
dialog you have to dismiss.

- [ ] Decide what the two modes should each look like once they're
      distinguishable. The lightbox should probably get *more* immersive
      (bigger image, less chrome, a real scrim) so the difference is obvious
      before the scroll gesture is what has to explain it.
- [ ] The scroll-to-exit gesture itself. Base UI's `Dialog` locks body scroll
      while open, so the wheel/touch handler and the transition out are both
      on us. Worth checking whether this should reuse the View Transitions
      setup the theme toggle already uses (see §8's note on the root-level
      `::view-transition-*` rules and their 600ms duration).

## 11. Three WIP screenshots are shipping as standalone finished pieces — **deferred by Beck**

> Direction is process-stills on the finished piece; details to be talked
> through. Sketch and open questions in
> [specs/2026-08-essays-viewer-sort.md](specs/2026-08-essays-viewer-sort.md)
> workstream D. **Don't implement it yet.**

Both confirmed by opening the files 2026-08-28 — these aren't near-duplicates,
they're in-progress captures of pieces that also ship finished.

- [ ] **`hand-study` is the WIP for `desire-and-distance`.**
      `public/art/portfolio-22/hand-study.webp` is a screenshot of the drawing
      app with the tool palette and layer panel still in frame; the hand in it
      is the same hand, same pose, as the finished `desire-and-distance.webp`.
      Beck's name for it is "the anatomy of a hand".
- [ ] **`waterfowl-and-motherhood` is the WIP for `child-not-adult`.** Same
      story: app chrome, layer panel, and two mallard reference photos around
      an in-progress duck that is the finished duck at the right of
      `child-not-adult.webp`.
- [ ] **There is no process-still slot to fold them into.** `WorkPiece` has one
      `image`, plus `speedpaintSrc`/`animationSrc` for video — and both of these
      finished pieces already carry a speedpaint. Options: add a
      `process`/`stills` field, make each finished piece a small collection, or
      simply drop the WIPs. Whichever it is, the fix is the same shape as the
      duplicate handling this file has otherwise avoided needing.
- [ ] **A third: `security-camera`.** Found by sweeping all 24 standalone
      images 2026-08-28 — also an in-app capture (toolbar, perspective-grid
      guides, red construction lines, canvas cropped at the right edge). Its
      surveillance/halftone subject is close to `why-be-afraid` but the
      composition isn't obviously the same, so **whose WIP it is, is a question
      for Beck.** Those three are the only standalone images carrying app
      chrome — the sweep is done, the list is complete.

## 12. The gallery has no sort at all — **specced, not built**

> **Specced:** [specs/2026-08-essays-viewer-sort.md](specs/2026-08-essays-viewer-sort.md)
> workstream C.

`filterWork` filters and returns items in array order; `WorkGallery` renders
that straight into `MasonryGrid`. So `/work` shows **whatever order
`REAL_WORK` happens to be in**, which is only loosely chronological:
collections first (2020, 2019, 2024, 2017, 2019, 2019…), then standalone art
roughly ascending 2019 → 2024, then all four writing items last. `april-colors-24`
sits third in the gallery; `inktober-17` fourth.

**There is no upload date in the data.** `year` is the only temporal field — a
4-character string for when the *work* was made, not when it reached the site —
so "sort by when it went up" needs a new field before it can be an option.

- [ ] `sortWork(items, mode)` in `lib/work.ts` with
      `curated | newest | oldest`; `curated` is identity and stays the default,
      ties break by authored position.
- [ ] A cycle control beside the venn toggle, with `?sort=` in the URL on the
      same terms as `?mode=` (default omitted, unknown values fall back).
- [ ] **Beck:** if "recently added" is wanted, that needs an `added` date
      backfilled onto items. The field is specced; no item carries one, so the
      mode shouldn't appear until some do.
