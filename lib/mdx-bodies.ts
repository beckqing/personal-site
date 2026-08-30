// SERVER ONLY. Importing this from a 'use client' module pulls the whole MDX
// runtime into the browser bundle. Only app/work/[slug]/page.tsx and
// app/work/[slug]/[pieceSlug]/page.tsx may import it.
//
// Two content directories resolve through this one map: content/essays/ for
// essays, content/code-demos/ for a code demo's write-up. They stay
// separate on disk (an essay is an essay; a code demo's write-up is not) and share
// one map, one slug list, and one build-time assertion.
import type { ComponentType } from 'react'
import ChineseEmojiPoetry from '@/content/essays/chinese-emoji-poetry.mdx'
import FirstArtFair from '@/content/essays/first-art-fair.mdx'
import NoteSystems from '@/content/essays/note-systems.mdx'
import { MDX_BODY_SLUGS, WORK } from '@/lib/work'

const BODIES: Record<string, ComponentType> = {
  'chinese-emoji-poetry': ChineseEmojiPoetry,
  'first-art-fair': FirstArtFair,
  'note-systems': NoteSystems,
}

const bodyKeys = Object.keys(BODIES).sort()
const declaredSlugs = [...MDX_BODY_SLUGS].sort()
if (bodyKeys.join(',') !== declaredSlugs.join(',')) {
  throw new Error(
    `lib/mdx-bodies.ts's BODIES keys (${bodyKeys.join(', ')}) must match lib/work.ts's MDX_BODY_SLUGS (${declaredSlugs.join(', ')})`,
  )
}
for (const slug of MDX_BODY_SLUGS) {
  if (!WORK.some((item) => item.slug === slug)) {
    throw new Error(`MDX_BODY_SLUGS lists "${slug}", but no WorkPiece in lib/work.ts has that slug`)
  }
}

/** The MDX body for a piece, if it has one. Slugs match MDX_BODY_SLUGS in lib/work.ts. */
export function mdxBody(slug: string): ComponentType | undefined {
  return BODIES[slug]
}
