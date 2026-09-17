import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import Image from 'next/image'
import { StageItem } from '@/components/panels'

/**
 * The "profile pictures" slide's 3×2 grid, reproduced at its measured
 * geometry (docs/specs/2026-09-deck-visual-fidelity.md §6.8) — 300×300
 * cells, captions in Recursive Mono Linear Bold, plus the slide's rotated
 * filename-mimicking decoration up the left edge. Renders as a set of
 * `StageItem`s, so it only makes sense inside a `layout="stage"` panel.
 *
 * §6.8 calls the shipped build's `circle` prop on "The Professional"
 * invented and says all six cells are square — Beck's call (2026-09-17):
 * that's wrong, it's a circle. The `circle` prop stays for that one cell.
 */

const CELLS = [
  { x: 381, y: 71 },
  { x: 931, y: 71 },
  { x: 1489, y: 71 },
  { x: 381, y: 582 },
  { x: 931, y: 582 },
  { x: 1489, y: 582 },
]

const CAPTIONS = [
  { x: 331, y: 395 },
  { x: 881, y: 395 },
  { x: 1441, y: 395 },
  { x: 331, y: 906 },
  { x: 881, y: 906 },
  { x: 1441, y: 906 },
]

type ProfilePictureProps = {
  src?: string
  alt?: string
  title: string
  caption: string
  circle?: boolean
  children?: ReactNode
}

export function ProfilePicture({ src, alt, title, circle, children }: ProfilePictureProps) {
  return (
    <div
      className={circle ? 'flex h-full w-full items-center justify-center overflow-hidden rounded-full' : 'flex h-full w-full items-center justify-center overflow-hidden'}
      style={{ backgroundColor: '#CED2CD' }}
    >
      {src ? <Image src={src} alt={alt ?? title} fill sizes="300px" className="object-cover" /> : children}
    </div>
  )
}

export function ProfilePictureGrid({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(
    (c): c is ReactElement<ProfilePictureProps> => isValidElement(c) && c.type === ProfilePicture,
  )

  return (
    <>
      {items.map((item, i) => (
        <StageItem key={item.props.title} x={CELLS[i].x} y={CELLS[i].y} w={300} h={300}>
          {item}
        </StageItem>
      ))}
      {items.map((item, i) => (
        <StageItem
          key={`${item.props.title}-caption`}
          x={CAPTIONS[i].x}
          y={CAPTIONS[i].y}
          w={400}
          className="font-brand-linear text-center"
          style={{ fontSize: 20, lineHeight: '24px', color: '#000000' }}
        >
          <p className="font-bold">{item.props.title}</p>
          <p>{item.props.caption}</p>
        </StageItem>
      ))}
      <StageItem x={-3} y={-49} w={261} h={1129} ariaHidden style={{ overflow: 'hidden' }}>
        <div
          className="font-brand font-semibold whitespace-nowrap"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 1129,
            height: 261,
            fontSize: 96,
            lineHeight: '115px',
            color: '#0C3559',
            transform: 'translate(-50%, -50%) rotate(-90.2deg)',
          }}
        >
          profile_picture.jpg_picture.jpg profil
        </div>
      </StageItem>
    </>
  )
}
