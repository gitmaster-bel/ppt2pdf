import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Edge Middleware ─────────────────────────────────────────────────────────
// Runs at the Edge (Cloudflare Workers / Vercel Edge Network).
// No Node.js APIs used — pure Web APIs only. Fully CF-compatible.

// ─── Known Bot User-Agent Fragments ─────────────────────────────────────────
const BLOCKED_BOT_PATTERNS = [
  // Search engines
  'googlebot', 'bingbot', 'yandexbot', 'baiduspider', 'duckduckbot',
  'slurp', 'ia_archiver', 'sogou',
  // AI crawlers
  'gptbot', 'oai-searchbot', 'chatgpt-user', 'claudebot', 'claude-searchbot',
  'claude-user', 'anthropic-ai', 'claude-web', 'cohere-ai',
  'google-extended', 'googleother', 'google-cloudvertexbot',
  'meta-externalagent', 'meta-externalfetcher', 'facebookbot',
  'applebot', 'applebot-extended', 'amazonbot',
  'ccbot', 'bytespider', 'diffbot', 'perplexitybot', 'perplexity-user',
  'duckassistbot', 'youbot',
  'mistralai-user', 'novellumbot', 'novellum ai crawl',
  'proratabot', 'proratainc',
  'terracotta', 'terracottabot', 'tiktok-spider', 'tiktokspider', 'timpibot',
  'manusbot', 'manus bot', 'anchorbrowser', 'anchor browser',
  'cloudflare-diagnostics', 'cloudflare crawler',
  'arquivo-web-crawler', 'archive.org_bot',
  // SEO / scraper tools
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'petalbot', 'blexbot',
  'screaming frog', 'rogerbot', 'seznambot', 'exabot',
  'omgilibot', 'imagesiftbot',
  // Generic bot patterns
  'spider', 'crawler', 'scraper', 'wget', 'httrack', 'python-urllib',
  'python-requests', 'go-http-client', 'java/', 'libwww-perl',
  'curl/', 'phpcrawl', 'headlesschrome',
];

// ─── Scraper Paths ───────────────────────────────────────────────────────────
const SCRAPER_PATHS = [
  '/sitemap', '/sitemap.xml', '/sitemap_index.xml',
  '/feed', '/rss', '/atom.xml',
  '/.well-known', '/.env', '/.git',
  '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
  '/xmlrpc.php', '/admin', '/administrator',
  '/phpmyadmin', '/cgi-bin',
];

// ─── Minimal 403 Response ────────────────────────────────────────────────────
const BLOCKED_RESPONSE = new Response(
  '<!DOCTYPE html><html><head><title>403</title></head><body><h1>403 Forbidden</h1></body></html>',
  {
    status: 403,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'X-Robots-Tag': 'noindex, nofollow, noai, noimageai',
    },
  }
);

export default function middleware(request: NextRequest) {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const pathname = request.nextUrl.pathname;

  // ── 1. Block scraper paths immediately ──────────────────────────────────
  if (SCRAPER_PATHS.some(p => pathname.startsWith(p))) {
    return BLOCKED_RESPONSE.clone();
  }

  // ── 2. Block empty or missing user agents ────────────────────────────────
  if (!userAgent || userAgent.length < 10) {
    return BLOCKED_RESPONSE.clone();
  }

  // ── 3. Block known bot user agents ───────────────────────────────────────
  if (BLOCKED_BOT_PATTERNS.some(pattern => userAgent.includes(pattern))) {
    return BLOCKED_RESPONSE.clone();
  }

  // ── 4. Geo detection: Cloudflare injects CF-IPCountry, Vercel uses x-vercel-ip-country
  const country =
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    null;

  const requestHeaders = new Headers(request.headers);
  if (country && country !== 'XX') {
    // XX = Cloudflare's code for unknown country — treat as no country
    requestHeaders.set('x-user-country', country);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noai, noimageai');

  // ── 5. Set country cookie on first visit so client components read it instantly
  if (country && country !== 'XX' && !request.cookies.has('user_country')) {
    response.cookies.set('user_country', country, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
  }

  return response;
}

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Skip static assets — saves edge compute.
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|sw.js).*)',
};
