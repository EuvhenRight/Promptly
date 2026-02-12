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
   * This is a workaround for an issue with Cloudflare Pages where the build
   * process can create cache files larger than the 25MB limit, causing the
   * deployment to fail. Disabling the cache prevents the creation of these
   * large .pack files.
   */
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;
