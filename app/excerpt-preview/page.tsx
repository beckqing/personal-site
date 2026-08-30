// A SCRATCH PREVIEW ROUTE, kept the way lib/work.sample.ts is kept: dev-only
// reference material, not a real page. Fabricated placeholder content, not
// Beck's — see the excerpts below. Unlike SAMPLE_WORK, the App Router has no
// data-level flag to hide behind (every route under app/ ships in every
// build), so the gate below does that job instead: this route 404s once
// NODE_ENV is 'production', the same condition SAMPLE_WORK is excluded on.
//
// <Excerpt> normally appears inside an MDX body, which needs a slug in
// MDX_BODY_SLUGS — and that list is asserted against WORK at build time, so a
// fixture slug there would break `pnpm build`. It is a plain server
// component, though, so it renders fine from an ordinary page. This is that
// page: the same excerpt in a few languages, so the token palette can be
// checked in both themes.
import { notFound } from 'next/navigation'
import { Excerpt } from '@/components/excerpt'
import { EssayBody } from '@/components/essay'

export default function ExcerptPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="font-brand text-3xl font-bold lowercase text-foreground/80">excerpt preview</h1>
      <p className="font-brand mt-2 text-sm lowercase text-muted-foreground">
        scratch route · delete app/excerpt-preview/ when done
      </p>

      <EssayBody className="mt-8">
        <p className="mt-4 text-pretty leading-relaxed text-foreground/85">
          The annotation is the prose, not a prop — a paragraph, then the lines it is about, then the
          next paragraph. Toggle the theme to check both palettes.
        </p>

        <Excerpt
          lang="js"
          from="field.js"
          lines="40–58"
          href="https://github.com/beckqing/archived-personal-site"
        >
          {`// the field itself — a comment, rendered italic
import { noise } from './field.js'

const SCALE = 0.01
const LIMIT = 100

export function field(x, y) {
  const label = 'flow'
  if (x > LIMIT) return null
  return noise(x * SCALE, y * SCALE) + 0.5
}`}
        </Excerpt>

        <p className="mt-4 text-pretty leading-relaxed text-foreground/85">
          A block with no <code>href</code>, so the caption is plain text rather than a link. Long
          lines scroll inside the block instead of pushing the page sideways.
        </p>

        <Excerpt lang="css" from="globals.css">
          {`/* the dual-theme selection that makes this block work at all */
.excerpt-block .shiki span {
  color: var(--shiki-light);
  font-style: var(--shiki-light-font-style, normal);
}
[data-theme='dark'] .excerpt-block .shiki span {
  color: var(--shiki-dark);
  font-style: var(--shiki-dark-font-style, normal);
}`}
        </Excerpt>

        <p className="mt-4 text-pretty leading-relaxed text-foreground/85">
          And one with no caption at all — just the lines.
        </p>

        <Excerpt lang="html">
          {`<iframe
  src="/code-demos/flow-field/index.html?theme=dark"
  title="flow field — interactive code demo"
  sandbox="allow-scripts"
  loading="lazy"
></iframe>`}
        </Excerpt>
      </EssayBody>
    </main>
  )
}
