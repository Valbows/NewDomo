/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Required to use the standalone server in Docker
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },
};

// Wrap with Sentry config if available; fall back to plain config otherwise
let withSentry = (cfg) => cfg;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  withSentry = require('@sentry/nextjs').withSentryConfig;
} catch (e) {
  // Sentry not installed; proceed without wrapping
}

module.exports = withSentry(nextConfig, { silent: true }, {});
