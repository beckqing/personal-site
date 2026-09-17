#!/usr/bin/env node
// Fails on a <p> in MDX whose content starts on a following line — see
// docs/specs/2026-09-panels-and-rail.md §5.2. MDX 3 paragraph-wraps a JSX
// element's block children (children sitting on their own line), and
// essayComponents.p turns that wrap into a real <p> — nesting one <p>
// inside another, which is invalid HTML and takes the whole page's
// hydration down with it (see the same spec's §1.2). Node only, no
// dependencies, not wired into the build.
//
//   node scripts/check-mdx-paragraphs.mjs
//
// This is the exact shape of the bug, not a general JSX linter: any line
// opening a <p> tag whose closing `>` ends the line is flagged, since that's
// precisely the pattern that puts the element's text content on its own
// line. Applies to every MDX body on the site, not just decks.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const CONTENT_DIR = join(REPO_ROOT, 'content')

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) out.push(...walk(full))
    else if (entry.endsWith('.mdx')) out.push(full)
  }
  return out
}

const OPEN_P_AT_EOL = /<p(?:\s[^>]*)?>\s*$/

const files = walk(CONTENT_DIR)
let failures = 0

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (OPEN_P_AT_EOL.test(line)) {
      failures++
      console.log(`✗ ${relative(REPO_ROOT, file)}:${i + 1} — <p> opens with its content on a following line`)
      console.log(`    ${line.trim()}`)
    }
  })
}

if (failures === 0) {
  console.log(`✓ ${files.length} MDX file(s) checked — no <p> wraps its content onto a following line`)
  process.exit(0)
}

console.log(`✗ ${failures} offending <p> tag(s) found`)
process.exit(1)
