import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'movie';
  
  // Clone the search params to forward them
  const params = new URLSearchParams(searchParams.toString());
  params.delete('type'); // Remove 'type' since it's in the URL path
  params.append('api_key', TMDB_API_KEY || '');
  
  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/${type}?${params.toString()}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('TMDB API proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
