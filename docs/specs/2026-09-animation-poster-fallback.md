# Spec — animation poster fallback (YouTube thumbnail)

> **Superseded 2026-09-10, same day, by
> [2026-09-animation-pieces.md](2026-09-animation-pieces.md).** Kept for the
> record rather than deleted, the way this repo generally handles a reversed
> decision (see ARCHITECTURE.md's "On D2's history"). What changed: this
> draft assumed a local `image` always wins over YouTube's thumbnail (§0) and
> that clicking a gallery card keeps opening the still-image lightbox
> unchanged. Both turned out to be wrong once Beck looked at a real example
> (`philosophy-animation`) — an animation's own thumbnail should win outright,
> and the still-image lightbox detour is exactly what "front and center"
> was objecting to. The oEmbed verification in this file's banner (the
> shared `youtubeId` across three pieces being one real, live video, not
> placeholder data) still holds and isn't repeated in the new file.

> **Status: designed 2026-09-10 with Beck, not built.**
>
> Beck's opening idea was "animations should have a different card type,
> maybe pulling from YT thumbnails" — but the visual-identity question (§0)
> settled on keeping the exact same tile shape and chrome as every other
> gallery card, with only the *picture itself* changing. That means this
> isn't a new card type or a new dispatch branch at all: it's a fallback in
> the shared image-resolution helper (`WorkPlaceholder`) that every card
> already renders through, plus the equivalent fallback for the poster
> `AnimationEmbed` shows on a piece's own page before someone presses play.
> A real `AnimationCard` component would be near-total duplication of
> `ImageCard` for a change that's only ever about which URL fills the same
> box — see §0's third row.
>
> Touches `lib/work.ts`, `components/work-visuals.tsx`,
> `components/media-player.tsx`, and `next.config.mjs`. No new component, no
> new route, no dispatch changes in `WorkCard`/`ImageCard`.
>
> **Verified before writing this spec:** Beck doubted whether any piece's
> YouTube embed currently works. Checked via YouTube's oEmbed endpoint —
> the sample data's `youtubeId: 'RTGjy1jDMyM'` (reused across the three
> `philosophy-animation` pieces, `lib/work.ts:1490/1502/1514` — one real
> video split into three scene-pieces, not placeholder data; see the comment
> at `lib/work.ts:1486-1489`) is a live, public video ("Honey | Personal
> Animation feat. Luca Schmidt", channel `beckqing`), and oEmbed succeeding
> means it's embeddable. Nothing here is blocked on fixing broken data. One
> real consequence, though: **all three `philosophy-animation` pieces
> already carry their own local `image`**, so this fallback changes nothing
> visible for any piece that exists today — it only protects the next piece
> that ships with `animationEmbed` and no local image.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| Which animations get better posters | **Both** — self-hosted (`animationSrc`) and YouTube-embedded (`animationEmbed`). Self-hosted pieces just keep using their own authored `image`; there's no external thumbnail source for those | Beck, 2026-09-10 |
| What makes it read as "different" | **Nothing structural — same tile shape (5:4), same play-button chrome.** Only the picture changes: a real YouTube thumbnail instead of a hand-set image or the tinted placeholder | Beck, 2026-09-10 |
| Whether that's actually a new card type | **No.** Given the answer above, forking a new `AnimationCard` component would duplicate ~130 lines of `ImageCard` (corner rail, hover chrome, medium pill, lightbox wiring) to change one `src` lookup. Fixed at the shared primitive (`WorkPlaceholder`) instead | This spec, from Beck's answer |
| When to prefer the YouTube thumbnail over a local image | **Only when there's no local `image`.** A hand-set image always wins — it may be a deliberately chosen crop or moment that reads better than YouTube's auto-picked frame | Beck, 2026-09-10 |
| Click behavior on the gallery tile | **Unchanged — navigates to the piece's own page**, same as every other card. No inline/lightbox playback from the grid | Beck, 2026-09-10 |
| Scope: gallery-only, or everywhere `WorkPlaceholder` renders | **Everywhere.** `WorkPlaceholder` is a shared primitive (home page's `PieceColumn`, collection-page tiles, the top-level gallery); the missing-thumbnail gap is identical in all of them, and threading a prop through every call site to scope this to one page would add real complexity for no benefit | This spec — see §6 |
| Thumbnail size | **`hqdefault` (480×360), not `maxresdefault`.** `hqdefault` exists for every public video; `maxresdefault` only exists for uploads that provided a high-res source, and silently 404s otherwise (no client-side fallback exists for a bad `next/image` `src`) | This spec |

---

## 1. `animationPosterFor()` — `lib/work.ts`

```ts
/**
 * YouTube's own thumbnail for an embedded video — `hqdefault` (480×360),
 * guaranteed to exist for any public video, unlike `maxresdefault` (only
 * present for uploads that opted into a high-res source, and 404s silently
 * otherwise — there's no client-side recovery from that in this codebase).
 */
export function youtubeThumbnail(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
}

/**
 * An item's own image if it has one; otherwise YouTube's thumbnail when its
 * animation is an embed. The single fallback `WorkPlaceholder` and
 * `AnimationEmbed`'s pre-play poster both read, so a piece that ships with
 * `animationEmbed` and no local `image` shows a real picture instead of a
 * tinted placeholder (gallery/collection tiles) or a plain black box
 * (the piece's own page, before pressing play) — see `AnimationEmbed` in
 * `media-player.tsx`. Collections are excluded from the embed fallback,
 * matching `hasAnimation()`'s own rule: a collection doesn't have a single
 * animation of its own, one of its pieces does.
 */
export function animationPosterFor(item: WorkItem): string | undefined {
  if (item.image) return item.image
  if (!isCollection(item) && item.animationEmbed) return youtubeThumbnail(item.animationEmbed.youtubeId)
  return undefined
}
```

Place both directly below `hasAnimation()` (`lib/work.ts:444`), since `animationPosterFor` is built from exactly the same fields.

**Real URL, verified 2026-09-10:** `https://i.ytimg.com/vi/RTGjy1jDMyM/hqdefault.jpg` — confirmed via the oEmbed check above (`thumbnail_url` in that response is this exact host and path shape). Use `i.ytimg.com`, not `img.youtube.com` — the latter redirects to the former, and there's no reason to pay for a redirect hop on every render.

---

## 2. `WorkPlaceholder` — `work-visuals.tsx:216-290`

Current `src` resolution (`work-visuals.tsx:218`):

```ts
const src = quality === 'thumb' ? (item.thumb ?? item.image) : item.image
```

New:

```ts
const src = quality === 'thumb' ? (item.thumb ?? animationPosterFor(item)) : animationPosterFor(item)
```

That's the entire change to this component — every other branch (the `contain`-fit path, the `cover`-fit path, the tinted-placeholder fallback when `src` is still falsy) is untouched, since they already just consume whatever `src` resolves to. This is also why no new component is needed: **every** caller of `WorkPlaceholder` — `ImageCard`, `CollectionTile`'s stack, collection-page `ImageTile`/`IllustratedTile`, `PieceColumn` on the home page, `ProcessSection` — gets the fallback for free, with no call-site changes.

Add the import: `animationPosterFor` from `@/lib/work` (alongside the existing `lib/work` import block at the top of `work-visuals.tsx`).

---

## 3. `AnimationEmbed`'s pre-play poster — `components/media-player.tsx`

Two call sites inside `PieceMedia` (`media-player.tsx:438-448`) currently pass `poster={piece.image}` directly to both animation players:

```tsx
// before
{animationSrc ? (
  <AnimationPlayer src={animationSrc} poster={piece.image} aspect={piece.imageAspect} title={piece.title} />
) : (
  animationEmbed && <AnimationEmbed video={animationEmbed} poster={piece.image} title={piece.title} />
)}
```

```tsx
// after
{animationSrc ? (
  <AnimationPlayer src={animationSrc} poster={animationPosterFor(piece)} aspect={piece.imageAspect} title={piece.title} />
) : (
  animationEmbed && <AnimationEmbed video={animationEmbed} poster={animationPosterFor(piece)} title={piece.title} />
)}
```

For the `animationSrc` branch this is a no-op today (a piece can't have both `animationSrc` and `animationEmbed` set in practice, per the existing doc comment at `lib/work.ts:76`, so `animationPosterFor` just returns `piece.image` unchanged there) — it's changed anyway so both branches read the same helper instead of one reading it and one not, which would otherwise look like an oversight to the next person editing this block.

For the `animationEmbed` branch this is the actual fix: `AnimationEmbed`'s own fallback when `poster` is falsy is a plain `bg-black` box (`media-player.tsx:210`) — that box is untouched by this spec and remains the fallback for the (currently impossible, since `animationPosterFor` always returns *something* once `animationEmbed` is set) case of a video with no id, which can't happen given `EmbeddedVideo.youtubeId` is required.

Add the import: `animationPosterFor` from `@/lib/work`.

---

## 4. `next.config.mjs` — required, not optional

`next/image` refuses to optimize an external host unless it's explicitly allowed. `WorkPlaceholder`'s `cover`-fit branch (`work-visuals.tsx:243-255`) renders `<Image fill src={src} .../>` — once `src` can be `https://i.ytimg.com/...`, this **will throw at request time** ("Invalid src prop … hostname … is not configured") without this change. This is not a nice-to-have; the feature does not function without it.

```js
// next.config.mjs
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
}

const withMDX = createMDX({})

export default withMDX(nextConfig)
```

`WorkPlaceholder`'s `contain`-fit branch (the lightbox path, `work-visuals.tsx:220-241`) also uses `next/image` and is subject to the same restriction — no separate config needed, `remotePatterns` covers every `next/image` usage of that host site-wide.

---

## 5. File/module structure summary

| File | Change |
| --- | --- |
| `lib/work.ts` | Add `youtubeThumbnail()` and `animationPosterFor()`, placed after `hasAnimation()` |
| `components/work-visuals.tsx` | `WorkPlaceholder`'s `src` resolution routes through `animationPosterFor()` (§2); add the import |
| `components/media-player.tsx` | `PieceMedia`'s two poster props route through `animationPosterFor()` (§3); add the import |
| `next.config.mjs` | Add `images.remotePatterns` for `i.ytimg.com` (§4) — **required for this to work at all** |

---

## 6. Edge cases

- **A video later deleted or made private.** `i.ytimg.com/vi/<id>/hqdefault.jpg` for a dead video ID returns YouTube's generic gray placeholder image (not a 404) — `next/image` renders it as if it were a real thumbnail, no broken-image icon, no crash. Slightly wrong (a gray placeholder instead of the tinted site placeholder) but not broken. No detection/recovery is specified here — this codebase doesn't runtime-validate any other asset path either (a bad local `image` string would 404 the same way), so this isn't a new category of risk, just the same existing one extended to one more host.
- **A piece with `animationEmbed` and a local `image`.** Local wins, per §0 — `animationPosterFor` checks `item.image` first, unconditionally. This is every real piece in the sample data today (see the status banner) — the fallback is currently inert and only activates for a future piece.
- **A collection whose cover piece has `animationEmbed`.** Excluded on purpose — `animationPosterFor` checks `!isCollection(item)` before looking at `animationEmbed`, mirroring `hasAnimation()`'s existing rule that a collection doesn't carry its own single animation. A collection with no `image` of its own falls through to the ordinary tinted placeholder, exactly as today.
- **The `thumb` quality path** (used for a collection stack's low-visibility back cards, `WorkPlaceholder`'s `quality="thumb"` branch). Also routed through `animationPosterFor` as a fallback *after* `item.thumb` — a piece with a hand-compressed `thumb` still uses it; only a piece with neither `thumb` nor `image` falls all the way to the YouTube thumbnail, which is a full-size remote fetch (no compressed variant exists for it). Acceptable: this path already only renders a thin sliver of the image, and no current piece is missing both `thumb` and `image` while also carrying `animationEmbed`.
- **Rate limiting / `i.ytimg.com` availability.** Out of this spec's concern — it's Google's CDN, not a service this site controls or needs to degrade gracefully against beyond what `next/image` already does for any failed remote fetch.

---

## 7. Out of scope

- **A distinct `AnimationCard` component or a new `WorkCard` dispatch branch** — explicitly rejected in §0; the fix lives in the one shared primitive instead.
- **Playing the video inline from the gallery grid or lightbox.** Clicking still navigates to the piece's own page, unchanged.
- **Any YouTube-specific chrome on the tile** — a red play button, a duration badge, a "YouTube" wordmark, etc. The tile's existing play-triangle overlay (`MediaBadges`' `animation` branch) is untouched.
- **Auditing or fixing other pieces' `animationEmbed`/`animationSrc` data.** The one existing usage was verified live (see the status banner); this spec doesn't touch content, only the fallback mechanism for content that hasn't been authored yet.
- **A YouTube Data API lookup for a richer thumbnail** (e.g. `maxresdefault` with a `hqdefault` retry on failure). `hqdefault` alone was chosen specifically to avoid needing that kind of fallback chain — see §0.

---

## 8. ARCHITECTURE.md — recommendation

**A small addition, not a new section — fold it into "Media: speedpaints and animations"** (`docs/ARCHITECTURE.md:861`), which already documents `animationEmbed`/`AnimationEmbed` and keeps a running decisions table (D1-D3). This is naturally a **D4**, not a standalone architectural concern the way `StatusRail` is in the other spec from this session — it's a one-function fallback with a single, narrow rule ("local image wins, YouTube thumbnail is the fallback"), not a pattern future code needs to keep discovering and rejoining.

Same timing note as the other spec: this repo folds a spec into `ARCHITECTURE.md` once built, not at design time (see that spec's §7) — draft only, to add once shipped:

> | **D4 — embed poster fallback** | `animationPosterFor()` (`lib/work.ts`) — an item's own `image` if it has one, else YouTube's `hqdefault` thumbnail when it carries `animationEmbed`. Read by both `WorkPlaceholder` and `PieceMedia`'s pre-play poster, so every tile and the piece's own page agree. Requires `i.ytimg.com` in `next.config.mjs`'s `images.remotePatterns` — the feature 500s without it. |
