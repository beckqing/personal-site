# TODO

Open work only. Design decisions, structure, and the record of what's already
built live in [ARCHITECTURE.md](ARCHITECTURE.md).

Last reconciled against the tree 2026-08-27.
`tsc --noEmit` clean; `next build` clean, 199 static pages.

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
written, not derived. There's no real poem or research project in
`lib/work.ts` to promote into those two panels.

- [ ] **Beck:** the featured poem (or a different treatment for the writing
      panel), and the science panel's real content — a project, a stat, or a
      different framing entirely.
- [ ] Point the art panel at a real piece from `lib/work.ts`. Mechanically
      derivable; can land ahead of the copy.
- [ ] Delete `lib/content.ts` once nothing imports it. `ESSAYS` is already
      exported-but-unused and can go regardless.
- [ ] Drop the orphaned scaffold art it references (see §6).

## 2. Placeholder links

- [ ] **13 `href: '#'` links** in `lib/about-content.ts` — every social on
      every about tab (instagram, twitter, youtube, github, codepen,
      deviantart, artfight, toyhouse, the blog). Two are deliberately marked
      `soon: true` (behance, dribbble); the other eleven are just unfilled.
- [ ] `components/site-footer.tsx` — `mailto:hello@beckqing.com` (confirm this
      address is real) and a bare `https://instagram.com` pointing at the site
      root rather than a profile.

## 3. Media loose ends

None user-visible. These are places where the code asserts something that
isn't true anymore.

- [ ] The `object-contain` comment in `components/media-player.tsx` still
      cites Verdant's poster/video aspect mismatch as its reason; that
      mismatch no longer exists. The rule is worth keeping as a general guard
      — fix the justification.
- [ ] Two non-null assertions (`piece.animationSrc!`, `piece.speedpaintSrc!`),
      both in `PieceMedia`, both guarded a few lines above. A typed narrowing
      helper would remove them. Not load-bearing.
- [ ] The two near-identical Presidential Pardon sources (reel 39.12s vs.
      carousel-embedded 39.00s) were never diffed. The reel was used.

## 4. Build configuration

- [ ] `next.config.mjs` sets `typescript.ignoreBuildErrors: true`. The tree
      typechecks clean, so this buys nothing and hides the next regression.
      Remove it.
- [ ] `images.unoptimized: true` on a site whose `public/` is 56MB of artwork.
      May be right for the deploy target, but it should be a decision rather
      than a scaffold default.

## 5. Missing route-level files

- [ ] None of `sitemap.ts`, `robots.ts`, `not-found.tsx`, `error.tsx`,
      `opengraph-image.tsx` exist. With 199 static pages and a portfolio meant
      to be linked, the sitemap and OG image are the two that earn their keep.
- [ ] `app/layout.tsx` still declares `generator: 'v0.app'`.

## 6. Scaffold cleanup

- [ ] **~15MB of orphaned assets** in `public/`, referenced only by
      `lib/content.ts` or nothing at all: six generated art PNGs
      (`moon-hare`, `heart-portrait`, `fiddle-fig`, `night-window`,
      `storm-landscape`, `terracotta-figure` — 10.9MB together),
      `science/hero.png` (2.2MB), `about/portrait.png` (2.1MB), and the
      `placeholder-*` set. Blocked behind §1.
- [ ] `lib/work.sample.ts` (355 lines) and the now-`false` `SHOW_SAMPLE_WORK`
      flag are still in the import graph. Keep if genuinely useful for testing
      filters against a bigger dataset; otherwise delete both.
