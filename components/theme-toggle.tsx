'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-card',
        className,
      )}
      aria-label={
        mounted
          ? `Switch to ${isDark ? 'daylight' : 'night owl'} mode`
          : 'Toggle color theme'
      }
      title={mounted ? (isDark ? 'daylight mode' : 'night owl mode') : undefined}
    >
      {/* Render both and cross-fade; before mount, keep it neutral to avoid a hydration flash */}
      <Sun
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] transition-all duration-300',
          mounted && !isDark ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
        )}
      />
      <Moon
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] transition-all duration-300',
          !mounted || isDark ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
        )}
      />
    </button>
  )
}
