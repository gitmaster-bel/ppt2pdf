import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Edge Runtime ──────────────────────────────────────────────────────────────
// Runs at Vercel's Edge Network — near-zero CPU cost, doesn't count against
// Function Invocations on Hobby plan. This is the first line of defense.
// Note: Middleware is edge by default, no export needed.

// ─── Known Bot User-Agent Fragments ────────────────────────────────────────────
// Comprehensive list covering search engines, AI scrapers, SEO tools, and
// social media crawlers. All lowercase for case-insensitive matching.
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

// ─── Scraper Paths ─────────────────────────────────────────────────────────────
// Paths that only bots/scanners request. Real users never hit these.
const SCRAPER_PATHS = [
  '/sitemap', '/sitemap.xml', '/sitemap_index.xml',
  '/feed', '/rss', '/atom.xml',
  '/.well-known', '/.env', '/.git',
  '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
  '/xmlrpc.php', '/admin', '/administrator',
  '/phpmyadmin', '/cgi-bin',
];

// ─── Minimal 403 Response ──────────────────────────────────────────────────────
// Ultra-lightweight HTML — no Next.js rendering, no function cost.
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

export default function proxy(request: NextRequest) {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const pathname = request.nextUrl.pathname;

  // ── 1. Block scraper paths immediately ───────────────────────────────────
  const isScraperPath = SCRAPER_PATHS.some(p => pathname.startsWith(p));
  if (isScraperPath) {
    return BLOCKED_RESPONSE.clone();
  }

  // ── 2. Block empty or missing user agents ────────────────────────────────
  // Real browsers always send a user agent. Empty = bot/scanner.
  if (!userAgent || userAgent.length < 10) {
    return BLOCKED_RESPONSE.clone();
  }

  // ── 3. Block known bot user agents ───────────────────────────────────────
  const isBot = BLOCKED_BOT_PATTERNS.some(pattern => userAgent.includes(pattern));
  if (isBot) {
    return BLOCKED_RESPONSE.clone();
  }

  // ── 4. Add security headers to all responses ─────────────────────────────
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noai, noimageai');
  return response;
}

// ─── Matcher ───────────────────────────────────────────────────────────────────
// Skip static assets — they don't need bot checking and this saves edge compute.
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|sw.js).*)',
};
