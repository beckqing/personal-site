'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Palette, Feather, FlaskConical, Quote } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { StampBadge } from '@/components/collage'
import { HeroWordScatter, IconScatterField, CategoryWord, useCollage } from '@/components/hero-icon-collage'
import type { IconCategory } from '@/lib/brand-icons'
import { PROJECTS } from '@/lib/content'
import { getWorkItem, getCollectionPiece } from '@/lib/work'
import { cn } from '@/lib/utils'

const featuredArt = getWorkItem('rabbit-in-the-moon')!
const featuredPoem = getCollectionPiece('love-worth-heartbreak', 'lost')!.piece
const featuredProject = PROJECTS[0]

// accentClass holds the full Tailwind class (not just a color name plugged
// into a template) since Tailwind's scanner only generates classes it can
// see literally in source — a `text-${name}` interpolation wouldn't work
// for a class that doesn't also appear literally somewhere else.
const PANELS = [
  {
    href: '/work?tags=art',
    label: 'art',
    Icon: Palette,
    // Brighter than --art in dark mode (denim reads dark/muted against the
    // hero's sky-colored icons and midnight background) — see
    // --hero-accent-art in globals.css. Same as --art in light mode.
    accentClass: 'text-hero-accent-art',
    category: 'art' as IconCategory,
    tilt: -5,
    z: 'z-10',
    kind: 'polaroid' as const,
    cta: 'look around',
  },
  {
    href: '/work?tags=writing',
    label: 'writing',
    Icon: Feather,
    accentClass: 'text-writing',
    category: 'hu' as IconCategory,
    tilt: 3,
    z: 'z-20',
    kind: 'quote' as const,
    cta: 'start reading',
  },
  {
    href: '/work?tags=science',
    label: 'science',
    Icon: FlaskConical,
    accentClass: 'text-science',
    category: 'sci' as IconCategory,
    tilt: -2,
    z: 'z-30',
    kind: 'stat' as const,
    cta: 'discover more',
  },
] as const

/** The three discipline cards — settle flat and come to the front on their
 *  own hover/focus, or when the matching word in the hero copy above is
 *  hovered (shared via HeroWordScatter's context). */
function DisciplinePanels() {
  const { hovered } = useCollage()

  return (
    <div className="relative mt-6 flex flex-col items-center gap-10 sm:mt-8 md:flex-row md:items-stretch md:justify-center md:gap-0">
      {PANELS.map(({ href, label, Icon, accentClass, category, tilt, z, kind, cta }, i) => {
        const active = hovered === category
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'tilt-card group relative flex w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border-2 border-foreground/15 bg-card p-6 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-7 hover:z-40',
              active ? 'z-40 tilt-card-active' : z,
              i > 0 ? 'md:-ml-12' : '',
            )}
            style={{ ['--tilt' as string]: `${tilt}deg` }}
          >
            <StampBadge className={cn('self-start', accentClass)} tilt={tilt}>
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </StampBadge>

            {kind === 'polaroid' && (
              <>
                <div className="mt-5 -rotate-1 rounded-lg border-2 border-foreground/10 bg-background p-2 shadow-sm transition-transform group-hover:rotate-0">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                    <Image
                      src={featuredArt.image || '/placeholder.svg'}
                      alt={featuredArt.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 380px"
                      className="object-cover"
                    />
                  </div>
                  <p className="font-brand-italic mt-2 px-1 text-sm text-foreground/80">
                    &ldquo;{featuredArt.title}&rdquo;, {featuredArt.year}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Paintings made mostly after dark — moons, plants, and the
                  anatomy of feeling.
                </p>
              </>
            )}

            {kind === 'quote' && (
              <>
                <Quote
                  className="mt-5 h-8 w-8 -scale-x-100 text-writing/60"
                  strokeWidth={1.5}
                />
                <p className="font-brand-italic mt-2 text-lg leading-relaxed text-foreground">
                  {featuredPoem.preview!.split('\n').filter(Boolean).slice(0, 3).join(' ')}
                </p>
                <p className="font-brand mt-4 text-xs lowercase tracking-wide text-muted-foreground">
                  — from &ldquo;{featuredPoem.title}&rdquo;
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Short poems and longer essays about what it means to live in
                  the world.
                </p>
              </>
            )}

            {kind === 'stat' && (
              <>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-brand text-5xl font-bold text-science">
                    {featuredProject.metrics[1].value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {featuredProject.metrics[1].label.toLowerCase()}
                  </span>
                </div>
                <p className="font-brand mt-2 text-sm font-bold lowercase text-foreground">
                  {featuredProject.field.toLowerCase()}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Talks and studies where design meets research — curiosity,
                  made presentable.
                </p>
              </>
            )}

            <span className="font-brand mt-auto flex items-center gap-1.5 pt-6 text-sm font-medium lowercase text-foreground/70 transition-colors group-hover:text-foreground">
              {cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      <HeroWordScatter>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <IconScatterField />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
            <BrandMark detail="filled" className="h-16 w-16" />
            <p className="font-brand mt-8 text-sm uppercase tracking-[0.35em] text-secondary-foreground/70">
              personal home of
            </p>
            <h1 className="font-brand mt-3 text-5xl font-bold lowercase tracking-tight text-foreground sm:text-7xl">
              beck qing
            </h1>
            <p className="mt-8 max-w-xl text-pretty text-base leading-relaxed text-foreground/80 sm:text-lg">
              forever a student of <CategoryWord category="art">art</CategoryWord>,{' '}
              <CategoryWord category="sci">science</CategoryWord>, and{' '}
              <CategoryWord category="hu">humanity</CategoryWord>
              <br />
              currently focused on home improvement and interactive art
              <br />
              open to roles in automation, biotech, and food
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/work"
                className="font-brand inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold lowercase text-primary-foreground transition-transform hover:-translate-y-0.5 hover:rotate-1"
              >
                see the work
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="font-brand inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold lowercase text-foreground transition-colors hover:bg-muted hover:-rotate-1"
              >
                about me
              </Link>
            </div>
          </div>
        </section>

        {/* Pathways — an overlapping corkboard of the three disciplines */}
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
          <DisciplinePanels />
        </section>
      </HeroWordScatter>

      {/* A deliberate scroll-and-click beat before the full gallery, rather
          than dumping every work item right under the hero. */}
      <section className="mx-auto max-w-6xl px-5 py-28 text-center sm:px-8 sm:py-36">
        <p className="font-brand text-sm uppercase tracking-[0.3em] text-muted-foreground">
          more where that came from
        </p>
        <Link
          href="/work"
          className="font-brand mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold lowercase text-primary-foreground transition-transform hover:-translate-y-0.5 hover:rotate-1"
        >
          see the full gallery
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </main>
  )
}
