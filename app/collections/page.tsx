'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { Search, X, Film, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getImageUrl } from '@/lib/tmdb';
import { getDynamicCollectionsAction, searchCollectionsAction } from '@/app/actions';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';
import Image from 'next/image';
import { BackButton } from '@/components/ui/BackButton';

function CollectionCard({ collection }: { collection: any }) {
  return (
    <Link
      href={`/collection/${generateSlug(collection.id.toString(), collection.name)}`}
      className="relative flex flex-col group/card rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 border border-zinc-800/80 shadow-lg"
      style={{ aspectRatio: '16/9' }}
    >
      {/* Backdrop image */}
      {collection.backdrop_path ? (
        <Image
          src={getImageUrl(collection.backdrop_path, 'w780')}
          alt={collection.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover/card:scale-[1.05]"
        />
      ) : collection.poster_path ? (
        <div className="absolute inset-0 bg-void-900">
           <Image
            src={getImageUrl(collection.poster_path, 'w500')}
            alt={collection.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover opacity-40 blur-xl scale-125 transition-transform duration-700 group-hover/card:scale-[1.15]"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-void-800 to-void-950 flex items-center justify-center">
          <Film className="text-zinc-700" size={32} />
        </div>
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
      {/* Active scale effect on hover */}
      <div className="absolute inset-0 border border-white/0 group-hover/card:border-white/15 rounded-2xl transition-colors duration-300" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 flex flex-col items-start">
        <h3 className="text-white font-display font-bold text-lg md:text-xl leading-tight line-clamp-1 group-hover/card:text-brand-400 transition-colors">
          {collection.name.replace(' Collection', '')}
        </h3>
        {collection.overview && (
          <p className="text-zinc-400 text-xs mt-1 leading-snug line-clamp-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
             {collection.overview}
          </p>
        )}
      </div>
    </Link>
  );
}

function CollectionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce query
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('');
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute Search or Load Dynamic Collections
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    setLoading(true);
    setPage(1);
      
    if (trimmed.length >= 2) {
      if (searchParams.get('q') !== trimmed) {
        router.replace(`/collections?q=${encodeURIComponent(trimmed)}`);
      }
      
      searchCollectionsAction(trimmed, 1)
        .then(res => {
          if (res) {
            setCollections(res.results || []);
            setHasMore(res.page < res.total_pages);
          }
          setLoading(false);
        })
        .catch(() => {
          setCollections([]);
          setLoading(false);
        });
    } else {
      if (searchParams.get('q')) {
        router.replace('/collections');
      }
      
      // Load the dynamic feed
      getDynamicCollectionsAction(1)
        .then(res => {
          setCollections(res.results || []);
          setHasMore(res.page < res.total_pages);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [debouncedQuery, router, searchParams]);

  // Load More Results (Infinite Scroll)
  const loadMoreResults = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const trimmed = debouncedQuery.trim();
    
    const fetchAction = trimmed.length >= 2 
      ? searchCollectionsAction(trimmed, nextPage)
      : getDynamicCollectionsAction(nextPage);
      
    fetchAction
      .then(res => {
        if (res && res.results) {
          setCollections(prev => {
            const combined = [...prev, ...res.results];
            return combined.filter((item, index, self) =>
              index === self.findIndex((t) => t.id === item.id)
            );
          });
          setHasMore(nextPage < res.total_pages);
        } else {
          setHasMore(false);
        }
        setPage(nextPage);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  };

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreResults();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [hasMore, loading, loadingMore, page, debouncedQuery]);

  const isSearching = debouncedQuery.trim().length >= 2;
  const showEmpty = !loading && collections.length === 0;

  return (
    <div className="flex flex-col min-h-screen pt-[64px] md:pt-[72px]">
      <AnimatedBackground />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 p-4 md:p-8 overflow-x-hidden min-h-[50vh]">
        <div className="max-w-[1600px] mx-auto w-full">
           {/* Header Section */}
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
             <div>
               <div className="mb-4">
                 <BackButton href="/" />
               </div>
               <h1 className="text-3xl md:text-5xl font-display font-black text-white flex items-center gap-3">
                 <Sparkles className="text-brand-500" size={32} />
                 Collections
               </h1>
               <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-xl">
                 {isSearching 
                   ? `Found ${collections.length} collections matching "${query}"` 
                   : `Search for any collection worldwide—Hollywood, Bollywood, K-Drama, Anime, and more! For now, we are showing our top curated and most popular collections below.`}
               </p>
             </div>

             <div className="relative w-full md:w-96 flex-shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input 
                   value={query}
                   onChange={e => setQuery(e.target.value)}
                   placeholder="Search franchises..."
                   className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-10 text-white placeholder-white/40 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all text-base shadow-inner"
                />
                {query && (
                   <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10">
                     <X size={16} />
                   </button>
                )}
             </div>
           </div>
           
           {/* Grid */}
           {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="aspect-[16/9] bg-white/5 rounded-2xl animate-pulse" />
                ))}
             </div>
           ) : showEmpty ? (
             <div className="flex flex-col items-center justify-center mt-32 opacity-60">
                <Search size={48} className="text-white/20 mb-6" />
                <p className="text-2xl font-display font-bold text-white mb-2">No collections found</p>
                <p className="text-white/50 text-sm text-center max-w-sm">
                  We couldn&apos;t find any collections matching &quot;{query}&quot;. Try a different franchise name.
                </p>
             </div>
           ) : (
             <>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                 <AnimatePresence mode="popLayout">
                   {collections.map((item, i) => (
                     <motion.div
                       key={item.id}
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       transition={{ duration: 0.25, delay: i * 0.03 }}
                     >
                       <CollectionCard collection={item} />
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>

               {/* Pagination Sentinel */}
               {hasMore && (
                 <div ref={sentinelRef} className="flex flex-col items-center justify-center mt-16 pb-12 w-full">
                   <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                     <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin border-brand-500" />
                     <span className="text-sm font-semibold text-white/50">Generating more collections...</span>
                   </div>
                 </div>
               )}
             </>
           )}
        </div>
      </main>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen pt-[64px] md:pt-[72px]">
        <AnimatedBackground />
        <main className="flex-1 p-4 md:p-8">
           <div className="max-w-[1600px] mx-auto w-full">
             <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse mb-8" />
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="aspect-[16/9] bg-white/5 rounded-2xl animate-pulse" />
                ))}
             </div>
           </div>
        </main>
      </div>
    }>
      <CollectionsPageContent />
    </Suspense>
  );
}
