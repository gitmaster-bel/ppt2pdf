import { notFound } from 'next/navigation';
import { tmdb } from '@/lib/tmdb';
import { getGenreBySlug } from '@/lib/genres';
import { MediaGrid } from '@/components/media/MediaGrid';
import { BackButton } from '@/components/ui/BackButton';

export const runtime = 'nodejs';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const genre = getGenreBySlug(slug);
  return {
    title: genre ? `${genre.name} Movies & Shows` : 'Genre',
    robots: { index: false, follow: false },
  };
}

export default async function GenrePage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = page || '1';
  
  const genre = getGenreBySlug(slug);
  
  if (!genre) {
    notFound();
  }

  // Fetch movies and TV shows for this genre
  const [moviesRes, tvRes] = await Promise.all([
    tmdb.discover('movie', { with_genres: genre.id.toString(), page: currentPage, sort_by: 'popularity.desc' }),
    tmdb.discover('tv', { with_genres: genre.id.toString(), page: currentPage, sort_by: 'popularity.desc' })
  ]);

  // Combine and sort by popularity
  const combined = [...(moviesRes.results || []), ...(tvRes.results || [])]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .map(item => ({ ...item, media_type: (item.title ? 'movie' : 'tv') as 'movie' | 'tv' }));

  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-20 pt-28 max-w-7xl mx-auto px-4 w-full relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50">
        <BackButton />
      </div>
      
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white drop-shadow-xl mb-4">
          <span className="text-brand-500">{genre.name}</span> Movies & Shows
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          Discover the most popular {genre.name} content. Stream seamlessly in high quality on ZIVOX.
        </p>
      </div>

      <MediaGrid title="" items={combined} />
      
      {/* Basic Pagination for SEO crawler discovery */}
      <div className="mt-12 flex justify-center gap-4">
        {parseInt(currentPage) > 1 && (
          <a href={`/genre/${slug}?page=${parseInt(currentPage) - 1}`} className="px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition font-bold text-sm">
            Previous Page
          </a>
        )}
        <a href={`/genre/${slug}?page=${parseInt(currentPage) + 1}`} className="px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition font-bold text-sm">
          Next Page
        </a>
      </div>
    </div>
  );
}
