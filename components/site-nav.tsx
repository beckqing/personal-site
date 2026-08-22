'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { MoonLogo } from '@/components/moon-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/work', label: 'work', accent: 'text-goldenrod' },
  { href: '/about', label: 'about', accent: 'text-writing' },
] as const

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <MoonLogo className="h-8 w-8" />
          <span className="font-brand text-lg font-bold lowercase tracking-tight text-foreground">
            beck qing
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
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

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden md:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-border/70 px-5 pb-4 pt-2 md:hidden">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'font-brand block rounded-lg px-4 py-2.5 text-base font-medium lowercase',
                    active ? cn('bg-card', link.accent) : 'text-muted-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
          <li className="mt-1 flex items-center justify-between px-4 py-2">
            <span className="font-brand text-sm lowercase text-muted-foreground">
              theme
            </span>
            <ThemeToggle />
          </li>
        </ul>
      )}
    </header>
  )
}
