'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { Media } from '@/types/tmdb';
import { Search, History, Sparkles, X, LayoutGrid, Film, Tv, ArrowDownUp, Star, User, Globe, Calendar, Compass, Shuffle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSearchSuggestions } from '@/app/actions';
import { storage } from '@/lib/storage';
import { usePreferences } from '@/hooks/usePreferences';
import { MediaCard } from '@/components/media/MediaCard';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

const EXTREME_PROMPTS = [
  {
    text: "best Hindi action thriller movies starring Nawazuddin Siddiqui in 2010s",
    tags: ["Actor", "Genres", "Language", "Decade", "Rating"],
    description: "Combines cast credits, multiple genres, native language, decade ranges, and high rating sorting."
  },
  {
    text: "underrated 90s sci-fi movies similar to The Matrix",
    tags: ["Decade", "Genre", "Similarity", "Underrated"],
    description: "Filters by release decade, sci-fi genre, similar movies recommendations, and underrated quality filter."
  },
  {
    text: "top rated classic French romantic comedy films from 80s",
    tags: ["Rating", "Classic", "Language", "Genres", "Decade"],
    description: "Finds French films from the 1980s, combining romance/comedy, and sorts by highest Bayesian rating."
  },
  {
    text: "popular action sci-fi shows like Stranger Things",
    tags: ["Popularity", "Genres", "Similarity", "TV Show"],
    description: "Performs popularity-based recommendation for action/sci-fi TV series resembling a specific title."
  },
  {
    text: "best Korean drama series with high rating from 2020s",
    tags: ["Rating", "Language", "Genre", "Decade"],
    description: "Finds top-rated Korean drama series released in the current decade."
  },
  {
    text: "movies directed by Christopher Nolan in the 2010s",
    tags: ["Director", "Decade", "Movies"],
    description: "Finds movies where Nolan is credited in directing department, filtered strictly to the 2010s."
  },
  {
    text: "underrated Japanese anime movies similar to Naruto before 2010",
    tags: ["Underrated", "Language", "Anime", "Similarity", "Year Modifier"],
    description: "Applies comparative year constraints, Japanese original language, anime genre, similarity, and rating filters."
  },
  {
    text: "adult erotic thriller movies starring Sharon Stone from 1990s",
    tags: ["Adult Filter", "Genre", "Actor", "Decade"],
    description: "Unlocks adult content filter, matching specified actor and genre within the 1990s."
  }
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialMode = searchParams.get('mode') === 'ai' ? 'ai' : 'title';

  const [searchMode, setSearchMode] = useState<'title' | 'ai'>(initialMode);
  const [aiParsed, setAiParsed] = useState<any>(null);
  const [activePromptIdx, setActivePromptIdx] = useState(0);

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
      
      const modeParam = searchMode === 'ai' ? '&mode=ai' : '';
      const newUrl = `/search?q=${encodeURIComponent(trimmed)}${modeParam}`;
      if (searchParams.get('q') !== trimmed || (searchMode === 'ai' && searchParams.get('mode') !== 'ai') || (searchMode === 'title' && searchParams.get('mode') === 'ai')) {
        router.replace(newUrl);
      }
      
      const endpoint = searchMode === 'ai'
        ? `/api/ai-search?q=${encodeURIComponent(trimmed)}`
        : `/api/search?q=${encodeURIComponent(trimmed)}&page=1&include_adult=${preferences.adultContent}`;

      fetch(endpoint)
        .then(res => res.json())
        .then(res => {
          setResults(res.results || []);
          if (searchMode === 'ai') {
            setAiParsed(res.parsed || null);
            setTotalPages(1);
            setHasMore(false);
          } else {
            setAiParsed(null);
            setTotalPages(res.total_pages || 1);
            setHasMore(res.page < res.total_pages);
          }
          setLoading(false);
          if (res.results && res.results.length > 0) {
            addToHistory(trimmed);
          }
        })
        .catch(err => {
          console.error("Search error:", err);
          setResults([]);
          setAiParsed(null);
          setLoading(false);
        });
    } else {
      const modeParam = searchMode === 'ai' ? '?mode=ai' : '';
      if (searchParams.get('q') || (searchMode === 'ai' && searchParams.get('mode') !== 'ai') || (searchMode === 'title' && searchParams.get('mode') === 'ai')) {
        router.replace(`/search${modeParam}`);
      }
      setResults([]);
      setAiParsed(null);
      setPage(1);
      setTotalPages(1);
      setHasMore(false);
    }
  }, [debouncedQuery, preferences.adultContent, router, searchParams, searchMode]);

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
        <div className="relative flex items-center p-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/15 mb-10 shadow-lg select-none">
          <button 
            onClick={() => {
              setSearchMode('title');
              setResults([]);
              setAiParsed(null);
              const trimmed = query.trim();
              if (trimmed) {
                router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
              } else {
                router.replace('/search');
              }
            }}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
              searchMode === 'title' 
                ? 'text-white cursor-default' 
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            {searchMode === 'title' && (
              <motion.div 
                layoutId="activeSearchMode"
                className="absolute inset-0 bg-premium-gradient rounded-full -z-10 shadow-md shadow-brand-500/25"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 select-none">
              <Search size={16} /> Title Search
            </span>
          </button>
          <button 
            onClick={() => {
              setSearchMode('ai');
              setResults([]);
              setAiParsed(null);
              const trimmed = query.trim();
              if (trimmed) {
                router.replace(`/search?q=${encodeURIComponent(trimmed)}&mode=ai`);
              } else {
                router.replace('/search?mode=ai');
              }
            }}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
              searchMode === 'ai' 
                ? 'text-white cursor-default' 
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            {searchMode === 'ai' && (
              <motion.div 
                layoutId="activeSearchMode"
                className="absolute inset-0 bg-premium-gradient rounded-full -z-10 shadow-md shadow-brand-500/25"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 select-none">
              <Sparkles size={16} /> AI Search
            </span>
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
            placeholder={searchMode === 'ai' ? "Ask AI: feel good comedies, mind-blowing sci-fi, dark crime..." : "Search for movies & TV shows..."}
            className="w-full py-4 md:py-5 pl-16 pr-16 text-base md:text-xl font-medium text-white placeholder-white/45 outline-none rounded-full animate-in fade-in duration-300"
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

        {/* AI Search Matched Intent Tags */}
        <AnimatePresence>
          {searchMode === 'ai' && aiParsed && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex flex-wrap items-center justify-center gap-2 mt-5 w-full relative z-20 overflow-hidden"
            >
              {aiParsed.type && aiParsed.type !== 'both' && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full shadow-md">
                  {aiParsed.type === 'movie' ? <Film size={10} /> : <Tv size={10} />}
                  {aiParsed.type}
                </span>
              )}
              {aiParsed.genres && aiParsed.genres.length > 0 && aiParsed.genres.map((gId: number) => {
                const genreMap: Record<number, string> = { 28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10752: 'War', 37: 'Western' };
                return genreMap[gId] ? (
                  <span key={gId} className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shadow-md">
                    {genreMap[gId]}
                  </span>
                ) : null;
              })}
              {aiParsed.person && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full shadow-md">
                  Person: {aiParsed.person}
                </span>
              )}
              {aiParsed.language && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full shadow-md">
                  Lang: {aiParsed.language}
                </span>
              )}
              {aiParsed.decade && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full shadow-md">
                  Decade: {aiParsed.decade}
                </span>
              )}
              {aiParsed.year && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full shadow-md">
                  Year: {aiParsed.year}
                </span>
              )}
              {aiParsed.isUnderrated && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full shadow-md">
                  Underrated Gems
                </span>
              )}
              {aiParsed.isOverrated && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full shadow-md">
                  Overrated (Controversial)
                </span>
              )}
              {aiParsed.isClassic && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full shadow-md">
                  Classic
                </span>
              )}
              {aiParsed.isAdult && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full shadow-md">
                  Adult Content
                </span>
              )}
              {aiParsed.sort && aiParsed.sort.includes('vote_average') && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full shadow-md">
                  <Star size={10} className="fill-yellow-400/20" /> Best Rated
                </span>
              )}
              {aiParsed.similarTitle && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full shadow-md">
                  Like: {aiParsed.similarTitle}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Row (Only visible when searching in title mode) */}
        {searchMode === 'title' && query.length >= 2 && (
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

      {/* Suggested AI Queries and Search History with AnimatePresence */}
      <AnimatePresence mode="wait">
        {searchMode === 'ai' && !query ? (
          <motion.div
            key="ai-suggestions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl mx-auto w-full mt-12 px-4 relative z-10"
          >
            <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden group">
              {/* Decorative background glows */}
              <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-brand-500/10 blur-[80px] pointer-events-none group-hover:bg-brand-500/15 transition-all duration-500" />
              <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none group-hover:bg-purple-500/15 transition-all duration-500" />

              {/* Top Row: Title & Index */}
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-brand-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">AI Prompt Inspiration</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-zinc-500">
                  {activePromptIdx + 1} / {EXTREME_PROMPTS.length}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <AnimatePresence mode="popLayout">
                  {EXTREME_PROMPTS[activePromptIdx].tags.map((tag) => {
                    let colorClass = "text-zinc-400 bg-zinc-800/40 border-zinc-700/30";
                    const tLower = tag.toLowerCase();
                    if (tLower.includes("actor") || tLower.includes("director")) {
                      colorClass = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                    } else if (tLower.includes("genre") || tLower.includes("anime")) {
                      colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                    } else if (tLower.includes("language")) {
                      colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                    } else if (tLower.includes("decade") || tLower.includes("year")) {
                      colorClass = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                    } else if (tLower.includes("rating") || tLower.includes("underrated") || tLower.includes("popularity")) {
                      colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    } else if (tLower.includes("similarity")) {
                      colorClass = "text-pink-400 bg-pink-500/10 border-pink-500/20";
                    } else if (tLower.includes("adult")) {
                      colorClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                    }
                    
                    return (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className={`text-[9px] font-bold uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${colorClass}`}
                      >
                        {tag}
                      </motion.span>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Prompt Text Container with Animation */}
              <div className="min-h-[70px] flex flex-col justify-center mb-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePromptIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-white text-base md:text-lg font-medium leading-relaxed font-display italic group-hover:text-brand-350 transition-colors">
                      &ldquo;{EXTREME_PROMPTS[activePromptIdx].text}&rdquo;
                    </p>
                    <p className="text-zinc-500 text-xs">
                      {EXTREME_PROMPTS[activePromptIdx].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const promptText = EXTREME_PROMPTS[activePromptIdx].text;
                    setQuery(promptText);
                    setDebouncedQuery(promptText);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20"
                >
                  <Sparkles size={13} /> Try Query
                </button>
                <button
                  onClick={() => {
                    setActivePromptIdx((prev) => (prev + 1) % EXTREME_PROMPTS.length);
                  }}
                  className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
                >
                  <Shuffle size={12} /> Shuffle
                </button>
              </div>
            </div>
          </motion.div>
        ) : searchMode === 'title' && !query && history.length > 0 ? (
          <motion.div
            key="title-history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="max-w-3xl mx-auto w-full mt-12 px-8 relative z-10"
          >
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
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Content Section with AnimatePresence */}
      <div className="w-full max-w-[1600px] mx-auto px-4 mt-6 relative z-10">
        <AnimatePresence mode="wait">
          {query.trim().length < 2 ? (
            <motion.div
              key="welcome-prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center mt-12"
            >
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
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mt-4"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
              ))}
            </motion.div>
          ) : showEmpty ? (
            <motion.div
              key="empty-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center mt-12 mb-16"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="results-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
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
