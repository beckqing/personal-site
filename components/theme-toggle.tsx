'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeTransition } from '@/components/theme-transition'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const { flip } = useThemeTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => flip()}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border text-foreground transition-colors duration-500 hover:bg-card',
        mounted && !isDark ? 'bg-goldenrod/15' : 'bg-moon/10',
        className,
      )}
      aria-label={
        mounted
          ? `Switch to ${isDark ? 'daylight' : 'night owl'} mode`
          : 'Toggle color theme'
      }
      title={mounted ? (isDark ? 'daylight mode' : 'night owl mode') : undefined}
    >
      {/* Render both and cross-fade with a slight overshoot, like the sun/moon swinging into place; before mount, keep it neutral to avoid a hydration flash */}
      <Sun
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] text-goldenrod transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          mounted && !isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0',
        )}
      />
      <Moon
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          !mounted || isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0',
        )}
      />
    </button>
  )
}
