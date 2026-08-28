import { cn } from '@/lib/utils'

/** A rotated rubber-stamp style badge, e.g. for a small caption or CTA. */
export function StampBadge({
  className,
  children,
  tilt = -3,
}: {
  className?: string
  children: React.ReactNode
  tilt?: number
}) {
  return (
    <span
      className={cn(
        'font-brand inline-flex items-center gap-1.5 rounded-full border-2 border-current px-3 py-1 text-xs font-bold lowercase tracking-wide',
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </span>
  )
}
