import type { Metadata } from 'next'
import { NOW_PREFIX, NOW_ENTRIES } from '@/lib/now'

export const metadata: Metadata = {
  title: 'now · beck qing',
  description: 'What Beck Qing is currently focused on, and the history behind it.',
}

// Indexed by the parsed `MM` — not `new Date()`, which parses `YYYY-MM` as
// UTC midnight and renders a month early west of Greenwich.
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatSince(since: string) {
  const [year, month] = since.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}

const currentEntry = NOW_ENTRIES.at(-1)!
const history = NOW_ENTRIES.slice(0, -1).reverse()

export default function NowPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
          <h1 className="font-brand text-4xl font-bold lowercase text-foreground sm:text-6xl">
            now
          </h1>

          <p className="font-brand mt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {formatSince(currentEntry.since)}
          </p>
          <p className="mt-2 max-w-2xl text-pretty text-xl leading-relaxed text-foreground sm:text-2xl">
            {NOW_PREFIX} {currentEntry.text}
          </p>

          <div className="mt-16 max-w-2xl">
            {history.map((entry) => (
              <div key={entry.since} className="border-t border-border/60 py-5 first:border-t-0 first:pt-0">
                <h2 className="font-brand text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {formatSince(entry.since)}
                </h2>
                <p className="mt-2 text-pretty leading-relaxed text-foreground/80">
                  {NOW_PREFIX} {entry.text}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-xs text-muted-foreground/70">
            this is a{' '}
            <a
              href="https://nownownow.com/"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              /now page
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
