/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  },
  async headers() {
    return [
      {
        // Service worker must never be cached by intermediaries - the
        // browser needs to see updates promptly.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache' }]
      },
      {
        // Baseline hardening on every response. No CSP here deliberately -
        // this app embeds a keyless Google Maps iframe (/kontakt) and inline
        // data: URI QR images (credit top-up), and getting a CSP wrong is a
        // silent-breakage risk that needs testing against a real running
        // app (which this environment can't do); add one separately, tested
        // against a live deploy.
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};

export default nextConfig;
