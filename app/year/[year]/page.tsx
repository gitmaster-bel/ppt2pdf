import { notFound } from 'next/navigation';
import { tmdb } from '@/lib/tmdb';
import { MediaGrid } from '@/components/media/MediaGrid';

export const runtime = 'edge';

const VALID_YEARS = Array.from({ length: 7 }, (_, i) => 2020 + i); // 2020-2026

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  if (!VALID_YEARS.includes(parseInt(year))) return { title: 'Not Found' };
  return {
    title: `Best of ${year}`,
    robots: { index: false, follow: false },
  };
}

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const yearNum = parseInt(year);
  
  if (!VALID_YEARS.includes(yearNum)) {
    notFound();
  }

  const [moviesRes, tvRes] = await Promise.all([
    tmdb.discover('movie', { primary_release_year: year, sort_by: 'popularity.desc', page: '1' }),
    tmdb.discover('tv', { first_air_date_year: year, sort_by: 'popularity.desc', page: '1' }),
  ]);

  const combined = [...(moviesRes.results || []), ...(tvRes.results || [])]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .map(item => ({ ...item, media_type: (item.title ? 'movie' : 'tv') as 'movie' | 'tv' }));

  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-20 pt-28 max-w-7xl mx-auto px-4 w-full">
      
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white drop-shadow-xl mb-4">
          Best of <span className="text-brand-500">{year}</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          The most popular movies and TV shows released in {year}. Stream them all for free in HD on ZIVOX.
        </p>
      </div>

      <MediaGrid title="" items={combined} />

      {/* Year Navigation for SEO interlinking */}
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        {VALID_YEARS.map(y => (
          <a 
            key={y} 
            href={`/year/${y}`}
            className={`px-5 py-2 rounded-full border text-sm font-bold transition-all ${y === yearNum ? 'bg-premium-gradient border-brand-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            {y}
          </a>
        ))}
      </div>
    </div>
  );
}
