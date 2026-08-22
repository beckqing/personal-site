export type Artwork = {
  slug: string
  title: string
  year: string
  medium: string
  image: string
  span: 'tall' | 'wide' | 'square'
  note: string
}

export const ARTWORKS: Artwork[] = [
  {
    slug: 'moonhare',
    title: 'Moon Hare',
    year: '2024',
    medium: 'Oil on canvas',
    image: '/art/moon-hare.png',
    span: 'tall',
    note: 'A folklore hare curled into the crescent — the mark I keep returning to.',
  },
  {
    slug: 'the-weight-we-carry',
    title: 'The Weight We Carry',
    year: '2024',
    medium: 'Digital painting',
    image: '/art/heart-portrait.png',
    span: 'tall',
    note: 'On tending the things that keep us alive, roots and all.',
  },
  {
    slug: 'lamplight',
    title: 'Lamplight',
    year: '2023',
    medium: 'Oil on panel',
    image: '/art/fiddle-fig.png',
    span: 'square',
    note: 'The fiddle-leaf fig that has followed me between apartments.',
  },
  {
    slug: 'summer-storm',
    title: 'Summer Storm',
    year: '2023',
    medium: 'Oil on canvas',
    image: '/art/storm-landscape.png',
    span: 'wide',
    note: 'Named after a color before it was named after a sky.',
  },
  {
    slug: 'small-hours',
    title: 'Small Hours',
    year: '2022',
    medium: 'Digital painting',
    image: '/art/terracotta-figure.png',
    span: 'square',
    note: 'For everyone who does their best thinking after midnight.',
  },
  {
    slug: 'the-night-desk',
    title: 'The Night Desk',
    year: '2022',
    medium: 'Oil on panel',
    image: '/art/night-window.png',
    span: 'square',
    note: 'Where most of this work actually happens.',
  },
]

export type Poem = {
  slug: string
  title: string
  lines: string[]
}

export const POEMS: Poem[] = [
  {
    slug: 'night-owl',
    title: 'night owl',
    lines: [
      'the moon keeps my hours,',
      'a thin bright coin',
      'spent slowly against the dark —',
      '',
      'i am learning',
      'that some light',
      'only arrives',
      'once everything else',
      'has gone quiet.',
    ],
  },
  {
    slug: 'pigment',
    title: 'pigment',
    lines: [
      'indigo is the color',
      'i reach for in the shadows,',
      'never black —',
      '',
      'because nothing i have loved',
      'was ever',
      'the absence of a color.',
    ],
  },
  {
    slug: 'interdisciplinary',
    title: 'interdisciplinary',
    lines: [
      'they ask me to pick a lane.',
      '',
      'i tell them the river',
      'does not apologize',
      'for the sea.',
    ],
  },
]

export type Essay = {
  slug: string
  title: string
  date: string
  readingTime: string
  excerpt: string
  tag: 'art' | 'humanities' | 'science'
}

export const ESSAYS: Essay[] = [
  {
    slug: 'on-being-many-things',
    title: 'On Being Many Things at Once',
    date: 'March 2024',
    readingTime: '6 min',
    excerpt:
      'For years I treated my interests like rooms with the doors shut. This is an essay about what happened when I finally let the light move between them.',
    tag: 'humanities',
  },
  {
    slug: 'the-color-of-a-shadow',
    title: 'The Color of a Shadow',
    date: 'January 2024',
    readingTime: '4 min',
    excerpt:
      'Why my favorite color is a warm indigo, and what learning to paint shadows taught me about paying attention to the parts of a life we tend to ignore.',
    tag: 'art',
  },
  {
    slug: 'living-in-the-world',
    title: 'Notes on Living in the World',
    date: 'November 2023',
    readingTime: '8 min',
    excerpt:
      'Small observations gathered over a difficult year — on cities, on strangers, on the strange grace of ordinary Tuesdays.',
    tag: 'humanities',
  },
  {
    slug: 'a-quiet-argument-for-wonder',
    title: 'A Quiet Argument for Wonder',
    date: 'August 2023',
    readingTime: '5 min',
    excerpt:
      'Curiosity is not a childish thing to grow out of. It might be the most serious commitment an adult can make.',
    tag: 'science',
  },
]

export type Project = {
  slug: string
  title: string
  summary: string
  field: string
  year: string
  metrics: { label: string; value: string }[]
}

export const PROJECTS: Project[] = [
  {
    slug: 'color-blind-palettes',
    title: 'Designing Color-Blind-Friendly Data Visualizations',
    summary:
      'A studio talk on building a single brand palette that subdivides into accessible, colorblind-safe schemes for scientific charts — the system behind this very site.',
    field: 'Design · Accessibility',
    year: '2024',
    metrics: [
      { label: 'Palettes derived', value: '4' },
      { label: 'Contrast passing AA', value: '100%' },
      { label: 'Vision types tested', value: '3' },
    ],
  },
  {
    slug: 'language-and-perception',
    title: 'Language and the Perception of Color',
    summary:
      'A cross-linguistic literature review examining how the words a culture has for color shape the way its speakers see and remember it.',
    field: 'Linguistics · Cognitive Science',
    year: '2023',
    metrics: [
      { label: 'Languages surveyed', value: '12' },
      { label: 'Studies reviewed', value: '38' },
      { label: 'Poster sessions', value: '2' },
    ],
  },
  {
    slug: 'circadian-light',
    title: 'Circadian Light and the Working Artist',
    summary:
      'A self-experiment tracking how light exposure across a nocturnal schedule affects focus, mood, and creative output — with the charts to prove it.',
    field: 'Chronobiology · Self-tracking',
    year: '2022',
    metrics: [
      { label: 'Days logged', value: '120' },
      { label: 'Variables tracked', value: '7' },
      { label: 'Late nights', value: 'too many' },
    ],
  },
]
