import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Recursive, Noto_Sans } from 'next/font/google'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const recursive = Recursive({
  subsets: ['latin'],
  axes: ['CASL', 'MONO', 'slnt'],
  display: 'swap',
  variable: '--font-recursive',
})

const notoSans = Noto_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto',
})

export const metadata: Metadata = {
  title: 'beck qing · artist · scientist · designer',
  description:
    'The personal home of Beck Qing — interdisciplinary designer. Paintings, poetry, essays on living in the world, and science communication under one crescent moon.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e7eae4' },
    { media: '(prefers-color-scheme: dark)', color: '#080b24' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${recursive.variable} ${notoSans.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SiteNav />
          <div className="min-h-[70vh]">{children}</div>
          <SiteFooter />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
