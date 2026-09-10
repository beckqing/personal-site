import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

// "This piece has a speedpaint video" — a counterclockwise rewind ring
// (lucide's rotate-ccw path, stroked) with a small play triangle (lucide's
// play path, filled, scaled 0.5 and centered) nested inside it, replacing
// the generic CircleDot this used to be. Both paths are lucide-react's own,
// just composed into one glyph instead of two separate icons.
export function SpeedpaintIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <g transform="translate(12 12) scale(0.5) translate(-12 -12)" fill="currentColor" stroke="none">
        <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
      </g>
    </svg>
  )
}
