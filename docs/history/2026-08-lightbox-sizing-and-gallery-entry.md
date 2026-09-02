# Lightbox sizing, and opening it straight from the gallery (archived)

> **This is history, not current documentation. Status: shipped 2026-09-02.**
> Built essentially as specified — decisions taken with Beck 2026-08-30/31.
> **Current documentation is [../ARCHITECTURE.md](../ARCHITECTURE.md)**
> (§8's "what changes" list has been folded in, under Component layers) and
> [../TODO.md](../TODO.md)'s §13. Read this only for the derivations and
> per-case tables ARCHITECTURE.md deliberately doesn't carry.
>
> **Where the build diverged from this spec** — both found by testing in a
> real browser rather than by reading the code, which is exactly what §5.3
> asked for:
>
> - **§3.3's `finalFocus`.** The spec says to pass
>   `finalFocus={() => resolveTrigger?.(items[index]) ?? false}`
>   unconditionally. Shipped instead as
>   `isControlled ? () => resolveTrigger?.(items[index]) ?? false : undefined`.
>   Base UI's `finalFocus` treats `false` as "do not move focus," which is
>   correct only for the gallery's controlled instance (no Trigger exists
>   there to restore focus to). Passed unconditionally, it would have
>   silently disabled Base UI's default focus-restore-to-trigger behaviour on
>   every other, uncontrolled call site (collection pages, piece pages,
>   process stills) — none of which pass `resolveTrigger`, so the fallback
>   would always have fired. §7 explicitly rules out changing those call
>   sites' behaviour; this keeps that promise.
> - **§2.1/§3.3's keyboard paging silently didn't work**, independent of
>   anything in this spec: Base UI 1.5's `DialogPopup` calls
>   `stopPropagation()` on every arrow key (`COMPOSITE_KEYS` — arrows, Home,
>   End), which never reaches a bubble-phase `window` listener. The prev/next
>   *buttons* worked throughout; only the arrow *keys* were dead. Fixed by
>   registering the listener with `{ capture: true }`. Not mentioned anywhere
>   in this spec — a Base UI behaviour, not a design decision — and worth
>   double-checking again on the next `@base-ui/react` upgrade.
> - **§2.3's natural-size clamp** needed `popupNode`, not just `index`, in its
>   effect's dependency array. Base UI mounts the Popup's DOM (and with it,
>   the `<img>` the clamp's ref points at) asynchronously relative to `open`
>   flipping true — the same timing issue the file already documents for the
>   wheel/touch and idle-fade effects. An effect keyed on `index` alone
>   stabilizes, and stops re-running, before the ref it reads ever goes
>   non-null.
> - **§9's open question** (a reserved inset under the caption pill for tall
>   portraits) shipped as the plain, unreserved pill. Untested against a
>   truly tall portrait in practice; cheap to add the ~72px reserve later if
>   Beck finds it wanting.

Two complaints, one component:

1. The lightbox often shows an image **smaller than the piece's own page does**.
2. Reaching the lightbox from `/work` takes **two clicks** — card → piece page →
   image — and for a standalone image that middle step earns nothing.

---

## 1. Why the lightbox is smaller than the page

Not a subtle bug. Three separate caps stack in
[`components/image-lightbox.tsx`](../../components/image-lightbox.tsx):

- The image's row is `flex w-full max-w-4xl` — a **hard 896px width ceiling**
  regardless of viewport.
- The popup is `flex flex-col … gap-5 p-4 sm:p-10` with the caption block **in
  flow**, so the real height budget is about `100vh − 166px` (80px padding +
  20px gap + ~66px caption).
- The image asks for `max-h-[92vh]`, which does not know about any of that.
  When 92vh exceeds the row's share, the row grows and the caption is pushed
  toward or past the bottom edge instead of the image getting smaller.

The piece page, by contrast, renders `PieceMedia` at `max-w-3xl` — 768px wide,
with **no height limit at all**, because the page scrolls.

Measured against a typical laptop viewport (~800px tall):

| Piece | On its page | In the lightbox today |
|---|---|---|
| `protest-sign` (1440/1723) | 768 × 919 | ~530 × 634 |
| any 4/5 portrait (`lady-bird`, `child-not-adult`, `why-be-afraid`, `womens-history-month`, `presidential-pardon`) | 768 × 960 | ~507 × 634 |
| 1/1 squares | 768 × 768 | ~634 × 634 |

So portrait pieces are *always* smaller in the lightbox on a laptop, and
squares usually are. The 896px cap only ever binds on a display tall enough
that 92vh clears it — roughly 1060px of viewport height.

### 1.1 What "bigger" can actually mean

**There is a hard ceiling.** Every source file in `public/` is at most
1440–1800px on its long edge (`equanimity-or-apathy` is only 1087 × 763). Fit-
to-viewport on a large display will run out of pixels before it runs out of
room, so the new layout must **never upscale** — see §2.3.

**And `contain` cannot keep the promise literally.** A 4/5 portrait at 768px
wide needs 960px of height; on an 800px-tall viewport no fit-to-viewport
layout can show it that large. This is accepted, not solved — Beck chose
fit-to-viewport over click-to-zoom (§7). After this change the same 4/5
portrait renders ~602 × 752 instead of ~507 × 634: better in both dimensions,
still narrower than the page. Say so out loud rather than claiming the
complaint is fully closed.

---

## 2. Target: the lightbox fills the viewport, chrome overlays it

All in `components/image-lightbox.tsx` and `WorkPlaceholder`'s `contain`
branch in `components/work-visuals.tsx`.

### 2.1 Layout

Replace the popup's flex-column-with-flow-caption with a full-bleed image
layer plus absolutely positioned chrome:

```
DialogPrimitive.Popup            fixed inset-0 (no flex centering, no padding)
├─ Dialog.Title                  sr-only
├─ div  ← image layer            absolute inset-0 flex items-center justify-center
│                                p-4  sm:p-6  [+ sm:px-20 when hasMultiple]
│  └─ div  ← measuring box       relative inline-flex max-h-full max-w-full
│     ├─ prev arrow              absolute left-2 sm:left-0 sm:-translate-x-14
│     ├─ WorkPlaceholder         fit="contain", max-h-full max-w-full
│     └─ next arrow              absolute right-2 sm:right-0 sm:translate-x-14
├─ Dialog.Close                  absolute right-4 top-4 z-10   [data-lightbox-chrome]
└─ caption pill                  absolute bottom-4 inset-x-0 z-10  [data-lightbox-chrome]
```

**Drop `max-w-4xl` entirely.** The image layer's own padding is the only
width constraint besides the source's natural size.

**The caption becomes a pill, not a band.** It keeps its existing three lines
(meta line in `tone`, title, `n / m` counter) but is wrapped in the same
`rounded-full bg-background/85 backdrop-blur-sm` idiom the close button and
arrows already use, centred at `bottom-4`. Deliberately **not** a gradient
scrim across the artwork: a scrim tints Beck's image, a pill covers a small
fixed footprint and is the language already in use. It keeps `chromeClass`, so
it still idle-fades after 2.5s.

**Arrows split by breakpoint.** Below `sm` they sit *inside* the image's
edges (`left-2` / `right-2`) — reserving 2 × 48px on a 375px phone would
destroy the image. At `sm` and up they keep today's outside placement
(`-translate-x-14`), and the image layer reserves `px-20` for them so they
never cover artwork. The reserve applies **only when `hasMultiple`**; a
single-image lightbox keeps the full `sm:p-6`.

Keep the existing rationale intact: the arrows are positioned against the
**measuring box** (which shrink-wraps the rendered image), not the layer, so a
portrait piece's arrows sit against its actual edges rather than far out at
the viewport's.

### 2.2 What this buys, exactly

On a 1440 × 800 viewport, a multi-image lightbox: width ≤ `1440 − 160 = 1280`,
height ≤ `800 − 48 = 752`. Against today's 896 / ~634. Every piece in `WORK`
gets bigger; portraits get bigger in both dimensions but stay narrower than
their page (§1.1).

### 2.3 Never upscale

`WorkPlaceholder`'s `contain` branch hardcodes `width={1600}` with no `sizes`.
Next then emits an `x`-descriptor srcset, so the `<img>`'s **intrinsic CSS
size is 1600px whatever the file actually contains** — with the 896px cap gone,
`equanimity-or-apathy` (1087px wide) would be laid out at 1600 and visibly
soften.

Fix, in two parts:

1. **Keep `sizes` unset** (x-descriptors). Both candidates Next generates are
   clamped to the source's real width, so the browser's chosen resource has
   `naturalWidth === min(candidate, sourceWidth)` at any DPR. Do **not** add
   `sizes="100vw"`: that switches Next to `w`-descriptors, the browser picks a
   viewport-sized candidate, and step 2's cap would then wrongly clamp to that
   candidate rather than to the source.
2. **Clamp on load.** In `ImageLightbox`, on the popup `<img>`'s `load` event,
   set `img.style.maxWidth = \`${img.naturalWidth}px\``. Combined with
   `w-auto h-auto max-h-full max-w-full` this yields
   `min(sourceWidth, availableWidth, availableHeight × aspect)` — exactly the
   rule we want.

Raise the hardcoded `width` from `1600` to `2000` so the cap has headroom
above the largest current source (1800px).

**Assumption worth recording:** this is only exact while every source is
narrower than the `width` prop. If a source wider than 2000px is ever added,
the cap silently becomes the candidate width instead of the source width.
Real pixel dimensions in the data (`WorkPiece.imagePx`) would make it exact;
that is out of scope (§7).

Reset the inline `maxWidth` whenever `index` changes, so a wide image's cap
doesn't leak onto a narrow one before the next `load` fires.

### 2.4 Edge cases

| Case | Handling |
|---|---|
| Placeholder piece (no `image`) | `WorkPlaceholder`'s `contain` branch already falls through to the tinted panel with `aspect-[16/10] h-auto w-full`. It has no natural size, so no clamp applies. Unchanged. Cannot arise from the gallery (§3.1 requires `image`). |
| Source narrower than the viewport | Renders at natural size, centred, letterboxed by the layer. Correct — better a small sharp image than a large soft one. |
| Extremely wide panorama | Width-bound by the layer; height comes out small. `object-contain` handles it; no special case. |
| `load` never fires (cached decode) | `load` does fire for cached images in every current browser. As a belt: also apply the clamp in a `ref` callback when `img.complete && img.naturalWidth > 0`. |
| Very short viewport (< 400px, landscape phone) | Image layer `p-4` = 32px; caption pill overlays the image's bottom. Accepted — the pill fades after 2.5s. |
| Caption pill over a light image | It carries `bg-background/85` + `backdrop-blur-sm` + `border-border`, same as the close button. No further contrast work. |

---

## 3. Opening the lightbox straight from `/work`

### 3.1 Which cards open it

Decided: **all standalone image pieces, except code demos.**

Add to `lib/work.ts`, beside `imageLightboxSlice()`:

```ts
/**
 * Whether this gallery card opens the lightbox in place rather than
 * navigating. A code demo is excluded on purpose: its `image` is only a
 * poster still, and the thing it advertises runs on its own page. A piece
 * with a speedpaint or animation *is* included — the finished still is the
 * piece, the video is process, which is the same framing `PieceMedia` uses
 * when it always offers the still alongside the video.
 */
export function opensInGalleryLightbox(item: WorkItem): item is WorkPiece {
  return (
    !isCollection(item) &&
    !isHybrid(item) &&
    !isTextForward(item) &&
    !isCodeDemo(item) &&
    Boolean(item.image)
  )
}

/** The ordered lightbox domain for a rendered gallery — the visible cards that open it. */
export function galleryLightboxItems(items: WorkItem[]): WorkPiece[] {
  return items.filter(opensInGalleryLightbox)
}
```

`galleryLightboxItems` **must** be defined in terms of `opensInGalleryLightbox`
and both must be the only deciders. If `ImageCard`'s open-vs-navigate branch
and the paging domain ever disagree, an arrow lands on a piece whose own card
would have navigated. Same reasoning as the existing note on
`imageLightboxSlice()` in ARCHITECTURE.md's component layers.

Against today's `WORK` this covers **19 of 29** top-level items: the 24
standalone pieces, minus the 3 text-forward essays, minus `delirium`
(code demo), minus `love-worth-heartbreak` (a collection, so it never reaches
`ImageCard` anyway). Collections, `TextCard`, and `HybridCard` are untouched
and keep navigating.

### 3.2 Where the reading path goes

Two routes to the piece page, both decided:

- **`ImageCard`'s hover panel keeps its title `Link`.** The image becomes a
  button; the title stays a link. Image click = look, title click = read. The
  panel already reveals on `group-focus-within`, so this is keyboard-reachable
  with no new work.
- **The lightbox caption's title becomes a link.** New optional prop (§3.3),
  used only by the gallery, so paging away from the card you opened still
  leaves a route to that piece's writeup.

The lightbox's meta line and counter stay plain text. The title link underlines
on hover only, and idle-fades with the rest of the chrome.

### 3.3 `ImageLightbox` gains a controlled, triggerless mode

The gallery needs one lightbox whose open state is derived from the URL, not
24 dialogs each owning their own. Extend the existing signature — every current
call site keeps working untouched:

```ts
export function ImageLightbox({
  items,
  initialIndex = 0,
  children,
  className,
  bare = false,
  open: controlledOpen,
  onOpenChange,
  onIndexChange,
  resolveTrigger,
  titleHref,
}: {
  items: WorkPiece[]
  initialIndex?: number
  /** Omitted in controlled mode: no Trigger is rendered. */
  children?: ReactNode
  className?: string
  bare?: boolean

  /** Controlled open state. When passed, the component renders no Trigger and ignores `children`. */
  open?: boolean
  /** Required whenever `open` is passed. Fires for Escape, the close button, and the dismiss flight. */
  onOpenChange?: (open: boolean) => void
  /** Fires whenever the shown index changes (arrows, ArrowLeft/ArrowRight). Index state stays internal regardless. */
  onIndexChange?: (index: number) => void

  /**
   * Maps the currently-shown piece to the element the dismiss flight should
   * land on. Lets a caller that renders many tiles fly back to the *current*
   * piece's tile rather than the one that opened. Returning null falls back
   * to a fade. When absent, behaviour is exactly as today: the internal
   * trigger, and only while `index === initialIndex`.
   */
  resolveTrigger?: (piece: WorkPiece) => HTMLElement | null

  /** When it returns a path, the caption's title renders as a link to it. */
  titleHref?: (piece: WorkPiece) => string | undefined
}) 
```

Implementation notes:

- `const isControlled = controlledOpen !== undefined`;
  `const open = isControlled ? controlledOpen : internalOpen`. `setOpen(v)`
  becomes a helper that calls `onOpenChange?.(v)` and, when uncontrolled, also
  `setInternalOpen(v)`.
- **Index stays internal in both modes.** The gallery writes `?view=` inside a
  `startTransition`, so the URL lags a frame; local index state is what keeps
  arrow presses instant. The existing
  `useEffect(() => { if (open) setIndex(initialIndex) }, [open, initialIndex])`
  already re-syncs when the URL catches up, and re-syncing to the same value is
  a no-op — no loop.
- Route every index mutation (both arrow buttons, both key handlers) through
  one `goTo(next: number)` helper that calls `setIndex` and `onIndexChange`, so
  a future control can't forget the callback.
- In controlled mode render no `DialogPrimitive.Trigger` at all.
- **`finalFocus`.** With no Trigger, Base UI has nothing to restore focus to on
  close. Pass
  `finalFocus={() => resolveTrigger?.(items[index]) ?? false}` on
  `Dialog.Popup` (the prop accepts a function returning an element — verified
  in `@base-ui/react` 1.5's `DialogPopup.d.ts`). Focus lands on the tile you
  were last looking at.
- Flight trigger resolution becomes:
  ```ts
  const flightTarget = resolveTrigger
    ? resolveTrigger(items[index])
    : index === initialIndex
      ? triggerRef.current
      : null
  ```
  The rest of `dismissWithFlight` — the reduced-motion check, the `bare`
  check, the FLIP maths, the chrome fade — is unchanged.

---

## 4. `?view=<slug>`: the open lightbox is a URL

`/work`'s filter state already lives in the URL "so refresh + back/forward
always restore state". The open lightbox joins it.

### 4.1 State rules

- **Read:** `const viewSlug = searchParams.get('view')`;
  `const viewIndex = lightboxItems.findIndex(p => p.slug === viewSlug)`.
  Open **iff** `viewIndex >= 0`. The URL is the single source of truth for
  *which* piece is open; `ImageLightbox`'s internal index is a fast local
  mirror (§3.3).
- **Open a card:** `commit({ view: slug }, 'push')` — exactly one history entry
  per open, so browser Back and the mobile back-swipe close it.
- **Page with arrows:** `commit({ view: items[i].slug }, 'replace')` — no
  history entry, so ten arrow presses don't bury the gallery.
- **Close (Escape, close button, dismiss flight):** if this session pushed the
  entry (`pushedRef.current`), `router.back()` so the entry is consumed;
  otherwise (a deep link opened directly on `?view=`)
  `commit({ view: null }, 'replace')`. Clear `pushedRef` either way.

Extend the existing `commit()` change bag with `view?: string | null`,
following the same `sp.set` / `sp.delete` shape as `q`. `view` has no default
value to omit, so it is simply present or absent. Keep `{ scroll: false }`.

### 4.2 Edge cases

| Case | Handling |
|---|---|
| `?view=` naming a slug not in the domain — filtered out, a collection, an essay, `delirium`, a typo, a deleted slug | `viewIndex === -1` → stay closed, and an effect strips the param with `commit({ view: null }, 'replace')`. One rule covers every variant; no per-case branching. |
| Filters change while open | Can't happen by pointer (the dialog is modal and traps focus) but can via Back/Forward. The rule above handles it: if the open piece leaves the domain, the lightbox closes and the param is stripped. |
| `?view=` present on first load | The dialog opens without a user gesture and Base UI moves focus into it. Correct for a deep link. Ensure the strip-effect runs *after* `lightboxItems` is computed so a valid deep link is never stripped on the first pass. |
| Both `?view=` and `?tags=`/`?q=` set | Independent params, no interaction beyond the domain check. A shared link restores filters *and* the open image. |
| `?view=` on `/work` while JS is loading | `/work` is prerendered; the gallery is a client island. The lightbox appears on hydration. No SSR'd dialog, no flash to design around. |
| Back pressed mid-dismiss-flight | The flight animates the popup's own `<img>` with `fill: 'forwards'` and `isDismissingRef` guards re-entry; the URL change unmounts the dialog when it lands. Verify it doesn't strand `isDismissingRef` — reset it in a cleanup on unmount, not only in the animation's `.then()`. |

---

## 5. Flying back to the *current* tile — and the scroll lock

Decided: on dismiss, the image flies to the tile of whatever piece is showing,
scrolling that tile into view if needed. This is the most delicate part of the
whole change, because of how Base UI locks scroll.

### 5.1 The tile registry

In `work-gallery.tsx` (already `'use client'`), a small context:

```ts
type GalleryLightboxApi = {
  open: (slug: string) => void
  registerTile: (slug: string, node: HTMLElement | null) => void
}
const GalleryLightboxContext = createContext<GalleryLightboxApi | null>(null)
```

- `WorkGallery` provides it, backed by
  `useRef<Map<string, HTMLElement>>(new Map())`; `registerTile` sets on a node
  and deletes on `null`.
- `ImageCard` consumes it with `useContext`. **If the context is null it renders
  exactly as it does today** — a `Link` to `workHref(item)`. That keeps
  `ImageCard` usable outside the gallery and makes the new behaviour opt-in
  rather than load-bearing.
- `ImageCard` registers **the image wrapper div** (the
  `aspect-[5/4] overflow-hidden rounded-[calc(1rem-1px)]` element), not the
  `<article>`. The flight maps image rect → image rect; the article includes
  the border and the chrome layer.
- A context rather than props threaded through `WorkCard`: `MasonryGrid`
  redistributes children across columns, and two callbacks would have to pass
  through `WorkCard` purely as freight.

`resolveTrigger={(piece) => tiles.current.get(piece.slug) ?? null}`.

### 5.2 The scroll lock changes the maths — read this before implementing

Base UI's `useScrollLock` (`@base-ui/utils` 0.2.9) does **not** merely disable
scrolling. While the dialog is open it sets:

```
body { position: relative; height: 100dvh; width: 100vw;
       box-sizing: border-box; overflow: hidden }
body.scrollTop = <scrollTop captured at open>
html { overflow-x/y: hidden|scroll }
```

and on cleanup restores `html.scrollTop` to that captured value.

Two consequences that decide the design:

1. **A tile that was on screen when the lightbox opened measures correctly.**
   The page is frozen at exactly the scroll position it will return to, so
   `getBoundingClientRect()` under the lock is already right for after the
   close. No adjustment needed — this is why the flight works today.
2. **`scrollIntoView()` under the lock is silently undone.** It scrolls the
   locked `body`, and `cleanup()` then restores `html.scrollTop` to the
   captured value. The image would fly to a tile that is somewhere else half a
   frame later. The existing `offscreen → scrollIntoView → finish()` branch in
   `dismissWithFlight` is effectively dead code today (you can't scroll while
   the lock is on, so the trigger you just clicked is always visible) and
   **becomes live and wrong** the moment paging can select an off-screen tile.

### 5.3 Required handling

Replace the current `offscreen` branch with:

1. Measure the target's rect under the lock (correct for post-close).
2. If it is fully within the viewport → fly as today. Done.
3. If not, compute
   `targetScrollY = window.scrollY + (rect.top - desiredTop)`, where
   `desiredTop` centres the tile vertically, clamped to
   `[0, document.documentElement.scrollHeight - window.innerHeight]`.
4. Set `document.body.scrollTop = targetScrollY` — the locked `body` *is* the
   overflow container, so this repositions content and makes subsequent rects
   correct. Re-measure the target.
5. Run the flight against the re-measured rect.
6. On the animation's `finished`, close; then in `Dialog.Root`'s
   `onOpenChangeComplete(false)` — which fires after Base UI's cleanup has run —
   call `window.scrollTo({ top: targetScrollY, behavior: 'instant' })` to
   override the restored value. Hold `targetScrollY` in a ref, and clear it
   after use so a later plain close doesn't re-apply a stale scroll.

**Acceptable fallback, and the thing to ship if step 4 misbehaves in a real
browser:** skip the flight when the target is off screen — close with Base UI's
fade, then scroll the tile into view after unlock. The user still lands on the
right tile, just without the animation. Prefer this over a flight that lands on
empty space.

**Verify in a browser and record the result** (this file's claims about the
lock come from reading `useScrollLock.js`, not from watching it run): open a
tile near the top of `/work`, page ~10 images along, scroll-dismiss, and
confirm the image lands on the correct tile and the page stays at the new
position. Do it in both themes and at a narrow width. ARCHITECTURE.md already
carries one "verified in a browser on 2026-08-27" note about sticky-vs-transform
for exactly this reason; add its sibling.

### 5.4 Flight edge cases

| Case | Handling |
|---|---|
| `resolveTrigger` returns null (piece has no tile — shouldn't happen, since the domain is built from the rendered results) | Fade. The existing `canFly` guard already covers a null trigger. |
| `prefers-reduced-motion: reduce` | Unchanged: no flight, plain fade. Step 3's scroll still applies, so a reduced-motion user also lands on the right tile. |
| Tile unmounts mid-flight (Back changes the filters) | The Web Animations handle is on the popup's `<img>`, not the tile, so the animation completes regardless; it lands on empty space. Accepted — it requires deliberately using Back during a 260ms window. |
| Touch drag-to-dismiss | Unchanged. `dragYRef` still offsets both keyframes. |
| Aspect mismatch between the lightbox image and the tile | Unchanged: the tile is `object-cover`, the lightbox `object-contain`. Scale from the width ratio and let `contain` absorb the rest — the existing documented rule. |

---

## 6. Everything that has to change, by file

| File | Change |
|---|---|
| `lib/work.ts` | Add `opensInGalleryLightbox()` and `galleryLightboxItems()` beside `imageLightboxSlice()`. No data-shape change. |
| `components/image-lightbox.tsx` | §2.1 layout rework; §2.3 natural-size clamp; §3.3 controlled/triggerless mode, `onIndexChange`, `resolveTrigger`, `titleHref`, `finalFocus`; §5.3 scroll handling. |
| `components/work-visuals.tsx` | `WorkPlaceholder` `contain` branch: `width` 1600 → 2000, keep `sizes` unset, accept a `ref` so the lightbox can clamp on load. |
| `components/work-gallery.tsx` | `GalleryLightboxContext`; `view` in `commit()`; derived open state; one `<ImageLightbox>` rendered beside `MasonryGrid`; `ImageCard`'s image becomes a `<button>` when the context is present. |
| `components/media-player.tsx` | Comment only: `MediaBadges`' "Purely decorative: the tile's own link still does the navigating" is no longer true for gallery `ImageCard`s. Rewrite it; the code-demo sentence stays true (§3.1 keeps demos navigating). |

### 6.1 Accessibility

- `ImageCard`'s image button takes
  `aria-label={\`${item.title} — view full screen\`}`. The `<img>` keeps
  `alt={item.title}`; the button's label overrides it for announcement, and
  says what activating it does.
- Tab order per card is unchanged in shape: image control, then the hover
  panel's title link (revealed by `group-focus-within`), then the medium pill.
- The lightbox keeps its `sr-only` `Dialog.Title`. The caption title becoming
  a link adds a link to the dialog's tab order; it is inside the popup, so the
  existing focus trap covers it.
- Chrome elements stay opacity-faded and **never** `pointer-events-none` —
  the existing rule, which is what keeps the close button reachable at
  `opacity-0`. The new caption title link inherits it.

---

## 7. Explicitly out of scope

- **Zoom / pan / 100% view.** Considered and declined in favour of
  fit-to-viewport. This is the only thing that would make the lightbox
  strictly never smaller than the page for tall portraits (§1.1); if that
  complaint returns, this is the fix, not more layout tuning.
- **Collection tiles opening a lightbox.** They keep navigating to the
  collection page, whose stack/contents/chapbook layouts are the point.
- **Any change to collection-page tiles** (`ImageTile`, `IllustratedTile`),
  `PieceMedia`, `ProcessSection`, or `CodeDemoFrame`. They keep calling
  `ImageLightbox` exactly as they do now, and none of the new props are
  optional-with-a-default that changes their behaviour.
- **`titleHref` on the collection-page call sites.** It would be two lines, but
  each of those tiles already renders a direct link to the piece immediately
  below it, and on the piece's own page the link would point at the page you
  are already on.
- **Real pixel dimensions in the data** (`WorkPiece.imagePx` plus a measuring
  script). The `naturalWidth` clamp covers every current source; revisit if a
  source wider than 2000px is ever added, or if process stills — which have no
  `WORK` entry at all — ever need it.
- **Horizontal swipe to page on touch.** Only vertical drag-to-dismiss exists,
  and adding a horizontal gesture next to it needs its own axis-lock design.
- **Preloading the next/previous image.** Worth doing once paging is common;
  not part of this change.
- **The piece page's own `max-w-3xl`.** Unchanged; it is the baseline the
  lightbox is measured against.
- **`?view=` on collection pages.** Their lightboxes stay ephemeral local
  state; only `/work` gets URL-addressable viewing.

---

## 8. What changes in ARCHITECTURE.md — at ship time

Per this repo's own convention, ARCHITECTURE.md answers "how does this work
today", so these edits land **with the implementation**, not with this spec.
Recorded here so they aren't rediscovered later.

**Goes stale:**

- *Component layers*, the `image-lightbox.tsx` bullet: "scoping that list to
  pieces that actually carry an image is the caller's job. `imageLightboxSlice()`
  is that one place" — there are now two, and the new one has an extra rule
  (code demos are excluded). Amend rather than delete; the principle survives.
- *Routes*: "Filter state on `/work` lives in the URL (`?tags=…`)" — now also
  `?view=`.
- *Components* (media section): "**`ImageLightbox`** takes a `bare` prop…" —
  add the controlled/triggerless mode alongside it.
- The `MediaBadges` comment in `media-player.tsx` (§6).

**New entry, for the `## Component layers` section** — this is the decision
worth keeping, and it is not derivable from the code:

> **The gallery's lightbox is URL state; every other lightbox is not.**
> `/work` renders **one** `ImageLightbox` in a controlled, triggerless mode,
> opened by `?view=<slug>` rather than by a per-card dialog. Three things
> forced it and each would have to be given up to reverse it: a card click has
> to be undoable with Back (and with the mobile back-swipe, which is the
> instinctive dismiss gesture); an open image has to be a shareable link, the
> same way a filtered gallery already is; and paging with the arrows has to
> move between *cards*, which no per-card dialog can know about. Paging writes
> `view` with `replace`, so ten arrow presses leave one history entry, not ten.
> The lightbox still keeps its own `index` state — the URL write is inside a
> `startTransition` and lags a frame, and arrow presses must not.
>
> Collection pages and piece pages deliberately **did not** follow. Their
> lightboxes stay ephemeral local state: their domain is one collection, it
> doesn't move under them, and the pieces already have their own addressable
> URLs one link away.
>
> **Which cards open it is one predicate, `opensInGalleryLightbox()`, and it
> must stay one.** The card's open-vs-navigate branch and the arrows' paging
> domain both read it; if they ever diverge, an arrow lands on a piece whose
> own card would have navigated. Code demos are excluded — a demo's `image` is
> only a poster still, and the thing the card advertises runs on its own page.
> A speedpaint or animation is **not** excluded: the finished still is the
> piece and the video is process, which is the framing `PieceMedia` already
> uses when it offers the still alongside every video.
>
> **The dismiss flight and Base UI's scroll lock are coupled, and not
> obviously.** `useScrollLock` clamps `<body>` to `height: 100dvh; overflow:
> hidden` and restores `html.scrollTop` on cleanup, so (a) a tile that was on
> screen when the lightbox opened measures correctly under the lock — the page
> is frozen at the position it will return to — and (b) `scrollIntoView()`
> under the lock is silently undone by that cleanup. Flying to an off-screen
> tile therefore has to set `body.scrollTop` itself and re-apply the same value
> in `onOpenChangeComplete`, after the lock lets go. The `offscreen →
> scrollIntoView` branch written in 2026-08 was dead code until paging could
> select a tile you never clicked; it was wrong the moment it ran.

**Also worth a line in the sizing/decisions prose:** the lightbox never
upscales — `WorkPlaceholder`'s `contain` branch deliberately ships **without**
`sizes` so Next emits source-clamped `x`-descriptor candidates, which is what
makes the `naturalWidth` cap exact. Adding `sizes` "for performance" silently
breaks it.

---

## 9. Open, for Beck

- Nothing blocking. One thing to look at once it is running: whether the
  caption pill overlaying the bottom of a tall portrait reads as acceptable, or
  whether it wants a small reserved inset after all (~72px, costing that much
  image height). Cheap to switch either way; not worth deciding from a
  description.
