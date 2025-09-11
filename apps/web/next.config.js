/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@consulton/types'],
  experimental: {
    typedRoutes: true,
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  // Webpack configuration to handle dynamic imports better
  webpack: (config, { dev, isServer }) => {
    // Improve module resolution for dynamic imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Handle potential module loading issues
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }

    return config;
  },
}

module.exports = nextConfig
