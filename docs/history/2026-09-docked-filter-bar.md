# Spec — docked filter bar

> **Status: built 2026-09-10.** Moved here from `docs/specs/` per §8.
>
> The `/work` filter panel is now one bordered block at the top of the page
> ([2026-09-filter-panel.md](2026-09-filter-panel.md), built the same day).
> Once the reader has scrolled past it there is no way back short of
> scrolling to the top of a 28-entry masonry.
>
> **Diverged in two small, mechanical ways, both forced by the extraction
> itself rather than chosen:**
>
> - **§3's `FilterPanelContent` owns its own `space-y-3 sm:space-y-4`**
>   rather than leaving that to each caller. The spec's own code sample has
>   the in-flow panel's wrapper supply it (`<div className="space-y-3
>   rounded-2xl border ... sm:space-y-4 ...">`) and says nothing about the
>   docked expansion's wrapper, which in the spec's §4.1 sample has none —
>   meaning the expansion's toolbar and chip rows would render flush against
>   each other with no gap. Moving the spacing into the shared component
>   itself (still no border/fill/padding — just the row-to-row rhythm) fixes
>   that for both mounts at once and is the only way the same component
>   reads correctly in both shells.
> - **A new `onChipSlackChange` callback**, not in the spec. §3 doesn't
>   mention the filter-panel spec's own chip-block height reservation at
>   all — reasonably, since that mechanism postdates this spec's own
>   authoring earlier the same day. That reservation splits in half (see
>   [2026-09-filter-panel.md](2026-09-filter-panel.md)'s own divergence
>   notes): half renders as the panel's trailing padding, half as margin
>   *outside* the panel's border, reported upward so `WorkGallery` can render
>   it as a sibling. Since `FilterPanelContent` now mounts twice with two
>   independent layouts to measure, that reporting had to become a prop
>   (`onChipSlackChange`) rather than component-external state — passed by
>   the in-flow mount, left unset by the docked expansion's mount, which has
>   no zero-shift guarantee to keep (nothing is positioned relative to a
>   capped, scrolling overlay's bottom edge) and so needs no outside half.
>
> This adds a slim bar that docks directly beneath the site nav when the
> reader scrolls back up, carrying the search field and a filter glyph badged
> with the active tag count. Tapping the glyph unfolds the whole panel in
> place, without losing scroll position.
>
> Touches `components/work-gallery.tsx` and `components/site-nav.tsx`. No new
> files, no new route, no CSS file changes, no data changes.
>
> **Builds directly on the filter-panel spec** and assumes it has shipped —
> `SortToggle`, `ResetButton`, `TierRow`, `VennMode`, `TagRow`,
> `MAX_DISCIPLINE_CHIPS`, `EMPTY_TAG_SET`/`noop`, the two-chip-row ghost
> reservation, and the relocated count are all present and unchanged here.
>
> **Explicitly out of scope** (see §6): sort/tier/venn/reset on the compact
> row, a full-page scrim or any modal semantics, scroll-spy highlighting,
> a scroll-to-top control, and any change to the in-flow panel's own layout.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| Where it sits | **Docked beneath the site nav** — a slim sticky bar spanning the same `max-w-6xl`, sliding in on scroll-up. Not a floating pill | Beck, 2026-09-10 |
| What tapping the glyph does | **Unfolds the panel in place**, keeping scroll position — not a scroll back up to the real panel | Beck, 2026-09-10 |
| What rides on the compact row | **Search field and a filter glyph with the active tag count.** No sort, no tier row, no venn, no reset — those appear only in the unfolded panel | Beck, 2026-09-10 |
| Modal or not | **Non-modal disclosure.** No focus trap, no scroll lock, no scrim. The bar's own translucent-blurred fill is what dims content behind the expansion — the visual effect Beck picked, without the semantics | This spec |
| How the nav's height is known | **Measured and published as `--nav-h`.** The nav wraps to two lines below ~363px (`site-nav.tsx:34–46` documents this), so a hardcoded offset would tuck the bar under it on exactly the narrow screens where space is tightest | This spec |
| Whether the panel body is duplicated | **No — extracted and mounted twice.** All filter state is URL state, so a second mount of the same controls has nothing to keep in sync | This spec |
| What the badge counts | **Tags only** (`selectedTags.size`), as asked. The glyph separately takes the goldenrod active treatment whenever `activeCount > 0`, so a non-default tier selection or an active query isn't invisible | Beck (badge), this spec (glyph tint) |

---

## 1. Reveal rule

```
revealed = panelOffscreen && (scrollingUp || dockedOpen)
```

- **`panelOffscreen`** — the in-flow panel has left the viewport entirely.
  Measured with an `IntersectionObserver` on the panel element, not a scroll
  threshold: the panel's height changes with viewport width (its chip rows
  wrap, and the ghost reservation grows with them), so any fixed pixel
  threshold is wrong at most widths.
- **`scrollingUp`** — so the bar retracts while reading downward and returns
  when the reader reverses.
- **`|| dockedOpen`** — once unfolded, the bar ignores scroll direction
  entirely. Retracting an open panel out from under someone scrolling to
  reach a chip would be hostile.
- When `panelOffscreen` goes false, the bar retracts **and** `dockedOpen` is
  forced to `false`, so there are never two open panels on screen.

Both inputs start in their SSR-safe state (`'up'` and `false`), so the first
client render agrees with the server render and the bar is retracted on load —
which is also correct, since the panel is on screen at the top of the page.

---

## 2. `--nav-h` — `components/site-nav.tsx`

`SiteNav` publishes its measured height. This is the only change to the file.

```tsx
const headerRef = useRef<HTMLElement>(null)

// The docked filter bar on /work pins itself directly below this header, and
// the header's height is not fixed — `work`/`about` wrap to two lines on
// narrow screens (see the <ul> comment below). Published as a custom property
// on the document element rather than through context, so the consumer is a
// plain CSS value with no provider to thread through the tree.
useEffect(() => {
  const el = headerRef.current
  if (!el) return
  const publish = () =>
    document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`)
  publish()
  const ro = new ResizeObserver(publish)
  ro.observe(el)
  return () => ro.disconnect()
}, [])
```

`<header ref={headerRef} className="sticky top-0 z-50 …">` — otherwise
unchanged.

Consumers read `var(--nav-h, 4rem)`. The 4 rem fallback is the height at
normal widths (`py-3.5` = 1.75 rem, plus the 2.25 rem `h-9` `ThemeToggle`
that sets the row height) and covers first paint before the effect runs.

`SiteNav` is already `'use client'`, so no directive change is needed.

---

## 3. Extracting the panel body — `components/work-gallery.tsx`

The panel currently renders inline at `work-gallery.tsx:1233–1330`: a
`space-y-3 rounded-2xl border border-border p-3 sm:space-y-4 sm:p-4` shell
wrapping the toolbar row, the search block, and the two-chip-row ghost
reservation. The docked bar renders the *same* controls, so that interior
comes out into a shell-less component.

```ts
/**
 * Everything the filter controls need, passed as one object so two call
 * sites can mount the same controls without a fifteen-prop signature.
 * Every field is already computed in `WorkGallery`; nothing new is derived.
 */
type FilterControls = {
  queryInput: string
  setQueryInput: (value: string) => void
  selectedTags: Set<string>
  toggleTag: (tag: string) => void
  subtagTone: Map<string, string>
  disciplineChips: string[]
  universalChips: string[]
  tiers: Set<WorkTier>
  toggleTier: (tier: WorkTier) => void
  sort: SortMode
  cycleSort: () => void
  mode: FilterMode
  cycleMode: () => void
  reset: () => void
  activeCount: number
}

/**
 * The panel's interior — toolbar row, search row, both chip rows — with no
 * shell of its own, so the in-flow panel and the docked bar can each wrap it
 * in their own. Lifted verbatim out of `WorkGallery`; every comment in there
 * about right-alignment, the h-8 row, and the ghost reservation moves with
 * it unchanged.
 *
 * `showSearch` is false in the docked bar, whose own always-visible row
 * already carries the search field; rendering it twice would put two live
 * search inputs on screen at once. That also means the docked order reads
 * search → toolbar → chips rather than the panel's toolbar → search → chips,
 * which is right for a bar whose search is its permanent resident.
 */
function FilterPanelContent({
  controls,
  showSearch = true,
}: {
  controls: FilterControls
  showSearch?: boolean
}): ReactNode
```

The in-flow panel becomes:

```tsx
<div
  ref={panelRef}
  className="space-y-3 rounded-2xl border border-border p-3 sm:space-y-4 sm:p-4"
>
  <FilterPanelContent controls={controls} />
</div>
```

`TagRow`, `TierRow`, `SortToggle`, `VennMode`, and `ResetButton` keep their
current signatures and simply mount twice. `EMPTY_TAG_SET` and `noop`
(`work-gallery.tsx:869–870`) move inside `FilterPanelContent`'s module scope
or stay where they are — either way they are still module-level constants, so
the ghost rows' props keep stable identities across renders.

### 3.1 `SearchField`

The search block (`work-gallery.tsx:1254–1279` — icon, input, clear button)
comes out too, so the panel and the bar cannot drift apart:

```tsx
function SearchField({
  value,
  onChange,
  label,
  className,
}: {
  value: string
  onChange: (value: string) => void
  /** Distinct per mount, so a screen reader moving between the two can tell
   *  which one it landed on. */
  label: string
  className?: string
}): ReactNode
```

Markup, classes, and the clear button are unchanged. Both mounts read and
write the same `queryInput` state, so there is still exactly one debounce
effect and typing in either updates both.

---

## 4. `DockedFilterBar`

```tsx
function DockedFilterBar({
  controls,
  revealed,
  open,
  onOpenChange,
}: {
  controls: FilterControls
  revealed: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}): ReactNode
```

### 4.1 Shell

```tsx
<div
  // z-40, deliberately under both the nav (z-50) and the gallery lightbox
  // (`image-lightbox.tsx:438` and `:451`, also z-50), so a bar that happened
  // to be revealed when a lightbox opened sits behind the overlay rather
  // than punching through it.
  //
  // Same translucent-blurred treatment as the nav (`site-nav.tsx:18`), which
  // is what makes this read as an extension of the header rather than a
  // floating widget. Unlike the in-flow panel it must have a fill: it
  // overlays the masonry, so there is no discipline wash to let through
  // here, only cards to cover.
  className={cn(
    'fixed inset-x-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md',
    'transition-transform duration-200 motion-reduce:transition-none',
    revealed ? 'translate-y-0' : '-translate-y-full',
    // Held in the DOM rather than unmounted so it can transition, but taken
    // out of the a11y tree and out of the tab order while retracted — the
    // same treatment `ResetButton` gets, for the same reason.
    !revealed && 'invisible',
  )}
  style={{ top: 'var(--nav-h, 4rem)' }}
  inert={!revealed || undefined}
>
  <div className="mx-auto max-w-6xl px-3 py-2 xs:px-5 sm:px-8">
    {/* §4.2 compact row */}
    {open && (
      <div
        id="docked-filter-panel"
        ref={expansionRef}
        tabIndex={-1}
        // Capped and scrollable: with every discipline open at phone widths
        // the chip block alone reserves four lines, and the toolbar wraps —
        // unbounded, the expansion would run off the bottom of the screen
        // with no way to reach the last row.
        className="mt-2 max-h-[calc(100dvh-var(--nav-h,4rem)-7rem)] overflow-y-auto outline-none"
      >
        <FilterPanelContent controls={controls} showSearch={false} />
      </div>
    )}
  </div>
</div>
```

Page padding (`px-3 xs:px-5 sm:px-8`) matches `app/work/page.tsx`'s `<main>`,
so the bar's contents line up with the panel and the grid underneath it.

### 4.2 Compact row

```tsx
<div className="flex items-center gap-2">
  <SearchField
    value={controls.queryInput}
    onChange={controls.setQueryInput}
    label="Search all work (docked)"
    className="flex-1"
  />
  <button
    type="button"
    onClick={() => onOpenChange(!open)}
    aria-expanded={open}
    aria-controls="docked-filter-panel"
    aria-label={dockedGlyphLabel(controls)}
    className={cn(
      'relative inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors',
      // Goldenrod whenever anything at all is narrowing the view, not just
      // when tags are selected: the badge counts tags only, so a non-default
      // tier selection or an active query would otherwise leave no trace
      // here. Reuses the panel's own active idiom rather than inventing a
      // second one.
      controls.activeCount > 0
        ? 'border-goldenrod text-goldenrod'
        : 'border-border text-muted-foreground hover:text-foreground',
    )}
  >
    <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
    {controls.selectedTags.size > 0 && (
      <span
        aria-hidden="true"
        className="font-brand absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-goldenrod px-1 text-[0.6rem] font-bold text-[var(--card)]"
      >
        {controls.selectedTags.size}
      </span>
    )}
  </button>
</div>
```

- **Glyph:** `SlidersHorizontal`, not `Filter`. What it opens is a set of
  toggles, a sort, and a combine mode — a control panel, not a funnel
  narrowing a stream. New import from `lucide-react`.
- The badge is `aria-hidden`; the count is spoken through the button's label
  instead, so it is one sentence rather than a stray number:

```ts
/** e.g. "Filters, 3 tags selected. Activate to open." */
function dockedGlyphLabel({ selectedTags, activeCount }: FilterControls): string {
  if (selectedTags.size > 0) {
    const n = selectedTags.size
    return `Filters, ${n} ${n === 1 ? 'tag' : 'tags'} selected. Activate to open.`
  }
  return activeCount > 0 ? 'Filters, active. Activate to open.' : 'Filters. Activate to open.'
}
```

### 4.3 Open/close behaviour

**Non-modal disclosure, not a dialog.** No focus trap, no scroll lock, no
scrim. The grid behind stays scrollable and clickable; the bar's own
`bg-background/80 backdrop-blur-md` dims and blurs what sits directly behind
the expansion, which is the visual effect without the semantics.

| Trigger | Behaviour |
| --- | --- |
| Glyph activated | Toggles `open`. On open, focus moves to the expansion container (`tabIndex={-1}`) |
| `Escape` | Closes, and returns focus to the glyph |
| Pointer-down outside the bar | Closes. Listener attached only while `open`, on `pointerdown` rather than `click`, so a drag starting inside and ending outside doesn't close it |
| A tag chip, tier, sort, or venn activated | **Stays open.** Filtering is iterative — closing after one chip would make selecting three tags a three-round-trip job |
| `reset` activated | Stays open, same reasoning. `activeCount` drops to 0, so the glyph loses its goldenrod and the badge disappears |
| In-flow panel scrolls back into view | Closes, and the bar retracts (§1) |
| Route change | Nothing to do — the component unmounts with the page |

---

## 5. Hooks

Both live in `work-gallery.tsx` beside the component that uses them, matching
where `useMasonryColumns` sits relative to `MasonryGrid`.

```ts
/**
 * Scroll direction, rAF-throttled off a passive listener, with a dead zone.
 * The dead zone is not tuning — on iOS, momentum scrolling and rubber-banding
 * at the document ends emit tiny alternating deltas that would otherwise flap
 * the docked bar in and out several times a second.
 */
function useScrollDirection(threshold = 8): 'up' | 'down' {
  const [dir, setDir] = useState<'up' | 'down'>('up')
  useEffect(() => {
    let last = window.scrollY
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        if (Math.abs(y - last) < threshold) return
        setDir(y > last ? 'down' : 'up')
        last = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [threshold])
  return dir
}

/**
 * Whether `ref`'s element is entirely out of the viewport.
 *
 * No `rootMargin`: the nav is translucent, so a panel tucked just under it is
 * arguably already gone, but compensating for the nav's (variable) height
 * would mean reading `--nav-h` back out of the DOM to configure an observer.
 * The untuned version has one harmless consequence — a narrow band where the
 * panel's last few pixels sit under the nav and the docked bar hasn't
 * arrived — and nothing is ever duplicated on screen.
 */
function useOffscreen(ref: RefObject<HTMLElement | null>): boolean
```

Wiring in `WorkGallery`:

```ts
const panelRef = useRef<HTMLDivElement>(null)
const panelOffscreen = useOffscreen(panelRef)
const scrollDir = useScrollDirection()
const [dockedOpen, setDockedOpen] = useState(false)

// Scrolling back to the real panel closes the docked copy, so there are
// never two open panels.
useEffect(() => {
  if (!panelOffscreen) setDockedOpen(false)
}, [panelOffscreen])

const dockedRevealed = panelOffscreen && (scrollDir === 'up' || dockedOpen)
```

---

## 6. Edge cases

| Case | Behaviour |
| --- | --- |
| **First load, page at top** | Panel is on screen, so `panelOffscreen` is false and the bar is retracted. Matches the SSR render — no flash |
| **Gallery lightbox opens while the bar is revealed** | The lightbox is `fixed inset-0 z-50` and locks scroll; the bar is `z-40` and sits behind the overlay. No scroll events fire while it's open, so nothing changes underneath |
| **Nav wraps to two lines (below ~363px)** | `ResizeObserver` republishes `--nav-h` and the bar re-pins itself. This is the reason §2 exists |
| **JS disabled / effect hasn't run** | `var(--nav-h, 4rem)` holds the bar at the correct height for normal widths; it is retracted and `inert` regardless |
| **Expansion taller than the viewport** | Capped at `calc(100dvh - var(--nav-h) - 7rem)` and scrolls internally. `100dvh`, not `100vh`, so mobile browser chrome collapsing doesn't leave the last chip row unreachable |
| **`prefers-reduced-motion: reduce`** | `motion-reduce:transition-none` — the bar appears and disappears instantly instead of sliding. It still appears; the affordance is not motion decoration |
| **Two search inputs mounted at once** | One `queryInput` state, one debounce effect, two views of it. Typing in either updates both. Distinct `aria-label`s keep them tellable apart; the retracted one is `invisible` + `inert`, so it's out of the a11y tree and the tab order anyway |
| **Every tier switched off while docked** | Unchanged — the empty state renders under the bar as usual, and `reset` inside the expansion still clears it |
| **`activeCount > 0` but `selectedTags.size === 0`** (query only, or non-default tiers) | Glyph goes goldenrod, no badge. The label reads "Filters, active." |
| **Rapid scroll direction flapping** | Absorbed by the 8px dead zone and the rAF throttle in `useScrollDirection` |
| **Reader scrolls up past the panel while the expansion is open** | `panelOffscreen` goes false, which closes the expansion and retracts the bar — the real panel is right there, already open |
| **Keyboard-only reader tabbing down the page** | The bar is `inert` while retracted, so it never appears mid-tab-order. Focus moving into the grid doesn't reveal it; only scroll does. A keyboard reader reaches the panel by shift-tabbing back or by `Home` |
| **Focus inside the expansion when it closes** | `Escape` explicitly returns focus to the glyph. An outside pointer-down moves focus to whatever was clicked, which is the browser's default and correct here |

---

## 7. Out of scope

- **Sort, tier, venn, and reset on the compact row.** Beck asked for search
  and a filter glyph; the offered "everything rides along" option was
  declined for wrapping badly on phones. They live in the expansion only.
- **A full-page scrim, focus trap, or scroll lock.** This is a disclosure,
  not a dialog. The blurred bar fill supplies the visual separation.
- **A scroll-to-top control.** Adjacent idea, not this one.
- **Scroll-spy or "you are here" state** on the bar.
- **Any change to the in-flow panel's layout** — the right-aligned toolbar,
  `reset`-first ordering, the h-8 row, the ghost reservation, and the
  relocated count all stand exactly as built. The only edit to that region is
  the mechanical extraction in §3.
- **Making the bar appear on any route other than `/work`.** It lives in
  `WorkGallery` and unmounts with it.
- **`--nav-h` consumers other than this bar.** Published generally, used once.

---

## 8. Docs to update on landing

- **[ARCHITECTURE.md](../ARCHITECTURE.md)** — the `work-gallery.tsx` entry in
  the component inventory (line ~657, "the `/work` client island: filter
  panel, URL state, …") should gain the docked bar. Add a line to the
  component-layers section noting that `SiteNav` now publishes `--nav-h` and
  what depends on it, since that is a cross-component contract that isn't
  visible from either file alone.
- **[TODO.md](../TODO.md)** — close whatever tracks this.
- Move this file to `docs/history/` once built, following the convention the
  other shipped specs use.
