import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LayoutGrid } from 'lucide-react'
import { WorkGallery } from '@/components/work-gallery'

export const metadata: Metadata = {
  title: 'work · beck qing',
  description:
    'Everything in one place — art, writing, and science. One collection, filterable by overlapping tags.',
}

export default function WorkPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <header className="max-w-2xl">
        <div className="flex items-center gap-2 text-goldenrod">
          <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
          <span className="font-brand text-sm uppercase tracking-[0.3em]">work</span>
        </div>
      </header>

      <div className="mt-12">
        <Suspense fallback={<div className="h-32" aria-hidden="true" />}>
          <WorkGallery />
        </Suspense>
      </div>
    </main>
  )
}
