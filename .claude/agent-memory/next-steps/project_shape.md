---
name: project-shape
description: High-level architecture of the beckqing personal site so future reviews don't need to re-derive route/component structure from scratch
metadata:
  type: project
---

Next.js 16 (App Router), React 19, Tailwind v4, TypeScript, pnpm. Originally scaffolded by v0.app (`metadata.generator: 'v0.app'` in app/layout.tsx, and `next.config.mjs` still has v0-style `typescript.ignoreBuildErrors: true` + `images.unoptimized: true`).

Routes (all present, all have `metadata`/`generateMetadata`):
- `/` — app/page.tsx, hero + discipline panels
- `/about` — app/about/page.tsx, tabbed bio (components/about-tabs.tsx, content in lib/about-content.ts)
- `/work` — app/work/page.tsx, filterable gallery (components/work-gallery.tsx, data in lib/work.ts)
- `/work/[slug]` and `/work/[slug]/[pieceSlug]` — collection/piece detail pages, both statically generated via generateStaticParams

Content is all hardcoded in `lib/*.ts` (work.ts, content.ts, about-content.ts, brand-icons.ts) — no CMS, no markdown files. `lib/work.ts` WORK array is the single source of truth for the /work section; `lib/content.ts` ARTWORKS/POEMS/PROJECTS feed the homepage only.

Design intent (documented in code comments, not a bug): `components/work-visuals.tsx` `WorkPlaceholder` deliberately renders a tinted color-swatch instead of a real image for every /work piece — comment says "no fabricated images, just a tinted panel." Real photographed/painted art assets *do* exist in `public/art/*.png` and are used only on the homepage via `lib/content.ts` ARTWORKS, not wired into `lib/work.ts`/WorkPiece (which has no `image` field at all).

No test runner, no eslint config, no sitemap/robots/opengraph-image routes at the project root as of this review.

[[review_2026-08-25]]
