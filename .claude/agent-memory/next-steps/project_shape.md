---
name: project-shape
description: High-level architecture of the beckqing personal site so future reviews don't need to re-derive route/component structure from scratch
metadata:
  type: project
---

**Read `docs/ARCHITECTURE.md` and `docs/TODO.md` first — they are maintained
in-repo and are more current than this file.** This is only a pointer.

Next.js 16.3 (App Router, Turbopack), React 19, Tailwind v4, TypeScript, pnpm.
Originally scaffolded by v0.app (`metadata.generator: 'v0.app'` in
app/layout.tsx, and `next.config.mjs` still has v0-style
`typescript.ignoreBuildErrors: true` + `images.unoptimized: true`).

Routes (all present, all have `metadata`/`generateMetadata`):
- `/` — app/page.tsx, hero + discipline panels
- `/about` — app/about/page.tsx, tabbed bio (components/about-tabs.tsx, content in lib/about-content.ts)
- `/work` — app/work/page.tsx, filterable gallery (components/work-gallery.tsx, data in lib/work.ts)
- `/work/[slug]`, `/work/[slug]/[pieceSlug]`, `/work/[slug]/read` — collection,
  piece, and chapbook straight-through routes, all statically generated via
  `generateStaticParams`. 199 static pages at last build.

Content is all hardcoded in `lib/*.ts` (work.ts, content.ts, about-content.ts,
brand-icons.ts) — no CMS, no markdown files. `lib/work.ts` is the single source
of truth for `/work`: 30 top-level items (9 collections, 21 standalone pieces)
and 163 pieces inside collections. `lib/content.ts` ARTWORKS/POEMS/PROJECTS is
fabricated v0 scaffold content and still feeds the homepage only — see TODO §1.

**Correction (2026-08-27):** an earlier version of this file said `WorkPiece`
"has no `image` field at all" and that every `/work` piece deliberately renders
a tinted color swatch. That was true before the art import and is now false.
`WorkPiece` carries `image`, `imageAspect`, and `thumb`; `public/art` is 52MB
of real work; `WorkPlaceholder` renders the real image when there is one and
falls back to a tinted panel only when there isn't. Do not re-derive
recommendations from the old claim.

No test runner and no eslint config. See `docs/TODO.md` for the live open-work
list — it supersedes `review_2026-08-25.md`.

[[review_2026-08-25]]
