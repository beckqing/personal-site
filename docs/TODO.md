# TODO

Open work only. Design decisions, structure, and the record of what's already
built live in [ARCHITECTURE.md](ARCHITECTURE.md).

Last reconciled against the tree 2026-08-27 (second pass, after `2dc8324`).
`tsc --noEmit` clean; `next build` clean, 199 static pages. Every media claim
in ARCHITECTURE.md re-verified with `ffprobe` and holds.

Items marked **?** need a decision before the work can start. The five open
questions from the first pass were decided 2026-08-27; the decisions
themselves — including two that closed with nothing left to do (the
sticky-chrome rule, `HybridCard`) — are recorded in ARCHITECTURE.md, not
here.

---

## 1. The home page renders fabricated content — **top priority, blocked**

`lib/content.ts` is untouched v0-scaffold invention: made-up poems, made-up
essays, and made-up research projects with made-up metrics ("Contrast passing
AA: 100%", "Days logged: 120", a talk titled "Designing Color-Blind-Friendly
Data Visualizations"). `app/page.tsx` imports `ARTWORKS`, `POEMS`, and
`PROJECTS` from it and renders all three as real work — a featured painting
("Lamplight", a generated PNG), a featured poem, and a featured science stat.

An unfinished migration, not a design choice: commit `95dcb32` ("Replace
fabricated portfolio content with real work") moved `/work` onto `lib/work.ts`
and left the home page behind.

**Blocked on Beck** — the replacement writing and science copy has to be
written, not derived. There's no real science project in `lib/work.ts` to
promote into that panel at all (see §2).

- [ ] **Beck:** the science panel's real content — a project, a stat, or a
      different framing entirely.
- [ ] Point the art panel at a real piece from `lib/work.ts`. Mechanically
      derivable; can land ahead of the copy.
- [ ] Point the writing panel at a real poem — `love-worth-heartbreak` has 22,
      each with a hand-set `preview`, which is exactly the shape the quote
      panel wants. Also derivable ahead of the science copy.
- [ ] Delete `lib/content.ts` once nothing imports it. `ESSAYS` is already
      exported-but-unused and can go regardless.
- [ ] Drop the orphaned scaffold art it references (see §7).

## 2. `science` is a discipline with zero work in it — **content, not design**

Three of the site's most prominent links land on the empty state:

- the hero copy's `science` word (`CategoryWord`, `app/page.tsx`)
- the homepage's third discipline panel
- the footer's `science` link

All three go to `/work?tags=science`, and **no item anywhere in `lib/work.ts`
carries the `science` tag.** The gallery answers "nothing matches yet."

It's wider than one tag. Ten of the filter vocabulary's tags have zero items:

| Facet | Dead tags |
|---|---|
| discipline | `science` |
| medium (art) | `oil` |
| field (science) | `biology`, `neuroscience`, `material science`, `dataviz` |
| theme (universal) | `nature`, `the body`, `memory`, `food` |

Live tags, for contrast: `art` (27 top-level items), `writing` (5),
`watercolor`, `ink`, `digital`, `poem`, `essay`, `blog`, `color`, `language`.

The `field` tags never surface unless `science` is selected, so they're only
reachable through a chip that already returns nothing — but `oil`, `nature`,
`the body`, `memory`, and `food` sit in the always-visible rows and guarantee
an empty result in `and` mode.

**Decided (2026-08-27): Beck fills it.** Science is core to Beck's identity;
the work just hasn't been uploaded yet. The vocabulary stays exactly as it is.

- Do **not** prune the dead tags.
- Do **not** hide or disable zero-count chips.
- Do **not** re-frame the homepage's three-discipline structure around a
  temporarily two-discipline dataset.

- [ ] **Beck:** add science work to `lib/work.ts`. That closes this, and it's
      the same blocker as §1's science panel.

Until then `/work?tags=science` is a known, accepted dead end — recorded here
so it isn't re-filed as a bug on every review.

## 3. Placeholder links and stale copy

- [ ] **13 `href: '#'` links** in `lib/about-content.ts` — every social on
      every about tab (instagram ×2, twitter, youtube, github, codepen,
      deviantart, artfight, toyhouse, the blog). Two are deliberately marked
      `soon: true` (behance, dribbble); the other eleven are just unfilled.
- [ ] `lib/about-content.ts`, art tab: "Soon I will be publishing my portfolio
      on this site." `/work` shipped some time ago — the copy contradicts the
      site it's on.
- [ ] `components/site-footer.tsx` — `mailto:hello@beckqing.com` (confirm this
      address is real) and a bare `https://instagram.com` pointing at the site
      root rather than a profile.

## 4. Correctness and consistency gaps

None of these are visibly broken today. All four are places where two parts of
the codebase disagree, or where an invariant is held in one place and not
another — the kind of thing that becomes a bug the next time the data changes.

- [ ] **Lightbox filtering is only half applied.** `ImageTile` and
      `IllustratedTile` scope lightbox paging to `pieces.filter(p => p.image)`;
      `app/work/[slug]/[pieceSlug]/page.tsx` still passes the unfiltered
      `collection.pieces` with `lightboxIndex={index}`. That's the same defect
      `2dc8324` fixed for tiles, left in place on the piece page. Latent, not
      live — no mixed collection currently holds an imageless piece — but the
      index would also be wrong, not just the contents. Fix belongs in
      `ImageLightbox` or a shared helper so there's one place to get it right.
- [ ] **Search doesn't cover an item's own `text` or `preview`.** `filterWork`
      searches title, description, and tags on every item, plus — for
      collections only — their children's title, description, `text`, and
      `preview`. So a line inside a Mindtober tercet is findable (it's a
      child), and a line inside a standalone essay's pull quote is not.
      **Decided: cover an item's own `text` and tags too**, making the haystack
      uniform across items and children. Update the search box's placeholder
      ("search titles, descriptions, tags…") and `filterWork`'s own JSDoc,
      which currently omits even the children path it does implement.
- [ ] **`isPoem ? 'poem' : 'essay'` is hardcoded in three places**
      (`TextCard`, `HybridCard`, `TextCardFace`). Anything text-forward that
      isn't tagged `poem` is labeled "essay" — correct for today's data, wrong
      for the first hybrid art piece that carries text.

## 5. Media loose ends

- [ ] The `object-contain` comment in `components/media-player.tsx` still
      cites Verdant's poster/video aspect mismatch as its reason; that
      mismatch no longer exists. The rule is worth keeping as a general guard
      — fix the justification.
- [ ] Two non-null assertions (`piece.animationSrc!`, `piece.speedpaintSrc!`),
      both in `PieceMedia`, both guarded a few lines above. A typed narrowing
      helper would remove them. Not load-bearing.
- [ ] `PieceView` in `app/work/[slug]/page.tsx` returns early for a
      text-forward standalone piece without calling `PieceMedia`, so a poem
      that ever carried an animation would render no media. No such piece
      exists; noted so it isn't rediscovered as a mystery.
- [ ] The two near-identical Presidential Pardon sources (reel 39.12s vs.
      carousel-embedded 39.00s) were never diffed. The reel was used.

## 6. Build configuration and route-level files

- [ ] `next.config.mjs` sets `typescript.ignoreBuildErrors: true`. The tree
      typechecks clean and the build log says "Skipping validation of types",
      so this buys nothing and hides the next regression. Remove it.
- [ ] `images.unoptimized: true` on a site whose `public/` is 56MB of artwork.
      May be right for the deploy target, but it should be a decision rather
      than a scaffold default.
- [ ] **The four icon files in `public/` are v0's, not Beck's — delete them.**
      `public/icon.svg` is the stock Next.js black/white template;
      `icon-light-32x32.png`, `icon-dark-32x32.png`, and `apple-icon.png` are
      the rest of the same scaffold set. They're also inert where they sit —
      icons are `app/` file conventions, not `public/` files, and
      `metadata.icons` is unset — so the site currently ships no favicon at
      all. The actual favicon is generated as part of the brand-mark work
      below (`favicon-moon.svg`), not copied from anywhere.
      The collage icons need no work — `data/icons-raw.json` is
      byte-identical to the archive's `_data/icons.json`.
- [ ] **Retire `MoonLogo`; the `bq` monogram is the mark.** Decided
      2026-08-27 — see "The brand mark" in ARCHITECTURE.md for the palette
      breakdown and the two sub-decisions (vector source; field dropped).
      - Replace at all three call sites: `components/site-nav.tsx:21` (h-8),
        `components/site-footer.tsx:19` (h-8), `app/page.tsx:167` (h-16).
      - Delete `components/moon-logo.tsx`.
      - **Keep the `--moon` CSS token** — `ThemeToggle` uses `bg-moon/10` and
        it has nothing to do with the logo.
      - **Scope check:** this is about the *logo*. `ThemeToggle`'s lucide
        `Moon` icon means "night mode", not branding, and stays; so does the
        "night owl" voice in the footer copy and the toggle's title.
      - **Vector received** 2026-08-27 and preserved at `docs/brand/` —
        artboard plus current variants split out (`docs/brand/variants/`).
        No longer blocked.
      - Build one `BrandMark` component with a detail prop: `stroke`
        (`currentColor`) at 32px, masked+filled colourway at 64px. One
        geometry, two levels of detail — not two drawings. Construct the
        crescent as an SVG `<mask>` (bowl path fills, wedge path subtracts),
        not by overpainting the wedge/overlap with an opaque colour — see
        "Construction" in ARCHITECTURE.md for why overpaint silently breaks.
      - **Hero colourways — both decided 2026-08-27.** Light:
        `light-gold` (goldenrod crescent, wedge/overlap left as page ground).
        Dark: `dark-crescent` (white crescent, pale-slate letterforms) —
        supersedes the earlier `dark-pale-white-crescent` recommendation,
        same idea, cleaner construction.
      - **Favicon — decided 2026-08-27, and it is *not* the full mark on a
        denim field.** `favicon-moon`: the crescent alone (no stems, no
        wedge outline), white, on `--denim` `rx=27`. Tested at real tab size
        first — the full monogram doesn't survive 16px (its strokes are
        ≈1.2px there), and neither heavier strokes nor a solid silhouette
        fixed it without destroying the letterforms or the crescent notch.
        See "Favicon: a different glyph, not a smaller mark" in
        ARCHITECTURE.md for the two failed attempts and why reduction (not
        compression) is the standard fix.
      - Generate `app/favicon.ico` (multi-size, 16→256) and a 180×180
        `app/apple-icon.png` from `favicon-moon.svg`.
- [ ] None of `sitemap.ts`, `robots.ts`, `not-found.tsx`, `error.tsx`,
      `opengraph-image.tsx` exist. With 199 static pages and a portfolio meant
      to be linked, the sitemap and OG image are the two that earn their keep.
      (`/_not-found` does render — that's Next's default, not a page here.)
- [ ] `app/layout.tsx` still declares `generator: 'v0.app'`.
- [ ] `package.json` still declares `"name": "my-project"`.
- [ ] No lint or test setup. `filterWork`, `collectionLayout`, and
      `getCollectionPiece` are pure and would be cheap to pin down; low
      priority for a personal site, worth it the moment the tag vocabulary in
      §2 changes.

## 7. Dead code and orphaned assets

- [ ] **~15MB of orphaned assets** in `public/`, referenced only by
      `lib/content.ts` or nothing at all: six generated art PNGs
      (`moon-hare`, `heart-portrait`, `fiddle-fig`, `night-window`,
      `storm-landscape`, `terracotta-figure` — 10.9MB together),
      `science/hero.png` (2.2MB), `about/portrait.png` (2.1MB), and the
      `placeholder-*` set. The PNGs are blocked behind §1; `science/hero.png`
      and `about/portrait.png` are already unreferenced by anything.
- [ ] `components/doodle-field.tsx` (72 lines) — imported nowhere, superseded
      by `IconScatterField`.
- [ ] `components/ui/button.tsx` and `components/ui/dialog.tsx` — vendored
      shadcn, imported nowhere. `ImageLightbox` uses `@base-ui/react/dialog`
      directly.
- [ ] `WashiTape` and `PushPin` in `components/collage.tsx`, plus the
      `.washi-tape` block in `app/globals.css` — unused. `StampBadge` is live.

`lib/work.sample.ts` and `SHOW_SAMPLE_WORK` look like more of the same at a
glance — they aren't. Decided to keep both; see ARCHITECTURE.md. Don't sweep
them up here.

## 8. Comments citing a document under a name it never had

**Correction to an earlier version of this file:** there were never two design
documents. `COLLECTION-CARDS.md` has never existed — the six comments below
are misnamed references to `docs/COLLECTION-FORMATS.md`, whose §12h, §12i,
§4c, §4d and §12 all match what the comments claim they say. That file was
written, never committed, and deleted per its own closing instruction when
`2dc8324` shipped.

**It has since been recovered** in full (1,277 lines) from a session
transcript and archived, stamped as historical with a list of where the build
diverged from it, at
[history/2026-08-collection-formats.md](history/2026-08-collection-formats.md).

The comments should still be rewritten — an archive is for derivations, not
for code comments to depend on:

- [ ] `app/globals.css:265` — "see COLLECTION-CARDS.md §12h"
- [ ] `components/work-visuals.tsx:277` — "COLLECTION-CARDS.md §12i"
- [ ] `components/work-visuals.tsx:422` — "COLLECTION-CARDS.md sec12h"
- [ ] `components/work-visuals.tsx:499` — "sec12"
- [ ] `components/work-visuals.tsx:744,746` — "§4c", "§4d"

Each should point at "Collection stack geometry" or the collection-layouts
table in ARCHITECTURE.md, or restate the reason inline.

The wider lesson is recorded as a convention in ARCHITECTURE.md: a design doc
that lives only in a working tree is one `rm` from taking its reasoning with
it, and this one came back by luck. `docs/history/` is where the next one
goes.

## 9. Content still carrying placeholders

- [ ] `eye-studies` — 4 of 8 pieces read "Subject hidden for now. Title coming
      soon.", and all 8 titles are bare numbers (`01`…`08`). The hidden
      subject is deliberate (the guessing game, per the comment), the missing
      titles probably aren't.
- [ ] 34 pieces carry `text` with no `preview`, so their card faces fall back
      to the full `text` inside an `overflow-hidden` box. Only
      `love-worth-heartbreak` sets previews (all 22). Fine today —
      Mindtober's tercets are short — but ARCHITECTURE's "never clamped"
      promise about `preview` only actually holds for the chapbook.

## 10. Small inconsistencies

- [ ] `night-vignette` is applied to both `<body>` (`app/layout.tsx`) and
      `/about`'s `<section>`, both with `background-attachment: fixed`, so the
      about page paints the vignette twice at double strength.
- [ ] `ChapbookStack`'s card 4 is `aria-hidden="true"` while `CollectionStack`'s
      card 4 deliberately isn't — its comment says the count pill is real
      information. Both carry the same `CollectionMark`; a chapbook's piece
      count is the one hidden from screen readers.
- [ ] `MasonryGrid`'s `useEffect` depends on the `columns` object, which
      callers pass as a fresh literal (`{ lg: 2 }`), so the media-query
      listeners are torn down and re-added on every parent render. Harmless
      now, wrong in principle.
- [ ] `inktober-17`'s `stackAccent: '#ffffff'` is a literal white that doesn't
      respond to theme; against light mode's `--card` (`#f3f4f0`) card 4 nearly
      disappears. Every other `stackAccent` is a mid-tone that survives both
      themes.
- [ ] `AboutTabs` reads the URL hash in a mount effect, so `/about#food`
      renders the `general` tab for one frame before swapping.

## 11. Checked-in agent memory is stale

`.claude/agent-memory/next-steps/project_shape.md` is tracked in git and loaded
by the `next-steps` agent on every run. It stated that `WorkPiece` "has no
`image` field at all" and that every `/work` piece deliberately renders a
tinted swatch instead of real art — both true once, both flatly false now
that `lib/work.ts` carries `image`/`imageAspect`/`thumb` and `public/art` is
52MB of real work. Corrected in this pass; nothing left to do on that file.

- [ ] `review_2026-08-25.md` item 5 rests on the same false premise. Its other
      items (dead about links, stale art-tab copy, bare Instagram link,
      `ignoreBuildErrors`, orphaned portrait/hero PNGs, `doodle-field`, missing
      sitemap/robots/OG, no lint or tests) all still hold and are carried into
      §3, §6, and §7 above. Prune the file to just item 5's correction, or
      delete it now that this TODO covers it.
