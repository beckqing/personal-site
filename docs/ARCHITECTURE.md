# Architecture

How this site is put together and why. Decisions live here; **what's left to
do lives in [TODO.md](TODO.md)**.

Next.js 16.3, App Router, Turbopack. Fully static — every route prerenders
(**203 pages**, including a generated `sitemap.ts` and `opengraph-image.tsx`;
the build reports 204 while the scratch `/excerpt-preview` route survives —
see [TODO.md](TODO.md) §6). No database, no CMS: content is TypeScript, images
are files in `public/`.

Verified against the tree 2026-08-30. Where the code and this document
disagree, the disagreement is recorded here and tracked in
[TODO.md](TODO.md) rather than quietly smoothed over.

---

## Content model

`lib/work.ts` is the single source of truth for everything on `/work`. It
holds both the data (30 top-level items — 9 collections and 21 standalone
pieces — with 163 pieces inside the collections) and the vocabulary that
describes it.

**The vocabulary matches the data.** Every tag in `ALL_TAGS` is carried by at
least one item, and a new one goes in when the piece that needs it does.

**This reverses an earlier decision, deliberately (2026-09-02, Beck).** The
vocabulary used to be *deliberately wider than the data* — nine tags matched
nothing, and the standing rule was not to prune them. That rule was written
while `science` itself was empty, and holding it open was the whole point:
`delirium` (2026-08-29, `science` + `code`) and then `transformation`
(`science` + `biology`) landed in the space it kept. With that gap closed,
what remained was headroom for work nobody had imagined rather than for work
that exists, and eight tags came out: `oil` from `medium`; `neuroscience`,
`material science`, and `dataviz` from `field`; `nature`, `the body`,
`memory`, and `food` from `theme`. That left `theme` at `color` and
`language`, `field` at `biology` and `code`.

**`theme` was rebuilt on 2026-09-10 (Beck), which upholds the rule rather
than reversing it again.** `animals`, `identity`, `politics`, and `heartbreak`
went in *alongside* the twenty-three items that carry them — exactly "a new
one goes in when the piece that needs it does". Each matches at least four
items. The same edit added a second universal facet, `format`, holding one
tag: `series`, for a project made as a prompt list answered one a day. It is a
facet of its own rather than a fifth theme because it describes how a project
was made, not what it is about, and it is authored rather than derived from
`isCollection` — five of the eight collections are a series, the other three
are not.

**`color` came out in the same pass, and is the one removal here that is not
a dead-tag prune.** It matched `april-colors-19`, so the 2026-09-02 rule would
have kept it. It came out because the question it raised had no good answer:
`april-colors-24` is a month of watercolour *colour* prompts and did not carry
it, so `color` was either a one-item tag that should have been two, or a tag
doing no work. Beck retired it rather than extend it — a tag that has to be
argued into a second item isn't describing the body of work. Removing it is a
two-line data edit (the facet entry and `april-colors-19`'s array), because
`ALL_TAGS` derives from the facet tables.

`theme` is now `animals`, `identity`, `politics`, `heartbreak`, `language`,
ordered most-populated first so the always-visible chip row reads big-to-small;
`field` is unchanged. `language` is the one survivor of the original pair and
still matches a single item (`chinese-emoji-poetry`) — kept, unlike `color`,
because nothing about it invites a second.

Three further tags — `the body`, `nature`, `faith` — were proposed with item
lists in the same pass and declined. Don't re-add them without a fresh
decision.

**`design` joined `medium` (art's facet) 2026-09-17**, appended last so
`mediumFor()`'s first-match order is unchanged for every piece that existed
before it — the personal branding deck (`design`, plus `art`) is its only
carrier so far. See "The personal branding deck" below.

The pruning is a pure data edit in `lib/work.ts` — `ALL_TAGS` derives from
the facet tables, and it gates both the filter panel's chip list and the
`?tags=` URL parser, so nothing else needed touching. Only the three
discipline words are deep-linked from anywhere (`app/page.tsx`,
`components/hero-icon-collage.tsx`), and all three survive. (The footer
carried a third such link until 2026-08-28, when it was simplified down to
three icon links plus a disclosure of everything else — see "The footer"
below.)

**`lib/work.sample.ts` still uses the pruned words** and was left alone. It
is dev-only scaffolding behind `SHOW_SAMPLE_WORK`; with it on, those tags
just stop being filterable, since an unknown tag is dropped by the parser
rather than erroring.

**One shape for pieces and collections.** `WorkCollection` is just
`WorkPiece & { pieces: WorkPiece[] }`. A collection and a standalone piece
share a type, which is what lets the same card components, the same detail
layout, and the same lightbox serve both. `isCollection()` narrows between
them.

**Tags are non-exclusive and overlapping.** There are exactly three
disciplines — art, writing, science — and nothing is required to pick one.
Facets subdivide them (`medium` for art, `form` for writing, `field` for
science) and stay hidden in the filter UI until their discipline is selected;
the `theme` and `format` facets apply universally and are always visible.
Filtering combines selected tags with
and/or/not, plus free text over title, description, and tags — and, for
collections only, their children's titles, descriptions, `text`, and
`preview`.

**The gallery's default order is chronological.** `/work` sorts `newest`
first, which stays out of the URL; `oldest` is the only other mode. Both sort
on `year` (when the work was made — there is no upload date in the data) and
break ties by authored position, so `lib/work.ts`'s array order still decides
what happens inside a single year.

A third mode, `curated` ("in my order"), was the identity-sort default until
Beck retired it 2026-09-09. The authored order is still a real editorial
sequence, but it is one only the author can read: across work spanning
2017–2026 a visitor has no way to tell an intentional adjacency from an
append, so the sequence could not do the job a default order has to do.
Chronology can. The array order was demoted to the tiebreaker it still is.

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
caption).

**Words are optional on any piece — including a `writeup`.** Decided by Beck
2026-08-30. A piece may carry no `description` and no `writeup` at all and
still be finished; some work is just the thing itself, and a piece does not
owe the reader an explanation of itself. `delirium` is the current example
(and the code-demo spec's §9 rule was amended to match). Don't file a missing
write-up as a gap, and don't write one on a piece's behalf — every write-up
on this site is Beck's own words, which is the same rule as "imported content
is never rewritten" seen from the other side.

One thing does follow from it mechanically: `metaDescription()` falls through
`description` → `preview` → `text` and returns `''` when a piece has none, so
such a page ships an empty `<meta name="description">`. That is a metadata
gap to close on its own terms (a one-line `description`, or a title
fallback) — not a reason to require prose. Tracked in [TODO.md](TODO.md) §2.

`preview` is a hand-set, 1–3 line pull quote for compact contexts,
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
ladder from `content/code-demos/<slug>.mdx` — a path the map already resolves,
though **no demo has an MDX body yet, so that directory does not exist**; the
first one to need code excerpts creates it. `content/decks/<slug>.mdx` is the
third such directory — a rebuilt slide deck's slides (see "The personal
branding deck") — and unlike the other two, one exists today
(`personal-branding.mdx`). `lib/mdx-bodies.ts` is the one map behind all
three, asserted at build time against `MDX_BODY_SLUGS`. `components/essay.tsx`
and `EssayBody` keep their names — they are the essay *typography*, and both
a demo's write-up and a deck's own slide prose want exactly that typography.

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
| `isDeck` | carries `deck: true` — its write-up is a rebuilt `<Deck>` of `<Slide>`s, not plain prose, so the page renders it full width instead of inside `EssayBody`. Checked *before* `isCodeDemo`, for the same reason: it also carries `image` (the gallery cover) and no `text`, so a later branch would silently render it as a plain image piece. See "The personal branding deck" below |
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
| `gallery` | `hthtpw`, `april-colors-19`, `april-colors-24`, `inktober-17`, `i-think-that-im`, `eye-studies` |
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
Filter state on `/work` lives in the URL (`?tags=…`, and since 2026-09 also
`?view=<slug>` for the open lightbox — see "The gallery's lightbox is URL
state" under Component layers), which is why the home page's discipline
panels can deep-link straight into a filtered view. One
consequence worth naming: a deep link is only as good as the tag behind it.
`?tags=science` deep-linked into an empty gallery until 2026-08-29, when
`delirium` landed; the nine tags listed under "Content model" would still do
that today.

**`sitemap.ts` and `opengraph-image.tsx`** are generated (added 2026-08-27) —
the two file conventions judged worth having for a linked portfolio of this
size (see the page count at the top).
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

**A second Figma file now describes the same identity.** The personal
branding deck (`/work/personal-branding` — see "The personal branding deck"
below) is a *different* Figma file from this artboard's
(`nSrYPqfF0aNuJSPrwxE3Lk`), pulled 2026-09-17. Checked against each other on
import: the deck's logo-design slide draws the same geometry, the same
palette, and the same crescent-via-mask construction as this artboard — no
disagreement found. The deck's typography slide also names Recursive and Noto
Sans, matching what `app/layout.tsx` actually loads. Both were real risks
(two sources drifting silently is the whole hazard), not formalities, and
both cleared. If a future edit to either file ever disagrees with the other,
that's a finding to record here, not something to quietly redraw away.

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

These are the artboard exports as drawn — static references, per "Source"
above. The live `BrandMark` component departs from `dark-crescent.svg`'s
crescent in one respect: dark mode crescent is denim `#305789`, not literal
white (see "Assignment, and why" below for why); ink stays `#CED2CD` as
drawn.

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
  - *dark mode:* **`dark-crescent`** construction (pale-slate letterforms,
    crescent cut via the mask), **with a denim crescent** rather than the
    artboard's literal white. `dark-crescent` as drawn resolved a real
    tradeoff against the artboard's two other dark drafts: `dark-denim` had
    the white crescent but `#305789` letterforms lost contrast against
    `#080B24` (muddy at 32px, soft even at 64px); `dark-pale` held contrast
    but its indigo bowl wasn't a crescent at all — no cut, no moon.
    `dark-crescent` took the pale letterforms and added the mask, getting
    both properties at once.

    That fixed contrast against the *background* but left a second problem
    unmeasured: contrast between the crescent and the ink around it. White
    `#ffffff` next to pale-slate `#ced2cd` ink is ~1.5:1 — same hue family,
    barely different lightness — so the moon barely separated from the
    letterforms at hero size. Found and fixed 2026-09-02 by moving the
    dark-mode `--brand-crescent` off white (`app/globals.css`). Two
    replacements were screenshot-compared:

    - **Goldenrod `#d9aa52`** — 9.8:1 off `#080B24`, a clean hue break off
      `#ced2cd`, and it echoes dark mode's `--primary` (the "see the work"
      button sits right under the hero mark), the same way `light-gold`'s
      crescent already echoes light mode's `--brand-crescent`.
    - **Denim `#305789`** — only ~2.6:1 off `#080B24`, the same contrast
      number that sank denim as the artboard's `dark-denim` *ink* draft
      above, now on the crescent instead of the letterforms. Visibly the
      weaker cut of the two in the screenshot comparison — the moon reads
      closer to "notch in the background" than a distinct shape.

    **Denim is the shipped choice** — Beck's explicit call, preferring its
    cooler read against this theme's ground over goldenrod's larger contrast
    margin. Recorded here so the tradeoff isn't invisible to whoever touches
    this next: if the crescent ever reads as too faint, this is why, and
    goldenrod is the higher-contrast fallback already vetted above. Sky
    `#68bfed` would also clear contrast (9.5:1) but wasn't in the running —
    it's `--hero-accent-art`'s dark-mode value, the hero copy's "art" word,
    so a sky crescent would read as claiming that discipline for the mark
    itself. Letterforms are untouched either way: `--foreground` in both
    themes, same as before.

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

## The personal branding deck

`/work/personal-branding` (`lib/work.ts`, `deck: true`) rebuilds Beck's
Figma deck of the same name as real HTML rather than embedding or exporting
it as slide images — see
[docs/specs/2026-09-branding-deck.md](specs/2026-09-branding-deck.md) for the
full reasoning. Three of its slides render from the site's own live code
(`BrandMark`, the palette tokens, `headingStyles`) rather than a picture of
them, which is the whole point: they cannot drift from what the site
actually ships.

**`Deck` / `Slide` / `SlideFigure`** (`components/deck.tsx`) are the
authoring primitives, imported directly into `content/decks/
personal-branding.mdx` the same way an essay imports its own components.
`Deck` reads its slide list straight off `React.Children.toArray(children)`'s
`id`/`title`/`layout` props — no registry. `Slide.layout` is a closed set
(`prose` | `figure` | `split` | `full`) describing what kind of composition a
slide is, not a copy of its original Figma frame's exact pixel layout.

**Two renders, one content tree.** Scroll mode renders each `<Slide>` as a
plain `<section>`. Present mode (a button in the piece header) opens a
`@base-ui/react` `Dialog`, then requests fullscreen on the popup
(`.catch(() => {})` — iOS Safari has no `requestFullscreen`, and the Dialog
overlay alone is the fallback experience there), and renders a *second* copy
of the current slide inside it via a `presenting` React context. That
context is also why a `Slide`'s DOM `id` is omitted on the presenting copy:
two elements sharing an id while the dialog is open breaks anchors and
`aria-labelledby` both. `?slide=<id>` is the single source of truth for which
slide (if any) present mode is open on — the same `useSearchParams` +
`router.replace(..., { scroll: false })` pattern `WorkGallery` uses for
`?view=`, so the header's present button and `Deck` agree on state with no
context passed between them, and the page needs a `<Suspense>` boundary
around the MDX body for the same reason `/work` wraps `WorkGallery` in one.

**Content is transcribed verbatim** from `docs/brand/deck-source.json`
(committed, pulled by `scripts/pull-brand-deck.mjs` from the Figma REST API —
never the source images; OCR-off-pixels is exactly what choosing the token
route was for) and checked by `scripts/check-deck-fidelity.mjs`, which
word-diffs the MDX against the pull and allowlists only the deliberate
omissions (the dropped title/closing slides — the page's own header and
footer already carry that — and a couple of captions for graphics that
weren't exported).

**The palette slide is the site's actual brand palette, not the monogram's
five-colour breakdown.** The build spec guessed the latter from an illegible
178×900 thumbnail; the real pull showed 11 named, hand-picked colours (white,
summer storm, midnight, terra cotta, pumpkin pie, satin nickel, indigo,
goldenrod, pale slate, denim, emerald) that `app/globals.css`'s "warm
pale-slate base from the brand slides" tokens are themselves drawn from — see
[[palette-provenance]] in memory. `BrandPalette` (`components/
brand-palette.tsx`) renders those 11, each labelled with its closest live
token, not the "The monogram" table above (which is a different, narrower
fact: the pixel composition of the mark itself, not the brand's colour
system).

**One tag, no new discipline.** `personal-branding` carries `art` +
`design` — `design` appended to `DISCIPLINE_FACETS.art.tags` (`lib/work.ts`),
last in the array so `mediumFor()`'s first-match behaviour is unchanged for
every existing piece. A fourth discipline was considered and rejected: one
piece doesn't make a discipline, and `design` would otherwise have touched
`DISCIPLINE_TONE` (a new brand colour), the home page's three columns, and
the hero collage to stand up a discipline holding exactly one item.

**Two slides exist that the build spec didn't anticipate.** It was written
from a guess off that same illegible thumbnail; the real pull added a
"logo drafting" slide (distinct from "logo design" — sketches and a rejected
draft, not the final geometry) and a "profile pictures" slide (a grid of six
alternate self-presentation options, one of which — "your friendly
neighborhood artist" — is confirmed the same photo as `public/about/
beck-friendly-neighborhood-artist.webp`). Neither needed a new `Slide.layout`
variant; both use `full` with their own content component
(`components/profile-picture-grid.tsx` for the grid).

- **`work-gallery.tsx`** — the `/work` client island: filter panel, URL state,
  a docked copy of the filter panel beneath the nav once the real one scrolls
  out of view (`DockedFilterBar`, built 2026-09-10 from
  [history/2026-09-docked-filter-bar.md](history/2026-09-docked-filter-bar.md),
  reworked 2026-09-11 — see the dated note in `TODO.md`), and `WorkCard`,
  which dispatches to `HybridCard` / `TextCard` / `ImageCard` /
  `CollectionTile`. `HybridCard` is currently unreached — no top-level item
  carries both `text` and `image`. Search is `InlineSearch`, an icon-only
  pill that expands in place (leading the discipline chip row, and the
  docked bar's compact row) rather than a full-width field of its own — the
  earlier `SearchField` is gone. `FilterPanelContent` (toolbar + both chip
  rows, with the in-flow panel's zero-shift reservation) mounts once, in the
  real panel; the docked bar builds its own compact row and expansion out of
  the same lower-level pieces (`InlineSearch`, `TagRow`, `ToolbarRow`)
  instead, since its collapsed state shows only search + disciplines + any
  otherwise-hidden selected tags, not the whole panel, and — being
  `position: fixed` — it has no zero-shift guarantee to keep in the first
  place. All of it reads/writes the same URL state regardless of which
  mount it's in.
- **`site-nav.tsx` publishes `--nav-h`**, a CSS custom property on
  `document.documentElement` holding the nav's own measured height (it wraps
  to two lines below ~363px, so this isn't a constant). The only consumer
  today is `work-gallery.tsx`'s `DockedFilterBar`, which pins itself directly
  below the nav using it — a cross-component contract that isn't visible from
  either file in isolation, which is why it's recorded here.
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
  that actually carry an image is the caller's job**. There are now two such
  scoping functions in `lib/work.ts`, and both must stay the only deciders:
  `imageLightboxSlice()` for a collection's own pieces — `ImageTile`,
  `IllustratedTile`, and the piece detail route
  (`app/work/[slug]/[pieceSlug]/page.tsx`) all call it rather than each
  re-deriving the filtered list and index (fixed 2026-08-27; the piece detail
  route used to pass `collection.pieces` unfiltered) — and
  `galleryLightboxItems()`/`opensInGalleryLightbox()` for the top-level
  `/work` gallery, which carries one extra rule: code demos are excluded (see
  below). `ImageLightbox` also gained a controlled, triggerless mode (`open`/
  `onOpenChange`/`onIndexChange`/`resolveTrigger`/`titleHref`) alongside its
  existing `bare` prop — see "The gallery's lightbox is URL state" below.

  **The gallery's lightbox is URL state; every other lightbox is not.**
  `/work` renders **one** `ImageLightbox` in a controlled, triggerless mode,
  opened by `?view=<slug>` rather than by a per-card dialog. Three things
  forced it and each would have to be given up to reverse it: a card click has
  to be undoable with Back (and with the mobile back-swipe, which is the
  instinctive dismiss gesture); an open image has to be a shareable link, the
  same way a filtered gallery already is; and paging with the arrows has to
  move between *cards*, which no per-card dialog can know about. Paging writes
  `view` with `replace`, so ten arrow presses leave one history entry, not ten.
  The lightbox still keeps its own `index` state — the URL write is inside a
  `startTransition` and lags a frame, and arrow presses must not.

  Collection pages and piece pages deliberately **did not** follow. Their
  lightboxes stay ephemeral local state: their domain is one collection, it
  doesn't move under them, and the pieces already have their own addressable
  URLs one link away.

  **Which cards open it is one predicate, `opensInGalleryLightbox()`, and it
  must stay one.** The card's open-vs-navigate branch (`ImageCard`, via
  `GalleryLightboxContext`) and the arrows' paging domain both read it; if
  they ever diverge, an arrow lands on a piece whose own card would have
  navigated. Code demos are excluded — a demo's `image` is only a poster
  still, and the thing the card advertises runs on its own page. **Animations
  are excluded too, as of 2026-09-10, for the same reason**: a finished
  animation *is* the piece, not its poster, so its card leads straight to the
  page that plays it (see D4 under "Media: speedpaints and animations"). A
  piece with only a **speedpaint** stays included, and the distinction is the
  whole point — there the still genuinely is the piece and the video is
  process, the framing `PieceMedia` still uses when it offers the still
  alongside a speedpaint.

  **The dismiss flight and Base UI's scroll lock are coupled, and not
  obviously.** `useScrollLock` (`@base-ui/utils`) clamps `<body>` to `height:
  100dvh; overflow: hidden` and restores `html.scrollTop` on cleanup, so (a) a
  tile that was on screen when the lightbox opened measures correctly under
  the lock — the page is frozen at the position it will return to — and (b)
  `scrollIntoView()` under the lock is silently undone by that cleanup.
  Flying to an off-screen tile therefore sets `document.body.scrollTop`
  itself (the locked `<body>` is the actual overflow container while the lock
  holds) and re-applies the same value from `Dialog.Root`'s
  `onOpenChangeComplete`, after the lock has let go.

  **Base UI 1.5's `DialogPopup` swallows arrow keys before they ever reach a
  `window` listener** — its own `onKeyDown` calls `stopPropagation()` for
  every key in `COMPOSITE_KEYS` (the arrows, Home, End), evidently to keep
  composite widgets like menus from leaking arrow presses past their own
  popup. `ImageLightbox`'s paging listener has to be registered on `window`
  with `{ capture: true }` — a capture-phase listener runs top-down before
  that bubble-phase `stopPropagation()` gets a chance to fire. Found by
  testing in a real browser: a plain bubble-phase listener (what shipped
  originally) left the prev/next *buttons* working while the arrow *keys*
  silently did nothing.

  **The lightbox never upscales past its source.** `WorkPlaceholder`'s
  `contain` branch requests a hardcoded `width={2000}` (headroom above every
  current source) with `sizes` deliberately left unset, so Next emits an
  `x`-descriptor srcset rather than a `w`-descriptor one — the browser's
  chosen candidate is always clamped to the source's real width at any DPR.
  `ImageLightbox` then clamps the rendered `<img>` to its own `naturalWidth`
  on load (belt-and-suspenders check for cached images, which may not fire
  `load`), which is what actually stops a small source from being laid out at
  2000px. Adding `sizes="100vw"` "for performance" would switch Next to
  `w`-descriptors and silently break this — the naturalWidth cap would clamp
  to the browser's viewport-sized candidate instead of the source.
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
| **D4 — animations lead to themselves** | An animation piece (`hasAnimation()`) skips the gallery's still-image lightbox and links straight to its own page (`opensInGalleryLightbox()` excludes it) — a curated still can't outrank the thing the piece actually is. Its card shows the animation's own thumbnail (`animationPosterFor()` — YouTube's `hqdefault` for an embed, unconditionally), not a hand-set `image`, in a box sized by `posterAspectFor()` so the thumbnail isn't cropped to a still's shape. **The two must branch identically**: they answer "what fills the box" and "what shape is the box" together. Requires `i.ytimg.com` in `next.config.mjs`'s `images.remotePatterns` — `next/image` throws without it. `AnimationEmbed` renders `PlayerFrame` in `bare` mode (no border); its own iframe edge is enough. A **speedpaint-only** piece is entirely unaffected: the still is still the piece there, and stays what you click into. |
| **D5 — `scenes` vs. `process`** | `scenes` (`ProcessStill[]`, same shape as `process`) holds finished stills that supplement an animation; `process` stays WIP-only. Both render through the same internal `StillsSection`, under their own headings, via `SceneSection`/`ProcessSection`. Note `filterWork` reads neither — a scene's `alt` is not a search term. |

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
  and "view" pill, so it can be triggered from a compact link. It also has a
  controlled, triggerless mode (`open`/`onOpenChange`/`onIndexChange`/
  `resolveTrigger`/`titleHref`) for a caller that derives open state from
  somewhere else instead of owning a per-tile dialog — used only by the
  top-level `/work` gallery; see "The gallery's lightbox is URL state" under
  Component layers.

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
[history/2026-08-coding-explorations.md](history/2026-08-coding-explorations.md)
(the filename keeps the spec's original working title). Its §8 — the home
page's science panel as a live code-demo miniature — was dropped rather than
built; see [history/2026-09-home-discipline-cards.md](history/2026-09-home-discipline-cards.md)
§7 for why. This section records the shape of what did ship.

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
flag science finally having work in it. `art` still outranks everything in
`DISCIPLINE_PRECEDENCE` (see "Which discipline colours a piece" below), so it
wins from any tag position here, and `first-art-fair` is unaffected.

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

**Which discipline colours a piece.** Nothing stops a piece carrying two or
three disciplines, so `primaryDiscipline()` picks one — and it iterates
`DISCIPLINE_PRECEDENCE` (`art`, `science`, `writing`), deliberately *not*
`DISCIPLINES`' order. `DISCIPLINES` is the reading order the site says out
loud (the hero copy, the filter chips, the home columns) and is left alone;
precedence is only about which tone wins. `science` was moved ahead of
`writing` (Beck, 2026-09-03): the essays tagged both are science writing, and
before this they read as pumpkin, indistinguishable from the poems. Everything
tone-driven follows from that one function — the meta line under a piece's
title, the quote glyph and tint on its cards, the pull-quote rule on its page,
and its tag chips — so a science essay is emerald throughout. Those essays
also list `science` before `writing` in their own `tags` arrays, which is what
orders the chips (`TagLinks` renders the array as authored).

An MDX essay body is the one place the tone can't be passed down as a prop:
`essayComponents` is a single global map and MDX gives it no piece. `EssayBody`
takes a `tone` and publishes it as `--essay-accent` on the wrapper instead, so
the blockquote rule inside reads it off the cascade. Unset, it falls back to
`--writing`, which is what that rule was hard-coded to before science essays
existed.

Fonts: Recursive (variable, with `CASL`/`MONO`/`slnt` axes — the `font-brand`
and `font-brand-italic` utilities) and Noto Sans, both via `next/font/google`.

---

## Headings

`lib/heading-styles.ts` exports `headingStyles`, one object with a
`className` string for `eyebrow`, `h1`, `h2`, `h3`, `h4`, and `h5` — the only
place a heading's size, weight, case, and colour are decided. Before
2026-09-02 every heading picked its own size at the call site (19 of them),
which is how `h1` ended up rendering *smaller* than `h2` on a piece-inside-a-
collection page, and how `/work` ended up with no `h1` or `h2` at all — its
highest heading was a card title's `h3`.

**`h1` is the title; `h2` is a top-level content heading — not the other way
around.** The bias behind the old scale was picking a heading level for how
big it rendered rather than what it meant, reaching for `h3` or `h4` to get a
smaller heading. The first fix attempt, 2026-09-02, over-corrected: it gave
`h1` the old `h3`'s exact formatting (`text-lg font-bold lowercase
text-foreground/80`), on the reading that "the top of the scale" meant the
`<h1>` tag. Seeing it live, that put a piece's title only 2px above its own
essay's `## ` section heads — a page title needs to read as clearly dominant
over the content beneath it, not just technically larger. Corrected the same
day: `h1` (the piece title) keeps a real display size, `text-2xl`; the old
`h3` formatting moved to `h2` instead, since a piece's title is `h1` and an
essay's own top-level `##` section is properly one level *below* it — `h2`,
not `h1`.

**The scale moved again, same day, once the whole thing was visible
together.** `h2` and `h3` both moved up a step from that correction —
`text-lg` → `text-xl` for `h2`, `text-sm` → `text-base` for `h3` — because
Beck wanted more size differentiation between levels than the compressed
version gave, producing a 24/20/16/14/12 staircase.

**That staircase broke a harder rule: a heading never renders smaller than
the body text it introduces.** Body copy (`EssayBody`) is `text-base` (16px),
so `h4` (14px) and `h5` (12px) sat *below* their own paragraphs and read as
captions rather than headings. 16px became the floor for every numbered
level. But with the ceiling still at 24px there was no room left to keep five
levels distinct, so `h3`, `h4`, and `h5` all collapsed onto `text-base` and
were told apart by weight and colour alone — about as far as that
distinction stretches.

**Final pass, same day: the whole ladder moved up one step**, on Beck's "all
the headings can also be increased in size a little." Raising the top is what
bought back the room at the bottom. The scale is five genuinely distinct
sizes again — `h1` 30px, `h2` 24px, `h3` 20px, `h4` 18px, `h5` 16px — with
the floor still intact (`h5` sits *at* body size, never under it). The weight
and colour ladder (`font-bold text-foreground/80` → `font-semibold
text-foreground/70` → `font-medium text-foreground/60`) is kept as
reinforcement rather than as the whole signal.

`h1` is the scale's one responsive step, `text-2xl sm:text-3xl`. The longest
title in `lib/work.ts` is 46 characters ("emoji poetry, translated from
chinese"), which sets three lines at 30px on a phone, so mobile keeps the
earlier 24px and only desktop takes the increase.

Two `h1`s are deliberately **not** built from this scale: `beck qing` on the
home page and "Hi, I'm Beck." on `/about`. Both are display type under a
small tracked eyebrow — the site's nameplates, not document titles — and
sizing them off this token would take away the site's only two large
headlines along with the small ones.

**The "eyebrow" is a separate token from any numbered level, on purpose.**
`text-xs uppercase tracking-[0.3em] text-muted-foreground` was, before this
pass, written inline wherever a small label needed it — sometimes on a
literal `<h2>` (`"in this collection"` / `"table of contents"` in
`app/work/[slug]/page.tsx`, `"process"` in `ProcessSection`), which put a
section head and a tiny tracked label at the same nominal level with
nothing connecting their styles on purpose. `headingStyles.eyebrow` is that
style, decoupled from the scale, applied to whichever tag is structurally
right — both spots above still render `<h2>` (a correct sibling of the
essay body's own `<h2>`s), just no longer sharing a class string with them
by coincidence.

**`MarketHeader` (`components/essay.tsx`) is a real `<h3>`**, not a `<p>`, as
of this pass. `first-art-fair.mdx` nests `##` section heads directly under
`####` subsections ("+ things that went well", "Δ for next time"), skipping
a level — because the thing that belongs at `h3`, the market's name and
date, was never a heading element at all. Giving it `headingStyles.h3`
closes the skip without touching a single heading marker in the `.mdx` file.

`/work` gained an `<h1 className="sr-only">Work</h1>` in the same pass — the
page's own eyebrow span was never a heading, and nothing sat above the
gallery's card titles. Those titles moved from `h3` to `h2` alongside it,
since nothing else on the page claims that level.

## Emoji: a subsetted monochrome web font

`first-art-fair.mdx`'s `<EmojiList>`/`<Item>` bullets (`components/essay.tsx`)
render their marker through `.font-emoji` (`app/globals.css`), a self-hosted
**"Noto Emoji Subset"** face — 19 glyphs, 7KB — rather than whatever colour
emoji font the reader's platform ships. Decided with Beck 2026-09-02: Noto
Emoji (distinct from Google's *Noto Color Emoji*) is a monochrome outline
family that draws in `currentColor` like ordinary text, so it joins the same
system as the site's 50 brand doodles and `TabGlyph` instead of importing a
platform's own illustration style into the middle of an essay — the same
"ink is a token, not a literal" rule the About tab glyphs work (§7 in
TODO.md) already established. It also means every reader sees the same
glyphs, which no amount of `font-family` fallback tuning on a colour emoji
stack can promise.

**Built from `@fontsource/noto-emoji@5.3.0`, not committed as a dependency.**
The npm package covers the entire Unicode emoji block, chunked into ~10
files per weight (~450–560KB *each*) — nowhere near subsetted for the 19
codepoints one essay actually uses. The subset was built once, by hand, and
only the 7KB result is committed:

1. Extract every unique `emoji="…"` value from `content/essays/*.mdx` (19
   codepoints, none of them multi-codepoint ZWJ sequences).
2. `unicode.json` in the fontsource package maps each of the family's ~10
   chunk files to the Unicode ranges it covers; look up which chunks contain
   the 19 target codepoints (7 chunks did, for this set).
3. Run `pyftsubset` (Python's `fonttools`, OFL-licensed, MIT-licensed tool —
   not a project dependency, used once from a throwaway virtualenv) on each
   needed chunk's `-400-normal.woff2`, keeping only the target codepoints
   present in that chunk, output as a bare TrueType (`--flavor=`).
4. `pyftmerge` the resulting per-chunk TTFs into one font.
5. Recompress the merged TTF to WOFF2 (`fontTools.ttLib`, `flavor = 'woff2'`).

The result — `public/fonts/noto-emoji-subset.woff2`, 7KB for all 19 glyphs —
was checked by rendering each codepoint through the merged font with Pillow
before shipping it, not assumed correct from the pipeline succeeding.
`public/fonts/noto-emoji-subset.LICENSE.txt` (Noto's OFL-1.1, copied from the
fontsource package) travels with it, since the font is redistributed.

**To add a codepoint** (a future essay reusing `<EmojiList>` with a new
emoji): repeat the process above for the new set of codepoints — there's no
committed script, on the same reasoning `docs/ARCHITECTURE.md`'s speedpaint
section gives for encoding settings over a maintained pipeline: this is a
by-hand asset decision recorded so it's reproducible, not something the build
redoes. Then update the `unicode-range` in the `'Noto Emoji Subset'`
`@font-face` block in `app/globals.css` to include the new codepoint(s) — the
range is what tells the browser to even attempt the download, so an
uncovered codepoint falls through to the fallback stack (`sans-serif`, plus
`font-variant-emoji: text` asking the platform not to substitute a colour
font) rather than failing loudly on its own.

**`scripts/check-emoji-subset.mjs` is that loud failure**, run by hand
(`node scripts/check-emoji-subset.mjs`), matching
`scripts/check-essay-fidelity.mjs`'s pattern of a manual, dependency-free
check rather than a build-time gate. It reads the `unicode-range` out of
`app/globals.css` as the source of truth and diffs it against every
`emoji="…"` codepoint actually used across `content/essays/*.mdx`, so adding
an emoji to an essay without regenerating the font fails here instead of
silently rendering through the reader's own colour emoji font.

## Homepage icon collage

`data/icons-raw.json` holds raw SVG path data for the scattered brand icons;
`lib/brand-icons.ts` normalizes it into `BrandIcon[]`. Each icon is tagged
with one or more categories (`art` / `hu` / `sci`). Hovering a discipline word
in the hero copy lights the matching icons and brings the matching panel
forward — shared through `HeroWordScatter`'s context, so the words, the
icons, and the panels stay in sync without prop-drilling.

---

## Discipline columns

Built 2026-09-03 from
[history/2026-09-home-discipline-columns.md](history/2026-09-home-discipline-columns.md)
— read that spec's own status banner for where the build diverged (mainly:
`TEXT_RUNG_ASPECT` tuned to `1`, not the `3/2` starting point, and where
`UnfinishedMark` actually had to sit). This section records the current
shape. Two earlier attempts at this same problem were built and rejected
before this one, both before ever being committed: a "tucked-under peek"
behind one featured piece, and a first pass at the column that still lived
inside a card. Both archived specs —
[history/2026-09-home-discipline-cards.md](history/2026-09-home-discipline-cards.md)
and this file's own intro banner — point here.

**There is no card.** Each of the three home sections is a header
(`StampBadge`, a descriptive line, and that discipline's own CTA) plus a
loose, unbordered column of 2–4 hand-picked pieces standing directly on the
page — no border, background, shadow, or overlap behind any of it. The whole
header-plus-column group is one `<Link>` (`DisciplineColumn` in
`app/page.tsx`); the focus ring lives on the header block via
`group-focus-visible:ring-2`, not on the link itself, since a ring around a
group whose height is set by a several-hundred-pixel decorative column would
mostly circle nothing.

Every rung is rendered by `PieceColumn`/`PieceRung`
(`components/piece-column.tsx`), checked in order and derived from what the
piece carries — no `kind` field anywhere:

- a **code demo** (`piece.codeDemo`) renders in a static rail (a muted dot,
  "paused", and `entryName(codeDemo.src)`, exported from `code-demo-frame.tsx`
  for exactly this reuse) over its poster, boxed at `codeDemo.aspect` — drawn
  any other way it reads as a painting, which it isn't. No iframe and no
  "open standalone" link: nothing here boots, so nothing needs the tab stop
  the real `CodeDemoFrame` gives its own rail.
- an **image** renders at its own `imageAspect`, with no default/normalized
  shape anywhere in the component;
- anything else renders as up to two lines of type, clamped, reading
  `preview ?? description ?? title` and deliberately never `text` (a piece's
  `text` is the whole work, and its first line can be an entire paragraph —
  this is what broke the tucked-peek build). This is the one rung shape
  that *is* normalized: it takes a fixed `TEXT_RUNG_ASPECT` rather than
  sizing to its own content, specifically so the writing column (all type)
  lands close enough to the art column's height that one shared fade line
  can cut through both convincingly.
- A piece flagged `unfinished` gets `UnfinishedMark` regardless of branch —
  in normal flow, directly under the excerpt for a text rung (not an
  absolutely-positioned corner: a corner badge is only ever guaranteed
  visible on a column's *last* rung, since every earlier rung has its
  bottom portion physically covered by the one below it — the same `show`
  mechanism that makes the column read as a stack at all).

`resolvePiece()` in `app/page.tsx` resolves each hand-picked slug (or
`[collection, piece]` tuple) through `getWorkItem`/`getCollectionPiece`, so a
typo in `CARDS` is a build-time failure rather than a blank rung. No piece
may be picked for more than one column — science claims all four of its
pieces (`transformation`, `delirium`, and two in-progress essays flagged
`unfinished`), so none of the four may also appear in the art or writing
column.

**A rung's offset (`width`, `margin-left`) is a plain CSS percentage**,
resolved in normal flow rather than by `position: absolute` — this is also
how the negative `margin-top` that tucks each rung under the one above it
gets to be a percentage of the *column's width* even though it's a vertical
offset: percentage margins resolve against the containing block's width on
every side, the same fact `CollectionStack`'s own deck depends on (below).
That overlap is **derived, not tabled**: a rung's rendered height in
percent-of-column-width units follows from its own aspect (`imageAspect`, or
`TEXT_RUNG_ASPECT` for type — every rung has one now), so `COLUMN[i].show`
(the fraction left uncovered) directly gives the negative margin the *next*
rung needs — see `overlapAbove()`. A code-demo rung is taller than `w /
aspect` by its rail's fixed height, so its contribution to the next rung's
overlap mixes a percentage and a `rem` term in one `calc()` — safe for the
same reason `deckLength()` (below) mixes them for the collection stack's one
fixed-strip card: the percentage still resolves against the column's width,
and the `rem` term simply doesn't participate. `transform` on a rung carries
**rotation only** — never `translate()`, which would resolve its
percentages against the rung's own box rather than the column's, the same
unit trap the rejected peek build hit.

**The three columns dissolve into one shared fade**, not three separate
ones — a `mask-image` on the container wrapping all three
(`.columns-fade-shared`), a percentage (`66.67%` opaque, then to
`transparent` at `100%`) rather than a fixed length, so the fade always
reads as "the stack's last third" no matter how tall the tallest column
ends up being, and the dissolve reads as one horizon the whole section runs
into rather than three unrelated widgets that happen to be adjacent. The
"see all work" CTA is a sibling of that masked container, pulled up by a
small negative margin (`-mt-8`) with its own `position: relative;
z-index` so it stays fully opaque on top of the fade rather than dissolving
with it — the point is a crisp, solid button sitting above the columns'
disappearing tail, not one blended into it. The pull-up is tuned against
the *shortest* column's own bottom edge, not the fade length itself: pull
up further than that and the CTA starts overlapping a column's
still-legible content rather than its faded tail. Each discipline's own CTA
lives up in its header instead and never touches the band. **This only
holds when the three columns sit side by side**
(`md` and up); below that breakpoint `DisciplinePanels` stacks them, and a
single mask spanning three *stacked* columns' full combined height would
dissolve only the last one, leaving the first two with a hard, undissolved
edge. So there are genuinely two fade rules, picked by the same breakpoint
the layout itself switches on: `.column-fade` (inside `PieceColumn` itself)
fades each column individually below `md` and goes inert at `md` and up,
where `.columns-fade-shared` takes over instead.

The column opens on `.discipline-column:hover`, `:focus-visible`, and
`.discipline-column-active` (`.column-rung` in `globals.css`) — the same
selector set the site's other hover-triggered UI uses, not `.group:hover`.
`.discipline-column-active` is toggled by JS when the matching word in the
hero copy is hovered, with the pointer nowhere near the column, so a
`:hover`-only rule would leave it scattered while nothing else in the
gesture reacted. **Opening rotates every rung to exactly `0deg`
individually** — not a shared "open" angle, and not the group as a unit:
there is no card left to rotate, lift, or scale as one rigid object.
Verified in a real browser: the link's own `transform` is `none` both at
rest and on hover, every rung's box (`width`/`margin-left`/`margin-top`)
is byte-identical before and after, and only each rung's own `transform:
rotate()` changes. `prefers-reduced-motion: reduce` pins every rung to its
rest rotation and drops the transition, rather than hiding anything — the
column and its fade are layout, not a motion effect, and stay fully present
either way.

The three columns no longer match height: each sets its own, and the
science column — four pieces including two in-progress drafts, since
"honest at 2" didn't survive science growing past two — still isn't forced
to match the others. That's the intended reading, not a regression.

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
