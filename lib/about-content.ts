export type AboutTabId = 'general' | 'art' | 'tech' | 'food'

export type AboutLink = {
  label: string
  href: string
  icon?: 'instagram'
  soon?: boolean
}

export type AboutSection = {
  paragraphs: string[]
  links?: AboutLink[]
}

export type AboutTab = {
  id: AboutTabId
  label: string
  /** design-token accent name, matches globals.css: art | science | goldenrod | terracotta */
  accent: 'goldenrod' | 'art' | 'science' | 'terracotta'
  sections: AboutSection[]
}

export const ABOUT_TABS: AboutTab[] = [
  {
    id: 'general',
    label: 'general',
    accent: 'goldenrod',
    sections: [
      {
        paragraphs: [
          'Hi there! I am an interdisciplinary designer perpetually trying to figure out how stuff works, whether it\u2019s color theory or croissants. At present, I\u2019m in the SF bay area working as an automation scientist, captivated by the idea of engineering biology.',
        ],
        links: [
          { label: 'instagram', href: 'https://www.instagram.com/beckqing/', icon: 'instagram' },
        ],
      },
    ],
  },
  {
    id: 'art',
    label: 'art',
    accent: 'art',
    sections: [
      {
        paragraphs: [
          'As an artist, I enjoy exploring new mediums and techniques. My primary background is in illustration and fine art, but I also have experience with character art and graphic design. Most of my work is on Instagram.',
        ],
        links: [
          { label: 'instagram', href: 'https://www.instagram.com/beckqing/', icon: 'instagram' },
          { label: 'youtube', href: 'https://www.youtube.com/@beckqing' },
          { label: 'behance', href: '#', soon: true },
          { label: 'dribbble', href: '#', soon: true },
        ],
      },
      {
        paragraphs: [
          'My character art and design work has led me onto a number of platforms that I am no longer active on but which can be found here.',
        ],
        links: [
          { label: 'character art instagram', href: 'https://www.instagram.com/nocturnalwhims', icon: 'instagram' },
          { label: 'deviantart', href: 'https://www.deviantart.com/nocturnalwhims' },
          { label: 'artfight', href: 'https://artfight.net/~Wister' },
          { label: 'toyhouse', href: 'https://toyhou.se/Wister' },
        ],
      },
    ],
  },
  {
    id: 'tech',
    label: 'tech',
    accent: 'science',
    sections: [
      {
        paragraphs: [
          'I\u2019ve been making my way around the world of web development and programming more generally, with a few classes, hackathons, and professional projects here and there. I\u2019m particularly interested in new ways to share science and visualize information.',
        ],
        links: [
          { label: 'github', href: 'https://github.com/beckqing' },
          { label: 'codepen', href: 'https://codepen.io/beckqing' },
        ],
      },
    ],
  },
  {
    id: 'food',
    label: 'food',
    accent: 'terracotta',
    sections: [
      {
        paragraphs: [
          'Several years ago, I found allergy-friendly baking to be an exciting challenge, akin to painting with a limited palette. My kitchen pursuits have nurtured a love of material science and a passion for kinder food systems. I write a vegan food blog with recipes and restaurant reviews.',
        ],
        links: [{ label: 'the blog', href: 'https://www.floursandfungi.com/' }],
      },
    ],
  },
]
