// SERVER ONLY. Imports Shiki, which is a build-time dependency and has no
// business in a browser bundle. Kept out of components/essay.tsx (and so out
// of mdx-components.tsx's global map) deliberately: only the MDX bodies that
// actually show code should pull the highlighter into their graph. Import it
// explicitly from the .mdx file, the same way <Item> and <MarketHeader> are.
import { codeToHtml, type ThemeRegistrationRaw } from 'shiki'
import { cn } from '@/lib/utils'

/**
 * Shiki's themes are plain JSON, so the code block gets the site's own
 * palette rather than a stock one — every colour here is a declared token
 * from app/globals.css, copied as a literal because a TextMate theme emits
 * inline colours and cannot read a CSS custom property.
 *
 * Keep these in sync with globals.css by hand; there is no mechanism that
 * can do it, and a drifted hex here is a wrong colour, not a broken build.
 *
 * **The light/dark split is the hero icon collage's swap, run backwards.**
 * Each brand hue has a standard value and a brighter "-alt" — denim/sky,
 * emerald/spring-green, pumpkin/goldenrod (validated on the archived site;
 * see "Homepage icon collage"). The hero icons take the *alt* in light mode
 * and the *standard* in dark. Code wants the opposite: the deepened standard
 * hue on the pale ground, the bright alt on midnight, because a code block is
 * dense small text rather than a big watermark glyph, and the standard hues
 * land near 2:1 against #080b24.
 *
 * Strings are the exception: terracotta has no alt, so dark mode borrows
 * `--writing` instead. See the DARK block below.
 */
const SCOPES = {
  keyword: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier', 'variable.language'],
  string: ['string', 'string.quoted', 'string.template', 'constant.character.escape'],
  constant: ['constant.numeric', 'constant.language', 'constant.other', 'support.constant'],
  fn: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.name.type'],
  comment: ['comment', 'punctuation.definition.comment'],
} as const

function theme(
  name: string,
  type: 'light' | 'dark',
  t: { foreground: string; comment: string; keyword: string; string: string; constant: string; fn: string },
): ThemeRegistrationRaw {
  return {
    name,
    type,
    colors: { 'editor.foreground': t.foreground, 'editor.background': '#00000000' },
    settings: [
      { settings: { foreground: t.foreground } },
      { scope: [...SCOPES.comment], settings: { foreground: t.comment, fontStyle: 'italic' } },
      { scope: [...SCOPES.keyword], settings: { foreground: t.keyword } },
      { scope: [...SCOPES.string], settings: { foreground: t.string } },
      { scope: [...SCOPES.constant], settings: { foreground: t.constant } },
      { scope: [...SCOPES.fn], settings: { foreground: t.fn } },
    ],
  }
}

/** globals.css `:root` — the daylight palette, at its deepened text values. */
const LIGHT = theme('beck-daylight', 'light', {
  foreground: '#080b24', // --foreground
  comment: '#69635e', // --muted-foreground
  keyword: '#97671a', // --goldenrod, deepened for a light ground
  string: '#8c3623', // --terracotta
  constant: '#305789', // --denim (standard)
  fn: '#2f7d45', // --science, deepened emerald
})

/** globals.css `[data-theme='dark']` — the night-owl palette, at its alts. */
const DARK = theme('beck-night-owl', 'dark', {
  foreground: '#ced2cd', // --foreground
  comment: '#a79f99', // --muted-foreground
  keyword: '#d9aa52', // --goldenrod — already the pumpkin pair's alt
  // --writing (pumpkin pie), not --terracotta: terracotta is the one brand hue
  // with no brighter alt, and it sits at 2.32:1 on midnight. Decided by Beck
  // 2026-08-29 — reuse an existing token rather than mint a terracotta alt.
  string: '#bf712c',
  constant: '#68bfed', // --sky, denim's alt
  fn: '#aadb6c', // --spring-green, emerald's alt
})

/**
 * An annotated code excerpt, interleaved with an MDX body's prose. Opt-in per
 * piece and never a section the layout reserves: a piece that wants to show
 * three lines shows three lines where they matter, and a piece that shows
 * none looks like it was never a possibility.
 *
 * **The annotation is the surrounding prose**, not a prop — a paragraph, then
 * the lines it is about, then the next paragraph. A `caption` prop would
 * invite writing the explanation inside a string and losing the essay
 * typography.
 *
 * `from` and `lines` render as a small mono caption above the block, so the
 * excerpt is honest about being an excerpt. `href` is optional and links to
 * the full source at that range.
 *
 * Highlighted by Shiki at build time — it runs in the server component and
 * ships zero client JS, which on a fully static site is free.
 */
export async function Excerpt({
  lang = 'text',
  from,
  lines,
  href,
  children,
  className,
}: {
  lang?: string
  from?: string
  lines?: string
  href?: string
  children: string
  className?: string
}) {
  const code = children.replace(/\n+$/, '')
  const html = await codeToHtml(code, {
    lang,
    themes: { light: LIGHT, dark: DARK },
    // No inline `color`; each span carries --shiki-light/--shiki-dark and
    // globals.css picks between them on [data-theme]. The site uses a
    // data-theme attribute, not prefers-color-scheme, so the media-query
    // variant of this pattern would not work.
    defaultColor: false,
  })

  const label = [from, lines].filter(Boolean).join(' · ')

  return (
    <figure className={cn('mt-6', className)}>
      {label && (
        <figcaption className="font-brand mb-1.5 text-xs lowercase text-muted-foreground">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="rounded underline decoration-transparent underline-offset-2 outline-none transition-colors hover:decoration-current focus-visible:ring-2 focus-visible:ring-ring"
              style={{ color: 'var(--goldenrod)' }}
            >
              {label}
            </a>
          ) : (
            label
          )}
        </figcaption>
      )}
      {/* Scrolls horizontally in its own container. Code never wraps. */}
      <div
        className="excerpt-block overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  )
}
