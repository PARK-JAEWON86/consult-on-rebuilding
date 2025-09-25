/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@consulton/types'],
  experimental: {
    typedRoutes: true,
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  webpack: (config, { isServer }) => {
    // Agora SDK 관련 webpack 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // 모듈 해석 개선
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },
}

module.exports = nextConfig
