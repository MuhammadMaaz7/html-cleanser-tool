/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',   // ensures `out/` is generated
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/html-cleanser-tool' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/html-cleanser-tool/' : '',
}

export default nextConfig
