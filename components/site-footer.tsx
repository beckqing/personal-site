'use client'

import { usePathname } from 'next/navigation'
import { Mail } from 'lucide-react'
import { InstagramIcon } from '@/components/instagram-icon'
import { LinkedinIcon } from '@/components/linkedin-icon'

const ICON_LINKS = [
  { label: 'hello@beckqing.com', title: 'email: hello@beckqing.com', href: 'mailto:hello@beckqing.com', Icon: Mail },
  { label: 'instagram', title: 'instagram: @beckqing', href: 'https://www.instagram.com/beckqing/', Icon: InstagramIcon },
  { label: 'linkedin', title: 'linkedin: beck-arruda', href: 'https://www.linkedin.com/in/beck-arruda/', Icon: LinkedinIcon },
] as const

// Everything else — deliberately not iconified, just a quiet disclosure.
// Behance/dribbble are `soon: true` in about-content.ts and stay off this
// list until they're real; kofi and twitter never existed / were retired.
const MORE_LINKS = [
  { label: 'github', href: 'https://github.com/beckqing' },
  { label: 'youtube', href: 'https://www.youtube.com/@beckqing' },
  { label: 'codepen', href: 'https://codepen.io/beckqing' },
  { label: 'character art instagram', href: 'https://www.instagram.com/nocturnalwhims' },
  { label: 'deviantart', href: 'https://www.deviantart.com/nocturnalwhims' },
  { label: 'artfight', href: 'https://artfight.net/~Wister' },
  { label: 'toyhouse', href: 'https://toyhou.se/Wister' },
  { label: 'flours and fungi', href: 'https://www.floursandfungi.com/' },
] as const

export function SiteFooter() {
  const pathname = usePathname()
  // The homepage ends on its own "see the full gallery" beat instead.
  if (pathname === '/') return null

  return (
    <footer className="relative z-10 mt-24 border-t border-border/70 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-12 text-center sm:px-8">
        <div className="flex items-center gap-6">
          {ICON_LINKS.map(({ label, title, href, Icon }) => (
            <a
              key={href}
              href={href}
              title={title}
              aria-label={title}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="h-6 w-6" />
              <span className="sr-only">{label}</span>
            </a>
          ))}
        </div>

        <details className="group">
          <summary className="font-brand-italic cursor-pointer list-none text-sm text-muted-foreground/70 transition-colors hover:text-muted-foreground [&::-webkit-details-marker]:hidden">
            see more
          </summary>
          <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            {MORE_LINKS.map((link, i) => (
              <span key={link.href}>
                <a href={link.href} className="underline-offset-4 hover:text-foreground hover:underline">
                  {link.label}
                </a>
                {i < MORE_LINKS.length - 1 && ', '}
              </span>
            ))}
          </p>
        </details>

        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} beck qing
        </p>
      </div>
    </footer>
  )
}
