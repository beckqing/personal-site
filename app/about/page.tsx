import type { Metadata } from 'next'
import { Moon } from 'lucide-react'
import { AboutTabs } from '@/components/about-tabs'

export const metadata: Metadata = {
  title: 'about · beck qing',
  description:
    'About Beck Qing — interdisciplinary designer, artist, technologist, and baker in the SF bay area.',
}

export default function AboutPage() {
  return (
    <main>
      <section className="relative overflow-hidden night-vignette">
        <div className="relative mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex items-center gap-2 text-goldenrod">
            <Moon className="h-5 w-5" strokeWidth={1.75} />
            <span className="font-brand text-sm uppercase tracking-[0.3em]">about</span>
          </div>
          <h1 className="font-brand mt-4 text-4xl font-bold text-foreground sm:text-6xl">
            Hi, I&apos;m Beck.
          </h1>

          <div className="mt-10">
            <AboutTabs />
          </div>
        </div>
      </section>
    </main>
  )
}
