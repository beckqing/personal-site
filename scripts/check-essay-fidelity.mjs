#!/usr/bin/env node
// Verifies that a restored essay's prose matches its archive source word for
// word. Node only, no dependencies, not wired into the build.
//
//   node scripts/check-essay-fidelity.mjs --archive ../archived-personal-site
//
// Algorithm, per essay:
//   1. Read the archive .md, strip YAML front matter, and the repo .mdx.
//   2. From both, strip all markup — HTML/JSX tags, Markdown link syntax
//      (keeping the link text), heading markers, list markers, blockquote
//      markers, emphasis markers.
//   3. Normalise: collapse all whitespace runs to a single space, trim.
//   4. Split into words and diff. Report the first 20 differing runs with
//      context.
//   5. Exit non-zero on any difference outside the allowlist.
//
// Allowlist (applied as skips, not as text substitutions):
//   - Text inside omitted image placeholders (`[ ... ]` rows, listed per
//     essay below) — the restored .mdx legitimately drops these entirely.
//   - The `→` arrows that show up if this script is run against the
//     *pre-restoration* flattened `writeup` strings in lib/work.ts, rather
//     than the restored .mdx files. That comparison is expected to fail
//     loudly (that failure is the whole reason this workstream exists) —
//     this script only ever compares the archive against content/essays/.
//
// Not allowlisted, and not a functional skip: `note-systems`' three
// sections (ANALOG / DIGITAL TOOLS / THE GOAL) are `#` (h1) in the archive
// and render as h2 here, since the page's own <h1> is the piece title. That
// change is invisible to this script — heading markers are stripped before
// comparison — so it needs no entry below, just this note.

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

const args = process.argv.slice(2)
const archiveFlagIndex = args.indexOf('--archive')
if (archiveFlagIndex === -1 || !args[archiveFlagIndex + 1]) {
  console.error('Usage: node scripts/check-essay-fidelity.mjs --archive <path-to-archived-personal-site>')
  process.exit(1)
}
const ARCHIVE_ROOT = resolve(process.cwd(), args[archiveFlagIndex + 1])

/**
 * Per essay: the archive post filename, the restored .mdx filename, and any
 * archive-only text this script can't expect to see on the restored side —
 * either a `[ ... ]` placeholder row whose image never existed and so was
 * omitted (see TODO §9.2), or one whose image DOES exist and was restored as
 * a <PieceLink>, whose rendered title/caption text this script can't see
 * (JSX attributes are stripped, not compared — see the tag-stripping note
 * below). Both kinds are stripped from the archive side before comparison.
 */
const ESSAYS = [
  {
    slug: 'chinese-emoji-poetry',
    archive: 'chinese-emoji-poetry.md',
    mdx: 'chinese-emoji-poetry.mdx',
    archiveOnlyText: [],
  },
  {
    slug: 'first-art-fair',
    archive: 'first-art-fair.md',
    mdx: 'first-art-fair.mdx',
    archiveOnlyText: [
      // Restored as <PieceLink> — title/caption live in JSX attributes.
      '[ mother earth ]',
      '[ fire protection ]',
      // Omitted entirely: no surviving asset (see TODO §9.2).
      '[ when a woman ]',
      '[ photos of setup sketch and practice ]',
      '[ photos of actual setup ]',
      '[ photos of my sketched setup ]',
      '[ photos of my setup ]',
      '[ flyer contest]',
      'My submission for the flyer contest.',
    ],
  },
  {
    slug: 'note-systems',
    archive: 'note-systems.md',
    mdx: 'note-systems.mdx',
    archiveOnlyText: [],
  },
]

function stripFrontMatter(text) {
  return text.replace(/^---\n[\s\S]*?\n---\n/, '')
}

function stripPlaceholders(text, placeholders) {
  let out = text
  for (const p of placeholders) out = out.split(p).join(' ')
  return out
}

/**
 * Strip markup so what's left is prose only: HTML/JSX tags, Markdown link
 * syntax (keeping the link text), heading markers, list markers, blockquote
 * markers, emphasis markers, MDX import lines, and code fence-free since
 * none of these essays use code fences.
 */
function stripMarkup(text) {
  let out = text

  // MDX import lines (restored side only).
  out = out.replace(/^import .+$/gm, ' ')

  // A few components carry real restored prose in their JSX attributes
  // rather than in children — pull it back into the word stream before the
  // generic tag stripper below discards it along with the markup.
  out = out.replace(/<MarketHeader\s+name="([^"]*)"\s+when="([^"]*)"\s*\/>/g, '$1 $2')
  out = out.replace(/<Item\s+emoji="([^"]*)"\s+label="([^"]*)"\s*\/?>/g, '$1 $2 ')
  out = out.replace(/<FigureRow\s+caption="([^"]*)"\s*>/g, '$1')

  // Remaining HTML/JSX tags. Stripped to nothing (not a space): tags
  // routinely sit flush against punctuation with no surrounding whitespace
  // (e.g. `</a>.`), and inserting a space there would read as a false
  // difference against the markdown-link equivalent.
  out = out.replace(/<\/?[a-zA-Z][^>]*>/g, '')

  // Markdown link syntax, keeping the link text: [text](url) -> text
  out = out.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

  // Heading markers: leading #'s (and archive's ##### inside blockquotes).
  out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '')

  // Blockquote markers.
  out = out.replace(/^\s*>\s?/gm, '')

  // List markers: -, *, + at line start, and 01: / 02: style enumerations
  // stay as-is (they're prose, not list syntax).
  out = out.replace(/^\s*[-*+]\s+/gm, '')

  // Emphasis markers: *text*, _text_, **text**, __text__.
  out = out.replace(/(\*{1,2}|_{1,2})([^*_]+)\1/g, '$2')

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
      if (!current) current = { archiveStart: i, archive: [], mdxStart: j, mdx: [] }
      current.archive.push(a[i])
      i++
    } else {
      if (!current) current = { archiveStart: i, archive: [], mdxStart: j, mdx: [] }
      current.mdx.push(b[j])
      j++
    }
  }
  if (i < n) {
    if (!current) current = { archiveStart: i, archive: [], mdxStart: j, mdx: [] }
    while (i < n) current.archive.push(a[i++])
  }
  if (j < m) {
    if (!current) current = { archiveStart: i, archive: [], mdxStart: j, mdx: [] }
    while (j < m) current.mdx.push(b[j++])
  }
  flush()
  return runs
}

function context(arr, index, span = 4) {
  return arr.slice(Math.max(0, index - span), index).join(' ')
}

let anyFailed = false

for (const essay of ESSAYS) {
  const archivePath = join(ARCHIVE_ROOT, 'posts', essay.archive)
  const mdxPath = join(REPO_ROOT, 'content/essays', essay.mdx)

  const archiveRaw = stripFrontMatter(readFileSync(archivePath, 'utf8'))
  const mdxRaw = readFileSync(mdxPath, 'utf8')

  const archiveWords = words(stripMarkup(stripPlaceholders(archiveRaw, essay.archiveOnlyText)))
  const mdxWords = words(stripMarkup(mdxRaw))

  const runs = diffWords(archiveWords, mdxWords)

  if (runs.length === 0) {
    console.log(`✓ ${essay.slug} — prose matches the archive word for word`)
    continue
  }

  anyFailed = true
  console.log(`✗ ${essay.slug} — ${runs.length} differing run(s)`)
  for (const run of runs.slice(0, 20)) {
    console.log(`  … ${context(archiveWords, run.archiveStart)}`)
    if (run.archive.length) console.log(`    archive: ${run.archive.join(' ')}`)
    if (run.mdx.length) console.log(`    mdx:     ${run.mdx.join(' ')}`)
  }
  if (runs.length > 20) console.log(`  (${runs.length - 20} more run(s) not shown)`)
}

process.exit(anyFailed ? 1 : 0)
