# Spec — the now page

> **Status: designed 2026-09-02 with Beck, not built.** The backfill is
> **complete** — ten entries, 2022-04 → 2026-08, for the one line the page
> tracks. **§6 (threads) is proposed rather than decided**: the mechanism is
> designed but the thread assignments are Beck's to write, and §1–§5 and
> §7–§9 ship without it.
>
> **Scope narrowed 2026-09-02, after §11's audit:** the hero's `open to …`
> line is *not* tracked (Beck). §5's snapshot machinery went with it — see
> that section for what was removed and when to recover it.
>
> **Audited against the tree 2026-09-02** — §11 holds the concrete touchpoints
> and the four traps the audit found. One of them (§11.G, the footer entry)
> is a question for Beck rather than a note for the implementer.
>
> Depends on nothing. No new primitives, no content pipeline, one data file
> and one route. It can ship independently of
> [2026-09-sections-folding-logs.md](2026-09-sections-folding-logs.md),
> though it borrows that spec's ordering rules — see §5.

The homepage hero's second line is already a "now" statement. This spec gives
it a data file, a history, and a page of its own.

---

## 0. Decisions taken

| Question | Decision | Who |
| --- | --- | --- |
| What the page tracks | **One line** — the hero's `currently …`. Nothing else | Beck, 2026-09-02 |
| Whether `open to …` is tracked | **No.** It stays hardcoded in the hero | Beck, 2026-09-02 |
| Whether to build a strand registry | **No.** One array and one prefix constant | §2 |
| Date precision | **Year + month**, `YYYY-MM` | Beck, 2026-09-02 |
| What `since` means | **When it was true**, not when the site said it | §3 |
| Whether to backfill | **Yes**, from the archive and from Beck's recollection | Beck, 2026-09-02 |
| Entry shape | **One verbatim string** per entry, not an items array | §2 |
| History layout | **One reversed list.** An entry *is* a row | §5 |
| Hero line 2 links to `/now` | **Yes** | Beck, 2026-09-02 |
| `/now` in the site header | **No.** Hero line, and possibly the footer (§11.G) | Beck, 2026-09-02 |
| Whether recurrence is highlighted | **Yes, proposed** — reverses an earlier "no". Editorial, not computed | Beck asked 2026-09-02; §6 |
| How threads are recorded | **Substring annotations** over verbatim `text`, not an items array | §6 |
| Whether line 1 appears on `/now` | **Yes**, as the page's permanent frame and its `h1` | §5, §11.F |

---

## 1. Why this exists

The hero has three lines:

```
forever a student of art, science, and humanity
currently focused on home improvement and interactive art
open to roles in automation, biotech, and food
```

The first is permanent. The second is a dated claim about the present that
has been quietly rewritten for four years with no record kept. **The third is
out of scope** — Beck's call, 2026-09-02: availability is not a "now" in the
sense this page is about, and it stays hardcoded in `app/page.tsx` exactly as
it is today. See §10.

`/now` is not a new kind of page — it is line 2 unfolded, with its past
attached, under line 1 as its standing frame.

**The hero must render from the now data, not hold a second copy of it.**
Copy that lives in two places drifts, which is the failure this codebase
keeps designing against (the footer's curated `MORE_LINKS`, the
sample-vs-real work split). `app/page.tsx` imports the newest entry; `/now`
imports all of them.

### The lag is the reason this page is interesting

The archived 11ty site (`beckqing/archived-personal-site`, `index.njk`) is
the only surviving record of past hero copy, and comparing it against Beck's
recollection shows how badly published copy trails lived experience:

- The site said `programming, rock climbing, and DNA isolation` from
  **2022-04** until **2024-04** — two years. Underneath it, the truth changed
  in 2022-06, 2023-01, 2023-06, and 2024-03.
- When the line finally changed in 2024-04, it changed to
  `programming, partner acrobatics, and puzzle hunts` — Beck's **2023-01**
  state, already fifteen months stale on the day it shipped.

A page that recorded commit dates would record when Beck got around to
editing a template. §3 is the rule that follows.

---

## 2. The data: `lib/now.ts`

An earlier draft of this design had a registry of named strands, for a page
that tracked two lines. **It was overbuilt then and there is one line now.**
A taxonomy with a single member is the speculative generality this repo
avoids everywhere except `lib/work.ts`'s tag vocabulary — which is a
deliberate, documented exception with a stated reason, not a pattern to
copy.

```ts
export type NowEntry = {
  /** `YYYY-MM`. When it was true — see §3. */
  since: string
  /** Everything after the line's prefix, verbatim — see below. */
  text: string
}

/** Hero line 1. Permanent, undated, not an entry.
 *  Carries the `IconCategory` because the hero binds each word to the icon
 *  collage and the mapping is not derivable — `science` → `sci` is an
 *  abbreviation, not a prefix rule. See §11.C. */
export const STUDENT_OF = [
  { word: 'art', category: 'art' },
  { word: 'science', category: 'sci' },
  { word: 'humanity', category: 'hu' },
] as const satisfies readonly { word: string; category: IconCategory }[]

/** Constant across every entry; joined to `text` with one space. */
export const NOW_PREFIX = 'currently'

/** Authored oldest-first. Reversed at render — see §5. */
export const NOW_ENTRIES: NowEntry[] = [/* §4 */]
```

There is no `NowLine` wrapper type and no map of named lines. An earlier
draft had both, to let one function walk two timelines at once; with one
timeline that structure is a container holding a single thing. A prefix
constant and an array say the same thing without asking the reader to
unwrap them.

### `text` is a string, not an items array

Tempting: `items: string[]` with a join helper, so `interactive art` could
become a chip linking to `/work?tags=art`.

It does not survive the actual data. `collaboration on design and science
communication projects` is not a list of three things — it is one phrase, and
an items array would have to hold it as a single element that renders through
comma-joining logic it never uses. Meanwhile the join helper has to get
Oxford commas and the final `and` right for one, two, and three-plus items
for no gain, because **nothing in the design ever reads an individual item.**

This is the same call `writeup` already made: a plain string, because
paragraphs were the right shape for short prose. Do not "improve" this into
an array later without a feature that actually needs the parts — and note
that §6, the one feature that does reach inside an entry, was designed as an
annotation layer over the string precisely so it would not require one.

### The prefix is constant, the verb is in the text

`currently` has held across every entry ever written. The *verb phrase* has
not — `gaining experience in` became `focused on` at the
2026 rebuild — but that verb is part of what Beck wrote, so it lives in
`text` where it is preserved verbatim rather than in a field that would need
its own history.

Rendered, the line is `` `${NOW_PREFIX} ${text}` `` and nothing else.

### Entries are authored oldest-first and never rewritten

Backfilled text is transcribed exactly as Beck wrote it — `the Chinese vegan
scene` keeps its capital `C`, `gaining experience in` is not normalized to
today's verb, and a three-item entry sitting next to a two-item one is not
padded for symmetry. The hero paragraph applies no `lowercase` class, so
capitals render as authored.

---

## 3. `since` means "when I would have said this"

Not when it was published. The archive's commit dates are an **upper bound**
and nothing more, and §1 shows them missing by as much as fifteen months.

**There is no provenance field.** A `confidence` or `inferred` flag that
renders identically to the entries around it is a field that rots — it would
be set once during backfill and never maintained. Where the archive and
recollection disagree, recollection wins, the date is decided once with Beck,
and the data records the answer rather than the argument. §4's third column
is documentation of the backfill, not a column in the type.

`since` is `YYYY-MM`, so **lexical string sort is chronological** and no date
parsing is needed anywhere in this feature. That is deliberate, and it is the
same instinct as `<Log>`'s "document order, reversed. No sort key."

An entry's end is implied by the next entry's `since`. There is no `until` —
a second date per entry is a second date to keep consistent.

---

## 4. The backfill

### `NOW_ENTRIES` — rendered after the constant `currently`

| `since` | `text` | Basis |
| --- | --- | --- |
| `2022-04` | gaining experience in programming, rock climbing, and DNA isolation | Archive `9d68caf`, live 2022-04-29 |
| `2022-06` | gaining experience in rock climbing, jiu jitsu, and partner dancing | Beck |
| `2023-01` | gaining experience in programming, partner acrobatics, and puzzle hunts | Beck. Archive `4735d4a` published this text 2024-04 — fifteen months late |
| `2023-06` | gaining experience in protein screening, bike commuting, and bay area geography | Beck |
| `2024-03` | gaining experience in many other ways to live, coliving, and group travel | Beck |
| `2024-08` | gaining experience in solo travel, the Chinese vegan scene, and humid summer days | Beck |
| `2024-11` | gaining experience in sign painting, partner acrobatics, and embodying my inner raccoon | Beck |
| `2025-11` | gaining experience in building festival art, relocating a group house, and kitten parenthood | Beck |
| `2026-04` | gaining experience in routine, quantum tag, and making pizza | Beck |
| `2026-08` | focused on home improvement and interactive art | Beck, current. Entered this repo at `627ffb3`; **confirmed Beck's own words, not v0 scaffold copy** |

### Three things the data says

**Items recur, and the recurrence is the point.** `partner acrobatics`
appears at `2023-01` and again at `2024-11`, with three entries between that
do not carry it. That is a real return, not a duplicate — **never dedupe**,
and never collapse two entries because they share an item. The entry is the
unit, and the page exists because Beck's attention moves and sometimes moves
back.

An earlier draft of this spec concluded from that principle that the page
should not mark recurrence at all. **That was inconsistent**: if the
recurrence is content, leaving the reader to spot it across ten rows buries
it. §6 is the correction — recurrence gets marked, by Beck's editorial
judgment rather than by string matching, which §6 shows would find three of
the nine real continuities and mislead about two more.

**The verb changed exactly once**, at the 2026 rebuild. Nine entries say
`gaining experience in`; one says `focused on`. Worth knowing before someone
decides the repetition is a bug and varies it.

**Nine changes in four years, unevenly spaced** — two months between
`2022-04` and `2022-06`, seventeen between `2024-11` and `2025-11`, four
between `2026-04` and `2026-08`. The page must not normalise that. A layout
that spaces rows evenly is fine; one that spaces them *proportionally to
elapsed time* would turn the 2025 quiet stretch into a design problem, and
it is not one — it is a year Beck was busy elsewhere. §9 is the maintenance
answer, not the layout.

---

## 5. The render: one list, newest first

An earlier draft of this section derived *snapshots* — it composed a row at
every date on which either of two lines changed, and dimmed whichever line
had not changed at that date. **All of that machinery existed to reconcile
two independent timelines.** With `open to …` out of scope there is one
timeline, an entry is a row, and the derivation collapses to a single
`.reverse()`.

Worth recording because the machinery was designed, argued for, and is now
gone: if a second tracked line is ever added, the snapshot design in this
spec's history is the answer, and it should be recovered rather than
reinvented.

### Ordering

Entries are authored chronologically in `lib/now.ts` and reversed at render,
following `<Log>`. **Reverse the array, never `flex-direction: column-reverse`**
— that leaves DOM order and visual order disagreeing, so a screen reader and
a sighted reader get different sequences and tab order follows neither.

Unlike `<Log>`, there is **no `?order=` toggle.** `<Log>` has one because an
essay's build history is genuinely readable in both directions; a now history
read oldest-first is just an outdated now. Add it if Beck asks, not before.

### Page structure

1. **Present.** Line 1 (`STUDENT_OF`) — the permanent frame that makes the
   line below it read as *now* — then `NOW_ENTRIES.at(-1)`, at hero weight.
   This is the page's subject, not the top row of a list.
2. **History.** `NOW_ENTRIES.slice(0, -1).reverse()`, each row its `since`
   and its text. The current entry does **not** repeat here.

Line 1 earns its place on a single-line page for the same reason it opens the
hero: without it, `currently gaining experience in kitten parenthood` is a
status update, and with it the page reads as one person's constant subject
sampled at ten moments. It is also the page's `h1` — see §11.F.

`/now` is static, generated from the data file at build time like everything
else. Metadata title `now · beck qing`, matching `/about`'s convention.

---

## 6. Threads — highlighting what continues

> **Proposed 2026-09-02, needs Beck.** The mechanism is designed; the thread
> assignments are editorial and only Beck can write them. Everything else in
> this spec ships without this section — build §1–§5 first if the thread list
> is not ready.

Beck's question: can the page highlight activities that repeat or continue?
It should, and the reason is already in §4 — recurrence is content, and a
page that leaves the reader to notice it has buried its own best material.

### Why this cannot be computed

The obvious implementation is string equality across entries. Run against the
real data it finds **three** matches in ten entries — `rock climbing`
(2022-04, 2022-06), `programming` (2022-04, 2023-01), and `partner acrobatics`
(2023-01, 2024-11) — and misses every continuity that a reader would actually
call one:

| Continuity | Entries | Exact match? |
| --- | --- | --- |
| `partner dancing` → `partner acrobatics` | 2022-06 → 2023-01, 2024-11 | no |
| `coliving` → `relocating a group house` → `home improvement` | 2024-03 → 2025-11 → 2026-08 | no |
| `sign painting` → `building festival art` → `interactive art` | 2024-11 → 2025-11 → 2026-08 | no |
| `DNA isolation` → `protein screening` | 2022-04 → 2023-06 | no |
| `group travel` → `solo travel` | 2024-03 → 2024-08 | no |
| `the Chinese vegan scene` → `making pizza` | 2024-08 → 2026-04 | no |

Worse than incomplete, it is **actively misleading**: it would mark `rock
climbing` across two adjacent months as a continuing thread while presenting
`partner dancing` → `partner acrobatics` as unrelated. That is the opposite
of how the page reads.

So threads are **Beck's editorial judgment**, recorded, not a property
derived from the text. This is the same call `lib/work.ts` makes about tags,
and the same reason `metaDescription()` never invents prose.

### The data: an annotation layer, not a decomposition

§2 argued `text` is one verbatim string and must not become an items array.
That still holds — threads do not decompose it, they **annotate substrings of
it**:

```ts
export type NowEntry = {
  since: string
  text: string
  /** Optional. Maps a substring of `text` to a thread id. */
  threads?: Record<string, string>
}
```

```ts
{ since: '2024-11',
  text: 'gaining experience in sign painting, partner acrobatics, and embodying my inner raccoon',
  threads: { 'sign painting': 'making', 'partner acrobatics': 'movement' } }
```

Three properties make this the right shape:

1. **`text` stays authoritative and verbatim.** It is still the thing that
   renders; threads only decide which slices of it get a marker.
2. **Annotation is partial by default.** Most items belong to no thread —
   `puzzle hunts`, `humid summer days`, `embodying my inner raccoon`,
   `kitten parenthood` are each themselves. An items array would have forced
   a decision about every item; this forces none.
3. **A missing key is invisible, not broken.** Adding a thread later is
   additive, and an entry with no `threads` renders exactly as it does today.

**The keys must match `text` exactly**, since rendering finds them by
substring. A build-time assertion that every key occurs in its own entry's
`text` is cheap and catches the one typo this design can produce.

### The interaction already exists on this site

Hovering a thread member lights up every other member of that thread, across
all ten rows. **This is `CategoryWord` / `useCollage`** from
`components/hero-icon-collage.tsx` — hover a word, and matching things
elsewhere on the page take a colour, coordinated through context. It is a
validated pattern ported from the archived 11ty site, and the now page should
reuse it rather than invent a second one.

Two rules come with it, from the archive's original and from
ARCHITECTURE's "Homepage icon collage":

- **Hover adds colour to matches. It does not dim non-matches.** The archive
  established this and the port kept it; a page that dims on hover would
  contradict the homepage two clicks away.
- **There is a resting state.** Threaded substrings carry a quiet marker at
  rest — a dotted underline in the muted foreground — or nobody discovers the
  interaction. Non-threaded text has no marker.

### One treatment, not two

Beck named two phenomena, *repeat* and *continuing*. **They get the same
treatment.** The distinction between a thread that runs through consecutive
entries and one that skips three is already visible in where the highlights
land against the dates beside them, and a second visual vocabulary would
encode information the reader can see. If a thread's shape is worth a
sentence, that sentence belongs in prose, not in a second underline style.

### Threads reach into the present

The present block (§5) participates. `interactive art` and `home improvement`
are the live ends of the `making` and `home` threads, so hovering them lights
up `2024-11` and `2024-03` respectively — which is the page making its
argument without a word of commentary: the current now is not a reset.

### What Beck owes this section

A thread id per item worth threading, for ~20 of the ~29 items. The candidate
set below is a **starting proposal to react to, not a decision** — the
groupings are guesses and at least one of them is probably wrong:

| Proposed id | Items |
| --- | --- |
| `movement` | rock climbing, jiu jitsu, partner dancing, partner acrobatics, bike commuting, quantum tag |
| `making` | sign painting, building festival art, interactive art |
| `home` | coliving, many other ways to live, relocating a group house, home improvement, routine |
| `travel` | bay area geography, group travel, solo travel |
| `lab` | DNA isolation, protein screening |
| `food` | the Chinese vegan scene, making pizza |

Open questions inside that: whether `programming` joins `making` or stands
alone (it appears twice, then vanishes for four years); whether `routine`
belongs to `home` at all; and whether six threads over ten entries is too
many to tell apart by colour — four would be safer, and merging `lab` into a
`science` thread with `programming` is the obvious consolidation.

---

## 7. Entry points

**Hero line 2 links to `/now`.** The whole line, not just the `currently`
prefix — line 1 already carries three hover-tinted `CategoryWord`s, and a
partial link inside line 2 makes one paragraph carry three link behaviors.
Underline on hover only; it must not compete with the `h1` above it.

**Line 3 does not link.** It is not tracked by this page (§1), so a link
from it would promise a history that does not exist.

**Nothing in the site header.** Decided by Beck. The proposed second entry
point is the footer's `<details>` disclosure, which exists for real
destinations that have not earned header space — `now` added to `MORE_LINKS`
in `components/site-footer.tsx`, a hand-curated array by design.

**But see §11.G.** That array is eight external profile links, and an internal
route among them may be a category error. Confirm before building it; the
hero line alone is a defensible answer.

---

## 8. Open gaps

**G1 — the 2025 hole. Closed 2026-09-02.** Filled by `2025-11` and `2026-04`,
so the longest remaining gap is the seventeen months from
`2024-11` to `2025-11` — long, but no longer empty on either side. Note that
`2026-04` → `2026-08` is only four months apart, the tightest pair in the
data; both are real and neither should be merged.

**G4 — threads.** §6 needs a thread id per item for roughly twenty of the
twenty-nine items, and its proposed groupings are guesses to react to. Also
open there: whether `programming` stands alone, whether `routine` belongs to
`home`, and whether six threads is more than colour can distinguish (four is
likely safer). **Needs Beck.** Nothing else in the spec waits on it.

**G2 — the second availability date. Void 2026-09-02.** The `open to …` line
is out of scope (§1, §10), so its dates are not this page's problem. Kept as a
closed row rather than deleted because the question was asked twice and the
answer is "the page does not track that line," not "we never found out."

**G1 and G2 closed, G4 open, G3 minor: the content is done.** Only G3 could
change a row, and only by removing one.

**G3 — the `2022-04` / `2022-06` adjacency.** Two months apart, sharing only
`rock climbing`. The April text is the archive's launch copy, so it was
written fresh rather than inherited, and is probably a real distinct state —
but if it was already stale on launch day, the April row should be dropped
and `2022-06` becomes the floor. **Worth one look from Beck.**

**Nothing before `2022-04`.** The archive's launch is the floor: everything
earlier would be recollection with no artifact behind it. The page is
stronger starting at "here is what the site said" than at "here is what I
think I was doing." Revisit only if Beck wants a specific era they remember
clearly.

---

## 9. Cadence

Two entries a year is the rate this page is designed for. Faster and it
becomes a status feed that reads as abandoned the moment it goes untended;
slower and it grows another 43-month hole like the one this backfill just
closed.

**January is already load-bearing** — `2023-01` is an entry, and Mystery Hunt
makes it a natural annual beat. Review the line each January, change it
whenever it is wrong in between. At that rate a six-month-old entry reads as
current, which is the whole reason not to promise a monthly cadence.

---

## 10. What not to build

| Temptation | Why not |
| --- | --- |
| An items array, tag chips, `/work?tags=` links per item | §2. The data does not decompose, and nothing reads an item |
| A `confidence` / `inferred` provenance flag | §3. Set once, never maintained, renders identically |
| An `until` date per entry | §3. Implied by the next entry's `since` |
| `?order=old-new` | §5. A now history read oldest-first is an outdated now |
| Tracking the hero's `open to …` line | §1. Out of scope, Beck 2026-09-02. It stays hardcoded in `app/page.tsx` |
| Re-deriving snapshots for a second line | §5. Deliberately removed. Recover the old design, don't reinvent it |
| Deduping recurring items | §4. `partner acrobatics` came back, and that is content |
| Computing threads by string equality | §6. Finds three of nine, and misleads about two |
| A second visual treatment for *repeat* vs *continuing* | §6. The dates already show the gap |
| A second tracked line, of any kind | §0. One exists. §5 says what to do if that ever changes |
| `/now` in the site header | §7. Beck's call |
| An RSS feed, a "last updated" badge, a nownownow.com backlink | Nobody asked. The page is ten rows |
| Spacing rows proportionally to elapsed time | §4. The 2025 quiet stretch is content, not a gap to dramatise |

---

## 11. Implementation notes

Written after auditing the spec against the tree, 2026-09-02. Each item below
is something a fresh session would otherwise have to invent or would silently
get wrong.

### A. Files touched

| File | Change |
| --- | --- |
| `lib/now.ts` | **new.** §2's types, §4's entries, `STUDENT_OF` |
| `app/now/page.tsx` | **new.** Server component, static. `metadata.title` `now · beck qing` |
| `app/page.tsx` | Hero line 2 renders from `lib/now.ts` and is wrapped in a `Link` to `/now` (§7). **Lines 1 and 3 keep their current literals** — line 1 because §11.C needs its category bindings anyway, line 3 because it is out of scope |
| `app/sitemap.ts` | **See B — easy to miss** |
| `components/site-footer.tsx` | One `MORE_LINKS` entry — **see G first** |

### B. `sitemap.ts` has a hardcoded `staticRoutes` array

`/`, `/work`, and `/about` are literals in `app/sitemap.ts`; only the work
routes are derived. **`/now` will not appear unless it is added by hand.**
`changeFrequency: 'monthly', priority: 0.6`, matching `/about`.

### C. `CategoryWord` cannot be reused on `/now`

`useCollage()` **throws** outside a `HeroWordScatter` provider, deliberately
(`components/hero-icon-collage.tsx:20`). Do not loosen that invariant, and do
not wrap `/now` in a `HeroWordScatter` just to borrow the component — there is
no `IconScatterField` on the page for the hover state to coordinate with, so
the provider would exist to satisfy a `useContext` and nothing else.

**`STUDENT_OF` renders twice, two ways**, which is why §2 gives it word +
category pairs:

- `app/page.tsx` maps it to `<CategoryWord category={category}>{word}</CategoryWord>`,
  keeping today's hero behaviour exactly.
- `app/now/page.tsx` maps it to plain text. On `/now` the words are the page's
  standing frame, not a deep link into a filtered gallery — the hero already
  owns that job.

One source of truth, two renderings. Do not duplicate the three words into
`app/now/page.tsx` as a literal.

### D. Do not apply `lowercase` to entry text

`headingStyles`' every level, and most `font-brand` chrome on this site,
carries a `lowercase` class. **`the Chinese vegan scene` renders as `the
chinese vegan scene` under it**, which silently breaks §2's verbatim rule at
the CSS layer where no assertion will catch it.

The hero's existing `<p>` is safe — it has no `lowercase` class, which is why
today's copy renders as authored. `/now` must make the same choice for both
the present block and every history row.

### E. Formatting `since` for display

Not specified anywhere above, so: **`2024-11` renders as `November 2024`.**

Do it with a twelve-element month-name array indexed by the parsed
`MM` — **not** `new Date('2024-11')`, which is parsed as UTC midnight and
renders as October in any timezone west of Greenwich. That is the same
class of bug §3's lexical-sort rule exists to avoid, and it is worth being
explicit because this is the one place a date leaves string-land.

### F. Page layout

Follow `/about`'s shape — eyebrow, then display type, then content:

- `headingStyles.eyebrow` reading `now`
- The page's only `h1` is **line 1**, `forever a student of art, science, and
  humanity`, set as display type. It is a nameplate, not a document title, so
  like the hero's `beck qing` and `/about`'s `Hi, I'm Beck.` it is **not**
  built from `headingStyles.h1` (see that file's own note on the two
  deliberate exemptions — this is a third).
- Under it, the current entry at hero size.
- Then history. A row's date is `h2`-level structurally; whether it
  renders as a heading or as a margin label is the implementer's call, and
  the only real constraint is D.

### G. The footer entry needs a decision first

`MORE_LINKS` is eight **external** profile links rendered as bare `<a href>`
elements. `/now` is an internal route, so dropping it in means either a full
page reload or branching the map on `href.startsWith('/')`.

More to the point it may be a category error: that disclosure is "everywhere
else Beck exists on the internet," not site navigation. **Beck should confirm**
whether `/now` belongs there at all — if not, the hero line is the only door,
which Beck may well be happy with. §7 currently assumes it belongs; this is
the one place in the spec where the audit disagrees with the design.

### H. Line 3 is not part of this

`open to roles in automation, biotech, and food` stays exactly as it is in
`app/page.tsx` — same literal, same markup, no import from `lib/now.ts`, no
row on `/now`. It is the one hero line this feature does not touch, and an
implementer who "finishes the job" by migrating it has exceeded the spec.

### I. Verification

`npx tsc --noEmit` and `npx next build` both clean, and the static page count
goes **up by exactly one**. Nothing in this feature generates routes
dynamically, so any other delta means something else changed.
