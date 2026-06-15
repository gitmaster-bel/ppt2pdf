'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Search, Film, Tv, Star, TrendingUp, Loader2, ArrowRight, User, Globe, Calendar, Compass, Shuffle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface AISearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  popularity: number;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
}

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function AISearchModal({ isOpen, onClose }: AISearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parsed, setParsed] = useState<{ type?: string; genres?: number[]; sort?: string; year?: string; keywords?: string; similarTitle?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activePromptIdx, setActivePromptIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setHasSearched(false);
      setError(null);
      setParsed(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.results || []);
      setParsed(data.parsed || null);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    search(query);
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    search(s);
  };

  const getTitle = (item: AISearchResult) => item.title || item.name || 'Unknown';
  const getYear = (item: AISearchResult) => {
    const date = item.release_date || item.first_air_date;
    return date ? date.slice(0, 4) : '';
  };
  const getHref = (item: AISearchResult) =>
    item.media_type === 'movie'
      ? `/watch/movie/${item.id}`
      : `/watch/tv/${item.id}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-search-backdrop-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center pt-[5vh] sm:pt-[8vh] px-4 pb-4 overflow-hidden"
        >
          {/* Backdrop Blur Layer - Isolated to avoid repaint thrashing on scroll */}
          <div 
            className="absolute inset-0 -z-10 cursor-pointer"
            style={{ 
              background: 'rgba(5, 5, 10, 0.85)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
            onClick={onClose}
          />

          <motion.div
            key="ai-search-panel"
            initial={{ opacity: 0, y: -30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl flex flex-col gap-5 max-h-[90vh] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/30 to-purple-500/30 border border-brand-500/30 flex items-center justify-center">
                  <Sparkles size={14} className="text-brand-400" />
                </div>
                <div>
                  <h2 className="text-white font-display font-black text-lg leading-none tracking-tight">AI Search</h2>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mt-0.5">Natural language · Powered by TMDB</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95 border border-white/5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSubmit}>
              <div className="relative group">
                <div
                  className="absolute -inset-0.5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, var(--brand-500), #a855f7)', filter: 'blur(8px)' }}
                />
                <div className="relative bg-[#0e0e16] border border-zinc-800/80 group-focus-within:border-brand-500/60 rounded-2xl transition-colors overflow-hidden">
                  <div className="flex items-center px-4 py-3.5 gap-3">
                    {isLoading ? (
                      <Loader2 size={18} className="text-brand-400 shrink-0 animate-spin" />
                    ) : (
                      <Search size={18} className="text-zinc-500 group-focus-within:text-brand-400 shrink-0 transition-colors" />
                    )}
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={handleInput}
                      placeholder="Try: best horror movies, romantic comedies 2023, popular sci-fi shows..."
                      className="flex-1 bg-transparent text-white placeholder:text-zinc-600 text-[15px] focus:outline-none"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => { setQuery(''); setResults([]); setHasSearched(false); inputRef.current?.focus(); }}
                        className="text-zinc-500 hover:text-white transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {/* Parsed tags */}
                  {parsed && (
                    <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                      {parsed.type && parsed.type !== 'both' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                          {parsed.type === 'movie' ? <Film size={9} /> : <Tv size={9} />}
                          {parsed.type}
                        </span>
                      )}
                      {parsed.sort === 'vote_average.desc' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <Star size={9} /> Top Rated
                        </span>
                      )}
                      {parsed.sort === 'popularity.desc' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <TrendingUp size={9} /> Popular
                        </span>
                      )}
                      {parsed.year && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 px-2 py-0.5 rounded-full">
                          {parsed.year}
                        </span>
                      )}
                      {parsed.similarTitle && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                          <Sparkles size={9} /> Like: {parsed.similarTitle}
                        </span>
                      )}
                      {parsed.keywords && parsed.keywords.length > 2 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          <Search size={9} /> {parsed.keywords}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Suggestions — Interactive AI Prompt Inspiration Deck */}
            {!hasSearched && !isLoading && (
              <div className="w-full bg-[#0d0d15]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
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
                    onClick={() => handleSuggestion(EXTREME_PROMPTS[activePromptIdx].text)}
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
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div 
                className="flex flex-col gap-3 overflow-y-auto max-h-[56vh] custom-scrollbar overscroll-contain" 
                style={{ 
                  scrollbarWidth: 'thin',
                  WebkitOverflowScrolling: 'touch',
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 shrink-0">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {results.map((item, i) => (
                    <motion.div
                      key={`${item.media_type}-${item.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                    >
                      <Link
                        href={getHref(item)}
                        onClick={onClose}
                        className="group flex items-center gap-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/70 hover:border-zinc-700 rounded-xl p-3 transition-all active:scale-[0.98]"
                      >
                        {/* Poster */}
                        <div className="w-12 h-[72px] rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                          {item.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                              alt={getTitle(item)}
                              width={48}
                              height={72}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              {item.media_type === 'movie' ? <Film size={18} /> : <Tv size={18} />}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                              {item.media_type === 'movie' ? 'Movie' : 'Series'}
                            </span>
                            {getYear(item) && (
                              <span className="text-[9px] text-zinc-600">{getYear(item)}</span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white leading-tight truncate group-hover:text-brand-400 transition-colors">
                            {getTitle(item)}
                          </h3>
                          {item.overview && (
                            <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mt-0.5">
                              {item.overview}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            {item.vote_average > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                                <Star size={9} className="fill-amber-400" />
                                {item.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight size={14} className="text-zinc-600 group-hover:text-brand-400 shrink-0 transition-colors" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {hasSearched && !isLoading && results.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Search size={20} className="text-zinc-600" />
                </div>
                <div>
                  <p className="text-white font-bold">No results found</p>
                  <p className="text-zinc-500 text-sm mt-1">Try a different query like "best thriller movies" or "popular anime series"</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
