/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@roznamcha/api-client',
    '@roznamcha/types',
    '@roznamcha/constants',
  ],
};

module.exports = nextConfig;
