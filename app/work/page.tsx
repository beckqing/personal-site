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
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
      <header className="max-w-2xl">
        <div className="flex items-center gap-2 text-goldenrod">
          <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
          <span className="font-brand text-sm uppercase tracking-[0.3em]">work</span>
        </div>
      </header>

      <div className="mt-6">
        <Suspense fallback={<div className="h-32" aria-hidden="true" />}>
          <WorkGallery />
        </Suspense>
      </div>
    </main>
  )
}
