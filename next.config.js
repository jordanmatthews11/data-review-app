// Next.js 15.x may start Node with --localstorage-file pointing to an invalid
// path, creating a broken localStorage global that crashes SSR in libraries
// like next-themes.  Remove it as early as possible.
if (
  typeof globalThis.localStorage !== 'undefined' &&
  typeof globalThis.localStorage.getItem !== 'function'
) {
  globalThis.localStorage = undefined;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloud.fieldagent.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fieldagent-app.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig;
