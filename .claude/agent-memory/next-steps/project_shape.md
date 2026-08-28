---
name: project-shape
description: High-level architecture of the beckqing personal site so future reviews don't need to re-derive route/component structure from scratch
metadata:
  type: project
---

**Read `docs/ARCHITECTURE.md` and `docs/TODO.md` first — they are maintained
in-repo and are more current than this file.** This is only a pointer.

Next.js 16.3 (App Router, Turbopack), React 19, Tailwind v4, TypeScript, pnpm.
Originally scaffolded by v0.app; the scaffold leftovers (`metadata.generator`,
`typescript.ignoreBuildErrors`, `images.unoptimized`, the v0 favicon set,
`package.json`'s `"my-project"` name) were all cleared out 2026-08-27 along
with the fabricated homepage content and the retired MoonLogo — see TODO.md's
git history around that date if you need the "why", not this file.

Routes (all present, all have `metadata`/`generateMetadata`):
- `/` — app/page.tsx, hero (BrandMark, components/brand-mark.tsx) + discipline panels
- `/about` — app/about/page.tsx, tabbed bio (components/about-tabs.tsx, content in lib/about-content.ts)
- `/work` — app/work/page.tsx, filterable gallery (components/work-gallery.tsx, data in lib/work.ts)
- `/work/[slug]`, `/work/[slug]/[pieceSlug]`, `/work/[slug]/read` — collection,
  piece, and chapbook straight-through routes, all statically generated via
  `generateStaticParams`.
- `sitemap.ts`, `opengraph-image.tsx` — generated; `app/favicon.ico` and
  `app/apple-icon.png` are static files rendered from `docs/brand/`.
203 static pages at last build.

Content is all hardcoded in `lib/*.ts` (work.ts, content.ts, about-content.ts,
brand-icons.ts) — no CMS, no markdown files. `lib/work.ts` is the single
source of truth for `/work`: 30 top-level items (9 collections, 21 standalone
pieces) and 163 pieces inside collections. `lib/content.ts` is now just
`PROJECTS` (the fabricated science stat) — `ARTWORKS`/`POEMS`/`ESSAYS` were
deleted once the homepage's art and writing panels moved to real
`lib/work.ts` content; `PROJECTS` stays until Beck adds real science work
(see TODO.md §2, still open — the one open item this file used to track that
still needs Beck, not code).

No test runner and no eslint config (deferred — low priority for a personal
site). See `docs/TODO.md` for the live open-work list.
