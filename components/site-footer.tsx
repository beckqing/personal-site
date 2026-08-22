import Link from 'next/link'
import { Mail } from 'lucide-react'
import { MoonLogo } from '@/components/moon-logo'
import { InstagramIcon } from '@/components/instagram-icon'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <MoonLogo className="h-8 w-8" />
            <span className="font-brand text-lg font-bold lowercase text-foreground">
              beck qing
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Interdisciplinary designer, painter, and writer. Something of a night
            owl — working somewhere between art and science.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
          <nav className="flex flex-col gap-2.5">
            <span className="font-brand text-xs uppercase tracking-widest text-muted-foreground/70">
              explore
            </span>
            <Link href="/work" className="text-sm text-foreground/80 transition-colors hover:text-goldenrod">
              all work
            </Link>
            <Link href="/work?tags=art" className="text-sm text-foreground/80 transition-colors hover:text-art">
              art
            </Link>
            <Link href="/work?tags=writing" className="text-sm text-foreground/80 transition-colors hover:text-writing">
              writing
            </Link>
            <Link href="/work?tags=science" className="text-sm text-foreground/80 transition-colors hover:text-science">
              science
            </Link>
            <Link href="/about" className="text-sm text-foreground/80 transition-colors hover:text-goldenrod">
              about
            </Link>
          </nav>

          <div className="flex flex-col gap-2.5">
            <span className="font-brand text-xs uppercase tracking-widest text-muted-foreground/70">
              say hello
            </span>
            <a
              href="mailto:hello@beckqing.com"
              className="flex items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-goldenrod"
            >
              <Mail className="h-4 w-4" />
              hello@beckqing.com
            </a>
            <a
              href="https://instagram.com"
              className="flex items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-goldenrod"
            >
              <InstagramIcon className="h-4 w-4" />
              instagram
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted-foreground/70 sm:px-8">
          © {new Date().getFullYear()} beck qing
        </p>
      </div>
    </footer>
  )
}
