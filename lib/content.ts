// ARTWORKS, POEMS, and ESSAYS were fabricated v0-scaffold content and have
// been removed now that the home page's art and writing panels point at real
// work in lib/work.ts (see docs/TODO.md §1). PROJECTS remains — the home
// page's science panel is still blocked on real science work to promote
// (docs/TODO.md §2), and this file can go entirely once that lands.

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
