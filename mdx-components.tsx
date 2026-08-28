import type { MDXComponents } from 'mdx/types'
import { essayComponents } from '@/components/essay'

const components: MDXComponents = essayComponents

export function useMDXComponents(): MDXComponents {
  return components
}
