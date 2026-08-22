'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoonLogo } from '@/components/moon-logo'
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
          <MoonLogo className="h-8 w-8" />
          <span className="font-brand text-lg font-bold lowercase tracking-tight text-foreground">
            beck qing
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <ul className="flex items-center gap-1">
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
