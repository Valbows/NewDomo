/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
    const headers = [
      // Allow iframe embedding for /embed/* routes
      {
        source: '/embed/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          // Allow embedding from any origin for embed pages
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Permissions-Policy', value: 'camera=*, microphone=*, geolocation=()' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
      // Restrict all other routes
      {
        source: '/((?!embed).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
        ],
      },
    ];
    if (process.env.NODE_ENV === 'production') {
      // Add CSP for non-embed routes only
      // Note: 'unsafe-inline' is required for Next.js inline scripts
      // wss://*.supabase.co is required for Supabase realtime WebSocket connections
      headers[1].headers.push({
        key: 'Content-Security-Policy-Report-Only',
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io https://tavusapi.com https://*.sentry.io https://*.daily.co wss://*.daily.co; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; frame-ancestors 'none'; style-src 'self' 'unsafe-inline'",
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
