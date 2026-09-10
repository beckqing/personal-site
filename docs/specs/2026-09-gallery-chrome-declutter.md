# Spec — gallery chrome declutter

> **Status: designed 2026-09-10 with Beck, not built.**
>
> The `/work` gallery's cards accumulated a lot of small competing chrome:
> `ImageCard` stacks `ArchiveMark`/`UnfinishedMark` in one corner and
> `FavoriteMark` in another, plus a separate speedpaint dot from
> `MediaBadges`; `TextCard`/`HybridCard` stack the same marks *and* the
> form pill in one vertical column that can run as tall as the quote glyph
> beside it. This spec consolidates all of that into one shared `StatusRail`
> component (one pill, up to three glyphs, one corner), widens and softens
> the floating title/medium chrome panel, and gets the medium/form pill back
> onto a single row instead of stacked above it. It also swaps the
> speedpaint badge's icon for a custom glyph (a counterclockwise ring with a
> play triangle inside it) in place of lucide's generic `CircleDot`.
>
> Touches `lib/work.ts`, `components/work-visuals.tsx`,
> `components/work-gallery.tsx`, and `components/media-player.tsx`; adds
> `components/speedpaint-icon.tsx`. No new route, no CSS file changes (all
> Tailwind utility classes), no changes to `lib/work.sample.ts` data.
> Supersedes nothing structural — `FavoriteMark` and `ArchiveMark` are
> deleted as components (folded into `StatusRail`'s icon map); `UnfinishedMark`
> stays, since `components/piece-column.tsx` still renders it standalone.
>
> **Explicitly out of scope for this pass** (see §7): the filter bar
> (tag chips, tier row, venn mode, sort/reset buttons), collection-page
> tiles (`ImageTile`/`TextTile`/`IllustratedTile`), the chapbook stack, and
> a column-width toggle — Beck raised the toggle as an idea but asked to
> skip it here.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| Which icons are "competing for space" | **The corner badge cluster** (favorite/archive/unfinished/speedpaint marks) — not the filter bar, not the medium/form pill itself | Beck, 2026-09-10 |
| How to fix the corner cluster | **One shared `StatusRail`** — a single pill holding up to three small icons, replacing up to three separately-styled floating pills | This spec, from Beck's answer |
| What "wider and more subtle" means for the title/medium chrome panel | **Same floating-panel idiom, wider max-width, translucent/blurred fill instead of solid, lighter shadow and border** — not a full-bleed edge-to-edge bar, not just a bigger version of the exact same solid panel | Beck, 2026-09-10 |
| Where the medium/form pill goes | **Stays a `TagPill`, unchanged visually.** The bug was never the pill's own width — it's `shrink-0` already — it's that on `TextCard`/`HybridCard` it sat at the bottom of a `flex-col` stack with up to three mark icons above it, so the *group* read as tall. Fix: flatten that stack into one row | Beck, 2026-09-10 (clarifying) |
| Column-width toggle | **Out of scope for this pass** — spec only the card/chrome rework now | Beck, 2026-09-10 |
| Speedpaint badge icon | **Replace lucide's `CircleDot`** with a custom glyph: a counterclockwise arrow ring with a small play triangle centered inside it | Beck, 2026-09-10 (raised mid-spec) |
| Whether `favorite`/`archive` can both show on one item | **No — they can't.** `tierOf()` returns exactly one `WorkTier`; `isFavorite`/`isArchived` are mutually exclusive by construction. `StatusRail` never renders more than one tier glyph, so its real ceiling is 3 icons (tier, `unfinished`, `speedpaint`), not 4 | Existing code, `lib/work.ts:383` |
| Filter bar restyling | **Not touched.** Beck's answer named the card corner cluster specifically; a "cards AND filter bar" option was offered and not chosen | Beck, 2026-09-10 |

---

## 1. `StatusRail` — one corner, one pill, up to three glyphs

### 1.1 Data: `statusFlagsFor()` in `lib/work.ts`

```ts
export type StatusFlag = 'favorite' | 'archive' | 'unfinished' | 'speedpaint'

/**
 * Which status flags apply to an item, in fixed display order. `favorite`
 * and `archive` are mutually exclusive (both come from the single-valued
 * `tierOf()`), so at most one of the two is ever present — the practical
 * ceiling is 3 flags (tier, unfinished, speedpaint), not 4.
 */
export function statusFlagsFor(item: WorkItem): StatusFlag[] {
  const flags: StatusFlag[] = []
  if (isFavorite(item)) flags.push('favorite')
  else if (isArchived(item)) flags.push('archive')
  if (item.unfinished) flags.push('unfinished')
  if (hasSpeedpaint(item)) flags.push('speedpaint')
  return flags
}
```

Place it directly below `isArchived()` (`lib/work.ts:389`), since it's built from exactly those checks plus `hasSpeedpaint` (already defined at `lib/work.ts:439` — `statusFlagsFor` must be declared after it, or hoisted; simplest is to put `statusFlagsFor` after `hasSpeedpaint` instead, immediately above `hasAnimation`).

`else if` (not two independent `if`s) is deliberate — it's what encodes the mutual-exclusivity invariant in the function itself rather than leaving it as a fact callers have to already know.

### 1.2 Rendering: `StatusRail` in `work-visuals.tsx`

```tsx
import { SpeedpaintIcon } from '@/components/speedpaint-icon'
// Archive, Hourglass already imported in this file; HeartIcon already imported.

const STATUS_ICON: Record<
  StatusFlag,
  { Icon: ComponentType<SVGProps<SVGSVGElement>>; label: string }
> = {
  favorite: { Icon: HeartIcon, label: "Favorite — one of Beck's favorites" },
  archive: { Icon: Archive, label: 'Archived — out of the default browse, still published' },
  unfinished: { Icon: Hourglass, label: 'In progress' },
  speedpaint: { Icon: SpeedpaintIcon, label: 'Includes a speedpaint video' },
}

/**
 * The single home for every status glyph that used to be its own
 * absolutely-positioned corner pill (`FavoriteMark`, `ArchiveMark`,
 * `UnfinishedMark`, and `MediaBadges`' speedpaint dot) — one shared pill
 * holding up to three small icons instead of up to three separately
 * blurred/backgrounded pills competing for the same corner(s). A future
 * status flag joins `StatusFlag` + `STATUS_ICON` + `statusFlagsFor()`; it
 * does not get its own corner pill.
 *
 * `favorite` is the only flag that takes `tone` — the rest stay neutral
 * `text-muted-foreground`, matching what the three deleted mark components
 * did individually. The heart keeps its `stroke="var(--background)"` seam
 * (see the old `FavoriteMark` comment this replaces): a same-color stroke
 * blends the heart's two lobes into a blob, so it's stroked in the page
 * background instead to cut a visible seam along every edge.
 */
export function StatusRail({
  flags,
  tone,
  className,
}: {
  flags: StatusFlag[]
  /** Tint for the favorite glyph specifically. Ignored for the other flags. */
  tone?: string
  className?: string
}) {
  if (flags.length === 0) return null
  return (
    <div
      role="group"
      aria-label="Status"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background/80 px-1.5 py-1 backdrop-blur-sm',
        className,
      )}
    >
      {flags.map((flag) => {
        const { Icon, label } = STATUS_ICON[flag]
        const isFavorite = flag === 'favorite'
        return (
          <span
            key={flag}
            title={label}
            aria-label={label}
            className={cn('inline-flex items-center justify-center', !isFavorite && 'text-muted-foreground')}
            style={isFavorite ? { color: tone } : undefined}
          >
            <Icon
              className="h-3.5 w-3.5"
              strokeWidth={1.75}
              aria-hidden="true"
              {...(isFavorite ? { fill: 'currentColor', stroke: 'var(--background)' } : {})}
            />
          </span>
        )
      })}
    </div>
  )
}
```

Delete `FavoriteMark` and `ArchiveMark` entirely (`work-visuals.tsx:115–168`) — after §1.3/§1.4's edits below, neither has any remaining caller. **Keep `UnfinishedMark`** (`work-visuals.tsx:86–98`) — `components/piece-column.tsx` renders it standalone on the home page's discipline columns, which this spec doesn't touch.

### 1.3 Call sites in `work-gallery.tsx`

**`ImageCard`** (`work-gallery.tsx:431–566`): replace the two existing corner blocks —

```tsx
// before
<div className={cn('absolute left-3 z-20 flex items-center gap-2', codeDemo ? 'top-[calc(0.75rem+2rem)]' : 'top-3')}>
  {isArchived(item) && <ArchiveMark />}
  {item.unfinished && <UnfinishedMark />}
</div>
{isFavorite(item) && (
  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
    <FavoriteMark tone={toneFor(item)} />
  </div>
)}
```

with one rail, top-left only (dropping the separate bottom-left favorite corner):

```tsx
// after — compute once near `const medium = mediumFor(item)`
const statusFlags = statusFlagsFor(item)
// …
{statusFlags.length > 0 && (
  <div className={cn('absolute left-3 z-20', codeDemo ? 'top-[calc(0.75rem+2rem)]' : 'top-3')}>
    <StatusRail flags={statusFlags} tone={toneFor(item)} />
  </div>
)}
```

The `codeDemo` vertical offset (pushing the rail down below the state rail) is preserved unchanged — it's still the same conditional, just applied to one wrapper instead of one-of-two.

Also pass `showSpeedpaintBadge={false}` to `<MediaBadges item={item} />` (§1.4) — `StatusRail` now carries that fact, so `MediaBadges`' own corner dot would double it up.

**`CollectionTile`** (`work-gallery.tsx:359–401`): replace —

```tsx
// before
{isArchived(item) && (
  <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
    <ArchiveMark />
  </div>
)}
{isFavorite(item) && (
  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
    <FavoriteMark tone={toneFor(item)} />
  </div>
)}
```

with:

```tsx
// after
{statusFlagsFor(item).length > 0 && (
  <div className="absolute left-3 top-3 z-20">
    <StatusRail flags={statusFlagsFor(item)} tone={toneFor(item)} />
  </div>
)}
```

This incidentally makes `CollectionTile` check `unfinished`/`speedpaint` for the first time (it never did before — only `ImageCard` did). No current collection sets either, so this is inert today, but it's the correct generalization now that both card types share one status function; call it out in the PR description as a deliberate side effect, not a bug.

**`TextCard`** (`work-gallery.tsx:243–294`) and **`HybridCard`** (`work-gallery.tsx:303–344`) — both have the identical block; change it identically in both places:

```tsx
// before
<div className="flex flex-wrap items-start gap-3">
  <Quote ... />
  <div className="ml-auto flex flex-col items-end gap-2">
    {isFavorite(item) && <FavoriteMark tone={tone} />}
    {isArchived(item) && <ArchiveMark />}
    {item.unfinished && <UnfinishedMark />}
    <TagPill>{formFor(item)}</TagPill>
  </div>
</div>
```

```tsx
// after — flex-col → flex (row); StatusRail added beside TagPill instead of
// three marks stacked above it
<div className="flex flex-wrap items-start gap-3">
  <Quote ... />
  <div className="ml-auto flex items-center gap-2">
    <StatusRail flags={statusFlagsFor(item)} tone={tone} />
    <TagPill>{formFor(item)}</TagPill>
  </div>
</div>
```

This is the concrete fix for "the pill shouldn't take up a whole column of space": the group to the right of `Quote` is one row now (rail + pill, plain `items-center`), not a `flex-col` stack that could run three icons deep before the pill even started.

### 1.4 `MediaBadges` — suppress the now-redundant speedpaint dot

`components/media-player.tsx:39`. Add a prop, default `true` so every other call site (`ImageTile`, `IllustratedTile` in `work-visuals.tsx` — both out of scope, both untouched) keeps its current behavior with zero edits:

```tsx
export function MediaBadges({
  item,
  showSpeedpaintBadge = true,
}: {
  item: WorkItem
  /**
   * false suppresses the corner speedpaint badge (and its sr-only mention)
   * — for a caller that already surfaces the same fact through
   * `StatusRail`, so the two don't announce it twice. The animation Play
   * overlay is unaffected.
   */
  showSpeedpaintBadge?: boolean
}) {
  const speedpaint = hasSpeedpaint(item) && showSpeedpaintBadge
  const animation = hasAnimation(item)
  const codeDemo = isCodeDemo(item)
  // …unchanged from here — `speedpaint` being false already skips both the
  // sr-only fact and the visual badge, since both read the same const.
```

Only the `const speedpaint = …` line changes; everything below it (the `facts` array, the JSX) is untouched and correctly reads the now-gated value.

---

## 2. Chrome panel — wider, translucent, lighter shadow

Applies to the two sticky floating panels that use this exact idiom: `ImageCard`'s title/medium bar (`work-gallery.tsx:547`) and `CollectionTile`'s title/description bar (`work-gallery.tsx:381`). `TextCard`/`HybridCard`'s title line (`CardTitleRow`) is a different mechanism — a plain always-visible text line, not a hover-reveal floating panel — and is unaffected by this section.

```tsx
// before (both call sites, same class string)
className="sticky bottom-4 mx-auto ... max-w-[min(85%,20rem)] rounded-xl border border-border bg-card p-4 opacity-0 shadow-lg transition-all duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
```

```tsx
// after
className="sticky bottom-4 mx-auto ... max-w-[min(94%,28rem)] rounded-xl border border-border/60 bg-card/75 p-4 opacity-0 shadow-sm backdrop-blur-md transition-all duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
```

(`...` stands for whatever's already between `mx-auto` and `max-w-` at each call site — `ImageCard`'s also has `flex w-full items-end justify-between gap-3`, `CollectionTile`'s has `w-full`. Neither changes.)

Four changes, each independent and each a plain value swap:

- `max-w-[min(85%,20rem)]` → `max-w-[min(94%,28rem)]` — meaningfully wider while still leaving a visible margin so the panel doesn't touch the card's rounded corners edge-to-edge.
- `bg-card` → `bg-card/75` plus a new `backdrop-blur-md` — translucent instead of solid, reading as a soft glass panel over the image rather than an opaque card sitting on top of it.
- `shadow-lg` → `shadow-sm` — lighter lift; not dropped entirely, since with no shadow at all the panel can lose separation from a busy/light image behind it.
- `border-border` → `border-border/60` — same border width, lower-contrast so it reads as a hairline rather than a hard edge.

These four values are a starting point tuned by description, not by eye — treat them as the spec's default and nudge by eye once rendered (this is explicitly a visual judgment call, not a functional one). Nothing about the sticky/hover mechanics, z-index, or the `pointer-events-auto` children changes.

---

## 3. Speedpaint icon — `components/speedpaint-icon.tsx`

New file, following the existing `heart-icon.tsx` convention (a hand-assembled `<svg>` built from real, named path data rather than an invented shape). Built from lucide-react's own `rotate-ccw` and `play` path data (`node_modules/.pnpm/lucide-react@1.17.0_react@19.2.4/node_modules/lucide-react/dist/esm/icons/{rotate-ccw,play}.mjs`), so the ring and the triangle are each pixel-faithful to their lucide originals — just composed into one glyph instead of two.

```tsx
import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

// "This piece has a speedpaint video" — a counterclockwise rewind ring
// (lucide's rotate-ccw path, stroked) with a small play triangle (lucide's
// play path, filled, scaled 0.5 and centered) nested inside it, replacing
// the generic CircleDot this used to be. Both paths are lucide-react's own,
// just composed into one glyph instead of two separate icons.
export function SpeedpaintIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <g transform="translate(12 12) scale(0.5) translate(-12 -12)" fill="currentColor" stroke="none">
        <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
      </g>
    </svg>
  )
}
```

The `scale(0.5)` centering is a starting point, same caveat as §2's chrome values — nudge it by eye once rendered if the triangle reads too large/small inside the ring; this is not load-bearing on anything else.

Two call sites change to use it, both a one-line swap of `CircleDot` → `SpeedpaintIcon`:

- `work-visuals.tsx`'s `STATUS_ICON.speedpaint` (§1.2, already written above).
- `media-player.tsx:75`, the `MediaBadges` corner badge itself (the JSX inside `{speedpaint && showSpeedpaintBadge && (…)}` after §1.4's edit — replace its `<CircleDot .../>` with `<SpeedpaintIcon .../>`, same `className`/`strokeWidth`).

**Do not touch `media-player.tsx:357`** — that's `SpeedpaintPlayer`'s own scrubber marker (a decorative dot next to the seek bar inside the player itself), a different fact (playback position) from "this piece has a speedpaint," and out of scope here. `CircleDot` stays imported for that one use.

---

## 4. File/module structure summary

| File | Change |
| --- | --- |
| `lib/work.ts` | Add `StatusFlag` type and `statusFlagsFor()`, placed after `hasSpeedpaint()` |
| `components/speedpaint-icon.tsx` | **New.** `SpeedpaintIcon` component (§3) |
| `components/work-visuals.tsx` | Add `StatusRail` + `STATUS_ICON` (§1.2); delete `FavoriteMark`, `ArchiveMark`; import `SpeedpaintIcon`; wire `STATUS_ICON.speedpaint` to it |
| `components/work-gallery.tsx` | `ImageCard`, `CollectionTile`, `TextCard`, `HybridCard`: swap corner-mark JSX for `StatusRail` calls (§1.3); apply §2's chrome-panel class changes to `ImageCard` and `CollectionTile`; remove now-unused `ArchiveMark`/`FavoriteMark` imports, add `StatusRail`/`statusFlagsFor` imports |
| `components/media-player.tsx` | `MediaBadges` gains `showSpeedpaintBadge` prop (§1.4); swap its `CircleDot` for `SpeedpaintIcon` (§3) |

No changes to `masonry-grid.tsx`, `lib/work.sample.ts`, any route file, or `globals.css`.

---

## 5. Edge cases

- **An item with all three flags at once** (e.g. archived + unfinished + speedpaint) — `StatusRail` renders three icons in one pill; this is the realistic ceiling (favorite/archive can't co-occur, §0). Not currently hit by any sample data, but the component must not assume fewer than 3.
- **`general`-tier item with no other flags** — `statusFlagsFor()` returns `[]`, `StatusRail` returns `null`, and the wrapping `{statusFlags.length > 0 && (...)}` in each call site renders nothing at all — no empty pill, matching the current behavior where an unmarked item shows no corner chrome.
- **`TextCard`/`HybridCard`'s narrow-column overflow guard.** The doc comment at `work-gallery.tsx:252–259` explains that `flex-wrap` + `ml-auto` (not `justify-between`) on the `Quote`+badges row exists because the old 4-item `flex-col` stack could, at a ~130px paired column, register a few px of phantom scrollable overflow. §1.3 changes that stack to a 2-item row (`StatusRail` + `TagPill`), which is narrower in the worst case, not wider — but re-verify at the narrowest column width (§9.3's `@max-3xs/card`, 256px, and the paired ~130px mobile column) that this is still true rather than assuming it. If it no longer overflows, the `ml-auto`/`flex-wrap` combination can likely simplify to `justify-between`, but that's a cleanup, not a requirement — leaving it as-is is also correct and costs nothing.
- **Speedpaint badge shown twice.** Guard against regressing this: any `ImageCard` with `hasSpeedpaint(item) === true` must show the glyph exactly once (in `StatusRail`, via `showSpeedpaintBadge={false}` on its `MediaBadges` call) — not zero times (forgetting the flag in `statusFlagsFor`) and not twice (forgetting the prop).
- **`CollectionTile` now reads `unfinished`/`speedpaint` for the first time** (noted in §1.3) — confirm no sample collection unexpectedly grows a corner badge it didn't have before; if one does, that's `statusFlagsFor` correctly surfacing a fact `CollectionTile` was previously silently dropping, not a bug to suppress.
- **`aria-label="Status"` on an empty rail** — never happens; the `flags.length === 0` early return in `StatusRail` means the `role="group"` wrapper is never mounted with zero children.
- **RTL / very long favorite tone strings** — unaffected; `tone` is a CSS color value passed straight to `style.color`, same as the deleted `FavoriteMark` did.

---

## 6. Out of scope (this pass)

- **The filter bar** — `TagChip`/`TagRow`, `TierRow`, `VennMode`, the sort and reset buttons. Beck's answer named the card corner cluster specifically, not the filter bar; a combined option was offered and declined.
- **Collection-page tiles** — `ImageTile`, `TextTile`, `IllustratedTile` (`work-visuals.tsx`), and their `WriteupMark`/`GuessTileMark` badges. These aren't part of the top-level `/work` gallery this conversation was about.
- **The chapbook stack** (`ChapbookStack`) and plain collection stack (`CollectionStack`)'s own internals — only `CollectionTile`'s corner badges and title chrome (which wrap the stack, not the stack itself) are touched.
- **A column-width toggle.** Beck raised this as a possible addition ("is that too much??") and then chose to skip it for this pass. It would need its own spec — at minimum: how many steps, where the control lives, whether the choice is a personal display preference (`localStorage`, unaffected by sharing a link) or shareable filter state (URL query param, consistent with `tags`/`sort`/`tiers`), and how it interacts with `useMasonryColumns()` and the pin count in `splitPinned()` (`work-gallery.tsx:872–877`), which is already keyed to the live column count. Flagged here so it isn't lost, not designed here.
- **Any change to `TagPill`'s own visual styling** (padding, border, font-size). Beck's answer was explicit that the pill itself is fine — only its layout context was the problem.

---

## 7. ARCHITECTURE.md — recommendation

**Worth an entry, but not yet.** This repo's own convention (see "Discipline columns," `docs/ARCHITECTURE.md:1362`, which opens "Built 2026-09-03 from [spec]") is to fold a spec into `ARCHITECTURE.md` once it's actually built, not at design time — the tiers-and-pins spec (`docs/specs/2026-09-tiers-and-pins.md`) was built (see the git log's "Implement tiers and pins") and still has no `ARCHITECTURE.md` entry yet, so a not-yet-implemented spec getting one first would be out of step with how this repo has actually been doing it.

The reason it's worth one at all: `StatusRail` is a new invariant future work has to know about — a future badge (there will be one eventually) needs to join `StatusFlag`/`STATUS_ICON`/`statusFlagsFor()` rather than becoming a fourth absolutely-positioned corner pill, the same way `opensInGalleryLightbox()` is documented as "one predicate, and it must stay one." That's exactly the kind of easy-to-silently-regress rule this file's "Component layers" section exists to record.

Draft, to add to the `work-visuals.tsx` bullet under "Component layers" once this ships:

> **Every card's status glyphs (favorite/archive/unfinished/speedpaint) render
> through one component, `StatusRail`, and it must stay one.** A card used to
> stack up to four separately-styled corner pills (`FavoriteMark`,
> `ArchiveMark`, `UnfinishedMark`, plus `MediaBadges`' own speedpaint dot);
> now `statusFlagsFor()` (`lib/work.ts`) computes which flags apply — at most
> one of `favorite`/`archive` (they're mutually exclusive; `tierOf()` returns
> exactly one `WorkTier`), plus optionally `unfinished` and `speedpaint` — and
> `StatusRail` renders all of them in one shared pill. A new status fact joins
> `StatusFlag` and `STATUS_ICON`'s lookup table; it does not get a new corner.
> `MediaBadges` keeps a `showSpeedpaintBadge` escape hatch (default `true`)
> for callers that don't route speedpaint through `StatusRail` — `ImageCard`
> is the one caller that sets it `false`, since it already shows the fact via
> the rail and would otherwise show it twice.
