import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LayoutGrid } from 'lucide-react'
import { WorkGallery } from '@/components/work-gallery'
import { headingStyles } from '@/lib/heading-styles'

export const metadata: Metadata = {
  title: 'work · beck qing',
  description:
    'Everything in one place — art, writing, and science. One collection, filterable by overlapping tags.',
}

export default function WorkPage() {
  return (
    <main className="mx-auto max-w-6xl px-3 pb-16 pt-4 xs:px-5 sm:px-8 sm:pb-20 sm:pt-8">
      <div className="mb-2 flex items-center gap-1.5 text-goldenrod">
        <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        <span className={headingStyles.eyebrow}>work gallery</span>
      </div>
      <h1 className="sr-only">Work</h1>

      <Suspense fallback={<div className="h-32" aria-hidden="true" />}>
        <WorkGallery />
      </Suspense>
    </main>
  )
}
