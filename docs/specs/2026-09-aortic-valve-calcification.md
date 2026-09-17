# Spec — the aortic valve MQP as a work piece

Beck's 2021 undergraduate Major Qualifying Project (WPI, biomedical
engineering) — a 3D in-vitro model for studying **dystrophic** calcification of
the aortic valve — becomes a piece at `/work/aortic-valve-calcification`.

The input is a **prototype HTML page** (`~/Downloads/bme_mqp.html`, a single
self-contained file) and the **original report** (`~/Downloads/Final MQP
Paper.pdf`, 80 pages, 88 embedded images). The prototype is a starting point
for structure and sequence only. It is **not** the source of truth for copy,
colour, layout, or interaction — the report is the source for copy and
figures, and this site's own conventions are the source for everything else.

This is the site's first **case study**: a long technical document about a
project, as distinct from an essay (`content/essays/`), a code demo
(`content/code-demos/`), or a deck (`content/decks/`, specced in
[2026-09-branding-deck.md](2026-09-branding-deck.md)). It is also the site's
first collaborative work and its first genuinely science-led piece — nothing
else in `WORK` carries `science` without `art` outranking it in
`DISCIPLINE_PRECEDENCE`.

Nothing here changes the gallery, the lightbox, the collection machinery, the
filter vocabulary, or any existing piece.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| Where it lives | **A piece at `/work/aortic-valve-calcification`** | Beck, 2026-09-15 |
| How it renders | **Rebuilt as real HTML/MDX** — not an iframe, not exported images | Beck, 2026-09-15 |
| Byline | **No byline.** The write-up says it was a four-person team project; no names, including Beck's | Beck, 2026-09-15 |
| Prose provenance | **Mixed** — the prototype interleaves report text with connective filler. Every block must be sourced or replaced before ship | Beck, 2026-09-15 |
| Figures | **Extracted from the report** where they exist; rebuilt as SVG only where the figure is a diagram | Beck, 2026-09-15 |
| Length | **All fifteen sections, no folding.** Straight scroll | Beck, 2026-09-15 |
| Navigation | **Both** — a contents list under the header *and* a fixed progress rail | Beck, 2026-09-15 |
| Taxonomy | **`science` + `biology`.** No new tag, no vocabulary change | Beck, 2026-09-15 |
| Prototype's interactions | **Redesigned away.** The MQP was a report, not an interactive artifact; the prototype's tabs, tooltips, expanding cards and click-to-reveal diagram are its own invention and all hide content | Beck ("redesign welcome"), 2026-09-15 |

---

## 1. The interaction redesign, and why it is a deletion

The prototype has five interactive mechanisms. Every one of them **hides
content behind a gesture**, and Beck chose "full length, no folding" — a
decision to show the content. They are inconsistent with each other, so the
resolution is to drop them:

| Prototype mechanism | Verdict | Becomes |
| --- | --- | --- |
| Click-to-reveal pathway diagram (6 nodes, 6 hidden paragraphs) | **Cut.** This is the piece's central mechanism and it is behind six clicks | A static two-lane diagram with every step's explanation visible beside it (§6.3) |
| Design-concept tabs (A/B/C) | **Cut.** Hides two-thirds of a comparison whose whole point is comparison | Three stacked `<Panel>`s (§6.4) |
| Expanding constraint cards (8 × "why this matters") | **Cut.** The rationale *is* the content | An eight-item `<PanelGrid>`, all rationale visible |
| Glossary tooltips | **Cut.** Exactly one term uses it; hover-only, no touch path | `<Term>` renders a semantic `<dfn>`; the gloss is written into the prose |
| Strain chart hover dots | **Cut**, along with the chart — see §2.2 | A `<DataNote>` stating the two measured numbers against the target |

What survives as interaction: the **contents list** and the **progress rail**
(§5, Beck's explicit choice), and a native `<details>` for the reference list.
Nothing else on the page responds to a click.

**Do not reintroduce any of these as an enhancement.** If a future reader
finds the page long, the answer is `<Section fold>` from
[2026-09-sections-folding-logs.md](2026-09-sections-folding-logs.md) applied
deliberately — not a revival of the prototype's chrome.

---

## 2. Findings in the prototype that must not be carried forward

These are defects, not style differences. Each one ships wrong if copied.

### 2.1 `--red` and `--gold` are the same colour

```css
--red:#EB5600;   --red-soft:#f5b98c;
--gold:#EB5600;  --gold-soft:#f5b98c;
```

Identical. The prototype's entire two-pathway colour coding — dystrophic vs.
osteogenic in the branch diagram, the sclerosis→severe ramp in the progression
strip, `83%` vs `13%` — renders in one colour and communicates nothing. §7
defines the replacement.

### 2.2 The strain chart is wrong in kind — **resolved 2026-09-16**

`#strainSvg`'s polyline is fifteen hand-placed coordinates, and the per-dot
tooltip computes each frame's value as `7.47 * (i + 1) / 15` — a straight line
back-filled from one summary number, presented as a frame-by-frame PIVlab
measurement.

**The report's real figures were located and read (p.51, Figures 41 and 42).
They are not time series at all.** They are 8x8 **spatial heatmaps** of strain
across the well plate — the axes are vector positions 1-8 of the "8 vector by
8 vector system", and colour is strain percentage. There is no per-frame curve
in the report to plot, and the prototype's chart does not correspond to any
measurement that was taken.

What the real figures actually show, and what the section should say:

| | Value |
| --- | --- |
| Y direction (the stretch axis) | ranges roughly **2% to 12%** across the plate; average ~**7%**; hot spot near vector (4, 6) |
| X direction (no stretch expected) | **0.004-0.022%** — effectively zero, confirming the biaxial system was not stretching sideways |
| Summed over frames 1-15 | ~**7.47%** |
| ImageJ graphite-tracking measurement | ~**9.6%** |
| Report's own caveat | "The bottom data may be skewed due to video quality or the angle the CellScale was filmed at" |

**The finding is spatial non-uniformity, not a rising line.** The system hit
roughly the right magnitude on average while straining unevenly across the
well — which matters directly for a model where different spheroids sit in
different parts of that well. That is a more interesting and more honest
result than the prototype's smooth ramp, and it is the one the section must
carry.

Ship **Figures 41 and 42 as extracted images** (§10), with the numbers above
in a `<DataNote>`. Do not redraw them as SVG and do not synthesise a curve.

### 2.3 The "stain photograph" panels are fabricated micrographs

The calcification section draws two dark rounded rectangles with blurry
circles and labels them `collagen, overstained` / `fibrin, ambiguous
background`. A drawn approximation of a micrograph, captioned as one, is a
fabricated result. Use the report's real plates, or show nothing and let the
prose carry it. Never a drawn stand-in.

### 2.4 The reference list count is wrong — **resolved 2026-09-16**

`Show full references (38)` opens a partial list of ~13 entries ending "Full
reference list (38 sources) available in the original MQP report."

**The report's bibliography was counted: ~66-69 entries** (69 lines matching a
first-author pattern, 66 parenthesised years; the spread is entry wrapping, not
ambiguity). The prototype's "38" undercounts by roughly half and is not a
figure taken from the report.

Transcribe the full bibliography from the report (pp.57-62 of the PDF, which
`report.txt` carries as plain text) and state the real count, or drop the count
from the label entirely. Do not ship "38".

### 2.5 Mojibake throughout

A UTF-8 round-trip failed. Every instance must be repaired on transcription:

| In the prototype | Should be |
| --- | --- |
| `Major Qualifying Project Â· Worcester` | `·` |
| `Mildâmoderate stenosis` | `–` (en dash) |
| `.flow-step::after { content:"â" }` | `→` |
| `why this matters â` / `hide â` | `↓` / `↑` |
| `â this project's focus` | `←` |
| `<span class="mark">â</span>` (scorecard) | `✓` |
| `<span class="tag minus">â</span>` | `−` (minus sign) |

### 2.6 Numeric claims — **all verified 2026-09-16**

Checked against the report's extracted text (§10). Page numbers are PDF pages.

| Claim in the prototype | Verdict | What the report says |
| --- | --- | --- |
| "2-4% of individuals over 65 are affected by CAVD" | **FABRICATED** | The string "2-4" does not appear anywhere in the report. Nothing supports it |
| "…and 25% show symptoms" | **Garbled** | p.9: "Over **25% of people over the age of 65 show signs of the disease**." The prototype turns one statistic into two and inverts which is which |
| "80% chance of heart failure, valve replacement, or death within 5 years" | **Verified** | p.9, Yutzey et al. 2014 |
| "83% … dystrophic" / "13% … genetic factors" | **Numbers verified, label wrong** | p.13, Mohler 2001, human valve explants: osteogenic 13%, dystrophic 83%. But osteogenic is defined as VICs adopting an **osteoblast-like phenotype** — *not* "genetic factors". The prototype invented that gloss |
| "driven by mechanical stress, not genetics" (hero) | **Editorialising** | The report calls the mechanical pathway "believed" and cites bicuspid-valve prevalence as "further evidence". It never opposes it to genetics |
| "one of the most common valvular heart diseases" | **Hedged down** | Report says CAVD **is the most common** valvular heart disease in the world (abstract, p.8; repeated p.9) |
| "around 7 kPa … closer to 32 kPa" | **Verified** | p.13, Wang et al. 2012 |
| "up to about 950 kPa in some reported ranges" | **Verified but conflated** | p.35 gives 7 kPa -> 950 kPa as the **hydrogel target range**, a different sentence from the 7/32 kPa tissue figures. Keep them separate |
| "$964 spent of a $1,000 materials budget" | **Verified, context omitted** | p.54 and Appendix A. The report immediately adds that replication needs a CellScale MCFX + plates (~$7,000), gel (~$200) and microwells (~$500). The prototype's parenthetical understates this |
| "0.96 second video … 30.3 frames per second" | **Verified** | p.50. 29 frames total; frames 1-15 are the stretch, 16-29 the return |
| "7.47%" and "9.6%" strain | **Verified** | p.51 and p.53 |
| "About a million cells" | **Unverified** | Not located in the extracted text. Check the aggregate-creation protocol (Appendix D, p.64) before shipping |

Every corrected value above must land in the MDX. **The fabricated 2-4% figure
is deleted outright**, and the hero's first statistic is rebuilt from the real
claim: over 25% of people over 65 show signs of the disease.

### 2.7 The report contradicts itself, and the prototype silently picked a side

This is the largest editorial finding and it is **Beck's call, not the
implementer's**.

| Source | On whether calcification occurred |
| --- | --- |
| **§6.2, the results section** (p.49) | "the Von Kossa calcification stain had little success. The spheroids in fibrin were able to be imaged, but **no calcium deposits were detected with any certainty**." |
| **§9.1, the conclusion** (p.55) | "On day 5 after embedding, **the fibrin aggregates showed signs of calcification**, however the other gels did not. Based on earlier research conducted in the Billiar lab on aggregates that are not embedded, **the team is confident that there was calcification and the stain did not work properly**." Also: "The final design verification has shown this goal was accomplished." |

The report's own conclusion overclaims relative to its own results section. The
prototype followed §6.2 and presents the project as a null result, dropping
§9.1's confidence entirely.

That may well be the better reading — but it is a choice, and shipping it
unremarked means the page quietly disagrees with the document it cites. Three
options, for Beck:

1. **Follow §6.2** (the prototype's current position) and say plainly that the
   report's conclusion claimed more than its results section supported.
2. **Present both**, as the piece's most interesting moment: a 2021 team
   wanting a result, and what the data actually licensed.
3. **Follow §9.1** and report the project as having met its goal.

Option 2 is the recommendation. It costs one paragraph and it is the only one
of the three that neither overclaims nor quietly edits the source.

### 2.8 One future-work item is already refuted by the report

The prototype's next-step #4 proposes "Adjusting UV exposure time … might
resolve" GelMA+HAMA's weak live/dead signal.

**The team already did this.** p.48: "Originally, the team believed the 90
second UV exposure was too much and killed the cells. **A second trial was
conducted with 30 second UV exposure and the results were the same.**"

Drop or rewrite the item. The report's own recommendation is different — refine
the *staining protocol* and try alternate stains, not the UV exposure.

Relatedly, the prototype's live/dead summary says GelMA+HAMA's weak result
"suggests the material properties of the gel may have prevented the stain from
working properly, rather than the cells actually being dead." The report offers
**both** possibilities and only rules out UV by experiment; the prototype keeps
the flattering half. Restore the report's framing.

## 3. Taxonomy

```ts
tags: ['science', 'biology']
```

**No vocabulary change.** `biology` already exists in the `science` facet and
already carries `transformation`; the site's rule is that vocabulary follows
the data and nothing here needs a word that does not exist.

What follows for free:

- `primaryDiscipline()` → `science` (nothing outranks it — `art` is absent).
  `toneFor()` → `var(--science)`, emerald. **This is the first piece on the
  site whose tone is emerald because science won on its own**, rather than
  because an essay was tagged `science` + `writing`.
- `categoryLabel()` scans `DISCIPLINES` in order (`art`, `writing`, `science`)
  and returns the first facet tag present → **`biology`**. The meta line reads
  `biology · science · 2021`, and `WorkPlaceholder`'s watermark reads
  `biology`.
- `ALL_TAGS` is unchanged, so `MAX_DISCIPLINE_CHIPS` is unchanged and the
  filter panel's height reservation does not move. **No panel re-check needed**
  — unlike the branding-deck spec's §3, which does add a chip.
- `?tags=biology` and `?tags=science` both surface it with no wiring.

Explicitly **not** tagged: `writing`/`essay` (it is a project, not an essay),
`animals` (porcine valves are a material, not a subject), and no new
`research`/`engineering` tag.

---

## 4. File-by-file

| File | Change |
| --- | --- |
| `lib/work.ts` | `caseStudy?: true` added to `WorkPiece`; `isCaseStudy()` predicate; the `aortic-valve-calcification` entry appended to `REAL_WORK`; `'aortic-valve-calcification'` added to `MDX_BODY_SLUGS` |
| `lib/mdx-bodies.ts` | Imports the new body; `BODIES` gains one key; header comment gains `content/case-studies/` as the third content directory |
| `content/case-studies/aortic-valve-calcification.mdx` | **New.** The document body — §6, §8, §9 |
| `components/case-study.tsx` | **New.** The generic document primitives — §8.1 |
| `components/figures/valve-figures.tsx` | **New.** The four bespoke SVG diagrams — §8.2 |
| `components/essay.tsx` | `essayComponents` gains `table`/`thead`/`tbody`/`tr`/`th`/`td` — §8.3 |
| `app/work/[slug]/page.tsx` | One new branch in `PieceView`, after the code-demo branch and before text-forward — §6.1 |
| `app/globals.css` | `--terracotta-alt` and `--on-accent` — §7.3. Plus `@theme inline` entries for both |
| `public/work/aortic-valve-calcification/` | **New.** Figures extracted from the report — §10 |
| `scripts/check-case-study-provenance.mjs` | **New.** Asserts every prose block carries a source annotation — §9.2 |
| `docs/ARCHITECTURE.md` | A "Case studies" section; the content-model table gains `isCaseStudy` — §13 |
| `docs/TODO.md` | §2's "science is a discipline with zero work in it" gains a closing note | 
| `components/work-gallery.tsx` | **Unchanged.** No new tag, no new card kind |
| `components/image-lightbox.tsx` | **Unchanged.** See §11.4 |

No new dependencies.

---

## 5. Navigation

> **Amended by [2026-09-panels-and-rail.md](2026-09-panels-and-rail.md).**
> That spec found the shipped `Deck` (§5.1's reference point below) never
> actually worked — a client/server identity bug across the RSC boundary —
> and the fix was to move slide-list derivation to the server side of that
> boundary, as the shared `Panels`/`Panel`/`PanelFigure` primitive
> (`components/panels.tsx`). This case study's own `CaseStudy`/`Section` were
> proposed for the same reason `Deck`/`Slide` existed; now that the
> primitive is shared, §5.1's derivation, §5.2's contents list, and §5.3's
> rail below are **`Panels`' `PanelContents` and `PanelRail`**, not a
> bespoke pair built for this piece. Read this section as describing that
> shared mechanism under this document's own names, not as a second
> implementation to build.

Beck chose both a contents list and a rail. They render from **one derived
list**, so they cannot disagree.

### 5.1 Deriving the section list

`Panels` is a Server Component (no `'use client'`) receiving server-rendered
MDX as `children`. It reads the list with `React.Children.toArray(children)`,
keeping elements whose `type` is `Panel`:

```ts
type PanelRef = { id: string; title: string }
```

This is the mechanism `docs/specs/2026-09-panels-and-rail.md` §3.3 fixed —
not the one the branding-deck spec originally shipped. That version compared
`c.type === Slide` from inside a **client** `Deck`, which is always false for
an element built by a server MDX module: Flight serializes it as a
client-reference, never as the function `Deck` held in its own scope, so the
old deck rendered no slides at all. Moving the comparison to the server side
of that boundary — `Panels` carries no `'use client'` — is what makes
`c.type === Panel` trivially true. It is safe to derive from raw JSX because
top-level blocks separated by blank lines are **not** wrapped in `<p>` by
MDX 3; see §6.2's authoring rule (superseded in favour of
panels-and-rail's §5.2, same rule), which is what keeps that true.

In development, `Panels` warns (`console.warn`, once) for any direct child
that is an element and is not a `Panel`, so a malformed body is visible while
authoring rather than silently missing from both navs.

### 5.2 The contents list

`PanelContents`, rendered by `Panels` under the page header, above the first
section: a plain `<nav>` with an `aria-label` of `"Contents"` and an `<ol>`
of same-page `<a href="#id">` links. Styled as the site's existing contents
idiom (`ChapbookContents` in `work-visuals.tsx`) — lowercase `font-brand`,
muted, one per line.

Always rendered, at every breakpoint. It is the **only** navigation below
`xl` (1280px — see §5.3's correction), where the rail is hidden.

### 5.3 The rail

`PanelRail`, fixed to the right edge, one dot per section.

- `position: fixed; right: 1.75rem; top: 50%; transform: translateY(-50%)`,
  `z-40` — **below** the nav's `z-50` (`site-nav.tsx:39`).
- **Corrected by panels-and-rail §7.1: hidden below `xl` (1280px), not
  `lg` (1024px).** `<main>` is exactly `max-w-5xl` (1024px), so at a 1024px
  viewport the content fills the width with zero gutter and a rail at
  `right: 1.75rem` lands on top of the text. `xl` is the first breakpoint
  with a real gutter (128px each side) to put the rail in.
- Each dot is a real `<button>` with an `aria-label` of the section title,
  scrolling its target into view. Not an `<a>` — it must not write history;
  fifteen dots would otherwise mean fifteen back-presses.
- Active state via `IntersectionObserver` with
  `rootMargin: '-45% 0px -45% 0px'`, matching the prototype's working
  scrollspy. The active dot takes `var(--essay-accent)` (this piece's
  `--science`, inherited from `toneFor()` — panels-and-rail §7.2 generalised
  the accent from a hardcoded `--science` to the piece's own tone); inactive
  take `var(--border)`.
- `aria-current="true"` on the active dot; the `<nav>` carries
  `aria-label="Panel progress"` (panels-and-rail §7.1's landmark label,
  shared with the deck).

### 5.4 Scroll offset — required, and easy to miss

The site nav is `sticky top-0`, so an un-offset anchor jump lands the section
heading *underneath* it. Every `<Panel>` carries the shared `.panel` class
(`app/globals.css`), which sets:

```css
scroll-margin-top: calc(var(--nav-h, 4rem) + 1rem);
```

`--nav-h` is published on `document.documentElement` by `site-nav.tsx` and is
**not a constant** — the nav wraps to two lines below ~363px. This is the
cross-component contract recorded in ARCHITECTURE.md's "Component layers"; the
`4rem` fallback covers the first paint before the nav has measured itself.

### 5.5 Reduced motion

Both navs scroll with `behavior: 'smooth'`. Under
`prefers-reduced-motion: reduce` they pass `behavior: 'auto'`. `globals.css`'s
existing reduced-motion block does not cover programmatic `scrollIntoView`
options, so this must be read in JS via `matchMedia` — see
panels-and-rail §7.4 for where that CSS-vs-JS split actually lands (a global
`scroll-behavior: smooth` covers the contents list's native anchor jump;
`PanelRail`'s own `scrollIntoView` call reads `matchMedia` directly, since
its explicit `behavior` argument overrides the CSS property regardless).

---

## 6. The page

### 6.1 The `PieceView` branch

> **Amended by [2026-09-panels-and-rail.md](2026-09-panels-and-rail.md) §3.1:
> this is not a second branch.** That spec collapsed the branding-deck
> spec's proposed `deck?: true` and this section's `caseStudy?: true` into
> one field (`bodyLayout?: 'wide'`) and one `PieceView` branch
> (`isWideBody(piece) && Body`), since both existed for the identical
> reason — *this MDX body owns its own width*. §6.2's "collision to
> resolve if both ship" is resolved: this spec shipped second, uses
> `bodyLayout: 'wide'`, and needs no branch of its own.

`PieceView` (`app/work/[slug]/page.tsx`) branches code-demo → wide-body →
text-forward → default. The wide-body branch sits **between the first and
second**.

Without it the piece falls through to the default image branch and renders as
a poster image followed by `<EssayBody>` at `max-w-2xl` — the figures, the
gel table, and the pathway diagram would all be crushed into a prose column.
The failure would be silent, which is the same trap the code-demo branch was
placed first to avoid.

```
isWideBody(piece) → header (h1, meta, description, status flags)
                     then <Body /> at full width
                     then <TagLinks />
```

The branch wraps the body to publish the accent and lets the body own its
width — identical in shape to the panels-and-rail spec's §3.1:

```tsx
<div style={{ '--essay-accent': tone } as CSSProperties}>
  <Body />
</div>
```

**Not inside `EssayBody`.** `EssayBody` is `max-w-2xl`
(`components/essay.tsx:31`); the measure belongs *inside* each section (§8.1's
`Prose`), not around the whole document. CSS variables inherit, so every
descendant still reads the piece's emerald off the cascade — including
`essayComponents`' blockquote rule, which falls back to `--writing` when
unset.

The page's `<main>` is `max-w-5xl` for non-chapbooks
(`app/work/[slug]/page.tsx:71`). That is the case study's outer bound; it is
not widened.

### 6.2 `isWideBody` and the field — **superseded, see §6.1's note**

This section originally proposed an authored `caseStudy?: true` boolean and
`isCaseStudy()`, matching the `isCodeDemo` idiom. Per §6.1's amendment, this
piece instead sets:

```ts
bodyLayout: 'wide'
```

and is checked with `isWideBody()` — both defined once in `lib/work.ts` by
[2026-09-panels-and-rail.md](2026-09-panels-and-rail.md) §3.1, not redefined
here. **Still do not infer it from the slug**, and do not infer it from "has
an MDX body and no `text`" — three of the four essays match that
description.

### 6.3 The fifteen sections

> **Amended by [2026-09-panels-and-rail.md](2026-09-panels-and-rail.md)
> §3.2: the top-level division below is `<Panel>`, not `<Section>`.** That
> spec merged the branding-deck's `<Slide>` and this document's top-level
> `<Section>` into one shared primitive, on the grounds that both were "a
> panel: one composition, one screen's worth, one entry in the rail."
> **This collides with §8.1's `<Panel verdict>`**, a different,
> already-specced component here (a titled sub-block with a verdict pill,
> used inside a top-level division, e.g. row 7's three design concepts) —
> panels-and-rail's amendment did not anticipate that name being taken. Rows
> 6, 7, and 11 below still mean §8.1's `<Panel verdict>`; every other
> `<Panel>` reference in this table means the shared top-level primitive.
> Resolve the collision (rename §8.1's `<Panel>` before this document is
> built) rather than shipping both under one name.

Authored order, matching the prototype. Each top-level division is a
`<Panel id title>` (§3.2's note above); `id` is a slug, never an index.

| # | `id` | Title | Content shape |
| --- | --- | --- | --- |
| 1 | — | *(none)* | Page header + `<StatRow>` of three stats. Not a `<Panel>`; see §6.4 |
| 2 | `the-disease` | the disease | Prose + `<ValveAnatomy>` + `<ProgressionStrip>` |
| 3 | `mechanism` | how it calcifies | Prose + `<PathwayDiagram>` |
| 4 | `the-gap` | the gap in current research | Prose + `<ModelGapMatrix>` + `<DataNote>` |
| 5 | `goal` | the goal | A single emphasised statement — `<Panel tone="accent">` |
| 6 | `constraints` | what the model had to do | `<PanelGrid columns={2}>` of eight constraints |
| 7 | `concepts` | three designs | Three stacked `<Panel verdict>` with `<TradeoffList>` |
| 8 | `approach` | the approach | `<Steps>`, four steps |
| 9 | `spheroids` | making the spheroids | Prose + report figure |
| 10 | `gels` | choosing a gel | Prose + a real `<table>` |
| 11 | `results` | what we checked | Three `<Panel verdict>` |
| 12 | `strain` | was it actually stretching? | Prose + `<DataNote>`; **no chart** unless §2.2's option 1 |
| 13 | `calcification` | the stain that didn't work | Prose + report plates if they exist; `<DataNote>` for the open question |
| 14 | `scorecard` | met, and still open | `<Scorecard>` |
| 15 | `next` | where to take it | `<Steps>`, four items |
| 16 | `references` | references | `<References>` |

Panels 1 and 16 do not appear in the rail or the contents list: the header
is not a destination and the references are the end of the page. Excluding
`references` is now `rail={false}` on that `<Panel>` (panels-and-rail §3.4),
not a hardcoded `id === 'references'` check; the header is not a `<Panel>`
at all.

### 6.4 The header is not rebuilt

`PieceView` already renders the `h1`, the `categoryLabel · discipline · year`
meta line, and `description`. The prototype's hero repeats all of that. **The
page header is the hero.** Only the three statistics survive it, as the first
block of the body.

The prototype's hero also carries the byline. Per §0 it is **dropped
entirely** — no names, Beck's included. The team is acknowledged in prose
(§9.3).

### 6.5 The goal section's inverted band

The prototype renders the goal statement as white-on-near-black
(`.goal-section{background:var(--ink)}`). **The site is dark by default**, so
an "inverted" band is either invisible or an unexplained light box depending on
theme. Render it instead as an emphasised pull quote — the treatment
`essayComponents.blockquote` already defines, reading `--essay-accent` off the
cascade — at `headingStyles.h2` scale. `<Section tone="accent">` is what
selects it. No new background, no theme-conditional surface.

---

## 7. Colour

### 7.1 Two hues, not four

The prototype uses teal / red-orange / gold (of which two are the same hex).
The rebuild uses **two**, both existing tokens:

| Role | Token | Applies to |
| --- | --- | --- |
| **Focus / met / confirmed / selected** | `var(--science)` (the piece tone, inherited as `--essay-accent`) | The dystrophic lane of the pathway diagram, "met" scorecard column, confirmed result panels, the selected design concept, `+` tradeoff tags, the active rail dot |
| **Severity / open / inconclusive / rejected** | `var(--terracotta)` light, `var(--terracotta-alt)` dark | The progression strip's ramp, the "open" scorecard column, inconclusive results, rejected concepts, `−` tradeoff tags |

Everything else is `--foreground`, `--muted-foreground`, `--border`, `--card`.

**The non-focus (osteogenic) pathway is not a third hue** — it is drawn in
`--muted-foreground` and `--border`. The relationship between the two lanes is
*emphasis*, not opposition: one is what this project models, the other is
context. Colouring both makes them look like a value judgment about the
biology.

### 7.2 Accent hues are never small text

Per [2026-09-color-roles-and-contrast.md](2026-09-color-roles-and-contrast.md)
§3.1, an accent hue may be a fill, a border, an icon stroke, a rail dot, or
text at ≥24px — **never small text on the page ground**.

The prototype violates this everywhere: 10–13px `var(--red)` and `var(--gold)`
labels inside every SVG, `.eyebrow` at 13px, `.stat .num` in red, `.mono` rails
in accent colours. In the rebuild:

- Every SVG label, axis tick, and node caption is `currentColor`, inheriting
  `--foreground` or `--muted-foreground` from the wrapper.
- Accent enters an SVG only as `fill`, `stroke`, or a `<rect>` behind a label.
- A label sitting on an accent fill takes `var(--on-accent)` — never
  `var(--card)`, never `--primary-foreground`.
- `<Stat value>` is large display type, so it *may* take the accent.

### 7.3 Token prerequisite

This piece needs two tokens the colour spec defines and that do not exist yet:

```css
/* light */  --terracotta-alt: #8c3623;   /* same as --terracotta */
             --on-accent: #ffffff;
/* dark  */  --terracotta-alt: #d6725c;   /* 5.92 on bg, 5.24 on card */
             --on-accent: var(--background);  /* #080b24 */
```

Raw `--terracotta` is 2.46:1 in dark mode — unusable as text, border, *or*
fill, which is why the alt is required rather than nice to have.

**If the colour spec has already shipped, use its tokens and add nothing.** If
it has not, this piece lands exactly these two declarations (plus their
`@theme inline` entries) and nothing else from that spec. Do not implement
`--link`, `--interactive`, `--subtle`, the neutral ramp, or the `--art-alt`
rename here — that is a separate pass with its own verification.

### 7.4 Fonts

Delete the `<link>`s to `fonts.googleapis.com`. The site loads Recursive and
Noto via `next/font/google` and adding a third family for one page is not on
the table.

| Prototype | Becomes |
| --- | --- |
| `Poppins` (headings) | `headingStyles.*` — no font declaration at the call site |
| `IBM Plex Sans` (body) | inherited `--font-sans` (Noto) |
| `IBM Plex Mono` (eyebrows, labels, numbers) | `.font-brand` (Recursive at `MONO 1`) |

SVG `<text>` elements must not declare `font-family` at all — they inherit
from the wrapper, which is where the class goes.

---

## 8. Components

### 8.1 `components/case-study.tsx`

`CaseStudy` is `'use client'`. Everything else in the file is server-safe and
must stay that way — they render inside a server-rendered MDX body.

```tsx
/** The document wrapper: derives the section list, renders both navs. */
export function CaseStudy({ children }: { children: ReactNode }): JSX.Element

/**
 * One top-level section. Renders <section id aria-labelledby> with the title
 * as an h2 (headingStyles.h2) — the page's h1 is the piece title.
 * `tone="accent"` selects the emphasised treatment used by the goal section.
 */
export function Section(props: {
  id: string
  title: string
  tone?: 'default' | 'accent'
  children: ReactNode
}): JSX.Element

/** The prose measure inside a full-width section. max-w-2xl. */
export function Prose(props: { children: ReactNode }): JSX.Element

/** A single statistic: large value over a small label. */
export function Stat(props: { value: string; label: string }): JSX.Element

/** A row of Stats, wrapping. Used once, under the page header. */
export function StatRow(props: { children: ReactNode }): JSX.Element

/**
 * A figure with an optional caption. `full` escapes the prose measure to the
 * section's own width — for the diagrams and the gel table.
 */
export function Figure(props: {
  caption?: ReactNode
  full?: boolean
  children: ReactNode
}): JSX.Element

/** An ordered sequence. Renders <ol>; Step numbers derive from position. */
export function Steps(props: { children: ReactNode }): JSX.Element
export function Step(props: { title: string; children?: ReactNode }): JSX.Element

/** A responsive grid of Panels. `columns` is the widest-breakpoint count. */
export function PanelGrid(props: {
  columns?: 2 | 3 | 4
  children: ReactNode
}): JSX.Element

/**
 * A titled block. `verdict` renders a small pill above the title and picks
 * the accent: 'selected' | 'confirmed' take --science, 'rejected' |
 * 'inconclusive' take --terracotta-alt. `icon` is a lucide component.
 */
export function Panel(props: {
  title: string
  icon?: LucideIcon
  verdict?: 'selected' | 'rejected' | 'confirmed' | 'inconclusive'
  children: ReactNode
}): JSX.Element

export function TradeoffList(props: { children: ReactNode }): JSX.Element
export function Tradeoff(props: { kind: 'plus' | 'minus'; children: ReactNode }): JSX.Element

/** The met/open two-column summary. */
export function Scorecard(props: { children: ReactNode }): JSX.Element
export function ScoreColumn(props: { status: 'met' | 'open'; title: string; children: ReactNode }): JSX.Element
export function ScoreItem(props: { children: ReactNode }): JSX.Element

/**
 * A callout for a stated limit, an open question, or a measurement that
 * carries a caveat. Replaces the prototype's `.gap-box`. Accent left rule,
 * label, body.
 */
export function DataNote(props: { label: string; children: ReactNode }): JSX.Element

/** The reference list. Renders a native <details>; `count` must be honest. */
export function References(props: { count: number; children: ReactNode }): JSX.Element

/**
 * Marks the defining instance of a technical term. Renders <dfn> with a
 * dotted underline and no interaction — the gloss is written into the prose
 * beside it, not hidden in a tooltip.
 */
export function Term(props: { children: ReactNode }): JSX.Element
```

`Tradeoff`'s `kind` is a required prop with no default: an unlabelled tradeoff
row is meaningless, and defaulting to `plus` would silently turn a drawback
into a benefit.

### 8.2 `components/figures/valve-figures.tsx`

Four inline SVGs, all server components, all taking no props — each is one
specific figure, not a parameterised chart. Pure presentation.

```tsx
export function ValveAnatomy(): JSX.Element       // the four valves, aortic emphasised
export function ProgressionStrip(): JSX.Element   // normal → sclerosis → mild → severe
export function PathwayDiagram(): JSX.Element     // dystrophic (focus) vs osteogenic lanes
export function ModelGapMatrix(): JSX.Element     // 2D/3D × dystrophic/osteogenic, one cell empty
```

Requirements binding on all four:

- `role="img"` and a real `aria-label` describing what the figure shows.
  Section 6.3's diagrams carry information not otherwise in the prose.
- `viewBox` with no fixed `width`/`height`; `width: 100%; height: auto`.
- Every colour is a token or `currentColor`. **No literal hex anywhere.** The
  prototype's `#f1cfae`, `#b6d4e8`, `#c99a6b`, `#3a352c`, `#c9c2b0` and friends
  are light-mode-only and all must go.
- No `font-family` on `<text>` (§7.4).
- `PathwayDiagram` and `ModelGapMatrix` are wide. Each is wrapped by
  `<Figure full>` in an `overflow-x: auto` container so a narrow viewport
  scrolls the figure, never the page body.
- `ProgressionStrip` is a four-stage severity ramp. It reads
  `--border → --terracotta-alt` in steps, and each stage's stroke weight also
  increases — the ramp must not be carried by hue alone (colour-blind readers,
  and `--terracotta` at the light end is subtle).

### 8.3 Table styles — a real gap in `essayComponents`

`essayComponents` (`components/essay.tsx`) maps no table elements, so the gel
comparison table would render unstyled. Add `table`, `thead`, `tbody`, `tr`,
`th`, `td` to the map.

This is a **site-wide addition, not a case-study one** — it is the first MDX
body to need a table, and the map is global. Keep it plain and token-driven:
`th` in `.font-brand` at `text-xs uppercase` muted, `border-b border-border`
row rules, `td` aligned top. The table is wrapped by `<Figure full>` for its
horizontal scroll container; the element map does not supply one.

---

## 9. Content

### 9.1 The provenance problem

Beck's answer was **"mixed — report text plus filler."** Some passages come
from the MQP; some were invented by the prototype to connect them. On a site
whose standing rule is *"every write-up on this site is Beck's own words"* and
*"imported content is never rewritten"*, invented connective prose attributed
to Beck is exactly what both rules exist to prevent.

**No block ships unresolved.** Every prose block in the MDX ends in one of
three states:

| State | Annotation | Meaning |
| --- | --- | --- |
| Sourced | `{/* src: report p.24 §3.2 */}` | Transcribed from the report, verbatim or lightly cut. Cuts are omissions of whole blocks only — never rewording |
| Beck's | `{/* src: beck */}` | New copy Beck wrote for this page |
| — | *(absent)* | **Fails the check in §9.2.** Not shippable |

Prototype filler that is neither gets **deleted**, not smoothed. Where deleting
it leaves a gap in the argument, that gap is Beck's to fill — the implementer
does not write connective prose on Beck's behalf.

**Confirmed invented, as of 2026-09-16** — these are not "likely", they were
checked against the extracted report text and have no source:

| Passage | Status |
| --- | --- |
| "2-4% of individuals over 65 are affected by CAVD" | Fabricated statistic (§2.6). Delete |
| "83% … driven by mechanical stress, not genetics" | The numbers are real; the causal gloss is invented (§2.6) |
| "13% · genetic factors" (pathway diagram label) | Mislabel. Osteogenic is an osteoblast-like phenotype, not "genetic factors" |
| "Adjusting UV exposure time … might resolve this" | Refuted by the report — already tried (§2.8) |
| "one of the most common valvular heart diseases" | Hedged down from the report's "the most common" (§2.6) |

Still flagged on voice alone, needing a source or Beck's authorship: the
hero's "Most existing lab models don't actually test that", the results
section's "Not all three went the way the team was hoping, and that's worth
being upfront about", the calcification section's "That didn't pan out the way
we'd hoped", and the §4 gap-box framing.

### 9.2 `scripts/check-case-study-provenance.mjs`

Node only, no dependencies, not wired into the build — the same shape as
`scripts/check-essay-fidelity.mjs`.

```
node scripts/check-case-study-provenance.mjs
```

Parses `content/case-studies/*.mdx`, walks top-level prose blocks (paragraphs,
list items, and the string children of `<Panel>` / `<ScoreItem>` /
`<DataNote>`), and exits non-zero listing every block with no preceding
`{/* src: … */}` annotation. It verifies **presence, not accuracy** — the
annotation is a claim a human made, and the script's job is to make an
unmade claim impossible to miss.

It does not diff against the PDF. `check-essay-fidelity.mjs` can word-diff
because the archive sources are plain Markdown; the report is a PDF whose text
layer needs extraction (§10), and the prose is deliberately a mix, so a word
diff would fail by design.

### 9.3 Attribution

No byline (§0). The team is acknowledged in prose, in the first section, in
Beck's own words — one sentence stating it was a four-person MQP team. The
implementer does not draft this; it is on §12's blocker list.

Consequences to hold to:

- No names anywhere on the page, in `description`, in the `<title>`, or in the
  reference list's framing.
- The prototype's `<footer>` credit block is dropped entirely — the site has
  its own footer.
- First-person plural in transcribed report text ("the team", "we") stays as
  written. It is not smoothed to first-person singular; the work was not
  Beck's alone and the prose should not imply it was.

### 9.4 Title, slug, description

```ts
slug: 'aortic-valve-calcification'
title: 'aortic valve calcification'      // Beck to confirm — §12
year: '2021'
```

`title` is lowercase, matching every other authored title in `WORK`
(`transformation`, `colony selection`, `designing dna`). The prototype's
"A 3D Model of Aortic Valve Calcification" is title-cased and does not match
the site's voice.

`description` is a one-line editorial gloss — Beck's, not the report's
abstract. On §12's blocker list.

---

## 10. The report: extraction, and what may actually be published

The report is `~/Downloads/Final MQP Paper.pdf` — 80 pages, 88 embedded
images, 38 MB, titled *"Designing a Novel 3D In-Vitro Model of Mechanical
Stress on Dystrophic Aortic Valve Calcification"*, dated May 6 2021. **It is
outside the repo**, the same exposure TODO §22 records for the zine carousel.

### 10.1 Extraction — no install required

`pdftotext`, `mutool` and `qpdf` are all absent, and the report's text is in
subset fonts, so raw PDF stream parsing returns garbage. **Do not
`brew install poppler`** — macOS ships PDFKit and `/usr/bin/swift`, which does
both jobs with no system change.

Working scripts are in this session's scratchpad and should be copied into
`scripts/` if they are to be rerun:

- `extract.swift <pdf> <out.txt>` — `PDFDocument` -> per-page `page.string`,
  with `===== PAGE n =====` markers. Verified: 80 pages, 135,788 characters of
  clean text.
- `render.swift <pdf> <comma-separated pages>` — renders pages to PNG at 1.6x
  via `page.draw(with:to:)`. Used to read the figures.

The extracted text is the source for §2.6's verification, §9's provenance
sourcing, and the §2.4 bibliography.

### 10.2 Copyright — most of the report's figures may NOT be republished

**Appendix B (p.63-64) is a figure copyright approval table, and it is
restrictive.** The permissions the team obtained are scoped to a thesis, and
several were never granted at all:

| Approval status in Appendix B | Figures | Publishable on the site? |
| --- | --- | --- |
| "Emailed - waiting for approval" | valve leaflet anatomy, mechanical valve, MCFX plate, CellScale MCFX | **No.** Permission was never obtained |
| "No copyright approval needed for use in a **thesis/dissertation**" | progression of CAVD, 2D/3D schematic diagrams | **No.** A personal portfolio site is not a thesis |
| "Not copyrighted for **non-commercial** use" | left heart simulator, ULA+MC | **Probably not.** Needs a case-by-case decision, not an assumption |
| "Creative Common CC BY license" | scaffold-free aggregation methods | **Yes, with attribution** |
| "Approved" | bioprosthetic valve, cyclic pressure chamber, hanging drop | **Unclear.** Approved *for the thesis*; scope beyond it is not recorded |

Appendix B uses an **older figure numbering** that does not match the body's,
so a figure-by-figure mapping is needed before relying on any single row.

**This vindicates §8.2 on grounds beyond aesthetics.** The four rebuilt SVG
diagrams — `ValveAnatomy`, `ProgressionStrip`, `PathwayDiagram`,
`ModelGapMatrix` — cover precisely the explanatory figures that cannot be
republished. Rebuilding them was already the right call for theming and dark
mode; it is now also the licensing answer. Do not substitute a scan of a
journal figure for any of them.

### 10.3 The figures that are the team's own — the shortlist

Everything from the experimental chapters is the team's own work and is
publishable. Located and read:

| Figures | PDF page | What it shows | Recommendation |
| --- | --- | --- | --- |
| 34, 35, 36 | 48 | Live/dead micrographs — collagen, fibrin, GelMA+HAMA. Green=live / red=dead, 100 µm scale bars | **Ship all three.** This is the project's best result and the three-way comparison is the whole point |
| 37 | 49 | Fibrin Von Kossa — same aggregate at two exposures, deliberately showing the ambiguity | **Ship.** It is the evidence for §2.7 |
| 38, 39 | 49, 50 | Collagen and GelMA+HAMA gels darkened past imaging | **Ship at least one.** The failure is the finding (§2.3) |
| 41, 42 | 51 | The 8x8 strain heatmaps, Y and X | **Ship both.** X-near-zero is what makes Y meaningful (§2.2) |
| 22, 23, 25 | 42, 43 | Embedded aggregates in each gel | Optional — supports the gel section |
| 30, 31, 32 | 46 | Experimental setup; graphite pattern used for tracking | Optional — good process context |
| 18 | 38 | Images of aggregates | Optional |
| 40 | 50 | Vector placement in the well plate | Ship **only if** 41/42 ship — it is their key |

Extraction, then: convert to `.webp`, place under
`public/work/aortic-valve-calcification/`, record real dimensions so
`imageAspect` and each `<Figure>`'s aspect match the file and nothing shifts on
load.

**Micrographs are evidence.** Not cropped, not colour-corrected, not
composited, and the scale bars stay. A plate too dark to read *is* the result.

### 10.4 The poster image

`image` drives the gallery card, the placeholder, and the OG image.

**Recommendation: Figure 34 (collagen live/dead, p.48).** It is the team's own,
it is the project's strongest result, and a green fluorescent spheroid on black
is genuinely striking at card size. Second choice: Figure 37, which is more
honest about where the project landed but much harder to read small.

Do **not** render one of §8.2's SVGs as the poster — a card should advertise
the work, not the website's drawing of it.

## 11. Edge cases

| Case | Handling |
| --- | --- |
| **The rail under 1024px** | Hidden (`hidden lg:flex`). The contents list is the only nav; it is always rendered, never collapsed |
| **`--nav-h` unset on first paint** | `scroll-margin-top: calc(var(--nav-h, 4rem) + 1rem)` — the fallback covers the gap before `site-nav` measures itself (§5.4) |
| **Nav wraps to two lines below ~363px** | Handled by `--nav-h` being live rather than a constant. Do not hardcode a nav height anywhere in this piece |
| **`prefers-reduced-motion`** | Programmatic scrolls pass `behavior: 'auto'`, read via `matchMedia` in JS — `globals.css`'s reduced-motion block does not reach `scrollIntoView` options (§5.5) |
| **A section with no `id`** | Excluded from both navs. `CaseStudy` warns in development (§5.1) |
| **`references` section** | Excluded from both navs by `id`. It is the end of the page, not a destination |
| **Wide figures on a phone** | `<Figure full>` wraps in `overflow-x: auto`. The page body must never scroll horizontally |
| **The gel table on a phone** | Same container. It is not restructured into cards — the comparison is the point, and four columns of short cells scroll fine |
| **SVG text in dark mode** | `currentColor` only. Any literal hex is a bug (§7.2) |
| **Lightbox** | The piece is not a collection, so `PieceMedia` gives its poster a single-item lightbox as every image piece gets. Figures inside the MDX body are **not** lightboxed — `ImageLightbox`'s domain is `WorkPiece`s, and a figure is not one. `galleryLightboxItems()` is untouched |
| **`metaDescription()`** | Falls through `description` → `preview` → `text` → `title`. This piece sets `description`, so it is fine — but it must actually be set (§12) |
| **`hasWriteup()`** | Returns true from `MDX_BODY_SLUGS`, so the gallery card gets the write-up badge with no extra wiring |
| **Sort position** | `year: '2021'` places it chronologically. Array position only breaks ties within 2021 |
| **`tier`** | Unset → `general`. Beck may set `favorite`; not assumed |
| **`opengraph-image.tsx` / `sitemap.ts`** | Both derive from `WORK`. No change needed; verify the new route appears in the build's page count |
| **Figure alt text** | Every extracted image needs real alt text. A micrograph's alt describes what is visible, not what it proves |

---

## 12. Blockers — what this needs from Beck

**Five of the original eight were resolved on 2026-09-16** by extracting and
reading the report (§10.1). What remains is genuinely editorial.

### Resolved — no longer blocking

| # | Was | Outcome |
| --- | --- | --- |
| 5 | Verify the numeric claims | **Done — §2.6.** One statistic is fabricated, three are mislabelled or hedged, the rest check out |
| 6 | Decide the strain chart | **Done — §2.2.** Real data is spatial, not temporal. Ship Figures 41/42 |
| 7 | The reference list | **Done — §2.4.** ~66-69 entries, not 38. Full text available to transcribe |
| 8 | Confirm the poster | **Recommended — §10.4.** Figure 34, pending Beck's yes |
| 2 | Select the report figures | **Shortlisted — §10.3**, with §10.2's copyright constraint resolved. Beck confirms the list |

### Still blocking

1. **Decide §2.7 — how to handle the report contradicting itself.** The results
   section and the conclusion disagree about whether calcification occurred,
   and the prototype silently took one side. Recommendation is option 2
   (present both). **This is the piece's editorial centre and nothing else
   should be written until it is settled.**
2. **Resolve the mixed prose (§9.1).** Now unblocked — the report text is
   extracted and every claim in §2.6 is adjudicated — but each block still
   needs its `{/* src: … */}` annotation, and the passages flagged as
   prototype filler need either a real source or deletion. Where deletion
   leaves a gap, Beck writes the replacement.
3. **The team acknowledgement sentence (§9.3).** One sentence, Beck's words.
   With no byline, this is the only place the other three people are credited.
4. **Confirm `title` and write `description` (§9.4).** The report's own title
   is *"Designing a Novel 3D In-Vitro Model of Mechanical Stress on Dystrophic
   Aortic Valve Calcification"* — too long for a card, but it is the honest
   starting point.
5. **Confirm the figure shortlist (§10.3)** and whether the optional rows ship.
6. **One unverified number** (§2.6): "about a million cells". Check Appendix D
   (p.64) or drop the figure.
7. **Decide whether to correct "one of the most common" back to "the most
   common"** (§2.6). The report's stronger claim is what it says; the
   prototype's hedge may be the more defensible statement in 2026. Beck's call.

## 13. Documentation to update in the same change

- **`docs/ARCHITECTURE.md`**
  - "Content model" — the behaviour-is-derived table gains `isCaseStudy`, and
    the `caseStudy` field's reason is recorded alongside `codeDemo`'s.
  - "Essay bodies are MDX; everything else is a string" — `content/case-studies/`
    becomes the third live content directory (the branding deck's
    `content/decks/` is still unbuilt).
  - A new **"Case studies"** section, after "Code demos", recording: what a
    case study is, why the interactions were deleted (§1), the two-hue palette
    contract (§7.1), and the `--nav-h` scroll-offset dependency (§5.4).
  - "Component layers" — `case-study.tsx` and `figures/valve-figures.tsx`.
  - "Theming" — the `--terracotta-alt` / `--on-accent` additions, cross-linked
    to the colour spec so it is clear they are a partial implementation of it.
  - "Routes" — the page count moves by one.
- **`docs/TODO.md`**
  - §2 (`science` is a discipline with zero work in it) gains a closing note:
    science now leads a piece on its own rather than only appearing alongside
    `art` or `writing`.
  - A new entry for the §6.2 `caseStudy` / `deck` boolean collision.
  - A new entry if §2.4's reference list ships incomplete.
- **This spec** moves to `docs/history/` on ship, stamped with where the build
  diverged.

---

## 14. Acceptance

- [ ] `/work/aortic-valve-calcification` renders all fifteen sections plus
      references, at every breakpoint from 375px to 1440px.
- [ ] `tsc --noEmit` and `next build` are clean; the build's page count is one
      higher.
- [ ] The piece appears in `/work` under `?tags=science`, `?tags=biology`, and
      unfiltered; its card shows the write-up badge; its meta line reads
      `biology · science · 2021`; its tone is emerald.
- [ ] `MAX_DISCIPLINE_CHIPS` is unchanged and the filter panel's resting height
      has not moved at 375px, 500px, or 1024px.
- [ ] Contents list and rail both render every section except `references`, in
      document order, and agree with each other.
- [ ] Every anchor jump lands the section heading below the sticky nav — tested
      at a width where the nav wraps to two lines (≤363px).
- [ ] The rail is hidden below 1024px; the contents list is not.
- [ ] Both themes: no literal hex in any SVG; every accent is a fill, border,
      icon, or ≥24px text; no accent-coloured small text anywhere.
- [ ] `grep -rn 'Â\|â' content/case-studies/ components/case-study.tsx components/figures/` returns nothing (§2.5).
- [ ] No fabricated data: no synthetic strain curve, no drawn micrographs.
- [ ] `node scripts/check-case-study-provenance.mjs` exits 0.
- [ ] No names on the page. `grep -in 'arruda\|christakos\|cuellar\|sousa'` over
      the piece's files and `lib/work.ts` entry returns nothing.
- [ ] The page body never scrolls horizontally at 375px.
- [ ] With JS disabled the document is fully readable — the navs are the only
      client behaviour and neither gates content.
- [ ] `prefers-reduced-motion: reduce` produces no smooth scrolling.

---

## 15. Out of scope

- **`<Section>` / `<Fold>` from
  [2026-09-sections-folding-logs.md](2026-09-sections-folding-logs.md).** That
  spec's `Section` is a *foldable heading with derived depth*; this spec's
  top-level division (renamed `<Panel>` — §6.3's amendment) is flat and never
  folds. They share nothing but a name this document no longer uses. Beck
  chose no folding, so that other spec stays unbuilt; if it later ships, its
  own `Section` name is still free — see the cross-reference note added at
  its §2.
- **The rest of the colour spec.** Only `--terracotta-alt` and `--on-accent`
  land here (§7.3).
- **A `case-study` tag, a fourth discipline, or any vocabulary change** (§3).
- **Generalising `caseStudy` and `deck` into one field.** Named in §6.2 as a
  TODO for whichever ships second; not done here.
- **Lightboxing figures inside the body** (§11).
- **A "download the report" link, or hosting the 38 MB PDF.** Not decided; if
  Beck wants it, it is a separate decision about a large binary in `public/`.
- **Any further science pieces.** `colony-selection` and `designing-dna` are
  unfinished essays and are unaffected.
- **A second case study.** The primitives in §8.1 are written for this
  document. Generalise them when a second one exists, not in anticipation.
