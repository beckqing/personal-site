import type { AboutTabId } from '@/lib/about-content'
import { BRAND_ICONS } from '@/lib/brand-icons'
import { cn } from '@/lib/utils'

const ACCENT_VAR: Record<AboutTabId, string> = {
  general: 'var(--goldenrod)',
  art: 'var(--art)',
  tech: 'var(--science)',
  food: 'var(--terracotta)',
}

function findDoodle(slug: string) {
  const icon = BRAND_ICONS.find((i) => i.slug === slug)
  if (!icon) throw new Error(`Missing doodle icon: ${slug}`)
  return icon
}

// Each tab's badge is composed from the real hand-drawn doodle icons rather
// than redrawn shapes, scaled up and loosely composed to read at badge size.
const TAB_DOODLES: Record<AboutTabId, { slug: string; box: [number, number, number, number] }[]> = {
  general: [{ slug: 'crane', box: [1, 8, 30, 20] }],
  art: [
    { slug: 'paint_tube', box: [1, 1, 15, 27] },
    { slug: 'flat_brush', box: [15, 3, 17, 27] },
  ],
  tech: [
    { slug: 'laptop', box: [3, 12, 26, 17] },
    { slug: 'angle_brackets', box: [7, 1, 18, 10] },
  ],
  food: [{ slug: 'cupcake', box: [5, 2, 22, 28] }],
}

const ORDER: AboutTabId[] = ['general', 'art', 'tech', 'food']

/** Renders one tab's doodle group, each doodle placed in its own sub-region of the 32x32 badge. */
function TabDoodleGroup({ id, ...props }: { id: AboutTabId } & React.SVGProps<SVGGElement>) {
  return (
    <g {...props}>
      {TAB_DOODLES[id].map(({ slug, box }, i) => {
        const doodle = findDoodle(slug)
        const [x, y, w, h] = box
        return (
          <svg key={slug + i} x={x} y={y} width={w} height={h} viewBox={doodle.viewBox}>
            <path d={doodle.path} fill="currentColor" />
          </svg>
        )
      })}
    </g>
  )
}

/**
 * A little badge in the corner whose icon morphs to match the active
 * about-page tab, built from the site's hand-drawn doodle icons — a crane,
 * a paint tube + brush, a laptop + angle brackets, a cupcake.
 */
export function TabGlyph({ active, className }: { active: AboutTabId; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-colors duration-500 sm:h-20 sm:w-20',
        className,
      )}
      style={{ color: ACCENT_VAR[active], borderColor: ACCENT_VAR[active] }}
    >
      <svg viewBox="0 0 32 32" className="h-11 w-11 sm:h-14 sm:w-14" fill="none">
        {ORDER.map((id) => {
          const isActive = id === active
          return (
            <TabDoodleGroup
              key={id}
              id={id}
              style={{
                transformOrigin: '16px 16px',
                transitionProperty: 'opacity, transform',
                transitionDuration: '500ms',
                // Back-out curve (overshoots past 1 before settling) rather
                // than a plain ease-out, so the incoming doodle bounces in.
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'scale(1) rotate(0deg)' : 'scale(0.7) rotate(16deg)',
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
