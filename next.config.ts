import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  compress: true,
  images: {
    // ✅ CRITICAL: Bypass Vercel Image Optimization entirely.
    // We fetch pre-compressed TMDB CDN images (w500/w1280) directly,
    // resulting in 0 Vercel compute and 0 Vercel bandwidth for images.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800, // 7 days
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [48, 96, 192, 256, 384],
  },
  turbopack: {},
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Static assets — immutable, 1 year TTL
      {
        source: '/(.*)\\.{ico,png,jpg,jpeg,svg,webp,avif,woff,woff2}',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Manifest — cache for 24 hours
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400' },
        ],
      },
      // robots.txt — long-lived cache
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400' },
        ],
      },
      // ── HOME PAGE ────────────────────────────────────────────────────────────
      // Currently only 14.6% cached — this is the #1 cost driver.
      // CDN caches for 1h, serves stale for 24h while background revalidates.
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      // ── HOME DATA API ─────────────────────────────────────────────────────────
      {
        source: '/api/home-data',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      // ── WATCH PAGES ─────────────────────────────────────────────────────────
      // 54.3% cached for movies, 42.7% for TV — these need to go higher.
      {
        source: '/watch/movie/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=2592000, stale-while-revalidate=2592000' },
        ],
      },
      {
        source: '/watch/tv/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=604800, stale-while-revalidate=604800' },
        ],
      },
      // ── PERSON PAGES ─────────────────────────────────────────────────────────
      // 64.6% cached — good but can go higher
      {
        source: '/person/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      // ── COLLECTION PAGES ─────────────────────────────────────────────────────
      // 87.1% cached — already excellent
      {
        source: '/collection/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      // ── BROWSE PAGES ─────────────────────────────────────────────────────────
      // /movies, /tv, /anime, /schedule — revalidate every 6h, stale 7 days
      {
        source: '/movies',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/tv',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/anime',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/schedule',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      // ── DISCOVER ─────────────────────────────────────────────────────────────
      // Currently 0% cached — killing function invocations!
      // Filter results are query-string dependent, so cache by Vary is complex.
      // Set a moderate 15min CDN cache for default view.
      {
        source: '/discover',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      // ── SEARCH ───────────────────────────────────────────────────────────────
      // Only 7.4% cached — dynamic query params hurt caching.
      // We can't cache user search results (query-specific), so let the client cache.
      {
        source: '/search',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache' },
        ],
      },

      // Discover API — cache aggressively
      {
        source: '/api/discover',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=1800, stale-while-revalidate=86400' },
        ],
      },
      // Search API — cache for 1 hour to prevent function invocation spam
      {
        source: '/api/search',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      // Random API — cache a short window
      {
        source: '/api/random',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      // Blog + static content pages
      {
        source: '/blog/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/collections',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/providers',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/guide',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/about',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }
    return config;
  },
};

export default nextConfig;
