import type { IconCategory } from '@/lib/brand-icons'

export type NowEntry = {
  /** `YYYY-MM`. When it was true — see the now-page spec, §3. */
  since: string
  /** Everything after the line's prefix, verbatim. */
  text: string
}

/** Hero line 1. Permanent, undated, not an entry.
 *  Carries the `IconCategory` because the hero binds each word to the icon
 *  collage and the mapping is not derivable — `science` → `sci` is an
 *  abbreviation, not a prefix rule. */
export const STUDENT_OF = [
  { word: 'art', category: 'art' },
  { word: 'science', category: 'sci' },
  { word: 'humanity', category: 'hu' },
] as const satisfies readonly { word: string; category: IconCategory }[]

/** Constant across every entry; joined to `text` with one space. */
export const NOW_PREFIX = 'currently'

/** Authored oldest-first. Reversed at render. */
export const NOW_ENTRIES: NowEntry[] = [
  { since: '2022-04', text: 'gaining experience in programming, rock climbing, and DNA isolation' },
  { since: '2022-06', text: 'gaining experience in rock climbing, jiu jitsu, and partner dancing' },
  { since: '2023-01', text: 'gaining experience in programming, partner acrobatics, and puzzle hunts' },
  { since: '2023-06', text: 'gaining experience in protein screening, bike commuting, and bay area geography' },
  { since: '2024-03', text: 'gaining experience in many other ways to live, coliving, and group travel' },
  { since: '2024-08', text: 'gaining experience in solo travel, the Chinese vegan scene, and humid summer days' },
  { since: '2024-11', text: 'gaining experience in sign painting, partner acrobatics, and embodying my inner raccoon' },
  { since: '2025-11', text: 'gaining experience in building festival art, relocating a group house, and kitten parenthood' },
  { since: '2026-04', text: 'gaining experience in routine, quantum tag, and making pizza' },
  { since: '2026-08', text: 'focused on home improvement, vibe coding, and interactive art' },
]
