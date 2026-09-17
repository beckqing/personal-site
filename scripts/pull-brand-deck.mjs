#!/usr/bin/env node
// Pulls the personal branding deck's text out of Figma, verbatim, so the
// deck's MDX can be transcribed from real strings instead of guessed off a
// thumbnail. Node only, no dependencies, not wired into the build.
//
//   node scripts/pull-brand-deck.mjs
//   node scripts/pull-brand-deck.mjs --images 210:2,210:5
//
// Without --images: reads FIGMA_TOKEN from .env.local, fetches the file,
// walks the canvas's top-level FRAME nodes (sorted by
// absoluteBoundingBox.y — the deck is one vertical column, so geometry is
// reading order, not document order), collects every TEXT node's
// characters per frame (ordered by (y, x) of its own bounding box), and
// writes docs/brand/deck-source.json as committed source.
//
// With --images <id,id,...>: fetches 2x PNG renders for exactly those node
// ids (see spec §9 — almost nothing needs exporting) into
// scratch/brand-deck-images/, for manual curation into public/brand/deck/.
//
// The token is read from .env.local only, never logged, and never written
// into deck-source.json.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

const FILE_KEY = 'cZbOK8t70Q8328FzE5xtgH'

function readFigmaToken() {
  const envPath = join(REPO_ROOT, '.env.local')
  let contents
  try {
    contents = readFileSync(envPath, 'utf8')
  } catch {
    console.error('.env.local not found. See docs/specs/2026-09-branding-deck.md §10.1.')
    process.exit(1)
  }
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    if (key === 'FIGMA_TOKEN') {
      const value = trimmed.slice(eq + 1).trim()
      return value || null
    }
  }
  return null
}

async function figmaGet(path, token) {
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { 'X-Figma-Token': token },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Figma API ${path} → ${res.status}: ${body}`)
  }
  return res.json()
}

function collectText(node, out) {
  if (node.type === 'TEXT' && typeof node.characters === 'string') {
    const box = node.absoluteBoundingBox
    out.push({
      y: box ? box.y : 0,
      x: box ? box.x : 0,
      characters: node.characters,
    })
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectText(child, out)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const imagesFlagIndex = args.indexOf('--images')

  const token = readFigmaToken()
  if (!token) {
    console.error('FIGMA_TOKEN is empty in .env.local. Needs a Figma personal access token with file_content:read.')
    process.exit(1)
  }

  if (imagesFlagIndex !== -1) {
    const ids = args[imagesFlagIndex + 1]
    if (!ids) {
      console.error('Usage: node scripts/pull-brand-deck.mjs --images <id,id,...>')
      process.exit(1)
    }
    const data = await figmaGet(
      `/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=2`,
      token,
    )
    if (data.err) {
      console.error(`Figma image export error: ${data.err}`)
      process.exit(1)
    }
    const outDir = join(REPO_ROOT, 'scratch', 'brand-deck-images')
    mkdirSync(outDir, { recursive: true })
    for (const [id, url] of Object.entries(data.images)) {
      if (!url) {
        console.warn(`No image URL returned for node ${id}`)
        continue
      }
      const imgRes = await fetch(url)
      const buf = Buffer.from(await imgRes.arrayBuffer())
      const filename = `${id.replace(/[:;]/g, '-')}.png`
      writeFileSync(join(outDir, filename), buf)
      console.log(`Wrote ${join('scratch', 'brand-deck-images', filename)}`)
    }
    return
  }

  const file = await figmaGet(`/files/${FILE_KEY}`, token)
  const page = file.document.children[0]
  if (!page) {
    console.error('File has no pages.')
    process.exit(1)
  }

  const frames = (page.children ?? [])
    .filter((node) => node.type === 'FRAME' && node.visible !== false)
    .sort((a, b) => {
      const ay = a.absoluteBoundingBox ? a.absoluteBoundingBox.y : 0
      const by = b.absoluteBoundingBox ? b.absoluteBoundingBox.y : 0
      return ay - by
    })

  const slides = frames.map((frame, index) => {
    const textNodes = []
    collectText(frame, textNodes)
    textNodes.sort((a, b) => (a.y - b.y) || (a.x - b.x))
    return {
      index,
      name: frame.name,
      id: frame.id,
      text: textNodes.map((t) => t.characters),
    }
  })

  const outPath = join(REPO_ROOT, 'docs', 'brand', 'deck-source.json')
  writeFileSync(outPath, JSON.stringify(slides, null, 2) + '\n')
  console.log(`Wrote ${slides.length} frames to docs/brand/deck-source.json`)
  for (const slide of slides) {
    console.log(`  [${slide.index}] ${slide.name} (${slide.id}) — ${slide.text.length} text node(s)`)
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
