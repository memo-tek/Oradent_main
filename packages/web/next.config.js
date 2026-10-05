/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { domains: ['localhost'] },
  experimental: { proxyTimeout: 120000 },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' },
      { source: '/uploads/:path*', destination: 'http://localhost:4000/uploads/:path*' },
    ];
  },
};
module.exports = nextConfig;
