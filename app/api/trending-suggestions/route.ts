import { NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export const runtime = 'edge';

// Vercel Edge CDN Caching for default search suggestions.
// Replaces a Server Action that caused a Function Invocation on every Search page mount.

export async function GET() {
  try {
    const data = await tmdb.getTrending('all', 1);
    const now = new Date().toISOString().split('T')[0];
    
    const results = (data.results || []).filter((item: any) => {
      if (item.media_type === 'person') return false;
      const releaseDate = item.release_date || item.first_air_date;
      if (!releaseDate) return false;
      if (releaseDate > now) return false;
      return true;
    });

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (err) {
    console.error('API Suggestions Failed:', err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
