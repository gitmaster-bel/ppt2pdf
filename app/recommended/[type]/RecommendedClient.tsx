'use client';
import { useEffect, useState } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { discoverMedia, getTopRatedAction, getHistorySimilarsAction } from '@/app/actions';
import { Media } from '@/types/tmdb';
import { MediaGrid } from '@/components/media/MediaGrid';
import { ThemedLoader } from '@/components/ui/ThemedLoader';

export function RecommendedClient({ mediaType }: { mediaType: 'movie' | 'tv' | 'all' }) {
  const { preferences } = usePreferences();
  const { history } = useWatchHistory();
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (preferences.preferredGenres.length === 0 && preferences.originalLanguage.length === 0 && history.length === 0) {
      if (!preferences.locationAutoDetected) {
         return;
      }
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        if (preferences.preferredGenres.length === 0 && preferences.originalLanguage.length === 0 && history.length === 0) {
          // Fallback to top rated
          const res = await getTopRatedAction(mediaType === 'all' ? 'movie' : mediaType);
          if (res && res.results) {
            setRecommendations(shuffleArray(res.results).slice(0, 60));
          }
          return;
        }

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
            include_adult: preferences.adultContent ? 'true' : 'false'
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
        // Exclude history IDs to not recommend already-watched content
        const historyIds = new Set(history.map(h => h.id.toString()));

        const now = new Date().toISOString().split('T')[0];
        const uniqueResults = combined.filter(item => {
           // Ensure it's not unreleased
           if (item.media_type !== 'person') {
             const date = item.release_date || item.first_air_date;
             if (!date || date > now) return false;
           }
           const id = item.id.toString();
           if (seen.has(id)) return false;
           if (historyIds.has(id)) return false;
           seen.add(id);
           return true;
        });

        if (uniqueResults.length > 0) {
          // Display up to 100 items on the full page
          setRecommendations(shuffleArray(uniqueResults).slice(0, 100));
        } else {
          setRecommendations([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [preferences.preferredGenres, preferences.adultContent, preferences.originalLanguage, preferences.locationAutoDetected, mediaType]);

  if (loading) {
    return <div className="mt-32"><ThemedLoader /></div>;
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center mt-32">
        <p className="text-6xl mb-4" style={{ filter: 'grayscale(1)', opacity: 0.3 }}>🎬</p>
        <p className="text-xl font-display font-bold text-white/30 mb-1">No recommendations found</p>
        <p className="text-sm text-white/20">Try adjusting your preferences or watching more content.</p>
      </div>
    );
  }

  const titles = {
    'movie': 'Recommended Movies',
    'tv': 'Recommended TV Shows',
    'all': 'Recommended For You'
  };

  return (
    <div className="w-full mt-32 max-w-[1800px] mx-auto min-h-screen">
      <MediaGrid title={titles[mediaType]} items={recommendations} />
    </div>
  );
}
