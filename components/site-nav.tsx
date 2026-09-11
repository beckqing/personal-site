'use client'

import { useEffect, useRef } from 'react'
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
  const headerRef = useRef<HTMLElement>(null)

  // The docked filter bar on /work pins itself directly below this header,
  // and the header's height is not fixed — `work`/`about` wrap to two lines
  // on narrow screens (see the <ul> comment below). Published as a custom
  // property on the document element rather than through context, so the
  // consumer is a plain CSS value with no provider to thread through the
  // tree.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const publish = () =>
      document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        {/* mr-16: ~the width of the "about" pill, so the squeeze between the
            brand and the work/about pills kicks in earlier (a wider
            viewport) instead of right at the §13 wrap point, and "work"
            doesn't end up sitting dead-center in the gap once it does. */}
        <Link href="/" className="mr-16 flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          {/* leading-none: below the nav's ~363px one-line width (§13 of the
              narrow-screen-columns spec) "beck qing" wraps to two lines, and
              the default 1.5 line-height reads as two separate words rather
              than a stacked lockup. Safe at every width — the nav's own
              height is set by the 32px ThemeToggle, and this line box is
              24px at 1.5 and 16px at 1.0, under it either way. */}
          <span className="font-brand text-base font-bold leading-none lowercase tracking-tight text-foreground">
            beck qing
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
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
                      // py-1.5 (32px tall, matching the toggle's h-8) always;
                      // max-[420px] additionally trims the horizontal padding
                      // near where mr-16 above forces work/about onto two rows
                      // (a guess, not a measured boundary — the padding itself
                      // shifts that boundary, so don't chase an exact match).
                      'font-brand rounded-full px-4 py-1.5 text-sm font-medium lowercase transition-colors max-[420px]:px-3',
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
