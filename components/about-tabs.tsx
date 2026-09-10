'use client'

import { useLayoutEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { ABOUT_TABS, type AboutTabId } from '@/lib/about-content'
import { InstagramIcon } from '@/components/instagram-icon'
import { TabGlyph } from '@/components/tab-glyph'
import { cn } from '@/lib/utils'

const TAB_IDS = ABOUT_TABS.map((t) => t.id)

const ACCENT_TEXT: Record<AboutTabId, string> = {
  general: 'text-goldenrod',
  art: 'text-art',
  tech: 'text-science',
  food: 'text-terracotta',
}

const ACCENT_BG: Record<AboutTabId, string> = {
  general: 'bg-goldenrod',
  art: 'bg-art',
  tech: 'bg-science',
  food: 'bg-terracotta',
}

function readHashTab(): AboutTabId {
  if (typeof window === 'undefined') return 'general'
  const hash = window.location.hash.replace('#', '')
  return (TAB_IDS as string[]).includes(hash) ? (hash as AboutTabId) : 'general'
}

export function AboutTabs() {
  const [active, setActive] = useState<AboutTabId>('general')

  // useLayoutEffect (not useEffect) so the hash-derived tab is applied
  // before the browser paints — otherwise e.g. /about#food renders the
  // `general` tab for one visible frame before swapping.
  useLayoutEffect(() => {
    setActive(readHashTab())
    const onHashChange = () => setActive(readHashTab())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const activeTab = ABOUT_TABS.find((t) => t.id === active) ?? ABOUT_TABS[0]

  return (
    <div>
      {/* Tab nav + morphing glyph */}
      <div className="flex items-start justify-between gap-4">
        <div
          role="tablist"
          aria-label="About sections"
          className="flex flex-wrap gap-2"
        >
          {ABOUT_TABS.map((tab) => {
            const isActive = tab.id === active
            return (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActive(tab.id)}
                className={cn(
                  'font-brand rounded-full border px-4 py-2 text-sm font-bold lowercase transition-colors',
                  isActive
                    ? cn('border-transparent text-primary-foreground', ACCENT_BG[tab.id])
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </a>
            )
          })}
        </div>

        <TabGlyph active={active} className="mt-0" />
      </div>

      {/* Panel */}
      <div
        role="tabpanel"
        id={`panel-${activeTab.id}`}
        aria-labelledby={`tab-${activeTab.id}`}
        className="mt-8 space-y-8"
      >
        {activeTab.sections.map((section, i) => (
          <div key={i} className="space-y-4">
            {section.paragraphs.map((p, j) => (
              <p
                key={j}
                className="max-w-2xl text-pretty text-lg leading-relaxed text-foreground/85"
              >
                {p}
              </p>
            ))}
            {section.links && section.links.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {section.links.map((link) => {
                  const disabled = Boolean(link.soon)
                  const Icon = link.icon === 'instagram' ? InstagramIcon : ArrowUpRight
                  const content = (
                    <>
                      <Icon className="h-4 w-4" />
                      {link.label}
                      {disabled && (
                        <span className="text-xs font-normal text-muted-foreground/80">
                          (soon)
                        </span>
                      )}
                    </>
                  )
                  const sharedClasses = cn(
                    'font-brand inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold lowercase transition-colors',
                    disabled
                      ? 'cursor-default border-border/60 text-muted-foreground/70'
                      : cn('border-border hover:bg-card', ACCENT_TEXT[activeTab.id]),
                  )

                  if (disabled) {
                    return (
                      <span key={link.label} className={sharedClasses} aria-disabled="true">
                        {content}
                      </span>
                    )
                  }

                  return (
                    <a key={link.label} href={link.href} className={sharedClasses}>
                      {content}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
