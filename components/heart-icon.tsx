import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

// Standalone heart glyph for the site's favorite marks, replacing
// lucide-react's `Heart`. Source: heart-line-svgrepo-com.svg — a symmetric
// two-lobe outline rather than lucide's classic pointed heart. Line-only, no
// filled variant, so callers wanting a solid mark pass `fill="currentColor"`
// the same way they did against lucide's Heart.
export function HeartIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <path d="M17 4C13.8 4 12 6.66667 12 8C12 6.66667 10.2 4 7 4C3.8 4 3 6.66667 3 8C3 15 12 20 12 20C12 20 21 15 21 8C21 6.66667 20.2 4 17 4Z" />
    </svg>
  )
}
