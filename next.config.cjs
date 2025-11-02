/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    // Daily.co webpack configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async headers() {
    const headers = [
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
    if (process.env.NODE_ENV === 'production') {
      headers[0].headers.push({
        key: 'Content-Security-Policy-Report-Only',
        value:
          "default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co https://api.elevenlabs.io https://tavusapi.com https://*.sentry.io; img-src 'self' data: blob:; media-src 'self' blob: https://*.supabase.co; frame-ancestors 'none'",
      });
    }
    return headers;
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
