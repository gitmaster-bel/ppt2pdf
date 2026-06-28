import { NextResponse } from 'next/server';
import { getRegionalProviderShelvesAction } from '@/app/actions';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'US';

  try {
    const data = await getRegionalProviderShelvesAction(country);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err) {
    console.error('Regional Providers API Failed:', err);
    return NextResponse.json(null, { status: 500 });
  }
}
