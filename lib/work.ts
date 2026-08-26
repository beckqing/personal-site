import { SAMPLE_WORK } from './work.sample'

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
  /** A short pull-quote (1-3 lines) for compact contexts, like a poem's tile inside a collection grid — the full `excerpt` there would be too much. Falls back to `excerpt` (or `description`) where unset. */
  preview?: string
  /** A longer write-up, shown only on the item's own page. Flagged with an icon. */
  writeup?: string
  /** Path to a real image (e.g. '/art/...'). Falls back to the tinted placeholder when unset. */
  image?: string
  /** The real image's aspect ratio (e.g. '1/1', '4/5'), so it renders uncropped instead of forced into a card's default shape. */
  imageAspect?: string
  /** A small, heavily compressed stand-in for `image` — used where the image is barely visible (e.g. a collection stack's back cards), so full quality isn't worth the bytes. */
  thumb?: string
  /**
   * Marks a piece as genuinely both — text-forward work that was written
   * around a specific image and still wants it shown, rather than being
   * purely a quote-only piece or a purely visual one. Opt-in per piece
   * (mostly science essays so far); doesn't follow automatically from tags.
   */
  hasImage?: boolean
}

/** A piece that holds other pieces. Rendered with a tilted deck behind it. */
export type WorkCollection = WorkPiece & {
  pieces: WorkPiece[]
  /**
   * Override for the collection stack's blank 4th card (a CSS color) — the
   * default neutral gray doesn't fit every collection equally well (e.g. an
   * ink-on-paper sketchbook wants something closer to actual paper, not a
   * generic gray). Unset falls back to the default.
   */
  stackAccent?: string
  /**
   * Hand-picked slugs for the stack's front/2nd/3rd cards (1-3 entries) —
   * e.g. the three you'd actually want someone to see in a gallery preview,
   * rather than whichever three happen to come first. Unset falls back to
   * the collection's first three pieces (first three with a real `image`
   * for the image-stack case).
   */
  stackPieces?: string[]
}

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
 * Whether an item is fundamentally textual — a text-forward piece itself,
 * or a collection made entirely of them (e.g. a chapbook). Used to swap a
 * "missing image" watermark for a quote mark on placeholder art, since a
 * poem was never going to have an image in the first place.
 */
export function isTextOnly(item: WorkItem): boolean {
  if (isCollection(item)) return item.pieces.length > 0 && item.pieces.every(isTextForward)
  return isTextForward(item)
}

/**
 * A piece flagged with `hasImage`, checked ahead of isTextForward — a
 * text-forward piece that also carries an image renders as the hybrid
 * card, not the quote-only one.
 */
export function isHybrid(item: WorkItem): boolean {
  return !isCollection(item) && Boolean(item.hasImage)
}

/**
 * A collection made entirely of poems/essays — a chapbook. These read like
 * a little book rather than an image gallery: the collection page becomes a
 * table of contents, and each piece opens as a single page you page through,
 * instead of the usual image-grid treatment.
 */
export function isChapbook(item: WorkItem): boolean {
  return isCollection(item) && isTextOnly(item)
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

/** A collection whose pieces don't have real titles/descriptions yet. */
function placeholderPieces(count: number, year: string): WorkPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, '0')
    return {
      slug: n,
      title: n,
      year,
      description: 'Title and description coming soon.',
      tags: ['art'],
    }
  })
}

const REAL_WORK: WorkItem[] = [
  {
    slug: 'hthtpw',
    title: 'How to Help the Planet Week',
    year: '2020',
    description: 'A five-day series on how to help the planet, posted (very) late, one at a time.',
    tags: ['art'],
    image: '/art/hthtpw/01.jpg',
    imageAspect: '1/1',
    stackAccent: '#636b5b',
    pieces: [
      {
        slug: '01-mama-earth',
        title: 'Mama Earth',
        year: '2020',
        description: 'Our Beautiful Planet.',
        tags: ['art'],
        writeup:
          "While I was brainstorming what I would do for today, it occurred to me that humans anthropomorphize things to make them more relatable. And while that's expected, doesn't that show a flaw in how we decide to assign care? Not all things that are worth caring about are human, and that's ok.",
        image: '/art/hthtpw/01.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '02-tiny-tracks',
        title: 'Tiny Tracks',
        year: '2020',
        description: 'How to lessen your carbon footprint — twelve small ways to shrink it, one per toe.',
        tags: ['art'],
        writeup:
          'Ways to shrink your carbon footprint:\n\n1. Adjust your thermostat to suit the temperature outside (cooler in the winter, warmer in the summer).\n2. Drive less — carpool, take public transportation, bike, or walk when able.\n3. Switch out incandescent light bulbs; LEDs are more efficient.\n4. Eat less beef, which emits almost 4x the amount of CO2 as chicken.\n5. Wash your clothes cold.\n6. Bring snacks (and lunch!) in reusable containers instead of plastic bags.\n7. Cloth towels instead of paper.\n8. Refillable water bottles instead of single use — recycle the ones you do use.\n9. Fly less; if you do fly, go economy class and offset your emissions.\n10. Eat local.\n11. Unsubscribe from junk mail and sign up for electronic bills.\n12. Buy second hand clothes, and only when you need to.',
        image: '/art/hthtpw/02.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '03-creature-love',
        title: 'Creature-Love',
        year: '2020',
        description: 'Why are all creatures valid and important?',
        tags: ['art'],
        writeup:
          "Building off of the theme of our need to relate in order to qualify something as important, we come to the existence of charismatic megafauna — animals that have captured the hearts of the public, often through positive media portraying them.\n\nWhile these creatures deserve respect, they are not the only ones. Here, I have highlighted some invertebrates that go overlooked in most people's understanding of conservation.\n\nMolluscs like mussels and clams filter water. Native bees and wasps pollinate plants much better than honeybees (which are, in the USA, an invasive species). Lacewings, like ladybugs, eat aphids, which in turn eat plants, including those in your garden. Earthworms aerate the soil and restore nutrients to it.\n\nCreatures big and small are important to the biodiversity of the world, which is what keeps ecosystems healthy.",
        image: '/art/hthtpw/03.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '04-many-reasons-one-goal',
        title: 'Many Reasons, One Goal',
        year: '2020',
        description:
          'Four reasons to care about the planet that don\'t hinge on believing in "global warming" specifically — for your children, for fresh water, for the plants, for the oceans.',
        tags: ['art'],
        writeup:
          'While there are many reasons to care about the planet, such as a general desire for sustainable living, I thought I\'d address some that don\'t rely on a belief in the problem of "global warming", which is better termed climate change, since there are many other components.\n\nFor your children — even if you don\'t think the panic about the climate is warranted, at least think about how we are taking resources from the planet at an unsustainable rate, leaving less and less for future generations.\n\nFor fresh water — fresh water is important to most all life, and definitely all human life. While the water cycle exists and there are filtration systems (both natural and human-made), these cannot keep up with the pollution and water waste that is typical in a given US household.\n\nFor the plants — more and more trees are being cut down to make farmland (mostly pressured by animal agriculture). They are the basis of all multicellular life; we need them to live, they don\'t need us. The crops we plant in their place will never contribute to air quality as much as trees could.\n\nFor the oceans — the oceans are becoming more acidic. The CO2 in the atmosphere, along with other greenhouse gasses, directly contributes to this trend, which has been documented for years and already affects wildlife.\n\nI really don\'t know why it took me so long to post this one. It\'s been complete for a month and a half.',
        image: '/art/hthtpw/04.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '05-stick-together',
        title: 'Stick Together',
        year: '2020',
        description:
          "On togetherness — a theme this work doesn't come by naturally, since isolation is usually what comes through instead.",
        tags: ['art'],
        writeup:
          "It took me a long time to get around to completing this series. In many of my works, I convey isolation, and so I think it's difficult for me to think of togetherness. But it is true that we need each other, as seen even more starkly in this time of social distancing.\n\nWe have to remember that the influence is in our numbers — what would happen if everyone picked up five pieces of trash? Or if even half the world picked up ten? With so many people on this planet, we have the means. There's enough food and water for us as it is, but we need to work towards more efficient, sustainable, and equitable methods of distribution.\n\nThere is work to be done, and it must be done together.",
        image: '/art/hthtpw/05.jpg',
        imageAspect: '1/1',
      },
    ],
  },
  {
    slug: 'april-colors-19',
    title: "April Colors '19",
    year: '2019',
    description: 'A month of color-study prompts, painted one a day.',
    tags: ['art', 'color'],
    image: '/art/april-colors-19/01.jpg',
    imageAspect: '1/1',
    stackAccent: '#682f29',
    stackPieces: ['10-fire-protection', '13-grounding-hopes', '26-aphrodite'],
    pieces: [
      { day: '01', title: 'Identifying Vice', prompt: 'ghost' },
      { day: '02', title: 'Deceased Gems', prompt: 'prettiest insect' },
      { day: '03', title: 'Cancer', prompt: 'complementary colors' },
      { day: '04', title: 'Genesis 3-14', prompt: 'not enough legs' },
      { day: '05', title: 'Mistletoe', prompt: 'houseplant' },
      { day: '06', title: 'Suffocating', prompt: 'atmosphere' },
      { day: '07', title: 'The World Is a Beautiful Place', prompt: 'analogous colors' },
      { day: '08', title: 'Complacency', prompt: 'a fat bird' },
      { day: '09', title: '[star]dust', prompt: 'no blending' },
      { day: '10', title: 'Fire Protection', prompt: 'earth tones' },
      { day: '11', title: 'Poison-Wild', prompt: 'eleven of something' },
      { day: '12', title: 'False Mercy', prompt: 'sunset colors' },
      { day: '13', title: 'Grounding Hopes', prompt: 'mantis shrimp' },
      { day: '14', title: 'Active Defense', prompt: 'dragon' },
      { day: '15', title: 'C. patiens', prompt: 'invent a plant' },
      { day: '16', title: 'Armored Intimacy', prompt: 'study an object' },
      { day: '17', title: 'Leo Tu', prompt: 'split complementary' },
      { day: '18', title: 'Psilocybe', prompt: 'wrong colors' },
      { day: '19', title: 'Temper', prompt: 'too many legs' },
      { day: '20', title: "Don't Listen", prompt: 'color pick' },
      { day: '21', title: 'Living Stone', prompt: 'lithops' },
      { day: '22', title: 'Slick Temptation', prompt: 'something oily' },
      { day: '23', title: 'Fertile', prompt: 'triad' },
      { day: '24', title: 'en d o c ate', prompt: 'geometric' },
      { day: '25', title: 'Caduceus', prompt: 'something fuzzy' },
      { day: '26', title: 'Aphrodite', prompt: 'a color you hate' },
      { day: '27', title: 'The Story of Humankind', prompt: 'tell a story' },
      { day: '28', title: 'The Minister of Red', prompt: 'mixed media' },
      { day: '29', title: 'Landscape of Sisyphus', prompt: 'landscape' },
      { day: '30', title: 'Ornamental Diversity', prompt: 'ornamental' },
    ].map(({ day, title, prompt }) => ({
      slug: `${day}-${title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}`,
      title,
      year: '2019',
      description: `Day ${day} of April Colors '19 — prompt: "${prompt}."`,
      tags: ['art'],
      image: `/art/april-colors-19/${day}.jpg`,
      imageAspect: '1/1',
    })),
  },
  {
    slug: 'inktober-17',
    title: "Inktober '17",
    year: '2017',
    description:
      "31 ink drawings for Inktober, finished seven and a half months late — a confidence exercise as much as a daily prompt.",
    tags: ['art', 'ink'],
    stackAccent: '#ffffff',
    writeup:
      "Seven and a half months late, I have completed Inktober. What an accomplishment.\n\nTruly though, it's been a good exercise, even if not as a daily drawing prompt. I have used it as a confidence exercise. If a design was drafted, it was only done in thumbnail form (with ink), and once the design was begun, it was completed completely in ink (with the exception of 4, 7, and 14, which were all redone).",
    image: '/art/inktober-17/01.jpg',
    imageAspect: '1/1',
    pieces: [
      { day: '01', title: 'Swift', line: 'This little chimney swift is not so swift anymore.' },
      { day: '02', title: 'Divided', line: "They didn't realize how divided their worlds were." },
      { day: '03', title: 'Poison', line: "The worst poison administered is that from one's own mind." },
      { day: '04', title: 'Underwater', line: 'Underwater, losing air and losing self.' },
      { day: '05', title: 'Long', line: 'A serpentine grace easily encircles the heart.' },
      { day: '06', title: 'Sword', line: 'Killing two with one sword.' },
      { day: '07', title: 'Shy', line: 'He keeps his heart close.' },
      {
        day: '08',
        title: 'Crooked',
        line: "Legend has it that guarding something rather valuable lead to the Siamese cat's crooked tail.",
      },
      {
        day: '09',
        title: 'Screech',
        line: 'He cries out and his body resonates with the desperate, primal sound.',
      },
      {
        day: '10',
        title: 'Gigantic',
        line:
          "The path he's taken in fear is traced by the serpent of memory, ready to bite lest he pause, and seemingly infinite.",
      },
      { day: '11', title: 'Run', line: 'The predator with the heart of its prey.' },
      {
        day: '12',
        title: 'Shattered',
        line: "The most dangerous injury is that inflicted upon the framework of one's being: one's moral confidence.",
      },
      { day: '13', title: 'Teeming', line: 'Teeming with life but thoroughly dead, only animated by others.' },
      { day: '14', title: 'Fierce', line: 'He never felt like himself when he stood his ground.' },
      { day: '15', title: 'Mysterious', line: 'Is the disappearance of a conflicted soul all that mysterious?' },
      {
        day: '16',
        title: 'Fat',
        line: 'Although cold weather may be kept at bay, fat offers no protection from cold hearts.',
      },
      {
        day: '17',
        title: 'Graceful',
        line: 'Intertwined in an aerial duet before their differences force them apart.',
      },
      {
        day: '18',
        title: 'Filthy',
        line: 'Is this filth surrounding him constantly sufficient punishment for sins against the fragile heart?',
      },
      { day: '19', title: 'Cloud', line: 'He surrounds himself with that which will kill him.' },
      { day: '20', title: 'Deep', line: 'The depth of a wound depends on not only the flesh but also the soul.' },
      { day: '21', title: 'Furious', line: 'Despising the weak heart.' },
      { day: '22', title: 'Trail', line: 'Salt and garnet can always be traced back to somewhere.' },
      {
        day: '23',
        title: 'Juicy',
        line: "What a parasite! To feast on another's heart and give nothing but pain in return.",
      },
      { day: '24', title: 'Blind', line: 'He lost himself in pursuit of his invisible beloved.' },
      { day: '25', title: 'Ship', line: 'Are these ruins from the monster or is the monster from the ruins?' },
      { day: '26', title: 'Squeak', line: 'The noise of innocent life and of heartless metal.' },
      { day: '27', title: 'Climb', line: "It's not an ascent if it halts another's progress." },
      { day: '28', title: 'Fall', line: 'Neglect and lack of foresight caused his downfall.' },
      { day: '29', title: 'United', line: 'United by blood alone.' },
      { day: '30', title: 'Found', line: 'A single arrow found its mark on his heart.' },
      { day: '31', title: 'Mask', line: "Humankind's earliest mask: the face." },
    ].map(({ day, title, line }) => ({
      slug: `${day}-${title.toLowerCase()}`,
      title,
      year: '2017',
      description: line,
      tags: ['art', 'ink'],
      image: `/art/inktober-17/${day}.jpg`,
      thumb: `/art/inktober-17/thumb/${day}.jpg`,
      imageAspect: '1/1',
    })),
  },
  {
    slug: 'portfolio-17',
    title: "Portfolio '17",
    year: '2017',
    description: 'Eight pieces. Titles and descriptions coming soon.',
    tags: ['art'],
    pieces: placeholderPieces(8, '2017'),
  },
  {
    slug: 'i-think-that-im',
    title: "I Think That I'm...",
    year: '2019',
    description: 'A three-part multi-animator project (MAP) piece on cruelty and self-recognition.',
    tags: ['art', 'digital'],
    image: '/art/portfolio-19/01-i-think-that-im-human.jpg',
    imageAspect: '1/1',
    pieces: [
      {
        slug: 'i-think-that-im-human',
        title: "I Think That I'm Human",
        year: '2019',
        description: 'For when we are so cruel that we fail to even recognize ourselves. Part 1 of 3.',
        tags: ['art', 'digital'],
        writeup:
          "The initial color planning I did for this multi-animator project (MAP) part went way too far and turned into this piece.",
        image: '/art/portfolio-19/01-i-think-that-im-human.jpg',
        imageAspect: '1/1',
      },
      {
        slug: 'i-think-about-god',
        title: 'I Think About God',
        year: '2019',
        description: 'I think about God. I think of the chances. Part 2 of 3 — the animation component of the same MAP part.',
        tags: ['art', 'digital'],
        writeup: "This piece was originally a short frame-by-frame animation rather than a still image; the frame shown here stands in for it.",
        image: '/art/portfolio-19/02-i-think-about-god.jpg',
        imageAspect: '1/1',
      },
      {
        slug: 'i-think-that-im-wrong',
        title: "I Think That I'm Wrong",
        year: '2019',
        description: 'How carelessly we handle the hearts of others. Part 3 of 3, the second of two individual paintings made for this project.',
        tags: ['art', 'digital'],
        image: '/art/portfolio-19/03-i-think-that-im-wrong.jpg',
        imageAspect: '1/1',
      },
    ],
  },
  {
    slug: 'one-flesh',
    title: 'One Flesh',
    year: '2019',
    description: 'We are but made of the same flesh and bones as the other creatures that inhabit this planet.',
    tags: ['art'],
    writeup: 'A traditional collage made out of pictures of meat cut from grocery store advertisements.',
    image: '/art/portfolio-19/one-flesh.jpg',
    imageAspect: '1/1',
  },
  {
    slug: 'rabbit-in-the-moon',
    title: 'Rabbit in the Moon',
    year: '2019',
    description: 'Have you heard the story of the rabbit in the moon?',
    tags: ['art', 'digital'],
    writeup: 'A small icon, made to minimize nicely.',
    image: '/art/portfolio-19/rabbit-in-the-moon.jpg',
    imageAspect: '1/1',
  },
  {
    slug: 'rex-materialistarum',
    title: 'Rēx Māteriālistārum',
    year: '2019',
    description:
      '"Your kind may see me as the demon of greed, but I never agreed to such childish things... Is it truly bad to wish for more?" — Mammon.',
    tags: ['art', 'digital'],
    image: '/art/portfolio-19/rex-materialistarum.jpg',
    imageAspect: '1/1',
  },
  {
    slug: 'transparent-eyeball',
    title: 'Transparent Eyeball',
    year: '2019',
    description:
      'May I not be a transparent eyeball, observer of all and influencer of none? What a shell of flesh that contains me, nay, restrains me so, keeping me chained to this world of give and take.',
    tags: ['art', 'digital'],
    writeup: "For #milesdrawthisinyourstyle, by @miles_art — an homage to Emerson's transparent eyeball, and to an artist whose focus on the human figure I often lack in my own pieces.",
    image: '/art/portfolio-19/transparent-eyeball.jpg',
    imageAspect: '1/1',
  },
  {
    slug: 'philosophy-animation',
    title: 'Philosophy Animation',
    year: '2019',
    description: 'Three scenes from an animation made for a philosophy class, on adoption and identity.',
    tags: ['art', 'digital'],
    image: '/art/portfolio-19/philosophy-animation-01.jpg',
    imageAspect: '1/1',
    pieces: [
      {
        slug: 'privilege',
        title: 'Privilege',
        year: '2019',
        description: 'A scene from an animation made for a philosophy class, on being privileged with well-off adoptive parents who care for me.',
        tags: ['art', 'digital'],
        writeup:
          "Not every adoptee is so lucky. Adoption can be viewed as trauma — there is no adoption without abandonment. With international adoption, there is also a loss of culture. Not all adoptees are the same; not everyone views it the same way.",
        image: '/art/portfolio-19/philosophy-animation-01.jpg',
        imageAspect: '1/1',
      },
      {
        slug: 'reidentification',
        title: 'Reidentification',
        year: '2019',
        description: 'Another scene from the same philosophy-class animation, on gender identity and reconciliation with one\'s sex.',
        tags: ['art', 'digital'],
        writeup:
          "I have made no modifications to my flesh since the start of my disidentification and reconciliation with my sex, and I think that's also an important part of my identity. I still feel agender. But outside of sports, medicine, and statistics, everyone should be treated as a unique individual, regardless of sex or gender identity.",
        image: '/art/portfolio-19/philosophy-animation-02.jpg',
        imageAspect: '1/1',
      },
      {
        slug: 'origins',
        title: 'Origins',
        year: '2019',
        description: 'The last scene posted from the same animation, on not knowing why I was given up to the Social Welfare Institute.',
        tags: ['art', 'digital'],
        writeup:
          "While I don't know how or why I was given up to the Social Welfare Institute, it could be that I was taken from my parents by government workers, and not that I was abandoned.",
        image: '/art/portfolio-19/philosophy-animation-03.jpg',
        imageAspect: '1/1',
      },
    ],
  },
  {
    slug: 'eye-studies',
    title: 'Eye Studies',
    year: '2022',
    description:
      'Extreme close-up digital paintings of eyes. The subjects are hidden on purpose — a guessing game is coming; for now, titles are placeholders.',
    tags: ['art', 'digital'],
    image: '/art/eye-studies/01.jpg',
    imageAspect: '1/1',
    stackAccent: '#bcb5ac',
    pieces: (() => {
      // Process notes from the original posts, subject redacted to keep the
      // guessing game intact — the caption text itself often named the animal.
      // Order: turkey, pig, cow, sheep, chicken, goose, goat, fish.
      const notes: Record<string, string> = {
        '01': "Leaning into realism and photo studies, something I haven't done in a while. Stopping here for now — hoping to finish an eye a day this week.",
        '03': 'The lashes on this one are so lovely.',
        '04': "Very enjoyable to draw — the first left eye I've done for this series.",
        '06': 'Do you know what animal this is? Thinking about recognizability and beauty.',
      }
      return Array.from({ length: 8 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0')
        return {
          slug: n,
          title: n,
          year: '2022',
          description: notes[n] ?? 'Subject hidden for now. Title coming soon.',
          tags: ['art', 'digital'],
          image: `/art/eye-studies/${n}.jpg`,
          thumb: `/art/eye-studies/thumb/${n}.jpg`,
          imageAspect: '1/1',
        }
      })
    })(),
  },
  {
    slug: 'mindtober-21',
    title: "Mindtober '21",
    year: '2021',
    description:
      "31 days of prompts from @susitse.art, each answered with a rhyming tercet and an ink-and-colored-pencil sticky-note drawing — a companion to Inktober that leans into the diary side of a sketchbook.",
    tags: ['art', 'ink'],
    writeup:
      "Happy October! I have some catching up to do, but I'm going to try to finish within the month. I love @susitse.art's work and am excited to finally make use of one of their prompt lists.\n\nFinally finished, five months late in places — happy to have generated some new ideas and little rhymes to tie it all together.",
    image: '/art/mindtober-21/01.jpg',
    imageAspect: '1/1',
    stackAccent: '#281912',
    pieces: [
      {
        slug: '01-my-own',
        title: 'My Own',
        year: '2021',
        description: 'the first time in a subway car alone / acutely aware of the missing eyes / for better or worse, all on my own',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/01.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '02-friend',
        title: 'Friend',
        year: '2021',
        description: 'i search for someone who can hear my cries / and i see someone who calls me a friend / but i recall our last words as goodbyes',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/02.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '03-greed',
        title: 'Greed',
        year: '2021',
        description: 'impotent, lost, with pity to expend / on streets haunted by greed, skyscrapers loom / desperately seeking an out or an end',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/03.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '04-bloom',
        title: 'Bloom',
        year: '2021',
        description: 'we fidget, prey trapped in a crowded room / yearning for progress or just something new / like the winter waits to see flowers bloom',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/04.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '05-for-you',
        title: 'For You',
        year: '2021',
        description: "there are lists of reasons, any could be true / diversion, excuse, intention, and blame / but the truth is that it's all just for you",
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/05.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '06-question',
        title: 'Question',
        year: '2021',
        description: 'question and dodge, a rhetorical game / the harmonies left in songs yet unsung / the start and the finish one and the same',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/06.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '07-blissful',
        title: 'Blissful',
        year: '2021',
        description: '"i love you, you\'re precious" rolls off the tongue / blissful adoration greases the jaw / fiercely optimistic, reckless, and young',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/07.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '08-haunted',
        title: 'Haunted',
        year: '2021',
        description: 'whiplash from lust to aversion to awe / haunted by a lingering addiction / craving caresses that rub the skin raw',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/08.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '09-judge',
        title: 'Judge',
        year: '2021',
        description: 'assess yourself and make a prediction / regardless of what the classes have said / i cannot judge what is truth or fiction',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/09.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '10-head',
        title: 'Head',
        year: '2021',
        description: 'is everything i feel just in my head / intimacy, meaning, purpose, and drive / emotions to life like breath to the dead',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/10.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '11-need',
        title: 'Need',
        year: '2021',
        description: 'to take is to live; to give is to thrive / how to know when need ends and desire starts / how do we flourish and not just survive',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/11.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '12-split',
        title: 'Split',
        year: '2021',
        description: "i'm split into two or three dozen parts / a jumble of compartmentalized creeds / torn from ancient books and from lovers' hearts",
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/12.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '13-i-know',
        title: 'I Know',
        year: '2021',
        description: "i know ours are not coincident needs / but i'll imagine that life nonetheless / i'll let that be the cut that always bleeds",
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/13.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '14-sleep',
        title: 'Sleep',
        year: '2021',
        description: 'i sleep to be well, i sleep to shirk stress / this strange state that i both crave and despise / to love or to hate, to heal or regress',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/14.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '15-underdog',
        title: 'Underdog',
        year: '2021',
        description: 'i look into pitiful, desperate eyes / as i cozy up with the underdog / the role of savior to savor and prize',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/15.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '16-yes',
        title: 'Yes',
        year: '2021',
        description: 'consent, lust, and control become a fog / but, yes, please come and devour me whole / as we recite an age old dialogue',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/16.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '17-doubt',
        title: 'Doubt',
        year: '2021',
        description: 'i chronically doubt my route and my role / equally dismiss the trite and unique / bypassing common turnpikes takes its toll',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/17.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '18-jaws',
        title: 'Jaws',
        year: '2021',
        description: "since they've been mine, my jaws have been weak / never willing to latch onto the bit / so please forgive me when i cannot speak",
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/18.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '19-damage',
        title: 'Damage',
        year: '2021',
        description: 'singed bridges and broken lines of transit / alone in the bittersweet afterglow / concrete damage haunts the budding spirit',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/19.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '20-breath',
        title: 'Breath',
        year: '2021',
        description: 'to center, to sense, to study, to know / eyes closed with perspective to understand / the breath a tool to witness lapse and flow',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/20.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '21-hand',
        title: 'Hand',
        year: '2021',
        description: 'in spite or because of a gentle hand / i am wholly captivated, ensnared / caught in a perfect storm, swift and unplanned',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/21.jpg',
        imageAspect: '1/1',
      },
      {
        slug: '22-machine',
        title: 'Machine',
        year: '2021',
        description: 'shepherd the crowd, minds uncertain and scared / each a cog in an uncaring machine / feigned independence, unity impaired',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/22.webp',
        imageAspect: '1/1',
      },
      {
        slug: '23-limit',
        title: 'Limit',
        year: '2021',
        description: 'what are the strata and what do they mean / we push each limit and make it a game / can we build our home in the in-between',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/23.webp',
        imageAspect: '1/1',
      },
      {
        slug: "24-dont",
        title: "Don't",
        year: '2021',
        description: "don't speak about me or call me by name / reference is condemned to being unfair / live only in shadow and make no claim",
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/24.webp',
        imageAspect: '1/1',
      },
      {
        slug: '25-weight',
        title: 'Weight',
        year: '2021',
        description: 'shed your skin, clean your scale, balance and tare / weight is not worth, but your weight is worthwhile / let be what truly is, honest and bare',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/25.webp',
        imageAspect: '1/1',
      },
      {
        slug: '26-time',
        title: 'Time',
        year: '2021',
        description: 'i stole time in jest with a friendly smile / but now i think i truly am a thief / guilty beloved protected from trial',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/26.webp',
        imageAspect: '1/1',
      },
      {
        slug: '27-dark',
        title: 'Dark',
        year: '2021',
        description: 'no sense of my own, blind, trusting belief / i am tired of sleep, eyes closed, in the dark / what is life but scripted, bitter, and brief',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/27.webp',
        imageAspect: '1/1',
      },
      {
        slug: '28-fire',
        title: 'Fire',
        year: '2021',
        description: "fingers sift through ashes making their mark / disturbed earth and grey skin record the hands / craving fire's fervor and lacking the spark",
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/28.webp',
        imageAspect: '1/1',
      },
      {
        slug: '29-grateful',
        title: 'Grateful',
        year: '2021',
        description: 'debt, good, and payment, supply and demands / privileged and secure and grateful and glad / despite estranged culture and stolen lands',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/29.webp',
        imageAspect: '1/1',
      },
      {
        slug: '30-memory',
        title: 'Memory',
        year: '2021',
        description: 'memory improves, edits out the bad / in love with what i remember of you / lost in the lie of what we could have had',
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/30.webp',
        imageAspect: '1/1',
      },
      {
        slug: '31-unknown',
        title: 'Unknown',
        year: '2021',
        description: "we embrace goodbye but cry at what's new / a walk turns to sprint into the unknown / running from our wrongs and chasing what's true",
        tags: ['art', 'ink'],
        image: '/art/mindtober-21/31.webp',
        imageAspect: '1/1',
      },
    ],
  },
  {
    slug: 'love-worth-heartbreak',
    title: 'love worth heartbreak',
    year: '2021',
    description: "A chapbook of poems written for a poetry competition in 2021 — it didn't place.",
    tags: ['writing', 'poem'],
    pieces: [
      {
        title: 'metaphorical safety blanket',
        preview: 'is it possible for me to avoid metaphor?\nsuch beauty evokes words from my hand\nbut i worry that i am hiding\n\ni am swaddled in opaque words\ni have wrapped myself up in poetry\ndisguising cries as lullabies\nopen wounds as still lifes\nspasms of pain as ballet\n\nelegant and refined\n\nbeautiful',
        description:
          "On hiding in plain sight behind polished metaphors that can't help but tell the truth anyway.",
        excerpt:
          "is it possible for me to avoid metaphor?\nsuch beauty evokes words from my hand\nbut i worry that i am hiding\n\ni am swaddled in opaque words\ni have wrapped myself up in poetry\ndisguising cries as lullabies\nopen wounds as still lifes\nspasms of pain as ballet\n\nelegant and refined\n\nbeautiful\n\nthe best way to hide\nmay be in plain sight\n\nbut i think i'd be better hidden if i stayed silent\nthese words can't help but reflect truth\nwith their polished forms",
      },
      {
        title: 'a love poem',
        preview: "let me write a sonnet to reality\nin an attempt to convince myself\nthat i am\nindeed\nin love with it.",
        description: "A sonnet trying to convince itself it's in love with the world, and almost succeeding.",
        excerpt:
          "let me write a sonnet to reality\nin an attempt to convince myself\nthat i am\nindeed\nin love with it.\n\nThe sun shines bright and warm but does not blind\nAt foot sway flowers, nature's painted field\nMy heart is light and opens up in kind\nAllowing tender thoughts to be revealed\nThis dappled meadow is gentle and still\nAnd I the largest one which walks the earth\nThe generous Euphrates guides my will\nJust as it will till death and has since birth\nThe world is beautiful; I am at ease\nI follow the river back to my nest\nCivilization greets me like a breeze\nIt fills my sails and it brings me to rest\nThough I may think that I am now relieved\nTruly there is not one who is deceived",
      },
      {
        title: 'back to nature',
        preview: 'it is truly peculiar\nhow humankind insists\non separating\nthe natural\nfrom unnatural\n\nare we not but a different geometry\ndrawn by the same hand?',
        description:
          'On ivy that looks like circuit boards, and the human insistence on separating natural from unnatural.',
        excerpt:
          'how the remains of ivy look like circuit boards\ntheir rootlets secured like soldering\nonly\nnot in a perpendicular fashion\n( are rectangular grids inherently human? )\n\nit is truly peculiar\nhow humankind insists\non separating\nthe natural\nfrom unnatural\n\nare we not but a different geometry\ndrawn by the same hand?',
      },
      {
        title: 'lost',
        preview: 'there is a beauty in being lost\nwhen you have no destination in mind',
        description: "On the strange comfort of being lost, and the pull of desire that won't let it stay comfortable.",
        excerpt:
          "there is a beauty in being lost\nwhen you have no destination in mind\nafter all, this is what is spoken of\nas the meaning being in the journey\nand not the destination\n\ni am almost content in this new country\nbut then again\ni am not worrying over the future\nand i am avoiding dwelling on the past\nand it is altogether pleasant\n\nso this is almost mindfulness\n\nbut i feel the pull of desire\neven here\npreventing me from relaxing on my perch\n\nbut it is not people that pull me\nand i wonder\nhow much my reclusive tendencies would grow\nwere i to live alone in the city in the future\na twenty-something with a nine to five job\nearning more money than needed\ntempering greed with insignificant alms\n\nbecause i feel this disconnect now\nas i have for some weeks\nand i don't know how to reconnect\nor how i'm supposed to want to\n\ni cannot say how to regrow this garden\nand intertwine my nerves with others'\n\nbut i wonder if\nsomeday\ni will receive\na map and compass\nto orient me in this labyrinth",
      },
      {
        title: 'nourishment',
        preview: 'food is a two-faced, high maintenance lover\nwho has broken my heart more than once',
        description: 'On food as a two-faced lover, and the complicated business of still enjoying eating.',
        excerpt:
          'how to feed the body\nbe gentle\nencouraging\nand most of all:\nloving\n\n" do you still enjoyed eating? "\nat the time, i thought it very strange question\n— it was a puzzling jab at my new diet\nthat i wasn\'t prepared for\n\nof course i enjoyed eating\n\nif you asked me the same question today, i\'d say\n" it\'s complicated "\n\nfood is a two-faced, high maintenance lover\nwho has broken my heart more than once\nand lured me in with false promises\nmore than thrice',
      },
      {
        title: 'gluttony',
        preview: 'is this gluttony\n—this compulsive destructive need to consume?',
        description: 'A short one on compulsive consumption, and the line between hunger and appetite.',
        excerpt:
          "is this gluttony\n—this compulsive destructive need to consume?\n\ni bite into yet another\nanother love\nsoul\nheart\nmind\nbut am not satisfied\n\nwherein lies the difference between myself and one pained by hunger, but that of the organ?",
      },
      {
        title: 'body',
        preview: 'i look at it\nin a way i look at art\nthat i did not create',
        description: "On looking at your own body like art you didn't create, and not quite being able to claim it.",
        excerpt:
          'can we separate ourselves from this vessel\nwhich defines us?\n\ni look at my body in the mirror\nand find it beautiful\nthe curves, fat, and bones\nthe skin, which could be clearer\nbut has done nothing to hurt me\n\nthis body\nshould be my friend\n\nand yet\ni feel my body\nand i feel like a stranger\n\ni look at it\nin a way i look at art\nthat i did not create\n\nthe body\nmy body\n\ni cannot touch it and feel it is mine\ndespite it being so inextricably\nmine',
      },
      {
        title: 'dreams forbidden',
        preview: 'i have started wearing sunglasses\nso that when i look back\ni am not fooled',
        description: 'On refusing to imagine brighter days, and what that refusal does to the dreams that come anyway.',
        excerpt:
          "i have started wearing sunglasses\nso that when i look back\ni am not fooled\nby the glamour\nof brighter days\nthat i never lived\nand never will\n\nsynesthesia gives me a bitter taste and cold skin when i look at this imagined sunshine\na haze of ultraviolet rays that is but a dream\n  a dream which i do not permit myself to have\n\nand perhaps\nit is because i do not allow myself to dream by day\nmy dreams at night plague me\nwith horrors i need not fear\nand joys i will never taste",
      },
      {
        title: 'city sidewalks',
        preview: 'our love reminds me of\nwalking barefoot\nthrough the streets',
        description: 'On love that feels like walking barefoot on broken glass, and missing a softer childhood lawn.',
        excerpt:
          "i'm alone in the city\n\nour love reminds me of\nwalking barefoot\nthrough the streets\nthe shattered negligence\npiercing my soles\n\nand i yearn for the lawn i had\nas a child\nwhen the grass was greener\nand softer\nwhen the sharpest thing i knew\nwas a pencil\nand the only love\nunconditional",
      },
      {
        title: 'puzzle pieces',
        preview: 'our bodies fit like puzzle pieces\ncomplex and satisfying\nuntil one remembers\nthat we are but a pattern',
        description: 'On bodies fitting together and the shame of realizing how predictable the pattern is.',
        excerpt:
          'our bodies fit like puzzle pieces\ncomplex and satisfying\nuntil one remembers\nthat we are but a pattern\nduplicated hundreds of times\n\nit is a shame we are so predictable',
      },
      {
        title: 'loved by a dog',
        preview: 'what must the rabbit do\nto be loved by the dog?',
        description: "A short parable about a dog and a rabbit, and what it takes to be loved without being seen.",
        excerpt:
          'what must the rabbit do to be loved by the dog?\n\nthe dog barks\nthe rabbit hides\nwhether he needs release\nor believes that she can understand\nthe rabbit does not know\n\nshe cowers\nbut the dog does not see\nperhaps he does not notice her over his excitement?\nthe rabbit is still, fearful, and alone\ndespite their supposed love',
      },
      {
        title: 'color me',
        preview: 'after all, the best color\nis none at all\nit is colorlessness',
        description: 'On choosing colorlessness, and how emotion still paints itself across everything seen.',
        excerpt:
          "after all, the best color\nis none at all\nit is colorlessness\n\ntransparency\n\nwhy do we paint ourselves so?\n\nthe word paint in german\nis the same as the word for color\nand i think of this\nas my emotions are painted across my corneas\naltering everything i see\n\nmust everything be monochrome?\n\nwhether i see out of rosy lenses\nor cold, bitter blues\n\ni am always missing something",
      },
      {
        title: 'uncertainly overthinking',
        preview:
          'i hack away at any foundation i can hope to ground myself upon and burn any bridge that may lead to greener pastures.',
        description: "A prose piece on burning bridges, old traps, and whether growth is just morphing into someone new.",
        excerpt:
          "i hack away at any foundation i can hope to ground myself upon and burn any bridge that may lead to greener pastures.\n\nbut perhaps it is a never quieting indignation that haunts me so, one that didn't believe that i had but whose footprints leave their mark on my behavior.\n\nthese nightmares and whirlwinds of emotions: i know why i tried to quit the world of feeling all those years ago, and this alkaline apathy neutralizes the stomach acid that threatens to lay waste to this ephemeral form.\n\ndo i dare tread upon these loose stones? despite my resistance, i still feel the burn of coarse cords, anchoring me to the post and reminding me of all the traps i have ever fallen into - nay, all the traps i have walked into and then fallen. i do not wish to imply that i have no fault in these defeats.\n\nhow do people release their grip from what had once defined them? i hate that i repeat the same problems over and over again, but i feel that the solution is too far out of reach, and i fear it is a magical looking glass that will trap me in a new world where i am no longer myself. is that what it means to grow? to continually morph into a fresh new being?",
      },
      {
        title: 'fishing for heartbreak',
        preview: 'there are no fish in this pond for me\nbut then i fell\nhook line and sinker',
        description: "On casting a line into love knowing exactly what you're about to lose, and doing it anyway.",
        excerpt:
          "i don't think it's right to trick a creature\nwith delicacy and richness\nonly to bite down on a blade\ncutting the lips\na deceptive capture\n\ni reel my heart back in\ni had cast my line knowing\ni would be taking nothing back with me\nthere are no fish in this pond for me\nbut then i fell\nhook line and sinker\n\nstill dripping wet\ni look at my line\nand i wouldn't change a thing\n\nfor this was a role\ni agreed to play\n\nthere are plenty of fish in the sea\nbut my my, aren't you a beautiful fish\nbut i will not trick you\neven if i fell\nhook line and sinker",
      },
      {
        title: 'surrender',
        preview: "i can't take looking at myself\nbeing the victim and the abuser.",
        description: 'A prose piece on giving up too easily and not easily enough, and wanting to be understood by a lover.',
        excerpt:
          "i give up too often, too easily, and yet at other times, not easily enough. my behaviors feel like they are determined by dice rolls, and yet they are predictable, and therefore not random. i pursue things i care about. i pursue things that i do not. likewise i neglect things i care about but also things i do not.\n\nthere are so many things to do better.\n\ni don't know if sitting around trying to decide what to do is even worth it, but rolling with the punches is also tiring, and i\n\ni can't take looking at myself being the victim and the abuser.\ni can't take this twisted relationship of a rabbit and a dog,\never conflicted but still content by each other's sides.\n\ni want — i need to be able to think, to share my mind with my lover.\n\nhow is it then that i am trapped, at a loss for words because i don't want to say what i feel.\nhow did this happen?\nhow\nhow\nhow\n\nin the moment\ni understood\nbut then is it not unlike a dream?\nwhere everything makes sense until you wake up.\nno longer in wonderland, you realize that everything is wrong.",
      },
      {
        title: 'chasing dawn',
        preview: 'he is made of sunset\nalways looking for a new dawn',
        description: "A poem about devotion that's always one step behind — dawn as the doe that's never caught.",
        excerpt:
          "he is made of sunset\nalways looking for a new dawn\n\ndawn draws her lilac hands back to her breast\nno tint left in the sky\nnovelty come and gone\na devout soul scorns help and seeks no rest\nmaking wax wings to fly\nevery day he chases dawn\n\nshe dances around him like a gazelle\nback and forth, to and fro\nbut ever out of reach\nhis is cold devotion naught could dispel\nbut still that flighty doe\nawards not act nor speech\n\nat last he halts and falls to his knees\nhot tears run down his face\nand sear his injured pride\nfor all his promises, laments, and pleas\nno mirror reflected grace\nnor did guilt once subside",
      },
      {
        title: 'a coping mechanism',
        preview: "i just want to love them\nbut i still haven't learned how to love myself",
        description: 'On loving others as a way of avoiding the harder work of loving yourself.',
        excerpt:
          "i dream\nof who i see as victims\nof love for them\n\ni just want to love them\nbut i still haven't learned how to love myself\n\nand so this compulsory altruism is only a coping mechanism used by the desperate\ntrying to make meaning in their life\n\ni don't know if i love you\nor if i even really care for you anymore\nbut i want to\nso i do",
      },
      {
        title: 'haunted',
        preview: "even if you haunt me in a way you'd never know:\ni did truly love you.",
        description: 'On being tortured by the past even in a safe place, and mistakes that keep visiting at night.',
        excerpt:
          "am i just to be tortured by the past?\ni am safe and in a solitary den and yet i wake up with adrenaline and cortisol in my veins.\ni blink, startled that my nights are so much more eventful than my days, even if my activity during these slothful hours manages to be less than that of my waking.\n\nthis has come in stages.\n\nand all concern my mistakes.\n\nbut i think of them, and while i am too shocked to cry, i tremble.\n\nwhat have i done?\n\nis this a ghost that haunts me in this house? is it yours?\n\nwhat have i done here?\n\nwas it here?\n\nit was not quite now, but close.\n\nam i still sorry, or have i moved on?\n\neven if you haunt me in a way you'd never know:\ni did truly love you.",
      },
      {
        title: 'bubble bath',
        preview: 'i cuddle up with my feelings\nand relax in a text bubble bath',
        description: 'On rereading old messages until nostalgia becomes something closer to self-harm.',
        excerpt:
          'i cuddle up with my feelings\nand relax in a text bubble bath\nas i relive meaningful exchanges\nthat i dilute with each read-through\n\nwhat a luxury to record love\n\nliving off the highs of the past\n\nbut when does this indulgence become abuse?',
      },
      {
        title: "a scribe's lament",
        preview: 'all my life i have been reaching for an eraser\ninstead of a different pen',
        description: 'On writing as a lifelong attempt to erase instead of rewrite.',
        excerpt:
          'all my life i have been reaching for an eraser\ninstead of a different pen\n\nfingers ache from a tight grip\nand forearms strain and sigh\nas they try to use friction to remove\nthe marks of days gone by\n\nbut all they do is smudge\nspreading ink onto clean white\nsuch is the folly of our kind\nto protect the fading light\n\nall i could see were shadows\nthe dark works i had done\nbut try i may to lighten them\ni could not change even one',
      },
      {
        title: 'temptation',
        preview:
          'i fall back into the arms of temptation, a deceptive lover, who will always do me wrong in the end but has the most comfortable caress',
        description: "A prose piece on splitting yourself in two to survive an addiction, and who's left to save you.",
        excerpt:
          "i fall back into the arms of temptation, a deceptive lover, who will always do me wrong in the end but has the most comfortable caress\n\nand now i have split myself apart. a part of me wants to call this a victory but i know this is the taste of defeat, sickly sweet and full of sugar alcohols that sweep me off my feet every time\n\ni avoid my reflection, hope the shower is hot enough so i don't have to see confront what i'm really doing\n\nwho i am\n\nbut who else is there to confront me if not me? i've always said that people have to choose to save themselves, and i am no different.\n\ni have split myself away from my addicted self. i let their wounds fester but tell them that they're alright, they're safe. i barely get the high from the addiction anymore; i'm not convinced i get anything at all now besides attention\n\nas if i didn't always know that human connection was the preventative measure and the cure, and that the darkest of obsessions and the hardest to wrestle away from would be those that give you attention. a mirage of human connection.\n\nhow much harder it is when there are people who will encourage you to hurt yourself\n\nwhen you are desperately seeking despite diminishing returns",
      },
      {
        title: 'spring cleaning',
        preview: 'why do i try to reinvent myself\naccording to the calendar?',
        description: 'On the seasonal urge to reinvent yourself, and what actually gets thrown away.',
        excerpt:
          "why do i try to reinvent myself\naccording to the calendar?\n\ni wash my sheets for the first time in eight months and enjoy the bed rid of dust and dirt. i reorganize the stacks of paper i have accumulated, shelving birthday cards and lost friendships behind more dignified works, like a textbook that looks to never have been proofed and some notes covered in what the ignorant would call intelligence. i remove all the rotting food from the refrigerator. while i would love to indulge in the pain, my illness is something that should not be fed. i know that the only way to become clean is to embrace wellness and authenticity, but a clean slate even more tantalizing than the dessert plate i wouldn't touch last spring.",
      },
    ].map(({ title, preview, description, excerpt }) => ({
      slug: title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-'),
      title,
      year: '2021',
      description,
      tags: ['writing', 'poem'],
      excerpt,
      preview,
    })),
  },
]

/**
 * The fake dataset (lib/work.sample.ts) is mixed in outside production so
 * there's a bigger, more varied set to test filters and card layouts
 * against. Excluded from production builds automatically.
 */
export const WORK: WorkItem[] =
  process.env.NODE_ENV === 'production' ? REAL_WORK : [...REAL_WORK, ...SAMPLE_WORK]

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
