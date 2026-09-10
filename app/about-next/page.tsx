// A SCRATCH EXPLORATION ROUTE, kept the way app/excerpt-preview/ is kept:
// dev-only, not a real page yet. This 404s once NODE_ENV is 'production'
// (the App Router has no data-level flag to hide a route behind, so the
// gate below does that job — same condition SAMPLE_WORK is excluded on).
//
// The brief: try a more "landing-page" composition for /about — a photo, a
// tagline, a way to get in touch — without touching /about itself, which
// stays exactly as it is while this is worked on. Whether this replaces
// /about, becomes something else, or gets thrown away is undecided; nothing
// here should assume an answer.
//
// Everything reused below (IconScatterField, BrandMark's tokens, AboutTabs)
// is read, not modified — lib/about-content.ts and components/about-tabs.tsx
// are load-bearing for the live /about page and are left alone on purpose.
//
// Source material for this draft is Beck's own branding deck
// (~/Downloads/personal branding slides/), not invented here:
// - the split composition (photo left, doodle field right) is slide 1,
//   "About Me.png"
// - the "artist · scientist · designer" tagline and hello@beckqing.com are
//   from the closing slide, "Conclusion Bio.png"
// - the photo is "your friendly neighborhood artist" from the profile-
//   picture slide, Beck's own pick this session over the other five
//
// The hero image (public/about/beck-friendly-neighborhood-artist.webp) is a
// crop of the deck slide, not the original photo — ask Beck for the
// full-resolution original when this direction firms up; 712px wide is thin
// for a retina hero.
//
// The email pill below is a plain `mailto:` link, not obfuscated: an
// earlier pass here tried splitting the address into parts and assembling
// it client-side, on the premise that the site had no address on it
// anywhere. That premise was wrong — `components/site-footer.tsx:9` already
// ships a plaintext `mailto:hello@beckqing.com` link sitewide (every page
// but `/`, via the root layout), including on the live `/about` today. The
// split-parts attempt also failed on its own terms: Turbopack constant-
// folds a template literal built from local string constants back into one
// literal at build time, so the "obfuscated" address still landed in the
// shipped JS bundle in plaintext. Given the footer already exposes it,
// hiding just this one pill would protect nothing.
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Mail, Moon } from 'lucide-react'
import { HeroWordScatter, IconScatterField } from '@/components/hero-icon-collage'
import { InstagramIcon } from '@/components/instagram-icon'
import { AboutTabs } from '@/components/about-tabs'

export default function AboutNextPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main>
      <p className="font-brand mx-auto max-w-6xl px-5 pt-6 text-sm lowercase text-muted-foreground sm:px-8">
        scratch route · exploring a landing-page layout for /about · delete app/about-next/ when done
      </p>

      <HeroWordScatter>
        <section className="relative overflow-hidden">
          <IconScatterField />
          <div className="relative mx-auto grid max-w-5xl gap-10 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-[280px_1fr] md:items-center md:gap-16">
            <div className="relative mx-auto aspect-[712/1080] w-full max-w-[280px] overflow-hidden rounded-3xl border border-border shadow-sm md:mx-0">
              <Image
                src="/about/beck-friendly-neighborhood-artist.webp"
                alt="Beck sitting on the floor beside a fiddle-leaf fig, looking over a small painted canvas"
                fill
                sizes="(max-width: 768px) 240px, 280px"
                className="object-cover"
                priority
              />
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center gap-2 text-goldenrod md:justify-start">
                <Moon className="h-5 w-5" strokeWidth={1.75} />
                <span className="font-brand text-sm uppercase tracking-[0.3em]">about</span>
              </div>
              <h1 className="font-brand mt-4 text-4xl font-bold text-foreground sm:text-6xl">
                Hi, I&apos;m Beck.
              </h1>
              <p className="font-brand mt-3 text-lg lowercase tracking-[0.02em] text-foreground/70 sm:text-xl">
                artist · scientist · designer
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-2.5 md:justify-start">
                <a
                  href="mailto:hello@beckqing.com"
                  className="font-brand inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-bold lowercase text-goldenrod transition-colors hover:bg-card"
                >
                  <Mail className="h-4 w-4" />
                  hello@beckqing.com
                </a>
                <a
                  href="https://www.instagram.com/beckqing/"
                  className="font-brand inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-bold lowercase text-art transition-colors hover:bg-card"
                >
                  <InstagramIcon className="h-4 w-4" />
                  instagram
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-20 sm:px-8">
          <AboutTabs />
        </section>
      </HeroWordScatter>
    </main>
  )
}
