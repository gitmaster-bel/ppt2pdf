import { NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export const runtime = 'edge';

// ─── Home Data API Route ──────────────────────────────────────────────────────
//
// RATIONALE: The home page was firing 12+ parallel TMDB fetches on EVERY render
// with short revalidation windows. With high traffic, uncached renders each
// made 12 TMDB calls, creating a large amount of avoidable function work for the
// home page.
//
// This route consolidates all home data into ONE cached endpoint. The `revalidate`
// directive ensures the function runs at most once per day, regardless of traffic.
// All subsequent requests within that window receive the CDN-cached JSON response
// at zero function invocation cost.
//
// The s-maxage header in next.config.ts ensures Vercel's CDN layer caches this.

export const revalidate = 86400; // Revalidate once per day — not once per user

export async function GET() {
  try {
    const [
      trending,
      popMovies,
      popTv,
      topMovies,
      topTv,
      popAnime,
      classicMovies,
      classicTv,
      underratedMovies,
      underratedTv,
      netflixData,
      primeData,
    ] = await Promise.all([
      tmdb.getTrending('all'),
      tmdb.getPopular('movie'),
      tmdb.getPopular('tv'),
      tmdb.getTopRated('movie'),
      tmdb.getTopRated('tv'),
      tmdb.getAnime('1').catch(() => ({ results: [] })),
      tmdb.discover('movie', {
        'primary_release_date.gte': '1980-01-01',
        'primary_release_date.lte': '2014-12-31',
        'vote_count.gte': '3000',
        sort_by: 'vote_average.desc',
      }),
      tmdb.discover('tv', {
        'first_air_date.gte': '1990-01-01',
        'first_air_date.lte': '2014-12-31',
        'vote_count.gte': '1500',
        sort_by: 'vote_average.desc',
      }),
      tmdb.discover('movie', {
        'vote_average.gte': '7.2',
        'vote_count.gte': '300',
        'vote_count.lte': '2500',
        sort_by: 'popularity.desc',
      }),
      tmdb.discover('tv', {
        'vote_average.gte': '7.5',
        'vote_count.gte': '200',
        'vote_count.lte': '2000',
        sort_by: 'popularity.desc',
      }),
      tmdb.discover('movie', {
        with_watch_providers: '8',
        watch_region: 'US',
        sort_by: 'popularity.desc',
      }).catch(() => ({ results: [] })),
      tmdb.discover('movie', {
        with_watch_providers: '9',
        watch_region: 'US',
        sort_by: 'popularity.desc',
      }).catch(() => ({ results: [] })),
    ]);

    return NextResponse.json(
      {
        trending,
        popMovies,
        popTv,
        topMovies,
        topTv,
        popAnime,
        classicMovies,
        classicTv,
        underratedMovies,
        underratedTv,
        netflixData,
        primeData,
      },
      {
        headers: {
          // Tell Vercel CDN to cache this response for 24 hours.
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch home data' },
      { status: 500 }
    );
  }
}
