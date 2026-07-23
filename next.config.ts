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
        ],
      },
    ];
  },
};

export default nextConfig;
