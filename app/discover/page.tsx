'use client';
import { useState, useEffect, useCallback } from 'react';
import { Media } from '@/types/tmdb';

import { MediaCard } from '@/components/media/MediaCard';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { FilterPill } from '@/components/ui/FilterPill';
import { Pagination } from '@/components/ui/Pagination';
import { usePreferences } from '@/hooks/usePreferences';
import { Filter, Shuffle, PlayCircle, SlidersHorizontal, SearchX } from 'lucide-react';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { MoodBoard } from '@/components/discover/MoodBoard';

export default function DiscoverPage() {
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [type, setType] = useState('all');
  const [genres, setGenres] = useState<string[]>([]);
  const [year, setYear] = useState('all');
  const [sort, setSort] = useState('popularity.desc');
  
  const { preferences } = usePreferences();

  // Stable reference to preferences that matter for fetching
  const adultContent = preferences.adultContent;
  const originalLanguage = preferences.originalLanguage;

  const fetchResults = useCallback((currentPage: number) => {
    setLoading(true);

    const buildParams = (targetType: string) => {
      const params: Record<string, string> = {
        sort_by: sort,
        include_adult: adultContent ? 'true' : 'false',
        page: currentPage.toString(),
      };
      
      if (targetType === 'anime') {
        params.with_genres = genres.length > 0 ? [...genres, '16'].join(',') : '16';
        params.with_original_language = 'ja';
      } else {
        if (originalLanguage?.length > 0) {
          params.with_original_language = originalLanguage.join('|');
        }
        if (genres.length > 0) {
          params.with_genres = genres.join(',');
        }
      }
      
      if (year !== 'all') {
        if (['2024', '2023', '2022'].includes(year)) {
          params.primary_release_year = year;
          params.first_air_date_year = year;
        } else {
          const ranges: Record<string, Record<string, string>> = {
            '2020s': { 'primary_release_date.gte': '2020-01-01', 'primary_release_date.lte': '2029-12-31' },
            '2010s': { 'primary_release_date.gte': '2010-01-01', 'primary_release_date.lte': '2019-12-31' },
            '2000s': { 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31' },
            'older': { 'primary_release_date.lte': '1999-12-31' },
          };
          Object.assign(params, ranges[year] || {});
        }
      }
      return params;
    };

    const fetchDiscover = (t: string, p: Record<string, string>) => {
      const searchParams = new URLSearchParams(p);
      return fetch(`/api/discover?type=${t}&${searchParams.toString()}`).then(res => res.json());
    };

    if (type === 'all') {
      Promise.all([
        fetchDiscover('movie', buildParams('movie')),
        fetchDiscover('tv', buildParams('tv')),
        fetchDiscover('tv', buildParams('anime'))
      ]).then(([moviesRes, tvRes, animeRes]) => {
        const mItems = (moviesRes.results || []).map((i: any) => ({ ...i, media_type: 'movie' }));
        const tItems = (tvRes.results || []).map((i: any) => ({ ...i, media_type: 'tv' }));
        const aItems = (animeRes.results || []).map((i: any) => ({ ...i, media_type: 'tv' }));
        
        // Interleave the results
        const combined = [];
        const maxLength = Math.max(mItems.length, tItems.length, aItems.length);
        for (let i = 0; i < maxLength; i++) {
          if (mItems[i]) combined.push(mItems[i]);
          if (tItems[i]) combined.push(tItems[i]);
          // To prevent duplication if anime already appeared in TV, we filter
          if (aItems[i] && !combined.some(c => c.id === aItems[i].id)) {
             combined.push(aItems[i]);
          }
        }
        
        // Remove duplicates entirely from combined array
        const uniqueCombined = Array.from(new Map(combined.map(item => [item.id, item])).values());
        
        setResults(uniqueCombined);
        setTotalPages(Math.min(Math.max(moviesRes.total_pages || 1, tvRes.total_pages || 1), 500));
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      const requestType = type === 'anime' ? 'tv' : type;
      fetchDiscover(requestType, buildParams(type)).then(res => {
        const items = res.results || [];
        setResults(items.map((i: any) => ({ ...i, media_type: type === 'anime' ? 'tv' : type })));
        setTotalPages(Math.min(res.total_pages || 1, 500));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [type, genres, year, sort, adultContent, originalLanguage]);

  useEffect(() => {
    fetchResults(page);
  }, [page, fetchResults]); // Only re-fetch when page changes, or fetchResults changes (which depends on filters)

  const handleApplyFilters = () => {
    setPage(1); // Reset page to 1
    fetchResults(1); // Force fetch immediately
  };

  const handleSurpriseMe = () => {
    setSort('popularity.desc');
    setGenres([]);
    setYear('all');
    setPage(Math.floor(Math.random() * 50) + 1);
  };

  return (
    <div className="relative min-h-screen pb-12 pt-28 px-4 md:px-12 lg:px-16 overflow-hidden">
      <AnimatedBackground />

      <FilterDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        type={type} setType={setType}
        genres={genres} setGenres={setGenres}
        year={year} setYear={setYear}
        sort={sort} setSort={setSort}
        onApply={handleApplyFilters}
      />

      {/* Header Area */}
      <div className="relative z-50 max-w-[1800px] mx-auto mb-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white drop-shadow-xl">
            Discover
          </h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className={`flex items-center gap-2 bg-void-900 border border-zinc-700 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-md hover:bg-zinc-800 active:scale-95 ${genres.length > 0 || year !== 'all' ? 'border-brand-500 text-brand-500' : ''}`}
            >
              <SlidersHorizontal size={16} />
              Filters {(genres.length > 0 || year !== 'all') && <span className="bg-premium-gradient text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">!</span>}
            </button>
            <button 
              onClick={handleSurpriseMe}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600/40 to-fuchsia-600/40 hover:from-purple-500/60 hover:to-fuchsia-500/60 border border-purple-500/30 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] backdrop-blur-md hover:scale-105 active:scale-95"
            >
              <Shuffle size={16} />
              Surprise Me
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto">
        <MoodBoard onSelectMood={(genreId) => {
          setGenres([genreId.toString()]);
          setPage(1);
        }} />
      </div>

      {/* Content Grid */}
      <div className="relative z-10 max-w-[1800px] mx-auto min-h-[50vh]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin border-brand-500/30 border-t-brand-500" />
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {results.map((item) => (
                <MediaCard key={item.id} media={item} />
              ))}
            </div>
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={setPage} 
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center glass-panel rounded-3xl p-8 max-w-md mx-auto mt-12">
            <SearchX size={48} className="text-zinc-600 mb-4" />
            <p className="text-2xl font-display font-black text-white mb-2">No matches found</p>
            <p className="text-zinc-400 text-sm max-w-sm mb-6">
              We couldn&apos;t find any {type === 'movie' ? 'movies' : 'shows'} matching all of your active filters. Try removing some to broaden your search.
            </p>
            <button 
              onClick={() => {
                setGenres([]);
                setYear('all');
                handleApplyFilters();
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
