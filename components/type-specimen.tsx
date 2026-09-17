import type { ReactNode } from 'react'
import { headingStyles } from '@/lib/heading-styles'
import { cn } from '@/lib/utils'

/**
 * One typeface sample on the typography slide — verbatim deck copy passed
 * in as props (not hardcoded here) so it stays inside `content/decks/
 * personal-branding.mdx`, where `check-deck-fidelity.mjs` can audit it. See
 * docs/specs/2026-09-branding-deck.md §8.2.
 */
export function TypeSample({
  name,
  style,
  use,
  caption,
  className,
}: {
  name: string
  style?: string
  use: string
  caption: string
  className: string
}) {
  return (
    <div>
      <p className="font-brand text-xs uppercase tracking-[0.3em] text-muted-foreground">{use}</p>
      <p className="mt-1 text-xs text-muted-foreground/80">{caption}</p>
      <p className={cn('mt-4 text-xl lowercase text-foreground', className)}>{name}</p>
      {style && <p className="text-xs text-muted-foreground">{style}</p>}
      <p className={cn('mt-3 text-lg uppercase text-foreground/80', className)}>ABCDEFGHIKLMNOPQRSTUVWXYZ</p>
    </div>
  )
}

/**
 * Wraps a row of `TypeSample`s, then renders the site's actual `h1`–`h5`
 * ladder by applying `headingStyles` directly — this slide literally *is*
 * the site's type scale rather than a picture of one, so it moves with the
 * scale instead of drifting from it (§8.2).
 */
export function TypeSpecimen({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="grid gap-8 sm:grid-cols-3">{children}</div>
      <div className="mt-10 border-t border-border pt-6">
        <p className="font-brand text-xs uppercase tracking-[0.3em] text-muted-foreground">the heading ladder</p>
        <div className="mt-3 space-y-1">
          <p className={headingStyles.h1}>heading one</p>
          <p className={cn(headingStyles.h2, 'mt-0')}>heading two</p>
          <p className={cn(headingStyles.h3, 'mt-0')}>heading three</p>
          <p className={cn(headingStyles.h4, 'mt-0')}>heading four</p>
          <p className={cn(headingStyles.h5, 'mt-0')}>heading five</p>
        </div>
      </div>
    </div>
  )
}
