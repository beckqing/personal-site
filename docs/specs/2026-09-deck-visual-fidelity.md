# Spec — deck visual fidelity: rebuild the branding deck *as the deck*

> **Status: designed 2026-09-17 with Beck, not built.**
>
> This spec **supersedes the visual half** of
> [2026-09-panels-and-rail.md](2026-09-panels-and-rail.md) — its `Panel.layout`
> enum (§3.4), its per-panel composition rules (§6.3), and the assumption
> running through it that a deck slide should be re-expressed in the site's
> own prose idiom. It also **supersedes §8.1–§8.3** of
> [../history/2026-09-branding-deck.md](../history/2026-09-branding-deck.md)
> (the palette, typography, and mark-construction render rules — the last of
> which is dropped outright rather than replaced, per §12).
>
> It **does not touch** the parts of panels-and-rail that work and that Beck
> has not complained about: continuous scroll, the dot rail, `PanelContents`,
> `#id` anchors, present mode staying cut, and the server-component structure
> that fixed the original render bug. Those stand exactly as specced.
>
> **Scope note.** Everything here concerns `/work/personal-branding`. The MQP
> case study (`2026-09-aortic-valve-calcification.md`) shares the `Panels`
> primitive but is *not* a recreated artifact — it keeps today's responsive
> prose layout. See §3.1 for how one primitive serves both.

Beck's verdict on the shipped build: the slides "have been very poorly
recreated," and what's wanted is a recreation that looks **almost identical**
to the Figma deck — backgrounds included, and backgrounds meaning not just a
fill colour but "different formatting and other design elements that aren't
the main things, such as the geometric shapes used as decoration." The
palette and typography slides are **hand-formatted**, and must stay hand
formatted.

That is a different brief from the one the last two specs were written
against, and §1 explains why they could not have met it even in principle.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| What a deck panel is | **A recreation of a fixed 1920×1080 composition**, not a responsive re-interpretation of its content | Beck, 2026-09-17 |
| Small screens | **Scaled stage down to 640px; hand-authored reflow below it.** One faithful composition, one readable fallback — §11 | Beck, 2026-09-17 |
| Theming | **The deck keeps its own colours in both site themes.** It is a designed artifact shown as-is, like an artwork — §5 | Beck, 2026-09-17 |
| Decorative geometry (shape fields, icon scatters, scrims, rules) | **In scope, and load-bearing.** It is the thing that makes a slide look like the slide | Beck, 2026-09-17 |
| Palette + typography slides | **Hand-formatted, reproduced as drawn** — not regenerated from a responsive grid — §8 | Beck, 2026-09-17 |
| Source of truth for geometry | **The Figma REST API**, extended per §9 — never OCR, never a screenshot trace | Standing rule, ARCHITECTURE |
| Slides rendered as flat images | **No.** Real HTML/SVG, as before. Fidelity is achieved by measuring, not by screenshotting | Standing rule, ARCHITECTURE |
| `MarkConstruction` | **Removed.** The construction diagram is not on the Logo Design slide; the three alternate-palette chips are — §12 | Beck, 2026-09-17 |
| The Logo Drafting sketch pile | **Flattened to one white-on-transparent asset.** Exact, not approximate — `LIGHTEN` is `max()`, which is associative — §6.3.1 | Beck, 2026-09-17 |
| The 1px duplicates in that pile | **Deliberate — they thicken the stroke.** Baked into the flattened asset rather than reproduced as layers | Beck, 2026-09-17 |

---

## 1. The finding: why the deck does not look like the deck

`scripts/pull-brand-deck.mjs` walks the Figma document and keeps exactly one
thing per node:

```js
if (node.type === 'TEXT' && typeof node.characters === 'string') {
  out.push({ y, x, characters: node.characters })
}
```

`characters`, plus a sort key. **Every other property of every other node is
discarded** — fills, strokes, corner radii, rotations, gradients, sizes,
positions, font families, font sizes, text colours, and every non-`TEXT` node
in the file. `docs/brand/deck-source.json` is a transcript, and a transcript
is all it has ever been.

So `check-deck-fidelity.mjs` verifies the one dimension that was captured —
the copy matches word for word, and it genuinely does — while **nothing at all
verifies the visual design**, because nothing ever recorded it. The green
check mark on the fidelity script is not evidence about appearance, and it
was read as though it were.

Consequently every visual decision in the shipped build was invented at the
component level, in good faith, from site convention: uniform swatch grids,
`rounded-xl`, `tracking-[0.3em]` labels, `text-muted-foreground`, an invented
heading ladder, invented token annotations, the site's own page background
behind every panel. **This is the same class of error the branding-deck
history file records against its own §1** — guessing a design off insufficient
data — but one layer down, and it survived because the checker's pass was
mistaken for a fidelity guarantee.

**The repair is in this order:** capture the geometry (§9), then rebuild
against it (§3–§8), then check it (§10). Rebuilding before capturing would be
a third guess.

### 1.1 What the file actually contains

A read-only pull of the full document (9 visible frames, 1 hidden scratch
frame, confirming the existing frame list) shows every slide carries
structure that the transcript dropped:

| Slide | Background | Non-text structure the transcript dropped |
| --- | --- | --- |
| 0 Title | `#0C3559` indigo | Rotated midnight card + pale-slate card offset behind the monogram; 500×500 monogram; 4px denim rule |
| 1 About Me | `#080B24` midnight | **50 scattered icon vectors** in indigo; photo bleeding off the left edge at 778×1405 |
| 2 Logo Drafting | `#305789` denim | 8 sketch photos bleeding off-canvas, **all `LIGHTEN`-blended** (white ink on opaque black — the blend is a knockout), two deliberately double-printed 1px apart; a **linear gradient scrim** 1920×979 over them; 200×200 logo; 4px pale-slate rule |
| 3 Logo Design | `#CED2CD` pale slate | **13 rotated ellipse/subtract shapes** down the right edge; 500×500 monogram; **three 170×170 "alternate palettes" chips**; 4px rule |
| 4 Typography | `#0C3559` indigo | A 3-row specimen table ruled by **three 4px denim hairlines**; a decorative 162×190 vector by the title |
| 5 Palette | `#CED2CD` pale slate | An **800×800 unequal mosaic** with labels *inside* the swatches; a **4-row colour-blind simulation** block |
| 6 Palette Uses | `#080B24` midnight | **9 discipline-coloured icons**; artwork bleeding full-height at 617×1080; three 340×90 pills |
| 7 Profile Pictures | `#CED2CD` pale slate | A **96px `profile_picture.jpg` label rotated −90°** up the left edge; 3×2 grid of 300×300 squares |
| 8 Conclusion | `#0C3559` indigo | Pale-slate card 699×434 with a 400×400 photo **overlapping its top edge**; glyphs; 4px white rule |

Four of those eleven items were explicitly allowlisted *out* of the fidelity
check as "decoration, not authored content" or "not exported." They are the
design.

---

## 2. Principles for this rebuild

1. **Measured, not guessed.** Every number in §6 and §8 comes from the API
   pull. Anything not measured is called out as such.
2. **Real HTML and SVG.** No slide is a flat PNG. Text stays text, selectable
   and searchable; the fidelity checker in §10 still word-diffs it.
3. **Faithful ≠ frozen.** Where the site already owns the *same* asset —
   the monogram, the 50 brand icons, the discipline hues — the panel renders
   it from the site's own source (§7.1), so it cannot drift. That preserves
   the one genuinely good idea in the shipped build.
4. **Decoration is content.** Shape fields, scrims, rules, and the rotated
   filename label are reproduced, not summarised.
5. **The deck's own colours win** over site theme tokens, everywhere inside a
   panel (§5).

---

## 3. The stage

### 3.1 A third `Panels` mode, not a replacement

`Panel.layout`'s current closed set (`prose | figure | split | full | cover`)
describes *responsive compositions*. A recreated slide is not one of those, so
it gets its own value rather than a sixth flavour of the same idea:

```
layout="stage"
```

A `stage` panel means: **my children are positioned in 1920×1080 deck
coordinates; scale me to fit.** Every other layout keeps its present meaning
and present behaviour, which is what lets the MQP case study go on using
`prose`/`split`/`full` untouched.

`Panels`, `PanelContents`, and `PanelRail` need **no changes** — they read
`id`/`title` off props and know nothing about a panel's internals.

### 3.2 How the stage scales

The stage is a plain block that owns its aspect ratio and publishes one CSS
variable its children position against:

- Outer element: `aspect-ratio: 16 / 9`, `container-type: inline-size`,
  `overflow: hidden`.
- Inner element (the stage): `width: 1920px; height: 1080px`,
  `transform: scale(var(--s)); transform-origin: top left`, where
  `--s: calc(100cqw / 1920)`, **and the slide's own background fill (§5)** —
  on this element rather than the outer box. With §6.3.1's flatten nothing
  blends against it any more, so this is now hygiene rather than a constraint;
  keep it anyway so a future blended layer cannot quietly break.
- Children: `position: absolute`, with `left/top/width/height` in **raw deck
  pixels** — the coordinates in §6 and §8, transcribed directly.

This is the property that makes the work tractable: **a developer copies the
measured numbers in and the composition is correct**, with no responsive
judgment calls to get wrong. It is also why the numbers are in this document
rather than left to be eyeballed later.

`cqw`-based scaling (not a viewport unit) keeps the stage correct inside
`<main>`'s `max-w-5xl`, inside the mobile reflow, and in any future context.

### 3.3 Type inside a scaled stage

Font sizes are declared in deck pixels (`font-size: 32px`) and scaled by the
same transform, so the *typographic* proportions of the slide survive exactly.
At `max-w-5xl` (1024px) the scale factor is ≈0.53, putting the deck's 32px
body copy at ≈17px rendered — comfortable. At 640px it is ≈10.7px, which is
the floor, and is precisely where §11's reflow takes over.

### 3.4 Accessibility inside a stage

Scaling is visual only; the DOM keeps reading order, so this costs nothing
structurally. Three rules:

- Each stage keeps its `<h2 id="{id}-title">`. Where a slide's own title is
  positioned decoratively (slide 7's rotated label) or absent (slide 8), the
  `<h2>` is `sr-only` and the decorative treatment is `aria-hidden`.
- Decorative vector fields, scrims, and rules are `aria-hidden="true"`.
- **Two measured contrast exceptions are Beck's deliberate design and are
  kept**, recorded here so they are not "fixed" by a later pass: the cover's
  midnight tagline on indigo (§6.1), and the goldenrod swatch's terracotta
  label (§8.1). Both are quiet-by-intent. They are decorative restatements of
  text that also appears at full contrast elsewhere on the page.

---

## 4. Typography

The deck uses **five** distinct Recursive instances plus Noto Sans. The site
loads Recursive as a variable font with the `CASL`, `MONO`, and `slnt` axes
(`app/layout.tsx`), so all five are reachable — but only two have classes
today (`.font-brand`, `.font-brand-italic`), and **neither of the two the deck
leans on hardest exists yet**.

| Deck instance | Axes / weight | Class | Used for |
| --- | --- | --- | --- |
| `RecursiveMonoCsl-Bold` | `MONO 1, CASL 1, slnt 0`, 700 | `.font-brand` + `font-bold` | Slide titles (64px), names, pills |
| `RecursiveMonoCsl-Italic` | `MONO 1, CASL 1, slnt -14`, 400 | `.font-brand-italic` | **Palette swatch labels**, cover title |
| `RecursiveSansCsl-BdItalic` | `MONO 0, CASL 1, slnt -14`, 700 | **new — `.font-brand-sans-italic`** | Typography slide's row labels |
| `RecursiveMonoLnr-Bold` | `MONO 1, CASL 0, slnt 0`, 700 | **new — `.font-brand-linear`** | All six profile-picture captions |
| `RecursiveMonoCsl-SemiBd` | `MONO 1, CASL 1, slnt 0`, 600 | `.font-brand` + `font-semibold` | Slide 7's rotated filename label |
| Noto Sans | 400 / 500 | `.font-sans` | All body copy, all captions |

Add the two new classes to `globals.css`'s `@layer components`, beside the
existing pair.

> **Note the pattern.** Body copy in this deck is *always* Noto Sans, and
> Recursive is reserved for titles, names, labels and specimens. The shipped
> build inverts this in places. Also note `.font-brand` carries
> `letter-spacing: -0.01em` that the deck does not have; a stage should reset
> it to `0`.

### 4.1 The measured type scale

| Role | Font | Size / line-height | Align |
| --- | --- | --- | --- |
| Slide title | Recursive Mono Casual Bold | 64 / 77 | varies, see §6 |
| Body copy | Noto Sans 400 | 32 / 44 | left |
| Caption / secondary | Noto Sans 400 | 24 / 33 | varies |
| Specimen name | Recursive or Noto, 400–700 | 40 / 48–54 | left |
| Specimen alphabet | Recursive Mono Casual Bold | 32 / 38 | left |
| Palette swatch label | Recursive Mono Casual Italic | 24 / 29 | **right** |
| Profile caption | Recursive Mono Linear Bold | 20 / 24 | center |
| Discipline pill | Recursive Mono Casual Bold | 32 / 38 | center |
| Rotated filename label | Recursive Mono Casual SemiBold | 96 / 115 | left |

---

## 5. Colour

**The deck's colours are literals, in both site themes.** A `stage` panel sets
its own background and its own text colours from the measured hexes and does
not consult `--foreground`, `--background`, `--muted-foreground`, or any
theme-dependent token.

Three reasons, in order of force:

1. Beck's decision (§0).
2. **The palette slide documents fixed hexes and shows them beside their own
   names.** A slide whose subject is "these exact eleven colours" cannot
   re-theme without contradicting itself.
3. The slides' backgrounds form a designed rhythm — indigo, midnight, denim,
   pale slate, indigo, pale slate, midnight, pale slate, indigo — where
   *adjacent contrast* is the effect. Re-theming would flatten it.

The eleven brand hexes are already a committed constant in
`components/brand-palette.tsx`. **Promote that array to `lib/brand-palette.ts`**
so slides 0, 3, 5 and 6 share one source. Its `token` field is dropped (§12).

Because a stage is a fixed-colour island inside a themed page, give each stage
a hairline `outline` in its own background colour and `border-radius` matching
the site's card idiom, so a pale-slate slide does not appear to bleed into a
light page. This is the one deliberate departure from the Figma frame, and it
exists only at the frame boundary.

---

## 6. The nine slides, measured

Coordinates are deck pixels from each frame's top-left. `x,y w×h`. Colours are
the measured fills. Copy is **unchanged** — it already passes the word-diff and
must continue to (§10).

### 6.1 Slide 0 — Title · bg `#0C3559`

| Element | Geometry | Detail |
| --- | --- | --- |
| Shadow card | `1020,198 732×714`, **rotate 0.3°** | fill `#080B24` |
| Face card | `1024,193 710×695` | fill `#CED2CD` |
| Monogram | `1118,263 500×500` | `BrandMark`, on the face card |
| "personal brand" | `72,26 924×97` | Recursive Mono Casual **Italic** 64/77, `#305789`, left |
| Tagline | `36,350 944×363` | Recursive Mono Casual Bold 40/48, `#080B24`, **centered** |
| Rule | `-39,145 334×4`, bleeds left | stroke `#305789` |

Notes: the title is *italic*, not bold — the shipped build has this wrong. The
tagline is midnight on indigo (§3.4's first contrast exception). The two cards
are a deliberate near-miss rotation; reproduce the 0.3° exactly, since the
whole effect is that it reads as hand-placed.

### 6.2 Slide 1 — About Me · bg `#080B24`

| Element | Geometry | Detail |
| --- | --- | --- |
| Icon field | group `685,-12 1283×1114` | **50 icons**, all `#0C3559`, bleeding off three edges — see §7.1 |
| Photo | `-67,-325 778×1405` | `object-fit: cover`, bleeds off the left, top and bottom |
| "Hi, I'm Beck." | `800,378 863×129` | Recursive Mono Casual Bold 64/77, `#CED2CD` |
| Body | `867,490 730×229` | Noto Sans 32/44, `#CED2CD` |

The icon field sits **behind** the heading and body but **in front of** the
background; the photo is above the icons. Layer order matters here.

### 6.3 Slide 2 — Logo Drafting · bg `#305789`

| Element | Geometry | Detail |
| --- | --- | --- |
| Sketch pile | `0,0 1264×1065` | **One flattened white-on-transparent asset**, `logo-drafting-scribbles.webp` — all 8 sketches, their rotations, and the deliberate 1px stroke-doubling baked in. See §6.3.1 |
| Scrim | `0,0 1920×979` | **linear gradient**, `#305789` at 75% alpha → 0% alpha; handles `(-0.026, 0.022)` → `(0.051, 0.482)` |
| Title | `1218,82 499×77` | Recursive Mono Casual Bold 64/77, `#FFFFFF` |
| Body | `1264,185 575×530` | Noto Sans 32/44, `#FFFFFF` |
| Rejected logo | `1453,633 200×200` | image |
| Rejected caption | `1284,868 538×114` | Noto Sans 24/33, `#CED2CD`, **centered** |
| Xu Bing caption | `46,736 425×230` | Noto Sans 24/33, `#CED2CD`, **centered**, over the sketches |
| Rule | `0,1017 1920×4` | stroke `#CED2CD`, full bleed |

The scrim is what makes the left-hand caption legible over the sketch pile; it
is not optional decoration.

#### 6.3.1 The sketch pile ships as one flattened white-on-transparent asset

**Decided 2026-09-17 (Beck): the eight sketches are flattened into a single
white graphic on a transparent background.** This is not a compromise — it is
exact, for a reason worth writing down.

**Why it is lossless.** The eight source images are opaque JPEGs with no alpha:
**white ink on a solid black background**, pure greyscale (R=G=B), peaking at
luminance **219**, not 255. Each carries `blendMode: LIGHTEN`, which takes the
per-channel maximum — so on the slide the black paper loses to the denim
backdrop and vanishes, while the strokes win and stay light. `max()` is
associative and commutative, so compositing the eight *first* and the backdrop
*second* gives a pixel-identical result. Flattening is algebra here, not
approximation.

Rendered with ordinary compositing and no other change, the originals would be
**eight opaque black rectangles**. That is what the shipped build would have to
avoid, and what the flatten removes the possibility of.

**The recipe** (reproducible, no hand-compositing):

1. Export the `Scribbles` group — node **`16:21`** — via
   `/v1/images/:key?ids=16:21&format=png&scale=2`. Inside an isolated group the
   `LIGHTEN` layers blend against transparency, so Figma's own renderer emits
   exactly the `max()` composite, **with every rotation, crop, and the 1px
   doubling already baked in**. Output is 2652×2365 (1326×1182.5 at 1x).
2. Map luminance to alpha with a black point: `alpha = clamp((lum − 12) /
   (219 − 12), 0, 1)`, colour set to flat white. **The floor of 12 matters** —
   the JPEGs' "black" is actually `(1,1,1)`, and without a cutoff that noise
   floor shows up as faint rectangular seams where the source images overlap.
3. Crop to the region the 1920×1080 frame actually shows. The group sits at
   frame `-62,-117`, so crop group-space `(62,117)–(1326,1182.5)` → a
   **1264×1065** asset placed at frame `0,0`.
4. Save lossless WebP → `public/brand/deck/logo-drafting-scribbles.webp`.
   Measured at **349 KB** for the 2× asset (lossless beats lossy here: it is
   flat white plus an alpha mask). This replaces ~1.2 MB of JPEGs.

**What this buys.** One `<img>` at `0,0 1264×1065` instead of eight positioned,
rotated, duplicated, blend-moded layers. No `mix-blend-mode`, so no
stacking-context constraint on §3.2 and no way for the knockout to silently
fail. The 1px stroke-thickening survives because it is baked into the pixels.

**One deliberate choice to confirm.** Step 2 normalises the peak to 255, making
the strokes **pure white**; in the deck they render at `#DBDBDB` (luminance
219) because that is where the JPEGs peak. Pure white is brighter and cleaner
and is what "a white set of graphics" asks for. To match the deck exactly
instead, drop the normalisation and let alpha peak at `219/255 ≈ 0.86`. Since
the asset is effectively a white mask, this stays a one-line change either way.

> **If the flatten is ever redone from different sources** and white-on-black
> originals are kept as-is, the fallback is `mix-blend-mode: lighten` per image
> — which works, but blends against the backdrop *within the current stacking
> context*, and the stage's `transform: scale()` creates one. The slide
> background would then have to be painted on the transformed stage element,
> never the outer box, with no `isolation: isolate` in between.

### 6.4 Slide 3 — Logo Design · bg `#CED2CD`

| Element | Geometry | Detail |
| --- | --- | --- |
| Shape field | group `1380,-160 630×1342` | **13 shapes** — see §7.2 |
| Monogram | `146,185 500×500` | `BrandMark` |
| Title | `748,82 423×77` | Recursive Mono Casual Bold 64/77, `#0C3559` |
| Body | `796,185 575×778` | Noto Sans 32/44, `#080B24` |
| "alternate palettes" | `111,769 309×45` | Recursive Mono Casual, `#0C3559` |
| Rule | `111,799 486×4` | stroke `#69635E` |
| Chip — colour fill | `111,814 170×170` | bg `#A79F99`; ink `#0C3559`; crescent `#D9AA52`; wedge `#8C3623` |
| Chip — dark stroke only | `311,814 170×170` | bg `#0C3559`; all strokes `#0C3559` (tone-on-tone) |
| Chip — dark neutral fill | `511,817 170×170` | bg `#080B24`; ink `#080B24`; crescent `#FFFFFF`; wedge `#0C3559` |

**The three chips are the payoff of this slide and the shipped build omits
them entirely** (they were allowlisted as "un-exported"). They are not images:
each is `BrandMark` in a 170×170 square with three colour overrides, which
`BrandMark` can already express — `ink` and `--brand-crescent` are both
parameterised. Add a third override for the wedge. Square corners, no radius.

Note the chips sit at `y=814, 814, 817` — the third is 3px low. That is in the
source; keep it.

### 6.5 Slide 4 — Typography · bg `#0C3559`

Full detail in **§8.2**.

### 6.6 Slide 5 — Palette · bg `#CED2CD`

Full detail in **§8.1**.

### 6.7 Slide 6 — Palette Uses · bg `#080B24`

| Element | Geometry | Detail |
| --- | --- | --- |
| Icon field | group `-34,24 1394×873` | **9 icons**, discipline-coloured and rotated — see §7.1 |
| Title | `125,285 461×77` | Recursive Mono Casual Bold 64/77, `#CED2CD` |
| Body | `183,388 685×397` | Noto Sans 32/44, `#CED2CD` |
| Pill — art | `125,881 340×90`, **radius 45** | fill `#305789`, label 32/38 bold `#FFFFFF`, centered |
| Pill — humanities | `490,881 340×90`, radius 45 | fill `#BF712C` |
| Pill — science | `855,881 340×90`, radius 45 | fill `#4BA661` |
| Artwork | `1320,0 617×1080` | *Sparks and Tendrils*, full-height bleed |
| Glyph | `1342,1009 40×51` | `#CED2CD` |

The pills are genuinely pill-shaped (radius 45 on a 90px-tall box), so the
shipped `rounded-full` is **correct** — but all three are a **fixed 340px
wide** and evenly pitched at 365px, not content-width chips in a `flex-wrap`.

### 6.8 Slide 7 — Profile Pictures · bg `#CED2CD`

A 3×2 grid. Columns `x = 381, 931, 1489`; rows `y = 71, 582`; every cell
**300×300 with square corners**. Captions are 400 wide, centered on their
cell (`x = 331, 881, 1441`), at `y = 395` and `y = 906`, in Recursive Mono
**Linear** Bold 20/24, `#000000`.

| Cell | Content |
| --- | --- |
| 1,1 | The Professional |
| 1,2 | your friendly neighborhood artist |
| 1,3 | your tired internet persona |
| 2,1 | the logo — `BrandMark` in a 300×300 frame, not an image |
| 2,2 | the classic — *Rabbit in the Moon* |
| 2,3 | the abstract |

Plus the slide's signature element: **"profile_picture.jpg_picture.jpg profil "
at 96/115 Recursive Mono Casual SemiBold, `#0C3559`, rotated −90.2°**, bounding
box `-3,-49 261×1129`, running bottom-to-top up the left edge and clipped by
the frame. It is allowlisted out of the fidelity check today as "not authored
content"; it stays allowlisted (it is decoration, and `aria-hidden`), but it
**must be rendered**.

Two corrections to the shipped build: no cell is a circle — the `circle` prop
on "The Professional" is invented — and captions are Recursive Mono *Linear*,
the one place in the deck that casual axis is switched off.

*(A stray 50×40 `ELLIPSE` at `1536,649` has no fill and no stroke. Ignore it.)*

### 6.9 Slide 8 — Conclusion · bg `#0C3559`

| Element | Geometry | Detail |
| --- | --- | --- |
| Card | `610,496 699×434` | fill `#CED2CD` |
| Photo | `760,150 400×400` | **overlaps the card's top edge by 54px** |
| Tagline | `736,550 448×154` | Recursive Mono Casual Bold 40/48, `#080B24`, centered |
| Instagram glyph | `935,731 50×50` | `#080B24` |
| Email | `798,788 344×50` | Noto Sans **500** 32/44, `#305789`, centered |
| Glyphs | `750,796 48×39` and `1125,830 44×44` | `#FFFFFF` |
| Rule | `921,834 211×4` | stroke `#FFFFFF` |

The photo/card overlap is the composition. Order: card, then photo, then text.

---

## 7. The decorative fields

### 7.1 The icon scatters are the site's own icons

The About Me slide carries **exactly 50 icon vectors**. `data/icons-raw.json`
holds **exactly 50 brand icons**, already exposed as `BRAND_ICONS` with an
`IconCategory` of `art | hu | sci` and already rendered by
`components/hero-icon-collage.tsx`. These are the same set.

The Palette Uses slide confirms it: its 9 icons are coloured `#305789`
(denim = art), `#BF712C` (pumpkin = humanities), and `#4BA661` (emerald =
science) — **the site's own discipline hues, in the deck's own palette.**

So neither field is exported as an image. Both render from `BRAND_ICONS`, with
the placement captured as data:

```ts
// lib/deck-scatter.ts — measured positions, one entry per icon
type ScatterIcon = { slug: string; x: number; y: number; w: number; h: number
                     rotate?: number; category?: IconCategory }
```

Matching a Figma `path4891`-style node id to an icon slug requires comparing
path geometry — `pull-brand-deck.mjs --geometry` (§9) returns the vector paths,
and `icons-raw.json` holds the same path strings. **§14 flags this as the one
step that may not resolve cleanly**; if a handful cannot be matched
automatically, match them by eye once and commit the table. Either way the
positions are measured, not invented.

This is the §2.3 principle paying off: the deck's icon field and the
homepage's collage stay the same drawing forever.

### 7.2 The Logo Design shape field

13 vectors in `#A79F99`, `#305789`, and `#69635E` — rotated ellipse outlines
and crescent-like `Subtract` shapes, ranging 174–322px, spanning
`1380,-160 630×1342` and bleeding off the top, right, and bottom. These are
the "geometric shapes used as decoration" from Beck's brief, and they are
arbitrary art rather than reusable assets.

**Export this group once as a single SVG** to `public/brand/deck/
logo-design-shapes.svg` and place it absolutely. One asset, one node, exact.
Do not attempt to re-derive the shapes as CSS.

### 7.3 Rules and scrims

Six slides carry 4px hairlines (§6). Reproduce as absolutely-positioned
`<div>`s with a background colour — not `<hr>`, not borders — since several
bleed past the frame edge and are clipped. The one gradient scrim (§6.3) is a
`linear-gradient` with the measured stops and angle.

---

## 8. The two hand-formatted slides

These are the ones Beck named. Both are currently rendered as generic
responsive grids and both must instead be reproduced as drawn.

### 8.1 The palette slide

**What it actually is:** an **800×800 mosaic of unequal rectangles** at
`160,140`, in three columns of different widths, with **every label set inside
its own swatch, right-aligned, in italic mono**.

Columns: `A` at `x=160 w=290` (3 tall blocks), `B` at `x=450 w=292` (3 tall
blocks), `C` at `x=742 w=218` (5 shorter blocks).

| Swatch | Geometry | Label colour |
| --- | --- | --- |
| summer storm `#69635E` | `160,140 290×266` | `#FFFFFF` |
| satin nickel `#A79F99` | `160,406 290×268` | `#FFFFFF` |
| pale slate `#CED2CD` | `160,674 290×266` | **`#69635E`** |
| midnight `#080B24` | `450,140 292×266` | `#FFFFFF` |
| indigo `#0C3559` | `450,406 292×268` | `#FFFFFF` |
| denim `#305789` | `450,674 292×266` | `#FFFFFF` |
| white `#FFFFFF` | `742,140 218×161` | **`#69635E`** |
| terra cotta `#8C3623` | `742,301 218×160` | `#FFFFFF` |
| pumpkin pie `#BF712C` | `742,461 218×160` | `#FFFFFF` |
| goldenrod `#D9AA52` | `742,621 218×159` | **`#8C3623`** |
| emerald `#4BA661` | `742,780 218×160` | `#FFFFFF` |

Every label is a two-line block — name, then hex — 185px wide, Recursive Mono
Casual **Italic** 24/29, **right-aligned**, inset to the swatch's bottom-right.
The three deviating label colours are hand-tuned per swatch and are exactly
the kind of hand formatting Beck is asking to preserve; they are not derivable
from a contrast function and must be table-driven.

**Swatches have square corners.** No radius, no border, no gap — the blocks
abut to form one mosaic.

**The colour-blind simulation block** (right column, below the body copy) is
currently dropped and allowlisted. Restore it: four bars, each a pill-ended
row of segments, stacked top to bottom.

| Row | Geometry | Segments (x, w, fill) |
| --- | --- | --- |
| true | `1225,665 532×22` | `1225,211 #305789` · `1327,109 #4BA661` · `1436,110 #D9AA52` · `1546,211 #8C3623` · `1546,109 #BF712C` |
| deuteranopia | `1218,722 546×46` | `1218,273 #355288` · `1327,109 #9B9165` · `1436,110 #C9B655` · `1491,273 #635920` · `1546,109 #9B8B2C` |
| tritanopia | `1218,788 546×45` | `1218,273 #415A8B` · `1327,109 #A7995C` · `1436,110 #BDAA49` · `1491,273 #4E4621` · `1546,109 #887923` |
| protanopia | `1218,853 546×46` | `1218,273 #006269` · `1327,109 #37A395` · `1436,110 #EA9C96` · `1491,273 #9A2232` · `1546,109 #D16063` |

The first and fourth segment of each row have `border-radius: 40px` and the
wide segments underlap the narrow ones — **z-order is significant**: paint the
two wide segments first, then the three narrow ones. Caption
"color blind simulation from Adobe Color" at `1225,914`, Noto Sans 24/33,
`#69635E` — currently allowlisted out; restore it to the transcript.

Title `palette` at `1218,82 269×77`, `#0C3559`. Body at `1264,185 575×525`,
Noto Sans 32/44, `#080B24`.

### 8.2 The typography slide

**What it actually is:** a **three-row specimen table** on the left, ruled by
three 339px hairlines, with the prose in a right-hand column. Each row is
label → hairline → caption on the left, and typeface name → alphabet on the
right of the table.

| | Row 1 | Row 2 | Row 3 |
| --- | --- | --- | --- |
| Label | `headings` `111,403` | `body` `111,571` | `mono` `111,747` |
| Hairline | `111,443 339×4` | `111,612 339×4` | `111,787 339×4` |
| Caption | `109,441 292×80` | `110,611 257×90` | `110,787 291×146` |
| Name | `478,395` | `478,558` | `478,739` |
| Alphabet | `519,443 480×76` | `519,612 520×88` | `519,787 480×114` |

- **Labels:** Recursive **Sans** Casual **BoldItalic** 32/38, `#A79F99` — the
  one place the deck drops the mono axis for a label. Not uppercase, not
  letterspaced.
- **Hairlines:** 4px, `#305789`.
- **Captions:** Noto Sans 24/33, `#CED2CD`.
- **Names:** 40px — row 1 Recursive Mono Casual Bold, row 2 **Noto Sans 400**,
  row 3 Recursive Mono Casual Italic — each set in the face it names.
  All `#FFFFFF`.
- **Alphabets:** Recursive Mono Casual Bold 32/38. Rows 1 and 2 `#CED2CD`;
  **row 3 is `#305789` denim**, and row 3 alone carries a third line,
  `1234567890`.

Title `typography` at `1218,82 384×77` in **`#A79F99`** (not white — the only
slide whose title is satin nickel). Body at `1264,185 575×731`, Noto Sans
32/44, `#FFFFFF`. A decorative `Subtract` vector at `978,90 162×190` in
`#CED2CD` sits between the body column and the title — export with §7.2's
group or as its own small SVG.

The alphabet strings stay allowlisted in the fidelity check (the component
renders them; they are specimen, not copy), as today.

---

## 9. Extending the pull

`scripts/pull-brand-deck.mjs` gains a mode. The existing default behaviour and
output file are **unchanged**, so `check-deck-fidelity.mjs` keeps working
throughout.

```
node scripts/pull-brand-deck.mjs --geometry
```

Writes `docs/brand/deck-geometry.json`, committed beside `deck-source.json`:

```jsonc
{
  "pulledAt": "2026-09-17",
  "fileKey": "cZbOK8t70Q8328FzE5xtgH",
  "frameSize": { "w": 1920, "h": 1080 },
  "slides": [{
    "index": 0, "name": "0 Title: personal branding", "id": "1:2",
    "background": "#0C3559",
    "nodes": [{
      "name": "Rectangle 2", "type": "VECTOR",
      "x": 1020, "y": 198, "w": 732, "h": 714,   // frame-relative
      "rotate": 0.3,
      "fill": "#080B24", "opacity": 1, "radius": 0,
      "stroke": null, "strokeWeight": null,
      "text": null, "font": null
    }]
  }]
}
```

Requirements:

1. **Frame-relative coordinates.** Subtract the frame's `absoluteBoundingBox`
   origin at capture time, so the JSON is directly usable as stage
   coordinates.
2. **Preserve document order within each frame** — it is the paint order, and
   §8.1's bars and §6.2's layering depend on it. (The existing text pull sorts
   by `(y, x)`; this one must not.)
3. **Capture:** type, name, x/y/w/h, rotation in degrees, solid fills as hex,
   gradient fills as stops + handles, strokes + weight, `cornerRadius`,
   `opacity`, **`blendMode`**, `visible`, and for `TEXT` nodes the full `style`
   (`fontPostScriptName`, `fontSize`, `lineHeightPx`, `fontWeight`,
   `letterSpacing`, `textAlignHorizontal`) plus `characters`.

   > `blendMode` is called out because it is easy to treat as noise and it is
   > not: it is what tells you slide 2's sketches are a knockout rather than
   > eight black rectangles, and therefore what justifies §6.3.1's flatten. A
   > sweep of the file confirms those eight are the **only** non-default blend
   > modes, and that no node anywhere uses a non-`1` opacity or any effect.
4. **`--geometry --paths`** additionally requests `geometry=paths` and records
   vector path data, needed once for §7.1's slug matching and §7.2's export.
5. Same token handling as today: `.env.local` only, never logged, never
   written to the output.

The hidden `Frame 1` scratch node stays excluded, as today.

---

## 10. Checking it

`check-deck-fidelity.mjs` stays exactly as it is — copy fidelity is a real and
separately valuable property, and this rebuild must not regress it. Its
allowlists change only as §8 notes (the colour-blind caption moves out of
`DECK_ONLY_TEXT`; the rotated filename label stays in).

Add a **second, independent** checker rather than extending the first:

```
node scripts/check-deck-geometry.mjs
```

It parses the `stage` panels' measured constants out of the deck's components
and diffs them against `docs/brand/deck-geometry.json`, reporting any element
whose position, size, or fill has drifted, plus any node in the pull with no
counterpart in the build. Two checkers, two properties, two clear failure
messages — matching the repo's existing one-script-one-property convention.

**This is the check that was missing**, and its absence is the whole of §1.

> **Not in scope:** pixel screenshot diffing. It needs a browser harness the
> repo does not have, and TODO §25 already records that a browser tool was
> unavailable. A numeric diff against the pull catches the failure mode that
> actually occurred.

---

## 11. Below 640px

At the `sm` breakpoint and down, a stage's scale factor makes 32px body copy
render below ~11px. Each panel therefore ships a **hand-authored reflowed
variant**, rendered instead of the stage — not a CSS reshuffle of the same
DOM, since absolutely-positioned deck coordinates cannot reflow.

Rules for the reflow:

- **Same content, same order, same copy.** The word-diff (§10) runs against
  the rendered output, so both variants carry the same strings — render one
  and mark the other `hidden` via a CSS media query at the container level,
  with only one present in the accessibility tree.
- **Keep the slide's background colour and its type palette.** The reflow
  should read as the same slide, narrower — not as the old generic build.
- **Decorative fields degrade:** shape fields and icon scatters become a
  reduced set or drop entirely; scrims and rules drop. Backgrounds stay.
- **The two hand-formatted slides keep their structure:** the palette mosaic
  becomes a 2-column mosaic with labels still inside the swatches; the
  typography table becomes three stacked rows, still ruled, still in the
  correct faces.

This is real duplicated authoring for nine panels, and it is the cost of the
§0 decision. It is bounded — the reflow is simple flow layout with no
measurement — and it is the only part of this spec that is judgment rather
than transcription.

---

## 12. What this deletes

Invented elements with no counterpart in the Figma file. Removing them is part
of the work, not a follow-up:

| Where | Remove | Why |
| --- | --- | --- |
| `brand-palette.tsx` | The `token` column (`--muted-foreground (light)` etc.) | No such text exists in the deck. It annotates the deck with site internals |
| `brand-palette.tsx` | The uniform `aspect-square` / `grid-cols-2/3/4` grid and `rounded-xl` | The deck is an unequal mosaic with square corners (§8.1) |
| `brand-palette.tsx` | Labels below swatches, left-aligned, in `.font-brand` | Labels are inside, right-aligned, italic (§8.1) |
| `type-specimen.tsx` | **The entire "the heading ladder" h1–h5 block** | Not in the deck at all |
| `type-specimen.tsx` | `uppercase tracking-[0.3em]` label styling | Deck labels are Recursive Sans Casual BoldItalic 32px, mixed case (§8.2) |
| `profile-picture-grid.tsx` | The `circle` prop | All six cells are square 300×300 (§6.8) |
| `mark-construction.tsx` | **The whole file**, plus its import and `<MarkConstruction />` in the deck MDX | Not on the Logo Design slide, which carries the three chips instead (§6.4). Beck's call, 2026-09-17 |
| `brand-mark.tsx` | The `BOWL` / `WEDGE` exports and the comment explaining them | They exist only for `MarkConstruction`. `B_ASCENDER` and `Q_STEM` stay — `BrandMark` uses them itself — but all four become internal |
| `panels.tsx` | Nothing | `Panels`/`PanelContents`/`PanelRail` are untouched |

Copy is **not** touched by any of these — the word-diff must still pass.

---

## 13. Build order

1. **§9** — extend the pull; commit `deck-geometry.json`. *Nothing visual
   changes yet, and nothing after this point is a guess.*
2. **§4, §5** — the two font classes; promote the palette constant.
3. **§3** — `layout="stage"`, the scaling container, the positioning
   primitive. Prove it on slide 0, the simplest composition.
4. **§8.1, §8.2** — palette and typography. **Do these next, not last:** they
   are what Beck named, they are the highest-risk reproductions, and they
   exercise the stage hardest.
5. **§6** — the remaining six slides. Slide 2 needs §6.3.1's flatten run first;
   it is a one-off export, not build-time tooling.
6. **§7.1** — the icon-slug matching; **§7.2** — export the shape field.
7. **§12** — delete the invented elements, `mark-construction.tsx` included.
8. **§10** — the geometry checker.
9. **§11** — the nine reflowed variants.

Steps 1–5 are independently landable and visibly move toward the brief. If
this stalls anywhere, it should stall after step 5 with six slides exact and
three pending, not with nine slides half-done.

---

## 14. Open questions and risks

- [ ] **Icon slug matching (§7.1) may not fully automate.** Figma node ids are
      `path4891`-style and carry no slug. If path-geometry comparison against
      `icons-raw.json` leaves stragglers, match those by eye once and commit
      the table — it is 50 icons, not an open-ended set.
- [ ] **Two fonts are assumed reachable, not verified rendering.** Recursive's
      `MONO 0` (sans) and `CASL 0` (linear) instances should both come from
      the loaded variable axes, but neither is used on the site today. Confirm
      visually before §8.2 depends on it; if an axis is missing from
      `app/layout.tsx`'s `axes` list it must be added there.
- [ ] **Slide 7's rotated label overflows the frame** (`y` from −49 to 1080).
      Its clipping is the effect. Confirm `overflow: hidden` on the stage
      reproduces it rather than truncating early.
- [ ] **Not re-litigated here:** TODO §25's three existing loose ends (the
      filter panel's resting height, the two unregistered artworks, the
      unverified `year`). None are affected by this spec.
