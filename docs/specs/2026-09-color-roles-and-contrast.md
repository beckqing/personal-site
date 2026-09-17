# Colour roles and contrast

**Status:** shipped (tokens), partial (gold usage deferred)
**Date:** 2026-09-17
**Live bench:** https://claude.ai/code/artifact/9ca709a9-0522-49ba-b1e9-ab24109310bd

## 1. The bug this fixes

The palette was never wrong. The **roles** were.

Beck hand-picked twelve colours, and the archived 11ty site
(`github.com/beckqing/archived-personal-site`, branch `master`) used them
as **three discipline pairs plus one semantic colour**, each pair swapping
wholesale between themes:

```css
:root {
  --color-art: #305789;  --color-art-alt: #68BFED;
  --color-sci: #4BA661;  --color-sci-alt: #AADB6C;
  --color-hu:  #BF712C;  --color-hu-alt:  #D9AA52;
  --color-danger: #8C3623;
}
@media (prefers-color-scheme: dark) { :root {
  --color-art: #68BFED;  --color-art-alt: #305789;
  /* …each pair reversed… */
}}
```

Critically, the discipline colour was **never resting text**. The word
carried `--color-text` with a dotted underline and took its discipline
hue only on `:hover`:

```css
#a-hu:hover { color: var(--color-hu); }                          /* the WORD */
#icon_container > svg.hu--hover { fill: var(--color-hu-alt); }    /* the ICON */
```

The Next.js rewrite took those **mark** colours and set 12px labels in
them. Nothing cleared 4.5:1, so the rewrite compensated by darkening
Beck's hues by inconsistent amounts toward no stated target —
`--writing #a85e1e` (4.03:1), `--science #2f7d45` (4.18:1),
`--goldenrod #97671a` (4.05:1). All three just short.

**Fixing the role, not the value, is the whole move.**

## 2. The model

Each discipline is **one pair: a dark member and a light member.** The
ground decides which is the word — whichever clears 4.5:1 against it —
and the other becomes the mark.

| pair | dark member | light member |
| --- | --- | --- |
| art | denim `#305789` | cornflower `#69B6E9` |
| writing | rust `#994C00` | macaroni `#DE9B4F` |
| science | pine `#007848` | spring green `#AADB6C` |
| danger | terracotta `#8C3623` | coral `#D16147` |
| gold (utility) | bronze `#B67600` | sunshine `#F8CC66` |

Three pairs read in two directions, not six hue families.

### The two windows are the same for every hue

Contrast depends only on luminance, and L\* is a pure function of
luminance — so the lightness a role demands is **hue-independent**:

- **dark member** — needs 4.5:1 as the daylight word → **L\* ≤ 44**
- **light member** — needs 3:1 as the daylight mark *and* 4.5:1 as the
  night word → **L\* 52–56**

Pick any hue; those are the two slots it has. What differs between hues is
how much chroma survives the trip: red's chroma peaks *inside* the light
window (C 102), while yellow's collapses on the way down (C 86 at L\* 85,
C 60 at L\* 52) — which is why gold is the awkward one.

## 3. What shipped

`app/globals.css` only. No component changed.

```css
/* daylight — the word is the pair's dark member */
--art:        #305789;  /* denim  — 6.07:1 */
--writing:    #994c00;  /* rust   — 5.10:1  (was #a85e1e, 4.03) */
--science:    #007848;  /* pine   — 4.57:1  (was #2f7d45, 4.18) */
--terracotta: #8c3623;  /* 6.48:1 */

/* night — the same pairs reversed */
--art:        #69b6e9;  /* cornflower — 8.74:1  (was denim, 2.63) */
--writing:    #de9b4f;  /* macaroni   — 8.22:1 */
--science:    #aadb6c;  /* spring     — 12.05:1 */
--terracotta: #d16147;  /* coral      — 5.09:1  (was terracotta, 2.46) */
--destructive: #d16147;
```

Two of those were outright failures before, not near-misses: **dark-mode
`--art` sat at 2.63:1** and **dark-mode `--terracotta` at 2.46:1**,
because both were identical in the two themes and the archive had swapped
them. Terracotta simply never had a night value; coral is it.

`--art-mark` / `--writing-mark` / `--science-mark` are declared in both
themes so the pair system lives in one place. **Nothing consumes them
yet.**

The hero collage's `--hero-icon-*` are now written as literals rather
than `var(--art)` etc., because those tokens carry the *night word*
colours now. The collage still gets denim / emerald / pumpkin exactly as
before. Its appearance is unchanged.

## 4. Decisions

1. **Each discipline is one pair; the ground picks the word.** Not six
   hue families.
2. **Gold is fill-only — never set as text, on either ground.** Both gold
   members are light members, so neither clears 4.5:1 as daylight body
   text, and a gold dark enough to manage it stops reading as gold. As a
   *fill* it carries its own contrast: bronze 3.10:1 against the daylight
   page, sunshine 12.75:1 against night, both over the 3:1
   graphical-object bar, with midnight on top at 4.5:1 or better. Tokens
   are therefore `--gold-fill` / `--gold-fill-on`, deliberately not
   `--gold`.
3. **Filled surfaces take midnight on a bright fill, white on a dark
   one** — never the pair's own dark member, which is only ~20 L\* away
   and lands at 3.2–3.5:1. Decided by measurement: coral reads as a dark
   but sits at L\* 55, so it correctly takes midnight.
4. **Links are a treatment, not a hue** — ink text, dotted underline, as
   the archive had it. No accent hue survives dichromat simulation; all
   seven candidates collide with something (goldenrod-as-accent is ΔE 6
   from coral under deuteranopia). This frees blue to stay art.
5. **Bright marks below 3:1 on the daylight page are accepted.**
   Cornflower 1.83, macaroni 1.94, spring 1.32. The archived site had the
   same shortfall, so it is inherited rather than introduced, and it only
   bites on a mark with no label beside it. Brightness was chosen
   knowingly.
6. **Greyscale convergence in the light-member window is accepted.**
   Phone greyscale (iOS Color Filters, Android Bedtime Mode) is a real
   mode, but reading survives it — every contrast figure here is already
   a greyscale figure. What degrades is *identification*, and the label
   carries that.
7. **Two grey tiers only:** storm `#69635E` on daylight, nickel
   `#A79F99` on night. The eighteen dimmed sites are four jobs, not three
   tiers — separator dots and disabled states are exempt, leaving seven
   real captions.
8. **Archived colours keep their brightness and lose their roles.** Sky,
   goldenrod, pumpkin and emerald stay in the palette for illustration
   and the hero collage, never as discipline colours.
9. **Near-identical values still get distinct names.** Cornflower is ΔE 3
   from sky, macaroni ΔE 4 from goldenrod — effectively the same colours.
   The separate name is what stops someone reading the token and reaching
   for the archived one.
10. **Categorical figures get their own palette.** Only five of the set
    survive ΔE ≥ 20 across normal, deuteranopia and protanopia at once,
    and those five span 80 L\* units. The warm coherence that makes this
    an identity is exactly what makes it unusable for categories.

## 5. On 4.5:1

Worth recording, because it came up and the answer is not obvious: 4.5:1
is **not a legibility threshold**. It is the normal-vision threshold with
a 1.5× safety factor.

- **3:1** — ISO-9241-3 / ANSI-HFES-100-1988 minimum for standard text at
  normal vision. Also the bar for large text (≥24px, or ≥18.7px bold) and
  all non-text.
- **4.5:1** — that baseline × 1.5, compensating ~20/40 acuity.
- **7:1** — baseline × ≈2.3, compensating ~20/80.

The formula models neither size, weight, chroma, ambient light, display
quality, familiarity, nor duration. So a saturated colour at L\* 72 can be
perfectly readable at 28px on a good screen and still score 1.8:1 — and
both facts are true, because they answer different questions. APCA-W3
0.1.9, the perceptual model drafted for WCAG 3, reaches the same verdict
on those values (Lc 29, below the Lc 30 floor for any text), so this is
not a quirk of the 2.x maths.

What the margin buys is the readers you cannot poll. That is the whole
case for it.

## 6. Deferred

- **Gold usage, by decision.** `--goldenrod #97671a` stays as-is in
  daylight even though it reads 4.05:1 as text and 4.45:1 as a
  `bg-goldenrod` fill. Every current consumer is untouched: the nav
  `work` pill, the `general` about tab, work-gallery's filter chips and
  search affordances, the theme toggle. Rule 2 says gold should be
  fill-only, which means these want revisiting — but not in this pass.
- **The mark tokens are unwired.** `--art-mark` and friends exist and are
  unused. Hooking the hero collage and discipline icons to them is the
  natural next step.
- **`--hero-accent-art`** is still `var(--sky)` at night while `--art` is
  now cornflower — two blues 3 ΔE apart doing one job. Consolidating is
  safe but touches the hero, which has its own documented rationale.
- **The figure palette** (decision 10) is not built.
