import { NextRequest, NextResponse } from 'next/server';
import { searchMedia } from '@/app/actions';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const include_adult = searchParams.get('include_adult') === 'true';

  if (!q) {
    return NextResponse.json({ page: 1, results: [], total_pages: 1, total_results: 0 });
  }

  try {
    const data = await searchMedia(q, page, include_adult);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
