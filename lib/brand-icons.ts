import iconsRaw from '@/data/icons-raw.json'

export type IconCategory = 'art' | 'hu' | 'sci'

export type BrandIcon = {
  slug: string
  path: string
  viewBox: string
  categories: IconCategory[]
}

type RawIcon = {
  path: string
  width: string
  height: string
  viewbox: string
  category: IconCategory[]
}

export const BRAND_ICONS: BrandIcon[] = Object.entries(
  iconsRaw as Record<string, RawIcon>,
).map(([slug, data]) => ({
  slug: slug.trim(),
  path: data.path,
  viewBox: data.viewbox,
  categories: data.category,
}))
