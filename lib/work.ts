/**
 * A single piece of work. Collections are pieces that contain other pieces,
 * so a collection and a standalone piece share the same shape and page layout.
 */
export type WorkPiece = {
  slug: string
  title: string
  year: string
  description: string
  /** Non-exclusive tags — an item can be art AND science AND writing at once. */
  tags: string[]
  /**
   * For text-forward pieces (poems, essays): a short excerpt or pull quote
   * shown in place of a blank image, like the writing card on the home page.
   * Poems keep their line breaks (rendered with whitespace-pre-line).
   */
  excerpt?: string
  /** A longer write-up, shown only on the item's own page. Flagged with an icon. */
  writeup?: string
  /**
   * Marks a piece as genuinely both — text-forward work that was written
   * around a specific image and still wants it shown, rather than being
   * purely a quote-only piece or a purely visual one. Opt-in per piece
   * (mostly science essays so far); doesn't follow automatically from tags.
   */
  hasImage?: boolean
}

/** A piece that holds other pieces. Rendered with a tilted deck behind it. */
export type WorkCollection = WorkPiece & { pieces: WorkPiece[] }

export type WorkItem = WorkPiece | WorkCollection

export function isCollection(item: WorkItem): item is WorkCollection {
  return Array.isArray((item as WorkCollection).pieces)
}

export function hasWriteup(item: WorkPiece): boolean {
  return Boolean(item.writeup)
}

/** Every top-level item gets its own page at /work/[slug]. */
export function workHref(item: WorkItem): string {
  return `/work/${item.slug}`
}

/** A piece inside a collection lives at /work/[collectionSlug]/[pieceSlug]. */
export function piecePath(collection: WorkCollection, piece: WorkPiece): string {
  return `/work/${collection.slug}/${piece.slug}`
}

/**
 * Text-forward pieces render as a quote-style preview card instead of an image
 * tile. Collections always show their deck, so they opt out.
 */
export function isTextForward(item: WorkItem): boolean {
  if (isCollection(item)) return false
  return item.tags.includes('poem') || item.tags.includes('essay')
}

/**
 * A piece flagged with `hasImage`, checked ahead of isTextForward — a
 * text-forward piece that also carries an image renders as the hybrid
 * card, not the quote-only one.
 */
export function isHybrid(item: WorkItem): boolean {
  return !isCollection(item) && Boolean(item.hasImage)
}

/** There are exactly three disciplines. They overlap freely — nothing is exclusive. */
export const DISCIPLINES = ['art', 'writing', 'science'] as const
export type Discipline = (typeof DISCIPLINES)[number]

export type Facet = { name: string; tags: readonly string[] }

/**
 * Category filters that only make sense inside one discipline. These stay
 * hidden until their discipline is selected, which keeps the panel quiet.
 */
export const DISCIPLINE_FACETS: Record<Discipline, Facet> = {
  art: { name: 'medium', tags: ['watercolor', 'oil', 'digital', 'ink'] },
  writing: { name: 'form', tags: ['poem', 'essay', 'blog'] },
  science: {
    name: 'field',
    tags: ['biology', 'neuroscience', 'material science', 'dataviz'],
  },
}

/** Categories that apply to every piece regardless of discipline. */
export const UNIVERSAL_FACETS: Facet[] = [
  { name: 'theme', tags: ['nature', 'color', 'the body', 'memory', 'language', 'food'] },
]

export const ALL_TAGS: string[] = [
  ...DISCIPLINES,
  ...Object.values(DISCIPLINE_FACETS).flatMap((f) => f.tags),
  ...UNIVERSAL_FACETS.flatMap((f) => f.tags),
]

/** Each discipline gets one of the brand tones, used to tint cards and chips. */
export const DISCIPLINE_TONE: Record<Discipline, string> = {
  art: 'var(--art)',
  writing: 'var(--writing)',
  science: 'var(--science)',
}

export function isDiscipline(tag: string): tag is Discipline {
  return (DISCIPLINES as readonly string[]).includes(tag)
}

/** The first discipline tag an item carries — drives its accent tone. */
export function primaryDiscipline(item: WorkItem): Discipline | undefined {
  return DISCIPLINES.find((d) => item.tags.includes(d))
}

/** An art piece's medium (oil, ink, watercolor, digital), if it has one. */
export function mediumFor(item: WorkItem): string | undefined {
  return DISCIPLINE_FACETS.art.tags.find((tag) => item.tags.includes(tag))
}

/** The accent tone (CSS value) for an item, based on its primary discipline. */
export function toneFor(item: WorkItem): string {
  const d = primaryDiscipline(item)
  return d ? DISCIPLINE_TONE[d] : 'var(--muted-foreground)'
}

/** The tone for a single tag chip — disciplines are colored, other facets stay neutral. */
export function tagTone(tag: string): string | null {
  return isDiscipline(tag) ? DISCIPLINE_TONE[tag] : null
}

/**
 * Every tag an item can be found by. A collection inherits its children's
 * tags, so filtering for "watercolor" surfaces the collection holding one.
 */
export function itemTags(item: WorkItem): Set<string> {
  const tags = new Set(item.tags)
  if (isCollection(item)) {
    for (const p of item.pieces) for (const t of p.tags) tags.add(t)
  }
  return tags
}

export const WORK: WorkItem[] = [
  {
    slug: 'lunar-studies',
    title: 'Lunar Studies',
    year: '2024',
    description:
      'An ongoing series about keeping the moon\u2019s hours — the same subject painted until it stopped being a subject.',
    tags: ['art', 'nature', 'color'],
    writeup:
      'I started painting the moon because it was the only thing reliably awake when I was. What began as a warm-up exercise turned into four years of studies, and somewhere in the middle of it the moon stopped being a subject and became a kind of clock.\n\nThe series moves between watercolor and ink depending on how much patience I have. Watercolor for the nights I want to be surprised; ink for the nights I want to be certain. Nothing here is finished so much as put down.',
    pieces: [
      {
        slug: 'moon-hare',
        title: 'Moon Hare',
        year: '2024',
        description:
          'A folklore hare curled into the crescent — the mark I keep returning to, painted in watercolor.',
        tags: ['art', 'watercolor', 'nature'],
        writeup:
          'The hare in the moon shows up in Chinese, Aztec, and Buddhist folklore independently, which feels less like coincidence and more like a shared squint at the same shadows.\n\nI have painted this hare eleven times. This is the version where I finally stopped trying to make the anatomy correct and let it curl into the crescent like it belonged there.',
      },
      {
        slug: 'waning',
        title: 'Waning',
        year: '2024',
        description: 'Eight ink washes tracking one lunation, painted the same hour each night.',
        tags: ['art', 'ink'],
      },
      {
        slug: 'blue-hour',
        title: 'Blue Hour',
        year: '2023',
        description:
          'A watercolor landscape chasing the ten cool minutes after sunset when the whole world agrees on one color.',
        tags: ['art', 'watercolor', 'nature', 'color'],
        writeup:
          'There are about ten minutes after sunset when everything outside agrees on a single color. Photographs flatten it. Watercolor is the only medium I have found that can hold that much blue without going muddy.',
      },
      {
        slug: 'harvest-moon',
        title: 'Harvest Moon',
        year: '2023',
        description: 'An oil study of the low orange moon that sits in the trees every September.',
        tags: ['art', 'oil', 'nature', 'color'],
      },
      {
        slug: 'eclipse-study',
        title: 'Eclipse Study',
        year: '2022',
        description: 'Ink and gouache, painted from memory the night after a lunar eclipse.',
        tags: ['art', 'ink', 'color'],
      },
    ],
  },
  {
    slug: 'the-body-electric',
    title: 'The Body Electric',
    year: '2024',
    description:
      'Anatomy drawn like landscape — a set of digital pieces trying to make the body feel less clinical.',
    tags: ['art', 'science', 'digital', 'the body', 'biology'],
    writeup:
      'Medical illustration taught me precision and took away tenderness. This series is my attempt to get the tenderness back without giving up the precision.\n\nEvery piece here is anatomically defensible and emotionally editorialized. The heart really does have that many vessels; they simply do not usually look like roots.',
    pieces: [
      {
        slug: 'the-weight-we-carry',
        title: 'The Weight We Carry',
        year: '2024',
        description:
          'A digital portrait of an anatomical heart wrapped in roots. Equal parts anatomy study and love letter.',
        tags: ['art', 'digital', 'science', 'biology', 'the body'],
        writeup:
          'I drew this the week a friend got a diagnosis. The vessels are accurate to a textbook plate; the roots are not accurate to anything except how it felt to sit in that waiting room.\n\nIt is the piece people write to me about most, which tells me the roots were the accurate part after all.',
      },
      {
        slug: 'interactive-heart',
        title: 'Interactive Heart',
        year: '2024',
        description:
          'A WebGL prototype that lets you turn a beating anatomical heart in the browser, built to make anatomy feel less clinical.',
        tags: ['art', 'digital', 'science', 'biology', 'the body'],
      },
      {
        slug: 'neuron-forest',
        title: 'Neuron Forest',
        year: '2023',
        description:
          'Cortical neurons rendered as an old-growth canopy, traced from published reconstructions.',
        tags: ['art', 'digital', 'science', 'neuroscience', 'nature'],
      },
    ],
  },
  {
    slug: 'vegan-field-notes',
    title: 'Vegan Field Notes',
    year: '2024',
    description:
      'An ongoing blog of recipes and restaurant reviews, written for the curious rather than the already-converted.',
    tags: ['writing', 'blog', 'food'],
    writeup:
      'I write this for the person who is curious but suspicious — the one who has been handed a bad lentil loaf and drawn reasonable conclusions.\n\nSo the posts lean on chemistry rather than virtue. If I can explain why the substitution works, you can improvise, and improvising is the whole point.',
    pieces: [
      {
        slug: 'allergy-friendly-baking',
        title: 'Allergy-Friendly Baking as Material Science',
        year: '2024',
        description:
          'On treating a restricted pantry like a limited palette — the chemistry of substitutions, and why constraints make better bakers.',
        tags: ['writing', 'essay', 'science', 'material science', 'food'],
        excerpt:
          'A restricted pantry is only a limited palette. And constraints, it turns out, quietly make better bakers of us.',
        writeup:
          'Take out eggs, butter, and wheat and you have removed structure, tenderness, and elasticity in one move. What is left is a genuine engineering problem, and engineering problems are more fun than recipes.\n\nAquafaba does not replace egg white because it is similar. It works because the same globular proteins unfold and trap air at a similar pH. Once you know that, you stop following substitution charts and start reasoning.',
      },
      {
        slug: 'croissant-lamination',
        title: 'Croissant Lamination Study',
        year: '2022',
        description:
          'A photographed, annotated study of butter, gluten, and steam — laminated dough as a lesson in patient material science.',
        tags: ['writing', 'blog', 'science', 'material science', 'food'],
      },
      {
        slug: 'salt-and-structure',
        title: 'Salt & Structure',
        year: '2022',
        description:
          'Borrowing color theory from the palette and bringing it to the plate — how contrast works in a bowl.',
        tags: ['writing', 'blog', 'art', 'food', 'color'],
      },
      {
        slug: 'winter-market-notes',
        title: 'Winter Market Notes',
        year: '2024',
        description: 'Six weeks of shopping only the winter market, and what it did to my cooking.',
        tags: ['writing', 'blog', 'food', 'memory'],
      },
    ],
  },
  {
    slug: 'circadian-light',
    title: 'Circadian Light and the Working Artist',
    year: '2022',
    description:
      'A 120-day self-experiment tracking how light exposure across a nocturnal schedule affects focus, mood, and output.',
    tags: ['science', 'neuroscience', 'dataviz', 'the body'],
    writeup:
      'I am a poor sleeper and a worse morning person, so I stopped arguing with it and started measuring it instead. For 120 days I logged lux at my desk, hours slept, mood, and pages finished.\n\nThe headline finding is unglamorous: total light mattered less than when the light arrived. It is a sample size of one and proves nothing about you. It changed how I work entirely.',
    pieces: [
      {
        slug: 'light-log',
        title: 'The Light Log',
        year: '2022',
        description: '120 days of desk-level lux readings, plotted against hours actually slept.',
        tags: ['science', 'dataviz'],
      },
      {
        slug: 'mood-and-lux',
        title: 'Mood & Lux',
        year: '2022',
        description:
          'A small-multiples chart pairing self-reported mood with morning light exposure.',
        tags: ['science', 'dataviz', 'neuroscience'],
      },
      {
        slug: 'the-nocturnal-studio',
        title: 'The Nocturnal Studio',
        year: '2022',
        description:
          'The essay that came out of the data — on making peace with working while the world sleeps.',
        tags: ['writing', 'essay', 'science', 'memory'],
        excerpt:
          'I stopped trying to become a morning person and started asking what the night was actually giving me.',
      },
    ],
  },
  {
    slug: 'data-garden',
    title: 'Data Garden',
    year: '2023',
    description:
      'A generative series where a dataset grows as a plant — each variable a stem, each record a leaf.',
    tags: ['science', 'dataviz', 'art', 'digital', 'nature'],
    writeup:
      'Bar charts are honest and forgettable. I wanted to know whether a chart could be remembered the way a plant is remembered — by silhouette.\n\nEach piece binds one dataset to a growth model: variables become stems, records become leaves, missing values become the gaps where a leaf did not form. They are less precise than a bar chart and considerably harder to forget.',
    pieces: [
      {
        slug: 'seedling-set',
        title: 'Seedling Set',
        year: '2023',
        description: 'Nine small datasets grown as seedlings, printed as a grid.',
        tags: ['science', 'dataviz', 'art', 'digital', 'nature'],
      },
      {
        slug: 'canopy',
        title: 'Canopy',
        year: '2023',
        description: 'A decade of city temperature records rendered as a single spreading canopy.',
        tags: ['science', 'dataviz', 'art', 'digital', 'nature'],
      },
      {
        slug: 'root-system',
        title: 'Root System',
        year: '2023',
        description: 'The same dataset inverted — what a chart looks like grown downward.',
        tags: ['science', 'dataviz', 'digital'],
      },
    ],
  },
  {
    slug: 'color-blind-palettes',
    title: 'Designing Color-Blind-Friendly Palettes',
    year: '2024',
    description:
      'A studio talk on building one brand palette that subdivides into accessible, colorblind-safe schemes for scientific charts.',
    tags: ['art', 'digital', 'science', 'dataviz', 'color'],
    writeup:
      'Roughly one in twelve men cannot reliably separate red from green, and an enormous amount of scientific charting is red versus green.\n\nThe talk works through building a single palette that survives deuteranopia simulation without looking medicinal, then splitting it into sequential and diverging scales. The trick is to never carry meaning on hue alone — let lightness do the work and let hue be the decoration.',
  },
  {
    slug: 'language-and-perception',
    title: 'Language and the Perception of Color',
    year: '2023',
    description:
      'A cross-linguistic review of how the words a culture has for color shape the way its speakers see and remember it.',
    tags: ['science', 'neuroscience', 'writing', 'essay', 'language', 'color'],
    hasImage: true,
    excerpt:
      'Give a culture a word for a color, and its speakers will start to see that color everywhere — including in memory.',
    writeup:
      'Russian speakers distinguish light blue and dark blue as separate basic colors, and they sort those chips faster than English speakers do. Homer called the sea wine-dark. Neither fact means anyone sees different wavelengths.\n\nWhat changes is the categorizing — where the boundary falls, and how the memory files it afterward. Language does not paint the world. It decides which edges are worth noticing.',
  },
  {
    slug: 'on-being-many-things',
    title: 'On Being Many Things at Once',
    year: '2024',
    description:
      'An essay about treating my interests like rooms with the doors shut — and what happened when I let the light move between them.',
    tags: ['writing', 'essay', 'memory'],
    excerpt:
      'I had been treating my interests like rooms with the doors shut. Then, one winter, I let the light move between them.',
    writeup:
      'For most of my twenties I kept the painting and the pipetting in separate rooms, convinced that admitting to one would disqualify me from the other.\n\nWhat actually happened, when I opened the doors, was that the color theory made me better at figures and the lab made me more patient at the easel. The rooms were never the problem. The doors were.',
  },
  {
    slug: 'the-color-of-a-shadow',
    title: 'The Color of a Shadow',
    year: '2024',
    description:
      'Why my favorite color is a warm indigo, and what learning to paint shadows taught me about paying attention.',
    tags: ['writing', 'essay', 'art', 'color'],
    excerpt:
      'A shadow is never simply gray. Learn to find the indigo pooled inside it, and you have learned, quietly, how to pay attention.',
    writeup:
      'The first useful thing anyone taught me about painting was that shadows are not gray. They are the complement of whatever light is falling, cooled and darkened.\n\nOnce you have seen the indigo in a shadow on snow, you cannot unsee it. That is most of what technique is: a permanent upgrade to your attention, disguised as a rule about paint.',
  },
  {
    slug: 'night-owl',
    title: 'night owl',
    year: '2023',
    description:
      'A short poem about keeping the moon\u2019s hours, and the light that only arrives once everything else has gone quiet.',
    tags: ['writing', 'poem', 'memory'],
    excerpt:
      'the house exhales.\nthe moon takes the lamp\u2019s place\nat my desk,\nand only now do I begin.',
  },
  {
    slug: 'pigment',
    title: 'pigment',
    year: '2023',
    description:
      'A poem about reaching for indigo in the shadows — because nothing I have loved was ever the absence of a color.',
    tags: ['writing', 'poem', 'art', 'color'],
    excerpt:
      'I reach for indigo\nwhere the shadow pools —\nnothing I have loved\nwas ever the absence of a color.',
  },
  {
    slug: 'interdisciplinary',
    title: 'interdisciplinary',
    year: '2022',
    description:
      'A three-line poem for anyone who has been asked to pick a lane. The river does not apologize for the sea.',
    tags: ['writing', 'poem', 'memory'],
    excerpt: 'they asked me to pick a lane.\nthe river, on its way to the sea,\ndid not apologize.',
  },
  {
    slug: 'living-in-the-world',
    title: 'Notes on Living in the World',
    year: '2023',
    description:
      'Small observations gathered over a difficult year — on cities, on strangers, on the strange grace of ordinary Tuesdays.',
    tags: ['writing', 'essay', 'memory'],
    excerpt:
      'There is a strange grace to an ordinary Tuesday — if you are paying the right kind of attention to it.',
  },
  {
    slug: 'a-quiet-argument-for-wonder',
    title: 'A Quiet Argument for Wonder',
    year: '2023',
    description:
      'Curiosity is not a childish thing to grow out of. It might be the most serious commitment an adult can make.',
    tags: ['writing', 'essay', 'science'],
    hasImage: true,
    excerpt:
      'Curiosity is not a childish thing to grow out of. It may be the most serious commitment an adult can make.',
    writeup:
      'We treat curiosity as a childhood trait, something to be outgrown along with the dinosaur phase. But sustained curiosity is expensive: it costs time, it costs the comfort of already knowing, and it costs the willingness to look foolish while learning.\n\nWhich is exactly why it reads as a serious adult commitment rather than a childish one.',
  },
  {
    slug: 'lamplight',
    title: 'Lamplight',
    year: '2023',
    description:
      'A quiet oil study of the fiddle-leaf fig that has followed me between apartments, lit by a single lamp.',
    tags: ['art', 'oil', 'nature'],
    writeup:
      'This fig has survived four apartments and one genuinely unforgivable winter. Painting it under a single lamp turned out to be an exercise in restraint — one light source, almost no color, all of the drawing carried by edges.',
  },
  {
    slug: 'paper-anatomy',
    title: 'Paper Anatomy',
    year: '2022',
    description:
      'Ink studies of hands and wrists, drawn from life in a life-drawing class I had no business being good at.',
    tags: ['art', 'ink', 'the body'],
  },
  {
    slug: 'the-language-of-recipes',
    title: 'The Language of Recipes',
    year: '2024',
    description:
      'On the strange imperative grammar of recipes, and what it assumes you already know how to do.',
    tags: ['writing', 'essay', 'language', 'food'],
    excerpt:
      'A recipe is written entirely in commands, and every command hides an assumption about what you already know.',
  },
  {
    slug: 'pigment-chemistry',
    title: 'A Short History of Ultramarine',
    year: '2023',
    description:
      'How the most expensive pigment in Europe went from ground lapis to a synthetic anyone can buy for a dollar.',
    tags: ['science', 'material science', 'color'],
    writeup:
      'For centuries ultramarine came from lapis lazuli hauled out of one mountain range in Afghanistan, which made it cost more than gold and turned it into a way of signaling how much a patron loved you.\n\nIn 1826 a French chemist won a prize for synthesizing it. The color did not change. Everything about who was allowed to use it did.',
  },
]

/**
 * How selected tags combine. Shared with the little venn toggle:
 * and = carry every tag, or = carry any tag, not = carry none of them.
 */
export type FilterMode = 'and' | 'or' | 'not'

export const FILTER_MODES: FilterMode[] = ['and', 'or', 'not']

export const MODE_LABEL: Record<FilterMode, string> = {
  and: 'match all selected tags',
  or: 'match any selected tag',
  not: 'exclude selected tags',
}

export function nextMode(m: FilterMode): FilterMode {
  return m === 'and' ? 'or' : m === 'or' ? 'not' : 'and'
}

/** Tag combination (and/or/not) plus a free-text search over title, description, and tags. */
export function filterWork(
  items: WorkItem[],
  { query, tags, mode }: { query: string; tags: string[]; mode: FilterMode },
): WorkItem[] {
  const q = query.trim().toLowerCase()
  return items.filter((item) => {
    if (tags.length > 0) {
      const owned = itemTags(item)
      const has = (t: string) => owned.has(t)
      const ok = mode === 'and' ? tags.every(has) : mode === 'or' ? tags.some(has) : !tags.some(has)
      if (!ok) return false
    }
    if (!q) return true
    // Collections are searchable by their children's titles too.
    const children = isCollection(item)
      ? item.pieces.flatMap((p) => [p.title, p.description])
      : []
    const haystack = [item.title, item.description, ...itemTags(item), ...children]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function getWorkItem(slug: string): WorkItem | undefined {
  return WORK.find((item) => item.slug === slug)
}

/** Resolve a piece inside a collection, with its index for prev/next links. */
export function getCollectionPiece(
  slug: string,
  pieceSlug: string,
): { collection: WorkCollection; piece: WorkPiece; index: number } | undefined {
  const item = getWorkItem(slug)
  if (!item || !isCollection(item)) return undefined
  const index = item.pieces.findIndex((p) => p.slug === pieceSlug)
  if (index === -1) return undefined
  return { collection: item, piece: item.pieces[index], index }
}
