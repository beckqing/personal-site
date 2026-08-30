# Spec — coding explorations

> **Vocabulary changed after this was written.** What this file calls a
> **coding exploration** — and what it calls a **sketch** throughout — ships
> as a **code demo** (`CodeDemo`, `codeDemo`, `isCodeDemo`, `CodeDemoFrame`,
> `public/code-demos/`, `code-demo:*` messages). Beck decided that 2026-08-29,
> after seeing it built. "Sketch" collided with Beck's own writeups about
> pencil sketches and sketchbooks in `lib/work.ts`. Read every "sketch" below
> as "code demo"; the design is unchanged, only the noun. The filename keeps
> the original working title so existing links don't rot.
>
> **Status: built 2026-08-29, except §8.** §2–§7 and §9 are shipped and
> verified. **§8 (the home page's science panel) is deliberately not built** —
> it needs a real exploration to point at and replacement caption copy, both
> listed in §12 as Beck's to supply, and a `kind: 'sketch'` card with no
> sketch would be a fallback branch this spec doesn't describe. This file
> therefore stays in `docs/specs/` rather than moving to `docs/history/`;
> move it once §8 lands. Where the build diverged is recorded in §13 below.
>
> Closes [TODO.md](../TODO.md) **§1** (the home page's fabricated science
> panel) and **§2** (`science` is a discipline with zero work in it). Both
> were always blocked on this content existing, not on code.

A **coding exploration** is a piece of work whose subject is a thing that
runs. It files under `science`, it lives in `/work` beside everything else,
and it gets a new piece-page layout — the fourth kind of piece the site
knows how to render.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| What an exploration contains | **Live, runnable sketches** — generative/interactive things that run in the browser | Beck, 2026-08-29 |
| Whether code appears on the page | **Sometimes.** Annotated excerpts, opt-in per piece — not a required section | Beck, 2026-08-29 |
| How it files under `science` | **Add `code` to the science `field` facet.** Three-discipline structure untouched | Beck, 2026-08-29 |
| Where they live | **Inside `/work`, as a new derived layout.** No new top-level section | Beck, 2026-08-29 |
| How a sketch is embedded | **A sandboxed iframe over a self-contained HTML file in `public/sketches/`** — not a React component | §3 below |
| Whether the gallery tile runs | **No.** Poster still + a runnable badge | §7 below |
| The science home panel | **Becomes a live miniature** — the fourth object type on the corkboard | §8 below |

---

## 1. What kind of piece this is

The site already derives how a piece renders from what it carries, not from
a `type` column (ARCHITECTURE, "Behaviour is derived, not stored"). A
coding exploration is a fourth row in that table, and it is defined by what
it *leads with*:

| Kind | Predicate | Leads with |
| --- | --- | --- |
| image piece | has `image`, no `text` | the finished image |
| text-forward | has `text`, no `image` | the words |
| hybrid | has both | both, neither subordinate |
| **sketch** | **has `sketch`** | **a thing that runs** |

That distinction is the whole design. A painting is finished and you look at
it; a poem is finished and you read it; a sketch is a system and you *run*
it. Everything below follows from putting the running thing first and
treating the still image as its poster rather than as the work.

**A sketch is not a new "project" concept.** It is a `WorkPiece` with one
extra field, so search, tags, sort, the collection machinery, metadata, the
sitemap, and `?tags=science` deep links all work with no special-casing.

---

## 2. Vocabulary: `code` joins the science field facet

`lib/work.ts`:

```ts
science: {
  name: 'field',
  tags: ['biology', 'neuroscience', 'material science', 'dataviz', 'code'],
},
```

One word. `ALL_TAGS` derives from this, so the filter panel, `categoryLabel`,
and the URL vocabulary all pick it up for free.

- **Don't prune the other four field tags** while adding this one. ARCHITECTURE's
  "the vocabulary is deliberately wider than the data" decision still stands —
  `biology`, `neuroscience`, `material science`, and `dataviz` stay, empty.
- `categoryLabel()` already iterates `DISCIPLINES` then each discipline's
  facet tags, so a piece tagged `['science', 'code']` labels itself **`code`**
  with no change. Verified against `components/work-visuals.tsx:56`.

### The tone trap: don't also tag a sketch `art`

`primaryDiscipline()` iterates `DISCIPLINES` in its own declared order
(`art`, `writing`, `science`) — **not** the item's tag order. So a sketch
tagged `['art', 'science', 'code']` resolves to the **art** tone (denim) and
labels itself with an art medium if it has one. Its own tag order is
irrelevant.

**Decided: explorations carry `science` + `code`, and not `art`.** A
generative sketch is arguably both, but the tint is the signal that this is
the third discipline finally showing up, and denim would swallow it.

The alternative — teaching `primaryDiscipline` to respect the item's own tag
order — is **rejected for now**: it would silently re-tone `first-art-fair`,
which carries `art` and `writing` and currently reads as art. Revisit only if
Beck actively wants dual-discipline sketches, and re-check every existing
multi-discipline item if so.

---

## 3. Data model

### `Sketch` on `WorkPiece`

```ts
/**
 * A runnable sketch: a self-contained page that this piece embeds and runs.
 * Plain data on purpose — see "Why an iframe" below.
 */
export type Sketch = {
  /** The sketch's own HTML entry, e.g. '/sketches/flow-field/index.html'. */
  src: string
  /**
   * The canvas's aspect ratio ('4/3', '1/1', '16/9'). Required: the frame
   * reserves its box before the iframe exists, so booting a sketch never
   * shifts the page.
   */
  aspect: string
  /**
   * Skip auto-run on scroll-into-view — show the poster and wait for a
   * press. For sketches heavy enough that starting unasked is rude.
   */
  manual?: boolean
  /** The sketch responds to a reseed message; shows the reseed control. */
  seedable?: boolean
  /** Public source, if there is any. Rendered as a header link. */
  repo?: string
}
```

```ts
export type WorkPiece = {
  // …
  /** A runnable sketch. Its `image` is the poster; see docs/specs. */
  sketch?: Sketch
}
```

**The poster reuses `image` / `imageAspect`.** No new field. A sketch's
`image` is a still capture of it running, which means every existing card,
placeholder, aspect helper, lightbox slice, and OG image path works
unchanged. `imageAspect` and `sketch.aspect` will normally be equal; they are
kept separate because the card is showing a picture and the frame is
reserving a canvas, and those are allowed to diverge (e.g. a cropped
poster).

A sketch **should** carry an `image`. Without one it falls back to the tinted
placeholder, which is legal but reads as missing art rather than as a sketch
waiting to start.

### Predicate

```ts
/** A piece whose subject is a thing that runs. */
export function isSketch(item: WorkItem): boolean {
  return !isCollection(item) && Boolean(item.sketch)
}
```

**`isSketch` is checked before the image branch** in both `WorkCard`
(`components/work-gallery.tsx:353`) and `PieceView`
(`app/work/[slug]/page.tsx`). A sketch carries `image` and no `text`, so
without an earlier branch it renders as a plain image piece — the failure is
silent and looks like nothing happened.

A sketch that also carries `text` is **out of scope**: `isHybrid` would fire
too and the precedence becomes a real question. If one ever exists, decide
then; don't pre-build the branch.

### Why an iframe, not a React component per sketch

This is the load-bearing implementation decision, and it is forced as much as
chosen:

1. **`lib/work.ts` may never hold a component reference.** It is imported by
   three client components and must stay plain serializable data
   (ARCHITECTURE, "The server/client boundary is load-bearing"). `MDX_ESSAY_SLUGS`
   exists *purely* as a workaround for that constraint. A sketch expressed as
   `{ src, aspect }` is plain data and needs no parallel-list indirection at
   all — one less thing that can drift.
2. **A sketch must not be able to break the site.** An infinite loop, a
   runaway allocation, or a stray `document.body` mutation in exploratory code
   takes the page down if it shares the document. An iframe is a real
   boundary, and exploratory code is exactly the code that deserves one.
3. **Sketches bring their own libraries.** p5, three, a shader loader — none
   of that should enter the site bundle for a page most visitors never open.
   In an iframe each sketch loads its own dependencies, lazily, and the main
   bundle never grows.
4. **Authoring stays a single file.** Beck writes one HTML file with a
   `<canvas>` and a `<script>`. No React, no build step, no component
   registry to keep in sync. Dropping a new folder in `public/sketches/` and
   adding six lines to `lib/work.ts` is the whole workflow.
5. **The artifact stays portable.** `/sketches/flow-field/index.html` opens
   and runs on its own, which is the "open standalone" link in §4, and is
   what makes a sketch survivable if the site is ever rebuilt again.

The cost is that a sketch doesn't inherit the page's theme tokens for free.
That is what §5's handshake is for, and it is a small, well-defined contract
rather than a leak.

---

## 4. The layout: a workbench, not a frame

The site's existing media idiom is `PlayerFrame` (`components/media-player.tsx:71`)
— a rounded, bordered box on black, shared by both video players so they
can't drift apart. `SketchFrame` is its sibling in that family: same
family resemblance, different instrument. A video is a recording you watch;
a sketch is a machine you switch on, so the chrome reads as a **workbench** —
a state rail above, a control rail below, the surface between them.

### The piece page

```
  ← all work

  ┌──────────────────────────────────────────────┐
  │ ● running          flow-field.js         ⧉   │   top rail: state dot,
  ├──────────────────────────────────────────────┤   mono name, standalone ↗
  │                                              │
  │                                              │
  │              [ the sketch runs ]             │   the surface, at
  │                                              │   sketch.aspect
  │                                              │
  ├──────────────────────────────────────────────┤
  │  ▮▮ pause    ↻ reseed              ⤢ full    │   control rail
  └──────────────────────────────────────────────┘

  flow field
  code · science · 2026 · source ↗

  Process notes / MDX body, with annotated excerpts interleaved
  where they earn their place.

  #science  #code  #color
```

Ordering, and why:

1. **The sketch comes first, above the title.** Every other piece page leads
   with its subject — image pieces lead with `PieceMedia`, poems lead with
   the verse. A sketch's subject is the running thing.
2. **Title and meta below the frame**, matching the non-text-forward branch
   of `PieceView` exactly. `categoryLabel` supplies `code`.
3. **The `repo` link joins the meta line**, as a fourth `·`-separated item.
   It is metadata about the piece, not a call to action, and giving it a
   button would make the page about the source instead of the sketch.
4. **Then the words** — `writeup` string through `Prose`, or an MDX body
   through `EssayBody`, on exactly the terms §6 describes. Same fallthrough
   as today.
5. **Then tags.** Unchanged.

`description`, if present, sits between the meta line and the body, italic,
same as the image branch.

### Frame details

- **Measure.** The page keeps `max-w-5xl` (the non-chapbook default) and the
  frame gets `mx-auto max-w-3xl`, matching `PieceMedia`'s call site. The body
  below stays at `max-w-2xl`. A sketch is allowed to be wider than the prose;
  it is the subject.
- **Before it runs:** the poster (`image`) fills the surface, dimmed slightly,
  with a centered run affordance. The iframe element does not exist yet — it
  is created on first run, so a page with a `manual` sketch costs nothing
  until asked.
- **The state dot** is the piece's tone (`toneFor` → `--science` emerald) when
  running, `--muted-foreground` when paused. It is the one place the
  discipline tone appears in the chrome, which is what makes the emerald read
  as deliberate rather than decorative.
- **The mono name** is `sketch.src`'s entry filename, in the `font-brand`
  mono axis (Recursive's `MONO` axis is already available). It is the small
  honest label that says "this is a program."
- **Controls are real `<button>`s** in the rail, never overlaid on the
  surface — the surface belongs to the sketch, and an overlay would swallow
  its own interactions. This is the same reasoning that keeps
  `SpeedpaintPlayer` free of a full-bleed click-catcher.
- **`reseed` renders only when `sketch.seedable`.** Nothing else in the rail
  is conditional.
- **Fullscreen uses the native Fullscreen API on the frame wrapper**, not a
  dialog. `ImageLightbox` is a dialog because an image has no state to lose;
  reparenting an iframe into a portal **reboots the sketch**, throwing away
  whatever it has drawn. Requesting fullscreen on the existing wrapper keeps
  the same iframe alive, so a sketch you've been watching for two minutes
  goes fullscreen mid-stroke instead of starting over.

---

## 5. The runtime contract

The boundary between page and sketch is small and explicit. Both halves are
written here because a contract only documented on one side is a contract
that drifts.

### The iframe the page creates

```html
<iframe
  src="/sketches/<slug>/index.html?theme=dark"
  title="<piece title> — interactive sketch"
  sandbox="allow-scripts"
  loading="lazy"
  class="h-full w-full border-0"
/>
```

- **`sandbox="allow-scripts"` and nothing else.** Deliberately *without*
  `allow-same-origin`: with both flags a same-origin iframe can reach
  `parent.document` and the boundary in §3 is fiction. The cost is real and
  worth stating — the sketch runs in an opaque origin, so it has **no
  `localStorage`** and **cannot `fetch` its own data files** without CORS. A
  sketch needing data must inline it. If a sketch ever genuinely needs to
  fetch, that reopens this decision explicitly; it is not something to
  quietly add a flag for.
- **No `allow-popups`, no `allow-forms`, no `allow-top-navigation`.** A
  sketch that wants to link somewhere isn't a sketch.

### Messages

`postMessage`, `targetOrigin: '*'` (required — the sandboxed frame's origin
is `null`, so a specific origin would never match).

**Page → sketch:**

| Message | When | Sketch must |
| --- | --- | --- |
| `{ type: 'sketch:theme', theme: 'light' \| 'dark' }` | on `ready`, and on every theme toggle | repaint in the new palette |
| `{ type: 'sketch:pause' }` | scrolled out of view, tab hidden, pause pressed | stop its rAF loop |
| `{ type: 'sketch:resume' }` | scrolled back in, resume pressed | restart its loop |
| `{ type: 'sketch:reseed' }` | reseed pressed (`seedable` only) | restart from a new seed |

**Sketch → page:**

| Message | When | Page does |
| --- | --- | --- |
| `{ type: 'sketch:ready' }` | once, when it can accept messages | crossfade the poster out, send the current theme, set the state dot to running |

**A sketch that never sends `ready` still works** — the page reveals the frame
after a 2s timeout and treats it as running. The handshake is an optimisation
against a flash of empty canvas, not a requirement. A sketch that ignores
`pause` also works; it just keeps burning cycles, which is the sketch's
problem, not the page's.

### Theme, twice

The theme is delivered **both** as a `?theme=` query param at boot and as a
message. The param is what a sketch reads before it has a listener attached
(and what makes the standalone URL themed correctly with no page around it);
the message is what keeps it in sync with the site's toggle. This is the same
belt-and-braces shape as `SpeedpaintPlayer`'s duration fallback, for the same
reason — a native event that already fired never replays for a listener
attached afterwards.

Sketches should read the site's palette from the tokens in
`app/globals.css`. **Copy the hex values into the sketch; don't try to inherit
CSS custom properties across the frame boundary** — an opaque-origin iframe
inherits nothing. The tokens worth having are `--background`, `--foreground`,
`--science`, `--goldenrod`, `--terracotta`, `--denim`.

### Autorun policy

- Default: **run on first intersection** (`IntersectionObserver`, ~25%
  visible), **pause on leaving**, pause on `document.hidden`.
- `sketch.manual === true`: never autorun; poster plus a run affordance.
- **`prefers-reduced-motion: reduce`: never autorun**, regardless of
  `manual`. The poster stays and the run control is available. This is not
  optional — generative motion is exactly what that query is about.

---

## 6. Annotated code excerpts

Beck's answer was "sometimes" — so excerpts are **opt-in per piece and
interleaved with the prose**, never a fixed section the layout reserves. A
piece that wants to show three lines shows three lines where they matter; a
piece that shows none looks like it was never a possibility.

**Mechanism: the existing MDX body machinery, plus one component.** No new
schema, no `excerpts: []` array on `WorkPiece`. This is the same
rung-of-the-ladder call ARCHITECTURE already records for essays: a `writeup`
string handles the simple case, and a body that needs structure becomes MDX
rather than growing the string into a markup dialect.

### Renaming, because the name would start lying

`content/essays/`, `lib/essay-bodies.ts`, `essayBody()`, and
`MDX_ESSAY_SLUGS` are all named for essays. A sketch write-up is not an
essay. Rename, in one pass:

| Today | Becomes |
| --- | --- |
| `lib/essay-bodies.ts` | `lib/mdx-bodies.ts` |
| `essayBody(slug)` | `mdxBody(slug)` |
| `MDX_ESSAY_SLUGS` (in `lib/work.ts`) | `MDX_BODY_SLUGS` |
| `content/essays/*.mdx` | stays put; sketches add `content/sketches/*.mdx` |

Both directories resolve through the one map in `lib/mdx-bodies.ts`, and its
existing build-time assertion (keys match the declared slug list, every slug
exists in `WORK`) covers both. Three call sites: the two detail routes and
`lib/work.ts`. The existing essay files do **not** move — they are still
essays, and moving them buys nothing.

`components/essay.tsx` and `EssayBody` keep their names: they are the essay
*typography*, and a sketch write-up wants exactly that typography.

### `<Excerpt>`

```tsx
<Excerpt lang="js" from="sketch.js" lines="40–58" href={`${repo}/blob/main/sketch.js#L40-L58`}>
{`const field = (x, y) => …`}
</Excerpt>
```

- `from` and `lines` render as a small mono caption above the block — the
  excerpt is honest about being an excerpt.
- `href` is optional and links to the full source at that range.
- **The annotation is the surrounding MDX prose**, not a prop. That is what
  "annotated excerpt" means here: a paragraph, then the lines it is about,
  then the next paragraph. A `caption` prop would invite writing the
  explanation inside a string and losing the essay typography.

### Highlighting

**Shiki, at build time, with a theme built from the site's own tokens.**

- Build-time only — it runs in the server component, ships **zero client
  JS**, and a fully static site is exactly where this is free.
- **A stock theme is the wrong answer here.** Every colour on this site is a
  declared token with a recorded reason (see ARCHITECTURE's whole brand
  section, and the `--brand-crescent` vs `--goldenrod` split); dropping in
  "GitHub Dark" would make the code block the one imported-looking object on
  the page. Shiki takes a theme as a plain JSON object, so map its scopes
  onto `--goldenrod` (keywords), `--terracotta` (strings), `--denim`
  (numbers/constants), `--science` (function names), `--muted-foreground`
  (comments), `--foreground` (everything else).
- **Dual theme via CSS variables**: render with Shiki's dual-theme output
  (`defaultColor: false`), which emits `--shiki-light` / `--shiki-dark` per
  span, then select between them in `globals.css` on `[data-theme]` —
  the site uses a `data-theme` attribute, not `prefers-color-scheme`, so the
  media-query variant of this pattern will *not* work.
- The block scrolls horizontally in its own container. Never wrap code.

**Cheap fallback, if the dependency isn't wanted:** plain `<pre><code>` in the
mono axis, one accent colour on the caption, no highlighting at all. It looks
deliberate rather than unfinished, and `<Excerpt>`'s interface doesn't change
— so this is a swap, not a redesign. Take it if `shiki` turns out to cost
more build time than it's worth.

---

## 7. The gallery card: no new card

`WorkCard` gains **no `SketchCard`**. A sketch's poster is an `image`, so
`ImageCard` already renders it correctly — the aspect, the sticky chrome, the
tone tint, the hover lift, all of it. What's missing is only the signal that
this one *runs*.

**`MediaBadges` gains a sketch indicator**, on exactly the terms the existing
two work (`components/media-player.tsx:18`): a corner pill, `aria-hidden`
glyph, the fact announced once in an `sr-only` string, coexisting with the
other badges. Suggested glyph: `Play` is taken by animations and `CircleDot`
by speedpaints — use something that reads as *system* rather than *media*
(lucide `Sparkles`, `Binary`, or `Terminal`; pick at build time against the
real poster).

`MediaBadges` currently early-returns on `!speedpaint && !animation`; that
guard grows a third clause.

### Tiles deliberately do not run

Thirty tiles, thirty iframes, thirty rAF loops. Beyond the obvious battery
and memory cost, autorunning tiles would make the gallery's masonry heights
depend on content that boots asynchronously, which is exactly the layout
instability `MasonryGrid` is built to avoid.

**Hover-to-run on a single tile was considered and rejected.** It has no
touch equivalent, and an iframe's boot cost lands as a stutter right at the
moment of hover — the interaction would feel broken more often than
delightful. The badge does the job: it says there's more here, and the click
target already goes to the page where the thing runs.

---

## 8. The home page's science panel (TODO §1)

The panel's `kind: 'stat'` treatment exists only to make invented metrics
("Contrast passing AA: 100%") look substantial. With real work to point at,
it should be replaced rather than repopulated.

**Decided: the science panel becomes a live miniature** — `kind: 'sketch'`,
a fourth object type on the corkboard. The three panels are deliberately
three different kinds of object (a polaroid, a quote card, a stat block); a
small running sketch is the most on-brand possible fourth, and it is the
honest version of the copy already sitting under it ("curiosity, made
presentable" — which should be rewritten too, once there's a real piece).

- Renders the poster by default; boots the sketch on first intersection,
  same policy as §5, including the `prefers-reduced-motion` rule.
- **One iframe on the home page, and only one.** If a second panel ever wants
  one, that's a conversation, not a copy-paste.
- The panel is inside a tilted card with `overflow-hidden` and sits in the
  hover-collage context. **Verify in a browser** that booting an iframe
  doesn't disturb `HeroWordScatter`'s hover sync or the tilt transitions —
  this is the one piece of the spec most likely to need adjusting on contact.
  The fallback if it does: poster plus badge, no boot, and the panel is still
  honest.
- **`lib/content.ts` is deleted entirely** in the same change, along with the
  `PROJECTS` import in `app/page.tsx`. That is the file's stated purpose —
  its own header comment says it can go once this lands.

Both `?tags=science` deep links (the hero's `science` word and this panel)
start resolving to a populated gallery the moment the first exploration is in
`lib/work.ts`. Nothing about them changes.

---

## 9. Accessibility and performance rules

Non-negotiable, and cheap if done first:

- **`prefers-reduced-motion: reduce` suppresses every autorun**, everywhere —
  piece page, home panel. The poster is a complete experience for that
  reader.
- **Every iframe carries a `title`** naming the piece: `"<title> — interactive
  sketch"`. An untitled iframe is announced as "frame" and is a dead end.
- **The frame's controls are real buttons** with visible focus rings
  (`focus-visible:ring-2 focus-visible:ring-ring`, matching the rest of the
  site), operable without ever entering the iframe.
- **A sketch is never the only path to the content.** The write-up must stand
  on its own for a reader who never runs it — which means `writeup` (or the
  MDX body) says what the sketch *does*, not "press play above."
- **Pause on `document.hidden`**, not just on scroll. A backgrounded tab
  spinning a rAF loop is the single worst thing this feature can do to
  someone's battery.
- **`loading="lazy"`** on the iframe; the element is created on run, so a page
  with a `manual` sketch fetches nothing until asked.
- `sketch.aspect` is required precisely so the frame reserves its box before
  anything loads — **no layout shift**, ever, from a sketch booting.

---

## 10. Out of scope

Named so they aren't rediscovered as gaps:

- **A parameter/knob rail on the frame.** The iframe boundary means a sketch
  can render whatever controls it wants *inside itself*, in its own idiom,
  with no schema for the page to learn. A generic knob system would be a
  second UI framework for zero current benefit.
- **A `'lab'` collection layout.** `collectionLayout` stays three-valued
  (`book` / `illustrated` / `gallery`). A collection of sketches would fall to
  `gallery` and render posters, which is correct. Add a fourth value when a
  real series of sketches exists, not before.
- **A sketch that is also a hybrid** (carries `text`). §3.
- **A `/lab` index page.** Rejected in §0 — `?tags=science` is the index.
- **Sketch source rendered in full on the page.** Excerpts are excerpts; the
  `repo` link is the full source.
- **Anything that lets a sketch persist state or fetch data.** §5. Both are
  consequences of the sandbox, and both are reopenable decisions rather than
  oversights.

---

## 11. Acceptance

- [ ] `next build` clean; page count is **204 + one per exploration added**
      (sketches add no routes of their own — they are `public/` files).
- [ ] `tsc --noEmit` clean.
- [ ] `/work?tags=science` renders real work instead of the empty state.
- [ ] The `code` chip appears in the filter panel under `field`, with a
      non-zero count, and filtering by it works.
- [ ] A sketch tile in the gallery shows its poster and the runnable badge,
      and **does not boot an iframe** (check the network panel).
- [ ] A sketch piece page boots on scroll-into-view, pauses on scroll-out and
      on tab-hide, and survives a theme toggle without reloading.
- [ ] Fullscreen keeps the same iframe alive — the sketch does not restart.
- [ ] With `prefers-reduced-motion: reduce`, nothing autoruns anywhere and
      every sketch is still reachable via its run control.
- [ ] `lib/content.ts` is gone and nothing imports it.
- [ ] `lib/mdx-bodies.ts`'s build-time assertion still fires on a deliberately
      mismatched slug.
- [ ] No layout shift when a sketch boots (frame box is reserved from
      `sketch.aspect`).

---

## 12. What Beck still supplies

- The first exploration or two: the sketch HTML, a poster capture, title,
  year, `description`, and the write-up.
- **The copy under the home page's science panel.** "Talks and studies where
  design meets research — curiosity, made presentable" was written to caption
  fabricated content and should be replaced, not inherited.
- Whether the first exploration's write-up wants MDX and excerpts (§6) or a
  plain `writeup` string. Either is fine; the plain string is the default and
  the ladder goes up, not down.

---

## 13. Where the build diverged (2026-08-29)

Recorded rather than smoothed over, per the repo's own convention.

- **§8 was not built.** See the status note at the top. §1 and §2 of
  `TODO.md` carry the remaining steps, including the browser check of the
  iframe against `HeroWordScatter` that §8 flags as most likely to need
  adjusting on contact. `lib/content.ts` and its `PROJECTS` import survive
  untouched as a consequence — deleting them is part of that same change.

- **§11's page count was stale.** The spec says "204 + one per exploration";
  the tree has been at **202** since the 2026-08-29 collection pass (see
  `TODO.md`). The build is at 202, unchanged — the claim the number was
  making (a sketch adds no route of its own) verified exactly as written.

- **§3 vs §7 on `WorkCard`.** §3 says `isSketch` is checked before the image
  branch "in both `WorkCard` and `PieceView`"; §7 says `WorkCard` gains no new
  card, because `ImageCard` already renders a sketch's poster correctly. Those
  can't both be built, since an `isSketch` branch in `WorkCard` could only
  dispatch to `ImageCard` and would be dead code. **§7 won** — it is the more
  specific instruction and it carries its own reasoning. `PieceView` has the
  branch, where the layout genuinely differs and the silent-failure risk §3
  describes is real.

- **The mono name splits the difference.** §4's prose says the label is "the
  entry filename" and its diagram shows `flow-field.js`; for a `src` of
  `.../flow-field/index.html` those disagree. Built to the prose first, which
  made the real piece's rail read `index.html` — a label every demo would
  share. Beck chose the fix 2026-08-29: `entryName()` returns the basename,
  falling back to the containing folder when that basename is an `index.*`.
  So `delirium` shows `delirium`, and a demo whose entry is a real filename
  still shows the filename.

- **`<Excerpt>` lives in its own file**, `components/excerpt.tsx`, not in
  `components/essay.tsx`. §6 doesn't say where to put it. Keeping it separate
  keeps Shiki out of `mdx-components.tsx`'s global map, so only the MDX bodies
  that actually show code pull the highlighter into their graph. It is
  imported from the `.mdx` file the way `<Item>` and `<MarketHeader>` already
  are.

- **Shiki was taken, not the cheap fallback.** §6 offers a plain `<pre>`
  fallback "if `shiki` turns out to cost more build time than it's worth". It
  doesn't: `next build` measured 8.4s before and 6.8s after (inside the noise),
  because `components/excerpt.tsx` only enters the graph of MDX bodies that
  import it — and today none do.

- **Corner badges share a row.** §7 says the sketch pill coexists with the
  existing two. `MediaBadges`' speedpaint pill was hard-pinned to
  `right-2.5 top-2.5`, so a second pill there would have stacked on top of it.
  Both now sit in one `flex` row at that position; a single pill lands exactly
  where the speedpaint one always has.

- **Comments render italic.** The Shiki theme sets `fontStyle: 'italic'` on
  comment scopes, which needs a matching `font-style: var(--shiki-*-font-style)`
  rule alongside the colour rule in `globals.css` — Shiki's dual-theme output
  emits the font-style as a CSS variable too, and without that rule it is
  silently dropped.

- **§6's excerpt palette gained a light/dark split**, decided with Beck
  2026-08-29 after the first build. As specified, strings (`--terracotta`) and
  numbers (`--denim`) used one value in both themes and landed near 2–2.5:1
  against dark mode's #080b24 — the block was legible in daylight and dim at
  night. **Beck's rule: brighter in dark, the opposite of the hero icon set's
  swap.** The hero icons take each hue's bright alt in light mode and the
  standard in dark; code takes the reverse. So numbers move to `--sky`
  (#68bfed, 8.91:1) and function names to `--spring-green` (#aadb6c, 11.34:1)
  in dark only, while light keeps `--denim` and the deepened `--science`.

  Terracotta is the one hue with **no alt in the brand**, so it had no answer
  under that rule. Beck chose to reuse an existing token over minting one:
  dark-mode strings take `--writing` (pumpkin #bf712c, 4.88:1). The accepted
  tradeoff is that pumpkin (hue 28°) and goldenrod keywords (hue 39°) read as
  near-neighbours in dark mode. A terracotta alt derived by the same transform
  the three validated pairs use (#e0725a, 5.84:1) was offered and declined —
  worth revisiting only if the pumpkin/goldenrod proximity turns out to bother
  in a real excerpt.

### Verified in a browser

Playwright, against `next start` on a temporary throwaway exploration
(sketch, poster, MDX body with an `<Excerpt>`) that was removed afterwards:
gallery badge present with no iframe and no `/sketches/` request; autorun on
scroll-in; pause on scroll-out, on `document.hidden`, and on the pause
control; a deliberate pause surviving a scroll away and back; the four
page→sketch messages arriving inside the frame; `sketch:ready` crossfading the
poster well inside the 2s timeout; theme toggle keeping the same iframe
element with an unchanged `src`; fullscreen keeping that same element alive;
zero layout shift across boot; `sandbox="allow-scripts"` and the `title` /
`loading="lazy"` attributes; and under `prefers-reduced-motion: reduce`,
nothing autorunning while the run control still works. The excerpt's colours
were checked in both themes against the literal token values.
