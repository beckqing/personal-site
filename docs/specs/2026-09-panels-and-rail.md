# Spec — panels and the rail: decks read as continuous scroll

> **Status: designed 2026-09-17 with Beck, not built.** This spec **supersedes
> the scroll-mode/present-mode split** in
> [../history/2026-09-branding-deck.md](../history/2026-09-branding-deck.md)
> §6–§7, which shipped 2026-09-17 and is **currently broken on the live
> branch** — see §1. It also **amends**
> [2026-09-aortic-valve-calcification.md](2026-09-aortic-valve-calcification.md)
> §5 and §6.1–§6.2, whose contents list, rail, and `caseStudy?: true` field
> are folded into the shared primitive specced here.
>
> Two halves, and the first can ship alone: **§1 is a bug fix** for a deck
> that renders nothing, and is worth landing on its own if the redesign
> stalls. **§3–§9 are the redesign.**
>
> **Amended 2026-09-17 by
> [2026-09-deck-visual-fidelity.md](2026-09-deck-visual-fidelity.md).** Beck's
> verdict on the shipped build was that the slides were poorly recreated. That
> spec supersedes **this one's visual half** — the `Panel.layout` enum (§3.4),
> the per-panel composition rules (§6.3), and the assumption throughout that a
> deck slide should be re-expressed in the site's responsive prose idiom. A
> recreated slide instead becomes `layout="stage"`, positioned in real
> 1920×1080 deck coordinates. **Everything else here stands**: continuous
> scroll, the dot rail, `PanelContents`, `#id` anchors, present mode staying
> cut, and the server-component structure of §1's fix. The MQP case study
> keeps the responsive layouts specced here.

Beck's design vision for a deck on this site is **continuous scroll with a dot
rail** — the reading model the MQP case study spec arrived at independently —
not a slide-at-a-time fullscreen viewer. Both documents this affects were
built as decks that were *presented*, so a panel still fills a screen where
the screen is shaped like a slide; on a phone held upright it isn't, and
there the panel is as tall as its content.

The two documents stop being two kinds of thing. A deck and a case study are
both **a sequence of titled panels that owns its own width** — so they become
one primitive, one field, one `PieceView` branch, one rail.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| The reading model for a deck | **Continuous scroll with a dot rail**, like the MQP case study | Beck, 2026-09-17 |
| Present mode (fullscreen dialog, arrows, swipe) | **Cut entirely.** No dialog, no `?slide=` param, no presenting context, no present button | Beck, 2026-09-17 |
| Linking to one slide | **Kept, as `#id` anchors** that scroll-target a panel. The rail scrolls; it does not write history | Beck, 2026-09-17 |
| Deck vs. case study | **Fully converged.** One field, one component, one `PieceView` branch, one rail | Beck, 2026-09-17 |
| Panel height | **Viewport-tall in landscape** (laptop/tablet); **natural height in portrait** | Beck, 2026-09-17 |
| Primitive name | **`Panels` / `Panel` / `PanelFigure`** — see §3.2 for why not `Slide` and not `Section` | Beck, 2026-09-17 |
| Scroll snap | **Deferred**, not in v1 — §6.4 | Beck, 2026-09-17 |
| How many panels | **Nine, not seven.** The title and closing slides come back — §5.3 | Beck, 2026-09-17 |
| A rail on long essays | **Deferred.** Revisit after this ships | Beck, 2026-09-17 |

---

## 1. What is broken right now

`/work/personal-branding` returns HTTP 200 and renders its header, its
description, and the "present" button. **It renders none of its seven
authored slides** (nine after §5.3). Two independent defects, both reproducible on
`docs/reconcile-todo-and-architecture` @ `413b0e2`.

### 1.1 The fatal one: element-type identity does not survive the RSC boundary

`slideList()` ([components/deck.tsx:124](../../components/deck.tsx#L124) as committed;
the working tree has shifted it) picks slides out of `children` by comparing constructor identity:

```ts
Children.toArray(children).filter(
  (c): c is DeckSlide => isValidElement(c) && c.type === Slide,
)
```

`content/decks/personal-branding.mdx` is a **Server Component**.
`components/deck.tsx` is **`'use client'`**. So the MDX module's
`import { Slide } from '@/components/deck'` does not resolve to the `Slide`
function — it resolves to a **client reference**. Flight serializes
`<Slide id="…" title="…">` as a client-reference element, and on
deserialization React sets `element.type` to a **lazy node wrapping the module
export**, never to the `Slide` function object that `deck.tsx` holds in its
own scope. `c.type === Slide` is therefore **always false**.

Evidence, from the running dev server's own log
(`.next/dev/logs/next-development.log`, instrumentation a prior session added
and removed) — for each of the seven children:

```
[DEBUG slideList] children count: 7
  [{"isSlide":false,
    "type":{"_debugInfo":[…],"_payload":"Promise {}","_store":{"validated":0}}}, …]
```

`_payload: Promise {}` is a React **Lazy**, not a function. `isSlide` is
`false` seven times out of seven.

Consequence: `slides` is `[]`, so `Deck` renders `{slides}` as nothing. The
deck's entire body disappears and only the present button is left — exactly
the reported symptom.

**The same defect, twice in one file.** `Slide` picks its own figure out the
same way (`deck.tsx:83` as committed):

```ts
const figure = items.find((c) => isValidElement(c) && c.type === SlideFigure)
```

So `figure` is always `undefined`, the `split` and `figure` branches of
`Slide`'s layout switch are unreachable, and every slide image falls through
into the prose column at prose width. Even with §1.1's first half fixed, no
slide would get the layout it asks for.

> **Where it bites, precisely.** The client render is definitively broken —
> that is what the log above captures. Whether the SSR pass also returned `[]`
> depends on whether the client-reference chunk had already loaded when the
> predicate ran, which is timing-dependent under Turbopack dev. It does not
> matter for the outcome: §1.2's hydration failure discards the server HTML
> and re-runs the whole tree on the client, where the predicate is reliably
> false. Either way the reader ends up with no slides.

### 1.2 Nested `<p>`, and the hydration failure it causes

In MDX 3, JSX element children that sit on their **own lines** are parsed as
markdown *flow* content — so MDX wraps them in a paragraph, which
`essayComponents.p` ([components/essay.tsx:204](../../components/essay.tsx#L204))
renders as a real `<p>`. Author a `<p>` yourself and put its text on the next
line, and you get `<p>` inside `<p>`:

```mdx
<p className="text-sm text-muted-foreground">
  Rejected design: While I initially liked this…
</p>
```

Logged against the `logo-drafting` and `logo-design` slides:

```
In HTML, <p> cannot be a descendant of <p>. This will cause a hydration error.
Uncaught Error: Hydration failed because the server rendered HTML didn't match
the client. As a result this tree will be regenerated on the client.
```

That last sentence is why this compounds §1.1 rather than sitting beside it:
an invalid-nesting mismatch makes React **throw away the server HTML and
re-render from scratch on the client**, which is the render where the slide
list is reliably empty.

The uncommitted working tree has this half fixed by collapsing the affected
`<p>` elements onto one line (inline children are not paragraph-wrapped).
That is the correct fix, and §5.2 makes it a rule with a check behind it.

### 1.3 The uncommitted fix in the tree is right in outcome, wrong in mechanism

The working tree replaces both identity checks with **prop sniffing** —
`typeof props.id === 'string' && typeof props.title === 'string'` for a slide,
`props.src && props.aspect` for a figure. It works: the page now server-renders
seven `<section>`s with no nested `<p>`, and `node scripts/check-deck-fidelity.mjs`
passes.

Keep it if §3 stalls. It is not what should ship, because the predicate is a
guess about shape rather than a statement about type: any child carrying `src`
and `aspect` is claimed as *the* figure (`next/image` carries `src` today,
one prop away), and any child carrying `id` and `title` is claimed as a
panel. §3.3 removes the need to introspect across the boundary at all, which
is the actual repair.

### 1.4 Eleven dangling references to a spec that moved

`docs/specs/2026-09-branding-deck.md` **does not exist** — it was moved to
`docs/history/2026-09-branding-deck.md` when it shipped, and nothing followed
it. All eleven of these are dead links:

| File | Line |
| --- | --- |
| `docs/ARCHITECTURE.md` | 713 |
| `docs/TODO.md` | 1623 |
| `docs/specs/2026-09-aortic-valve-calcification.md` | 17 |
| `components/brand-mark.tsx` | 10 |
| `components/mark-construction.tsx` | 14 |
| `components/deck.tsx` | 41 |
| `components/brand-palette.tsx` | 4 |
| `components/type-specimen.tsx` | 9 |
| `lib/work.ts` | 163 |
| `scripts/pull-brand-deck.mjs` | 38 |
| `app/work/[slug]/page.tsx` | 234 |

Repoint them at `docs/history/2026-09-branding-deck.md`, and at **this** spec
where they describe scroll mode, present mode, or the slide list (`deck.tsx:41`,
`lib/work.ts:163`, `page.tsx:234`).

### 1.5 Not a deck bug, but sitting in the same diff

`next.config.mjs` has an uncommitted `allowedDevOrigins: ['*.trycloudflare.com']`
— a tunnel for testing on a real phone, which §6.2 needs anyway. Unrelated to
the deck. Commit it deliberately or drop it deliberately; don't let it ride
along inside a deck commit.

### 1.6 Verifying the fix

```sh
# 7 sections, 7 h2, zero nested <p>
curl -s http://localhost:3000/work/personal-branding > /tmp/deck.html
grep -o '<section' /tmp/deck.html | wc -l          # expect 7 (later: 7 panels)
grep -c 'id="palette-uses"' /tmp/deck.html         # expect 1

# no hydration errors, no empty slide list
tail -f .next/dev/logs/next-development.log        # load the page, watch

node scripts/check-deck-fidelity.mjs               # must stay exit 0
```

The nested-`<p>` check is mechanical and belongs in a script — §5.2.

---

## 2. Why the reading model changes

Present mode was specced when a deck was assumed to want to behave like a
deck: one slide, full screen, arrow keys. It cost a `@base-ui/react` `Dialog`,
a fullscreen request with an iOS fallback, an idle-fade timer, a key handler,
a swipe handler with a scrollable-ancestor guard, a `?slide=` URL param, and a
React context whose only job was to suppress a duplicate DOM `id` on the
second copy of the current slide. **Every defect in §1.1 lives in the machinery
that dual-render required** — the slide list exists because something had to
index into it.

What Beck actually wants from the MQP prototype is cheaper and better: the
reader scrolls, and a column of dots tells them where they are. Nothing is
behind a mode. The whole document is linkable, printable, and findable by
in-page search, none of which was true of a slide inside a dialog.

The deck keeps the one thing present mode was genuinely good for — **handing
someone a link to one slide** — as a plain `#id` anchor (§9).

---

## 3. The converged model

### 3.1 One field, one branch

Today `WorkPiece` has `deck?: true` ([lib/work.ts:165](../../lib/work.ts#L165))
and the MQP spec proposes `caseStudy?: true` for the same stated reason: *this
MDX body owns its own width, so `PieceView` must not wrap it in `EssayBody`.*
The MQP spec §6.2 already flagged the collision and left it for whichever
shipped second. Beck's call is to collapse it now:

```ts
/**
 * This piece's MDX body is a sequence of `<Panel>`s that owns its own width
 * and its own section structure — a rebuilt deck, or a case study. PieceView
 * must not wrap it in EssayBody's prose measure; the measure belongs inside
 * each panel. Checked *before* the image branch, same reason `isCodeDemo` is:
 * such a piece carries an MDX body and an `image` and no `text`, so a later
 * branch would silently render it as a plain picture with an essay under it.
 */
bodyLayout?: 'wide'
```

```ts
/** A piece whose MDX body owns its own width — see `WorkPiece.bodyLayout`. */
export function isWideBody(item: WorkItem): boolean {
  return !isCollection(item) && item.bodyLayout === 'wide'
}
```

`deck?: true` and `isDeck()` are **deleted**, not aliased. `personal-branding`
becomes `bodyLayout: 'wide'`; `aortic-valve-calcification` is authored that
way from the start. One `PieceView` branch replaces the deck branch
([app/work/[slug]/page.tsx:235](../../app/work/[slug]/page.tsx#L235)) and the
case-study branch the MQP spec asked for, keeping its position — **before**
the code-demo branch, which is before the image branch — and keeping its
shape:

```tsx
if (isWideBody(piece) && Body) { … <div style={{ '--essay-accent': tone }}><Body /></div> … }
```

A string union, not a second boolean: the next document kind that needs a
width gets a member, not another field. `'wide'` is the only member today;
absent means the normal prose measure.

> **Discipline is unaffected.** `bodyLayout` is presentation. The MQP stays
> `science`, the deck stays `art` + `design`, and nothing in
> `DISCIPLINE_PRECEDENCE`, `DISCIPLINE_FACETS`, or the tag vocabulary moves.

### 3.2 The names

`Deck`/`Slide` and the MQP's `Section` both become **`Panels`/`Panel`**.

- Not `Slide`/`Deck`: a fifteen-section technical report about aortic valve
  calcification does not have slides, and the MQP would be authoring against
  a word that misdescribes it.
- Not `Section`: **taken.** `<Section>` is already specced as a different
  primitive in
  [2026-09-sections-folding-logs.md](2026-09-sections-folding-logs.md) §2–§3 —
  an *essay* block that owns its heading and derives its level from nesting
  depth. A panel is always top-level and always `h2`. Two things called
  `Section` with different heading rules is a trap.
- `Panel` is what both actually are: one composition, one screen's worth,
  one entry in the rail.

`PanelFigure` replaces `SlideFigure` unchanged in behaviour.

### 3.3 The panel list, derived where identity works

The repair for §1.1 is not a better predicate. It is **moving the derivation
to the side of the boundary where identity is real.**

`components/panels.tsx` carries **no `'use client'`**. `Panels`, `Panel`, and
`PanelFigure` are all Server Components. `content/decks/personal-branding.mdx`
and `components/panels.tsx` are then modules in the *same* graph, MDX's
`import { Panel }` resolves to the actual function, and:

```ts
const panels = Children.toArray(children).filter(
  (c): c is ReactElement<PanelProps> => isValidElement(c) && c.type === Panel,
)
```

is correct — the check that could never work inside a client component works
trivially outside one. `Panels` then hands the client rail a **plain
serializable array**, which is all it ever needed:

```tsx
type PanelRef = { id: string; title: string }
```

```tsx
export function Panels({ children }: { children: ReactNode }) {
  const panels = /* as above */
  const rail = panels.filter((p) => p.props.rail !== false).map(({ props }) => ({
    id: props.id, title: props.title,
  }))
  return (
    <>
      <PanelContents panels={rail} />
      {children}
      <PanelRail panels={rail} />
    </>
  )
}
```

Three things fall out of this that are worth naming, because they are the
point:

- **The rail becomes the only client module in the deck.** The payoff
  components (`BrandPalette`, `TypeSpecimen`, `MarkConstruction`,
  `ProfilePictureGrid`) are already server-rendered today — the MDX is a
  server module, so passing them as `children` to a client `Deck` serializes
  their output rather than shipping them. What *does* ship today is
  `deck.tsx`'s own import graph: `@base-ui/react`'s `Dialog`,
  `next/navigation`, four `lucide-react` icons, and — because `Slide` imports
  it — `components/essay.tsx`. All of that leaves the deck's client graph.
- **Both navs render server-side, complete, from one list.** The contents list
  and the rail cannot disagree (the MQP's §5 requirement), and neither pops in
  after hydration.
- **`useId` goes away.** `Panel` needs no hooks, so `aria-labelledby` becomes
  the deterministic `${id}-title` instead of a generated id — and the
  duplicate-`id` problem that `PresentingContext` existed to suppress cannot
  occur, because a panel is now rendered exactly once.

**Dev-time guard.** `Panels` warns once (`console.warn`, dev only) for any
direct child that is an element and is not a `Panel`, naming what it found. A
malformed body must be loud while authoring rather than silently absent from
both navs — which is precisely how §1.1 stayed invisible.

### 3.4 `Panel`'s props

```ts
type PanelProps = {
  id: string                                   // the #anchor, and the rail key
  title: string                                // the h2, the rail label, the contents entry
  layout?: 'prose' | 'figure' | 'split' | 'full' | 'cover'  // default 'prose'
  tone?: 'accent'                              // the MQP's inverted "goal" band
  rail?: false                                 // omit from rail + contents (e.g. references)
  children: ReactNode
}
```

`layout` carries over from `Slide` with one new member — a closed set
describing what kind of composition a panel is, never a copy of an original
Figma frame's pixel layout.

**`cover` is new**, added for §5.3's restored title and closing panels:
content centred on both axes, display type, no prose measure, and **no `h2`**
— a cover panel supplies its own typography, so `Panel` renders the `title`
into an `sr-only` heading instead. It still needs the `title` prop, because
the rail and the contents list both read it. Without `cover`, those two
panels would each hand-roll centring inside `full`, which is how a layout
member earns its place.

`rail={false}` replaces the MQP spec §6.4's rule that the derivation
"excludes any section whose `id` is `references`". An explicit prop, not a
hardcoded slug: the next document with a back-matter panel should not need an
edit to `panels.tsx`.

`tone="accent"` is the MQP spec §6.5's inverted band, promoted to the shared
primitive because it is a panel-level treatment and the deck may want it.

---

## 4. File-by-file

| File | Change |
| --- | --- |
| `components/panels.tsx` | **New.** Server. `Panels`, `Panel`, `PanelFigure`, `PanelContents`. Replaces `components/deck.tsx` |
| `components/panel-rail.tsx` | **New.** `'use client'`. `PanelRail` — the dots and the scrollspy. The only client code here |
| `components/deck.tsx` | **Deleted.** `Deck`, `Slide`, `SlideFigure`, `PresentDialog`, `PresentingContext`, `slideList` all go |
| `content/decks/personal-branding.mdx` | `Deck`/`Slide`/`SlideFigure` → `Panels`/`Panel`/`PanelFigure`; §5.2's `<p>` rule applied; **two restored panels** (§5.3) |
| `lib/work.ts` | `deck?: true` → `bodyLayout?: 'wide'`; `isDeck()` → `isWideBody()`; `personal-branding` updated |
| `app/work/[slug]/page.tsx` | Deck branch → one `isWideBody` branch. `<Suspense>` around `<Body />` **no longer needed** — see §9.2 |
| `app/globals.css` | Panel geometry (§6) and the rail's reduced-motion rule (§7.4) |
| `scripts/check-deck-fidelity.mjs` | `Slide`'s `title` → `Panel`'s `title` in the attribute scrape, and **three entries leave `DECK_ONLY_TEXT`** (§11). Must stay exit 0 |
| `scripts/check-mdx-paragraphs.mjs` | **New.** §5.2's nested-`<p>` guard |
| `docs/specs/2026-09-aortic-valve-calcification.md` | §5 and §6.1–§6.2 amended to reference this spec — §13 |
| `docs/ARCHITECTURE.md`, `docs/TODO.md` | §13, plus the §1.4 dead links |
| `content/decks/` → `content/panels/`? | **No.** Leave it. A deck's slides still live in `content/decks/`; the MQP gets `content/case-studies/`. The directory names the *content*, not the primitive |

No new dependencies. `@base-ui/react` stays — the lightbox and elsewhere use
it; only the deck's `Dialog` usage goes.

---

## 5. Authoring

### 5.1 The panel is the unit

```mdx
<Panels>
  <Panel id="palette" title="palette" layout="full">
    …
  </Panel>
</Panels>
```

Unchanged in spirit from the branding-deck spec §5: plain elements, no
registry, `id` and `title` authored once and read by the heading, the anchor,
the rail, and the contents list.

### 5.2 The `<p>` rule, and the check that enforces it

**Never author a `<p>` in MDX with its content on a following line.** §1.2 is
what that costs: MDX paragraph-wraps block children, `essayComponents.p` makes
that a real `<p>`, and the result is invalid HTML that takes the whole page's
hydration down with it.

Two correct forms:

```mdx
<p className="text-sm text-muted-foreground">All on one line — inline, not wrapped.</p>
```

```mdx
<div className="text-sm text-muted-foreground">
  On its own line, so MDX makes the paragraph. The container must not be a `<p>`.
</div>
```

`scripts/check-mdx-paragraphs.mjs` — Node only, no dependencies, modelled on
`check-deck-fidelity.mjs` — scans `content/**/*.mdx` and fails on any opening
`<p` whose tag ends the line. That is the exact shape of the bug, it is
cheap, and it has no false positives worth tolerating (a multi-line `<p>` is
never what you want in this codebase).

This rule is not deck-specific. It applies to every MDX body on the site, and
the check should cover all of them.

### 5.3 The nine panels

The Figma pull has **nine** frames (`docs/brand/deck-source.json`). The MDX
authors seven: the branding-deck build dropped frame 0 (the title) and frame 8
(the closing bio) on the reasoning that "the page's own header and footer
already carry that", and allowlisted their text in the fidelity checker so the
drop wouldn't fail the diff.

**Beck's call, 2026-09-17: both come back.** They were slides. A deck that
opens on "about me" and ends on "profile pictures" is a deck with its first
and last slides cut off, and the page's `<h1>` and the site footer are not
substitutes — they are the *site's* framing of the piece, in the site's voice,
not the deck's own opening and closing.

| # | `id` | `title` | `layout` | Content |
| --- | --- | --- | --- | --- |
| 1 | `cover` | `personal brand` | `cover` | **Restored.** `BrandMark` + "personal brand" + "beck qing / artist · scientist · designer" |
| 2 | `about-me` | `Hi, I'm Beck.` | `split` | Photo + the interdisciplinary-designer paragraph |
| 3 | `logo-drafting` | `logo drafting` | `split` | Sketch page + three paragraphs + the rejected-design aside |
| 4 | `logo-design` | `logo design` | `full` | `MarkConstruction` + three paragraphs |
| 5 | `typography` | `typography` | `full` | Two paragraphs + `TypeSpecimen`'s three samples |
| 6 | `palette` | `palette` | `full` | Two paragraphs + `BrandPalette`'s eleven swatches |
| 7 | `palette-uses` | `palette uses` | `split` | "Sparks and tendrils" + two paragraphs + the art/humanities/science chips |
| 8 | `profile-pictures` | `profile pictures` | `full` | `ProfilePictureGrid`'s six options |
| 9 | `closing` | `closing` | `cover` | **Restored.** "beck qing / artist · scientist · designer" + `hello@beckqing.com` |

Four things to get right about the restored pair:

**The tagline is deliberately rendered twice.** `beck qing\nartist ·
scientist · designer` is the *same* text node in frame 0 and frame 8 — the
deck bookended itself with it. Render it in both panels. The fidelity checker
flattens every frame's text into one word stream, so the pull contains it
twice too, and rendering it once would fail the diff in a way that looks like
a mystery rather than a mistake.

**The email is not new exposure.** `hello@beckqing.com` already ships
sitewide as a plaintext `mailto:` in
[components/site-footer.tsx:9](../../components/site-footer.tsx#L9), and
`artist · scientist · designer` is already the site's `<title>`
([app/layout.tsx:25](../../app/layout.tsx#L25)). The closing panel publishes
nothing that isn't on every page already, so it uses the same plain
`mailto:` — no obfuscation, matching the reasoning already recorded in
`app/about-next/page.tsx:30`.

**Panel 9's `title` must not be `beck qing`, and this is not cosmetic.**
`pullAttributeText` scrapes `Panel`'s `title` into the word stream, so a
`title` that repeats the panel's own body text double-counts it: frame 8
carries `beck qing\nartist · scientist · designer` **once**, and
`title="beck qing"` plus that same line in the body would submit it twice and
fail the diff. `title="closing"` avoids it and reads better in the rail beside
"palette" and "typography" — at the cost of one new `MDX_ONLY_TEXT` entry
(`'closing'`), exactly the precedent `'profile pictures'` already set for a
frame with no usable heading text of its own.

Panel 1 has no such problem: `title="personal brand"` **is** frame 0's real
heading text, so scraping it is correct and it needs no allowlist entry.

**Both panels are in the rail**, as dots 1 and 9. A deck's title slide *is*
slide one. This is the contrast case for `rail={false}` (§3.4): the MQP's
`references` panel is genuine back matter and opts out; a closing bio slide is
part of the deck and does not.

> **The one thing to look at in a browser.** The piece header (`h1`
> "personal branding", year, tags, description) sits directly above panel 1,
> which opens with the wordmark and "personal brand". Different registers —
> the site naming a piece, then the deck opening itself — but they are
> adjacent and both are display type. If it reads as a stutter, the fix is to
> quiet the page header for `bodyLayout: 'wide'` pieces (the cover panel is
> already carrying the job), **not** to re-drop the panel Beck just asked
> for.

---

## 6. Panel geometry

### 6.1 Viewport-tall in landscape, natural height in portrait

Both documents were designed as decks that were presented, so where the screen
is slide-shaped, a panel fills it:

```css
.panel {
  scroll-margin-top: calc(var(--nav-h, 4rem) + 1rem);
}

@media (orientation: landscape) and (min-height: 35rem) {
  .panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: calc(100svh - var(--nav-h, 4rem));
  }
}
```

Four details, each load-bearing:

- **`orientation: landscape`, not a width breakpoint.** Beck's framing: these
  are decks, and a deck is landscape. A tablet held upright gets natural
  height even though it is 768px wide.
- **`and (min-height: 35rem)`** (560px) excludes a **phone in landscape**,
  which is landscape and ~390px tall. A 390px "full screen" panel is not a
  slide, it is a squeeze. iPad landscape (768px tall) and any laptop clear it
  comfortably.
- **`min-height`, never `height`.** A panel taller than the viewport —
  `profile-pictures` is a six-image grid — simply grows. Nothing is ever
  clipped and nothing ever needs an inner scroller, which is the trap the old
  present mode had to write a scrollable-ancestor guard for.
- **`svh`, not `dvh` or `vh`.** `dvh` changes as mobile browser chrome
  collapses, which would resize every panel mid-scroll. `svh` is stable.
  Minus `--nav-h` because the nav is `sticky top-0`
  ([components/site-nav.tsx:39](../../components/site-nav.tsx#L39)) and
  occupies the top of the viewport for the whole scroll; the `4rem` fallback
  covers first paint, before `site-nav.tsx`'s `ResizeObserver` has published a
  measurement.

> `--nav-h` is **not a constant** — the nav wraps to two lines below ~363px.
> This is the cross-component contract recorded in ARCHITECTURE.md's
> "Component layers"; the rail and the panels become its second and third
> consumers after `DockedFilterBar`.

### 6.2 Separation, and the first and last panel

Panels need no border or rule — a screen's worth of vertical space between
compositions is its own separator, and in portrait the `h2` does that work.
Portrait spacing carries over from `Slide`'s current `mt-16 first:mt-8`.

`<main>` is `max-w-5xl` with `py-16 sm:py-20`
([app/work/[slug]/page.tsx:74](../../app/work/[slug]/page.tsx#L74)), and the
piece header (h1, meta, description, status flags) sits above the first panel.
So **panel one is pushed down by the header and is not a clean full screen on
first paint**, even though §6.1 gives it a full screen's `min-height`.

With the cover panel restored (§5.3) this matters more than it did when panel
one was "about me": a cover that opens half-scrolled is a worse first
impression than a prose slide that does. It is still not worth a special
case in `Panel` — the honest options are to quiet the page header for
`bodyLayout: 'wide'` pieces, or to accept it. Decide it by looking at the
built page, which is the same call §5.3's closing note flags.

### 6.3 The measure lives inside the panel

`EssayBody` is `max-w-2xl` ([components/essay.tsx:31](../../components/essay.tsx#L31)).
It wraps a panel's **prose**, never the panel and never the body — a
fifteen-section report's figures, tables, and diagrams must not be crushed
into a prose column, and neither must `BrandPalette` or `ProfilePictureGrid`.
`layout="full"` panels opt out entirely and compose their own width. This is
unchanged from both prior specs; it is restated because `bodyLayout: 'wide'`
is named for exactly this.

### 6.4 Scroll snap — not in v1

Tempting, and deliberately deferred. `scroll-snap-type: y proximity` would
make landscape scrolling step between panels, which is more deck-like. Three
things have to be true first, and none is free:

1. Panels are `min-height`, so a panel taller than the viewport has its snap
   point at its start; scrolling through its overflow fights the snap.
2. The real snap position is offset by the sticky nav, so every panel needs a
   `scroll-margin-top` kept in sync with a `--nav-h` that is not a constant.
3. A snap container snaps *everything* in it — the piece header, the contents
   list, the tag footer — unless each non-panel is explicitly
   `scroll-snap-align: none`.

Ship §6.1 first, look at it, then decide. If Beck wants it, it is `proximity`
(never `mandatory`), landscape-only, and gated on §6.1's same media query.

---

## 7. The rail

`PanelRail` (`'use client'`), `components/panel-rail.tsx`. One dot per panel,
fixed to the right edge. This is the MQP spec §5.3 with two corrections.

### 7.1 Placement, and the breakpoint correction

```
position: fixed; right: 1.75rem; top: 50%; transform: translateY(-50%);
z-index: 40;
```

`z-40`, **below** the nav's `z-50`
([components/site-nav.tsx:39](../../components/site-nav.tsx#L39)).

> **Correction to the MQP spec §5.3, which says `lg` (1024px).** `<main>` is
> `max-w-5xl` — 64rem, **1024px**. At a 1024px viewport the content is
> 1024px wide and the gutter is **zero**, so a rail at `right: 1.75rem` lands
> on top of the text. The rail must appear only once there is a gutter to put
> it in: **`xl` (1280px)**, where each gutter is 128px. Below that, the
> contents list (§8) is the navigation — which the MQP spec already requires
> it to be.

### 7.2 The dots

- Each dot is a real `<button>`, not an `<a>`, with `aria-label` of the panel
  title. It calls `scrollIntoView` on its target. **It must not write
  history** — fifteen dots would otherwise mean fifteen back-presses to leave
  the page. Deep links are §9's job, and they are `<a>`s in the contents list.
- Active dot: `var(--essay-accent)` — the piece's own tone, published by the
  `PieceView` branch (§3.1), so the deck's dots are its accent and the MQP's
  are emerald with no per-piece code. Inactive: `var(--border)`.
- `aria-current="true"` on the active dot; the `<nav>` carries
  `aria-label="Panel progress"`.
- A dot is a hit target, so it gets a transparent pad to ~40px even though the
  visible dot is small. Hover/focus reveals the panel title as a text label to
  the left of the rail — the dots alone are a position indicator, not a
  contents list, and that is what §8 is for.

### 7.3 Active state

`IntersectionObserver` with `rootMargin: '-45% 0px -45% 0px'` — the band is
the middle ~10% of the viewport, so "active" means "the panel crossing the
centre of the screen." This is what the MQP prototype's working scrollspy
used; keep the number.

One observer, created once, observing `document.getElementById(id)` for each
panel in the list. Not a scroll listener:
[work-gallery.tsx:1285](../../components/work-gallery.tsx#L1285) uses a
rAF-throttled scroll listener for
`DockedFilterBar` and documents why, but that case needs a continuous
measurement against a moving threshold. This one needs a discrete "which
panel is centred", which is what the observer API is for.

**With viewport-tall panels in landscape, at most one panel can occupy the
centre band**, so the active dot is unambiguous. In portrait, short adjacent
panels can both intersect a 10% band; resolve ties by taking the **last**
entry in document order among those intersecting, so scrolling down always
advances.

### 7.4 Reduced motion

Both the rail and the contents list scroll with `behavior: 'smooth'`. Under
`prefers-reduced-motion: reduce` they pass `behavior: 'auto'`.

**This must be read in JS via `matchMedia`.** `globals.css`'s
`@media (prefers-reduced-motion: reduce)` block (line 324) cannot reach `scrollIntoView`'s options object — programmatic
scrolling is not a CSS transition, and `scroll-behavior: smooth` in CSS is a
different mechanism from the `behavior` argument. Easy to assume covered; it
isn't.

---

## 8. The contents list

`PanelContents` — a Server Component, rendered by `Panels` under the piece
header and above the first panel. A plain `<nav aria-label="Contents">` with
an `<ol>` of same-page `<a href="#id">` links, styled as the site's existing
contents idiom (`ChapbookContents` in `work-visuals.tsx`) — lowercase
`font-brand`, muted, one per line.

**Rendered at every breakpoint**, and below `xl` it is the only navigation.
Nine panels for the deck, fifteen for the MQP; at those lengths a list under
the header is genuinely useful and costs nothing. It is also what makes the
document's structure visible to a crawler and to in-page search, neither of
which the old present mode offered.

Unlike the rail's dots, these **are** `<a href="#id">` and they **do** write
history — that is the difference between "jump me to a place I chose from a
list" and "scrub my position."

---

## 9. Deep links

### 9.1 `#id`, and nothing else

`/work/personal-branding#palette` scrolls the palette panel into view. That is
the whole feature: `Panel`'s `id` is a real DOM `id`, the browser does the
rest, and `scroll-margin-top: calc(var(--nav-h, 4rem) + 1rem)` (§6.1) keeps
the heading from landing under the sticky nav.

`?slide=<id>` is **deleted**. Any existing link carrying it still lands on the
page and simply ignores the param; no redirect is warranted for a URL shape
that existed for a matter of hours.

### 9.2 What this deletes

`useSearchParams` goes, and with it the `<Suspense>` boundary around `<Body />`
([app/work/[slug]/page.tsx:245](../../app/work/[slug]/page.tsx#L245)) — that
boundary existed *only* because reading search params in a client component
requires one, the same reason `/work` wraps `WorkGallery`. With the body fully
server-rendered and no search-param read anywhere in it, there is nothing to
suspend on, and the fallback (`<div className="mt-8 h-32" />`) stops being a
layout-shifting placeholder on every load.

Also gone: `useRouter`, `usePathname`, `useTransition`, `router.replace`,
`PresentingContext`, `DialogPrimitive`, `requestFullscreen` and its iOS
`.catch`, the idle-fade timer, the key handler, the swipe handler and its
`startsInScrollable` walk, and the prev/next/close/counter chrome.

---

## 10. Accessibility

- One `<section aria-labelledby="${id}-title">` per panel, with an `h2`
  carrying that id. Deterministic, server-rendered, unique — `useId` and the
  duplicate-id suppression both go away (§3.3).
- Two navigation landmarks, each labelled: `"Contents"` and
  `"Panel progress"`.
- Rail dots are buttons with real labels and `aria-current`. They are
  keyboard-reachable in document order, which now matches panel order.
- No focus trap, no scroll lock, no Escape handler, no focus restoration —
  there is no longer a mode to be inside. This is a straightforwardly better
  accessibility story than present mode, which needed all four to be correct.
- `prefers-reduced-motion` per §7.4.

---

## 11. What does not change

- **The content**, other than §5.3's two restored panels. Every word stays
  verbatim from `docs/brand/deck-source.json`, and
  `scripts/check-deck-fidelity.mjs` must stay exit 0 through the rename.

  The checker gets *stricter*, not looser: restoring the title and closing
  panels means **three entries come out of `DECK_ONLY_TEXT`**
  (`scripts/check-deck-fidelity.mjs:43`) — `'personal brand'`,
  `'beck qing\nartist · scientist · designer'`, and
  `'hello@beckqing.com'`. Those three were only ever allowlisted to excuse
  the drop. With the panels back, the transcription has to carry them, and
  removing the allowlist entries is what proves it does. Delete the
  now-false comment above them ("the page's own header and footer carry
  this instead") rather than leaving it to mislead.

  Everything else in both allowlists stays and is still correct:
  `'alternate palettes'` and the colour-blind simulation were never
  exported, the eleven swatch name/hex pairs come from `BrandPalette`'s own
  constant, `TypeSample` renders its own alphabet, the rotated
  `'profile_picture.jpg…'` string is decoration, and `'profile pictures'`
  stays in `MDX_ONLY_TEXT` because frame 7 has no real heading text node —
  which gains one sibling, `'closing'`, for the reason §5.3 gives.
- **The three live payoff slides** — `BrandMark`/`MarkConstruction`,
  `BrandPalette`, `TypeSpecimen` — render from the site's own tokens, which is
  the whole point of the rebuild and is untouched.
- **The gallery, the lightbox, the filter panel, the tag vocabulary, the
  collection machinery.** Nothing here reaches them.
- **`docs/brand/deck-source.json` and `scripts/pull-brand-deck.mjs`.**

---

## 12. Acceptance

1. `/work/personal-branding` renders **all nine panels** in scroll order,
   matching §5.3's table — including the restored `cover` and `closing`
   panels, which the deck has never rendered before.
2. Dev server log is clean on load: no nested-`<p>` warning, no hydration
   error, no empty-list warn from `Panels`' dev guard.
3. `node scripts/check-deck-fidelity.mjs` → exit 0 **with `'personal brand'`,
   the tagline, and `'hello@beckqing.com'` removed from `DECK_ONLY_TEXT`**
   (§11). Putting them back to make it pass defeats the point of the check.
4. `node scripts/check-mdx-paragraphs.mjs` → exit 0 across all of
   `content/**/*.mdx`.
5. `npx tsc --noEmit` → clean. `next build` → clean.
6. **Landscape, ≥560px tall** (laptop, iPad landscape): each panel fills the
   viewport below the nav, content vertically centred; `profile-pictures`
   overflows naturally rather than clipping.
7. **Portrait** (phone, iPad upright): natural height, no empty screens.
8. **Phone in landscape** (~390px tall): natural height, not a 390px panel.
9. Rail visible at ≥1280px, hidden below, and **never overlapping body text at
   1280px exactly** — the §7.1 correction is the specific thing to check.
10. Active dot tracks the panel crossing the centre of the viewport; clicking
    a dot scrolls there and adds **no** history entry (back leaves the page in
    one press).
11. Contents list present at every breakpoint; each entry lands its panel's
    heading **clear of the sticky nav**, at 375px (nav wrapped to two lines)
    as well as at 1440px.
12. `/work/personal-branding#palette` pasted fresh into a new tab lands on the
    palette panel, heading clear of the nav.
13. Under `prefers-reduced-motion: reduce`, both navs jump rather than glide.
14. `/work/aortic-valve-calcification` is unaffected by the rename because it
    is authored against `Panels` from the start.
15. No `components/deck.tsx`, no `isDeck`, no `deck?: true`, no `?slide=`
    anywhere in the tree.
16. `next build`'s per-route First Load JS for `/work/[slug]` drops, and the
    deck's client graph no longer pulls `@base-ui/react`'s `Dialog`,
    `next/navigation`, or `components/essay.tsx` (§3.3).

---

## 13. Documentation to update in the same change

| File | Change |
| --- | --- |
| `docs/ARCHITECTURE.md` | Rewrite "The personal branding deck" — the "Two renders, one content tree" paragraph is wholly superseded. Retitle to cover both wide-body documents, or add "Panels and the rail" and cross-link. Update the `isDeck` row in the content-model table (line 214) to `isWideBody`. Add the rail and the panels to `--nav-h`'s consumer list (line 800) |
| `docs/TODO.md` | Close §25's spec link (§1.4) and record this spec as open work. Its two genuine loose ends — the unverified filter-panel height, and "sparks and tendrils"/"the abstract" being unregistered — are untouched by this spec and stay open |
| `docs/specs/2026-09-aortic-valve-calcification.md` | Amend §5 (the rail and contents list move to the shared primitive; §5.3's `lg` → `xl` per §7.1), §6.1–§6.2 (`caseStudy?: true` → `bodyLayout: 'wide'`, collision resolved), and §5.1's "same mechanism `Deck` uses" — it describes the *fixed* mechanism, not the shipped one, and the shipped one never worked. `<Section>` → `<Panel>` throughout §6.3's table |
| `docs/history/2026-09-branding-deck.md` | Add a status line: §6–§7 superseded by this spec |
| `docs/specs/2026-09-sections-folding-logs.md` | A note that `<Panel>` is a different primitive from its `<Section>`, and why (§3.2) — so the next reader of either doesn't merge them |

---

## 14. Resolved, and what's left open

All four questions this spec opened were answered by Beck on 2026-09-17:

1. **`Panels`/`Panel`** — confirmed. §3.2 stands.
2. **Scroll snap** — deferred, not in v1. §6.4's three obstacles stay written
   down so revisiting it doesn't start from scratch.
3. **Nine panels, not seven** — the title and closing slides come back. Beck
   disagreed with dropping them, and that disagreement is now §5.3, the new
   `cover` layout in §3.4, and the fidelity-allowlist change in §11. This was
   the answer that changed the most.
4. **A rail on long essays** — "maybe, to think about later." Not in this
   spec. `bodyLayout: 'wide'` is about width rather than length, so an essay
   opting into a rail is a separate decision and stays in §15.

**Genuinely still open, and both are browser calls rather than design calls:**

- **Whether the piece header stutters against the restored cover panel**
  (§5.3's closing note, §6.2). If it does, quiet the header for
  `bodyLayout: 'wide'` pieces.
- **Whether panel one being pushed below the fold by that header is
  acceptable** (§6.2). Same decision, looked at from the other side; likely
  the same fix resolves both.

---

## 15. Out of scope

- Scroll snap (§6.4) — deferred by Beck, §14.2.
- A rail on long essays (§14.4) — deferred by Beck.
- Keyboard paging (`→`/`space` advancing a panel). Native scrolling has its
  own keys, and adding a second set is how you end up re-implementing present
  mode.
- Registering "sparks and tendrils" and "the abstract" as `WorkPiece`s — a
  separate, deliberate addition per TODO §25, untouched here.
- Exporting a deck to PDF, printing it, or embedding it anywhere else.
- Any change to the Figma pull, the fidelity checker's algorithm (the
  attribute list changes; the algorithm does not), or the brand tokens.
