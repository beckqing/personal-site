# Spec — the personal branding deck as a work piece

Beck has a finished Figma deck, `personal branding slides`, that documents the
identity **this site already implements** — the bq monogram, its palette, and
its typography. This spec puts it on the site at `/work/personal-branding`,
**rebuilt as real HTML** rather than embedded or exported as flat images, with
a **present mode** that pages through it fullscreen.

The rebuild is not stubbornness about iframes. Three of the deck's slides —
the mark, the palette, and the typography — describe things the codebase
already holds as live code (`components/brand-mark.tsx`, `app/globals.css`,
`lib/heading-styles.ts`). Rebuilt, those slides *render from the real thing*
and cannot drift from it. Exported as PNGs, they would be a picture of the
brand sitting next to the brand, free to disagree with it silently.

Nothing here changes the gallery, the lightbox, the collection layouts, or any
existing piece. It adds one tag, one piece, one content directory, and one
new component family.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| Where it lives | **A piece at `/work/personal-branding`**, not `/about`, not a `/colophon` route | Beck, 2026-09-11 |
| How it renders | **Rebuilt as real HTML** — not a Figma embed, not exported slide images | Beck, 2026-09-11 |
| Reading mechanism | **A scrolling page with a present mode** — scroll by default, a button opens fullscreen stepped slides | Beck, 2026-09-11 |
| Taxonomy | **`discipline: art`, plus a new `design` tag** — no fourth discipline | Beck, 2026-09-11 |
| Source of the content | **Figma personal access token**, pulled by a script | Beck, 2026-09-11 |
| Is the deck still changing | **Finished.** One pull, not a sync relationship | Beck, 2026-09-11 |

---

## 1. What is actually known about the deck, and what isn't

The file is `https://www.figma.com/design/cZbOK8t70Q8328FzE5xtgH/personal-branding-slides`.

**Confirmed unauthenticated, 2026-09-11:**

| Fact | Value | How |
| --- | --- | --- |
| File key | `cZbOK8t70Q8328FzE5xtgH` | URL |
| Title | `personal branding slides` | oEmbed |
| Folder | `General Sharing` | oEmbed |
| Link sharing | **On** — oEmbed resolves with no auth | `GET /api/oembed` returns 200 with a thumbnail |
| File type | **A Figma *Design* file, not Figma Slides** | URL is `/design/`, not `/deck/` |
| Canvas shape | One vertical column of frames | thumbnail is 89×450 and 178×900 — aspect ≈ 0.198 |
| Slide count | **~10, unconfirmed** | counted off the thumbnail |

**What could not be read, and why it matters.** Figma's public thumbnail is
signed per size. `height=450` and `height=900` return WebP; `height=1800`
returns a JSON error, so 178×900 for the *entire ten-slide stack* is the
ceiling — roughly **178×90 per slide**. Every word on every slide is
illegible at that size. The structure below is read off shapes and block
positions, and **every line of it is a guess until §10's pull runs**:

| # | Apparent slide | Apparent content |
| --- | --- | --- |
| 1 | Title | `beck qing` wordmark, monogram, a subtitle line |
| 2 | hi, it's beck | portrait/illustration left, a paragraph right |
| 3 | logo meaning | monogram large, explanatory copy |
| 4 | logo design | construction/geometry, copy |
| 5 | (unclear) | a wide dark band, possibly a divider or process strip |
| 6 | color palette | a swatch row + a copy column |
| 7 | typography | two type specimens |
| 8 | palette in use | a grid of existing artworks |
| 9 | (unclear) | photo-led, dark |
| 10 | Closing | monogram, sign-off |

**This is why the spec is written to a content *contract* rather than to
specific copy.** §5–§8 define what each kind of slide becomes in HTML; §10
fills in which slides exist and what they say. If the pull reveals a slide
that fits none of §6's layouts, that is a gap in §6 — add a layout, don't
flatten the slide to fit. Same rule as the essay imports.

### The deck is a *second* Figma source, and that is a hazard

`docs/brand/bq-logo-artboard.svg` was exported 2026-08-27 from Figma file
**`nSrYPqfF0aNuJSPrwxE3Lk`, node `210-2`** — a different file from this deck.
The site's `BrandMark` geometry is lifted verbatim from that artboard.

So there are now two Figma files describing one identity, and nothing has ever
checked that they agree. If the deck's logo-design slide shows different paths,
different stroke weights, a different palette, or different typefaces than what
ships, **that is a real finding, not a rounding error** — see §11's blockers.
Do not reconcile it by quietly redrawing either one.

---

## 2. Why rebuild, and what it costs

For the record, since this decision will look expensive from inside the build:

| Approach | What it costs | What it gives up |
| --- | --- | --- |
| `embed.figma.com` iframe | ~nothing | Third-party iframe, Figma chrome, no text for search or screen readers, poor on phones, dies if the share link changes, and the brand slides can silently contradict the site |
| Exported slide images | One export pass, alt text per slide | Same silent-drift problem; text locked in pixels; a 10-slide deck of 2x PNGs is a real payload |
| **Rebuild as HTML** | **This spec** | Nothing, except the deck and the page are now two artifacts that a future edit to the Figma file will not propagate to |

That last cost is real and is accepted because §0 records the deck as
**finished**. §10's script and §10.3's fidelity check are what make re-pulling
cheap if that turns out to be optimistic.

**What the rebuild buys that neither alternative can:** the palette slide
renders the actual brand hexes next to the actual token names; the typography
slide renders in the actual webfonts at the actual `headingStyles` sizes; the
mark slide renders `BrandMark` itself. Three slides that are *the system*
rather than a photograph of it.

---

## 3. Taxonomy: `art` + a new `design` tag

### The change

```ts
// lib/work.ts
art: { name: 'medium', tags: ['watercolor', 'digital', 'ink', 'design'] },
```

One array, one word. Everything else follows for free:

- **`ALL_TAGS`** derives from the facets, so `design` becomes filterable and
  `?tags=design` becomes a valid deep link with no further wiring.
- **`categoryLabel()`** (`components/work-visuals.tsx:69`) scans disciplines in
  `DISCIPLINES` order and returns the first facet tag an item carries — so the
  piece's meta line and its placeholder watermark both read **`design`**.
- **`mediumFor()`** (`lib/work.ts:660`) returns the first match **in array
  order**, so `design` goes *last*: a hypothetical future piece tagged both
  `digital` and `design` keeps reporting `digital`, which is the existing
  behaviour for every piece today. Appending is the safe position.
- **`toneFor()`** resolves via `primaryDiscipline()` → `art` → the denim
  `--hero-accent-art`. The deck page is denim. No new colour token.

### The facet's name is not a problem

`DISCIPLINE_FACETS.art.name` is `'medium'`, and design is not a medium. This
would matter if the name were rendered — **it isn't.** `.name` has zero
consumers; `components/work-gallery.tsx` reads only `.tags`, in two places
(`:1897`, `:1905`). The name is an internal grouping label. Don't rename the
facet, and don't invent a new one to hold a single tag.

### The one thing that does ripple

`MAX_DISCIPLINE_CHIPS` derives the filter panel's **invisible height
reservation** — the widest possible chip row, rendered inertly so the row never
grows or shrinks as disciplines toggle. Adding a fourth art medium widens that
reservation by one chip.

**This must be checked live, not assumed.** The filter panel was rebuilt on
2026-09-10 (`e135a14`) and docked-on-scroll; a reservation that now wraps to an
extra line changes the panel's resting height at every breakpoint. Check at
375px, 500px, and 1024px. If it wraps, that is a panel-layout finding to
record — not a reason to drop the tag.

### Why not a fourth discipline

Considered and rejected with Beck. `design` as a fourth discipline would touch
`DISCIPLINES`, `DISCIPLINE_FACETS`, `DISCIPLINE_TONE` (needing a new brand
colour), `DISCIPLINE_PRECEDENCE`, the home page's three columns, the hero
collage, and the filter panel — to stand up a discipline containing exactly one
item. The site's stated rule is that **vocabulary follows the data**; one piece
does not make a discipline. Revisit if a second and third design piece land.

---

## 4. File-by-file

| File | Change |
| --- | --- |
| `lib/work.ts` | `design` appended to `DISCIPLINE_FACETS.art.tags`; the `personal-branding` `WorkPiece` added to `WORK`; `'personal-branding'` added to `MDX_BODY_SLUGS` |
| `lib/mdx-bodies.ts` | Imports the new body; `BODIES` gains one key. Its header comment gains `content/decks/` as the **third** content directory |
| `content/decks/personal-branding.mdx` | **New.** The deck's copy, verbatim, marked up with §5's components |
| `components/deck.tsx` | **New.** `Deck`, `Slide`, `SlideFigure` — §5, §6, §7 |
| `components/brand-palette.tsx` | **New.** `BrandPalette` — §8.1 |
| `components/type-specimen.tsx` | **New.** `TypeSpecimen` — §8.2 |
| `components/mark-construction.tsx` | **New.** `MarkConstruction` — §8.3 |
| `app/work/[slug]/page.tsx` | One new branch in `PieceView`, ahead of the `textForward` branch — §6.1 |
| `scripts/pull-brand-deck.mjs` | **New.** Figma API pull — §10.1 |
| `scripts/check-deck-fidelity.mjs` | **New.** Verbatim guard — §10.3 |
| `docs/brand/deck-source.json` | **New, committed.** The verbatim transcript the check diffs against |
| `public/brand/deck/` | **New.** Only the rasters that genuinely cannot be rebuilt — §9 |
| `app/globals.css` | Unchanged unless §7.6's slide-fit rule needs a keyframe |
| `components/work-gallery.tsx` | Unchanged — the new tag flows through `ALL_TAGS` |
| `components/essay.tsx` | Unchanged — `essayComponents` already maps the MDX primitives |

No new dependencies. `@base-ui/react`'s `Dialog` and `lucide-react` are both
already in use.

---

## 5. Authoring: the slide is the unit

The deck genuinely has slides, so slides are what gets authored — one source,
two presentations. `content/decks/personal-branding.mdx`:

```mdx
import { Deck, Slide, SlideFigure } from '@/components/deck'
import { BrandPalette } from '@/components/brand-palette'
import { TypeSpecimen } from '@/components/type-specimen'
import { MarkConstruction } from '@/components/mark-construction'

<Deck>
  <Slide id="hi" title="hi, it's beck" layout="split">
    <SlideFigure src="/about/beck-friendly-neighborhood-artist.webp" aspect="4/5" alt="…" />

    …verbatim copy…
  </Slide>

  <Slide id="logo-meaning" title="logo meaning" layout="figure">
    <MarkConstruction step="mark" />

    …verbatim copy…
  </Slide>

  <Slide id="palette" title="colour palette" layout="full">
    <BrandPalette />
  </Slide>
</Deck>
```

This works with the existing machinery exactly as-is: MDX files already import
their own components (`content/essays/chinese-emoji-poetry.mdx:1`), and
`mdx-components.tsx` already supplies the prose primitives through
`essayComponents`, so `<p>`, `<ul>`, `<h2>`, and links inside a `<Slide>` get
the site's typography with no extra wiring.

`Deck` is a **client component** (present mode is state) receiving
server-rendered MDX as `children`. It reads the slide list with
`React.Children.toArray(children)` and each slide's `id` / `title` / `layout`
off `element.props` — plain elements, no registry, no context needed for the
list itself.

### Content rules

- **The copy is transcribed verbatim.** This is an import, and ARCHITECTURE's
  "Imported content is never rewritten" convention applies in full: not
  paraphrased, not tightened, not re-punctuated, not stripped of structure.
  §10.3's check exists to make that auditable rather than aspirational.
- **The title slide and the closing slide are dropped**, and the page's own
  header takes their place — §6.2. Flagged as a blocker (§11.7) because it is
  an editorial call, not a mechanical one.
- **`id` is a slug, not a number.** It is the anchor in scroll mode and the URL
  state in present mode (§7.5); indexes shift the moment a slide is inserted.

---

## 6. Scroll mode

### 6.1 The page branch

`PieceView` in `app/work/[slug]/page.tsx` currently branches code-demo →
text-forward → default. Add a **deck branch first**, for the same reason the
code-demo branch comes first: a deck piece carries an MDX body and an `image`
and no `text`, so it would otherwise fall through to the default image branch
and render as a plain picture with an essay under it — silently wrong.

```
isDeck(piece)  →  header (title, meta, description, present button)
                  then <Body /> at full width
```

`isDeck` is a new predicate in `lib/work.ts`, matching the `isCodeDemo` idiom.
Simplest honest form: `MDX_BODY_SLUGS`-style — a `deck?: true` field on
`WorkPiece`, checked directly. Do not infer it from the slug.

**The body does not go inside `EssayBody`.** `EssayBody` is `max-w-2xl`
(`components/essay.tsx:31`) and the deck needs full width. Instead the branch's
wrapper sets the accent variable and `Deck` owns its own width:

```tsx
<div style={{ '--essay-accent': tone } as CSSProperties}>
  <Body />
</div>
```

CSS variables inherit, so each `Slide`'s prose column can use `EssayBody`
**without a `tone` prop** and still pick up the piece's denim. That keeps the
prose measure at `max-w-2xl` where it belongs — inside the slide — while the
slide itself can be as wide as its figure needs.

### 6.2 The header is slide one

The page already renders an `h1`, the `categoryLabel · discipline · year` meta
line, and `description`. A rebuilt title slide would say the same words a
second time, twenty pixels lower. So: **the deck's title slide is not
rebuilt** — the page header *is* it. In present mode the same header renders
as the cover (§7.4), from the same data, so nothing is duplicated and nothing
is lost.

The closing slide goes for the same reason: the site has a footer.

### 6.3 Slide layouts

`Slide` takes a `layout` from a closed set. The deck's Figma compositions do
not survive verbatim — a 16:9 frame and a phone screen are different problems —
so the contract is that each slide declares *what kind of composition it is*
and the component decides how that reflows:

| `layout` | Desktop | Narrow |
| --- | --- | --- |
| `prose` | One `EssayBody` column, centred | Same |
| `figure` | Figure centred, prose beneath at `max-w-2xl` | Same |
| `split` | Figure and prose side by side, figure ≤ 40% | Stacks, **figure first** |
| `full` | The child owns the full width (palette, specimen) | Same, child reflows |

`split` stacking figure-first is deliberate: it preserves the slide's reading
order, and the figure is what identifies the slide when you're scanning.

### 6.4 Section semantics

Each `Slide` renders a `<section>` with `aria-labelledby` pointing at its
heading. The heading is an `h2` from `headingStyles.h2` — the page's `h1` is
the piece title, and a slide title is one level under it, which is exactly the
rule `lib/heading-styles.ts` documents. Slide titles are **not** eyebrows.

A rule with a bug in it: **the `id` goes on the scroll-mode instance only.**
Present mode renders a second copy of the same slide element (§7.3), and two
elements sharing a DOM id while the dialog is open breaks anchor links and
`aria-labelledby` both. `Deck` passes a "presenting" flag through context;
`Slide` omits `id` and derives a distinct `aria-labelledby` id when it's set.

---

## 7. Present mode

### 7.1 What it is

A button in the page header — `Presentation` icon, label `present` — opens the
deck fullscreen, one slide at a time. It is for showing the deck to someone:
an interview, a call, a laptop turned around. It is not the primary way the
page is read.

### 7.2 Dialog, then fullscreen — in that order

Two precedents exist in this codebase and they disagree, for good reasons:

- `CodeDemoFrame` uses the **real Fullscreen API on its own wrapper**, because
  reparenting an iframe into a dialog reloads the demo.
- `ImageLightbox` uses a **`@base-ui/react` `Dialog`**, which brings focus
  trapping, Escape, scroll lock, and focus restoration for free.

The deck has no iframe, so it takes the Dialog — and *then* requests fullscreen
on the popup element:

```
open → Dialog opens → popupRef.current?.requestFullscreen().catch(() => {})
```

The `catch` is load-bearing, not defensive noise: **iOS Safari on iPhone has no
`requestFullscreen`.** The promise rejects, nothing is thrown, and the overlay
alone is the experience there — which is fine, since the Dialog already covers
the viewport.

**The double-Escape is documented, not fixed.** When the browser is genuinely
fullscreen, the first Escape is consumed by the browser to exit fullscreen; a
second closes the dialog. Do not try to close the dialog on `fullscreenchange`
— that makes F11 close the deck, which is worse. Listen to `fullscreenchange`
only to keep the button's own state honest.

### 7.3 One source, two renders

Present mode renders the same `Slide` elements, one at a time, inside the
dialog. React mounts a second copy; that is fine and deliberately not
optimised — there are no iframes, images are already cached, and trying to
reparent live DOM between two layouts is how this gets fragile. See §6.4 for
the one thing that copy must not duplicate.

### 7.4 Controls

| Input | Action |
| --- | --- |
| `→` `↓` `Space` `PageDown` | next |
| `←` `↑` `PageUp` | previous |
| `Home` / `End` | first / last |
| `Escape` | close (twice, when fullscreen — §7.2) |
| Horizontal swipe, ≥50px | next / previous |
| On-screen `‹` `›` | next / previous |

Paging **clamps** at both ends — it does not wrap. A deck that silently loops
back to slide one reads as a bug mid-presentation.

The on-screen controls and the `n / total` counter **fade on idle and return on
any activity**, reusing `ImageLightbox`'s existing idle pattern (its
`resetIdle` listens on `keydown` and `focusin` as well as pointer events, so a
keyboard user tabbing through the controls doesn't watch them fade out from
under the cursor).

The swipe handler ignores gestures that begin inside a scrollable element, so
§7.6's overflow case doesn't page the deck sideways while someone is reading.

### 7.5 URL state

Opening present mode writes `?slide=<id>` — the slide's slug, matching the
gallery lightbox's `?view=<slug>` precedent, which already chose slugs over
indexes for the same reason. Closing removes it. Loading `/work/personal-branding?slide=palette`
opens present mode on that slide.

Static export is unaffected: this is client-side `searchParams`, exactly as the
gallery does it. An unknown `?slide=` value is **dropped, not an error** —
same posture as `ALL_TAGS` gating the `?tags=` parser.

### 7.6 Fitting a slide to the screen

Rebuilt HTML does not have a fixed 16:9 height, and a real screen is whatever
the laptop is. The rule: **a slide that overflows scrolls inside its own
column. Text is never scaled down to fit.** Scaling type to fit is how decks
end up with 9px body copy on a projector.

In practice this should almost never trigger, which makes it an authoring
constraint worth writing down: if a slide needs to scroll in present mode at
1280×720, it is two slides.

Transitions are a crossfade, and **`prefers-reduced-motion: reduce` removes
them entirely** — no slide, no fade, instant swap.

### 7.7 Explicitly not built

No autoplay or timer. No speaker notes. No presenter view. No PDF or print
stylesheet. No remote/clicker support. If any of these turn out to matter,
they are a follow-on spec, not a stretch goal inside this one.

---

## 8. The three slides that render live

This is the payoff §2 promised. These slides have **no exported image at all**.

### 8.1 `BrandPalette`

Renders the monogram's palette — the five colours ARCHITECTURE's "The
monogram" table already documents, with share, token, and role:

| Colour | Share | Token | Role |
| --- | --- | --- | --- |
| `#ced2cd` | 54.7% | `--moon` / `--foreground` (dark) | the rounded-square field |
| `#080b24` | 20.3% | `--foreground` (light) / `--background` (dark) | the letterforms |
| `#ffffff` | 3.6% | — | the `b`'s counter |
| `#0c3559` | 2.0% | `--indigo` (both themes) | the wedge |
| `#69635e` | 1.9% | `--muted-foreground` (light) | where `b` and `q` overlap |

Three rules, each of which is a bug if broken:

1. **Swatches render their literal hex in both themes.** A brand colour does
   not change because someone flipped the theme. The *token mapping* beside it
   is what's theme-dependent, and it is shown as text (`--foreground` in
   light, `--background` in dark), not demonstrated by the swatch changing
   underneath the reader.
2. **Every swatch gets a hairline border.** `#ffffff` and `#ced2cd` otherwise
   disappear into the light theme's `#f3f4f0` card.
3. **Labels are never drawn in the swatch's own colour.** `#ced2cd` on the
   light background is unreadable. Labels are `--foreground` / `--muted-foreground`.

The hexes are a literal const array in the component, **duplicated from
`app/globals.css` on purpose**, with a comment saying so and citing "The
monogram" in ARCHITECTURE.md as the source of truth. They cannot be read from
the live tokens, because the live tokens are *theme roles* — `--foreground` is
two different colours — and this slide is documenting fixed brand facts.

### 8.2 `TypeSpecimen`

Renders specimens in `var(--font-recursive)` and `var(--font-noto)` — the
actual webfonts `app/layout.tsx` loads, so the specimen cannot drift from what
the site sets.

And it renders the heading ladder **by applying `headingStyles.h1`–`h5`
directly** (30/24/20/18/16), so the typography slide literally *is* the site's
type scale rather than a picture of one. If the scale moves again — it has
moved four times — this slide moves with it.

**This is where the two-sources hazard is most likely to bite.** See §11.3.

### 8.3 `MarkConstruction`

Renders `BrandMark` at display size, plus a construction figure built from the
same four paths — `B_ASCENDER`, `Q_STEM`, `BOWL`, `WEDGE`, `stroke-width: 11`
on a 150 viewBox, `stroke-linecap: round` — with callouts.

Reuse `components/brand-mark.tsx`'s exported geometry rather than re-pasting
the path data; if the constants aren't currently exported, exporting them is
the change, not copying them. ARCHITECTURE's "Construction: mask the bowl,
don't overpaint it" is the content of the construction callout, and is worth
showing precisely because it is the part that silently breaks when redrawn.

Per ARCHITECTURE's standing rule, `MarkConstruction` **does not reach into
`docs/brand/`** — that directory is source assets, and the app imports a
component built from them.

---

## 9. What actually gets exported

Almost nothing. Export only what cannot be rebuilt:

| Asset | Decision |
| --- | --- |
| The portrait on the "hi, it's beck" slide | **Check `public/about/beck-friendly-neighborhood-artist.webp` first** — it may already be the same image. Reuse beats re-export |
| The "palette in use" artworks | **Reuse `public/art/`.** These are Beck's existing pieces and are already on the site at full quality. Re-exporting them out of a Figma frame would ship a second, worse copy. Blocker §11.5 names which |
| The gallery cover (`piece.image`) | **One export.** The title slide at 2x → `public/brand/deck/cover.webp`, `imageAspect: '16/9'`. A design piece with no cover falls back to `WorkPlaceholder`'s tinted placeholder, which would be a weak card for a piece that is entirely about visual identity |
| Anything else | Only if it has no live equivalent. Every export is a thing that can drift |

Exports go to `public/brand/deck/`, as WebP. Note the deliberate split:
`docs/brand/` is **source** (the SVG artboard, the transcript JSON);
`public/brand/` is **shipped asset**. That boundary already exists and this
keeps it.

---

## 10. Pulling the content out of Figma

### 10.1 `scripts/pull-brand-deck.mjs`

Node only, no dependencies, not wired into the build — the same shape as
`scripts/check-emoji-subset.mjs` and `scripts/check-essay-fidelity.mjs`.

```
node scripts/pull-brand-deck.mjs
```

1. Read `FIGMA_TOKEN` from `.env.local`. Already gitignored — `.gitignore`
   covers `.env*.local`. A scoped Figma token needs **`file_content:read`**.
   **The token is never committed, never logged, and never written into
   `deck-source.json`.**
2. `GET https://api.figma.com/v1/files/cZbOK8t70Q8328FzE5xtgH`, header
   `X-Figma-Token`.
3. Walk the canvas's top-level `FRAME` nodes and **sort by
   `absoluteBoundingBox.y`** — the deck is a vertical column (§1), so document
   order is not guaranteed to be reading order, but geometry is.
4. Per frame, collect every `TEXT` node's `characters`, ordered by
   `(y, x)` of its own bounding box.
5. Write `docs/brand/deck-source.json` — `[{ index, name, id, text: [...] }]`.
   **Committed**, so the verbatim rule is auditable by anyone later, and so
   the check in §10.3 works without a token.
6. `GET /v1/images/:key?ids=…&format=png&scale=2` for only the node ids §9
   actually needs.

### 10.2 Then the transcription

The MDX is written **from `deck-source.json`, not from the images.** That is
the whole reason for choosing the token route: no OCR, no reading text off
pixels, no paraphrase creeping in at the transcription step. The strings in the
JSON are the strings Beck typed.

### 10.3 `scripts/check-deck-fidelity.mjs`

Models `scripts/check-essay-fidelity.mjs` exactly: strip JSX and Markdown
markup from `content/decks/personal-branding.mdx`, strip nothing from
`deck-source.json`, normalise whitespace, diff word by word, report the first
20 differing runs with context, exit non-zero on any difference outside an
explicit allowlist.

The allowlist is where the **dropped title and closing slides** (§6.2) are
recorded — as named skips with a one-line reason each, exactly the way the
essay checker allowlists its omitted image placeholders. An omission that is
recorded is fine; an omission that is silent is the failure mode this whole
convention exists to prevent.

---

## 11. Blockers — what this needs from Beck

Nothing below is a design question. Each is a fact only Beck has.

1. **`FIGMA_TOKEN`** in `.env.local`, with `file_content:read`. Everything
   downstream of §10 is blocked on this and nothing else.
2. **The real slide list.** §1's table is read off a 178×900 thumbnail and is
   explicitly a guess — including the two slides marked "unclear".
3. **Typography reconciliation.** If the deck's typography slide names
   typefaces other than Recursive and Noto Sans, then either the deck
   documents an intent the site never implemented, or the site is off-brand.
   Beck decides which; §8.2 is written assuming they agree. **Do not resolve
   this by editing either one.**
4. **Mark reconciliation.** Does the deck's logo geometry match
   `docs/brand/bq-logo-artboard.svg` (file `nSrYPqfF0aNuJSPrwxE3Lk`)? Same
   question, same rule — see §1.
5. **Which artworks are on the "palette in use" slide**, by slug, so §9 can
   reuse `public/art/` files instead of re-exporting.
6. **The `WorkPiece` fields:** `year`, `description`, `preview`, and the tier
   (`favorite` / `general` / `archive`). Proposed slug: `personal-branding`.
7. **Confirm the title and closing slides are dropped** (§6.2), or say what
   should carry them.
8. **Is the portrait on slide 2 the same image as
   `public/about/beck-friendly-neighborhood-artist.webp`?**

---

## 12. Acceptance

- `tsc --noEmit` clean; `next build` clean. **Page count goes up by exactly
  one** — `/work/personal-branding` — from whatever the count is at build time.
- `node scripts/check-deck-fidelity.mjs` exits 0.
- `/work/personal-branding` renders every slide as a section, in deck order,
  with one `h1` (the piece title) and one `h2` per slide.
- `/work?tags=design` surfaces exactly this piece. The piece's meta line reads
  `design · art · <year>`.
- The filter panel's resting height is unchanged at 375px, 500px, and 1024px,
  or the change is recorded (§3).
- Present mode: opens fullscreen where the API exists and as an overlay on
  iPhone; every key in §7.4 works; paging clamps at both ends; Escape returns
  focus to the `present` button; `?slide=<id>` round-trips; an unknown
  `?slide=` is dropped silently.
- `prefers-reduced-motion: reduce` removes the transition.
- Both themes: every swatch in `BrandPalette` is distinguishable from the card
  behind it, and every label is legible (§8.1's three rules).
- No horizontal page scroll at 375px in either mode.
- Nothing in `components/` reads from `docs/brand/`.

## 13. Documentation to update in the same change

- **`docs/ARCHITECTURE.md`** — the Routes table gains nothing (it's
  `/work/[slug]`), but: "Content model" gains the `design` tag and the `deck`
  field; a new section describes `Deck`/`Slide` and present mode; "The brand
  mark" gains a line noting the deck is a second Figma source and how §11.3
  and §11.4 were resolved; "Conventions" notes `content/decks/` as the third
  MDX content directory.
- **`docs/TODO.md`** — a new section for whatever §11 leaves open, and for any
  filter-panel finding from §3.
- **This file moves to `docs/history/`** once it ships, stamped with where the
  build diverged — including the corrected version of §1's slide table, which
  will be the first thing the pull invalidates.

## 14. Out of scope

- A fourth `design` discipline (§3).
- A `/colophon` route, or anything on `/about` (§0).
- Any sync relationship with Figma. §10 is a one-time pull with a re-runnable
  script, not a build step.
- Everything in §7.7.
- Changing the mark, the palette, the type scale, or the site's tokens. If
  §11.3 or §11.4 finds a disagreement, resolving it is **its own change**, made
  deliberately, not folded into an import.
