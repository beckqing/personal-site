# Spec — sections, folding, and logs

> **Status: designed 2026-09-02 with Beck, not built.** The heading-scale
> change this spec assumes **has** shipped (see §1 and ARCHITECTURE.md's
> "Headings"); `<Section>`, `<Fold>`, and `<Log>` have not.
>
> Split deliberately: **§2–§4 (`Section`, `Fold`) depend on nothing** and can
> ship alone. **§5 (`Log`) is blocked on content** — the costume-design piece
> it exists for is unfinished and not in `lib/work.ts` yet. Build the first
> half without waiting.

Three primitives for structuring a long writing piece: one that owns a
heading, one that hides a tail of content, one that reorders dated entries.
They came out of one conversation and are specified together because the
first two are what the third is built from — but only the third needs new
content to exist.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| Whether headings get bigger | **Yes, whole ladder up one step** — 30/24/20/18/16 | Beck, 2026-09-02 |
| How a foldable section is authored | **A component that owns its heading**, not a wrapper around one | Beck, 2026-09-02 |
| Whether a fold may start closed | **Yes, sometimes** — author's call per instance | Beck, 2026-09-02 |
| Whether `first-art-fair.mdx` reorders | **No.** It folds, but its order is fixed | Beck, 2026-09-02 |
| What reordering is for | **The costume-design piece** (faun, v1–v4), not essays generally | Beck, 2026-09-02 |
| How entries sort | **Document order, reversed.** No date parsing, no sort key | §5 below |
| Point releases (`v3.1`) | **Siblings of `v3`, not children** | §5 below |

---

## 1. Why this exists: the scale ran out of room

`lib/heading-styles.ts` had `h3`, `h4`, and `h5` all at `text-base`, told
apart by weight and colour alone, because a heading may never render smaller
than the 16px body text it introduces and the ceiling was only 24px. Three
levels at one size is the practical limit of that distinction; a fourth would
be invisible.

Raising the whole ladder (shipped 2026-09-02) bought back two levels —
30/24/20/18/16, five distinct sizes. **That is the prerequisite for
everything below**, because `<Section>` derives its level from nesting depth
and would otherwise be deriving levels the reader cannot perceive.

But size alone does not scale indefinitely. **Past three levels, hierarchy
should be expressed structurally rather than typographically** — a closed
fold says "there is more inside this" using no size budget at all. That is
the through-line of this spec: folding is not a separate feature bolted onto
essays, it is the affordance that takes over where the type scale stops.

### Two rules for what folds

**1. Fold repeating structure, never unique content.** A section shape that
appears once, folded, hides something the reader cannot predict — they must
open it to learn whether they wanted it. A shape that repeats (every market
in `first-art-fair.mdx` has a "+ good" and a "Δ for next time"; every version
of the costume has a build narrative) is learned once, and folding becomes a
scanning aid.

**2. Default open unless the block is reference material rather than reading
material.** These are essays. The `<EmojiList>` blocks *are* the art fair
essay's substance. The exception is `<Fold>` (§4), which exists precisely for
the tail of an entry that most readers will skip.

### What does not fold, and why

| Content | Verdict |
| --- | --- |
| Narrative prose between entries | Never. If it folds, it isn't the essay. |
| `+ good` / `Δ for next time` | `<Section fold="open">` — repeating, predictable, substantive |
| note-systems' "Current setup as of January 2023" blockquote | `<Section fold="closed">` — a dated snapshot sidebar, not the argument |
| note-systems' per-app paragraphs | Neither. That section wants restructuring, not hiding |
| `<Aside>` | Never. It is already 12px; folding it costs more than it saves |
| Verse, Chinese sources | Never. They are the piece |

---

## 2. `<Section>` — the heading owns the fold

```tsx
<Section title="+ good" fold="open">…</Section>
<Section title="Current setup as of January 2023" fold="closed">…</Section>
<Section title="How it started">…</Section>   {/* not foldable */}
```

### No `level` prop

`Section` publishes its own depth to descendants through context and renders
`h{depth}`. A `Section` directly inside `EssayBody` is `h2`; one nested
inside that is `h3`; and so on. **The author cannot pick a level.**

This is the point. Every heading bug this codebase has had came from picking
a level for how big it rendered rather than what it meant — `h1` smaller than
`h2` on a piece page, `####` reached for because `###` looked too loud,
`#####` used as a bold label inside a blockquote. A level that cannot be
typed cannot be mistyped.

```tsx
const SectionDepth = createContext(1)   // EssayBody's implicit h1 is the page title
```

An explicit `level` override stays on the type for genuine exceptions, and is
expected to have zero call sites. If it grows several, that is a signal the
context model is wrong — revisit rather than accumulate overrides.

**Depth caps at 5.** `headingStyles` defines no `h6`, and `essayComponents`
maps no `h6` either, so a sixth level today would render unstyled. Rather
than invent an `h6` nobody has asked for, `Section` clamps: nesting deeper
than 5 renders `h5` and logs a build-time warning. Six levels of nesting in
an essay is a content problem, and the warning should say so.

### Rendering

Not foldable — a plain heading and its children:

```tsx
<section>
  <h3 className={headingStyles.h3}>{title}</h3>
  {children}
</section>
```

Foldable — native `<details>`, heading *inside* `<summary>`:

```tsx
<details open={fold === 'open'} className="group">
  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
    <h3 className={cn(headingStyles.h3, 'inline-flex items-center gap-2')}>
      {title}
      <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
    </h3>
  </summary>
  {children}
</details>
```

### Why native `<details>`

- **No client component.** Essays stay server-rendered; no hydration cost, no
  `'use client'` creeping into the MDX component map.
- **Works without JS**, like the footer's existing disclosure
  (`components/site-footer.tsx`).
- **Find-in-page reaches closed content.** The content is in the DOM;
  browsers supporting `hidden="until-found"` expand it automatically.
- **Fragment navigation.** Chromium auto-expands a `<details>` when you
  navigate to a fragment inside it. Firefox and Safari support varies —
  **verify in all three before relying on it** (§7 acceptance).

Marker-stripping follows the existing footer pattern exactly rather than
inventing a second one.

### Anchors

`Section` derives an `id` from `title` (lowercased, non-alphanumerics to
hyphens, deduplicated within a page via the depth context) and renders it on
the `<section>`/`<details>`. This is what makes deep-linking to a folded
section possible at all, and it must be **stable across sort order** (§5) —
derive from the title, never from an index.

---

## 3. `<Section>` replaces `MarketHeader`

`components/essay.tsx`'s `MarketHeader` is a hardcoded `h3` plus a `when`
line, built for one essay. It is `<Section>` with a subtitle:

```tsx
<Section title="stART on the Street" when="11-6 Sunday 18 September 2022">
```

`when` renders as the existing `<p className="text-sm text-muted-foreground">`
under the heading. `MarketHeader` is deleted and its three call sites in
`first-art-fair.mdx` are rewritten.

> **Retracted:** an earlier draft of this design called for splitting `when`
> into an ISO date plus a display string, so entries could be sorted by date.
> §5 sorts by document order instead, and the art fair essay does not sort at
> all — so `when` stays a single display string, everywhere. No date parsing
> anywhere in this spec.

### The art fair essay after this change

```
## How it started                          → h2   (narrative, never folds)
<Section title="stART on the Street" …>    → h3
  <Section title="+ things that went well" fold="open">   → h4
  <Section title="Δ things to change…"     fold="open">   → h4
```

The `####` markers disappear from the MDX entirely — the "+ good" and
"Δ for next time" heads become fold summaries rather than headings the author
chose a number for. **The essay drops from four author-chosen levels to
zero**, and the order of its markets stays fixed.

---

## 4. `<Fold>` — a tail, not a wrapper

```tsx
Some opening paragraphs that always show.

<Fold summary="read more">
  The long build narrative.
</Fold>
```

`Section`'s fold wraps *everything* under a heading. The costume piece needs
the opposite shape: v1 opens with a paragraph that always shows, then hides
eight paragraphs of construction detail behind `read more`. The visible part
is not inside the fold, and there is no second heading to hang it on.

So `<Fold>` is a separate primitive:

- **No heading, no level, no depth context.** It is not a document section.
- **`summary` is required**, defaults to nothing — the author writes "read
  more", "the full build", whatever fits.
- **Always starts closed.** That is its entire purpose; a `<Fold>` that
  starts open is a `<div>`.

Two small obvious components beat one component with a confusing dual mode.
At the call site, `Section` means "this is a part of the document" and `Fold`
means "this is optional depth".

---

## 5. `<Log>` — reordering entries

**Blocked on content.** The costume-design piece (faun, v1 2016 → v4 2023) is
unfinished and not in `lib/work.ts`. Build §2–§4 first; this section is the
design so that the first two do not foreclose it.

```tsx
<Log>
  <Entry title="v1" when="2016">…</Entry>
  <Entry title="v2" when="2021">…</Entry>
  <Entry title="v3" when="2022">…</Entry>
  <Entry title="v3.1">…</Entry>
  <Entry title="v4" when="2023" unfinished>…</Entry>
</Log>
```

### Document order, reversed. No sort key.

Entries are authored chronologically, so `<Log>` reverses `React.Children`
and that is the whole algorithm. No dates, no comparator, no `order` prop.
`v3.1` lands between `v3` and `v4` for free, because that is where it was
written.

**This is why point releases are siblings, not children.** Reversed, the log
reads v4 → v3.1 → v3 → v2 → v1, which is correct. Nesting `v3.1` inside `v3`
would require reversing *within* a parent as well, for no gain.

### `<Entry>` is `<Section>` plus a state

`Entry` renders as a `Section` (heading, `when` subtitle, anchor) and adds:

- **`unfinished`** — renders the existing `UnfinishedMark`
  (`components/work-visuals.tsx`), the same "in progress" badge
  `lib/work.ts`'s `unfinished?: boolean` already drives. v4 is genuinely
  in progress and the piece says another release is expected. Do not invent a
  second WIP treatment.
- **A stable `key`**, derived from `title`. Without it, flipping the sort
  remounts the `<details>` elements and discards which folds the reader had
  open.

### The toggle

- **URL state, `?order=old-new`**, matching `WorkGallery`'s existing `?sort=`
  precedent (`components/work-gallery.tsx`). A reversed view stays linkable.
- `<Log>` is the only `'use client'` component here. Its `<Entry>` children
  are server-rendered and passed through as `ReactNode`; only the ordering
  shell is client-side.
- Default direction is **new → old**, matching Beck's draft — but see the
  editorial note below.

### Do not reverse with CSS

`flex-direction: column-reverse` is the tempting one-liner and it is wrong:
it leaves DOM order chronological while visual order is reversed, so a screen
reader reads one sequence and a sighted reader sees another, and tab order
follows the DOM. **Reorder the children array.**

### What sits outside the log

The costume piece's intro, the sort toggle, and the current-version images
are all above `<Log>` and never move. `<Log>` wraps only the entries — it is
not a mode the whole essay enters. This is also why the art fair essay can
adopt `<Section>` without ever adopting `<Log>`.

### Consequence: entries own their preambles

An entry's narrative lead-in must live *inside* the entry, or reversal breaks
the prose. This constraint binds **only inside a `<Log>`**. `first-art-fair.mdx`
keeps its narrative interludes exactly where they are, between markets,
because it does not reorder.

---

## 6. Editorial notes on the costume piece

Not blocking, but decided before it is written:

- **Entry lengths are very uneven** — v1 is eight paragraphs, v2 is two, v4
  is two lines. New → old opens the piece with its thinnest, least finished
  entry; old → new front-loads its longest before the reader knows they care.
  Neither default is obviously right. This is the argument for `<Fold>`
  inside the long entries (v1 already has one; v3 likely wants one) so
  neither direction is dominated by one entry.
- **The hero is labelled v3 but v4 exists.** Derive "current version" from
  the last entry rather than hardcoding it, so it cannot drift again.
- **🐐 in the title needs adding to the emoji subset.** The monochrome
  webfont covers exactly the 19 codepoints `first-art-fair.mdx` uses, and
  `scripts/check-emoji-subset.mjs` only scans `<Item emoji="…">` attributes —
  an emoji in a *title* slips past the guard and silently falls back to
  platform colour emoji. Either extend the script's scan or add the glyph.
- The draft's trailing `prices / short pile <½"` block reads as working
  notes, not content.

---

## 7. Accessibility rules

- The heading goes **inside** `<summary>`, not beside it. Screen readers then
  announce both the disclosure state and the heading level.
- `<summary>` is focusable and keyboard-operable natively. Do not replace it
  with a `<button>` or a click handler on a `<div>`.
- The chevron is `aria-hidden`; `<details>` already communicates state.
- Reordering must change DOM order, not just visual order (§5).
- Anchors must be stable across sort order (§2).
- Nothing here may make an essay's body a client component.

---

## 8. Out of scope

- **A remark plugin that auto-sections flat `##` headings** into `<details>`
  at build time. Considered and rejected: invisible behaviour, real
  machinery, and it makes the MDX stop meaning what it says.
- **A table of contents.** Anchors (§2) are the prerequisite for one, but
  nothing has asked for a ToC yet.
- **`h6`.** §2 clamps instead.
- **Per-reader fold memory** (localStorage). Folds reset on reload.
- **Animating the fold open.** Native `<details>` does not animate; the
  workarounds all cost the no-JS guarantee.

---

## 9. Acceptance

- [ ] `headingStyles` is 30/24/20/18/16, `h1` responsive — **done 2026-09-02**
- [ ] `<Section>` derives its level from depth; no call site passes `level`
- [ ] `MarketHeader` is deleted; `first-art-fair.mdx` contains no `####`
- [ ] Folds work with JavaScript disabled
- [ ] Find-in-page finds text inside a closed fold, in Chrome, Firefox, and
      Safari; record which of the three auto-expand
- [ ] A fragment link to a section inside a closed fold opens it, or degrades
      to scrolling to the closed summary — verified in all three
- [ ] `tsc --noEmit` clean; `next build` clean; static page count unchanged
      (nothing here adds a route)

---

## 10. What Beck still supplies

- The finished costume-design piece — §5 stays unbuilt until it exists in
  `lib/work.ts`.
- Whether note-systems' `##### Digital:` / `##### Analog:` labels inside the
  blockquote become `<strong>` labels or a definition list. They are headings
  chosen for size — the exact anti-pattern §2 removes — and post-scale-change
  they render at body size inside a quote, so the distinction is weak now
  too.
