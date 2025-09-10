/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@consulton/types'],
  experimental: {
    typedRoutes: true,
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

module.exports = nextConfig
