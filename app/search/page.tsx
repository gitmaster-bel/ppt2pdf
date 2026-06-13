'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { Media } from '@/types/tmdb';
import { Search, History, Sparkles, X, LayoutGrid, Film, Tv, ArrowDownUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSearchSuggestions } from '@/app/actions';
import { storage } from '@/lib/storage';
import { usePreferences } from '@/hooks/usePreferences';
import { MediaCard } from '@/components/media/MediaCard';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Suggestions
  const [suggestions, setSuggestions] = useState<Media[]>([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' or 'newest'

  const { preferences } = usePreferences();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch recent search history on mount
  useEffect(() => {
    setHistory(storage.get().searchHistory || []);
    
    // Fetch popular suggestions for empty/no-results page
    getSearchSuggestions().then(res => {
      setSuggestions(res.slice(0, 12));
    }).catch(err => console.error("Error fetching suggestions:", err));
  }, []);

  const addToHistory = (q: string) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item !== q);
      const next = [q, ...filtered].slice(0, 5);
      storage.set({ searchHistory: next });
      return next;
    });
  };

  const removeFromHistory = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const next = prev.filter(item => item !== q);
      storage.set({ searchHistory: next });
      return next;
    });
  };

  // Debounce query input - instant clear if query becomes empty
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('');
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute Search on debounced query change
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length >= 2) {
      setLoading(true);
      setPage(1);
      
      if (searchParams.get('q') !== trimmed) {
        router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
      }
      
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}&page=1&include_adult=${preferences.adultContent}`)
        .then(res => res.json())
        .then(res => {
          setResults(res.results || []);
          setTotalPages(res.total_pages || 1);
          setHasMore(res.page < res.total_pages);
          setLoading(false);
          if (res.results && res.results.length > 0) {
            addToHistory(trimmed);
          }
        })
        .catch(err => {
          console.error("Search error:", err);
          setResults([]);
          setLoading(false);
        });
    } else {
      if (searchParams.get('q')) {
        router.replace('/search');
      }
      setResults([]);
      setPage(1);
      setTotalPages(1);
      setHasMore(false);
    }
  }, [debouncedQuery, preferences.adultContent, router, searchParams]);

  // Pagination Load More
  const loadMoreResults = () => {
    const trimmed = debouncedQuery.trim();
    if (loadingMore || !hasMore || trimmed.length < 2) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    fetch(`/api/search?q=${encodeURIComponent(trimmed)}&page=${nextPage}&include_adult=${preferences.adultContent}`)
      .then(res => res.json())
      .then(res => {
        if (res.results && res.results.length > 0) {
          setResults(prev => {
            const combined = [...prev, ...res.results];
            return combined.filter((item, index, self) =>
              index === self.findIndex((t) => t.id === item.id)
            );
          });
        }
        setPage(nextPage);
        setHasMore(nextPage < (res.total_pages || 1));
        setLoadingMore(false);
      })
      .catch(err => {
        console.error("Failed to load more results:", err);
        setLoadingMore(false);
      });
  };

  // IntersectionObserver for Infinite Scroll
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
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loading, loadingMore, page, debouncedQuery]);

  // Apply local filters & sorting
  const filteredResults = results.filter(item => {
    if (typeFilter === 'anime') {
      const isAnimation = item.genre_ids?.includes(16);
      const isJapanese = item.original_language === 'ja';
      return isAnimation && isJapanese;
    }
    if (typeFilter !== 'all' && item.media_type !== typeFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
      const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
      return dateB - dateA;
    }
    return 0; // relevance (TMDB popularity score from combined API)
  });

  const showEmpty = !loading && filteredResults.length === 0 && debouncedQuery.trim().length >= 2;

  return (
    <div className="relative flex flex-col gap-6 pb-28 md:pb-12 pt-[12vh] md:pt-[20vh] min-h-screen">
      <AnimatedBackground />

      <div className="max-w-3xl mx-auto w-full flex flex-col items-center px-4 relative z-10">
        
        {/* Heading */}
        <h1 className="text-4xl md:text-[46px] font-display font-bold tracking-tight text-white mb-8 text-center drop-shadow-md">
          What would you like to watch?
        </h1>

        {/* Search Mode Pills */}
        <div className="flex items-center p-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/15 mb-10 shadow-lg">
          <button className="flex items-center gap-2 bg-premium-gradient hover:bg-premium-gradient-dark px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all shadow-md shadow-brand-500/25">
            <Search size={16} /> Title Search
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white/50 hover:text-white/90 hover:bg-white/5 transition-all">
            <Sparkles size={16} /> AI Search
          </button>
        </div>

        {/* Search Input Container */}
        <div className="relative w-full max-w-2xl transition-all duration-300">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search size={22} className="text-white/50" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search for movies & TV shows..."
            className="w-full py-4 md:py-5 pl-16 pr-16 text-base md:text-xl font-medium text-white placeholder-white/45 outline-none rounded-full"
            style={{
              background: focused ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.07)',
              backdropFilter: 'blur(30px)',
              border: focused ? '1px solid color-mix(in srgb, var(--brand-500) 45%, transparent)' : '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: focused ? '0 0 40px color-mix(in srgb, var(--brand-500) 25%, transparent)' : '0 20px 40px rgba(0,0,0,0.4)',
              transition: 'all 0.3s ease',
            }}
          />

          {loading ? (
            <div className="absolute inset-y-0 right-6 flex items-center">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin border-white/30 border-t-white" />
            </div>
          ) : query.length > 0 ? (
            <button 
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-6 flex items-center text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          ) : null}
        </div>

        {/* Filters Row (Only visible when searching) */}
        {query.length >= 2 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 w-full relative z-20">
            <button 
              onClick={() => setTypeFilter('all')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                typeFilter === 'all' ? 'bg-white/15 border-white/20 text-white shadow-md' : 'bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <LayoutGrid size={14} /> All
            </button>
            <button 
              onClick={() => setTypeFilter('movie')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                typeFilter === 'movie' ? 'bg-white/15 border-white/20 text-white shadow-md' : 'bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <Film size={14} /> Movies
            </button>
            <button 
              onClick={() => setTypeFilter('tv')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                typeFilter === 'tv' ? 'bg-white/15 border-white/20 text-white shadow-md' : 'bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <Tv size={14} /> Series
            </button>
            <button 
              onClick={() => setTypeFilter('anime')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                typeFilter === 'anime' ? 'bg-white/15 border-white/20 text-white shadow-md' : 'bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <Sparkles size={14} /> Anime
            </button>
            
            <div className="w-[1px] h-5 bg-white/10 mx-2"></div>

            <button 
              onClick={() => setSortBy(sortBy === 'relevance' ? 'newest' : 'relevance')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white/80 transition-all"
            >
              <ArrowDownUp size={14} /> {sortBy === 'relevance' ? 'Relevance' : 'Newest'}
            </button>

            <button 
              onClick={() => { setTypeFilter('all'); setSortBy('relevance'); }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium text-white/30 hover:text-white/60 transition-colors ml-1"
            >
              <X size={12} /> Clear
            </button>
          </div>
        )}

      </div>

      {/* History Area */}
      {!query && history.length > 0 && (
        <div className="max-w-3xl mx-auto w-full mt-12 px-8 relative z-10">
          <h3 className="flex items-center gap-2 text-xs font-bold text-brand-500 uppercase tracking-widest mb-6">
            <History size={14} className="text-brand-500" /> Recent Searches
          </h3>
          <div className="flex flex-wrap gap-3">
            {history.map(item => (
              <div
                key={item}
                onClick={() => setQuery(item)}
                className="group flex items-center gap-3 bg-white/8 hover:bg-white/12 border border-white/10 px-5 py-2.5 rounded-full cursor-pointer transition-all"
              >
                <span className="text-sm font-medium text-white/85 group-hover:text-white">{item}</span>
                <button
                  onClick={(e) => removeFromHistory(item, e)}
                  className="text-white/30 hover:text-brand-500 p-0.5 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="w-full max-w-[1600px] mx-auto px-4 mt-6 relative z-10">
        {query.trim().length < 2 ? (
          <div className="flex flex-col items-center justify-center mt-12">
            <div className="flex flex-col items-center justify-center opacity-40 text-center mb-16">
              <Search size={40} className="mb-4 text-white/30" />
              <p className="text-lg font-bold text-white mb-1">Search the library</p>
              <p className="text-xs text-white/60">Type a title or keyword to begin searching.</p>
            </div>
            
            {suggestions.length > 0 && (
              <div className="w-full max-w-6xl border-t border-white/5 pt-10">
                <h3 className="flex items-center gap-2 text-xs font-bold text-brand-500 uppercase tracking-widest mb-6 px-2">
                  <Sparkles size={14} className="text-brand-500" /> Trending Right Now
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {suggestions.slice(0, 12).map((item, i) => (
                    <motion.div
                      key={`suggestion-welcome-${item.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                    >
                      <MediaCard media={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center justify-center mt-12 mb-16">
            <div className="flex flex-col items-center justify-center opacity-60 mb-12">
              <Search size={40} className="text-white/20 mb-4" />
              <p className="text-lg font-bold text-white mb-1">No results found</p>
              <p className="text-white/50 text-xs max-w-sm text-center">
                We couldn&apos;t find any matches for &quot;{query}&quot;.
              </p>
            </div>
            
            {suggestions.length > 0 && (
              <div className="w-full max-w-6xl border-t border-white/5 pt-10">
                <h3 className="flex items-center gap-2 text-xs font-bold text-brand-500 uppercase tracking-widest mb-6 px-2">
                  <Sparkles size={14} className="text-brand-500" /> Trending Right Now
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {suggestions.slice(0, 12).map((item, i) => (
                    <motion.div
                      key={`suggestion-empty-${item.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                    >
                      <MediaCard media={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs font-medium text-white/40 mb-4 px-2">
              {filteredResults.length} results {typeFilter !== 'all' ? `(${typeFilter === 'movie' ? 'movies' : 'series'} only)` : ''}
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {filteredResults.map((item, i) => (
                  <motion.div
                    key={`${item.media_type}-${item.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: i * 0.02 }}
                  >
                    <MediaCard media={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Sentinel & Load More */}
            {hasMore && (
              <div ref={sentinelRef} className="flex flex-col items-center justify-center mt-12 pb-8 w-full">
                {loadingMore ? (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-full shadow-lg">
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-brand-500" />
                    <span className="text-xs font-semibold text-white/70">Loading more titles...</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMoreResults}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-full text-xs font-semibold text-white transition-all shadow-md active:scale-95"
                  >
                    Load More Results
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="relative flex flex-col gap-6 pb-28 md:pb-12 pt-[12vh] md:pt-[20vh] min-h-screen">
        <AnimatedBackground />
        <div className="max-w-3xl mx-auto w-full flex flex-col items-center px-4 relative z-10">
          <div className="h-12 w-72 bg-white/5 rounded-xl animate-pulse mb-8" />
          <div className="h-16 w-full max-w-2xl bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
