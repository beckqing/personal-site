import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
  allowedDevOrigins: ['*.trycloudflare.com'],
}

const withMDX = createMDX({})

export default withMDX(nextConfig)
