# Architecture

How this site is put together and why. Decisions live here; **what's left to
do lives in [TODO.md](TODO.md)**.

Next.js 16.3, App Router, Turbopack. Fully static — every route prerenders
(204 pages at last build, including a generated `sitemap.ts` and
`opengraph-image.tsx`). No database, no CMS: content is TypeScript, images
are files in `public/`.

Verified against the tree 2026-08-27. Where the code and this document
disagree, the disagreement is recorded here and tracked in
[TODO.md](TODO.md) rather than quietly smoothed over.

---

## Content model

`lib/work.ts` is the single source of truth for everything on `/work`. It
holds both the data (30 top-level items — 9 collections and 21 standalone
pieces — with 163 pieces inside the collections) and the vocabulary that
describes it.

**The vocabulary is deliberately wider than the data.** Eleven of its tags
currently match nothing: `science` (the discipline itself), `oil`, all five
`field` tags (`biology`, `neuroscience`, `material science`, `dataviz`, and
`code`), and four of the six `theme` tags. `code` was added 2026-08-29 ahead
of the work that will carry it — see "Code demos" below.

`science` is the load-bearing one — the hero copy and the homepage's third
panel both link to `/work?tags=science`, which renders the empty state today.
(The footer carried a third such link until 2026-08-28, when it was simplified
down to three icon links plus a disclosure of everything else — see "The
footer" below.) **Decided: the vocabulary stays.** Science is core to what this site is
about; the work simply hasn't been uploaded yet. Don't prune the tags, don't
hide the chips, and don't re-frame the three-discipline structure to match a
temporarily two-discipline dataset — the gap closes by adding work, not by
narrowing the vocabulary. Tracked in [TODO.md](TODO.md) §2 as content to add,
not as a design flaw to fix.

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
and/or/not, plus free text over title, description, and tags — and, for
collections only, their children's titles, descriptions, `text`, and
`preview`.

**The gallery's default order is editorial.** `/work` renders `lib/work.ts`'s
authored array order, and `sortWork`'s `curated` mode is identity — it is a
real choice, not an accident, so it is the default and stays out of the URL.
`newest`/`oldest` sort on `year` (when the work was made — there is no upload
date in the data) and break ties by authored position, so Beck's order
survives inside each year.

That last asymmetry was a bug, not a design: an item's **own** `text` and
`preview` used to go unsearched, so a line of a Mindtober tercet was findable
(it belongs to a child of a collection) while the same line in a standalone
essay's pull quote was not. Fixed 2026-08-27 — `filterWork` now searches an
item's own `title`, `description`, `text`, `preview`, and tags, the same four
text fields (plus tags) it already searched on children — the haystack is
uniform across items and children.

**`text` is the written work; `description` is optional.** `text` holds
whatever words the page shows — a whole poem, or the passage quoted from an
essay that lives elsewhere. `description` is an editorial gloss and isn't
guaranteed (e.g. the Mindtober tercets have none — the tercet *is* the
caption). `preview` is a hand-set, 1–3 line pull quote for compact contexts,
falling back to `text` then `description`; its length is deliberate, since a
masonry column gives a taller `preview` more room, and it's never clamped.

In practice only the chapbook uses it: `love-worth-heartbreak` sets `preview`
on all 22 poems, and nothing else in the tree sets one. The other 34 pieces
carrying `text` fall through to the full `text` inside an `overflow-hidden`
card face — fine while those are Mindtober tercets, but the "never clamped"
guarantee only actually holds where a `preview` was written.

### Essay bodies are MDX; everything else is a string

`writeup` holds a plain string rendered as paragraphs by `Prose` — right for
the ~20 short process notes that make up almost every write-up on the site.
Three essays needed more than paragraphs: headings, emoji-bullet lists,
blockquotes, centred verse blocks, and external links. Rather than grow
`writeup` into a markup dialect, those bodies live as MDX in
`content/essays/<slug>.mdx` and render through the components in
`components/essay.tsx`. A code demo's write-up takes the same rung of that
ladder from `content/code-demos/<slug>.mdx`; both directories resolve through
the one map in `lib/mdx-bodies.ts`. `components/essay.tsx` and `EssayBody`
keep their names — they are the essay *typography*, and a demo's write-up
wants exactly that typography.

**Why MDX and not a richer string or a typed block union:** the source of
truth for all three is Markdown in the archived 11ty site, so MDX keeps the
import close to a copy, which is the whole point — these essays were flattened
and re-worded once already because the target couldn't hold the source (see
the "imported content is never rewritten" rule below). Hand-transcribing them
into a TS block union would have reintroduced exactly that transcription step.

**The server/client boundary is load-bearing.** `lib/work.ts` is imported by
four client components (`work-gallery`, `image-lightbox`, `media-player`,
`code-demo-frame`), so it stays plain serializable data — no component
references, ever. The MDX map lives in `lib/mdx-bodies.ts`, imported only by
the two server page files. `lib/work.ts` carries `MDX_BODY_SLUGS`, a list of
plain strings, so the client-side `hasWriteup()` can still badge an essay
without importing the MDX runtime; `lib/mdx-bodies.ts` asserts the two agree
at build time.

That constraint is also why a code demo is `{ src, aspect }` plain data over
an iframe rather than a component reference — see "Code demos" below.

`mdx-components.tsx` at the repo root is required by `@next/mdx` under the App
Router, and in Next 16 its `useMDXComponents` **takes no arguments** — older
examples pass and merge a `components` parameter. `md`/`mdx` are deliberately
absent from `pageExtensions`: essays are imports, not routes.

**`eye-studies` pieces are titled `01`–`08` on purpose.** Decided 2026-08-27:
the numbering stays. The collection is a guessing game — the caption text
often names the animal, so titles that named the subject would give it away.
Four of the eight also carry no `description`, which is the same choice, not
missing data. (The earlier "Subject hidden for now. Title coming soon."
placeholder copy *was* a leftover and is gone.) Don't "fix" these into
descriptive titles.

**Behaviour is derived, not stored.** How a piece renders is computed from
its tags and fields rather than set by a `type` column:

| Predicate | Means |
|---|---|
| `isCodeDemo` | carries `codeDemo` — its subject is a thing that runs, so the page leads with the running thing. Checked *before* the image branch: a code demo also carries `image` (its poster), so a later branch would silently render it as a plain image piece |
| `isTextForward` | carries `text` and no `image` — renders as a quote card, leads with words |
| `isHybrid` | carries both `text` and `image` — both load-bearing, neither a caption for the other |
| `isTextOnly` | a text-forward piece, or a collection made entirely of them |
| `isChapbook` | `collectionLayout` resolves to `'book'` — the page becomes a table of contents and pieces are read as book pages |
| `collectionLayout` | `'book'` (every piece text-forward), `'illustrated'` (every piece hybrid), or `'gallery'` (mixed/other) — overridable per collection via `layout` |
| `hasSpeedpaint` / `hasAnimation` | carries the corresponding video |

Adding a poem to a collection can therefore turn it into a chapbook, and
adding an image to a poem turns it into a hybrid, automatically. That's
intended — tags say what a piece is *about*, fields say what it *has*.

**What the rules actually resolve to today**, since several branches read as
live but aren't:

| Layout | Collections |
|---|---|
| `gallery` | `hthtpw`, `april-colors-19`, `april-colors-24`, `inktober-17`, `i-think-that-im`, `philosophy-animation`, `eye-studies` |
| `illustrated` | `mindtober-21` (31 hybrid pieces) |
| `book` | `love-worth-heartbreak` (22 text-forward pieces) |

No collection sets `layout` explicitly — every one of them is derived. All 31
hybrid pieces in the tree are Mindtober's, and they render through
`IllustratedTile`; there are **zero top-level hybrids**, so `WorkCard`'s
`isHybrid` branch and the `HybridCard` it dispatches to are unreachable today.

**Decided: keep `HybridCard`.** It is deliberately kept ready for the first
standalone piece that carries both `text` and `image` — not dead code to be
swept up. The predicate that reaches it (`isHybrid`) fires the moment such a
piece is added, with no other change. Anything doing a dead-code pass should
skip it; the same goes for `lib/work.sample.ts` and `SHOW_SAMPLE_WORK`, kept
for testing filters and card layouts against a larger, more varied dataset.

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
Filter state on `/work` lives in the URL (`?tags=…`), which is why the home
page's discipline panels can deep-link straight into a filtered view. One
consequence worth naming: a deep link is only as good as the tag behind it,
and `?tags=science` currently deep-links into an empty gallery (TODO §2 —
content, not a bug; see "Content model" above).

**`sitemap.ts` and `opengraph-image.tsx`** are generated (added 2026-08-27) —
the two file conventions judged worth having for a 204-page linked portfolio.
`robots.ts`, `not-found.tsx`, and `error.tsx` are deliberately still absent:
Next's default `/_not-found` already covers the not-found case, and nothing
has asked for the other two.

`beckqing.com` is the real domain (confirmed 2026-08-27), which is what
`sitemap.ts`'s `BASE_URL` and `layout.tsx`'s `metadataBase` are pinned to, and
what the footer's `hello@beckqing.com` uses.

**Every social link in `lib/about-content.ts` was supplied by Beck**, not
inferred from handle patterns — treat them as data, and don't "correct" one
that looks like it should follow a different convention. **There is no
Twitter account** — the `twitter` entry the v0 scaffold shipped was removed
2026-08-27 because it never corresponded to anything, and Beck confirmed
2026-08-28 it was aspirational, not forgotten. Don't restore it. `behance` and
`dribbble` were `href: '#'` placeholders with `soon: true`; removed 2026-08-28
at Beck's request rather than left as dead chips — re-add them once they're
real destinations, not before.

### The footer

`SiteFooter` (`components/site-footer.tsx`) was rebuilt 2026-08-28 to match a
design Beck had already built and validated on the archived 11ty site
(`_includes/components/footer.njk` / `site-footer.css`) — a centered stack of
three icon links (email, instagram, linkedin), a `<details>` disclosure of
everything else, and a copyright line. The archive's own disclosure was
present in CSS but commented out in markup; this is that design finished, not
invented.

No brand mark, no bio line, no `/work?tags=…` deep-links — all deliberately
cut, not overlooked. The mark would be a second copy of what the sticky header
already shows (see "The brand mark" above); the bio line was scaffold copy
Beck never wrote; the discipline deep-links were the footer's only reason to
need a second column, and removing them let the whole thing collapse to one
centered column, which was the actual ask ("cleaner layout").

`MORE_LINKS` is a small hardcoded array in the component, not derived from
`lib/about-content.ts` — the footer's disclosure is a deliberately curated
subset (no behance/dribbble/kofi/twitter, no duplicate of the email/instagram/
linkedin icons above it), so treating `about-content.ts` as its source of
truth would mean filtering it back down to the same list. `LinkedinIcon`
(`components/linkedin-icon.tsx`) reuses the archive's exact validated path —
lucide-react v1 dropped brand icons, same reason `InstagramIcon` is
hand-rolled.

## Build configuration

`next.config.mjs` is **empty, deliberately.** Both v0 scaffold defaults were
removed 2026-08-27 and neither should come back without a reason:

- **`typescript.ignoreBuildErrors: true`** — removed. The tree typechecks
  clean, so it bought nothing and hid the next regression. `next build` now
  actually reports "Running TypeScript" instead of skipping it.
- **`images.unoptimized: true`** — removed, i.e. **Next Image Optimization is
  on.** Approved by Beck 2026-08-27. This is the site's biggest performance
  lever: `public/art` is 41MB across ~200 files, and unoptimized a gallery
  tile rendered at ~460px still downloads the full-resolution original (up to
  ~560KB), thirty at a time on `/work`. Both `next/image` call sites already
  pass a correct `sizes` (`work-visuals.tsx`'s placeholder and the homepage
  polaroid), so responsive srcsets work as intended.

Two things that follow from image optimization being on:

- **The deploy target must run the Next image optimizer** — native on Vercel,
  handled by Netlify's Next runtime. It breaks only on a purely static host,
  or if someone adds `output: 'export'`. There is no deploy config in the
  repo, so this is an assumption worth re-checking if the host changes.
- **SVG through `next/image` 400s by default** (it needs
  `dangerouslyAllowSVG`). `app/page.tsx`'s `featuredArt.image ||
  '/placeholder.svg'` fallback is therefore a trap that did not exist while
  images were unoptimized — dead today, since the featured piece always has a
  real image. See TODO.

## The brand mark

**The mark is the `bq` monogram. The crescent moon is retired.**

Built 2026-08-27: `BrandMark` (`components/brand-mark.tsx`) replaces
`MoonLogo` at all three call sites it had then — `components/site-nav.tsx`,
`components/site-footer.tsx`, and `app/page.tsx`'s hero — and
`components/moon-logo.tsx` is deleted. Beck's preference is strong and
settled; don't reintroduce the moon anywhere.

**The footer dropped its `BrandMark` again 2026-08-28**, not as a reversal of
the above — the header is `position: sticky` (`site-nav.tsx`), so the mark is
already on screen at all times and a second copy in the footer was pure
redundancy. `BrandMark`'s only call sites today are the sticky header and the
homepage hero.

The `--moon` CSS token stays: `ThemeToggle` uses it (`bg-moon/10`) and it is
unrelated to the logo.

### The monogram

Interlocking `b` and `q` with a white counter and an indigo wedge. It is
**already Beck's own work** — it shipped on the archived 11ty site
(`github.com/beckqing/archived-personal-site`), so it isn't being introduced
here, it's being restored.

Its palette is not merely *similar* to this site's tokens, it *is* them:

| Colour | Share | Token | Role |
|---|---|---|---|
| `#ced2cd` | 54.7% | `--moon` / `--foreground` (dark) | the rounded-square field |
| `#080b24` | 20.3% | `--foreground` (light) / `--background` (dark) | the letterforms |
| `#ffffff` | 3.6% | — | the `b`'s counter |
| `#0c3559` | 2.0% | `--indigo` (both themes) | the wedge |
| `#69635e` | 1.9% | `--muted-foreground` (light) | where `b` and `q` overlap |

Outside the rounded square is fully transparent.

Note the `b`'s counter is a **crescent**. Retiring `MoonLogo` therefore doesn't
lose the moon — the monogram already contains one, which is presumably where
the crescent avatar came from in the first place.

### Source: `docs/brand/`

The vector original is in the repo. `docs/brand/bq-logo-artboard.svg` is Beck's
Figma artboard (`nSrYPqfF0aNuJSPrwxE3Lk`, node `210-2`) — 1100×150, six
variants plus a construction cell, exported 2026-08-27. `docs/brand/variants/`
holds each one split out as a standalone 150×150 file.

These are **source assets, not wired into the app.** They live in `docs/`
deliberately: the app should import a component built from them, not reach into
this directory. Kept in-repo because a design that exists only in a working
tree is one `rm` from being gone — as `COLLECTION-FORMATS.md` demonstrated.

The archive's raster (`static/img/bq-logo.png`, root `favicon.ico`) is now
superseded by these and needed only as a historical reference.

### The geometry

Four strokes and three counters, all `stroke-width: 11` on a 150 viewBox
(≈2.3px at 32px), `stroke-linecap: round`:

| Path | What |
|---|---|
| `M31.18 15 …` | the `b`'s ascender |
| `M121.77 28.39 …` | the `q`'s stem |
| `M95.79 102.47 …` | the bowl — filled, this is the **crescent** once the wedge crosses it |
| `M102.48 84.21 …` | the wedge |
| `M89.89 94.11 …` | the bowl/wedge overlap, a separate hand-drawn path rather than a boolean op |

### Construction: mask the bowl, don't overpaint it

The crescent is not a drawn shape — the bowl path is a full teardrop, and the
crescent is only what's left after the wedge crosses it. The artboard's own
variants get this by **overpainting**: filling the wedge and the small overlap
path with an opaque colour so they visually cover the part of the bowl they
cross. That works, but only on a flat, known ground — overpaint with the wrong
colour and the "cut" is gone; overpaint with `fill="none"` (the intuitive
reading of "leave it uncoloured") and nothing cuts the bowl at all, so the
mark renders as a solid blob with a line through it, and the moon disappears.
An early pass hit exactly this treating "don't colour the other counters" as
"unfilled."

**Built instead as an SVG `<mask>`:** the bowl path is the mask's white
(visible) layer, the wedge path is the mask's black (subtractive) layer, and
the bowl is filled with real colour *through* that mask. The crescent is now
an actual shape with real negative space — verified over a patterned ground,
where the overpaint version shows a solid wedge and the masked version shows
the ground through it. This is what `docs/brand/variants/light-gold.svg` and
`dark-crescent.svg` use. It composites correctly regardless of what's behind
it, which the overpaint approach never guaranteed.

### Current variant set

`docs/brand/variants/`:

| File | Construction | Ground | Ink | Crescent |
|---|---|---|---|---|
| `stroke` | outline only, no fill | any | `currentColor` | — |
| `light-field` | Beck's original, overpaint | pale `#CED2CD`, `rx=27` | `#080B24` | white bowl, `#0C3559`/`#69635E` overpaint |
| `light-gold` | masked | none (page bg) | `#080B24` | `#D9AA52` |
| `dark-crescent` | masked | none (page bg) | `#CED2CD` | white |
| `favicon-moon` | masked, crescent only — no stems, no wedge outline | denim `#305789`, circle | — | white |

Retired during this pass, superseded by the masked versions above:
`light-warm`, `dark-pale`, `dark-denim`, `dark-pale-white-crescent`,
`light-field-nofield`, `favicon-denim-open`, `favicon-denim-crescent`. Their
reasoning is preserved below where it's still relevant (the dark-mode
contrast tradeoff) or superseded outright (the favicon direction — see
"Favicon" below).

### Assignment, and why

Verified by rendering each candidate at 16 / 32 / 64 / 150px on its real
ground — not eyeballed at one size and assumed to hold at others.

- **Header + footer, 32px → `stroke`, `currentColor`.** Confirmed legible:
  bowl, wedge and both stems stay distinct. Goes soft at 16px, which is one of
  two reasons the favicon is a different treatment rather than this scaled
  down (the other is below).
- **Hero, 64px → the masked, filled variants.** Counters lose definition
  below ~48px, so the hero is the only place the colour treatment earns
  anything.
  - *light mode:* **`light-gold`** — goldenrod crescent, wedge and overlap
    left as the page ground. Decided 2026-08-27.
  - *dark mode:* **`dark-crescent`** — white crescent, pale-slate letterforms.
    This resolves a real tradeoff measured against the artboard's two dark
    drafts: `dark-denim` had the white crescent but `#305789` letterforms lost
    contrast against `#080B24` (muddy at 32px, soft even at 64px); `dark-pale`
    held contrast but its indigo bowl wasn't a crescent at all — no cut, no
    moon. `dark-crescent` takes the pale letterforms and adds the mask, so it
    isn't a compromise between the two, it gets both properties at once.

### Favicon: a different glyph, not a smaller mark

**Decided 2026-08-27, after testing at real tab size.** `favicon-moon` — the
crescent alone, no stems, no wedge outline, white on a `#305789` denim field
(originally `rx=27`, recentered onto a circular field 2026-08-28 — see
below).

The full monogram was tried first and does not survive 16px, for a structural
reason rather than a colour or weight one: `stroke-width: 11` on a 150
viewBox is ≈1.2px at 16px, below what anti-aliasing renders as a line — and
that's before accounting for four strokes threading close together (two
stems, the bowl outline, the wedge outline) plus a crescent notch cut into one
of them. That's topology suited to 64–150px, not 16.

Two fixes were tried and both failed, instructively:

- **Heavier stroke** (20, then 28 on the same 150 viewBox) didn't rescue
  legibility — at 16px the +20 pass still read as the same smear, and +28
  fused the strokes into a blob *before* the letterforms became readable.
  Weight can't win against crossing topology; there's no stroke width where
  "four lines crossing near a notch" resolves into "distinct b and q" at 16
  physical pixels.
- **A solid outline silhouette** (all four paths, very heavy, no crescent cut)
  failed the same way from the opposite direction: fattening the strokes
  enough to read as solid shapes also closed the counters, so the one hole
  giving the shape interior structure was gone too.

**The fix that worked is reduction, not compression** — the standard resolution
in identity systems for this exact problem. A primary mark and a small-format
glyph are usually different drawings, not one drawing at two sizes: Twitter's
bird carries no wordmark at favicon size, Slack's icon isn't a shrunk
logotype. Here the reduction is free rather than invented, because the
crescent isn't decorative — it's what the b and q's overlap literally
produces (see "Construction" above) — so isolating it doesn't abandon the
monogram's idea, it's the one piece of it that was always legible alone.

### Favicon: recentered onto a circle (2026-08-28)

**The original `favicon-moon.svg` was never actually laid out.** Its crescent
was the monogram's bowl path left at the bowl's own coordinates (translated
into frame with a bare `translate(-380, 0)`), which is where the bowl sat
*inside the full monogram*, not where a standalone favicon's one subject
belongs. Measured against the tile: the crescent's true bounding box was
40.2% × 46.1% of the canvas, centered 18px left and 39px low on a 256px
render — a 15% downward drift, invisible at 256px, illegible at 16.

Fixed by measuring the crescent's real bounding box (rendered at 2048² for
sub-pixel accuracy: center ≈ `(445.04, 98.55)` in the mask's own coordinate
space, height ≈ `69.51`) and solving the transform that centers it in the
150×150 tile at 67% of the tile's height — up from the accidental ~46%. That
scale increase is also a crispness win on its own: at 16px it takes the
crescent's thinnest limb from ~2px (below where anti-aliasing renders a clean
edge) to ~3.2px.

**The field became a circle, not a rounded rect, same pass.** `rx=27` had no
motivating reason once the layout was being redone — a corner radius is a
second, competing detail at 16px, jaggy and semi-random next to the subject,
where a circle has no corners to render badly. Confirmed at 16/24/32/48/64px:
the circle reads as a moon at every size the rounded rect didn't.

**`app/icon.svg` was added, not just the raster set.** Next resolves it ahead
of `app/favicon.ico` in Chromium and Firefox, and being a vector it's crisp at
any size — the ICO is now effectively a Safari/legacy fallback rather than the
primary asset. `docs/brand/variants/favicon-moon.svg` and `app/icon.svg` are
kept byte-identical; the latter is the one Next actually serves.

**`app/apple-icon.png` keeps the old rounded-rect logic's opposite: a square,
full-bleed field, not a circle.** iOS applies its own squircle mask to
apple-icons — a circle inside that mask renders as a shrunken dot with dead
corners, so the field there stays a plain unrounded square at the same
recentered scale.

### One geometry, three levels of detail

Decided 2026-08-27. The mark is not treated identically everywhere, because
the three places it appears are asking different things of it — but it is one
geometry throughout, varying only in how much of its internal detail is
carried. Keep it that way; three *drawings* would be three logos.

The constraint underneath this: the indigo wedge is 2.0% of the mark's pixels
and the `b`/`q` overlap is 1.9%. At 32px those are 3–4px features and cannot
render. Detail is spent where there are pixels to spend it on.

| Context | Size | Treatment |
|---|---|---|
| **favicon** | 16–256px | Keeps a field: **denim ground (circular, since 2026-08-28), white letterforms.** |
| **header / footer** | 32px | **Monotone silhouette or stroke**, `currentColor`. No field, no internal colour. |
| **hero** | 64px | **Field-less, counters filled**: the `b`'s crescent in white, the other two counters in a subtle tone. |

**Why the favicon keeps a field and the page doesn't.** A browser tab has no
theme context — the surrounding chrome may be light or dark and the page can't
know, so the mark has to supply its own ground to stay legible either way. On
the page that problem doesn't exist: the ground is known, and the mark's own
`#ced2cd` field sits almost exactly on light mode's `#e7eae4` background,
where it nearly vanishes.

> **The page treatment diverges from the archive; it does not restore it.**
> The archived site shipped the mark *with* its field, in both themes.
> Field-less on the page is a deliberate decision. Do **not** "correct" the
> field back in on the grounds that the archive has it — this is the one place
> where checking the archive gives the wrong answer.

### Token mappings

Every colour in the artboard is already a site token, so the component swaps
literals for `var()` rather than inventing a palette:

| Literal | Token |
|---|---|
| `#CED2CD` | `--foreground` (dark) / `--moon` (dark) |
| `#080B24` | `--background` (dark) / `--foreground` (light) |
| `#0C3559` | `--indigo` |
| `#305789` | `--denim` (= `--art`) |
| `#69635E` | `--muted-foreground` (light) |
| `#D9AA52` | `--goldenrod` |
| `#8C3623` | `--terracotta` |
| white | stays literal white — it is the moon, and reads as a highlight against light mode's `#e7eae4` rather than vanishing into it |

An earlier draft of this section proposed deriving the counters with
`color-mix(in srgb, var(--foreground) 30%, var(--background))`. That is
superseded: Beck had already drawn the per-theme colourways, and drawn values
beat derived ones here.

**What `BrandMark` actually reads is two tokens, not the table above.** Ink is
`var(--foreground)` in `filled` mode and `currentColor` in `stroke` mode; the
crescent is **`--brand-crescent`**, a token added for this and defined per
theme in `globals.css` — `#d9aa52` light, `#ffffff` dark. That collapses the
whole light/dark colourway switch into one custom property rather than
branching in the component.

`--brand-crescent` is deliberately *not* `--goldenrod`: light-mode
`--goldenrod` is `#97671a`, darkened for text legibility, while the crescent
wants the artboard's brighter `#d9aa52`. Same reasoning as `--hero-icon-*`
existing alongside the discipline tones. Don't collapse the two.

### Favicon — a new asset, not the archive's file

`public/icon.svg`, `apple-icon.png`, and the two 32×32 PNGs are v0 scaffold —
`icon.svg` is the stock Next.js black/white template with
`prefers-color-scheme` fills. They are also inert where they sit, because
icons are `app/` file conventions (`app/icon.*`, `app/apple-icon.*`,
`app/favicon.ico`) rather than `public/` files, and `metadata.icons` is unset.
So the site currently ships no favicon at all. All four get deleted.

The replacement is **generated from the vector**, not copied from the archive:
the archive's `favicon.ico` is pale-slate ground with midnight letterforms,
which is not the decided treatment. Produce `app/favicon.ico` (and a 180×180
`app/apple-icon.png`) with a denim-or-indigo ground and white letterforms.

The collage icons need no work: `data/icons-raw.json` is byte-identical to the
archive's `_data/icons.json`. Only the favicon set was ever v0's.

This section records the 2026-08-27 decision to generate rather than copy; the
geometry it produced was corrected 2026-08-28 (see "Favicon: recentered onto a
circle" above) and `app/icon.svg` was added alongside `app/favicon.ico` and
`app/apple-icon.png`.

---

## Component layers

- **`work-gallery.tsx`** — the `/work` client island: filter panel, URL state,
  and `WorkCard`, which dispatches to `HybridCard` / `TextCard` / `ImageCard`
  / `CollectionTile`. `HybridCard` is currently unreached — no top-level item
  carries both `text` and `image`.
- **`work-visuals.tsx`** — the shared pieces those cards (and a collection
  page's own tiles) are built from: `VerseBlock`, placeholders, aspect
  helpers, tag links, prose blocks, the collection stack, chapbook contents,
  and `PieceTile` (dispatching to `TextTile` / `ImageTile` / `IllustratedTile`
  for a collection page's own grid, the same way `WorkCard` dispatches at the
  top level).
- **`media-player.tsx`** — everything video (below), plus `MediaBadges`, the
  tile indicators for video *and* for a runnable code demo.
- **`code-demo-frame.tsx`** — the client island a code demo runs in: the
  workbench chrome, the sandboxed iframe, the autorun/pause policy, and the
  page↔demo message contract (see "Code demos").
- **`excerpt.tsx`** — SERVER ONLY. Shiki-highlighted code excerpts for an MDX
  body. Kept out of `essay.tsx` (and so out of `mdx-components.tsx`'s global
  map) so only the bodies that actually show code pull the highlighter into
  their graph; import it from the `.mdx` file, like `<Item>` and
  `<MarketHeader>`.
- **`image-lightbox.tsx`** — full-screen viewing with prev/next across a
  supplied list, so a piece opened from a collection can be paged through in
  place. It renders whatever list it's handed; **scoping that list to pieces
  that actually carry an image is the caller's job**. `imageLightboxSlice()`
  (`lib/work.ts`) is that one place — `ImageTile`, `IllustratedTile`, and the
  piece detail route (`app/work/[slug]/[pieceSlug]/page.tsx`) all call it
  rather than each re-deriving the filtered list and index (fixed 2026-08-27;
  the piece detail route used to pass `collection.pieces` unfiltered).
- **`masonry-grid.tsx`** — JS column distribution rather than CSS
  `columns`, so tiles can keep DOM order per column. Starts at the widest
  layout so server and first client render agree, then corrects on mount.
  Takes an optional `columns` prop (`{ lg: 3 }` default, `{ lg: 2 }` for an
  `illustrated` collection, whose verse needs more measure than a third of
  the page). The "server and first client render agree" claim is about column
  *widths*, which the responsive template handles; reading *order* before
  hydration on a narrow viewport is still the wide layout's round-robin
  (1, 4, 7, 2, 5, 8, …) collapsed into one column.

`MasonryGrid` and the gallery are client components; the detail pages are
server components that hand data to small client islands.

Vendored but unused: `components/ui/button.tsx` and `components/ui/dialog.tsx`
are imported nowhere — `ImageLightbox` talks to `@base-ui/react/dialog`
directly. So is `components/doodle-field.tsx`, superseded by
`IconScatterField`, and `WashiTape` / `PushPin` in `collage.tsx` (only
`StampBadge` is live).

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
as any part of the tile is visible.

**What actually disables it: `overflow: hidden` on any ancestor, and nothing
else.** Nothing between the chrome and the scrollport may clip — not the
tile wrapper, not the `Link`, not the stack's outer or inner box. This is why
`ImageCard`'s corner rounding lives on its image wrapper rather than on the
`<article>`: the article's old `overflow-hidden` would have killed sticky
outright.

**A `transform` on an ancestor does *not* disable it** — verified in a browser
on 2026-08-27. An earlier version of this document (and the design spec behind
it) claimed a transformed ancestor re-anchors the sticky constraint; it
doesn't. `ImageCard` ships `transition-all hover:-translate-y-0.5` on the
`<article>` that is a direct ancestor of its sticky chrome, and the chrome
still tracks the viewport correctly. That holds together: the chrome's
containing block is the `absolute inset-0` wrapper either way, and a transform
creates a containing block for absolutely positioned descendants without
creating a scrollport. Recorded explicitly so the 2px hover lift isn't
"fixed" back out of `ImageCard` on the strength of the old rule.

The one transform rule that *is* real is about containment, not disabling: the
chrome must stay a **sibling** of the image/stack rather than a descendant of
a deck card, since a card's own box would then clamp how far the chrome can
travel. The deck's cards all carry rotations; the chrome is never inside one.

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
> still reasonable as a general guard; its comment (`components/media-player.tsx`)
> was rewritten 2026-08-27 to state that general reason instead of citing
> Verdant, since Verdant no longer has the mismatch that motivated the rule.

**Two source files were never diffed.** The reel version (39.12s) and the
carousel-embedded version (39.00s) of the Presidential Pardon speedpaint are
near-identical; the reel is what shipped. Neither is wrong — recorded here so
the unreviewed duplicate isn't mistaken for an open question.

### What ships

Six clips, **10.8MB total**. Every number in this section was re-verified with
`ffprobe` on 2026-08-27 and holds: dimensions and durations as tabled,
keyframes 0.49–0.50s apart on all five speedpaints, `moov` ahead of `mdat` on
all six files, zero audio streams on the speedpaints and one on the animation.

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
  `PieceView` (`app/work/[slug]/page.tsx`) returns early for a text-forward
  standalone piece without calling `PieceMedia` at all, so a poem that ever
  carried an animation would render no media. No such piece exists today;
  recorded here so it isn't rediscovered as a mystery rather than a
  known, currently-unreachable gap.
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

## Code demos

Built 2026-08-29 from
[specs/2026-08-coding-explorations.md](specs/2026-08-coding-explorations.md)
(the filename keeps the spec's original working title), which stays in
`specs/` rather than moving to `history/` because its §8 — the home page's
science panel — is deferred until Beck's first code demo exists. Read that spec for the reasoning; this section records the shape.

A **code demo** is a `WorkPiece` carrying one extra field, `codeDemo`. It is
the fourth kind of piece the site renders, and it is defined by what it leads
with: an image piece leads with the finished image, a text-forward piece with
the words, a hybrid with both, and a code demo with **a thing that runs**. It
is not a new "project" concept — search, tags, sort, the collection machinery,
metadata, the sitemap, and `?tags=science` deep links all work with no
special-casing.

**The first one is `delirium`** (2026-08-29) — Beck's underwater illustration
with a gooey SVG cursor that reveals a second painting underneath it, d3 and
p5 driving particles through an SVG mask. Transcribed from Beck's own
`github.com/beckqing/whims`, which was a later revision than the CodePen pen
it also exists as. Two things were changed bringing it in, both recorded in
the file's own header comment: the two illustrations were pulled off
DeviantArt's CDN (the URLs carried expiring JWTs, so the piece would have gone
blank on its own) and re-encoded PNG→webp, 8.6 MB down to 0.56 MB at full
2160×2160; and d3/p5 were vendored beside it rather than fetched from a CDN,
which is provisional — see TODO §2.

It carries `art` as well as `science` and `code`, which the spec advised
against. That was Beck's call: the piece is their own illustration, and the
denim tone is honest about that even though it costs the emerald that would
flag science finally having work in it. `primaryDiscipline()` was **not**
changed — it still iterates `DISCIPLINES` in its own order, so `art` wins from
any tag position, and `first-art-fair` is unaffected.

**The name is `code demo`, decided by Beck 2026-08-29.** The spec drafted these
as "coding explorations" whose runnable artifact was a "sketch"; both are gone.
"Sketch" was the worse of the two on a site where the same word means a pencil
drawing — `lib/work.ts` still contains Beck's own writeups about pencil
sketches and sketchbooks, and the collision was real.

**A code demo is a sandboxed iframe over a self-contained file in
`public/code-demos/`, not a React component.** Four reasons, in order of how
load-bearing they are:

1. `lib/work.ts` may never hold a component reference (see "The server/client
   boundary is load-bearing"). `{ src, aspect }` is plain data and needs no
   parallel-list indirection at all — unlike `MDX_BODY_SLUGS`, which exists
   purely as a workaround for that same constraint.
2. Exploratory code is exactly the code that deserves a real boundary. An
   infinite loop or a stray `document.body` mutation takes the page down if it
   shares the document.
3. Demos bring their own libraries (p5, three, a shader loader). In an
   iframe each loads its own dependencies lazily and the site bundle never
   grows.
4. Authoring stays one HTML file, and the artifact stays portable — the
   standalone link in the frame's state rail is just the file.

The cost is that a demo inherits none of the page's theme tokens, which is
what the handshake below is for.

**The poster reuses `image` / `imageAspect`.** A demo's `image` is a still
capture of it running, so every existing card, placeholder, aspect helper,
lightbox slice, and OG image path works unchanged. `codeDemo.aspect` is separate
and required: the frame reserves its box from it before the iframe exists, so
booting a demo never shifts the page. The two are normally equal — kept
apart because a card is showing a picture and the frame is reserving a canvas,
and a cropped poster is allowed to diverge.

**`CodeDemoFrame` is `PlayerFrame`'s sibling, not a copy of it.** A video is
a recording you watch; a code demo is a machine you switch on, so the chrome reads
as a workbench: a state rail above (tone dot, entry filename in the mono axis,
standalone link), the surface between, a control rail below (run/pause,
reseed when `codeDemo.seedable`, fullscreen). Controls are real `<button>`s in
the rails and never overlaid on the surface — the surface belongs to the
demo, and an overlay would swallow its own interactions.

**Fullscreen uses the native Fullscreen API on the frame wrapper, not a
dialog.** `ImageLightbox` can be a dialog because an image has no state to
lose; reparenting an iframe into a portal *reboots* the demo and throws away
whatever it has drawn. Requesting fullscreen on the existing wrapper keeps the
same iframe alive.

### The runtime contract

`sandbox="allow-scripts"` and nothing else — deliberately **without**
`allow-same-origin`, since with both flags a same-origin iframe can reach
`parent.document` and the boundary is fiction. The consequence is real and is
not an oversight: the demo runs in an opaque origin, so it has no
`localStorage` and cannot `fetch` its own data files. A demo needing data
inlines it. Adding a flag reopens the decision; it is not a quiet fix.

Messages use `postMessage` with `targetOrigin: '*'` — required, because an
opaque origin never matches a specific one. Page → demo: `code-demo:theme`,
`code-demo:pause`, `code-demo:resume`, `code-demo:reseed`. Demo → page:
`code-demo:ready`, once. A demo that never sends `ready` still works — the
frame reveals itself after a 2s timeout — and one that ignores `pause` just
burns its own cycles.

**Theme is delivered twice**, as a `?theme=` query param at boot *and* as a
message on every toggle. Same belt-and-braces shape as `SpeedpaintPlayer`'s
duration fallback, for the same reason: the param is what a demo reads
before it has a listener attached (and what themes the standalone URL), the
message is what keeps a running demo in sync. The iframe's `src` is frozen at
boot and never recomputed — changing it would reboot the demo.

**Autorun**: run on first intersection (~25% visible), pause on leaving, pause
on `document.hidden`. `codeDemo.manual` opts out. `prefers-reduced-motion:
reduce` suppresses every autorun regardless of `manual` — the poster is a
complete experience for that reader, and the run control is still there.

### Tiles deliberately do not run

`WorkCard` gains no `CodeDemoCard`: a demo's poster is an `image`, so
`ImageCard` already renders it correctly. The only thing missing is the signal
that it runs, which is a third `MediaBadges` pill (lucide `Binary`, sharing
the top-right corner row with the speedpaint pill). Thirty tiles would
otherwise be thirty iframes and thirty rAF loops, and content that boots
asynchronously would make the masonry heights depend on it — exactly the
layout instability `MasonryGrid` exists to avoid. Hover-to-run on a single
tile was considered and rejected: no touch equivalent, and an iframe's boot
cost lands as a stutter right at the moment of hover.

### Annotated excerpts

Opt-in per piece and interleaved with the prose, never a section the layout
reserves. There is no `excerpts: []` schema — a piece that wants code writes
an MDX body and imports `<Excerpt>` from `components/excerpt.tsx`, the same
rung of the ladder essays already climbed. **The annotation is the surrounding
prose**, not a prop.

Highlighting is Shiki at build time, in the server component, shipping zero
client JS. **The theme is built from the site's own tokens** rather than a
stock one — keywords goldenrod, strings terracotta, numbers/constants denim,
function names emerald, comments muted-foreground, the rest foreground —
because a "GitHub Dark" block would be the one imported-looking object on a
page where every colour is a declared token with a recorded reason. Those
hexes are copied literally into `components/excerpt.tsx`: a TextMate theme
emits inline colours and cannot read a CSS custom property, so they must be
kept in sync with `globals.css` by hand.

**The light/dark split is the hero icon collage's swap, run backwards**
(decided with Beck, 2026-08-29). Each brand hue has a standard value and a
brighter alt — denim/sky, emerald/spring-green, pumpkin/goldenrod. The hero
icons take the alt in light mode and the standard in dark; code takes the
opposite, because a code block is dense small text rather than a big
watermark glyph, and the standard hues land near 2:1 against `#080b24`. So
dark mode uses `--sky` for numbers and `--spring-green` for function names,
where light mode uses `--denim` and the deepened `--science`.

**Strings are the one exception.** `--terracotta` is the only brand hue with
no alt — it holds `#8c3623` in both themes, at 2.32:1 on midnight. Rather
than mint a terracotta alt, **dark mode borrows `--writing` (pumpkin,
`#bf712c`, 4.88:1)** for strings; light mode keeps terracotta. Decided by
Beck 2026-08-29, choosing an existing token over a new brand value. The
tradeoff accepted: pumpkin sits at hue 28° and goldenrod keywords at 39°, so
strings and keywords are closer neighbours in dark mode than elsewhere.

Rendered with Shiki's dual-theme output (`defaultColor: false`), which emits
`--shiki-light` / `--shiki-dark` per span; `globals.css` picks between them on
`[data-theme]`. It has to be the attribute, not `prefers-color-scheme` — the
site's toggle sets an attribute, so the media-query version of this pattern
would ignore it entirely.

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
- shadcn (`base-nova`, neutral base, CSS variables) with lucide icons.
  `components/ui/` is empty — the only two files ever vendored there
  (`button`, `dialog`) were imported by nothing and were deleted 2026-08-27.
- Comments explain **why**, not what — several of them record decisions that
  look wrong without the context (the rAF polling, the hydration fallback, the
  literal Tailwind classes). Keep that habit.
- **Comments cite this file, never a scratch document.** Six comments used to
  point at a `COLLECTION-CARDS.md` that never existed — misnamed references to
  `docs/COLLECTION-FORMATS.md`, which was written, never committed, and
  deleted per its own instruction once the redesign shipped. It has since been
  recovered from a session transcript and archived at
  [history/2026-08-collection-formats.md](history/2026-08-collection-formats.md).
  All six were rewritten 2026-08-27 to cite this file's own "Collection stack
  geometry" section (or the collection-layouts table) instead. If a rule is
  load-bearing enough to cite, it belongs here or inline — a design doc that
  only exists in someone's working tree is one `rm` from taking its reasoning
  with it.
- **`docs/specs/`** holds as-designed specs for work that is decided but **not
  yet built** — every decision taken, interfaces, edge cases, and what's out of
  scope, so it can be implemented without another conversation. A spec moves to
  `docs/history/` once it ships, stamped with where the build diverged. Neither
  directory is ever the answer to "how does this work today" — that is always
  this file.
- **`docs/history/`** holds as-designed specs for work that has shipped. They
  are stamped as historical, carry a list of where the build diverged, and are
  never the answer to "how does this work today" — that is always this file.
- **Imported content is never rewritten.** Copy that comes from somewhere Beck
  already wrote it — an Instagram caption, a post in the archived 11ty site, a
  zine, an artist statement — is transcribed **verbatim**. Not paraphrased, not
  smoothed, not "tightened", not re-punctuated, and not stripped of its
  structure, links, or asides because the current component can't render them.
  If the target can't represent something in the source, that's a gap in the
  target: record it in [TODO.md](TODO.md) and import the rest faithfully —
  never silently flatten the source to fit. The one edit that's always allowed
  is *omission of a clearly marked whole block* (e.g. skipping an image
  placeholder whose asset doesn't exist), and even then the omission gets
  recorded.

  This is not hypothetical. All three essays imported from the archive were
  re-worded and had their headings, lists, blockquotes, and every external link
  dropped on the way in; the damage wasn't noticed until Beck read the shipped
  pages months later, and undoing it means going back to the archive for
  originals. See [TODO.md](TODO.md) §9.
- `AGENTS.md` and `CLAUDE.md` are regenerated by `next dev` and are
  **gitignored** (`.gitignore:22-23`). AGENTS.md's own boilerplate suggests
  committing them instead; ignoring them achieves the same clean tree without
  the churn, and that's the choice here — don't re-litigate it from the
  boilerplate alone.
