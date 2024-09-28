/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'imgix',
    path: '',
    domains: ['media.tenor.com', 'localhost', '127.0.0.1', 'backend'],
  },
};

module.exports = nextConfig;
