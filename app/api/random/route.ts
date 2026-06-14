import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';
import { generateSlug } from '@/lib/utils';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const page = Math.floor(Math.random() * 20) + 1;
    const res = await tmdb.discover('movie', { page: page.toString(), sort_by: 'popularity.desc' });
    
    if (!res.results || res.results.length === 0) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const randomMovie = res.results[Math.floor(Math.random() * res.results.length)];
    const slug = generateSlug(randomMovie.id.toString(), randomMovie.title);
    
    if (request.nextUrl.searchParams.get('json') === 'true') {
      return NextResponse.json({ ...randomMovie, slug });
    }
    
    return NextResponse.redirect(new URL(`/watch/movie/${slug}`, request.url));
  } catch (error) {
    if (request.nextUrl.searchParams.get('json') === 'true') {
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
}
