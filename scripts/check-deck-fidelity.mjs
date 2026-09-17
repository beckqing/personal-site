#!/usr/bin/env node
// Verifies that content/decks/personal-branding.mdx's copy matches
// docs/brand/deck-source.json word for word. Node only, no dependencies,
// not wired into the build. Models scripts/check-essay-fidelity.mjs.
//
//   node scripts/check-deck-fidelity.mjs
//
// Algorithm:
//   1. Flatten every frame's `text` array in docs/brand/deck-source.json,
//      in frame order, into one word stream.
//   2. Read content/decks/personal-branding.mdx, pull verbatim copy out of
//      the few JSX attributes that carry it (Panel's `title`, ProfilePicture's
//      `title`/`caption`, TypeSample's `name`/`style`/`use`/`caption`) back
//      into the word stream, then strip all remaining markup.
//   3. Normalise whitespace, word-diff, report the first 20 differing runs.
//   4. Exit non-zero on any difference outside the allowlists below.
//
// Allowlists (applied as skips, not as text substitutions):
//   - DECK_ONLY_TEXT: text present in the pull but not transcribed — the
//     palette's own swatch name/hex pairs, which BrandPalette.tsx renders
//     from a constant in lib/brand-palette.ts rather than from transcribed
//     text (§8.1); the typography slide's alphabet-row samples, which
//     TypeSample renders itself, not sourced text; and the profile-pictures
//     slide's rotated, filename-mimicking decoration, which is genuinely
//     rendered (docs/specs/2026-09-deck-visual-fidelity.md §6.8) but as an
//     internal constant in profile-picture-grid.tsx rather than transcribed
//     MDX text. The "alternate palettes" chip label and the palette slide's
//     colour-blind caption used to be here too (allowlisted as "un-exported"
//     graphics); both are now built (§6.4, §8.1) and transcribed like
//     everything else, so both came out.
//   - A `<StageReflow>` block (§11's below-640px fallback) is dropped whole
//     before either side is compared — it's a hand-authored *duplicate* of
//     the same slide's copy, not new copy to verify.
//   - MDX_ONLY_TEXT: text in the MDX with no counterpart in the pull — the
//     "profile pictures" slide title, synthesized from the frame name
//     since that slide carries no heading text node of its own (§11.2 was a
//     guess; this slide wasn't anticipated at all — see the branding-deck
//     session's implementation notes).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

const DECK_SOURCE_PATH = join(REPO_ROOT, 'docs/brand/deck-source.json')
const MDX_PATH = join(REPO_ROOT, 'content/decks/personal-branding.mdx')

const DECK_ONLY_TEXT = [
  // Palette slide: the swatches are BrandPalette.tsx's own constant
  // (lib/brand-palette.ts), not text transcribed into the MDX.
  'white\n#FFFFFF',
  'summer storm\n#69635E',
  'midnight\n#080B24',
  'terra cotta\n#8C3623',
  'pumpkin pie\n#BF712C',
  'satin nickel\n#A79F99',
  'indigo\n#0C3559',
  'goldenrod\n#D9AA52',
  'pale slate\n#CED2CD',
  'denim\n#305789',
  'emerald\n#4BA661',
  // Typography slide: TypeSample renders its own alphabet sample, not text
  // pulled from the deck.
  'ABCDEFGHIKLMNOPQRSTUVWXYZ\nABCDEFGHIKLMNOPQRSTUVWXYZ',
  'ABCDEFGHIKLMNOPQRSTUVWXYZ\nABCDEFGHIKLMNOPQRSTUVWXYZ\n1234567890',
  // Profile pictures slide's rotated, filename-mimicking decoration — not
  // authored content.
  'profile_picture.jpg_picture.jpg profil ',
]

const MDX_ONLY_TEXT = [
  // Synthesized: this slide has no heading text node of its own in the pull.
  'profile pictures',
  // Synthesized: using the closing slide's own bookended tagline as its
  // title would double-count that text in the word stream (it's rendered
  // in the body too) — see docs/specs/2026-09-panels-and-rail.md §5.3.
  'closing',
]

function stripPlaceholders(text, placeholders) {
  let out = text
  for (const p of placeholders) out = out.split(p).join(' ')
  return out
}

/**
 * Drops whole nodes that exactly match an allowlisted string, before
 * flattening. Exact per-node matching (not substring removal on the joined
 * blob) so a short allowlisted phrase — "alternate palettes", say — can
 * never eat a real occurrence of those words inside an unrelated sentence.
 */
function dropAllowlistedNodes(slideTexts, placeholders) {
  const allowed = new Set(placeholders)
  return slideTexts.filter((t) => !allowed.has(t))
}

/**
 * Drops `<StageReflow>…</StageReflow>` blocks whole, before any other
 * processing. A `layout="stage"` panel's reflow is a hand-authored
 * *duplicate* of the same slide's copy for below 640px
 * (docs/specs/2026-09-deck-visual-fidelity.md §11) — "same content, same
 * order, same copy" is the rule, on purpose. Diffing it too would just
 * double-count every stage paragraph against a single occurrence in
 * deck-source.json. Non-greedy and un-nested (no `<StageReflow>` ever
 * contains another), so first-open-to-first-close is correct.
 */
function dropReflowBlocks(text) {
  return text.replace(/<StageReflow>[\s\S]*?<\/StageReflow>/g, ' ')
}

/** Pull verbatim deck text out of the few attributes that carry it, before the generic tag stripper below discards it with the markup. */
function pullAttributeText(text) {
  return text.replace(/<[A-Za-z][^>]*>/g, (tag) => {
    const values = []
    const attrRe = /\b(?:title|caption|name|style|use)="([^"]*)"/g
    let m
    while ((m = attrRe.exec(tag))) values.push(m[1])
    return values.length ? ` ${values.join(' ')} ` : tag
  })
}

function stripMarkup(text) {
  let out = dropReflowBlocks(text)
  out = pullAttributeText(out)
  out = out.replace(/^import .+$/gm, ' ')
  out = out.replace(/<\/?[a-zA-Z][^>]*>/g, '')
  return out
}

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function words(text) {
  return normalize(text).split(' ').filter(Boolean)
}

/** Longest common subsequence-based word diff, reporting differing runs. */
function diffWords(a, b) {
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const runs = []
  let i = 0
  let j = 0
  let current = null
  function flush() {
    if (current) runs.push(current)
    current = null
  }
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      flush()
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      if (!current) current = { deckStart: i, deck: [], mdxStart: j, mdx: [] }
      current.deck.push(a[i])
      i++
    } else {
      if (!current) current = { deckStart: i, deck: [], mdxStart: j, mdx: [] }
      current.mdx.push(b[j])
      j++
    }
  }
  if (i < n) {
    if (!current) current = { deckStart: i, deck: [], mdxStart: j, mdx: [] }
    while (i < n) current.deck.push(a[i++])
  }
  if (j < m) {
    if (!current) current = { deckStart: i, deck: [], mdxStart: j, mdx: [] }
    while (j < m) current.mdx.push(b[j++])
  }
  flush()
  return runs
}

function context(arr, index, span = 4) {
  return arr.slice(Math.max(0, index - span), index).join(' ')
}

const slides = JSON.parse(readFileSync(DECK_SOURCE_PATH, 'utf8'))
const deckText = slides.flatMap((s) => dropAllowlistedNodes(s.text, DECK_ONLY_TEXT)).join(' ')
const mdxRaw = readFileSync(MDX_PATH, 'utf8')

const deckWords = words(deckText)
const mdxWords = words(stripPlaceholders(stripMarkup(mdxRaw), MDX_ONLY_TEXT))

const runs = diffWords(deckWords, mdxWords)

if (runs.length === 0) {
  console.log('✓ personal-branding — deck copy matches docs/brand/deck-source.json word for word')
  process.exit(0)
}

console.log(`✗ personal-branding — ${runs.length} differing run(s)`)
for (const run of runs.slice(0, 20)) {
  console.log(`  … ${context(deckWords, run.deckStart)}`)
  if (run.deck.length) console.log(`    deck-source: ${run.deck.join(' ')}`)
  if (run.mdx.length) console.log(`    mdx:         ${run.mdx.join(' ')}`)
}
if (runs.length > 20) console.log(`  (${runs.length - 20} more run(s) not shown)`)
process.exit(1)
