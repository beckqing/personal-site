import type { MetadataRoute } from 'next'
import { isChapbook, isCollection, WORK } from '@/lib/work'

const BASE_URL = 'https://beckqing.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/work`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const workRoutes: MetadataRoute.Sitemap = WORK.flatMap((item) => {
    const routes: MetadataRoute.Sitemap = [
      { url: `${BASE_URL}/work/${item.slug}`, changeFrequency: 'monthly', priority: 0.7 },
    ]
    if (!isCollection(item)) return routes
    if (isChapbook(item)) {
      routes.push({ url: `${BASE_URL}/work/${item.slug}/read`, changeFrequency: 'monthly', priority: 0.5 })
    }
    for (const piece of item.pieces) {
      routes.push({ url: `${BASE_URL}/work/${item.slug}/${piece.slug}`, changeFrequency: 'monthly', priority: 0.5 })
    }
    return routes
  })

  return [...staticRoutes, ...workRoutes]
}
