import { cn } from '@/lib/utils'

/** A strip of washi tape "pinning" a panel corner to the page. */
export function WashiTape({
  className,
  tilt = -5,
  color = 'var(--secondary)',
}: {
  className?: string
  tilt?: number
  color?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('washi-tape absolute left-1/2 h-7 w-20 rounded-[2px]', className)}
      style={{ backgroundColor: color, ['--tape-tilt' as string]: `${tilt}deg` }}
    />
  )
}

/** A small round pushpin, for pinning a panel like it's on a corkboard. */
export function PushPin({
  className,
  color = 'var(--terracotta)',
}: {
  className?: string
  color?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute z-10 h-3.5 w-3.5 rounded-full shadow-[0_2px_3px_rgba(8,11,36,0.35)]',
        className,
      )}
      style={{
        backgroundColor: color,
        backgroundImage:
          'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), transparent 60%)',
      }}
    />
  )
}

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
