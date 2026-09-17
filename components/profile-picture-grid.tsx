import type { ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * The "profile pictures" slide — a grid of alternate self-presentation
 * options, each with Beck's own caption. Not anticipated by the branding-
 * deck spec's §5/§6 (written from a guess off a 178×900 thumbnail); added
 * once the real pull showed this slide exists. Uses the existing `full`
 * slide layout — no new layout variant needed, just this content component.
 */
export function ProfilePictureGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">{children}</div>
}

/**
 * One option in the grid. Pass `src`/`alt` for a photo or illustration;
 * pass `children` instead (used for "the logo") to render a live component —
 * `BrandMark` itself, not an exported picture of it, the same rebuild-not-
 * export rule as the rest of §8.
 */
export function ProfilePicture({
  src,
  alt,
  title,
  caption,
  circle,
  children,
}: {
  src?: string
  alt?: string
  title: string
  caption: string
  circle?: boolean
  children?: ReactNode
}) {
  return (
    <figure className="flex flex-col items-center gap-3 text-center">
      <div
        className={cn(
          'relative flex aspect-square w-full max-w-[180px] items-center justify-center overflow-hidden border border-border bg-card',
          circle ? 'rounded-full' : 'rounded-2xl',
        )}
      >
        {src ? (
          <Image src={src} alt={alt ?? title} fill sizes="180px" className="object-cover" />
        ) : (
          children
        )}
      </div>
      <figcaption>
        <p className="font-brand text-sm font-bold lowercase text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      </figcaption>
    </figure>
  )
}
