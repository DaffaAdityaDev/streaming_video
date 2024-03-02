/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'imgix',
    path: '',
    domains: ['media.tenor.com'],
  },
};

module.exports = nextConfig;
