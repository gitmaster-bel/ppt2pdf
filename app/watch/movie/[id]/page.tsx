import { Metadata } from 'next';
import { tmdb } from '@/lib/tmdb';
import { MovieClient } from './MovieClient';
import { MediaGrid } from '@/components/media/MediaGrid';
import { generateSlug } from '@/lib/utils';

// ─── ISR DISABLED ─────────────────────────────────────────────────────────────
// revalidate = false → once rendered, cached forever. Movie data doesn't change.
// This eliminates ISR Writes entirely for movie pages (was the #1 cost driver).
export const revalidate = false;

// generateStaticParams REMOVED — stop pre-building pages at build time.
// On-demand rendering + infinite cache = zero ISR Writes after first visit.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const rawId = id.split('-')[0];
  const movie = await tmdb.getDetails('movie', rawId);

  return {
    title: movie.title ? `${movie.title}` : 'Watch Movie',
    robots: { index: false, follow: false },
  };
}

export default async function WatchMovie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawId = id.split('-')[0];
  const movie = await tmdb.getDetails('movie', rawId);
  const similar = movie.similar?.results?.slice(0, 18) || [];

  return (
    <div className="flex flex-col gap-8 w-full pt-28 md:pt-32 pb-28 md:pb-20">
      <MovieClient movie={movie} />
      {similar.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 w-full">
          <MediaGrid title="More Like This" items={similar} />
        </div>
      )}
    </div>
  );
}
