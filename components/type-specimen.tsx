import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { StageItem } from '@/components/panels'
import { cn } from '@/lib/utils'

/**
 * One typeface row's data for the typography slide — verbatim deck copy
 * passed in as props (so it stays inside `content/decks/personal-
 * branding.mdx`, where `check-deck-fidelity.mjs` can audit it), not
 * rendered directly. `TypeSpecimen` reads these off its children and places
 * them per §8.2's measured row geometry
 * (docs/specs/2026-09-deck-visual-fidelity.md).
 */
export type TypeSampleProps = {
  name: string
  style?: string
  use: string
  caption: string
  className: string
}

export function TypeSample(_props: TypeSampleProps) {
  return null
}

const ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'

const ROWS = [
  {
    label: { x: 111, y: 403 },
    hairline: { x: 111, y: 443, w: 339, h: 4 },
    caption: { x: 109, y: 441, w: 292, h: 80 },
    name: { x: 478, y: 395 },
    alphabet: { x: 519, y: 443, w: 480, h: 76 },
    alphabetColor: '#CED2CD',
    alphabetLines: [ALPHABET, ALPHABET],
  },
  {
    label: { x: 111, y: 571 },
    hairline: { x: 111, y: 612, w: 339, h: 4 },
    caption: { x: 110, y: 611, w: 257, h: 90 },
    name: { x: 478, y: 558 },
    alphabet: { x: 519, y: 612, w: 520, h: 88 },
    alphabetColor: '#CED2CD',
    alphabetLines: [ALPHABET, ALPHABET],
  },
  {
    label: { x: 111, y: 747 },
    hairline: { x: 111, y: 787, w: 339, h: 4 },
    caption: { x: 110, y: 787, w: 291, h: 146 },
    name: { x: 478, y: 739 },
    alphabet: { x: 519, y: 787, w: 480, h: 114 },
    alphabetColor: '#305789',
    alphabetLines: [ALPHABET, ALPHABET, '1234567890'],
  },
] as const

/**
 * The typography slide's three-row specimen table — a label → hairline →
 * caption column on the left, typeface name → alphabet on the right, ruled
 * by three 4px hairlines. Hand-formatted, not a responsive grid (§8.2).
 * Expects exactly three `TypeSample` children, in `headings`/`body`/`mono`
 * order, and renders as a set of `StageItem`s — only makes sense inside a
 * `layout="stage"` panel.
 */
export function TypeSpecimen({ children }: { children: ReactNode }) {
  const samples = Children.toArray(children).filter(
    (c): c is ReactElement<TypeSampleProps> => isValidElement(c) && c.type === TypeSample,
  )

  return (
    <>
      {samples.map((sample, i) => {
        const row = ROWS[i]
        const { name, style: faceStyle, use, caption, className } = sample.props
        return (
          <div key={use}>
            <StageItem x={row.label.x} y={row.label.y} className="font-brand-sans-italic" style={{ fontSize: 32, lineHeight: '38px', color: '#A79F99' }}>
              {use}
            </StageItem>
            <StageItem x={row.hairline.x} y={row.hairline.y} w={row.hairline.w} h={row.hairline.h} ariaHidden style={{ backgroundColor: '#305789' }} />
            <StageItem x={row.caption.x} y={row.caption.y} w={row.caption.w} h={row.caption.h} className="font-sans" style={{ fontSize: 24, lineHeight: '33px', color: '#CED2CD' }}>
              {caption}
            </StageItem>
            <StageItem x={row.name.x} y={row.name.y} className={cn(className, 'lowercase', 'whitespace-nowrap')} style={{ fontSize: 40, lineHeight: '48px', color: '#FFFFFF' }}>
              {faceStyle ? `${name} ${faceStyle}` : name}
            </StageItem>
            <StageItem
              x={row.alphabet.x}
              y={row.alphabet.y}
              w={row.alphabet.w}
              h={row.alphabet.h}
              ariaHidden
              className="font-brand"
              style={{ fontSize: 32, lineHeight: '38px', color: row.alphabetColor }}
            >
              {row.alphabetLines.map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </StageItem>
          </div>
        )
      })}
    </>
  )
}
