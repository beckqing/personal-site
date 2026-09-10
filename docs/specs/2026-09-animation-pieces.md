# Spec — animation pieces: real thumbnails, direct link, a scenes section

> **Status: designed 2026-09-10 with Beck, not built.**
>
> **Supersedes [2026-09-animation-poster-fallback.md](2026-09-animation-poster-fallback.md)**,
> written earlier the same day and reversed once Beck looked at a concrete
> example (`philosophy-animation`). This file is the current design; the
> other is kept only as a record of the earlier draft, per this superseding
> note's own banner.
>
> The throughline, arrived at over several corrections: **a finished
> animation is the piece, not its poster.** Concretely —
>
> 1. A gallery card for an animation piece shows the animation's own
>    thumbnail (YouTube's real one, for an embed), not a hand-set `image` —
>    reversing the earlier draft's "local image wins" priority.
> 2. Clicking that card skips the gallery's still-image lightbox entirely
>    and goes straight to the piece's own page — where, it turns out, the
>    player is *already* the first thing on the page (§4); no layout
>    reorder needed, just two small chrome fixes.
> 3. **Speedpaints are a completely different thing and are untouched by
>    any of this** — a speedpaint is process footage of a *still* piece, and
>    that still, not the video, stays the thing you see and click into.
> 4. A piece can carry a `scenes` field — finished stills that supplement
>    the animation (not WIP shots — that's what `process` is for) — shown in
>    a small section under the player.
>
> Touches `lib/work.ts`, `components/work-visuals.tsx`,
> `components/work-gallery.tsx`, `components/media-player.tsx`,
> `app/work/[slug]/page.tsx`, `app/work/[slug]/[pieceSlug]/page.tsx`, and
> `next.config.mjs`. No new route, no new component library, one genuinely
> new type field (`WorkPiece.scenes`).
>
> **Also verified while designing this:** Beck questioned whether the black
> bars visible on `philosophy-animation`'s embedded video are a bug in this
> site's code. Checked YouTube's oEmbed response for the shared
> `youtubeId` (`RTGjy1jDMyM`) — it reports `width: 200, height: 113`
> (≈1.77, matching the `aspect: '16/9'` already stored in `lib/work.ts`), so
> the reserved-box aspect isn't the mismatch. The bars are very likely
> baked into the uploaded video's own frame (a common result of exporting a
> non-widescreen canvas padded to 16:9 for YouTube) — see §4c, not
> something fixable from this site's CSS. Two things Beck flagged in the
> same look *are* this site's own styling and are fixed here: an unwanted
> border and an unwanted rectangular drop-shadow around the player (§4b).

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| "Different card type" for animations — what does that mean | **Same tile shape, real video thumbnail as the picture** — reaffirmed from the superseded draft | Beck, 2026-09-10 |
| Priority: hand-set `image` vs. the animation's own thumbnail | **Reversed from the superseded draft.** For an embedded animation, YouTube's thumbnail wins outright — a curated still no longer outranks the thing the piece actually is | Beck, 2026-09-10 |
| Animation vs. speedpaint | **Two different concepts, treated oppositely.** An *animation* (`animationSrc`/`animationEmbed`) is the finished piece — leads to itself, everywhere. A *speedpaint* (`speedpaintSrc`) is process footage of a still piece — completely unaffected by this spec | Beck, 2026-09-10 |
| What "front and center on click" means | **A real navigation to the piece's own page** (URL changes, Back works normally) — not a modal/lightbox popped over the gallery grid. Turned out the destination page already puts the player first (§4) | Beck, 2026-09-10 |
| Autoplay on arrival | **No — poster first, tap to play**, matching `AnimationEmbed`'s existing pattern. Doesn't pull YouTube's player script or start playback on a click that only meant "open this" | Beck, 2026-09-10 |
| Three gallery cards (Privilege/Reidentification/Origins) all showing the same video's thumbnail | **A sign `philosophy-animation` itself is modeled wrong**, not something to route around at the component level. Fix the content (§6), described here but not executed | Beck, 2026-09-10 |
| Whether that restructuring is a general rule | **Yes — a collection whose pieces are all scenes from one shared animation collapses into one animation piece + a `scenes` section**, not three top-level entries | Beck, 2026-09-10 |
| Should the bonus stills reuse `ProcessSection` | **No — different concept** (finished scenes, not WIP), needs its own heading/field so it isn't mislabeled. Same *shape* is fine — no reason to invent a new data structure, only a new field/heading (§5) | Beck, 2026-09-10 |
| Self-hosted animation's gallery thumbnail | **Its existing poster/image, treated as the video's thumbnail** — no separate video-thumbnail source exists for a self-hosted clip, so nothing changes for that case | Beck, 2026-09-10 |
| The player's border and drop-shadow | **Both unwanted**, per Beck looking at the actual render. Fixed in §4b | Beck, 2026-09-10 |
| The black bars in the video itself | **Not this site's bug** — verified via oEmbed (§4c); very likely baked into the source video | This spec, verified 2026-09-10 |

---

## 1. Vocabulary carve-out: this spec is about `hasAnimation`, never `hasSpeedpaint`

Every section below applies only to a piece where `hasAnimation(item)` is true
(`item.animationSrc || item.animationEmbed`, `lib/work.ts:444`). A piece with
only `speedpaintSrc` — no finished animation — is **not touched by this spec
at all**: it keeps opening the ordinary still-image gallery lightbox, its
card keeps showing its own `image`, and `PieceMedia`'s speedpaint section is
unchanged. A piece with *both* (the existing `both` case in `PieceMedia`,
`media-player.tsx:429`) is treated as an animation piece for every rule
below — the finished animation still leads, the speedpaint stays exactly
where `PieceMedia` already puts it (secondary, below the animation, in its
own "speedpaint" labeled block).

---

## 2. Thumbnail resolution — `animationPosterFor()` (revised)

Replaces the superseded draft's version. Same two functions, same location
(`lib/work.ts`, directly below `hasAnimation()`), reversed priority:

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
 * The picture that represents this item. For a YouTube-embedded animation,
 * that's the video's own thumbnail, unconditionally — a curated still (even
 * a hand-set `image`) doesn't outrank the thing the piece actually is. Every
 * other item — including a self-hosted `animationSrc` piece, which has no
 * separate video-thumbnail source to prefer — falls through to its own
 * `image`. Collections are excluded from the embed branch, matching
 * `hasAnimation()`'s own rule: a collection doesn't carry a single
 * animation of its own, one of its pieces does.
 */
export function animationPosterFor(item: WorkItem): string | undefined {
  if (!isCollection(item) && item.animationEmbed) return youtubeThumbnail(item.animationEmbed.youtubeId)
  return item.image
}
```

Same two call sites as the superseded draft, unchanged mechanics — only the
function body above changed:

- **`WorkPlaceholder`**'s `src` resolution (`work-visuals.tsx:218`):
  `quality === 'thumb' ? (item.thumb ?? animationPosterFor(item)) : animationPosterFor(item)`.
  This is still the one place that fixes every caller at once — the gallery
  card, the home page's `PieceColumn`, collection-page tiles, all get the
  real thumbnail for free.
- **`PieceMedia`**'s two poster props (`media-player.tsx:441` and `:447`):
  `poster={animationPosterFor(piece)}` on both `AnimationPlayer` and
  `AnimationEmbed`.

---

## 3. Gallery click behavior — `opensInGalleryLightbox()` excludes animation

Current rule (`lib/work.ts:2483`) explicitly *includes* animation:

> "A piece with a speedpaint or animation *is* included — the finished
> still is the piece, the video is process…"

That framing is exactly what's being reversed. New rule:

```ts
/**
 * Whether this gallery card opens the lightbox in place rather than
 * navigating. A code demo is excluded on purpose: its `image` is only a
 * poster still, and the thing it advertises runs on its own page. An
 * animation is excluded for the same reason, as of 2026-09-10 — a finished
 * animation is the piece, not its poster, and it leads straight to itself.
 * A piece with only a speedpaint (no finished animation) stays included:
 * there, the still genuinely is the piece, and the speedpaint is process —
 * the framing `PieceMedia` still uses for that case.
 */
export function opensInGalleryLightbox(item: WorkItem): item is WorkPiece {
  return (
    !isCollection(item) &&
    !isHybrid(item) &&
    !isTextForward(item) &&
    !isCodeDemo(item) &&
    !hasAnimation(item) &&
    Boolean(item.image)
  )
}
```

One line added (`!hasAnimation(item)`), one doc comment rewritten. No changes
needed in `ImageCard` itself — when `opensInGalleryLightbox(item)` is
`false`, it already falls into the plain-`<Link>` branch (the same branch a
code demo uses today), which renders `WorkPlaceholder` (now resolving to the
real thumbnail, §2) wrapped in a link to `workHref(item)`. `MediaBadges`'
centered play-triangle overlay is rendered outside that branch and is
unaffected — the "press play" affordance stays exactly where it is.

Also update ARCHITECTURE.md's own copy of this rule when this ships — see
§10.

---

## 4. The piece's own page

### 4a. No reorder needed — the player is already first

Both routes that can render an animation piece already put `PieceMedia`
ahead of the title:

- `app/work/[slug]/page.tsx`, the default (non-text-forward, non-hybrid,
  non-code-demo) branch, `:278-280` — `<PieceMedia .../>` is the first thing
  in the `<article>`, title/description follow in a `max-w-2xl` div below it.
- `app/work/[slug]/[pieceSlug]/page.tsx:203-211` — identical order, `<PieceMedia
  .../>` then the title block.

So "front and center on click" was never really a layout problem — it was
the gallery lightbox detour (§3). Once that's gone, clicking a card lands
directly on a page that already leads with the player. Nothing to build
here beyond the two chrome fixes below.

### 4b. Chrome cleanup: no border, no drop-shadow, on the embed specifically

Two independent fixes, matching exactly what Beck flagged looking at the
real render — scoped to `AnimationEmbed` only, not `PlayerFrame` generally,
since self-hosted `AnimationPlayer` and `SpeedpaintPlayer` weren't part of
the complaint and keep their current bordered look.

**Border** — `PlayerFrame` (`media-player.tsx:104-121`) gains a `bare`
prop:

```tsx
function PlayerFrame({
  aspect,
  bare = false,
  className,
  children,
}: {
  aspect?: string
  /** Omits the border — for AnimationEmbed, whose YouTube iframe already has its own visible edge and doesn't need a second one drawn around it. */
  bare?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl bg-black', !bare && 'border border-border', className)}
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      {children}
    </div>
  )
}
```

`AnimationEmbed` (`media-player.tsx:167-221`) passes `bare` unconditionally
— this component only ever renders a YouTube embed, so there's no case where
it should keep the border:

```tsx
<PlayerFrame aspect={video.aspect} bare className={className}>
```

`AnimationPlayer` and `SpeedpaintPlayer`'s own `<PlayerFrame>` calls are
untouched (`bare` defaults to `false`, identical to today).

**Drop-shadow** — remove `shadow-sm` from all three `PieceMedia` call
sites (it was never part of `PlayerFrame` itself; it's the outer wrapper
className each route file passes in):

- `app/work/[slug]/page.tsx:264` — `className="mx-auto mt-8 max-w-3xl shadow-sm"` → `className="mx-auto mt-8 max-w-3xl"`
- `app/work/[slug]/page.tsx:280` — `className="mx-auto max-w-3xl shadow-sm"` → `className="mx-auto max-w-3xl"`
- `app/work/[slug]/[pieceSlug]/page.tsx:208` — same change

This drops the shadow for self-hosted animations and speedpaints too, not
just embeds — a deliberate small scope widening, not an oversight: the
shadow is applied at the shared wrapper level (all of `PieceMedia`'s
branches sit inside one caller-styled `<div>`), so scoping its removal to
"only when the visible content is a YouTube embed" would mean moving the
class down into each conditional branch inside `PieceMedia` for one
cosmetic detail nobody asked to change for those cases. The border (which
*is* branch-specific, via `bare`) already carries enough separation from
the page background on its own — a border-only edge is consistent with
spec #1 in this series moving away from heavier shadow chrome generally.
Flagged explicitly in case Beck wants the self-hosted/speedpaint cases to
keep their shadow — that would mean not making this change site-wide and
instead threading the removal through `PieceMedia`'s own conditional
branches.

### 4c. The black bars — not this site's bug

`aspect: '16/9'` (`lib/work.ts:1490/1502/1514`) matches YouTube's own
reported aspect for this video (oEmbed: `width: 200, height: 113` ≈ 1.77 —
see the status banner). The reserved box and the video's real aspect agree,
so the pillarboxing isn't a sizing mismatch between this site's container
and YouTube's player. The most likely explanation is that the uploaded
video file itself has the bars baked into its pixels — common when a
personal project's native canvas isn't 16:9 and gets padded to fit YouTube's
frame on export. **Nothing to fix in this codebase for that** — no CSS on
this site's side can crop content that YouTube's own player is faithfully
displaying at its native aspect. To confirm: open
`https://www.youtube.com/watch?v=RTGjy1jDMyM` directly — if the bars are
there too, that's conclusive, and this section is closed.

---

## 5. `scenes` — a section for finished stills, distinct from `process`

### 5.1 Type — `lib/work.ts`

Reuses `ProcessStill`'s exact shape (`src`/`caption`/`alt`,
`lib/work.ts:265-276`) — there's no structural difference from `process`,
only a difference in what the stills *are* (finished scenes vs. WIP shots)
and therefore in field name and heading:

```ts
/**
 * Finished stills that supplement an animation — scenes from it, not WIP
 * screenshots of making it (that's `process`). Same shape as `ProcessStill`
 * on purpose; the distinction is semantic (what these stills show), not
 * structural. Rendered by `SceneSection`, under its own "scenes" heading.
 */
scenes?: ProcessStill[]
```

Place directly below the existing `process?: ProcessStill[]` field
(`lib/work.ts:104`).

### 5.2 Rendering — `work-visuals.tsx`

`ProcessSection` (`work-visuals.tsx:862-891`) and its helper
`processLightboxItem` (`:843-851`) already do exactly the rendering this
needs — extract the shared part so `scenes` doesn't duplicate it:

```tsx
/** Ephemeral WorkPiece stand-in for a still, for ImageLightbox/WorkPlaceholder. Never added to WORK, never routed to. keyPrefix keeps process/scenes lightbox identities distinct if a piece ever carries both. */
function stillLightboxItem(piece: WorkPiece, still: ProcessStill, index: number, keyPrefix: string): WorkPiece {
  return {
    slug: `${piece.slug}-${keyPrefix}-${index}`,
    title: still.alt ?? piece.title,
    year: piece.year,
    tags: piece.tags,
    image: still.src,
  }
}

/** Shared rendering for `process` and `scenes` — a heading, then each still as its own captioned figure opening in the ordinary lightbox. Not exported; ProcessSection and SceneSection are the public entry points. */
function StillsSection({
  piece,
  stills,
  heading,
  keyPrefix,
}: {
  piece: WorkPiece
  stills: ProcessStill[] | undefined
  heading: string
  keyPrefix: string
}) {
  if (!stills || stills.length === 0) return null
  const items = stills.map((still, i) => stillLightboxItem(piece, still, i, keyPrefix))
  return (
    <section className="mt-10 max-w-2xl">
      <h2 className={headingStyles.eyebrow}>{heading}</h2>
      <div className="mt-4 space-y-8">
        {stills.map((still, i) => (
          <figure key={still.src}>
            <ImageLightbox items={items} initialIndex={i} className="rounded-xl">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <WorkPlaceholder item={items[i]} />
              </div>
            </ImageLightbox>
            {still.caption && (
              <figcaption className="mt-3 space-y-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                {still.caption.split('\n\n').map((para, p) => (
                  <p key={p}>{para}</p>
                ))}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  )
}

export function ProcessSection({ piece }: { piece: WorkPiece }) {
  return <StillsSection piece={piece} stills={piece.process} heading="process" keyPrefix="process" />
}

/** A piece's finished-scene stills — see WorkPiece.scenes. Same rendering as ProcessSection, its own heading and field. */
export function SceneSection({ piece }: { piece: WorkPiece }) {
  return <StillsSection piece={piece} stills={piece.scenes} heading="scenes" keyPrefix="scene" />
}
```

This is a pure refactor for the `process` path — byte-identical output for
every existing `process` caller (`ProcessSection`'s public signature is
unchanged). `SceneSection` is the one new export.

### 5.3 Call sites

Add `<SceneSection piece={piece} />` next to each existing
`<ProcessSection piece={piece} />` call, process first:

- `app/work/[slug]/page.tsx:244` (chapbook-adjacent branch)
- `app/work/[slug]/page.tsx:272` (text-forward branch)
- `app/work/[slug]/page.tsx:296` (default branch — the one an animation
  piece actually hits)
- `app/work/[slug]/[pieceSlug]/page.tsx` (wherever its own `ProcessSection`
  call lives)

Both guard themselves independently (`stills.length === 0` returns `null`),
so adding the call everywhere `ProcessSection` already appears is safe even
though only one branch currently has any real use for it.

---

## 6. `philosophy-animation` — the actual content fix (described, not executed)

**Not done in this session** — per "don't write any code yet," and because
this is data-authoring (Beck's own words/choices), not component work, the
same reasoning tiers-and-pins used for "which pieces get which tier" (its
own §10, left to Beck). Precise enough to execute later without
re-deriving:

Collapse the `philosophy-animation` collection (`lib/work.ts:1466-1517`,
3 sub-pieces) into **one top-level `WorkPiece`**:

- `slug`/`title`: keep `philosophy-animation` / `'Philosophy Animation'`
  from the collection itself, or retitle to match the video's real YouTube
  title ("Honey…") — Beck's call.
- `animationEmbed: { youtubeId: 'RTGjy1jDMyM', aspect: '16/9' }` — unchanged,
  moves from the sub-pieces up to the new single piece.
- `description`: the collection's existing one line works as-is
  ("Three scenes from an animation made for a philosophy class, on adoption
  and identity.").
- `image`: now moot for the gallery card (§2 makes the YouTube thumbnail win
  regardless) — **check `generateMetadata`/OG-image handling before
  dropping it entirely**, in case social-preview generation reads `image`
  directly rather than going through `animationPosterFor`.
- `scenes`: the three sub-pieces' `image` + `writeup` become three
  `ProcessStill`s — `image` → `src`, `writeup` → `caption`, title → `alt`:
  ```ts
  scenes: [
    { src: '/art/2019/philosophy-animation-01.jpg', alt: 'Privilege', caption: /* Privilege's writeup */ },
    { src: '/art/2019/philosophy-animation-02.jpg', alt: 'Reidentification', caption: /* Reidentification's writeup */ },
    { src: '/art/2019/philosophy-animation-03.jpg', alt: 'Origins', caption: /* Origins's writeup */ },
  ]
  ```
- `tags`: union of the sub-pieces' tags — trivial here, all three are
  already `['art', 'digital']`.

**Real consequences to check before this ships:** the sub-pieces' own URLs
(`/work/philosophy-animation/privilege`, `/reidentification`, `/origins`,
served by `app/work/[slug]/[pieceSlug]/page.tsx`'s `generateStaticParams`)
stop existing once there's no collection to hold them — no redirect is
specified here (out of scope, §9). Each sub-piece's writeup ends with
`[ link to animation in bio ]`, suggesting an external link (Instagram bio)
may point at one of these paths — worth a look before they go dead, not
chased down here.

---

## 7. File/module structure summary

| File | Change |
| --- | --- |
| `lib/work.ts` | `youtubeThumbnail()`/`animationPosterFor()` (§2, reversed priority); `opensInGalleryLightbox()` excludes `hasAnimation` (§3); add `scenes?: ProcessStill[]` to `WorkPiece` (§5.1) |
| `components/work-visuals.tsx` | Extract `StillsSection`, add `stillLightboxItem` (renamed/generalized from `processLightboxItem`), export `SceneSection` alongside the now-thinner `ProcessSection` (§5.2) |
| `components/media-player.tsx` | `PlayerFrame` gains `bare` prop; `AnimationEmbed` passes `bare` (§4b); `PieceMedia`'s two poster props route through `animationPosterFor()` (§2) |
| `app/work/[slug]/page.tsx` | Drop `shadow-sm` from both `PieceMedia` call sites (§4b); add `<SceneSection>` next to each `<ProcessSection>` call (§5.3) |
| `app/work/[slug]/[pieceSlug]/page.tsx` | Same two changes as above |
| `next.config.mjs` | `images.remotePatterns` for `i.ytimg.com` — **required**, same as the superseded draft's §4; `next/image` throws without it |
| `lib/work.ts` (content) | `philosophy-animation` restructuring (§6) — **not executed this session** |

---

## 8. Edge cases

- **The black bars** — not a code issue; see §4c. Closed pending Beck's own confirmation on youtube.com.
- **A piece with both `animationSrc` and `animationEmbed`** — doesn't happen today (mutually exclusive in practice, `lib/work.ts:76`); if it ever did, `animationPosterFor` checks the embed branch first, so the embed thumbnail wins.
- **A piece with both `process` and `scenes`** — both sections render, `process` first (call-site order, §5.3) — arbitrary but fixed, so it isn't left to accident per file.
- **A self-hosted `animationSrc` piece** — excluded from the gallery's still-image lightbox same as an embed (§3 checks `hasAnimation`, not specifically `animationEmbed`), confirmed intentional: Beck's rule was "all animations," not "all YouTube animations." Its gallery card still shows its own `image` (§2 — no separate video-thumbnail source exists for it), and its own page gets the same border/shadow-drop treatment as an embed (`AnimationPlayer` keeps its border per §4b's scoping — only `AnimationEmbed` goes bare; the shadow drop is site-wide per §4b).
- **A speedpaint-only piece** — completely outside this spec's reach, per §1. Confirm during implementation that none of §2/§3/§4/§5's changes accidentally touch a piece where `hasAnimation()` is false but `hasSpeedpaint()` is true.
- **`generateMetadata`'s OG image**, if it reads `piece.image` directly rather than through `animationPosterFor` — flagged in §6 as a thing to check before `philosophy-animation`'s `image` field is dropped; not otherwise touched by this spec, since no other current animation piece is missing an `image`.

---

## 9. Out of scope

- **Executing the `philosophy-animation` data restructuring** (§6) — described precisely, not authored here.
- **Redirects** from the retiring sub-piece URLs.
- **Chasing down the Instagram-bio link** mentioned in the sub-pieces' writeups.
- **Investigating the black bars further** than the aspect-ratio check already done (§4c) — if they're baked into the source, there's nothing left to do from this codebase.
- **Changing `AnimationPlayer`/`SpeedpaintPlayer`'s bordered look** — only `AnimationEmbed` goes bare (§4b).
- **A grid or otherwise novel layout for `SceneSection`** — it reuses `ProcessSection`'s existing stacked-figure-with-caption layout verbatim; the only new things are the field name and the heading text.
- **A YouTube Data API lookup, or any richer thumbnail source than `hqdefault`** — same reasoning as the superseded draft's §7.

---

## 10. ARCHITECTURE.md — recommendation

Same timing recommendation as spec #1 in this series (fold in once built,
matching this repo's "Discipline columns" precedent) — but this one's
natural home is **"Media: speedpaints and animations"**
(`docs/ARCHITECTURE.md:861`), as a new decisions-table row alongside D1-D3,
not a standalone section:

> | **D4 — animations lead to themselves** | An animation piece (`hasAnimation()`) skips the gallery's still-image lightbox and links straight to its own page (`opensInGalleryLightbox()` excludes it) — a curated still can't outrank the thing the piece actually is. Its card shows the animation's own thumbnail (`animationPosterFor()` — YouTube's `hqdefault` for an embed, unconditionally), not a hand-set `image`. A **speedpaint-only** piece is entirely unaffected: the still is still the piece there, and stays what you click into. `AnimationEmbed` renders `PlayerFrame` in `bare` mode (no border) — its own iframe edge is enough. |
> | **D5 — `scenes` vs. `process`** | `scenes` (`ProcessStill[]`, same shape as `process`) holds finished stills that supplement an animation; `process` stays WIP-only. Both render through the same internal `StillsSection`, under their own headings, via `SceneSection`/`ProcessSection`. |

---

## 11. As built — 2026-09-10

Shipped the same day it was designed, including §6, which this file had left
to a later session. Recorded here rather than by editing the sections above,
so the design and what it collided with stay separately legible. §§1–5, 7 and
the D4/D5 rows above shipped as written except where noted.

**Six things the spec got wrong or left open, and how each resolved:**

1. **§5.3's fourth call site doesn't exist.** The spec said to add
   `<SceneSection>` "next to each existing `<ProcessSection>` call," listing
   `app/work/[slug]/[pieceSlug]/page.tsx` among them — but that route had no
   `ProcessSection` call at all, and never had. **That was its own latent
   bug**, surfaced by this spec and fixed alongside it: a collection sub-piece
   carrying `process` rendered nothing, because only the top-level route knew
   the field existed. Both sections are now called in both routes, `process`
   first (§8's fixed order). Latent, not live — the only two pieces carrying
   `process` today (`child-not-adult`, `desire-and-distance`) are top-level,
   so nothing was actually being dropped on the site.
2. **§6's OG-image worry is a non-issue.** The spec flagged "check
   `generateMetadata`/OG-image handling before dropping `image`." Checked:
   nothing on this site derives a social image from `piece.image`. No route
   sets `openGraph` or `twitter` at all, and `app/opengraph-image.tsx` is a
   single static site-wide card that takes no params and never reads `WORK`.
   Dropping `image` would have had zero metadata consequence.
3. **`image` was kept anyway, for a different reason the spec missed.**
   `PieceMedia` renders its trailing "view still image" trigger
   (`media-player.tsx`) *unconditionally* in the animation branch. Dropping
   `image` would have left that button opening a tinted placeholder. So
   `honey` keeps its `image`/`imageAspect`; they describe the still, which is
   now all they're read for.
4. **§6 silently dropped half the imported text.** It mapped each sub-piece's
   `writeup` to a scene caption and said nothing about `description` — which
   on all three pieces is also Beck's own Instagram caption text. Captions are
   now `description` + `writeup` joined verbatim, in the order the piece page
   rendered them.
5. **Neither spec noticed the aspect mismatch.** Making the card paint a 16:9
   YouTube thumbnail while `aspectStyleFor` still sized its box from
   `imageAspect` (`1/1` on every piece here) center-cropped the thumbnail.
   Fixed generally rather than per-piece, at the same primitive §2 chose:
   `posterAspectFor()` sits beside `animationPosterFor()` in `lib/work.ts` and
   **must branch identically to it** — one answers what fills the box, the
   other what shape the box is. `aspectStyleFor` reads it, so all seven call
   sites are fixed at once.
6. **§3's ARCHITECTURE.md instruction was overdue.** `ARCHITECTURE.md`'s
   lightbox-predicate paragraph asserted "A speedpaint or animation is **not**
   excluded" — the exact claim §3 reverses. Rewritten, and the collection-layout
   table no longer lists `philosophy-animation` as a `gallery` collection.

**§6 executed, with two deviations Beck chose:** the piece is titled **Honey**
after the video itself, and its **slug changed to `honey`** — so
`/work/philosophy-animation` retires along with its three sub-piece URLs.
**No redirects** were added (§9 had them out of scope; Beck confirmed a clean
break). Known accepted loss: `filterWork` reads neither `scenes` nor
`process`, so "Privilege"/"Reidentification"/"Origins" stop being search terms.

**§4c stands closed as designed** — nothing was changed about the black bars.
