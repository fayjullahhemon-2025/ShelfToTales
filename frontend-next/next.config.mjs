/** @type {import('next').NextConfig} */
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const apiHost = new URL(apiBase).host;

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  img-src 'self' blob: data: https://images.unsplash.com https://i.pravatar.cc https://ui-avatars.com https://via.placeholder.com https://*.r2.dev https://placehold.co https://api.dicebear.com;
  font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
  connect-src 'self' ${apiBase} ws://${apiHost} wss://${apiHost} https://accounts.google.com;
  worker-src 'self' https://unpkg.com;
  frame-src 'self' https://accounts.google.com https://www.youtube.com https://www.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
  // Allow images from external sources used by the existing app (Unsplash,
  // Pravatar avatars, ui-avatars, via.placeholder). Add others as needed.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },

  // Many pages still use plain <img> (ported from CRA). Disable the lint
  // rule until pages are migrated to next/image individually.
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          }
        ],
      },
    ];
  },
};

export default nextConfig;
