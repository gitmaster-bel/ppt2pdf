import { NextResponse } from 'next/server';
import { fetchTMDB } from '@/lib/tmdb';
import { Media, TMDBResponse } from '@/types/tmdb';

export const runtime = 'edge';

// Vercel Edge CDN Caching
// We cache search suggestions at the Edge CDN for 24 hours.
// This completely bypasses Server Action overhead and Data Cache (ISR) writes!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const query = q.trim();
  const params = {
    query,
    page: '1',
    include_adult: 'false',
    language: 'en-US',
  };

  try {
    const [moviesRes, tvRes] = await Promise.all([
      fetchTMDB<TMDBResponse<Media>>('/search/movie', params).catch(() => null),
      fetchTMDB<TMDBResponse<Media>>('/search/tv', params).catch(() => null),
    ]);

    let moviesResults = (moviesRes?.results || []).map(item => ({ ...item, media_type: 'movie' }));
    let tvResults = (tvRes?.results || []).map(item => ({ ...item, media_type: 'tv' }));

    // Sort by popularity and slice top 10
    const combined = [...moviesResults, ...tvResults]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10);

    return NextResponse.json(
      { results: combined },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      }
    );
  } catch (err) {
    console.error('API Search Failed:', err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
