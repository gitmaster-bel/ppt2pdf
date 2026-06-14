import { Metadata } from 'next';
import { tmdb } from '@/lib/tmdb';
import { TvPlayer } from './TvPlayer';
import { MediaGrid } from '@/components/media/MediaGrid';

// ─── ISR DISABLED ─────────────────────────────────────────────────────────────
// revalidate = false → once rendered, cached forever. TV show metadata is static.
// New episodes are handled client-side by TvPlayer. Zero ISR Writes.
export const revalidate = false;

// generateStaticParams REMOVED — stop pre-building pages at build time.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const rawId = id.split('-')[0];
  const show = await tmdb.getDetails('tv', rawId);

  return {
    title: show.name ? `${show.name}` : 'Watch TV Show',
    robots: { index: false, follow: false },
  };
}

export default async function WatchTv({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawId = id.split('-')[0];
  const show = await tmdb.getDetails('tv', rawId);
  const similar = show.similar?.results?.slice(0, 18) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 pt-28 md:pt-32 pb-28 md:pb-20 flex flex-col gap-8 w-full">
      <TvPlayer show={show} />

      {similar.length > 0 && (
        <div className="mt-12 border-t border-zinc-800 pt-8">
          <MediaGrid title="More Like This" items={similar} />
        </div>
      )}
    </div>
  );
}
