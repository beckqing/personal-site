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
 * `h2` sections beneath it, not just technically larger.
 *
 * **A heading never renders smaller than the body text it introduces.** Body
 * copy (`EssayBody`) is `text-base` (16px), so 16px is the floor for every
 * numbered level — a "heading" smaller than its own paragraph reads as a
 * caption. That floor is what makes the scale's *top* matter: with only
 * 16px of room between the floor and the old 24px `h1`, `h3`/`h4`/`h5` had
 * all been squeezed onto `text-base` and were told apart by weight and
 * colour alone, which is about as far as that distinction stretches.
 *
 * **2026-09-02, final pass: the whole ladder moved up one step**, on Beck's
 * "all the headings can also be increased in size a little." Raising the top
 * is what bought back the room at the bottom — the scale is five distinct
 * sizes again (30/24/20/18/16) rather than two sizes doing five levels of
 * work, and `h3`, `h4`, and `h5` no longer depend on weight and colour to be
 * told apart. They keep the weight and colour ladder anyway, as
 * reinforcement rather than as the whole signal.
 *
 * `h1` is the one responsive step: `text-2xl sm:text-3xl`. The longest piece
 * title in `lib/work.ts` is 46 characters ("emoji poetry, translated from
 * chinese"), which sets three lines at 30px on a phone, so mobile keeps the
 * pre-2026-09-02 size and only desktop takes the increase.
 *
 * Earlier passes the same day, for the record: `h1` and `h2` were first built
 * backwards (the instruction "whatever size h3 is should become h1" was read
 * literally), then corrected once Beck saw it live — a title is `h1`, an
 * essay's top-level `##` section is `h2`. Then both grew once the whole scale
 * was visible together and read as too compressed. This pass is the third and
 * largest of those corrections.
 *
 * **The floor doesn't apply to `eyebrow`.** It's a small-caps chrome label
 * (`"work"`, `"about"`, `"chapbook"`, `"in this collection"`), decoupled
 * from the numbered scale on purpose (see "Headings" in ARCHITECTURE.md) —
 * not a content heading introducing body text below it. Below body size on
 * purpose, same as it always was. Note it is applied to real `<h2>` elements
 * in two places (`app/work/[slug]/page.tsx`, `components/work-visuals.tsx`);
 * that is deliberate, and those headings do not move with this scale.
 *
 * The two nameplate `h1`s (`beck qing` on the home page, "Hi, I'm Beck." on
 * `/about`) are deliberately NOT built from this scale — they are display
 * type under a small eyebrow, the same pattern as everywhere else on the
 * site, not a document title, and sizing them off this token would drag the
 * site's only two large headlines down with it. At `text-5xl sm:text-7xl`
 * and `text-4xl sm:text-6xl` they stay well clear of `h1`'s new 30px.
 *
 * Vertical rhythm (`mt-*` on `h2`–`h5`) is the default spacing MDX headings
 * need and lives here with them; layout-specific margins still belong at the
 * call site (a chapbook header needs different spacing than a piece page).
 *
 * Lives in `lib/`, not `components/essay.tsx`, so both `essay.tsx` and
 * `work-visuals.tsx` can import it without creating a cycle — `essay.tsx`
 * already imports `WorkPlaceholder` from `work-visuals.tsx`.
 */
export const headingStyles = {
  eyebrow: 'font-brand text-xs uppercase tracking-[0.3em] text-muted-foreground',
  h1: 'font-brand text-2xl sm:text-3xl font-bold lowercase text-foreground/80',
  h2: 'font-brand mt-10 text-2xl font-bold lowercase text-foreground/80',
  h3: 'font-brand mt-8 text-xl font-bold lowercase text-foreground/80',
  h4: 'font-brand mt-6 text-lg font-semibold lowercase text-foreground/70',
  h5: 'font-brand mt-4 text-base font-medium lowercase text-foreground/60',
} as const
