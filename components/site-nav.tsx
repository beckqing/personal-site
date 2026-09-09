'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/work', label: 'work', accent: 'text-goldenrod' },
  { href: '/about', label: 'about', accent: 'text-writing' },
] as const

export function SiteNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          {/* leading-none: below the nav's ~363px one-line width (§13 of the
              narrow-screen-columns spec) "beck qing" wraps to two lines, and
              the default 1.5 line-height reads as two separate words rather
              than a stacked lockup. Safe at every width — the nav's own
              height is set by the 36px ThemeToggle, and this line box is
              27px at 1.5 and 18px at 1.0, under it either way. */}
          <span className="font-brand text-lg font-bold leading-none lowercase tracking-tight text-foreground">
            beck qing
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* flex-wrap, not a breakpoint: `work`/`about` stack when they
              don't fit and sit side by side when they do, with no width to
              guess and nothing to keep in sync with `--breakpoint-xs`
              (§13). justify-end keeps both lines flush against the toggle
              instead of flex-wrap's default flex-start, which left a
              stacked pair hugging the ul's left edge; gap-y-2 gives the
              stacked pair the space Beck asked for, and the nav row's own
              items-center centres the (now two-line) block against the
              toggle vertically. A side effect worth knowing: a wrapping
              flex container's min-content is its widest single item, not
              the whole row, so this also drops the page's overall overflow
              floor from ~290px to ~240px (§9.2). */}
          <ul className="flex flex-wrap items-center justify-end gap-1 gap-y-2">
            {LINKS.map((link) => {
              const active = pathname.startsWith(link.href)
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'font-brand rounded-full px-4 py-2 text-sm font-medium lowercase transition-colors',
                      active
                        ? cn('bg-card', link.accent)
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
