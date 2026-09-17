import { Children, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import Image from 'next/image'
import { EssayBody } from '@/components/essay'
import { headingStyles } from '@/lib/heading-styles'
import { cn } from '@/lib/utils'
import { PanelRail } from '@/components/panel-rail'

export type PanelLayout = 'prose' | 'figure' | 'split' | 'full' | 'cover' | 'stage'

export type PanelProps = {
  id: string
  title: string
  layout?: PanelLayout
  tone?: 'accent'
  rail?: false
  children: ReactNode
  /** `layout="stage"` only — the slide's own background fill (§5). */
  bg?: string
  /** `layout="stage"` only — deck-pixel geometry for the visible on-stage
   *  title element. Omit when the title has no visible placement (§3.4). */
  titleBox?: { x: number; y: number; w: number; h: number }
  titleClassName?: string
  titleStyle?: CSSProperties
}

/** A panel's own image, pulled out of the flow so `Panel` can place it per `layout` (see docs/specs/2026-09-panels-and-rail.md §3.4, §6.3). */
export function PanelFigure({
  src,
  aspect,
  alt,
  caption,
}: {
  src: string
  aspect: string
  alt: string
  caption?: string
}) {
  return (
    <figure className="w-full">
      <div className="relative w-full overflow-hidden rounded-2xl border border-border" style={{ aspectRatio: aspect }}>
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
      </div>
      {caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}

/**
 * One element of a `layout="stage"` slide, positioned in raw deck pixels
 * against the 1920×1080 stage (docs/specs/2026-09-deck-visual-fidelity.md
 * §3.2). Paint order is DOM order — no z-index — so list a slide's
 * `StageItem`s in the same order as its geometry table.
 */
export function StageItem({
  x,
  y,
  w,
  h,
  rotate,
  className,
  style,
  ariaHidden,
  children,
}: {
  x: number
  y: number
  w?: number
  h?: number
  rotate?: number
  className?: string
  style?: CSSProperties
  ariaHidden?: boolean
  children?: ReactNode
}) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className={className}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** A `layout="stage"` panel's hand-authored reflow below 640px (§11) — same content, same order, same copy; no deck-pixel positioning. */
export function StageReflow({ children }: { children: ReactNode }) {
  return <>{children}</>
}

const LAYOUT_WRAP: Record<'prose' | 'figure' | 'split' | 'full', string> = {
  prose: 'mx-auto',
  figure: 'flex flex-col items-center gap-8',
  split: 'flex flex-col gap-8 sm:flex-row sm:items-center',
  full: '',
}

/**
 * One panel in a `<Panels>` sequence — a deck slide or a case-study section,
 * unified (docs/specs/2026-09-panels-and-rail.md §3). Always a Server
 * Component: `Panels` derives its list off `c.type === Panel`, which only
 * works because there is no RSC boundary between this module and the MDX
 * that imports it (§3.3).
 */
export function Panel({ id, title, layout = 'prose', tone, children, bg, titleBox, titleClassName, titleStyle }: PanelProps) {
  const headingId = `${id}-title`

  if (layout === 'stage') {
    const items = Children.toArray(children)
    const reflow = items.find((c) => isValidElement(c) && c.type === StageReflow)
    const stageItems = items.filter((c) => c !== reflow)

    return (
      <section id={id} aria-labelledby={headingId} className="panel stage-panel mt-6 scroll-mt-8 first:mt-0 sm:mt-0">
        {!titleBox && (
          <h2 id={headingId} className="sr-only">
            {title}
          </h2>
        )}
        <div className="stage-outer hidden sm:block" style={{ outlineColor: bg }}>
          <div className="stage" style={{ backgroundColor: bg }}>
            {stageItems}
            {/* Painted last (on top): every slide that layers a title over a
                decorative field (§6.2, §6.3) needs it in front, and no
                slide needs the reverse. */}
            {titleBox && (
              <StageItem {...titleBox}>
                {/* `whiteSpace: nowrap`: every measured title box (§6) is
                    sized to Figma's own font metrics for exactly one line.
                    The web-loaded Recursive variable font measures a hair
                    wider for some titles, which is enough to wrap a
                    same-width box — nowrap keeps the single line the
                    geometry assumes, at the cost of the (harmless) box
                    height slightly under-cropping true glyph descent. */}
                <h2 id={headingId} className={titleClassName} style={{ whiteSpace: 'nowrap', ...titleStyle }}>
                  {title}
                </h2>
              </StageItem>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border p-6 sm:hidden" style={{ backgroundColor: bg }}>
          {reflow}
        </div>
      </section>
    )
  }

  if (layout === 'cover') {
    return (
      <section
        id={id}
        aria-labelledby={headingId}
        className="panel flex flex-col items-center justify-center px-6 text-center"
      >
        <h2 id={headingId} className="sr-only">
          {title}
        </h2>
        {children}
      </section>
    )
  }

  const items = Children.toArray(children)
  const figure = items.find((c) => isValidElement(c) && c.type === PanelFigure)
  const rest = items.filter((c) => c !== figure)

  const prose = layout === 'full' ? <>{rest}</> : <EssayBody>{rest}</EssayBody>

  let content: ReactNode
  if ((layout === 'split' || layout === 'figure') && figure) {
    content = (
      <div className={LAYOUT_WRAP[layout]}>
        <div className={layout === 'split' ? 'sm:w-[40%] sm:shrink-0' : 'w-full max-w-md'}>{figure}</div>
        {prose}
      </div>
    )
  } else if (layout === 'full') {
    content = prose
  } else {
    content = <div className={LAYOUT_WRAP.prose}>{prose}</div>
  }

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'panel mt-16 scroll-mt-8 first:mt-8',
        tone === 'accent' && 'rounded-3xl border py-10 text-center sm:py-14',
      )}
      style={
        tone === 'accent'
          ? { borderColor: 'color-mix(in srgb, var(--essay-accent, var(--foreground)) 40%, transparent)' }
          : undefined
      }
    >
      <h2 id={headingId} className={cn(headingStyles.h2, 'mt-0')}>
        {title}
      </h2>
      {content}
    </section>
  )
}

export type PanelRef = { id: string; title: string }

/** The contents list under the piece header — see §8. Styled as the site's existing contents idiom (`ChapbookContents`). */
export function PanelContents({ panels }: { panels: PanelRef[] }) {
  if (panels.length === 0) return null
  return (
    <nav aria-label="Contents">
      <ol className="mt-8 space-y-1">
        {panels.map((p) => (
          <li key={p.id}>
            <a
              href={`#${p.id}`}
              className="font-brand block py-1 text-sm lowercase text-muted-foreground transition-colors hover:text-foreground"
            >
              {p.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * The panel sequence root — plain elements, no registry (§3.3). Hands the
 * client rail a serializable `{id,title}[]`, which is all it ever needed;
 * every payoff component stays server-rendered.
 */
export function Panels({ children }: { children: ReactNode }) {
  const panels = Children.toArray(children).filter(
    (c): c is ReactElement<PanelProps> => isValidElement(c) && c.type === Panel,
  )

  if (process.env.NODE_ENV !== 'production') {
    for (const c of Children.toArray(children)) {
      if (isValidElement(c) && c.type !== Panel) {
        const name = typeof c.type === 'function' ? (c.type.name ?? 'anonymous') : String(c.type)
        console.warn(`Panels: found a direct child that is not a <Panel> — ${name}`)
      }
    }
  }

  const rail = panels
    .filter((p) => p.props.rail !== false)
    .map(({ props }) => ({ id: props.id, title: props.title }))

  return (
    <>
      <PanelContents panels={rail} />
      {children}
      <PanelRail panels={rail} />
    </>
  )
}
