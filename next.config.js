/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    typedRoutes: false,
  },
}

module.exports = nextConfig 