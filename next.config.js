/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.googleapis.com', port: '', pathname: '/**' },
    ],
  },
  /**
   * Custom webpack configuration to disable caching.
   * This can help prevent issues with "dirty builds" on some hosting platforms
   * by ensuring a clean build every time, at the cost of a slightly longer
   * build time.
   */
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;
