import { BRAND_PALETTE } from '@/lib/brand-palette'
import { StageItem } from '@/components/panels'

/**
 * The "palette" slide's 800×800 mosaic of unequal rectangles, reproduced as
 * drawn — three columns of differently sized blocks, labels set *inside*
 * each swatch, right-aligned, in italic mono, plus the colour-blind
 * simulation block. Hand-formatted, not a responsive grid
 * (docs/specs/2026-09-deck-visual-fidelity.md §8.1). Renders as a set of
 * `StageItem`s, so it only makes sense inside a `layout="stage"` panel.
 */

const GEOMETRY: Record<string, { x: number; y: number; w: number; h: number; labelColor: string }> = {
  'summer storm': { x: 160, y: 140, w: 290, h: 266, labelColor: '#FFFFFF' },
  'satin nickel': { x: 160, y: 406, w: 290, h: 268, labelColor: '#FFFFFF' },
  'pale slate': { x: 160, y: 674, w: 290, h: 266, labelColor: '#69635E' },
  midnight: { x: 450, y: 140, w: 292, h: 266, labelColor: '#FFFFFF' },
  indigo: { x: 450, y: 406, w: 292, h: 268, labelColor: '#FFFFFF' },
  denim: { x: 450, y: 674, w: 292, h: 266, labelColor: '#FFFFFF' },
  white: { x: 742, y: 140, w: 218, h: 161, labelColor: '#69635E' },
  'terra cotta': { x: 742, y: 301, w: 218, h: 160, labelColor: '#FFFFFF' },
  'pumpkin pie': { x: 742, y: 461, w: 218, h: 160, labelColor: '#FFFFFF' },
  goldenrod: { x: 742, y: 621, w: 218, h: 159, labelColor: '#8C3623' },
  emerald: { x: 742, y: 780, w: 218, h: 160, labelColor: '#FFFFFF' },
}

const SWATCHES = BRAND_PALETTE.map((p) => ({ ...p, ...GEOMETRY[p.name] }))

type Segment = { x: number; w: number; fill: string; wide?: boolean }
type Row = { y: number; h: number; segments: Segment[] }

// Measured colour-blind simulation bars (§8.1). Each row is two rounded
// "wide" end-caps painted first, then three narrower segments painted over
// them — the overlap is what produces the blended transition bands.
const COLORBLIND_ROWS: Row[] = [
  {
    y: 665,
    h: 22,
    segments: [
      { x: 1225, w: 211, fill: '#305789', wide: true },
      { x: 1327, w: 109, fill: '#4BA661' },
      { x: 1436, w: 110, fill: '#D9AA52' },
      { x: 1546, w: 211, fill: '#8C3623', wide: true },
      { x: 1546, w: 109, fill: '#BF712C' },
    ],
  },
  {
    y: 722,
    h: 46,
    segments: [
      { x: 1218, w: 273, fill: '#355288', wide: true },
      { x: 1327, w: 109, fill: '#9B9165' },
      { x: 1436, w: 110, fill: '#C9B655' },
      { x: 1491, w: 273, fill: '#635920', wide: true },
      { x: 1546, w: 109, fill: '#9B8B2C' },
    ],
  },
  {
    y: 788,
    h: 45,
    segments: [
      { x: 1218, w: 273, fill: '#415A8B', wide: true },
      { x: 1327, w: 109, fill: '#A7995C' },
      { x: 1436, w: 110, fill: '#BDAA49' },
      { x: 1491, w: 273, fill: '#4E4621', wide: true },
      { x: 1546, w: 109, fill: '#887923' },
    ],
  },
  {
    y: 853,
    h: 46,
    segments: [
      { x: 1218, w: 273, fill: '#006269', wide: true },
      { x: 1327, w: 109, fill: '#37A395' },
      { x: 1436, w: 110, fill: '#EA9C96' },
      { x: 1491, w: 273, fill: '#9A2232', wide: true },
      { x: 1546, w: 109, fill: '#D16063' },
    ],
  },
]

function ColorBlindRow({ row }: { row: Row }) {
  const wide = row.segments.filter((s) => s.wide)
  const narrow = row.segments.filter((s) => !s.wide)
  return (
    <>
      {wide.map((s) => (
        <StageItem
          key={`${s.x}-wide`}
          x={s.x}
          y={row.y}
          w={s.w}
          h={row.h}
          ariaHidden
          style={{ backgroundColor: s.fill, borderRadius: 40 }}
        />
      ))}
      {narrow.map((s) => (
        <StageItem key={`${s.x}-narrow`} x={s.x} y={row.y} w={s.w} h={row.h} ariaHidden style={{ backgroundColor: s.fill }} />
      ))}
    </>
  )
}

export function BrandPalette({ caption }: { caption: string }) {
  return (
    <>
      {SWATCHES.map((s) => (
        <StageItem key={s.hex} x={s.x} y={s.y} w={s.w} h={s.h} style={{ backgroundColor: s.hex }}>
          <div
            className="font-brand-italic absolute right-4 bottom-4 text-right"
            style={{ width: 185, color: s.labelColor, fontSize: 24, lineHeight: '29px' }}
          >
            <p>{s.name}</p>
            <p>{s.hex}</p>
          </div>
        </StageItem>
      ))}
      {COLORBLIND_ROWS.map((row, i) => (
        <ColorBlindRow key={i} row={row} />
      ))}
      <StageItem x={1225} y={914} w={532} h={33} className="font-sans" style={{ fontSize: 24, lineHeight: '33px', color: '#69635E' }}>
        {caption}
      </StageItem>
    </>
  )
}
