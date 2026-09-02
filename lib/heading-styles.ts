/**
 * The site's one heading scale — every `<h1>`–`<h5>` on the site, plus the
 * small-caps "eyebrow" label, reads from here rather than inventing its own
 * size at the call site. Previously each page picked whatever looked right
 * in isolation, which is how `h1` ended up smaller than `h2` on one page and
 * four different sizes across four others.
 *
 * **`h1` is the title; `h2` is a top-level content heading** — the piece
 * title (`app/work/[slug]/page.tsx` etc.) is the page's only `h1`, and an
 * essay's own `##` sections (`components/essay.tsx`'s `essayComponents.h2`)
 * are `h2`, one level down. `h1` needs to read as clearly dominant over the
 * `h2` sections beneath it, not just technically larger, so it keeps a real
 * display size (`text-2xl`) rather than being squeezed into the compressed
 * scale below it.
 *
 * **`h2` carries the weight, case, and colour the old `h3` used** — decided
 * with Beck 2026-09-02, in two passes: the instruction was first read as "h1
 * should look like old h3" and built that way, then corrected the same day
 * once Beck clarified the mapping — a title is `h1`; what's actually one
 * level below it, an essay's top-level section heading, is `h2`. Its size
 * moved once more the same day, from the old `h3`'s exact `text-lg` up to
 * `text-xl`, once Beck saw the whole scale live and wanted more size
 * differentiation between levels than the compressed version gave.
 *
 * `h3` moved with it, `text-sm` → `text-base`, for the same reason — the
 * scale was a size staircase at that point (24/20/16/14/12).
 *
 * **That staircase broke a harder rule, caught the same day: a heading
 * should never render smaller than the body text it introduces.** Body copy
 * (`EssayBody`) is `text-base` (16px); `h4` (14px) and `h5` (12px) sat below
 * it — a "heading" smaller than its own paragraph reads as a caption, not a
 * heading. Since `text-base` is also `h3`'s size, and there's no size left
 * between "16px" and "0" to keep every level distinct, `h3`, `h4`, and `h5`
 * now all sit at `text-base` and are told apart by weight and colour alone:
 * `h3` is `font-bold text-foreground/80`, `h4` is `font-semibold
 * text-foreground/70`, `h5` is `font-medium text-foreground/60`. `h1` and
 * `h2` keep their own sizes above body text (24px, 20px) — the floor only
 * binds once a level would otherwise cross below 16px.
 *
 * **The floor doesn't apply to `eyebrow`.** It's a small-caps chrome label
 * (`"work"`, `"about"`, `"chapbook"`, `"in this collection"`), decoupled
 * from the numbered scale on purpose (see "Headings" in ARCHITECTURE.md) —
 * not a content heading introducing body text below it. Below body size on
 * purpose, same as it always was.
 *
 * The two nameplate `h1`s (`beck qing` on the home page, "Hi, I'm Beck." on
 * `/about`) are deliberately NOT built from this scale — they are display
 * type under a small eyebrow, the same pattern as everywhere else on the
 * site, not a document title, and sizing them off this token would drag the
 * site's only two large headlines down with it.
 *
 * Margins are layout-specific and stay at the call site (a chapbook header
 * needs different spacing than a piece page); this only fixes the
 * typography — size, weight, case, colour, font.
 *
 * Lives in `lib/`, not `components/essay.tsx`, so both `essay.tsx` and
 * `work-visuals.tsx` can import it without creating a cycle — `essay.tsx`
 * already imports `WorkPlaceholder` from `work-visuals.tsx`.
 */
export const headingStyles = {
  eyebrow: 'font-brand text-xs uppercase tracking-[0.3em] text-muted-foreground',
  h1: 'font-brand text-2xl font-bold lowercase text-foreground/80',
  h2: 'font-brand mt-10 text-xl font-bold lowercase text-foreground/80',
  h3: 'font-brand mt-8 text-base font-bold lowercase text-foreground/80',
  h4: 'font-brand mt-6 text-base font-semibold lowercase text-foreground/70',
  h5: 'font-brand mt-4 text-base font-medium lowercase text-foreground/60',
} as const
