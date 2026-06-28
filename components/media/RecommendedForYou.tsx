'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { HorizontalRow } from './HorizontalRow';
import { discoverMedia, getTopRatedAction, getHistorySimilarsAction } from '@/app/actions';
import { Media } from '@/types/tmdb';
import { RefreshCw } from 'lucide-react';

export function RecommendedForYou({ 
  mediaType = 'movie', 
  excludeIds = [] 
}: { 
  mediaType?: 'movie' | 'tv' | 'all';
  excludeIds?: number[];
}) {
  const { preferences } = usePreferences();
  const { history } = useWatchHistory();
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Store the full pool of fetched results so we can pull a random subset on refresh
  const fullPoolRef = useRef<Media[]>([]);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      if (preferences.preferredGenres.length === 0 && preferences.originalLanguage.length === 0 && history.length === 0) {
        setIsFallback(true);
        // Fallback to top rated
        const res = await getTopRatedAction(mediaType === 'all' ? 'movie' : mediaType);
        if (res && res.results) {
          const filtered = res.results.filter(item => !excludeIds.includes(item.id));
          fullPoolRef.current = filtered;
          setRecommendations(shuffleArray(filtered).slice(0, 30));
        }
        return;
      }

      setIsFallback(false);

      // --- PIPELINE 1: History Similarity ---
      let historyPicks: Media[] = [];
      if (history.length > 0) {
        const historyData = history.slice(0, 15).map(h => ({
          id: h.id,
          type: h.type,
          progress: h.progress || 0
        }));
        const historyRes = await getHistorySimilarsAction(historyData);
        if (Array.isArray(historyRes)) {
          historyPicks = historyRes as Media[];
        } else if (historyRes && (historyRes as any).results) {
          historyPicks = (historyRes as any).results as Media[];
        }
      }

      // --- PIPELINE 2: Genre/Lang Discovery ---
      const baseParams: Record<string, string> = {
          sort_by: 'popularity.desc',
          include_adult: preferences.adultContent ? 'true' : 'false',
          without_genres: '10766' // Exclude Indian/Global TV Soaps
      };

      if (preferences.preferredGenres.length > 0) {
        baseParams.with_genres = preferences.preferredGenres.join('|');
      }

      const langs = preferences.originalLanguage || [];
      const nativeLangs = langs.filter(l => l !== 'en');
      const hasEnglish = langs.includes('en');

      const fetchByType = async (type: 'movie' | 'tv') => {
        let typeResults: any[] = [];
        
        // Fetch up to 5 pages to get a pool of ~100 items
        const pgs = ['1', '2', '3', '4', '5', '6'];
        
        const shuffle = (arr: any[]) => {
          const newArr = [...arr];
          for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          }
          return newArr;
        };

        if (nativeLangs.length > 0 && hasEnglish) {
          const nativeDataPromises = pgs.map(page => discoverMedia(type, { ...baseParams, with_original_language: nativeLangs.join('|'), page }));
          const enDataPromises = pgs.map(page => discoverMedia(type, { ...baseParams, with_original_language: 'en', page }));
          
          const nativeDatas = await Promise.all(nativeDataPromises);
          const enDatas = await Promise.all(enDataPromises);
          
          let natives = shuffle(nativeDatas.flatMap(d => d.results || []));
          let engs = shuffle(enDatas.flatMap(d => d.results || []));

          // 70% regional, 30% global
          const finalArr = [
            ...natives.slice(0, 84),
            ...engs.slice(0, 36)
          ];
          
          typeResults = shuffle(finalArr);
        } else if (langs.length > 0) {
          const promises = pgs.map(page => discoverMedia(type, { ...baseParams, with_original_language: langs.join('|'), page }));
          const datas = await Promise.all(promises);
          let all = datas.flatMap(d => d.results || []);
          typeResults = shuffle(all).slice(0, 100);
        } else {
          const promises = pgs.map(page => discoverMedia(type, { ...baseParams, page }));
          const datas = await Promise.all(promises);
          let all = datas.flatMap(d => d.results || []);
          typeResults = shuffle(all).slice(0, 100);
        }
        return typeResults.map(item => ({ ...item, media_type: type }));
      };

      let discoveryPicks: any[] = [];
      if (mediaType === 'all') {
        const [movies, tvShows] = await Promise.all([fetchByType('movie'), fetchByType('tv')]);
        let mIdx = 0, tIdx = 0;
        while (mIdx < movies.length || tIdx < tvShows.length) {
          if (mIdx < movies.length) discoveryPicks.push(movies[mIdx++]);
          if (mIdx < movies.length) discoveryPicks.push(movies[mIdx++]);
          if (tIdx < tvShows.length) discoveryPicks.push(tvShows[tIdx++]);
        }
      } else {
        discoveryPicks = await fetchByType(mediaType);
      }

      // --- PIPELINE 3: Interleave & Deduplicate ---
      const combined = [];
      let hIdx = 0, dIdx = 0;
      while (hIdx < historyPicks.length || dIdx < discoveryPicks.length) {
        if (hIdx < historyPicks.length) combined.push(historyPicks[hIdx++]);
        if (dIdx < discoveryPicks.length) combined.push(discoveryPicks[dIdx++]);
      }

      const seen = new Set();
      // Exclude IDs that were already shown in Regional rows, or already in history (so we don't recommend what they watched)
      const historyIds = new Set(history.map(h => h.id.toString()));
      const excludeSet = new Set(excludeIds.map(id => id.toString()));

      const now = new Date().toISOString().split('T')[0];
        const uniqueResults = combined.filter(item => {
           // Ensure it's not unreleased
           if (item.media_type !== 'person') {
             const date = item.release_date || item.first_air_date;
             if (!date || date > now) return false;
           }
         const id = item.id.toString();
         if (seen.has(id)) return false;
         if (excludeSet.has(id)) return false;
         if (historyIds.has(id)) return false;
         seen.add(id);
         return true;
      });

      fullPoolRef.current = uniqueResults;
      
      // Select a random subset of 30 for this specific render
      if (uniqueResults.length > 0) {
        setRecommendations(shuffleArray(uniqueResults).slice(0, 30));
      } else {
        setRecommendations([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetchRecommendations();
  }, [preferences.preferredGenres, preferences.adultContent, preferences.originalLanguage, mediaType, excludeIds.join(',')]);

  // Handle local refresh (pick a new random 30 from the large pool)
  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (fullPoolRef.current.length > 0 && refreshTrigger > 0) {
      setRecommendations(shuffleArray(fullPoolRef.current).slice(0, 30));
    }
  }, [refreshTrigger]);


  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <HorizontalRow 
        title={isFallback ? "Critically Loved Movies" : "Recommended For You"} 
        subtitle={isFallback ? undefined : "Based on your taste"}
        actionNode={
          !isFallback && (
            <button 
              onClick={handleRefresh}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors group"
              aria-label="Refresh recommendations"
            >
              <RefreshCw size={14} className="group-active:rotate-180 transition-transform duration-500" />
            </button>
          )
        }
        items={recommendations} 
        seeAllHref={`/recommended/${mediaType}`}
      />
    </div>
  );
}
