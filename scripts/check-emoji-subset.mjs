#!/usr/bin/env node
// Verifies that every emoji used in an essay's <Item emoji="…"> is covered by
// the subsetted "Noto Emoji Subset" webfont (app/globals.css). Node only, no
// dependencies, not wired into the build — same pattern as
// check-essay-fidelity.mjs.
//
//   node scripts/check-emoji-subset.mjs
//
// The font is a deliberately narrow subset (19 glyphs, 7KB) built for the
// exact codepoints `first-art-fair.mdx` uses today — see "Emoji: a subsetted
// monochrome web font" in docs/ARCHITECTURE.md for how it was built and how
// to add a codepoint. Nothing re-derives that subset automatically, so a
// future essay reusing <EmojiList> with a new emoji would silently fall back
// to the platform's own colour emoji font instead of failing loudly. This
// script is the loud failure: it reads the font's declared `unicode-range`
// as the source of truth and diffs it against what the content actually uses.

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

function coveredCodepoints() {
  const css = readFileSync(join(REPO_ROOT, 'app/globals.css'), 'utf8')
  const fontFaceMatch = css.match(/@font-face\s*{\s*font-family:\s*'Noto Emoji Subset';[\s\S]*?}/)
  if (!fontFaceMatch) {
    throw new Error("Couldn't find the 'Noto Emoji Subset' @font-face block in app/globals.css")
  }
  const rangeMatch = fontFaceMatch[0].match(/unicode-range:\s*([^;]+);/)
  if (!rangeMatch) throw new Error('Found the @font-face block but no unicode-range inside it')
  return new Set(
    rangeMatch[1]
      .split(',')
      .map((s) => s.trim())
      .map((s) => parseInt(s.replace('U+', ''), 16)),
  )
}

// Every codepoint an <Item emoji="…"> attribute contains, per essay file.
function emojiUsage() {
  const dir = join(REPO_ROOT, 'content/essays')
  const usage = new Map() // codepoint -> Set<filename>
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const src = readFileSync(join(dir, file), 'utf8')
    for (const m of src.matchAll(/emoji="([^"]+)"/g)) {
      for (const ch of Array.from(m[1])) {
        const cp = ch.codePointAt(0)
        if (!usage.has(cp)) usage.set(cp, new Set())
        usage.get(cp).add(file)
      }
    }
  }
  return usage
}

const covered = coveredCodepoints()
const usage = emojiUsage()

const missing = [...usage.entries()].filter(([cp]) => !covered.has(cp))

if (missing.length === 0) {
  console.log(`OK — every emoji in content/essays/*.mdx is covered by the ${covered.size}-glyph subset font.`)
  process.exit(0)
}

console.error(`${missing.length} emoji codepoint(s) used in content/essays/*.mdx are NOT in the subset font:\n`)
for (const [cp, files] of missing) {
  const char = String.fromCodePoint(cp)
  console.error(`  ${char}  U+${cp.toString(16).toUpperCase()}  used in ${[...files].join(', ')}`)
}
console.error(
  '\nRegenerate the subset font to include these codepoints and add them to the\n' +
    "unicode-range in app/globals.css's 'Noto Emoji Subset' @font-face block —\n" +
    'see "Emoji: a subsetted monochrome web font" in docs/ARCHITECTURE.md.',
)
process.exit(1)
