#!/usr/bin/env node
// Pulls the personal branding deck out of Figma. Node only, no dependencies,
// not wired into the build.
//
//   node scripts/pull-brand-deck.mjs
//   node scripts/pull-brand-deck.mjs --geometry [--paths]
//   node scripts/pull-brand-deck.mjs --images 210:2,210:5
//
// Default (no flags): reads FIGMA_TOKEN from .env.local, fetches the file,
// walks the canvas's top-level FRAME nodes (sorted by
// absoluteBoundingBox.y — the deck is one vertical column, so geometry is
// reading order, not document order), collects every TEXT node's
// characters per frame (ordered by (y, x) of its own bounding box), and
// writes docs/brand/deck-source.json as committed source.
//
// --geometry: walks every node in each frame (document order preserved —
// paint order, not (y, x)), capturing type, name, x/y/w/h relative to the
// frame's own origin, rotation, fills (solid as hex, gradients as stops +
// handles), strokes, cornerRadius, opacity, blendMode, visible, and for TEXT
// nodes the full text style plus characters. Writes
// docs/brand/deck-geometry.json, committed beside deck-source.json. See
// spec §9. --paths additionally requests vector path data (geometry=paths),
// needed once for §7.1's icon-slug matching and §7.2's shape-field export.
//
// --images <id,id,...>: fetches 2x PNG renders for exactly those node ids
// into scratch/brand-deck-images/, for manual curation into
// public/brand/deck/.
//
// The token is read from .env.local only, never logged, and never written
// into either output file.

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
    console.error('.env.local not found. See docs/history/2026-09-branding-deck.md §10.1.')
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

function colorToHex({ r, g, b }) {
  const c = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

function extractFill(paint) {
  if (!paint) return null
  if (paint.type === 'SOLID') {
    return { type: 'SOLID', hex: colorToHex(paint.color), alpha: paint.color.a ?? 1, opacity: paint.opacity ?? 1 }
  }
  if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR') {
    return {
      type: paint.type,
      stops: (paint.gradientStops ?? []).map((s) => ({
        position: s.position,
        hex: colorToHex(s.color),
        alpha: s.color.a ?? 1,
      })),
      handles: paint.gradientHandlePositions ?? null,
      opacity: paint.opacity ?? 1,
    }
  }
  return { type: paint.type }
}

function extractGeometryNode(node, originX, originY) {
  const box = node.absoluteBoundingBox
  const out = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible !== false,
  }
  if (box) {
    out.x = box.x - originX
    out.y = box.y - originY
    out.w = box.width
    out.h = box.height
  }
  if (typeof node.rotation === 'number' && node.rotation !== 0) {
    // Figma's REST API reports rotation in degrees, counter-clockwise positive.
    out.rotate = node.rotation
  }
  const fills = Array.isArray(node.fills) ? node.fills.filter((f) => f.visible !== false) : []
  if (fills.length > 0) out.fill = extractFill(fills[fills.length - 1])
  const strokes = Array.isArray(node.strokes) ? node.strokes.filter((s) => s.visible !== false) : []
  if (strokes.length > 0) {
    out.stroke = extractFill(strokes[strokes.length - 1])
    out.strokeWeight = node.strokeWeight ?? null
  }
  if (typeof node.cornerRadius === 'number') out.cornerRadius = node.cornerRadius
  if (typeof node.opacity === 'number' && node.opacity !== 1) out.opacity = node.opacity
  if (node.blendMode && node.blendMode !== 'NORMAL' && node.blendMode !== 'PASS_THROUGH') {
    out.blendMode = node.blendMode
  }
  if (node.type === 'TEXT') {
    out.characters = node.characters ?? ''
    const s = node.style ?? {}
    out.textStyle = {
      fontPostScriptName: s.fontPostScriptName ?? null,
      fontSize: s.fontSize ?? null,
      lineHeightPx: s.lineHeightPx ?? null,
      fontWeight: s.fontWeight ?? null,
      letterSpacing: s.letterSpacing ?? null,
      textAlignHorizontal: s.textAlignHorizontal ?? null,
    }
  }
  if (Array.isArray(node.fillGeometry) && node.fillGeometry.length > 0) {
    out.vectorPaths = node.fillGeometry.map((g) => g.path)
  }
  return out
}

function collectGeometry(node, originX, originY, out) {
  out.push(extractGeometryNode(node, originX, originY))
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectGeometry(child, originX, originY, out)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const imagesFlagIndex = args.indexOf('--images')
  const geometryFlag = args.includes('--geometry')
  const pathsFlag = args.includes('--paths')

  const token = readFigmaToken()
  if (!token) {
    console.error('FIGMA_TOKEN is empty in .env.local. Needs a Figma personal access token with file_content:read.')
    process.exit(1)
  }

  if (geometryFlag) {
    const query = pathsFlag ? '?geometry=paths' : ''
    const file = await figmaGet(`/files/${FILE_KEY}${query}`, token)
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
      const origin = frame.absoluteBoundingBox ?? { x: 0, y: 0 }
      const nodes = []
      for (const child of frame.children ?? []) collectGeometry(child, origin.x, origin.y, nodes)
      const bgFill = Array.isArray(frame.fills) ? frame.fills.find((f) => f.visible !== false) : null
      return {
        index,
        name: frame.name,
        id: frame.id,
        background: bgFill ? extractFill(bgFill).hex : null,
        nodes,
      }
    })

    const outPath = join(REPO_ROOT, 'docs', 'brand', 'deck-geometry.json')
    writeFileSync(
      outPath,
      JSON.stringify(
        {
          pulledAt: new Date().toISOString().slice(0, 10),
          fileKey: FILE_KEY,
          frameSize: { w: 1920, h: 1080 },
          slides,
        },
        null,
        2,
      ) + '\n',
    )
    console.log(`Wrote ${slides.length} frames to docs/brand/deck-geometry.json`)
    for (const slide of slides) {
      console.log(`  [${slide.index}] ${slide.name} (${slide.id}) — ${slide.nodes.length} node(s)`)
    }
    return
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
