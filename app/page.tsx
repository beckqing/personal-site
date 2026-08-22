import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Palette, Feather, FlaskConical, Quote } from 'lucide-react'
import { MoonLogo } from '@/components/moon-logo'
import { WashiTape, PushPin, StampBadge } from '@/components/collage'
import { HeroWordScatter, IconScatterField, CategoryWord } from '@/components/hero-icon-collage'
import { ARTWORKS, POEMS, PROJECTS } from '@/lib/content'

const featuredArt = ARTWORKS.find((a) => a.slug === 'lamplight') ?? ARTWORKS[0]
const featuredPoem = POEMS[0]
const featuredProject = PROJECTS[0]

const PANELS = [
  {
    href: '/work?tags=art',
    label: 'art',
    Icon: Palette,
    accent: 'art',
    tilt: -5,
    z: 'z-10',
    kind: 'polaroid' as const,
  },
  {
    href: '/work?tags=writing',
    label: 'writing',
    Icon: Feather,
    accent: 'writing',
    tilt: 3,
    z: 'z-20',
    kind: 'quote' as const,
  },
  {
    href: '/work?tags=science',
    label: 'science',
    Icon: FlaskConical,
    accent: 'science',
    tilt: -2,
    z: 'z-30',
    kind: 'stat' as const,
  },
] as const

export default function HomePage() {
  const featured = ARTWORKS.slice(0, 3)

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden night-vignette">
        <HeroWordScatter>
          <IconScatterField />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
            <MoonLogo className="h-16 w-16" />
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
                className="font-brand inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold lowercase text-foreground transition-colors hover:bg-card hover:-rotate-1"
              >
                about me
              </Link>
            </div>
          </div>
        </HeroWordScatter>
      </section>

      {/* Pathways — an overlapping corkboard of the three disciplines */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">

        <div className="relative mt-14 flex flex-col items-center gap-10 sm:mt-16 md:flex-row md:items-stretch md:justify-center md:gap-0">
          {PANELS.map(({ href, label, Icon, accent, tilt, z, kind }, i) => (
            <Link
              key={href}
              href={href}
              className={`tilt-card group relative flex w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border-2 border-foreground/15 bg-card p-6 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-7 ${z} hover:z-40 ${
                i > 0 ? 'md:-ml-12' : ''
              }`}
              style={{ ['--tilt' as string]: `${tilt}deg` }}
            >
              <WashiTape
                className="-top-3"
                tilt={tilt < 0 ? 8 : -8}
                color={`var(--${accent})`}
              />
              <PushPin
                className="-top-1.5 right-5"
                color={accent === 'art' ? 'var(--goldenrod)' : 'var(--terracotta)'}
              />

              <StampBadge className={`self-start text-${accent}`} tilt={tilt}>
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
                    {featuredPoem.lines.filter(Boolean).slice(0, 3).join(' ')}
                  </p>
                  <p className="font-brand mt-4 text-xs lowercase tracking-wide text-muted-foreground">
                    — from &ldquo;{featuredPoem.title}&rdquo;
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Short poems and longer essays about what it means to live
                    in the world.
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
                enter
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured work strip */}
      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <div className="flex items-end justify-between">
          <h2 className="font-brand text-2xl font-bold lowercase text-foreground sm:text-3xl">
            lately, in the studio
          </h2>
          <Link
            href="/work?tags=art"
            className="font-brand hidden items-center gap-1.5 text-sm lowercase text-art transition-colors hover:text-foreground sm:inline-flex"
          >
            full gallery
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {featured.map((art) => (
            <figure
              key={art.slug}
              className="group overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={art.image || '/placeholder.svg'}
                  alt={art.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="flex items-baseline justify-between gap-2 p-4">
                <span className="font-brand text-sm font-bold lowercase text-foreground">
                  {art.title}
                </span>
                <span className="text-xs text-muted-foreground">{art.year}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  )
}
