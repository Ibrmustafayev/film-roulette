import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'media.themoviedb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Disable ad-related browser APIs that ad networks rely on
          {
            key: 'Permissions-Policy',
            value: [
              'interest-cohort=()',
              'browsing-topics=()',
              'join-ad-interest-group=()',
              'run-ad-auction=()',
              'attribution-reporting=()',
              'private-state-token-issuance=()',
              'private-state-token-redemption=()',
              'idle-detection=()',
            ].join(', '),
          },
          // Reduce fingerprinting data sent to ad networks in iframes
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Stop the browser from second-guessing declared content types, which
          // is how a proxied text response gets executed as a script.
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // The app frames third-party players; this is the reverse control -
          // it stops anyone else framing this site to overlay their own UI.
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Deliberately no Content-Security-Policy yet: the player embeds
          // arbitrary third-party origins, so a policy strict enough to be
          // worth having would have to enumerate every provider first.
        ],
      },
    ];
  },
};

export default nextConfig;
