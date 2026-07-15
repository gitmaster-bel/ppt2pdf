
import { tmdb, getImageUrl } from '@/lib/tmdb';
import { MediaGrid } from '@/components/media/MediaGrid';
import { generateSlug } from '@/lib/utils';
import Image from 'next/image';
import { BackButton } from '@/components/ui/BackButton';
import { CollectionShareButton } from '@/components/ui/CollectionShareButton';
import { COLLECTION_CATEGORIES } from '@/lib/collectionsData';
export const runtime = 'nodejs'; // Edge Runtime for zero ISR writes
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawId = id.split('-')[0];
  const collection = await tmdb.getCollection(rawId);
  
  return {
    title: collection?.name || 'Collection',
    robots: { index: false, follow: false },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawId = id.split('-')[0];
  const collection = await tmdb.getCollection(rawId);
  
  if (!collection) {
    return <div className="pt-32 text-center text-white">Collection not found.</div>;
  }

  // Map parts to Media type format so MediaGrid can render them
  const items = collection.parts.map((part: any) => ({
    ...part,
    media_type: 'movie'
  }));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Header */}
      <div className="relative w-full min-h-[350px] md:min-h-[420px] flex flex-col pt-24 pb-4">
        <div className="absolute inset-0 bg-void-950/80 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/60 to-transparent z-10 pointer-events-none" />
        
        {/* Real Backdrop */}
        {collection.backdrop_path ? (
          <Image
            src={getImageUrl(collection.backdrop_path, 'original')}
            alt={collection.name}
            fill
            priority
            className="object-cover object-top opacity-50 pointer-events-none"
          />
        ) : (
          /* Fallback Mosaic Backdrop if TMDB has no backdrop */
          <div className="absolute inset-0 flex flex-wrap opacity-20 blur-3xl scale-110 pointer-events-none overflow-hidden">
            {items.slice(0, 4).map((item: any) => (
              <div key={item.id} className="relative w-1/2 h-1/2">
                <Image 
                  src={getImageUrl(item.poster_path, 'w500', item.title || item.name, (item.release_date || item.first_air_date || '').substring(0, 4))} 
                  alt={item.title || item.name || 'Poster'} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-105"                />
              </div>
            ))}
          </div>
        )}
        
        <div className="relative z-20 flex-1 flex flex-col justify-end max-w-7xl mx-auto px-4 w-full h-full">
          {/* Back button now explicitly routes to Home so user starts at the top, avoiding footer flash */}
          <div className="mb-auto pt-4 md:pt-8">
            <BackButton href="/" />
          </div>

          <div className="mt-12 md:mt-auto">
            <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4 drop-shadow-lg leading-tight">
              {collection.name}
            </h1>
            <p className="text-zinc-300 max-w-3xl text-sm md:text-base leading-relaxed drop-shadow-md mb-6">
              {collection.overview}
            </p>
            <CollectionShareButton title={collection.name} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 w-full relative z-30 pb-20 pt-4">
        <MediaGrid title={`${items.length} Movies`} items={items} />
      </div>
    </div>
  );
}
