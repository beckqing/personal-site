import { cn } from '@/lib/utils'

/**
 * beck qing brand mark — a crescent moon nested in a rounded square,
 * echoing the "night owl" avatar used across Beck's presence.
 */
export function MoonLogo({
  className,
  square = true,
}: {
  className?: string
  square?: boolean
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-9 w-9', className)}
      role="img"
      aria-label="beck qing logo"
    >
      {square && (
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          className="fill-moon"
        />
      )}
      <defs>
        <mask id="crescent-mask">
          <rect x="0" y="0" width="48" height="48" fill="black" />
          <circle cx="24" cy="24" r="13" fill="white" />
          <circle cx="29" cy="20" r="12" fill="black" />
        </mask>
      </defs>
      <circle
        cx="24"
        cy="24"
        r="13"
        className="fill-background"
        mask="url(#crescent-mask)"
      />
    </svg>
  )
}
